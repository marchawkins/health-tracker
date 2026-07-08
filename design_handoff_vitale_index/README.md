# Handoff: Health — “Index” visual redesign

## Overview
This package restyles the existing **Health** health-tracking PWA with a new look &
feel called **“Index”** — an editorial, monochrome aesthetic: paper-white surfaces,
near-black ink, hairline rules, serif display numbers, and a single restrained amber
accent. The app’s information architecture, screens, and logic are **unchanged** — this
is a **visual / styling** redesign of four existing screens:

1. **Dashboard** (daily summary)
2. **Log Food**
3. **Steps** (trend + log)
4. **Profile**

## About the design files
The files in `reference/` are a **design reference built in HTML/React + CSS** — a
prototype that shows the intended look and behavior. They are **not** meant to be
shipped as-is. Your job is to **recreate this look in the existing Health codebase**
using its established framework, components, and state/logic. Reuse the app’s current
data flow and handlers; only the presentation changes. Where the codebase already has a
component (e.g. a number stepper, a select), restyle it to match — don’t rebuild logic.

`reference/Health-Index-Reference.html` renders all four screens side-by-side. Open it
in a browser to inspect spacing, type, and color live (e.g. via DevTools). The CSS lives
in `reference/styles.css` (the Index rules are all prefixed `.idx-…`; ignore the `.bl-…`
rules — those belong to a second direction that was **not** chosen). Components are in
`reference/frame.jsx` (shared: phone shell, icon set, `Ring`, `LineChart`) and
`reference/directionA.jsx` (the four screens).

## Fidelity
**High-fidelity.** Colors, typography, spacing, and component styling are final.
Recreate them pixel-faithfully using the codebase’s existing libraries/patterns. The
`screenshots/` PNGs (550×1190) are the visual source of truth and double as README art.

---

## Implementation notes (build order)
This is a **visual restyle only** — do not change app logic, data flow, routing, or
state. Keep all existing handlers and component behavior; change presentation only.
This repo uses **plain CSS** — implement with hand-written CSS (a small set of token
custom properties on `:root` plus class-based component styles). You may lift rules
directly from the reference `styles.css` (the `.idx-*` blocks), but organize them to fit
the repo’s existing CSS structure rather than dropping the file in wholesale.

Work in this order, pausing for review after each step:

1. **Tokens & fonts.** Load the three Google Fonts (Newsreader, Hanken Grotesk,
   JetBrains Mono) and add the color + type + spacing values from *Design tokens* below
   into the existing theming system — centralized tokens, not per-component hex.
   **Review the palette and type ramp before touching screens.**
2. **Global chrome.** Restyle the App Header (home icon, serif `Health` wordmark with
   amber “e”, avatar) and the Tab Bar (mono uppercase labels, `ink` active state).
3. **Screens, one at a time:** Dashboard → Log Food → Steps → Profile. Match each to its
   spec section and the matching PNG in `screenshots/`. **Reuse** existing inputs,
   steppers, and selects — restyle them, don’t rebuild logic.
4. **Icons.** Wire up `icons/`: `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   and reference `icon-192.png` / `icon-512.png` in the web-app manifest; copy the files
   to wherever static assets are served.

Implement only the **Index** (`.idx-*`) styling documented here — ignore the unused
`.bl-*` (“Bloom”) rules in `styles.css`.

---

## Design tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `paper` (bg) | `#FAF8F3` | App background, tab bar, button text-on-ink |
| `card` | `#FFFFFF` | Optional raised surfaces (used sparingly; Index favors hairlines over cards) |
| `ink` | `#1A1610` | Primary text, hero numbers, CTA fill, on-track macro bars |
| `soft` | `#6B6358` | Secondary text, italic day suffix, section labels |
| `faint` | `#A69D8E` | Tertiary text, mono micro-labels, axis labels, placeholders |
| `line` | `#ECE7DC` | Hairline dividers, borders, chart gridlines, progress track |
| `line2` | `#F4F0E8` | Lighter fill for macro bar tracks |
| `accent` | `#C06A2A` | Amber: calorie progress, “over” state, active tab, wordmark “e”, home icon, focus |
| `accent-tint` | `#F6EADD` | Soft amber wash (available for hovers/badges) |

Monochrome by design — `accent` is the **only** chroma; use it intentionally
(progress, attention/“over” states, the active nav item, the wordmark accent).

### Typography
Three families (all Google Fonts):
- **Newsreader** — serif, the editorial voice. Used for **all display numbers and
  headings**. Weights 400 / 500 / 600; italic available (used for the “…day” suffix).
- **Hanken Grotesk** — the UI sans. Body copy, macro names, button labels. 400–800.
- **JetBrains Mono** — micro-labels only: eyebrows, field labels, section labels, tab
  labels, chart axis ticks. 400 / 500.

| Role | Family | Size / weight | Tracking | Notes |
|---|---|---|---|---|
| Hero number (calories) | Newsreader | 92px / 400 | −2px | `font-variant-numeric: lining-nums` |
| Secondary hero number (weekly avg) | Newsreader | 64px / 400 | −2px | |
| Screen title (`Log food`, `Profile`) | Newsreader | 34px / 500 | −0.5px | |
| Day label (`Yesterday`) | Newsreader | 30px / 500 | — | suffix in *italic*, color `soft` |
| Wordmark `Health` | Newsreader | 25px / 500 | 0.5px | final letter colored `accent` |
| Macro value | Newsreader | 21px / 500 | — | unit appended in 12px sans `faint` |
| Text input value | Newsreader | 20px | — | |
| Select value | Newsreader | 17px | — | |
| Eyebrow / section label | JetBrains Mono | 10.5px / 500 | 2.5px | UPPERCASE, `soft`/`faint` |
| Field label | JetBrains Mono | 10px | 1.5px | UPPERCASE, `faint` |
| Tab label | JetBrains Mono | 10px | 1.4px | UPPERCASE |
| Macro name / body | Hanken Grotesk | 14px | — | `soft` |
| Button label | Hanken Grotesk | 15px / 600 | 0.3px | |

### Shape, spacing & elevation
- **Radii:** buttons `14px`; scan/utility chips `12px`; circular controls (nav arrows,
  avatar, home) `50%` at 34–40px; segmented control `999px` (pill).
- **Borders / dividers:** hairlines are `1px solid line`. Inputs use a **bottom border
  only**, `1.5px solid line` (→ `accent` on focus). Section headers are a mono label +
  a `1px` rule filling the remaining width.
- **Progress track (calories):** `3px` tall, `line` track, `accent` fill, `2px` radius.
- **Macro bar:** `4px` tall, `line2` track, fill `ink` (on-track) or `accent` (“over”).
- **Elevation:** Index is mostly flat (paper + hairlines). The only shadow is the device
  frame itself in the reference. Avoid drop shadows on in-app surfaces.
- **Screen padding:** 26px horizontal gutter. Tab bar has a `1px` top hairline.

---

## Screens / views

> All screens share the **App Header** (top) and **Tab Bar** (bottom). Logical canvas
> 390×844.

### Shared — App Header
- Left: **home** icon, `accent` color, ~22px, 1.9 stroke.
- Center: wordmark **Health** (Newsreader 25/500), final “e” in `accent`.
- Right: **user** avatar — 40px circle, `1px line` border, user glyph in `soft`.
- Padding: `6px 26px 18px`.

### Shared — Tab Bar
- 4 equal columns: **Food / Weight / Steps / Sleep** (icon + mono uppercase label).
- Inactive: icon + label `faint`. Active: icon + label `ink` (label still mono).
- Background `paper`, `1px` top hairline. Items: icon ~21px over a 10px label, `gap 5px`.

### 1. Dashboard
- **Eyebrow:** `GOOD EVENING, SARAH` (mono, `faint`).
- **Day navigator:** centered — `‹` circle arrow / **Yesterday** (Newsreader 30, “day”
  italic `soft`) over `BACK TO TODAY` (mono `faint`) / `›` circle arrow. Arrows are 34px
  circles, `1px line` border.
- **Hero calories:** big `1,685` (Newsreader 92), to its right a stacked block — `CAL`
  (mono `faint`) over `of 1,700 goal` (14px `soft`). Below: full-width `3px` progress
  track (`accent` fill, here ~99%), right-aligned mono caption `15 cal under`.
- **Macro grid:** 2 columns × 4 rows. Each cell:
  - Row: name (Hanken 14 `soft`) ←→ value (Newsreader 21) + unit (12px sans `faint`).
  - `4px` bar (fill `ink`, or `accent` when over goal).
  - Goal caption (mono, `faint`; `accent` + ` · over` when exceeded).
  - Order & data: Protein 83 g (≥130), Carbs 159 g (≤175), **Fat 84 g (≤58 · over)**,
    Fiber 30 g (≥25), **Sugar 41 g (≤35 · over)**, Sodium 1,530 mg (≤2,200),
    Steps 9,250 (≥8,000), Sleep 7.5 h (≥7.5).

### 2. Log Food
- Title **Log food** (Newsreader 34).
- Section label **WHEN & WHAT** (mono + rule). Two-up row: **Date** select
  (`05/22/26` + calendar glyph) and **Meal** select (`Dinner` + chevron). Selects are
  underline-only with a right-aligned `faint` glyph.
- **Food name \*** — underline text input, placeholder `Search or type food…`
  (`faint`), focus underline `accent`. Below it a row: **Scan a photo** chip (camera
  icon + label, `12px` radius, `1px line`) + a square `×` clear chip.
- Section **AMOUNT**: **Serving size** input (placeholder `4 oz, 1 cup…`) + narrow
  **Servings** stepper (value + up/down chevrons in `faint`).
- Section **CALORIES & MACROS**: **Calories \*** input (with stepper) then two-up
  **Protein (g)** / **Carbs (g)** inputs.
- **CTA:** full-width `Save entry ›` — `ink` fill, `paper` text, `14px` radius, 54px tall.

### 3. Steps
- Title **Steps** with a **segmented control** `7d · 14d · 30d` (pill; active segment
  `ink` fill, `paper` text; others `faint`).
- **WEEKLY AVERAGE** eyebrow → `9,840` (Newsreader 64) + `STEPS / DAY` (mono) over
  `+23% vs last week` (`accent`).
- **Line chart** (`LineChart` in frame.jsx): hairline dashed gridlines at 14k/10k/6k
  with mono `faint` y-labels; a `2px` `accent` polyline with round joins; `3.2px`
  `accent` dots at each point; mono `faint` x-labels (`5/16…5/22`, first left-aligned,
  last right-aligned). Data: `[11200, 8800, 7200, 13100, 6400, 9400, 10200]`.
- **LOG STEPS** section: **Date** select, **Steps \*** input (stepper), then CTA
  `Log steps ›`.

### 4. Profile
- Title **Profile** (Newsreader 34).
- Section **PREFERENCES**: **Units** select (`Imperial · lbs, ft/in`); **Display name**
  text input (`Sarah`); two-up **Age** (`31`) + **Biological sex** select (`Female`);
  two-up **Height (ft)** / **Height (in)** inputs (`5` / `5`).
- Section **GOALS**: two-up **Current weight** (read-only, `faint` `145.4 lbs`) +
  **Goal weight** (`142.0`, value in `accent`); then **Activity level** select
  (`Lightly active · 1–3 days/wk`).

---

## Interactions & behavior
Behavior is the app’s existing logic — preserve it. Styling-relevant states:
- **Focus:** inputs change their `1.5px` bottom border from `line` → `accent`. (Add a
  matching focus treatment to selects/steppers.)
- **“Over goal” state:** macro bar fill and goal caption switch from `ink`/`faint` to
  `accent`, and the caption appends ` · over`.
- **Active nav / active segment:** `ink` (tab) / `ink`-filled pill (segmented control).
- **Day navigator:** `‹`/`›` step the date; `BACK TO TODAY` resets.
- **Steppers:** up/down chevrons increment/decrement numeric fields.
- No decorative motion is required. If you add transitions, keep them short
  (120–180ms) and subtle; respect `prefers-reduced-motion`.

## Assets
- **Fonts:** Newsreader, Hanken Grotesk, JetBrains Mono — load from Google Fonts (see
  the `<link>` in the reference HTML for exact weights/axes).
- **Icons:** simple 24×24 line icons (1.6–1.9 stroke), defined inline in
  `frame.jsx → ICONS`: `home, user, food, weight, steps, sleep, camera, close, cal
  (calendar), chevL, chevR, chevD, up, down, plus, minus`. Reuse your icon system if you
  have one; match weight/scale.
- **App icon (iOS home screen):** in `icons/` — paper background, serif **V** in `ink`
  with an `accent` dot (echoes the wordmark). Full-bleed square (iOS rounds corners
  automatically — do **not** pre-round or add transparency):
  - `apple-touch-icon.png` — 180×180 → `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
  - `icon-192.png`, `icon-512.png` — for the PWA web app manifest (`icons[]`).
- **Screenshots:** `screenshots/*.png` (550×1190) — the four redesigned screens, for the
  repo README / store listing.

## Files in this bundle
```
design_handoff_vitale_index/
├─ README.md                         ← this spec
├─ reference/
│  ├─ Health-Index-Reference.html    ← all 4 screens, open in a browser
│  ├─ styles.css                     ← design CSS (use the .idx-* rules)
│  ├─ frame.jsx                      ← phone shell, ICONS, Ring, LineChart
│  └─ directionA.jsx                 ← the 4 Index screens
├─ screenshots/
│  ├─ vitale-dashboard.png
│  ├─ vitale-log-food.png
│  ├─ vitale-log-steps.png
│  └─ vitale-profile.png
└─ icons/
   ├─ apple-touch-icon.png  (180)
   ├─ icon-192.png
   └─ icon-512.png
```

> Note on `styles.css`: it also contains `.bl-*` rules for a second (“Bloom”) direction
> that was explored but **not** selected. Implement only the **Index** (`.idx-*`) styling
> documented here.
