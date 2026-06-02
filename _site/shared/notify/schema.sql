-- schema.sql — your own subscriber + consent log.
-- Cloudflare D1 (SQLite) dialect. UUIDs are passed in as TEXT from the
-- Worker via crypto.randomUUID(); timestamps are ISO8601 strings.
--
-- Postgres equivalents are noted in comments for the eventual gov handoff
-- (where they'll likely run Postgres):
--   TEXT PRIMARY KEY                   ← UUID PRIMARY KEY DEFAULT gen_random_uuid()
--   TEXT (datetime('now'))             ← TIMESTAMPTZ DEFAULT now()
--   INTEGER PRIMARY KEY AUTOINCREMENT  ← BIGSERIAL PRIMARY KEY
--   TEXT (free-form JSON)              ← JSONB
--   TEXT (IP as string)                ← INET
--
-- The SCHEMA SHAPE is identical between dialects — only column types differ.
-- Migration to Postgres is a search-and-replace job, not a redesign.

-- ── subscribers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','unsubscribed','bounced')),
  frequency       TEXT NOT NULL DEFAULT 'immediate'
                  CHECK (frequency IN ('immediate','daily','weekly','monthly')),
  interests_text  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at    TEXT,
  unsubscribed_at TEXT,
  listmonk_id     INTEGER UNIQUE   -- dormant; reserved for future Listmonk integration
);

CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers(status);

-- ── subscriber_topics ───────────────────────────────────────────────────────
-- A subscriber's current opt-ins. Dotted topic form: "gov.county.sheriff".
CREATE TABLE IF NOT EXISTS subscriber_topics (
  subscriber_id  TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  topic          TEXT NOT NULL,
  subscribed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (subscriber_id, topic)
);

CREATE INDEX IF NOT EXISTS subscriber_topics_topic_idx ON subscriber_topics(topic);

-- ── consent_events ──────────────────────────────────────────────────────────
-- Append-only consent log. Never UPDATE or DELETE rows here.
-- Show this to a regulator if asked "prove this person opted in."
CREATE TABLE IF NOT EXISTS consent_events (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id         TEXT NOT NULL REFERENCES subscribers(id),
  event                 TEXT NOT NULL
                        CHECK (event IN ('subscribe','confirm','unsubscribe','bounce','admin_change')),
  topic                 TEXT,
  source                TEXT NOT NULL,
  ip                    TEXT,
  user_agent            TEXT,
  consent_text_version  TEXT NOT NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS consent_events_subscriber_idx
  ON consent_events(subscriber_id, created_at DESC);

-- ── pending_notifications ───────────────────────────────────────────────────
-- Empty in v1 — only 'immediate' frequency is honored. Schema is here so the
-- digest worker can be added later without a migration.
CREATE TABLE IF NOT EXISTS pending_notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id   TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  topic           TEXT NOT NULL,
  workflow        TEXT NOT NULL,
  payload         TEXT NOT NULL,
  scheduled_for   TEXT NOT NULL,
  delivered_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS pending_notifications_due_idx
  ON pending_notifications(scheduled_for) WHERE delivered_at IS NULL;

-- ── consent_text_versions ───────────────────────────────────────────────────
-- Frozen copies of the consent text the user actually saw.
-- Bump version + insert a new row whenever the wording changes.
CREATE TABLE IF NOT EXISTS consent_text_versions (
  version    TEXT PRIMARY KEY,
  body       TEXT NOT NULL,
  effective  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the current version so consent_events.consent_text_version FK-style
-- references resolve. (No actual FK — D1 doesn't enforce them with the same
-- strictness as Postgres, but keeping the row is hygienic.)
INSERT OR IGNORE INTO consent_text_versions (version, body) VALUES (
  '2026-04-30-v1',
  'By subscribing you agree to receive emails about the topics you selected. We will send a confirmation link first to verify your address. You can update or unsubscribe at any time using the link in every email.'
);
