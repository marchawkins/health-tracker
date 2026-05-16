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

    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async function render(container) {
        currentDate = todayStr();

        container.innerHTML = `
            <div class="date-nav">
                <button id="dash-prev" class="btn-icon">&larr;</button>
                <input type="date" id="dash-date" value="${currentDate}">
                <button id="dash-today" class="btn-icon">Today</button>
                <button id="dash-next" class="btn-icon">&rarr;</button>
            </div>
            <div id="dash-content"><div class="loading">Loading&hellip;</div></div>
        `;

        function updateNav() {
            const isToday = currentDate === todayStr();
            document.getElementById('dash-next').style.display  = isToday ? 'none' : '';
            document.getElementById('dash-today').style.display = isToday ? 'none' : '';
        }

        document.getElementById('dash-date').addEventListener('change', e => {
            currentDate = e.target.value;
            updateNav();
            loadData();
        });
        document.getElementById('dash-prev').addEventListener('click', () => {
            currentDate = offsetDate(currentDate, -1);
            document.getElementById('dash-date').value = currentDate;
            updateNav();
            loadData();
        });
        document.getElementById('dash-next').addEventListener('click', () => {
            currentDate = offsetDate(currentDate, 1);
            document.getElementById('dash-date').value = currentDate;
            updateNav();
            loadData();
        });
        document.getElementById('dash-today').addEventListener('click', () => {
            currentDate = todayStr();
            document.getElementById('dash-date').value = currentDate;
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

    function renderContent(container, data) {
        const s         = data.food_summary;
        const dateLabel = fmtDateLabel(data.date);

        container.innerHTML = `
            <div class="card">
                <h2>${escHtml(dateLabel)} Calories</h2>
                <div class="calorie-total">${Math.round(s.total_calories)}</div>
                <div class="macro-row">
                    <div class="macro">
                        <span class="macro-val">${Math.round(s.total_protein)}g</span>
                        <span class="macro-label">Protein</span>
                    </div>
                    <div class="macro">
                        <span class="macro-val">${Math.round(s.total_carbs)}g</span>
                        <span class="macro-label">Carbs</span>
                    </div>
                    <div class="macro">
                        <span class="macro-val">${Math.round(s.total_fat)}g</span>
                        <span class="macro-label">Fat</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>${escHtml(dateLabel)}'s Food</h2>
                ${renderFoodEntries(data.food_entries)}
                <a href="#food?date=${data.date}" class="btn btn-secondary btn-block" style="margin-top:12px;">+ Add Food</a>
            </div>

        `;
    }

    function renderFoodEntries(entries) {
        if (!entries.length) return '<p class="text-muted">Nothing logged yet.</p>';
        return entries.map(e => `
            <a href="#food?edit=${e.id}" class="food-entry" aria-label="Edit ${escHtml(e.food_name)}">
                <div class="food-entry-info">
                    <span class="food-name">${escHtml(e.food_name)}</span>
                    <span class="food-meta">${e.meal_type}${e.serving_size ? ' &middot; ' + escHtml(e.serving_size) : ''}</span>
                </div>
                <span class="food-cal">${Math.round(e.calories)}</span>
            </a>
        `).join('');
    }

    return { render };
})();
