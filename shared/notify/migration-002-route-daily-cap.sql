-- migration-002-route-daily-cap.sql — adds a daily counter for /api/route
-- calls so the worker can enforce a hard global cap independent of per-IP
-- rate limiting.
--
-- Run once:
--   wrangler d1 execute notify --remote --file shared/notify/migration-002-route-daily-cap.sql
--
-- Local dev:
--   wrangler d1 execute notify --local --file shared/notify/migration-002-route-daily-cap.sql
--
-- Why a counter instead of relying on Workers Rate Limiting bindings:
-- Workers Rate Limiting only supports periods of 10s, 60s, 600s, and 3600s
-- as of 2026 — no 24h option. A D1 row keyed on the UTC date gives us a
-- true daily cap that resets at midnight UTC, regardless of how many IPs
-- hit the endpoint.

CREATE TABLE IF NOT EXISTS route_daily_usage (
  -- ISO date string, UTC. Format: YYYY-MM-DD.
  date         TEXT PRIMARY KEY,
  -- Number of successful Workers AI calls that day. Rejected calls
  -- (rate-limit, turnstile-failed, bad request) are NOT counted — only
  -- calls that would have cost Neurons.
  call_count   INTEGER NOT NULL DEFAULT 0,
  -- Wallclock of the first call that day, for observability.
  first_call_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  -- Wallclock of the most recent call that day.
  last_call_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Index on date is the PK, no extra index needed. Reads are point lookups.
