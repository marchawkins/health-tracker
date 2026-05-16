const FoodLogView = (() => {
    let listDate = todayStr();

    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function localNow() {
        const d = new Date(), p = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
               p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    function offsetDate(dateStr, days) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    }

    // Infer meal type from current local hour
    function guessMealType() {
        const h = new Date().getHours();
        if (h >= 5  && h < 10) return 'breakfast';
        if (h >= 10 && h < 14) return 'lunch';
        if (h >= 17 && h < 21) return 'dinner';
        return 'snack';
    }

    // Pull ?date= from the current hash (e.g. #food?date=2025-01-15)
    function dateFromHash() {
        const m = window.location.hash.match(/[?&]date=(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : todayStr();
    }

    // Pull ?edit= from the current hash (e.g. #food?edit=42)
    function editIdFromHash() {
        const m = window.location.hash.match(/[?&]edit=(\d+)/);
        return m ? parseInt(m[1], 10) : null;
    }

    function fmtShort(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function macroLine(e) {
        const p = [];
        if (e.protein_g) p.push('P:' + Math.round(e.protein_g) + 'g');
        if (e.carbs_g)   p.push('C:' + Math.round(e.carbs_g)   + 'g');
        if (e.fat_g)     p.push('F:' + Math.round(e.fat_g)     + 'g');
        return p.join(' &middot; ');
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async function render(container) {
        const editId = editIdFromHash();
        if (editId) {
            await renderEditMode(container, editId);
            return;
        }

        const initDate = dateFromHash();
        listDate = initDate;

        container.innerHTML = `
            <div class="card">
                <h2>Log Food</h2>
                <form id="food-form" novalidate>
                    <div class="form-row">
                        <label for="ff-date">Date</label>
                        <input type="date" id="ff-date" name="meal_date" value="${initDate}" required>
                    </div>
                    <div class="form-row">
                        <label for="ff-meal">Meal</label>
                        <select id="ff-meal" name="meal_type">
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="ff-name">Food Name *</label>
                        <input type="text" id="ff-name" name="food_name" placeholder="e.g. Chicken breast" required autocomplete="off">
                    </div>
                    <div class="form-row">
                        <label for="ff-serving">Serving Size</label>
                        <input type="text" id="ff-serving" name="serving_size" placeholder="e.g. 4 oz, 1 cup">
                    </div>
                    <div class="form-row">
                        <label for="ff-cal">Calories *</label>
                        <input type="number" id="ff-cal" name="calories" min="0" step="1" placeholder="0" required inputmode="decimal">
                    </div>
                    <div class="macro-inputs">
                        <div class="form-row">
                            <label for="ff-protein">Protein (g)</label>
                            <input type="number" id="ff-protein" name="protein_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="ff-carbs">Carbs (g)</label>
                            <input type="number" id="ff-carbs" name="carbs_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="ff-fat">Fat (g)</label>
                            <input type="number" id="ff-fat" name="fat_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="ff-fiber">Fiber (g)</label>
                            <input type="number" id="ff-fiber" name="fiber_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="ff-sodium">Sodium (mg)</label>
                        <input type="number" id="ff-sodium" name="sodium_mg" min="0" step="1" placeholder="0" inputmode="decimal">
                    </div>
                    <div class="form-row">
                        <label for="ff-notes">Notes</label>
                        <textarea id="ff-notes" name="notes" rows="2" placeholder="Optional"></textarea>
                    </div>
                    <input type="hidden" name="source" value="manual">
                    <button type="submit" class="btn btn-primary btn-block">Add Food</button>
                    <button type="button" id="btn-cancel" class="btn btn-secondary btn-block" style="margin-top:8px;">Cancel</button>
                </form>
            </div>

            <div class="card" hidden>
                <div class="section-header">
                    <h2>Log for <span id="fl-label">${fmtShort(initDate)}</span></h2>
                    <div class="date-nav-inline">
                        <button id="fl-prev" class="btn-icon">&larr;</button>
                        <input type="date" id="fl-date" value="${initDate}">
                        <button id="fl-today" class="btn-icon">Today</button>
                        <button id="fl-next" class="btn-icon">&rarr;</button>
                    </div>
                </div>
                <div id="food-list"><div class="loading">Loading&hellip;</div></div>
            </div>
        `;

        document.getElementById('ff-meal').value = guessMealType();

        document.getElementById('food-form').addEventListener('submit', handleSubmit);
        document.getElementById('btn-cancel').addEventListener('click', () => history.back());
        setupAutocomplete(document.getElementById('ff-name'));

        function updateListNav() {
            const isToday = listDate === todayStr();
            const nextBtn  = document.getElementById('fl-next');
            const todayBtn = document.getElementById('fl-today');
            if (nextBtn)  nextBtn.style.display  = isToday ? 'none' : '';
            if (todayBtn) todayBtn.style.display = isToday ? 'none' : '';
        }

        document.getElementById('fl-date').addEventListener('change', e => {
            listDate = e.target.value;
            updateListLabel();
            updateListNav();
            loadList();
        });
        document.getElementById('fl-prev').addEventListener('click', () => {
            listDate = offsetDate(listDate, -1);
            document.getElementById('fl-date').value = listDate;
            updateListLabel();
            updateListNav();
            loadList();
        });
        document.getElementById('fl-next').addEventListener('click', () => {
            listDate = offsetDate(listDate, 1);
            document.getElementById('fl-date').value = listDate;
            updateListLabel();
            updateListNav();
            loadList();
        });
        document.getElementById('fl-today').addEventListener('click', () => {
            listDate = todayStr();
            document.getElementById('fl-date').value = listDate;
            updateListLabel();
            updateListNav();
            loadList();
        });

        updateListNav();
        loadList();
    }

    function updateListLabel() {
        const el = document.getElementById('fl-label');
        if (el) el.textContent = fmtShort(listDate);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn  = form.querySelector('[type="submit"]');

        if (!form.food_name.value.trim()) {
            Toast.error('Food name is required');
            form.food_name.focus();
            return;
        }
        if (!form.calories.value) {
            Toast.error('Calories are required');
            form.calories.focus();
            return;
        }

        btn.disabled    = true;
        btn.textContent = 'Adding…';

        const data = {
            meal_date:    form.meal_date.value,
            meal_type:    form.meal_type.value,
            food_name:    form.food_name.value.trim(),
            serving_size: form.serving_size.value.trim() || null,
            calories:     parseFloat(form.calories.value),
            protein_g:    form.protein_g.value  ? parseFloat(form.protein_g.value)  : null,
            carbs_g:      form.carbs_g.value    ? parseFloat(form.carbs_g.value)    : null,
            fat_g:        form.fat_g.value      ? parseFloat(form.fat_g.value)      : null,
            fiber_g:      form.fiber_g.value    ? parseFloat(form.fiber_g.value)    : null,
            sodium_mg:    form.sodium_mg.value  ? parseFloat(form.sodium_mg.value)  : null,
            notes:        form.notes.value.trim() || null,
            source:       form.source ? form.source.value : 'manual',
            logged_at:    localNow(),
        };

        try {
            await API.foods.create(data);
            Toast.success('Food logged!');

            const savedDate = data.meal_date;
            form.reset();
            form.meal_date.value = savedDate; // keep date after reset
            form.meal_type.value = guessMealType();

            // Show the list for the date just logged
            listDate = savedDate;
            document.getElementById('fl-date').value = listDate;
            updateListLabel();
            loadList();
        } catch (err) {
            Toast.error('Failed to add: ' + err.message);
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Add Food';
        }
    }

    async function loadList() {
        const list = document.getElementById('food-list');
        if (!list) return;
        list.innerHTML = '<div class="loading">Loading&hellip;</div>';
        try {
            const entries = await API.foods.list(listDate);
            renderList(list, entries);
        } catch (err) {
            list.innerHTML = `<p class="error">${escHtml(err.message)}</p>`;
        }
    }

    function renderList(container, entries) {
        if (!entries.length) {
            container.innerHTML = '<p class="text-muted">Nothing logged for this day.</p>';
            return;
        }

        const totalCal = entries.reduce((sum, e) => sum + parseFloat(e.calories), 0);

        container.innerHTML = `
            <div class="list-total">Total: <strong>${Math.round(totalCal)} cal</strong></div>
            ${entries.map(e => `
                <div class="food-entry">
                    <div class="food-entry-info">
                        <span class="food-name">${escHtml(e.food_name)}</span>
                        <span class="food-meta">${e.meal_type}${e.serving_size ? ' &middot; ' + escHtml(e.serving_size) : ''}</span>
                        ${macroLine(e) ? `<span class="food-macros">${macroLine(e)}</span>` : ''}
                    </div>
                    <div class="food-entry-right">
                        <span class="food-cal">${Math.round(e.calories)}</span>
                        <button class="btn-delete" data-id="${e.id}" aria-label="Delete entry">&times;</button>
                    </div>
                </div>
            `).join('')}
        `;

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteEntry(parseInt(btn.dataset.id, 10)));
        });
    }

    async function deleteEntry(id) {
        if (!confirm('Delete this entry?')) return;
        try {
            await API.foods.remove(id);
            Toast.success('Entry deleted');
            loadList();
        } catch (err) {
            Toast.error('Delete failed: ' + err.message);
        }
    }

    async function renderEditMode(container, editId) {
        container.innerHTML = '<div class="card"><div class="loading">Loading&hellip;</div></div>';

        let entry;
        try {
            entry = await API.foods.get(editId);
        } catch (err) {
            container.innerHTML = `<div class="card"><p class="error">Failed to load entry: ${escHtml(err.message)}</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="card">
                <h2>Edit Food Entry</h2>
                <form id="food-form" novalidate>
                    <div class="form-row">
                        <label for="ff-date">Date</label>
                        <input type="date" id="ff-date" name="meal_date" value="${escHtml(entry.meal_date)}" required>
                    </div>
                    <div class="form-row">
                        <label for="ff-meal">Meal</label>
                        <select id="ff-meal" name="meal_type">
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label for="ff-name">Food Name *</label>
                        <input type="text" id="ff-name" name="food_name" value="${escHtml(entry.food_name)}" required autocomplete="off">
                    </div>
                    <div class="form-row">
                        <label for="ff-serving">Serving Size</label>
                        <input type="text" id="ff-serving" name="serving_size" value="${escHtml(entry.serving_size || '')}">
                    </div>
                    <div class="form-row">
                        <label for="ff-cal">Calories *</label>
                        <input type="number" id="ff-cal" name="calories" min="0" step="1" value="${entry.calories || ''}" required inputmode="decimal">
                    </div>
                    <div class="macro-inputs">
                        <div class="form-row">
                            <label for="ff-protein">Protein (g)</label>
                            <input type="number" id="ff-protein" name="protein_g" min="0" step="0.1" value="${entry.protein_g || ''}" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="ff-carbs">Carbs (g)</label>
                            <input type="number" id="ff-carbs" name="carbs_g" min="0" step="0.1" value="${entry.carbs_g || ''}" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="ff-fat">Fat (g)</label>
                            <input type="number" id="ff-fat" name="fat_g" min="0" step="0.1" value="${entry.fat_g || ''}" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="ff-fiber">Fiber (g)</label>
                            <input type="number" id="ff-fiber" name="fiber_g" min="0" step="0.1" value="${entry.fiber_g || ''}" inputmode="decimal">
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="ff-sodium">Sodium (mg)</label>
                        <input type="number" id="ff-sodium" name="sodium_mg" min="0" step="1" value="${entry.sodium_mg || ''}" inputmode="decimal">
                    </div>
                    <div class="form-row">
                        <label for="ff-notes">Notes</label>
                        <textarea id="ff-notes" name="notes" rows="2">${escHtml(entry.notes || '')}</textarea>
                    </div>
                    <input type="hidden" name="source" value="${escHtml(entry.source || 'manual')}">
                    <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
                    <button type="button" id="btn-delete-entry" class="btn btn-danger btn-block" style="margin-top:8px;">Delete Entry</button>
                    <button type="button" id="btn-cancel" class="btn btn-secondary btn-block" style="margin-top:8px;">Cancel</button>
                </form>
            </div>
        `;

        document.getElementById('ff-meal').value = entry.meal_type || 'snack';
        document.getElementById('btn-cancel').addEventListener('click', () => history.back());
        setupAutocomplete(document.getElementById('ff-name'));

        document.getElementById('food-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn  = form.querySelector('[type="submit"]');
            btn.disabled    = true;
            btn.textContent = 'Saving…';

            const data = {
                meal_date:    form.meal_date.value,
                meal_type:    form.meal_type.value,
                food_name:    form.food_name.value.trim(),
                serving_size: form.serving_size.value.trim() || null,
                calories:     parseFloat(form.calories.value),
                protein_g:    form.protein_g.value  ? parseFloat(form.protein_g.value)  : null,
                carbs_g:      form.carbs_g.value    ? parseFloat(form.carbs_g.value)    : null,
                fat_g:        form.fat_g.value      ? parseFloat(form.fat_g.value)      : null,
                fiber_g:      form.fiber_g.value    ? parseFloat(form.fiber_g.value)    : null,
                sodium_mg:    form.sodium_mg.value  ? parseFloat(form.sodium_mg.value)  : null,
                notes:        form.notes.value.trim() || null,
            };

            try {
                await API.foods.update(editId, data);
                Toast.success('Entry updated!');
                window.location.hash = '#dashboard';
            } catch (err) {
                Toast.error('Failed to save: ' + err.message);
                btn.disabled    = false;
                btn.textContent = 'Save Changes';
            }
        });

        document.getElementById('btn-delete-entry').addEventListener('click', async () => {
            if (!confirm('Delete this entry?')) return;
            try {
                await API.foods.remove(editId);
                Toast.success('Entry deleted');
                window.location.hash = '#dashboard';
            } catch (err) {
                Toast.error('Delete failed: ' + err.message);
            }
        });
    }

    function setupAutocomplete(inputEl) {
        let gen          = 0;
        let localTimer   = null;
        let usdaTimer    = null;
        let offTimer     = null;
        let dropdownEl   = null;
        let localResults = [];
        let usdaResults  = [];
        let offResults   = [];
        let offPage      = 0;
        let offFetching  = false;
        let offDone      = false;

        const OFF_PAGE_SIZE = 20;
        const wrapper = inputEl.closest('.form-row');
        wrapper.style.position = 'relative';

        function createItem(item) {
            const li = document.createElement('li');
            li.className = 'autocomplete-item';
            const metaParts = [];
            if (item.calories != null) metaParts.push(Math.round(item.calories) + ' cal');
            if (item.serving_size) metaParts.push(escHtml(item.serving_size));
            li.innerHTML =
                '<span class="ac-icon">' + (item._icon || '🔍') + '</span>' +
                '<span class="ac-content">' +
                    '<span class="ac-name">' + escHtml(item.food_name) + '</span>' +
                    (item.brand ? '<span class="ac-brand">' + escHtml(item.brand) + '</span>' : '') +
                    (metaParts.length ? '<span class="ac-meta">' + metaParts.join(' &middot; ') + '</span>' : '') +
                '</span>';
            li.addEventListener('mousedown', e => e.preventDefault());
            li.addEventListener('click', () => { fillFromSuggestion(item); removeDropdown(); });
            return li;
        }

        function createFooterEl() {
            const li = document.createElement('li');
            li.className = 'ac-footer';
            li.addEventListener('mousedown', e => e.preventDefault());
            if (offFetching) {
                const spinner = document.createElement('span');
                spinner.className = 'ac-spinner';
                li.appendChild(spinner);
            } else if (offDone) {
                li.classList.add('ac-end');
                li.textContent = 'No more results';
            }
            return li;
        }

        function buildDropdown() {
            const allItems = [
                ...localResults.map(r => ({ ...r, _icon: '🕐' })),
                ...usdaResults,
                ...offResults,
            ];
            const hasContent = allItems.length > 0 || offFetching;

            if (!hasContent) { removeDropdown(); return; }

            removeDropdown();
            dropdownEl = document.createElement('ul');
            dropdownEl.className = 'autocomplete-list';

            allItems.forEach(item => dropdownEl.appendChild(createItem(item)));
            if (offFetching || offDone) dropdownEl.appendChild(createFooterEl());

            dropdownEl.addEventListener('scroll', onDropdownScroll);
            wrapper.appendChild(dropdownEl);
        }

        function refreshFooter() {
            if (!dropdownEl) return;
            const old = dropdownEl.querySelector('.ac-footer');
            if (old) old.remove();
            if (offFetching || offDone) dropdownEl.appendChild(createFooterEl());
        }

        function appendItems(newItems) {
            if (!dropdownEl) return;
            const old = dropdownEl.querySelector('.ac-footer');
            if (old) old.remove();
            newItems.forEach(item => dropdownEl.appendChild(createItem(item)));
            if (offFetching || offDone) dropdownEl.appendChild(createFooterEl());
        }

        function removeDropdown() {
            if (dropdownEl) { dropdownEl.remove(); dropdownEl = null; }
        }

        function onDropdownScroll() {
            if (!dropdownEl || offFetching || offDone) return;
            if (dropdownEl.scrollTop + dropdownEl.clientHeight >= dropdownEl.scrollHeight - 60) {
                fetchNextOffPage();
            }
        }

        async function fetchNextOffPage() {
            if (offFetching || offDone) return;
            offFetching    = true;
            const myGen    = gen;
            const nextPage = offPage + 1;
            const q        = inputEl.value.trim();

            refreshFooter();

            try {
                const data = await API.OFF.search(q, nextPage);
                if (gen !== myGen) return;

                const products = (data.products || []).filter(p => p.product_name);
                offPage     = nextPage;
                offFetching = false;
                if (products.length < OFF_PAGE_SIZE) offDone = true;

                const newItems = products.map(mapOffProduct);
                offResults = offResults.concat(newItems);
                appendItems(newItems);
            } catch (_) {
                if (gen !== myGen) return;
                offFetching = false;
                offDone     = true;
                refreshFooter();
            }
        }

        function mapOffProduct(p) {
            const n = p.nutriments || {};
            return {
                food_name:    p.product_name,
                brand:        p.brands        || null,
                serving_size: p.serving_size  || null,
                calories:     n['energy-kcal_100g']  != null ? Math.round(parseFloat(n['energy-kcal_100g']))  : null,
                protein_g:    n['proteins_100g']      != null ? parseFloat(n['proteins_100g'])                 : null,
                carbs_g:      n['carbohydrates_100g'] != null ? parseFloat(n['carbohydrates_100g'])            : null,
                fat_g:        n['fat_100g']           != null ? parseFloat(n['fat_100g'])                      : null,
                source:       'openfoodfacts',
                _icon:        '🔍',
            };
        }

        function mapUsdaFood(f) {
            const nutrients = {};
            (f.foodNutrients || []).forEach(n => { nutrients[n.nutrientNumber] = n.value; });
            const size = f.servingSize
                ? (parseFloat(f.servingSize) + (f.servingSizeUnit || 'g').toLowerCase())
                : null;
            return {
                food_name:    toTitleCase(f.description || ''),
                brand:        null,
                serving_size: size,
                calories:     nutrients['208'] != null ? Math.round(nutrients['208'])  : null,
                protein_g:    nutrients['203'] != null ? parseFloat(nutrients['203'])  : null,
                carbs_g:      nutrients['205'] != null ? parseFloat(nutrients['205'])  : null,
                fat_g:        nutrients['204'] != null ? parseFloat(nutrients['204'])  : null,
                fiber_g:      nutrients['291'] != null ? parseFloat(nutrients['291'])  : null,
                sodium_mg:    nutrients['307'] != null ? Math.round(nutrients['307'])  : null,
                source:       'usda',
                _icon:        '🌾',
            };
        }

        function toTitleCase(str) {
            return str.toLowerCase().replace(/(?:^|[\s,;(])\S/g, c => c.toUpperCase());
        }

        function fillFromSuggestion(item) {
            const form = inputEl.closest('form');
            inputEl.value           = item.food_name;
            form.serving_size.value = item.serving_size != null ? item.serving_size : '';
            form.calories.value     = item.calories     != null ? item.calories     : '';
            form.protein_g.value    = item.protein_g    != null ? item.protein_g    : '';
            form.carbs_g.value      = item.carbs_g      != null ? item.carbs_g      : '';
            form.fat_g.value        = item.fat_g        != null ? item.fat_g        : '';
            if (form.fiber_g)   form.fiber_g.value   = item.fiber_g   != null ? item.fiber_g   : '';
            if (form.sodium_mg) form.sodium_mg.value = item.sodium_mg != null ? item.sodium_mg : '';
            if (form.source) form.source.value = item.source || 'manual';
            form.calories.focus();
        }

        inputEl.addEventListener('input', () => {
            clearTimeout(localTimer);
            clearTimeout(usdaTimer);
            clearTimeout(offTimer);
            const myGen = ++gen;
            const q     = inputEl.value.trim();

            if (q.length < 2) {
                localResults = [];
                usdaResults  = [];
                offResults   = [];
                offPage      = 0;
                offFetching  = false;
                offDone      = false;
                removeDropdown();
                return;
            }

            if (q.length < 4) {
                usdaResults = [];
                offResults  = [];
                offPage     = 0;
                offFetching = false;
                offDone     = false;
            }

            // Local history: 2+ chars, 200ms debounce, max 3 results
            localTimer = setTimeout(async () => {
                try { localResults = await API.foods.autocomplete(q); }
                catch (_) { localResults = []; }
                if (gen === myGen) buildDropdown();
            }, 200);

            if (q.length >= 4) {
                // USDA: server-side proxy, 500ms debounce
                usdaTimer = setTimeout(async () => {
                    if (gen !== myGen) return;
                    try {
                        const data = await API.usda.search(q);
                        if (gen !== myGen) return;
                        usdaResults = (data.foods || []).map(mapUsdaFood);
                    } catch (_) {
                        if (gen !== myGen) return;
                        usdaResults = [];
                    }
                    buildDropdown();
                }, 500);

                // OFF: 500ms debounce, page 1 — resets all OFF state
                offTimer = setTimeout(async () => {
                    if (gen !== myGen) return;

                    offResults  = [];
                    offPage     = 0;
                    offFetching = true;
                    offDone     = false;
                    buildDropdown(); // show local results + spinner while fetching

                    try {
                        const data = await API.OFF.search(q, 1);
                        if (gen !== myGen) return;

                        const products = (data.products || []).filter(p => p.product_name);
                        offPage     = 1;
                        offFetching = false;
                        if (products.length < OFF_PAGE_SIZE) offDone = true;

                        offResults = products.map(mapOffProduct);
                        buildDropdown();
                    } catch (_) {
                        if (gen !== myGen) return;
                        offFetching = false;
                        offDone     = true;
                        buildDropdown();
                    }
                }, 500);
            }
        });

        inputEl.addEventListener('blur', () => setTimeout(removeDropdown, 150));

        function outsideClickHandler(e) {
            if (!document.contains(inputEl)) {
                document.removeEventListener('click', outsideClickHandler);
                return;
            }
            if (!wrapper.contains(e.target)) removeDropdown();
        }
        document.addEventListener('click', outsideClickHandler);
    }

    return { render };
})();
