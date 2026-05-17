-- Migration: add user_profiles table
-- Run once on your existing database.

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
