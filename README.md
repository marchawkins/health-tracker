# Health Tracker

A personal health tracking web app for logging food, weight, steps, sleep, and daily habits. Built to run on a standard shared PHP/MySQL host with no build tools or dependencies required.

## Overview

Health lets you track daily nutrition against customizable macro and calorie goals, log body weight over time, record activity metrics like steps and sleep, and build streaks around daily habits. A barcode scanner lets you look up packaged foods via OpenFoodFacts. Food search pulls from both the USDA FoodData Central database and OpenFoodFacts, with results cached locally to reduce API calls.

<p align="center" valign="top">
  <img src="./readme_assets/vitale-dashboard.png" width="20%" alt="Health dashboard">
  <img src="./readme_assets/vitale-log-food.png" width="20%" alt="Food logging screen">
  <img src="./readme_assets/vitale-log-steps.png" width="20%" alt="Steps logging screen">
  <img src="./readme_assets/vitale-profile.png" width="20%" alt="User profile screen">
</p>

The app also includes a habit tracker on the dashboard. Habits can be simple yes/no checkboxes or minute-based (e.g. "walk for 20 minutes"), and the app tracks a running streak for each one. Habits are configured per user in the Profile screen, with a set of defaults and the ability to add custom ones.

The app is single-user by design but supports multiple accounts — each user has their own data and goals. Authentication uses bcrypt password hashing with email verification and password reset flows.

## Technical Notes

- **Frontend:** Vanilla JavaScript SPA with hash-based routing. No frameworks, no build step. All JS is organized into views, components, and a shared API client.
- **Backend:** PHP 8+, structured as a lightweight JSON API. Each endpoint is a single PHP file routed through `api/index.php`.
- **Database:** MySQL. `db/schema.sql` covers the core tables; run `api/migrate_habits.php` once after install to add habit tracking tables.
- **Food data:** Searches the USDA FoodData Central API and OpenFoodFacts (no key required). USDA results are cached in a local `usda_cache` table.
- **Barcode scanning:** Uses the browser's native `BarcodeDetector` API where supported, with a fallback to a manual entry prompt.
- **Email:** Password reset and email verification use PHP's `mail()`. On shared hosts, SMTP configuration may be required depending on the host.
- **Hosting:** Tested on Hostinger shared hosting. Should work on any host running PHP 8+ and MySQL 5.7+.

## Installation

- **Clone the repo** to your local machine or directly to your server.

- **Set up the database** — create a MySQL database, then import `db/schema.sql`. This creates all tables and loads a sample user (`sarah@example.com` / `Demo1234!`) with two weeks of data so you can see the app in action right away. Then visit `api/migrate_habits.php` once in your browser to create the habit tracking tables.

- **Configure the database connection** — copy `config/db..sample.php` to `config/db.php` and fill in your database credentials. Also add your USDA API key (free at `fdc.nal.usda.gov`).

- **Point your web root to `public_html/`** — the `config/` and `db/` directories sit outside the web root and are never served over HTTP.

- **Register your account** — visit the app, register with your email, and verify your address. You can then delete the sample user from the database if you no longer need it.

- **Configure PHP mail (if needed)** — on some shared hosts, email delivery requires configuring SMTP. Check your host's documentation for the recommended approach.