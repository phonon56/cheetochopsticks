-- migration-001-digests.sql — adds per-user timezone + last-sent tracking
-- so the digest job can know when to deliver and avoid double-sends.
--
-- Run once:
--   wrangler d1 execute notify --remote --file shared/notify/migration-001-digests.sql

ALTER TABLE subscribers ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Denver';
ALTER TABLE subscribers ADD COLUMN last_daily_digest_at   TEXT;
ALTER TABLE subscribers ADD COLUMN last_weekly_digest_at  TEXT;
ALTER TABLE subscribers ADD COLUMN last_monthly_digest_at TEXT;

CREATE INDEX IF NOT EXISTS subscribers_digest_due_idx
  ON subscribers(status, frequency)
  WHERE status = 'confirmed' AND frequency != 'immediate';
