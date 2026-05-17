-- Health Tracker Schema
-- Run once on your Hostinger MySQL database.

CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255)     NOT NULL UNIQUE,
  display_name VARCHAR(100),
  created_at   DATETIME         DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, email, display_name) VALUES (1, 'marc@marchawkins.com', 'Marc')
ON DUPLICATE KEY UPDATE id = id;


CREATE TABLE IF NOT EXISTS food_logs (
  id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED     NOT NULL,
  meal_date        DATE             NOT NULL,
  logged_at        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meal_type        ENUM('breakfast','lunch','dinner','snack') DEFAULT 'snack',
  food_name        VARCHAR(255)     NOT NULL,
  serving_size     VARCHAR(100),
  calories         DECIMAL(7,1)     NOT NULL,
  protein_g        DECIMAL(6,2),
  carbs_g          DECIMAL(6,2),
  fat_g            DECIMAL(6,2),
  fiber_g          DECIMAL(6,2),
  sodium_mg        DECIMAL(7,1),
  source           ENUM('manual','openfoodfacts') DEFAULT 'manual',
  off_barcode      VARCHAR(50),
  off_product_id   VARCHAR(100),
  notes            TEXT,
  created_at       DATETIME         DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, meal_date)
);


CREATE TABLE IF NOT EXISTS weight_logs (
  id           INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED     NOT NULL,
  logged_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  weight       DECIMAL(5,1)     NOT NULL,
  unit         ENUM('lbs','kg') DEFAULT 'lbs',
  body_fat_pct DECIMAL(4,1),
  notes        TEXT,
  created_at   DATETIME         DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, logged_at)
);


CREATE TABLE IF NOT EXISTS user_profiles (
  id             INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED  NOT NULL,
  display_name   VARCHAR(100),
  age            TINYINT UNSIGNED,
  sex            ENUM('male','female'),
  units          ENUM('imperial','metric') NOT NULL DEFAULT 'imperial',
  height_ft      TINYINT UNSIGNED,
  height_in      TINYINT UNSIGNED,
  height_cm      DECIMAL(5,1),
  goal_weight    DECIMAL(5,1),
  activity_level VARCHAR(20)   NOT NULL DEFAULT 'sedentary',
  goal           VARCHAR(10)   NOT NULL DEFAULT 'maintain',
  goal_calories  SMALLINT UNSIGNED,
  goal_carbs_g   SMALLINT UNSIGNED,
  goal_fat_g     SMALLINT UNSIGNED,
  goal_protein_g SMALLINT UNSIGNED,
  goal_fiber_g   SMALLINT UNSIGNED,
  goal_sodium_mg SMALLINT UNSIGNED,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_profiles_user (user_id)
);


CREATE TABLE IF NOT EXISTS metric_definitions (
  id             INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED,
  slug           VARCHAR(50)      NOT NULL UNIQUE,
  label          VARCHAR(100)     NOT NULL,
  unit           VARCHAR(30),
  data_type      ENUM('integer','decimal','text','boolean') DEFAULT 'decimal',
  icon           VARCHAR(10),
  display_order  TINYINT          DEFAULT 0,
  is_active      BOOLEAN          DEFAULT TRUE,
  created_at     DATETIME         DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO metric_definitions (user_id, slug, label, unit, data_type, icon, display_order) VALUES
  (NULL, 'steps',            'Steps',    'steps',   'integer', '👟', 1),
  (NULL, 'sleep_hours',      'Sleep',    'hours',   'decimal', '😴', 2),
  (NULL, 'mood',             'Mood',     '1-10',    'integer', '😊', 3),
  (NULL, 'water_oz',         'Water',    'oz',      'decimal', '💧', 4),
  (NULL, 'exercise_minutes', 'Exercise', 'minutes', 'integer', '🏃', 5)
ON DUPLICATE KEY UPDATE id = id;


CREATE TABLE IF NOT EXISTS metric_logs (
  id                    INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id               INT UNSIGNED  NOT NULL,
  metric_definition_id  INT UNSIGNED  NOT NULL,
  logged_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  value_numeric         DECIMAL(10,3),
  value_text            TEXT,
  notes                 TEXT,
  created_at            DATETIME      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_metric_date (user_id, metric_definition_id, logged_at)
);
