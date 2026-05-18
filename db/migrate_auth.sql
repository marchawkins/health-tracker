-- Auth migration: adds authentication columns to users table.
-- Run once on both local and production databases.

ALTER TABLE users
  ADD COLUMN password_hash              VARCHAR(255) NULL         AFTER email,
  ADD COLUMN email_verified             TINYINT(1)   NOT NULL DEFAULT 0 AFTER password_hash,
  ADD COLUMN verification_token         VARCHAR(100) NULL         AFTER email_verified,
  ADD COLUMN verification_token_expires DATETIME     NULL         AFTER verification_token,
  ADD COLUMN reset_token                VARCHAR(100) NULL         AFTER verification_token_expires,
  ADD COLUMN reset_token_expires        DATETIME     NULL         AFTER reset_token,
  ADD COLUMN last_login                 DATETIME     NULL         AFTER reset_token_expires;

-- Set password for marc's user (temporary password: 'ChangeMe123!') and mark email verified.
UPDATE users
SET
  password_hash  = '$2y$12$Zh5E/3pm7535EwblbQEWweG2N6Aj0x9ngJg6.nFQUFoeaop85mrj.',
  email_verified = 1
WHERE id = 1;
