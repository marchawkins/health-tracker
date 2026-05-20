// MiniChart — reusable SVG line chart for weight, steps, sleep, etc.
//
// Usage:
//   MiniChart.render(containerId, entries, options)
//
//   entries: [{ date: 'YYYY-MM-DD', value: number }, ...]
//   options: {
//     unit:       string   — label shown in chart header (e.g. 'lbs', 'steps', 'hrs')
//     isDecimal:  bool     — true → 1 decimal place; false → rounded integer
//     minZero:    bool     — true → y-axis never goes below 0 (good for steps/sleep)
//     activeDays: number   — initial range in days (default 7)
//   }
//
// To add more range options in the future, add entries to RANGES below.

const MiniChart = (() => {

    const RANGES = [
        { days: 7,  label: '7d'  },
        { days: 14, label: '14d' },
        { days: 30, label: '30d' },
    ];

    // ── Public API ─────────────────────────────────────────────────────────

    function render(containerId, entries, options) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const opts = Object.assign(
            { unit: '', isDecimal: false, minZero: false, activeDays: 7 },
            options
        );

        container.innerHTML = buildHTML(entries, opts);

        container.querySelectorAll('.chart-range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.days, 10);
                container.querySelectorAll('.chart-range-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const wrap = container.querySelector('.chart-svg-wrap');
                if (wrap) wrap.innerHTML = buildSvg(entries, opts, days);
            });
        });
    }

    // ── Private helpers ────────────────────────────────────────────────────

    function buildHTML(entries, opts) {
        const btnHtml = RANGES.map(r =>
            `<button class="chart-range-btn${r.days === opts.activeDays ? ' active' : ''}" data-days="${r.days}">${r.label}</button>`
        ).join('');

        return `<div class="chart-range-row">${btnHtml}</div>` +
               `<div class="chart-svg-wrap">${buildSvg(entries, opts, opts.activeDays)}</div>`;
    }

    function buildSvg(entries, opts, days) {
        // ── 1. Bucket entries into one-per-day slots ───────────────────────
        const today = new Date();
        const points = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');

            const dayVals = entries
                .filter(e => e.date === dateStr)
                .map(e => e.value);

            const avg = dayVals.length
                ? dayVals.reduce((a, b) => a + b, 0) / dayVals.length
                : null;

            points.push({ dateStr, d, value: avg });
        }

        const hasData = points.some(p => p.value !== null);
        if (!hasData) {
            return '<p class="chart-empty">No data for this period.</p>';
        }

        // ── 2. Chart geometry ──────────────────────────────────────────────
        const W = 360, H = 160;
        const padL = 44, padR = 10, padT = 12, padB = 28;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;
        const bottom = padT + plotH;

        // ── 3. Y-axis range ────────────────────────────────────────────────
        const vals = points.filter(p => p.value !== null).map(p => p.value);
        const minVal  = Math.min(...vals);
        const maxVal  = Math.max(...vals);
        const valSpan = maxVal - minVal || Math.max(1, minVal * 0.1);
        const yPad    = valSpan * 0.18;
        const yMin    = opts.minZero ? Math.max(0, minVal - yPad) : minVal - yPad;
        const yMax    = maxVal + yPad;
        const yRange  = yMax - yMin;

        const n = points.length;
        function xPos(i) { return padL + (i / Math.max(n - 1, 1)) * plotW; }
        function yPos(v) { return padT + plotH - ((v - yMin) / yRange) * plotH; }

        // ── 4. Label formatters ────────────────────────────────────────────
        function fmtLabel(v) {
            if (opts.isDecimal) {
                return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            }
            // compact for large numbers (steps)
            if (Math.abs(v) >= 10000) return Math.round(v / 1000) + 'k';
            if (Math.abs(v) >= 1000)  return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            return Math.round(v).toString();
        }

        function fmtDate(d) {
            return (d.getMonth() + 1) + '/' + d.getDate();
        }

        // ── 5. Grid lines + y-labels ───────────────────────────────────────
        const gridCount = 4;
        let gridHtml = '';
        for (let i = 0; i <= gridCount; i++) {
            const v = yMin + (i / gridCount) * yRange;
            const y = yPos(v).toFixed(1);
            gridHtml +=
                `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" ` +
                `stroke="var(--kraft)" stroke-width="0.5" stroke-dasharray="2 3"/>` +
                `<text x="${padL - 5}" y="${(parseFloat(y) + 4).toFixed(1)}" ` +
                `text-anchor="end" font-size="9" fill="var(--brown-light)">${fmtLabel(v)}</text>`;
        }

        // ── 6. X-axis labels ───────────────────────────────────────────────
        const interval = days <= 7 ? 1 : days <= 14 ? 2 : 5;
        let xLabels = '';
        points.forEach((p, i) => {
            // always show first and last; show others on interval
            if (i !== 0 && i !== n - 1 && i % interval !== 0) return;
            const x = xPos(i).toFixed(1);
            xLabels +=
                `<text x="${x}" y="${H - 4}" text-anchor="middle" ` +
                `font-size="9" fill="var(--brown-light)">${fmtDate(p.d)}</text>`;
        });

        // ── 7. Line path — connect all non-null points continuously ──────
        // We skip days with no data but don't break the line, so the trend
        // reads as one continuous path even when days were missed.
        let pathD = '';
        points.forEach((p, i) => {
            if (p.value === null) return;
            const x = xPos(i).toFixed(1);
            const y = yPos(p.value).toFixed(1);
            pathD += pathD === '' ? `M ${x} ${y} ` : `L ${x} ${y} `;
        });

        // ── 8. Dots ────────────────────────────────────────────────────────
        let dotsHtml = '';
        points.forEach((p, i) => {
            if (p.value === null) return;
            const x = xPos(i).toFixed(1);
            const y = yPos(p.value).toFixed(1);
            dotsHtml +=
                `<circle cx="${x}" cy="${y}" r="3" ` +
                `fill="var(--terracotta)" stroke="var(--cream)" stroke-width="1.5"/>`;
        });

        // ── 9. Assemble SVG ────────────────────────────────────────────────
        return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ` +
               `aria-label="Trend chart" style="width:100%;display:block;overflow:visible;">` +
               gridHtml +
               xLabels +
               (pathD
                   ? `<path d="${pathD.trim()}" fill="none" stroke="var(--terracotta)" ` +
                     `stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
                   : '') +
               dotsHtml +
               `</svg>`;
    }

    return { render };
})();
