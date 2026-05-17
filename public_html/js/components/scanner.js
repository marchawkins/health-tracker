const BarcodeScanner = (() => {
    let activeControls = null;
    let timeoutId      = null;
    let overlay        = null;

    function buildOverlay() {
        const el = document.createElement('div');
        el.id = 'scanner-overlay';
        el.innerHTML =
            '<video id="scanner-video" autoplay muted playsinline></video>' +
            '<div id="scanner-reticle"><div id="scanner-line"></div></div>' +
            '<p id="scanner-hint">Point camera at a barcode</p>' +
            '<button type="button" id="scanner-cancel" class="btn btn-secondary">Cancel</button>';
        document.body.appendChild(el);
        return el;
    }

    function teardown() {
        if (timeoutId)      { clearTimeout(timeoutId); timeoutId = null; }
        if (activeControls) { try { activeControls.stop(); } catch (_) {} activeControls = null; }
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
            const reader = new ZXing.BrowserMultiFormatReader();
            activeControls = await reader.decodeFromConstraints(
                { video: { facingMode: { ideal: 'environment' } } },
                videoEl,
                (result) => { if (result) finish(result.getText()); }
            );
            // Handle cancel that arrived while camera was initialising
            if (finished && activeControls) {
                try { activeControls.stop(); } catch (_) {}
                activeControls = null;
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
        try {
            const resp = await fetch(
                'https://world.openfoodfacts.org/api/v0/product/' +
                encodeURIComponent(barcode) + '.json'
            );
            if (!resp.ok) return null;
            const data = await resp.json();
            if (data.status !== 1 || !data.product) return null;
            return mapProduct(data.product, barcode);
        } catch (_) {
            return null;
        }
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
