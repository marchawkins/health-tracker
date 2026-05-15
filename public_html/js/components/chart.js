const WeightChart = (() => {
    function draw(canvas, entries) {
        const dpr = window.devicePixelRatio || 1;
        const W   = canvas.offsetWidth  || 300;
        const H   = 200;

        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.height = H + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const pad = { top: 20, right: 16, bottom: 36, left: 48 };

        ctx.clearRect(0, 0, W, H);

        if (!entries || entries.length < 2) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '13px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Log at least 2 weights to see a trend', W / 2, H / 2);
            return;
        }

        // Normalise to lbs for a consistent axis
        const points = entries.map(e => ({
            date: e.log_date,
            val:  e.unit === 'kg' ? parseFloat(e.weight) * 2.20462 : parseFloat(e.weight),
        }));

        const vals  = points.map(p => p.val);
        const minV  = Math.min(...vals);
        const maxV  = Math.max(...vals);
        const range = maxV - minV || 1;
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top  - pad.bottom;

        const toX = (i) => pad.left + (i / (points.length - 1)) * plotW;
        const toY = (v) => pad.top  + plotH - ((v - minV) / range) * plotH;

        // Horizontal grid lines
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const v = minV + (range * i / gridSteps);
            const y = toY(v);

            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();

            ctx.fillStyle  = '#6b7280';
            ctx.font       = '11px -apple-system, sans-serif';
            ctx.textAlign  = 'right';
            ctx.fillText(v.toFixed(1), pad.left - 6, y + 4);
        }

        // Trend line
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth   = 2;
        points.forEach((p, i) => {
            i === 0 ? ctx.moveTo(toX(i), toY(p.val)) : ctx.lineTo(toX(i), toY(p.val));
        });
        ctx.stroke();

        // Data points
        ctx.fillStyle = '#2563eb';
        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(toX(i), toY(p.val), 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // X-axis date labels: first, middle, last
        ctx.fillStyle = '#6b7280';
        ctx.font      = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        [0, Math.floor((points.length - 1) / 2), points.length - 1].forEach(i => {
            const d   = new Date(points[i].date + 'T00:00:00');
            const lbl = (d.getMonth() + 1) + '/' + d.getDate();
            ctx.fillText(lbl, toX(i), H - pad.bottom + 16);
        });
    }

    return { draw };
})();
