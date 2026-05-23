-- ─────────────────────────────────────────────────────────────────────────────
-- Vitale Health Tracker — Full Schema + Seed Data
-- Import once into a fresh MySQL database.
-- Safe to re-run: all tables use CREATE TABLE IF NOT EXISTS;
--   seed rows use INSERT IGNORE / ON DUPLICATE KEY UPDATE.
--
-- Sample user
--   id=1  sarah@example.com   password: Demo1234!   (14 days of data)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  email                       VARCHAR(255)  NOT NULL UNIQUE,
  display_name                VARCHAR(100),
  password_hash               VARCHAR(255)  NULL,
  email_verified              TINYINT(1)    NOT NULL DEFAULT 0,
  verification_token          VARCHAR(100)  NULL,
  verification_token_expires  DATETIME      NULL,
  reset_token                 VARCHAR(100)  NULL,
  reset_token_expires         DATETIME      NULL,
  last_login                  DATETIME      NULL,
  pending_email               VARCHAR(255)  NULL,
  pending_email_token         VARCHAR(100)  NULL,
  pending_email_token_expires DATETIME      NULL,
  created_at                  DATETIME      DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS user_profiles (
  id                     INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id                INT UNSIGNED  NOT NULL,
  display_name           VARCHAR(100),
  age                    TINYINT UNSIGNED,
  sex                    ENUM('male','female'),
  units                  ENUM('imperial','metric') NOT NULL DEFAULT 'imperial',
  height_ft              TINYINT UNSIGNED,
  height_in              TINYINT UNSIGNED,
  height_cm              DECIMAL(5,1),
  goal_weight            DECIMAL(5,1),
  activity_level         VARCHAR(20)   NOT NULL DEFAULT 'sedentary',
  goal                   VARCHAR(10)   NOT NULL DEFAULT 'maintain',
  goal_calories          SMALLINT UNSIGNED,
  goal_carbs_g           SMALLINT UNSIGNED,
  goal_fat_g             SMALLINT UNSIGNED,
  goal_protein_g         SMALLINT UNSIGNED,
  goal_fiber_g           SMALLINT UNSIGNED,
  goal_sodium_mg         SMALLINT UNSIGNED,
  goal_sugar_g           SMALLINT UNSIGNED,
  goal_steps             SMALLINT UNSIGNED,
  goal_sleep_hours       DECIMAL(4,1),
  quick_log_name         VARCHAR(50),
  quick_log_serving_size VARCHAR(50),
  quick_log_calories     DECIMAL(6,1),
  quick_log_protein_g    DECIMAL(5,2),
  quick_log_carbs_g      DECIMAL(5,2),
  quick_log_fat_g        DECIMAL(5,2),
  updated_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_profiles_user (user_id)
);


CREATE TABLE IF NOT EXISTS food_logs (
  id             INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED  NOT NULL,
  meal_date      DATE          NOT NULL,
  logged_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meal_type      ENUM('breakfast','lunch','dinner','snack') DEFAULT 'snack',
  food_name      VARCHAR(255)  NOT NULL,
  serving_size   VARCHAR(100),
  calories       DECIMAL(7,1)  NOT NULL,
  protein_g      DECIMAL(6,2),
  carbs_g        DECIMAL(6,2),
  fat_g          DECIMAL(6,2),
  fiber_g        DECIMAL(6,2),
  sugar_g        DECIMAL(6,2),
  sodium_mg      DECIMAL(7,1),
  source         ENUM('manual','openfoodfacts') DEFAULT 'manual',
  off_barcode    VARCHAR(50),
  off_product_id VARCHAR(100),
  notes          TEXT,
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, meal_date)
);


CREATE TABLE IF NOT EXISTS weight_logs (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NOT NULL,
  logged_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  weight       DECIMAL(5,1)  NOT NULL,
  unit         ENUM('lbs','kg') DEFAULT 'lbs',
  body_fat_pct DECIMAL(4,1),
  notes        TEXT,
  created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, logged_at)
);


CREATE TABLE IF NOT EXISTS metric_definitions (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED,
  slug          VARCHAR(50)   NOT NULL UNIQUE,
  label         VARCHAR(100)  NOT NULL,
  unit          VARCHAR(30),
  data_type     ENUM('integer','decimal','text','boolean') DEFAULT 'decimal',
  icon          VARCHAR(10),
  display_order TINYINT       DEFAULT 0,
  is_active     BOOLEAN       DEFAULT TRUE,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS metric_logs (
  id                   INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id              INT UNSIGNED  NOT NULL,
  metric_definition_id INT UNSIGNED  NOT NULL,
  logged_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  value_numeric        DECIMAL(10,3),
  value_text           TEXT,
  notes                TEXT,
  created_at           DATETIME      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_metric_date (user_id, metric_definition_id, logged_at)
);


CREATE TABLE IF NOT EXISTS usda_cache (
  query        VARCHAR(255) NOT NULL,
  results_json TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (query)
);


-- ── Seed: metric definitions ─────────────────────────────────────────────────

INSERT INTO metric_definitions (user_id, slug, label, unit, data_type, icon, display_order) VALUES
  (NULL, 'steps',            'Steps',    'steps',   'integer', '👟', 1),
  (NULL, 'sleep_hours',      'Sleep',    'hours',   'decimal', '😴', 2),
  (NULL, 'mood',             'Mood',     '1-10',    'integer', '😊', 3),
  (NULL, 'water_oz',         'Water',    'oz',      'decimal', '💧', 4),
  (NULL, 'exercise_minutes', 'Exercise', 'minutes', 'integer', '🏃', 5)
ON DUPLICATE KEY UPDATE id = id;


-- ── Seed: Sarah (id=2) — sample user, 14 days of data ────────────────────────
-- Password: Demo1234!

INSERT IGNORE INTO users (id, email, display_name, password_hash, email_verified)
VALUES (1, 'sarah@example.com', 'Sarah', '$2y$12$fJKrWAm1k3o9NEFo5uOhtuIgokDkDKf9tWmuTplx3bAEuv6PDOKtG', 1);

INSERT INTO user_profiles (
    user_id, display_name, age, sex, units,
    height_ft, height_in,
    goal_weight, activity_level, goal,
    goal_calories, goal_protein_g, goal_carbs_g, goal_fat_g,
    goal_fiber_g, goal_sodium_mg, goal_sugar_g,
    goal_steps, goal_sleep_hours,
    quick_log_name, quick_log_serving_size, quick_log_calories,
    quick_log_protein_g, quick_log_carbs_g, quick_log_fat_g
) VALUES (
    1, 'Sarah', 31, 'female', 'imperial',
    5, 5,
    142.0, 'lightly_active', 'lose',
    1700, 130, 175, 58,
    25, 2200, 35,
    8000, 7.5,
    'Oat Milk Latte', '12 oz', 90,
    2, 14, 2
)
ON DUPLICATE KEY UPDATE
    display_name  = VALUES(display_name),
    goal_calories = VALUES(goal_calories);

INSERT INTO weight_logs (user_id, logged_at, weight, unit) VALUES
(1, '2026-05-08 07:12:00', 148.2, 'lbs'),
(1, '2026-05-09 07:08:00', 147.8, 'lbs'),
(1, '2026-05-10 07:22:00', 148.0, 'lbs'),
(1, '2026-05-11 07:15:00', 147.5, 'lbs'),
(1, '2026-05-12 07:10:00', 147.9, 'lbs'),
(1, '2026-05-13 07:18:00', 147.2, 'lbs'),
(1, '2026-05-14 07:05:00', 146.8, 'lbs'),
(1, '2026-05-15 07:20:00', 147.1, 'lbs'),
(1, '2026-05-16 07:14:00', 146.5, 'lbs'),
(1, '2026-05-17 07:09:00', 146.9, 'lbs'),
(1, '2026-05-18 07:17:00', 146.2, 'lbs'),
(1, '2026-05-19 07:11:00', 145.8, 'lbs'),
(1, '2026-05-20 07:08:00', 146.0, 'lbs'),
(1, '2026-05-21 07:16:00', 145.4, 'lbs');

-- Steps
INSERT INTO metric_logs (user_id, metric_definition_id, logged_at, value_numeric)
SELECT 1, id, logged_at, steps FROM (
    SELECT (SELECT id FROM metric_definitions WHERE slug = 'steps') AS id, logged_at, steps FROM (
        SELECT '2026-05-08 21:30:00' AS logged_at,  8240 AS steps UNION ALL
        SELECT '2026-05-09 21:45:00',               10520          UNION ALL
        SELECT '2026-05-10 21:15:00',                6180          UNION ALL
        SELECT '2026-05-11 21:20:00',                9340          UNION ALL
        SELECT '2026-05-12 21:55:00',               12680          UNION ALL
        SELECT '2026-05-13 21:10:00',                7450          UNION ALL
        SELECT '2026-05-14 21:00:00',                5920          UNION ALL
        SELECT '2026-05-15 21:40:00',                9810          UNION ALL
        SELECT '2026-05-16 21:25:00',               11240          UNION ALL
        SELECT '2026-05-17 21:35:00',                8670          UNION ALL
        SELECT '2026-05-18 21:05:00',                7390          UNION ALL
        SELECT '2026-05-19 21:50:00',               13120          UNION ALL
        SELECT '2026-05-20 21:20:00',                6840          UNION ALL
        SELECT '2026-05-21 21:30:00',                9250
    ) AS d
) AS s;

-- Sleep
INSERT INTO metric_logs (user_id, metric_definition_id, logged_at, value_numeric)
SELECT 1, id, logged_at, hrs FROM (
    SELECT (SELECT id FROM metric_definitions WHERE slug = 'sleep_hours') AS id, logged_at, hrs FROM (
        SELECT '2026-05-08 07:30:00' AS logged_at, 7.5 AS hrs UNION ALL
        SELECT '2026-05-09 07:15:00',              6.5         UNION ALL
        SELECT '2026-05-10 08:05:00',              8.0         UNION ALL
        SELECT '2026-05-11 07:50:00',              7.0         UNION ALL
        SELECT '2026-05-12 07:25:00',              7.5         UNION ALL
        SELECT '2026-05-13 08:20:00',              8.5         UNION ALL
        SELECT '2026-05-14 08:45:00',              9.0         UNION ALL
        SELECT '2026-05-15 07:40:00',              7.0         UNION ALL
        SELECT '2026-05-16 07:10:00',              6.5         UNION ALL
        SELECT '2026-05-17 07:30:00',              7.5         UNION ALL
        SELECT '2026-05-18 08:10:00',              8.0         UNION ALL
        SELECT '2026-05-19 07:45:00',              7.0         UNION ALL
        SELECT '2026-05-20 07:05:00',              6.5         UNION ALL
        SELECT '2026-05-21 07:35:00',              7.5
    ) AS d
) AS s;

-- Food logs
INSERT INTO food_logs
    (user_id, meal_date, logged_at, meal_type, food_name, serving_size,
     calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, source)
VALUES

-- May 8 (Thu) — light day ~1440 cal
(1,'2026-05-08','2026-05-08 07:35:00','breakfast','Greek Yogurt with Mixed Berries','1 cup yogurt, 1/2 cup berries',180,17,20,2,3,14,65,'manual'),
(1,'2026-05-08','2026-05-08 09:50:00','snack',    'Oat Milk Latte','12 oz',          90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-08','2026-05-08 12:30:00','lunch',    'Grilled Chicken Salad with Balsamic','large bowl',420,38,18,20,5, 7,580,'manual'),
(1,'2026-05-08','2026-05-08 15:30:00','snack',    'Hummus with Baby Carrots','1/3 cup hummus, 1 cup carrots',120,4,14,6,4,4,280,'manual'),
(1,'2026-05-08','2026-05-08 19:00:00','dinner',   'Baked Salmon with Roasted Broccoli and Sweet Potato','6 oz salmon, 1 cup broccoli, 1 small potato',490,42,32,22,7,10,520,'manual'),
(1,'2026-05-08','2026-05-08 20:45:00','snack',    'String Cheese','1 piece',         80, 6, 0, 5,0, 0,190,'manual'),

-- May 9 (Fri) — social Friday ~1850 cal
(1,'2026-05-09','2026-05-09 07:40:00','breakfast','Scrambled Eggs with Whole Wheat Toast','2 eggs, 1 slice toast',350,20,26,17,3,3,480,'manual'),
(1,'2026-05-09','2026-05-09 10:00:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-09','2026-05-09 12:45:00','lunch',    'Turkey and Avocado Sandwich','whole wheat, 4 oz turkey, 1/4 avocado',480,30,42,20,6,5,860,'manual'),
(1,'2026-05-09','2026-05-09 15:20:00','snack',    'Apple with Almond Butter','1 medium apple, 1 tbsp',195,4,25,9,4,17,55,'manual'),
(1,'2026-05-09','2026-05-09 19:15:00','dinner',   'Chicken Stir Fry with Brown Rice','1.5 cups rice, 5 oz chicken, mixed veg',520,38,54,14,6,12,840,'manual'),
(1,'2026-05-09','2026-05-09 21:00:00','snack',    'Dark Chocolate','2 squares 70%', 110, 1,12, 8,2, 9, 10,'manual'),

-- May 10 (Sat) — splurge day ~2020 cal
(1,'2026-05-10','2026-05-10 09:00:00','breakfast','Everything Bagel with Cream Cheese','1 bagel, 2 tbsp cream cheese',460,13,62,18,2,8,740,'manual'),
(1,'2026-05-10','2026-05-10 10:30:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-10','2026-05-10 13:30:00','lunch',    'Chicken Caesar Wrap','10 inch wrap, 4 oz chicken, romaine, dressing',520,34,44,22,3,4,980,'manual'),
(1,'2026-05-10','2026-05-10 16:00:00','snack',    'Chips','small bag (1 oz)',         150, 2,18, 8,1, 1,180,'manual'),
(1,'2026-05-10','2026-05-10 19:30:00','dinner',   'Homemade Cheese Pizza','2 slices',580,22,76,22,4,8,1200,'manual'),
(1,'2026-05-10','2026-05-10 21:30:00','snack',    'Banana','1 medium',               105, 1,27, 0,3,14,  1,'manual'),

-- May 11 (Sun) — reset day ~1490 cal
(1,'2026-05-11','2026-05-11 08:30:00','breakfast','Blueberry Protein Smoothie','1 scoop protein, 1 cup blueberries, almond milk',280,24,32,5,4,20,210,'manual'),
(1,'2026-05-11','2026-05-11 12:00:00','lunch',    'Lentil and Vegetable Soup','2 cups soup, 1 slice sourdough',380,16,58,6,14,8,720,'manual'),
(1,'2026-05-11','2026-05-11 15:00:00','snack',    'Mixed Nuts','1 oz',               170, 5, 6,15,2, 1, 95,'manual'),
(1,'2026-05-11','2026-05-11 18:45:00','dinner',   'Grilled Chicken with Steamed Broccoli and Quinoa','5 oz chicken, 1 cup broccoli, 3/4 cup quinoa',460,44,38,10,7,4,540,'manual'),
(1,'2026-05-11','2026-05-11 20:30:00','snack',    'String Cheese','1 piece',          80, 6, 0, 5,0, 0,190,'manual'),

-- May 12 (Mon) — productive day ~1730 cal
(1,'2026-05-12','2026-05-12 07:30:00','breakfast','Oatmeal with Banana and Honey','1 cup oats, 1 banana, 1 tsp honey',320,9,58,6,7,18,140,'manual'),
(1,'2026-05-12','2026-05-12 10:00:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-12','2026-05-12 12:30:00','lunch',    'Quinoa and Roasted Veggie Bowl','3/4 cup quinoa, 2 cups roasted vegetables, 2 tbsp tahini',450,16,62,16,9,10,480,'manual'),
(1,'2026-05-12','2026-05-12 15:30:00','snack',    'RxBar Chocolate Sea Salt','1 bar',210,12,23,9,5,13,260,'manual'),
(1,'2026-05-12','2026-05-12 19:00:00','dinner',   'Turkey Taco Bowl','4 oz turkey, 1/2 cup black beans, 1/3 cup corn, brown rice, salsa',560,36,52,20,10,8,880,'manual'),

-- May 13 (Tue) — leftovers day ~1590 cal
(1,'2026-05-13','2026-05-13 07:45:00','breakfast','Greek Yogurt with Mixed Berries','1 cup yogurt, 1/2 cup berries',180,17,20,2,3,14,65,'manual'),
(1,'2026-05-13','2026-05-13 09:55:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-13','2026-05-13 12:45:00','lunch',    'Leftover Grilled Chicken with Quinoa','5 oz chicken, 3/4 cup quinoa',320,30,18,16,5,6,400,'manual'),
(1,'2026-05-13','2026-05-13 15:15:00','snack',    'Apple with Almond Butter','1 medium apple, 1 tbsp',195,4,25,9,4,17,55,'manual'),
(1,'2026-05-13','2026-05-13 18:30:00','dinner',   'Chicken Stir Fry with Brown Rice','1.5 cups rice, 5 oz chicken, mixed veg',520,38,54,14,6,12,840,'manual'),
(1,'2026-05-13','2026-05-13 20:45:00','snack',    'Dark Chocolate','2 squares 70%', 110, 1,12, 8,2, 9, 10,'manual'),

-- May 14 (Wed) — active day ~1660 cal
(1,'2026-05-14','2026-05-14 07:20:00','breakfast','Avocado Toast with Poached Egg','1 slice sourdough, 1/2 avocado, 1 egg',380,16,34,22,8,3,380,'manual'),
(1,'2026-05-14','2026-05-14 12:00:00','lunch',    'Grilled Chicken Salad with Balsamic','large bowl',420,38,18,20,5,7,580,'manual'),
(1,'2026-05-14','2026-05-14 15:30:00','snack',    'Mixed Nuts','1 oz',               170, 5, 6,15,2, 1, 95,'manual'),
(1,'2026-05-14','2026-05-14 19:00:00','dinner',   'Shrimp Tacos','3 corn tortillas, 4 oz shrimp, cabbage slaw, lime crema',480,28,52,16,5,4,760,'manual'),
(1,'2026-05-14','2026-05-14 21:00:00','snack',    'RxBar Chocolate Sea Salt','1 bar',210,12,23,9,5,13,260,'manual'),

-- May 15 (Thu) — pasta night ~1570 cal
(1,'2026-05-15','2026-05-15 08:00:00','breakfast','Granola with Almond Milk and Strawberries','1/2 cup granola, 1 cup almond milk, 1/2 cup strawberries',310,8,46,10,4,22,120,'manual'),
(1,'2026-05-15','2026-05-15 10:15:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-15','2026-05-15 12:30:00','lunch',    'Lentil and Vegetable Soup','2 cups soup, 1 slice sourdough',380,16,58,6,14,8,720,'manual'),
(1,'2026-05-15','2026-05-15 15:00:00','snack',    'Hummus with Baby Carrots','1/3 cup hummus, 1 cup carrots',120,4,14,6,4,4,280,'manual'),
(1,'2026-05-15','2026-05-15 19:15:00','dinner',   'Pasta with Turkey Meatballs and Marinara','2 cups pasta, 4 meatballs, 1/2 cup sauce',580,32,82,16,6,14,780,'manual'),
(1,'2026-05-15','2026-05-15 21:00:00','snack',    'Dark Chocolate','2 squares 70%', 110, 1,12, 8,2, 9, 10,'manual'),

-- May 16 (Fri) — solid day ~1730 cal
(1,'2026-05-16','2026-05-16 07:30:00','breakfast','Scrambled Eggs with Whole Wheat Toast','2 eggs, 1 slice toast',350,20,26,17,3,3,480,'manual'),
(1,'2026-05-16','2026-05-16 10:00:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-16','2026-05-16 13:00:00','lunch',    'Chicken Caesar Wrap','10 inch wrap, 4 oz chicken, romaine, dressing',520,34,44,22,3,4,980,'manual'),
(1,'2026-05-16','2026-05-16 15:30:00','snack',    'Banana','1 medium',               105, 1,27, 0,3,14,  1,'manual'),
(1,'2026-05-16','2026-05-16 18:45:00','dinner',   'Baked Salmon with Roasted Broccoli and Sweet Potato','6 oz salmon, 1 cup broccoli, 1 small potato',490,42,32,22,7,10,520,'manual'),
(1,'2026-05-16','2026-05-16 20:30:00','snack',    'Mixed Nuts','1 oz',               170, 5, 6,15,2, 1, 95,'manual'),

-- May 17 (Sat) — treat yourself ~1830 cal
(1,'2026-05-17','2026-05-17 09:15:00','breakfast','Everything Bagel with Cream Cheese','1 bagel, 2 tbsp cream cheese',460,13,62,18,2,8,740,'manual'),
(1,'2026-05-17','2026-05-17 10:45:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-17','2026-05-17 13:30:00','lunch',    'Burrito Bowl','4 oz chicken, 1/2 cup rice, 1/2 cup black beans, salsa, guacamole',640,40,72,22,12,6,1100,'manual'),
(1,'2026-05-17','2026-05-17 16:30:00','snack',    'Chips','small bag (1 oz)',         150, 2,18, 8,1, 1,180,'manual'),
(1,'2026-05-17','2026-05-17 19:30:00','dinner',   'Grilled Chicken with Steamed Broccoli and Quinoa','5 oz chicken, 1 cup broccoli, 3/4 cup quinoa',460,44,38,10,7,4,540,'manual'),

-- May 18 (Sun) — clean eating ~1540 cal
(1,'2026-05-18','2026-05-18 08:00:00','breakfast','Blueberry Protein Smoothie','1 scoop protein, 1 cup blueberries, almond milk',280,24,32,5,4,20,210,'manual'),
(1,'2026-05-18','2026-05-18 12:30:00','lunch',    'Quinoa and Roasted Veggie Bowl','3/4 cup quinoa, 2 cups roasted vegetables, 2 tbsp tahini',450,16,62,16,9,10,480,'manual'),
(1,'2026-05-18','2026-05-18 15:00:00','snack',    'String Cheese','1 piece',          80, 6, 0, 5,0, 0,190,'manual'),
(1,'2026-05-18','2026-05-18 18:30:00','dinner',   'Turkey Taco Bowl','4 oz turkey, 1/2 cup black beans, 1/3 cup corn, brown rice, salsa',560,36,52,20,10,8,880,'manual'),
(1,'2026-05-18','2026-05-18 20:30:00','snack',    'Hummus with Baby Carrots','1/3 cup hummus, 1 cup carrots',120,4,14,6,4,4,280,'manual'),

-- May 19 (Mon) — back at it ~1720 cal
(1,'2026-05-19','2026-05-19 07:30:00','breakfast','Oatmeal with Banana and Honey','1 cup oats, 1 banana, 1 tsp honey',320,9,58,6,7,18,140,'manual'),
(1,'2026-05-19','2026-05-19 10:00:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-19','2026-05-19 12:45:00','lunch',    'Turkey and Avocado Sandwich','whole wheat, 4 oz turkey, 1/4 avocado',480,30,42,20,6,5,860,'manual'),
(1,'2026-05-19','2026-05-19 15:30:00','snack',    'Apple with Almond Butter','1 medium apple, 1 tbsp',195,4,25,9,4,17,55,'manual'),
(1,'2026-05-19','2026-05-19 19:00:00','dinner',   'Shrimp Tacos','3 corn tortillas, 4 oz shrimp, cabbage slaw, lime crema',480,28,52,16,5,4,760,'manual'),
(1,'2026-05-19','2026-05-19 21:00:00','snack',    'Dark Chocolate','2 squares 70%', 110, 1,12, 8,2, 9, 10,'manual'),

-- May 20 (Tue) — pizza Tuesday ~1590 cal
(1,'2026-05-20','2026-05-20 07:45:00','breakfast','Greek Yogurt with Mixed Berries','1 cup yogurt, 1/2 cup berries',180,17,20,2,3,14,65,'manual'),
(1,'2026-05-20','2026-05-20 09:55:00','snack',    'Oat Milk Latte','12 oz',           90, 2,14, 2,0, 8,140,'manual'),
(1,'2026-05-20','2026-05-20 12:30:00','lunch',    'Grilled Chicken Salad with Balsamic','large bowl',420,38,18,20,5,7,580,'manual'),
(1,'2026-05-20','2026-05-20 15:15:00','snack',    'RxBar Chocolate Sea Salt','1 bar',210,12,23,9,5,13,260,'manual'),
(1,'2026-05-20','2026-05-20 19:30:00','dinner',   'Homemade Cheese Pizza','2 slices',580,22,76,22,4,8,1200,'manual'),
(1,'2026-05-20','2026-05-20 21:00:00','snack',    'Dark Chocolate','2 squares 70%', 110, 1,12, 8,2, 9, 10,'manual'),

-- May 21 (Wed) — finishing strong ~1680 cal
(1,'2026-05-21','2026-05-21 07:30:00','breakfast','Avocado Toast with Poached Egg','1 slice sourdough, 1/2 avocado, 1 egg',380,16,34,22,8,3,380,'manual'),
(1,'2026-05-21','2026-05-21 12:00:00','lunch',    'Quinoa and Roasted Veggie Bowl','3/4 cup quinoa, 2 cups roasted vegetables, 2 tbsp tahini',450,16,62,16,9,10,480,'manual'),
(1,'2026-05-21','2026-05-21 15:00:00','snack',    'Mixed Nuts','1 oz',               170, 5, 6,15,2, 1, 95,'manual'),
(1,'2026-05-21','2026-05-21 18:45:00','dinner',   'Baked Salmon with Roasted Broccoli and Sweet Potato','6 oz salmon, 1 cup broccoli, 1 small potato',490,42,32,22,7,10,520,'manual'),
(1,'2026-05-21','2026-05-21 20:30:00','snack',    'Apple with Almond Butter','1 medium apple, 1 tbsp',195,4,25,9,4,17,55,'manual');
