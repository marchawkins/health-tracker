-- USDA query cache: stores API responses for 90 days to avoid repeated outbound calls.
-- Run once on both local and production databases.

CREATE TABLE IF NOT EXISTS usda_cache (
  query        VARCHAR(255) NOT NULL,
  results_json TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (query)
);
