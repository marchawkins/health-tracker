// ── Shared utilities ─────────────────────────────────────────
// Loaded before all views; these globals are available everywhere.

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}
