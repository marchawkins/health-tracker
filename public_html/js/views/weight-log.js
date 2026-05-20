const WeightLogView = (() => {
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
        // datetimeStr is "YYYY-MM-DD HH:MM:SS" from MySQL
        const d = new Date(datetimeStr.replace(' ', 'T'));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    async function render(container) {
        container.innerHTML = `
            <div class="card">
                <h2>Log Weight</h2>
                <form id="weight-form" novalidate>
                    <div class="form-row">
                        <label for="wf-date">Date</label>
                        <input type="date" id="wf-date" name="logged_date" value="${todayStr()}" required>
                    </div>
                    <div class="form-row-inline form-row">
                        <div class="form-col">
                            <label for="wf-weight">Weight *</label>
                            <input type="number" id="wf-weight" name="weight" min="0" step="0.1"
                                   placeholder="0.0" required inputmode="decimal">
                        </div>
                        <div class="form-col-small">
                            <label for="wf-unit">Unit</label>
                            <select id="wf-unit" name="unit">
                                <option value="lbs" selected>lbs</option>
                                <option value="kg">kg</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="wf-notes">Notes</label>
                        <textarea id="wf-notes" name="notes" rows="2" placeholder="Optional"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Log Weight</button>
                </form>
            </div>

            <div class="card">
                <h2>Recent Entries</h2>
                <div id="weight-list"><div class="loading">Loading&hellip;</div></div>
            </div>
        `;

        document.getElementById('weight-form').addEventListener('submit', handleSubmit);
        loadList();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn  = form.querySelector('[type="submit"]');

        if (!form.weight.value) {
            Toast.error('Weight is required');
            form.weight.focus();
            return;
        }

        btn.disabled    = true;
        btn.textContent = 'Saving…';

        const data = {
            logged_at: localDatetime(form.logged_date.value),
            weight:    parseFloat(form.weight.value),
            unit:      form.unit.value,
            notes:     form.notes.value.trim() || null,
        };

        try {
            await API.weight.create(data);
            Toast.success('Weight logged!');
            form.reset();
            form.logged_date.value = todayStr();
            form.unit.value        = 'lbs';
            loadList();
        } catch (err) {
            Toast.error('Failed to log: ' + err.message);
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Log Weight';
        }
    }

    async function loadList() {
        const list = document.getElementById('weight-list');
        if (!list) return;
        try {
            const entries = await API.weight.list(30);
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
                    <span class="weight-val">${e.weight} ${e.unit}</span>
                    <span class="weight-date">${fmtDate(e.logged_at)}</span>
                    ${e.notes ? `<span class="weight-notes">${escHtml(e.notes)}</span>` : ''}
                </div>
                <button class="btn-delete" data-id="${e.id}" aria-label="Delete entry">&times;</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteEntry(parseInt(btn.dataset.id, 10)));
        });
    }

    async function deleteEntry(id) {
        if (!confirm('Delete this entry?')) return;
        try {
            await API.weight.remove(id);
            Toast.success('Entry deleted');
            loadList();
        } catch (err) {
            Toast.error('Delete failed: ' + err.message);
        }
    }

    return { render };
})();
