const FoodLogView = (() => {
    let listDate = todayStr();

    function todayStr() {
        return new Date().toISOString().slice(0, 10);
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
                    <button type="submit" class="btn btn-primary btn-block">Add Food</button>
                </form>
            </div>

            <div class="card">
                <div class="section-header">
                    <h2>Log for <span id="fl-label">${fmtShort(initDate)}</span></h2>
                    <div class="date-nav-inline">
                        <button id="fl-prev" class="btn-icon">&larr;</button>
                        <input type="date" id="fl-date" value="${initDate}">
                        <button id="fl-next" class="btn-icon">&rarr;</button>
                    </div>
                </div>
                <div id="food-list"><div class="loading">Loading&hellip;</div></div>
            </div>
        `;

        document.getElementById('ff-meal').value = guessMealType();

        document.getElementById('food-form').addEventListener('submit', handleSubmit);

        document.getElementById('fl-date').addEventListener('change', e => {
            listDate = e.target.value;
            updateListLabel();
            loadList();
        });
        document.getElementById('fl-prev').addEventListener('click', () => {
            listDate = offsetDate(listDate, -1);
            document.getElementById('fl-date').value = listDate;
            updateListLabel();
            loadList();
        });
        document.getElementById('fl-next').addEventListener('click', () => {
            listDate = offsetDate(listDate, 1);
            document.getElementById('fl-date').value = listDate;
            updateListLabel();
            loadList();
        });

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

    return { render };
})();
