// ── Shared utilities ──────────────────────────────────────────────────────────
// Loaded before all views so every module can call escHtml() directly.

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}
