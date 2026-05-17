const ProfileView = (() => {

    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Mifflin-St Jeor. Takes metric inputs, returns kcal/day.
    function calcTdee(age, sex, heightCm, weightKg, activityLevel, goalType) {
        if (!age || !sex || !heightCm || weightKg == null) return null;
        const bmr = sex === 'male'
            ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
            : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        const mult = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 };
        const adj  = { lose: -500, maintain: 0, gain: 300 };
        return Math.round(bmr * (mult[activityLevel] || 1.2) + (adj[goalType] || 0));
    }

    function goalsFromCal(cal) {
        return {
            goal_calories:  cal,
            goal_protein_g: Math.round(cal * 0.30 / 4),
            goal_fat_g:     Math.round(cal * 0.30 / 9),
            goal_carbs_g:   Math.round(cal * 0.40 / 4),
            goal_fiber_g:   Math.max(25, Math.floor(cal * 14 / 1000)),
            goal_sodium_mg: 2300,
        };
    }

    // Unit conversion helpers
    function lbsToKg(lbs) { return Math.round(lbs / 2.20462 * 10) / 10; }
    function kgToLbs(kg)   { return Math.round(kg  * 2.20462 * 10) / 10; }
    function cmToFtIn(cm)  {
        const totalIn = cm / 2.54;
        return { ft: Math.floor(totalIn / 12), in: Math.round(totalIn % 12) };
    }
    function ftInToCm(ft, inches) { return Math.round((ft * 12 + inches) * 2.54); }

    async function render(container) {
        container.innerHTML = '<div class="loading">Loading&hellip;</div>';

        let profile = {};
        let currentWeightKg = null; // always stored as kg internally

        try {
            const resp = await API.profile.get();
            profile = resp.profile || {};
            if (resp.current_weight) {
                const w = resp.current_weight;
                currentWeightKg = w.unit === 'kg'
                    ? parseFloat(w.weight)
                    : parseFloat(w.weight) / 2.20462;
            }
        } catch (err) {
            container.innerHTML = `<div class="card"><p class="error">Failed to load: ${escHtml(err.message)}</p></div>`;
            return;
        }

        const p = profile;

        container.innerHTML = `
            <form id="profile-form" novalidate>
                <div class="card">
                    <h2>Profile</h2>

                    <div class="form-row">
                        <label for="pf-units">Units</label>
                        <select id="pf-units" name="units">
                            <option value="imperial">Imperial (lbs, ft/in)</option>
                            <option value="metric">Metric (kg, cm)</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <label for="pf-name">Display Name</label>
                        <input type="text" id="pf-name" name="display_name" placeholder="Your name" autocomplete="name">
                    </div>

                    <div class="form-row-inline form-row">
                        <div class="form-col">
                            <label for="pf-age">Age</label>
                            <input type="number" id="pf-age" name="age" min="1" max="120" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-col">
                            <label for="pf-sex">Biological Sex</label>
                            <select id="pf-sex" name="sex">
                                <option value="">Select&hellip;</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <label>Height</label>
                        <div id="height-imperial" class="form-row-inline">
                            <div class="form-col">
                                <input type="number" id="pf-ft" name="height_ft" min="3" max="8" placeholder="ft" inputmode="numeric">
                            </div>
                            <div class="form-col">
                                <input type="number" id="pf-in" name="height_in" min="0" max="11" placeholder="in" inputmode="numeric">
                            </div>
                        </div>
                        <div id="height-metric" hidden>
                            <input type="number" id="pf-cm" name="height_cm" min="91" max="244" placeholder="cm" inputmode="numeric">
                        </div>
                    </div>

                    <div class="form-row">
                        <label>Current Weight</label>
                        <p id="current-weight-display"
                           style="padding:11px 12px;border:1px solid var(--color-border);border-radius:var(--radius);background:var(--color-bg);color:var(--color-muted);margin:0;font-size:16px;">
                            &mdash;
                        </p>
                    </div>

                    <div class="form-row">
                        <label for="pf-gw" id="gw-label">Goal Weight (lbs)</label>
                        <input type="number" id="pf-gw" name="goal_weight" min="30" max="660" step="0.5" placeholder="0" inputmode="decimal">
                    </div>

                    <div class="form-row">
                        <label for="pf-activity">Activity Level</label>
                        <select id="pf-activity" name="activity_level">
                            <option value="sedentary">Sedentary (little or no exercise)</option>
                            <option value="lightly_active">Lightly Active (1&ndash;3 days/week)</option>
                            <option value="moderately_active">Moderately Active (3&ndash;5 days/week)</option>
                            <option value="very_active">Very Active (6&ndash;7 days/week)</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <label for="pf-goal">Goal</label>
                        <select id="pf-goal" name="goal">
                            <option value="lose">Lose Weight</option>
                            <option value="maintain">Maintain</option>
                            <option value="gain">Gain Weight</option>
                        </select>
                    </div>

                    <div id="tdee-result"></div>
                </div>

                <div class="card">
                    <h2>Daily Goals</h2>
                    <p class="text-muted" style="font-size:13px;margin-bottom:14px;">Auto-calculated from your profile &mdash; edit to override.</p>

                    <div class="form-row">
                        <label for="pf-gcal">Calories (stay under)</label>
                        <input type="number" id="pf-gcal" name="goal_calories" min="500" max="10000" step="1" placeholder="0" inputmode="numeric">
                    </div>
                    <div class="macro-inputs">
                        <div class="form-row">
                            <label for="pf-gcarbs">Carbs g (stay under)</label>
                            <input type="number" id="pf-gcarbs" name="goal_carbs_g" min="0" step="1" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-row">
                            <label for="pf-gfat">Fat g (stay under)</label>
                            <input type="number" id="pf-gfat" name="goal_fat_g" min="0" step="1" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-row">
                            <label for="pf-gprot">Protein g (at least)</label>
                            <input type="number" id="pf-gprot" name="goal_protein_g" min="0" step="1" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-row">
                            <label for="pf-gfib">Fiber g (at least)</label>
                            <input type="number" id="pf-gfib" name="goal_fiber_g" min="0" step="1" placeholder="0" inputmode="numeric">
                        </div>
                    </div>
                    <div class="form-row">
                        <label for="pf-gsod">Sodium mg (stay under)</label>
                        <input type="number" id="pf-gsod" name="goal_sodium_mg" min="0" step="1" placeholder="0" inputmode="numeric">
                    </div>
                </div>

                <div class="card">
                    <h2>Quick Log Button</h2>
                    <p class="text-muted" style="font-size:13px;margin-bottom:14px;">Customizes the shortcut button on the dashboard. Defaults to 12oz Coffee with Cream.</p>

                    <div class="form-row">
                        <label for="pf-ql-name">Button Label</label>
                        <input type="text" id="pf-ql-name" name="quick_log_name" placeholder="☕ Coffee" maxlength="50">
                    </div>
                    <div class="form-row">
                        <label for="pf-ql-serving">Serving Size</label>
                        <input type="text" id="pf-ql-serving" name="quick_log_serving_size" placeholder="12oz">
                    </div>
                    <div class="form-row">
                        <label for="pf-ql-cal">Calories</label>
                        <input type="number" id="pf-ql-cal" name="quick_log_calories" min="0" step="1" placeholder="60" inputmode="numeric">
                    </div>
                    <div class="macro-inputs">
                        <div class="form-row">
                            <label for="pf-ql-prot">Protein (g)</label>
                            <input type="number" id="pf-ql-prot" name="quick_log_protein_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="pf-ql-carb">Carbs (g)</label>
                            <input type="number" id="pf-ql-carb" name="quick_log_carbs_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                        <div class="form-row">
                            <label for="pf-ql-fat">Fat (g)</label>
                            <input type="number" id="pf-ql-fat" name="quick_log_fat_g" min="0" step="0.1" placeholder="0" inputmode="decimal">
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">Save Profile</button>
                </div>
            </form>
        `;

        const form = document.getElementById('profile-form');

        // ── Populate saved values ──────────────────────────────────────────

        const savedUnits = p.units || 'imperial';
        form.units.value = savedUnits;

        if (p.display_name)     form.display_name.value    = p.display_name;
        if (p.age)              form.age.value             = p.age;
        if (p.sex)              form.sex.value             = p.sex;
        form.activity_level.value = p.activity_level || 'sedentary';
        form.goal.value           = p.goal          || 'maintain';

        if (savedUnits === 'metric') {
            if (p.height_cm) form.height_cm.value = p.height_cm;
        } else {
            if (p.height_ft)         form.height_ft.value = p.height_ft;
            if (p.height_in != null) form.height_in.value = p.height_in;
        }

        if (p.goal_weight) form.goal_weight.value = p.goal_weight;

        if (p.goal_calories)  form.goal_calories.value  = p.goal_calories;
        if (p.goal_carbs_g)   form.goal_carbs_g.value   = p.goal_carbs_g;
        if (p.goal_fat_g)     form.goal_fat_g.value     = p.goal_fat_g;
        if (p.goal_protein_g) form.goal_protein_g.value = p.goal_protein_g;
        if (p.goal_fiber_g)   form.goal_fiber_g.value   = p.goal_fiber_g;
        if (p.goal_sodium_mg) form.goal_sodium_mg.value = p.goal_sodium_mg;

        if (p.quick_log_name)         form.quick_log_name.value         = p.quick_log_name;
        if (p.quick_log_serving_size) form.quick_log_serving_size.value = p.quick_log_serving_size;
        if (p.quick_log_calories)     form.quick_log_calories.value     = p.quick_log_calories;
        if (p.quick_log_protein_g)    form.quick_log_protein_g.value    = p.quick_log_protein_g;
        if (p.quick_log_carbs_g)      form.quick_log_carbs_g.value      = p.quick_log_carbs_g;
        if (p.quick_log_fat_g)        form.quick_log_fat_g.value        = p.quick_log_fat_g;

        // ── Helper functions ───────────────────────────────────────────────

        function isMetric() { return form.units.value === 'metric'; }

        function getHeightCm() {
            if (isMetric()) {
                return parseFloat(form.height_cm.value) || null;
            }
            const ft = parseInt(form.height_ft.value) || null;
            if (!ft) return null;
            return ftInToCm(ft, parseInt(form.height_in.value) || 0);
        }

        function updateCurrentWeightDisplay() {
            const el = document.getElementById('current-weight-display');
            if (currentWeightKg == null) {
                el.textContent = 'No weight logged yet';
                return;
            }
            if (isMetric()) {
                el.textContent = (Math.round(currentWeightKg * 10) / 10) + ' kg';
            } else {
                el.textContent = kgToLbs(currentWeightKg) + ' lbs';
            }
        }

        function updateGwLabel() {
            document.getElementById('gw-label').textContent =
                'Goal Weight (' + (isMetric() ? 'kg' : 'lbs') + ')';
        }

        function updateHeightVisibility() {
            document.getElementById('height-imperial').hidden = isMetric();
            document.getElementById('height-metric').hidden   = !isMetric();
        }

        function updateTdeeDisplay() {
            const weightKg = currentWeightKg;
            const cal = calcTdee(
                parseInt(form.age.value) || null,
                form.sex.value || null,
                getHeightCm(),
                weightKg,
                form.activity_level.value,
                form.goal.value
            );
            const el = document.getElementById('tdee-result');
            if (cal) {
                el.innerHTML = '<p style="font-size:14px;color:var(--color-muted);padding:8px 0 0;">' +
                    'Estimated daily target: <strong>' + cal.toLocaleString('en-US') + ' cal</strong></p>';
            } else {
                el.innerHTML = '';
            }
            return cal;
        }

        function refillGoals() {
            const cal = updateTdeeDisplay();
            if (!cal) return;
            const g = goalsFromCal(cal);
            form.goal_calories.value  = g.goal_calories;
            form.goal_protein_g.value = g.goal_protein_g;
            form.goal_fat_g.value     = g.goal_fat_g;
            form.goal_carbs_g.value   = g.goal_carbs_g;
            form.goal_fiber_g.value   = g.goal_fiber_g;
            form.goal_sodium_mg.value = g.goal_sodium_mg;
        }

        // ── Apply initial state ────────────────────────────────────────────

        updateHeightVisibility();
        updateCurrentWeightDisplay();
        updateGwLabel();
        updateTdeeDisplay();
        if (!p.goal_calories) refillGoals();

        // ── Units toggle ───────────────────────────────────────────────────

        form.units.addEventListener('change', () => {
            const nowMetric = isMetric();

            // Convert goal weight
            const gwVal = parseFloat(form.goal_weight.value);
            if (gwVal) {
                form.goal_weight.value = nowMetric ? lbsToKg(gwVal) : kgToLbs(gwVal);
            }

            // Convert height
            if (nowMetric) {
                const ft = parseInt(form.height_ft.value) || 0;
                const inches = parseInt(form.height_in.value) || 0;
                if (ft || inches) form.height_cm.value = ftInToCm(ft, inches);
            } else {
                const cm = parseFloat(form.height_cm.value) || 0;
                if (cm) {
                    const converted = cmToFtIn(cm);
                    form.height_ft.value = converted.ft;
                    form.height_in.value = converted.in;
                }
            }

            updateHeightVisibility();
            updateCurrentWeightDisplay();
            updateGwLabel();
            refillGoals();
        });

        // ── TDEE recalculation triggers ────────────────────────────────────

        ['sex', 'activity_level', 'goal'].forEach(name => {
            form[name].addEventListener('change', refillGoals);
        });
        ['age', 'height_ft', 'height_in', 'height_cm'].forEach(name => {
            form[name].addEventListener('input', refillGoals);
        });

        form.addEventListener('submit', handleSubmit);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn  = form.querySelector('[type="submit"]');
        btn.disabled    = true;
        btn.textContent = 'Saving…';

        const metric = form.units.value === 'metric';

        const data = {
            display_name:   form.display_name.value.trim()   || null,
            age:            form.age.value            ? parseInt(form.age.value)             : null,
            sex:            form.sex.value            || null,
            units:          form.units.value,
            height_ft:      !metric && form.height_ft.value ? parseInt(form.height_ft.value) : null,
            height_in:      !metric && form.height_in.value ? parseInt(form.height_in.value) : null,
            height_cm:      metric  && form.height_cm.value ? parseFloat(form.height_cm.value) : null,
            goal_weight:    form.goal_weight.value    ? parseFloat(form.goal_weight.value)   : null,
            activity_level: form.activity_level.value,
            goal:           form.goal.value,
            goal_calories:  form.goal_calories.value  ? parseInt(form.goal_calories.value)  : null,
            goal_carbs_g:   form.goal_carbs_g.value   ? parseInt(form.goal_carbs_g.value)   : null,
            goal_fat_g:     form.goal_fat_g.value     ? parseInt(form.goal_fat_g.value)     : null,
            goal_protein_g: form.goal_protein_g.value ? parseInt(form.goal_protein_g.value) : null,
            goal_fiber_g:   form.goal_fiber_g.value   ? parseInt(form.goal_fiber_g.value)   : null,
            goal_sodium_mg:        form.goal_sodium_mg.value        ? parseInt(form.goal_sodium_mg.value)           : null,
            quick_log_name:        form.quick_log_name.value.trim() || null,
            quick_log_serving_size: form.quick_log_serving_size.value.trim() || null,
            quick_log_calories:    form.quick_log_calories.value    ? parseFloat(form.quick_log_calories.value)    : null,
            quick_log_protein_g:   form.quick_log_protein_g.value   ? parseFloat(form.quick_log_protein_g.value)   : null,
            quick_log_carbs_g:     form.quick_log_carbs_g.value     ? parseFloat(form.quick_log_carbs_g.value)     : null,
            quick_log_fat_g:       form.quick_log_fat_g.value       ? parseFloat(form.quick_log_fat_g.value)       : null,
        };

        try {
            await API.profile.save(data);
            Toast.success('Profile saved!');
        } catch (err) {
            Toast.error('Failed to save: ' + err.message);
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Save Profile';
        }
    }

    return { render };
})();
