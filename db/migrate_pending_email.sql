-- Pending-email migration: supports the "verify before switching" email change flow.
-- Run once after migrate_auth.sql.

ALTER TABLE users
  ADD COLUMN pending_email               VARCHAR(255) NULL AFTER last_login,
  ADD COLUMN pending_email_token         VARCHAR(100) NULL AFTER pending_email,
  ADD COLUMN pending_email_token_expires DATETIME     NULL AFTER pending_email_token;
