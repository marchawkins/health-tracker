-- Adds steps and sleep goals to user_profiles.
-- Run once on both local and production databases.

ALTER TABLE user_profiles
  ADD COLUMN goal_steps       SMALLINT UNSIGNED NULL AFTER goal_sodium_mg,
  ADD COLUMN goal_sleep_hours DECIMAL(4,1)      NULL AFTER goal_steps;
