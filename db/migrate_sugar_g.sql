-- Migration: add sugar_g tracking
-- Run once on your Hostinger MySQL database.

ALTER TABLE food_logs
  ADD COLUMN sugar_g DECIMAL(6,2) AFTER fiber_g;

ALTER TABLE user_profiles
  ADD COLUMN goal_sugar_g SMALLINT UNSIGNED AFTER goal_sodium_mg;
