const BarcodeScanner = (() => {
    let activeControls = null;
    let activeReader   = null;
    let activeStream   = null;
    let timeoutId      = null;
    let overlay        = null;

    function buildOverlay() {
        const el = document.createElement('div');
        el.id = 'scanner-overlay';
        el.innerHTML =
            '<video id="scanner-video" autoplay muted playsinline></video>' +
            '<button type="button" id="scanner-torch" hidden aria-label="Toggle flash">' +
                '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="currentColor"/>' +
                '</svg>' +
            '</button>' +
            '<div id="scanner-reticle"><div id="scanner-line"></div></div>' +
            '<p id="scanner-hint">Point camera at a barcode</p>' +
            '<button type="button" id="scanner-cancel" class="btn btn-secondary">Cancel</button>';
        document.body.appendChild(el);
        return el;
    }

    function teardown() {
        if (timeoutId)      { clearTimeout(timeoutId); timeoutId = null; }
        if (activeControls) { try { activeControls.stop(); } catch (_) {} activeControls = null; }
        if (activeReader)   { try { activeReader.reset(); } catch (_) {} activeReader = null; }
        if (activeStream)   { try { activeStream.getTracks().forEach(t => t.stop()); } catch (_) {} activeStream = null; }
        if (overlay)        { overlay.remove(); overlay = null; }
    }

    async function open(callback) {
        if (overlay) return;

        if (!window.ZXing) {
            Toast.error('Scanner not available — please reload the page');
            return;
        }

        let finished = false;
        function finish(barcode) {
            if (finished) return;
            finished = true;
            teardown();
            callback(barcode);
        }

        overlay = buildOverlay();
        const videoEl = document.getElementById('scanner-video');

        document.getElementById('scanner-cancel').addEventListener('click', () => finish(null));

        timeoutId = setTimeout(() => {
            if (!finished) {
                finish(null);
                Toast.info('Scan timed out — try again', 2000);
            }
        }, 30000);

        try {
            // Limit to formats found on food packaging — skipping QR, DataMatrix,
            // Aztec, PDF417 etc. makes every frame decode much faster and more reliable.
            const hints = new Map();
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                ZXing.BarcodeFormat.EAN_13,
                ZXing.BarcodeFormat.EAN_8,
                ZXing.BarcodeFormat.UPC_A,
                ZXing.BarcodeFormat.UPC_E,
                ZXing.BarcodeFormat.CODE_128,
                ZXing.BarcodeFormat.CODE_39,
            ]);
            // Try harder within each frame before giving up on it
            hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

            const reader = new ZXing.BrowserMultiFormatReader(hints);
            activeReader   = reader;
            activeControls = await reader.decodeFromConstraints(
                {
                    video: {
                        facingMode: { ideal: 'environment' },
                        width:      { ideal: 1920, min: 640 },
                        height:     { ideal: 1080, min: 480 },
                    }
                },
                videoEl,
                (result) => { if (result) finish(result.getText()); }
            );
            // Save stream reference now that the camera is live
            if (videoEl.srcObject) {
                activeStream = videoEl.srcObject;
                const track = activeStream.getVideoTracks()[0];
                if (track) {
                    const caps = track.getCapabilities ? track.getCapabilities() : {};

                    // Ask for continuous autofocus (helps on iOS PWA)
                    try {
                        if (caps.focusMode && caps.focusMode.includes('continuous')) {
                            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                        }
                    } catch (_) { /* not supported on all devices, safe to ignore */ }

                    // Show torch button only when the device actually has a torch
                    if (caps.torch) {
                        const torchBtn = document.getElementById('scanner-torch');
                        if (torchBtn) {
                            torchBtn.hidden = false;
                            let torchOn = false;
                            torchBtn.addEventListener('click', async () => {
                                torchOn = !torchOn;
                                try {
                                    await track.applyConstraints({ advanced: [{ torch: torchOn }] });
                                    torchBtn.classList.toggle('torch-on', torchOn);
                                } catch (_) {
                                    torchOn = !torchOn; // revert on failure
                                }
                            });
                        }
                    }
                }
            }
            // Handle cancel/timeout that arrived while camera was initialising
            if (finished) {
                if (activeControls) { try { activeControls.stop(); } catch (_) {} activeControls = null; }
                if (activeStream)   { try { activeStream.getTracks().forEach(t => t.stop()); } catch (_) {} activeStream = null; }
            }
        } catch (err) {
            if (!finished) {
                const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
                denied
                    ? Toast.error('Camera access denied — allow camera access in your browser settings', 5000)
                    : Toast.error('Could not start camera: ' + err.message);
                finish(null);
            }
        }
    }

    async function lookupBarcode(barcode) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const data = await API.OFF.barcode(barcode);
                if (data.status !== 1 || !data.product) return null;
                return mapProduct(data.product, barcode);
            } catch (_) {
                if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
            }
        }
        return null;
    }

    function mapProduct(p, barcode) {
        const n = p.nutriments || {};
        function nutVal(key) {
            const sv = n[key + '_serving'];
            if (sv != null) return parseFloat(sv);
            const hg = n[key + '_100g'];
            return hg != null ? parseFloat(hg) : null;
        }
        let kcal = nutVal('energy-kcal');
        if (kcal == null) {
            const kj = nutVal('energy');
            if (kj != null) kcal = kj / 4.184;
        }
        const sod = nutVal('sodium');
        return {
            food_name:    (p.product_name || '').trim(),
            brand:        p.brands ? p.brands.split(',')[0].trim() : null,
            serving_size: p.serving_size || null,
            calories:     kcal != null ? Math.round(kcal)        : null,
            protein_g:    nutVal('proteins'),
            carbs_g:      nutVal('carbohydrates'),
            fat_g:        nutVal('fat'),
            fiber_g:      nutVal('fiber'),
            sodium_mg:    sod  != null ? Math.round(sod * 1000)  : null,
            source:       'openfoodfacts',
            off_barcode:  barcode,
        };
    }

    return { open, lookupBarcode };
})();
