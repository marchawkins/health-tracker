// Shared habit-tracking widget — mounted into the dashboard's "today" view.
const HabitsWidget = (() => {

    function itemHtml(h) {
        const completedCls = h.completed ? ' completed' : '';
        const checkCls     = h.completed ? ' active' : '';
        const streakHtml   = h.streak > 0 ? `<span class="habit-streak">🔥 ${h.streak}</span>` : '<span class="habit-streak"></span>';
        const binary        = h.goal_minutes <= 0;
        const minutesHtml   = binary ? '' : `
                <input type="number" class="habit-minutes" value="${h.logged_minutes}" min="0" step="1" inputmode="numeric" aria-label="Minutes for ${escHtml(h.name)}">
                <span class="habit-goal">/ ${h.goal_minutes} min</span>`;
        return `
            <li class="habit-item${completedCls}" data-habit-id="${h.habit_id}" data-goal="${h.goal_minutes}">
                <span class="habit-icon">${h.icon ? escHtml(h.icon) : ''}</span>
                <span class="habit-name">${escHtml(h.name)}</span>
                ${streakHtml}${minutesHtml}
                <button type="button" class="habit-check${checkCls}" aria-label="Mark ${escHtml(h.name)} complete">&check;</button>
            </li>
        `;
    }

    function render(habits) {
        if (!habits.length) return '';
        return `
            <div class="card habits-section">
                <h2>Habits</h2>
                <ul class="habit-list">
                    ${habits.map(itemHtml).join('')}
                </ul>
            </div>
        `;
    }

    async function logMinutes(habitId, date, minutes) {
        return API.habits.log({ habit_id: habitId, date, minutes });
    }

    // Mounts the habits section into `container` for the given date.
    // Only meaningful for today — callers should not invoke this for past dates.
    async function mount(container, date, signal) {
        let habits;
        try {
            habits = await API.habits.list(date, signal);
        } catch (e) {
            if (e.name === 'AbortError') throw e;
            container.innerHTML = '';
            return;
        }

        container.innerHTML = render(habits);
        if (!habits.length) return;

        container.querySelectorAll('.habit-item').forEach(li => {
            const habitId = parseInt(li.dataset.habitId, 10);
            const goal    = parseInt(li.dataset.goal, 10) || 0;
            const binary  = goal <= 0;
            const input   = li.querySelector('.habit-minutes');
            const check   = li.querySelector('.habit-check');

            async function save(minutes) {
                minutes = Math.max(0, parseInt(minutes, 10) || 0);
                if (input) input.value = minutes;
                try {
                    await logMinutes(habitId, date, minutes);
                    const completed = binary ? minutes > 0 : minutes >= goal;
                    li.classList.toggle('completed', completed);
                    check.classList.toggle('active', completed);
                    // Re-fetch to pick up the updated streak.
                    mount(container, date, signal);
                } catch (err) {
                    Toast.error('Failed to save: ' + err.message);
                }
            }

            if (input) {
                input.addEventListener('blur', () => save(input.value));
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
                });
            }
            check.addEventListener('click', () => {
                if (binary) {
                    save(check.classList.contains('active') ? 0 : 1);
                } else {
                    save(check.classList.contains('active') ? 0 : goal);
                }
            });
        });
    }

    return { mount };
})();
