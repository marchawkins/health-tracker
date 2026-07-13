# Claude Code Prompt: Habit Tracking Feature

## Project context

This is a personal health tracking PWA called **Health**. It's a vanilla JS SPA with a PHP/MySQL backend, hosted at health.marchawkins.com. The codebase is at the root of the project folder.

**Stack:**
- Frontend: vanilla JS (IIFE module pattern), no build step
- Backend: PHP with PDO/MySQL, routed through `public_html/api/index.php`
- Styles: single `public_html/css/app.css`
- No frameworks, no npm, no bundler

**Auth:** Session-based. All protected API routes have access to `CURRENT_USER_ID` (an int constant set in `index.php` after session check).

**API routing pattern:** `index.php` parses the URL, sets `$resource`, `$sub`, and `$method`, then `require`s the matching file. Adding a new resource means adding a `case` to the switch and creating the file. See `api/index.php` for the full pattern.

**Helpers available in all API files:** `json_response()`, `json_error()`, `get_json_body()`, `require_fields()` — all in `api/helpers.php`. DB connection via `get_db()` from `api/db.php`.

---

## Feature: Habit Tracking

### What to build

1. **Dashboard nav item** — Add a dashboard icon as the first item (far left) in the bottom `<nav id="app-nav">` in `public_html/index.html`. It should use `data-view="dashboard"` and `href="#dashboard"`. Match the existing SVG icon style (stroke-based, 21×21, stroke-width 1.6). Use a grid/squares icon or similar "dashboard" metaphor.

2. **Habit section on the dashboard** — After the existing daily summary cards in `public_html/js/views/dashboard.js`, render a "Habits" section showing today's habits. Each habit displays:
   - Name
   - A minutes input (numeric, inline — not a separate form page)
   - A visual indicator (checkbox or toggle) that marks it complete once the user's logged minutes meet or exceed their goal
   - Current streak (consecutive days completed)

   Habits are only shown for today (not past dates — hide the section or show it read-only when browsing past dates).

3. **Habits configuration in Profile** — In `public_html/js/views/profile.js`, add a "Habits" section (below the existing goals form) where users can:
   - See their habits listed
   - Toggle each habit active/inactive
   - Set a daily goal (in minutes) for each habit
   - Add a new custom habit (name + goal minutes)
   - Delete custom habits (but not the default system habits)

4. **API: `public_html/api/habits.php`** — New file. Register it in `index.php` under `case 'habits'`.

5. **DB migration** — Write a standalone `public_html/api/migrate_habits.php` file that creates the tables when run once. Do not auto-run it on every request.

---

## Database schema

Create two tables:

```sql
CREATE TABLE IF NOT EXISTS habit_definitions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT DEFAULT NULL,          -- NULL = system default, user_id = user-created
  name           VARCHAR(100) NOT NULL,
  icon           VARCHAR(10)  DEFAULT NULL,
  is_system      TINYINT(1)   DEFAULT 0,    -- 1 = built-in, cannot be deleted by user
  display_order  INT          DEFAULT 0,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_habits (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  habit_id       INT NOT NULL,              -- FK → habit_definitions.id
  is_active      TINYINT(1)   DEFAULT 1,
  goal_minutes   INT          DEFAULT 20,
  display_order  INT          DEFAULT 0,
  UNIQUE KEY uq_user_habit (user_id, habit_id)
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  habit_id       INT NOT NULL,
  logged_date    DATE NOT NULL,
  minutes        INT  DEFAULT 0,
  UNIQUE KEY uq_user_habit_date (user_id, habit_id, logged_date)
);
```

Seed the four system habits:

```sql
INSERT IGNORE INTO habit_definitions (id, user_id, name, icon, is_system, display_order)
VALUES
  (1, NULL, 'Walking',    '🚶', 1, 1),
  (2, NULL, 'Reading',    '📖', 1, 2),
  (3, NULL, 'Journaling', '✏️', 1, 3),
  (4, NULL, 'Meditating', '🧘', 1, 4);
```

Also seed `user_habits` rows for user_id = 1 (the primary account) with all four active, goal_minutes = 20 for each. (There's also a demo account at user_id = 2 — seed those too so the demo looks good.)

---

## API endpoints (`api/habits.php`)

**GET /api/habits** — Returns the user's active habits for today with today's log and current streak.

Response shape:
```json
[
  {
    "habit_id": 1,
    "name": "Walking",
    "icon": "🚶",
    "goal_minutes": 20,
    "is_system": 1,
    "logged_minutes": 25,
    "completed": true,
    "streak": 4
  }
]
```

Streak = consecutive days (going backwards from yesterday) where `logged_minutes >= goal_minutes`, plus today if completed. Calculate this in SQL or PHP — either is fine, just keep it correct.

**POST /api/habits/log** — Log minutes for a habit on a given date.
Body: `{ habit_id, date, minutes }`. Upsert into `habit_logs`.

**GET /api/habits/definitions** — Returns all habit definitions available to this user (system + their own custom ones).

**POST /api/habits/definitions** — Create a custom habit for the user. Body: `{ name, goal_minutes }`.

**DELETE /api/habits/definitions/{id}** — Delete a user-created habit (error if `is_system = 1`).

**GET /api/habits/settings** — Returns `user_habits` rows for this user (active/inactive + goal_minutes per habit).

**POST /api/habits/settings** — Upsert `user_habits` rows. Body: `{ updates: [{ habit_id, is_active, goal_minutes }] }`.

---

## Frontend: dashboard section

In `dashboard.js`, after loading the existing daily data, also fetch `/api/habits` and render a habits section. Only show it when `currentDate === todayStr()`.

Suggested HTML structure to match the existing card style:
```html
<div class="card habits-section">
  <h2 class="section-title">Habits</h2>
  <ul class="habit-list">
    <li class="habit-item completed">
      <span class="habit-icon">🚶</span>
      <span class="habit-name">Walking</span>
      <span class="habit-streak">🔥 4</span>
      <input type="number" class="habit-minutes" value="25" min="0" step="1">
      <span class="habit-goal">/ 20 min</span>
      <button class="habit-check active" aria-label="Mark complete">✓</button>
    </li>
  </ul>
</div>
```

When the user changes the minutes input (on blur or Enter), POST to `/api/habits/log`. Mark the item `completed` visually if `minutes >= goal_minutes`. The streak count updates after save (re-fetch or update in place).

---

## Frontend: profile section

In `profile.js`, add a habits section with a separate save flow from the main profile form. Fetch `/api/habits/settings` and `/api/habits/definitions` on load. Render a list of all available habits with:
- Toggle (checkbox) for is_active
- Number input for goal_minutes
- Delete button (only shown for non-system habits)

Below the list, an "Add habit" inline form: name text input + goal minutes + Add button → POST to `/api/habits/definitions`, then refresh the list.

A "Save habits" button POSTs all current toggle/goal state to `/api/habits/settings`.

---

## CSS

Add styles to `public_html/css/app.css` for the new habit elements. Match the existing design language — the app uses CSS custom properties for colors (check the `:root` block in app.css), Hanken Grotesk for UI text, and a card-based layout. Keep it minimal and consistent with what's already there.

---

## Files to create or modify

| File | Action |
|------|--------|
| `public_html/api/habits.php` | **Create** |
| `public_html/api/migrate_habits.php` | **Create** (run once manually) |
| `public_html/api/index.php` | **Edit** — add `case 'habits'` to switch |
| `public_html/js/views/dashboard.js` | **Edit** — add habits section |
| `public_html/js/views/profile.js` | **Edit** — add habits config section |
| `public_html/index.html` | **Edit** — add dashboard nav item + `<script src="/js/views/habits.js">` if you extract to separate file |
| `public_html/css/app.css` | **Edit** — add habit styles |

If you create a separate `public_html/js/views/habits.js`, add a `<script>` tag for it in `index.html` before `dashboard.js`.

---

## Things to preserve / not break

- The existing `data-view="dashboard"` on the header home button should still work. The new nav item is additive.
- The `hidden` attribute on the weight nav item is intentional — leave it.
- Don't change the routing logic in `app.js`.
- The `AbortController` / `signal` pattern in view renders should be respected — if you add async fetches in dashboard, pass the signal through.
