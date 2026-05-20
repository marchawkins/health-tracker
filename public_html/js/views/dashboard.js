const DashboardView = (() => {
    let currentDate = todayStr();

    function todayStr() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function offsetDate(dateStr, days) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    }

    function fmtDateLabel(dateStr) {
        const today = todayStr();
        const yest  = offsetDate(today, -1);
        if (dateStr === today) return 'Today';
        if (dateStr === yest)  return 'Yesterday';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    async function render(container) {
        currentDate = todayStr();

        container.innerHTML = `
            <div class="date-nav">
                <button id="dash-prev" class="btn-icon">&larr;</button>
                <div class="date-display">
                    <span id="dash-date-label" class="date-display-label">${fmtDateLabel(currentDate)}</span>
                    <button type="button" class="btn-cal" aria-label="Pick date" title="Pick date">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/>
                            <path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/>
                            <path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                            <circle cx="8" cy="14" r="1.2" fill="currentColor"/>
                            <circle cx="12" cy="14" r="1.2" fill="currentColor"/>
                            <circle cx="16" cy="14" r="1.2" fill="currentColor"/>
                        </svg>
                        <input type="date" id="dash-date" value="${currentDate}" aria-label="Select date">
                    </button>
                </div>
                <div class="date-nav-right">
                    <button id="dash-today" class="btn-icon">Today</button>
                    <button id="dash-next" class="btn-icon">&rarr;</button>
                </div>
            </div>
            <div id="dash-content"><div class="loading">Loading&hellip;</div></div>
        `;

        function updateNav() {
            const isToday = currentDate === todayStr();
            document.getElementById('dash-next').style.display  = isToday ? 'none' : '';
            document.getElementById('dash-today').style.display = isToday ? 'none' : '';
        }

        function updateDateLabel() {
            const el = document.getElementById('dash-date-label');
            if (el) el.textContent = fmtDateLabel(currentDate);
        }

        document.getElementById('dash-date').addEventListener('change', e => {
            currentDate = e.target.value;
            updateDateLabel();
            updateNav();
            loadData();
        });
        document.getElementById('dash-prev').addEventListener('click', () => {
            currentDate = offsetDate(currentDate, -1);
            document.getElementById('dash-date').value = currentDate;
            updateDateLabel();
            updateNav();
            loadData();
        });
        document.getElementById('dash-next').addEventListener('click', () => {
            currentDate = offsetDate(currentDate, 1);
            document.getElementById('dash-date').value = currentDate;
            updateDateLabel();
            updateNav();
            loadData();
        });
        document.getElementById('dash-today').addEventListener('click', () => {
            currentDate = todayStr();
            document.getElementById('dash-date').value = currentDate;
            updateDateLabel();
            updateNav();
            loadData();
        });

        updateNav();
        loadData();
    }

    async function loadData() {
        const content = document.getElementById('dash-content');
        if (!content) return;
        content.innerHTML = '<div class="loading">Loading&hellip;</div>';
        try {
            const data = await API.dashboard.get(currentDate);
            renderContent(content, data);
        } catch (e) {
            content.innerHTML = `<p class="error">Failed to load: ${escHtml(e.message)}</p>`;
        }
    }

    // Returns a thin progress bar for goal tracking.
    // dir '<' = stay-under goal; going over turns the bar rust-red.
    // slim = true uses a 4px bar for the stats grid; false (default) = 8px hero bar.
    function progressBar(val, goalVal, dir, slim) {
        if (goalVal == null || parseFloat(goalVal) <= 0) return '';
        const raw  = parseFloat(val) || 0;
        const goal = parseFloat(goalVal);
        const pct  = Math.min(100, (raw / goal) * 100);
        const over = raw > goal && dir === '<';
        const fillCls  = over ? ' over' : '';
        const trackCls = slim ? ' stat-bar' : '';
        return '<div class="progress-bar-track' + trackCls + '">' +
               '<div class="progress-bar-fill' + fillCls + '" style="width:' + pct.toFixed(1) + '%"></div>' +
               '</div>';
    }

    // Hero calorie display — large focal number replacing the plain date h2.
    function heroStat(val, goalVal, dateLabel) {
        const calFmt  = Math.round(parseFloat(val) || 0).toLocaleString('en-US');
        const bar     = progressBar(val, goalVal, '<');
        const goalHtml = goalVal != null
            ? '<span class="hero-cal-goal">&lt;&nbsp;' +
              Math.round(goalVal).toLocaleString('en-US') + ' cal goal</span>'
            : '';
        return '<div class="hero-stat">' +
                   '<div class="hero-label">' + escHtml(dateLabel) + '</div>' +
                   '<div class="hero-cal-row">' +
                       '<span class="hero-cal-val">' + calFmt + '</span>' +
                       '<div class="hero-cal-meta">' +
                           '<span class="hero-cal-unit">cal</span>' +
                           goalHtml +
                       '</div>' +
                   '</div>' +
                   bar +
               '</div>';
    }

    // dir: '<' (stay-under) or '>' (hit-at-least), shown next to the goal value.
    // precision: decimal places for both the current value and goal (default 0).
    function goalStat(val, unit, label, goalVal, dir, precision) {
        precision = precision || 0;
        const fmt = v => (parseFloat(v) || 0).toLocaleString('en-US', {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        });
        const dirHtml = dir === '<' ? '&lt;&nbsp;' : dir === '>' ? '&gt;&nbsp;' : '';
        const v   = fmt(val);
        const g   = goalVal != null
            ? ' <span class="goal-target">(' + dirHtml + fmt(goalVal) + (label ? unit : '') + ')</span>'
            : '';
        const bar = progressBar(val, goalVal, dir, true);
        if (label) {
            return '<div class="goal-stat">' +
                '<span class="goal-val">' + v + '</span>' +
                '<span class="goal-unit">' + unit + ' ' + label + '</span>' +
                g + bar + '</div>';
        }
        return '<div class="goal-stat">' +
            '<span class="goal-val">' + v + '</span>' +
            '<span class="goal-unit"> ' + unit + '</span>' +
            g + bar + '</div>';
    }

    function guessMealType() {
        const h = new Date().getHours();
        if (h >= 5  && h < 10) return 'breakfast';
        if (h >= 10 && h < 14) return 'lunch';
        if (h >= 17 && h < 21) return 'dinner';
        return 'snack';
    }

    function localNow() {
        const d = new Date(), p = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
               p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    async function quickLog(type, ql) {
        const btnId = type === 'water' ? 'ql-water' : 'ql-custom';
        const btn   = document.getElementById(btnId);
        if (btn) btn.disabled = true;

        const loggedAt = localNow();
        const dateStr  = loggedAt.slice(0, 10);
        const mealType = guessMealType();

        let entry;
        if (type === 'water') {
            entry = {
                meal_date:    dateStr,
                meal_type:    mealType,
                food_name:    'Water',
                serving_size: '12oz',
                calories:     0,
                logged_at:    loggedAt,
            };
        } else {
            entry = {
                meal_date:    dateStr,
                meal_type:    mealType,
                food_name:    (ql && ql.name)         || 'Coffee with Cream',
                serving_size: (ql && ql.serving_size) || '12oz',
                calories:     (ql && ql.calories  != null) ? parseFloat(ql.calories)  : 60,
                protein_g:    (ql && ql.protein_g != null) ? parseFloat(ql.protein_g) : 1,
                carbs_g:      (ql && ql.carbs_g   != null) ? parseFloat(ql.carbs_g)   : 4,
                fat_g:        (ql && ql.fat_g     != null) ? parseFloat(ql.fat_g)     : 4,
                logged_at:    loggedAt,
            };
        }

        try {
            await API.foods.create(entry);
            const label = type === 'water'
                ? '💧 Water logged'
                : escHtml((ql && ql.name) || '☕ Coffee') + ' logged';
            Toast.success(label, 2000);
            loadData();
        } catch (err) {
            Toast.error('Failed to log: ' + err.message);
            if (btn) btn.disabled = false;
        }
    }

    function waterLine(w) {
        const consumed  = Math.round(w.consumed_oz);
        const goal      = Math.round(w.goal_oz);
        if (consumed >= goal) return '<p class="water-tracker">Goal reached! 🎉</p>';
        const remaining = goal - consumed;
        return `<p class="water-tracker">${consumed}oz consumed &middot; ${remaining}oz remaining</p>`;
    }

    function renderContent(container, data) {
        const s         = data.food_summary;
        const goals     = data.goals     || null;
        const ql        = data.quick_log || null;
        const water     = data.water     || { consumed_oz: 0, goal_oz: 64 };
        const dateLabel = fmtDateLabel(data.date);
        const customLabel = escHtml((ql && ql.name) || '☕ Coffee');

        const stepsGoal = (goals && goals.goal_steps)       || 7500;
        const sleepGoal = (goals && goals.goal_sleep_hours) || 8;

        container.innerHTML = `
            <div class="card">
                ${heroStat(s.total_calories, goals && goals.goal_calories, dateLabel)}
                <hr class="dash-divider">
                <div class="dash-goals">
                    ${goalStat(s.total_protein,  'g',  'protein', goals && goals.goal_protein_g,  '>')}
                    ${goalStat(s.total_carbs,    'g',  'carbs',   goals && goals.goal_carbs_g,    '<')}
                    ${goalStat(s.total_fat,      'g',  'fat',     goals && goals.goal_fat_g,      '<')}
                    ${goalStat(s.total_fiber,    'g',  'fiber',   goals && goals.goal_fiber_g,    '>')}
                    ${goalStat(s.total_sugar,    'g',  'sugar',   goals && goals.goal_sugar_g,    '<')}
                    ${goalStat(s.total_sodium,   'mg', 'sodium',  goals && goals.goal_sodium_mg,  '<')}
                </div>
                <hr class="dash-divider">
                <div class="dash-goals">
                    ${goalStat(data.steps,       'steps', null,   stepsGoal, '>',  0)}
                    ${goalStat(data.sleep_hours, 'h',    'sleep', sleepGoal, '>',  1)}
                </div>
            </div>

            <div class="quick-log-row">
                <button class="btn-quick-text" id="ql-water">+ Water</button>
                <button class="btn-quick-text" id="ql-custom">+ ${escHtml((ql && ql.name) || 'Coffee')}</button>
                <a href="#food?date=${data.date}" class="btn-quick-text">+ Food</a>
                <button class="btn-quick-text" id="ql-scan">Scan</button>
            </div>
            ${waterLine(water)}

            <div class="card">
                <h2>${escHtml(dateLabel)}'s Food</h2>
                ${renderFoodEntries(data.food_entries)}
            </div>
        `;

        document.getElementById('ql-water').addEventListener('click',  () => quickLog('water',  ql));
        document.getElementById('ql-custom').addEventListener('click', () => quickLog('custom', ql));
        document.getElementById('ql-scan').addEventListener('click', handleScan);
    }

    function handleScan() {
        const btn = document.getElementById('ql-scan');
        if (btn) btn.disabled = true;
        BarcodeScanner.open(async (barcode) => {
            if (!barcode) {
                const b = document.getElementById('ql-scan');
                if (b) b.disabled = false;
                return;
            }
            Toast.info('Looking up barcode…', 2000);
            const product = await BarcodeScanner.lookupBarcode(barcode);
            if (!product) {
                Toast.info('Product not found — try searching manually', 4000);
                const b = document.getElementById('ql-scan');
                if (b) b.disabled = false;
                return;
            }
            sessionStorage.setItem('prefill_food', JSON.stringify(product));
            window.location.hash = '#food';
        });
    }

    function renderFoodEntries(entries) {
        if (!entries.length) return '<p class="text-muted">Nothing logged yet.</p>';

        const mealOrder  = ['breakfast', 'lunch', 'dinner', 'snack'];
        const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
        const groups     = {};
        entries.forEach(e => {
            const mt = e.meal_type || 'snack';
            if (!groups[mt]) groups[mt] = [];
            groups[mt].push(e);
        });

        // Collect any meal types not in the canonical order (shouldn't happen, but safe)
        const order = [...mealOrder, ...Object.keys(groups).filter(mt => !mealOrder.includes(mt))];

        return order.filter(mt => groups[mt]).map(mt => `
            <div class="meal-group">
                <div class="meal-group-header">${mealLabels[mt] || mt}</div>
                ${groups[mt].map(e => `
                    <a href="#food?edit=${e.id}" class="food-entry" aria-label="Edit ${escHtml(e.food_name)}">
                        <div class="food-entry-info">
                            <span class="food-name">${escHtml(e.food_name)}</span>
                            <span class="food-meta">${e.serving_size ? escHtml(e.serving_size) : ''}</span>
                        </div>
                        <span class="food-cal">${Math.round(e.calories)}</span>
                    </a>
                `).join('')}
            </div>
        `).join('');
    }

    return { render };
})();
