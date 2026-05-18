function makeMetricLogView(cfg) {
    // cfg: { slug, label, unit, step, placeholder, inputmode, isDecimal }
    let defId = null;

    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function localDatetime(dateStr) {
        const d = new Date(), p = n => String(n).padStart(2, '0');
        return dateStr + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    function fmtDate(datetimeStr) {
        const d = new Date(datetimeStr.replace(' ', 'T'));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function fmtValue(v) {
        const n = parseFloat(v);
        if (isNaN(n)) return String(v);
        return cfg.isDecimal
            ? n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            : Math.round(n).toLocaleString('en-US');
    }

    async function loadDefinition() {
        if (defId !== null) return;
        try {
            const defs = await API.metrics.definitions();
            const def  = defs.find(d => d.slug === cfg.slug);
            if (def) defId = def.id;
        } catch (_) {}
    }

    async function render(container) {
        await loadDefinition();

        if (!defId) {
            container.innerHTML = '<div class="card"><p class="error">Metric definition not found for "' + escHtml(cfg.slug) + '".</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="card">
                <h2>Log ${escHtml(cfg.label)}</h2>
                <form id="ml-form" novalidate>
                    <div class="form-row">
                        <label for="ml-date">Date</label>
                        <input type="date" id="ml-date" name="logged_date"
                               value="${todayStr()}" required>
                    </div>
                    <div class="form-row">
                        <label for="ml-value">${escHtml(cfg.label)} *</label>
                        <input type="number" id="ml-value" name="value"
                               min="0" step="${cfg.step}"
                               placeholder="${cfg.placeholder}"
                               inputmode="${cfg.inputmode}" required>
                    </div>
                    <div class="form-row">
                        <label for="ml-notes">Notes</label>
                        <textarea id="ml-notes" name="notes" rows="2"
                                  placeholder="Optional"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        Log ${escHtml(cfg.label)}
                    </button>
                </form>
            </div>

            <div class="card">
                <h2>Recent Entries</h2>
                <div id="ml-list"><div class="loading">Loading&hellip;</div></div>
            </div>
        `;

        document.getElementById('ml-form').addEventListener('submit', handleSubmit);
        loadList();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn  = form.querySelector('[type="submit"]');

        if (!form.value.value) {
            Toast.error(cfg.label + ' is required');
            form.value.focus();
            return;
        }

        btn.disabled    = true;
        btn.textContent = 'Saving…';

        try {
            await API.metrics.create({
                metric_definition_id: defId,
                logged_at:            localDatetime(form.logged_date.value),
                value_numeric:        parseFloat(form.value.value),
                notes:                form.notes.value.trim() || null,
            });
            Toast.success(cfg.label + ' logged!');
            form.value.value       = '';
            form.notes.value       = '';
            form.logged_date.value = todayStr();
            loadList();
        } catch (err) {
            Toast.error('Failed to log: ' + err.message);
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Log ' + cfg.label;
        }
    }

    async function loadList() {
        const list = document.getElementById('ml-list');
        if (!list) return;
        try {
            const entries = await API.metrics.list(defId);
            renderList(list, entries);
        } catch (err) {
            list.innerHTML = `<p class="error">${escHtml(err.message)}</p>`;
        }
    }

    function renderList(container, entries) {
        if (!entries.length) {
            container.innerHTML = '<p class="text-muted">No entries yet.</p>';
            return;
        }
        container.innerHTML = entries.map(e => `
            <div class="weight-entry">
                <div class="weight-entry-info">
                    <span class="weight-val">${fmtValue(e.value_numeric)} ${escHtml(cfg.unit)}</span>
                    <span class="weight-date">${fmtDate(e.logged_at)}</span>
                    ${e.notes ? `<span class="weight-notes">${escHtml(e.notes)}</span>` : ''}
                </div>
                <button class="btn-delete" data-id="${e.id}" aria-label="Delete">&times;</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteEntry(parseInt(btn.dataset.id, 10)));
        });
    }

    async function deleteEntry(id) {
        if (!confirm('Delete this entry?')) return;
        try {
            await API.metrics.remove(id);
            Toast.success('Entry deleted');
            loadList();
        } catch (err) {
            Toast.error('Delete failed: ' + err.message);
        }
    }

    return { render };
}

const StepsLogView = makeMetricLogView({
    slug:        'steps',
    label:       'Steps',
    unit:        'steps',
    step:        '100',
    placeholder: '0',
    inputmode:   'numeric',
    isDecimal:   false,
});

const SleepLogView = makeMetricLogView({
    slug:        'sleep_hours',
    label:       'Sleep Hours',
    unit:        'hours',
    step:        '0.5',
    placeholder: '0.0',
    inputmode:   'decimal',
    isDecimal:   true,
});
