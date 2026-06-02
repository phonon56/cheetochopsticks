-- pilot-queries.sql — read-only queries for the "watch and decide" period.
--
-- After 1–2 weeks of real subscriptions, run these to decide:
--   • Should we build a keyword-based interpreter?
--   • An LLM-based one?
--   • Or just create new topics from the patterns we see?
--
-- All queries are read-only and safe to run repeatedly:
--   wrangler d1 execute notify --command "$(cat shared/notify/pilot-queries.sql)"
-- or run individual blocks via:
--   wrangler d1 execute notify --command "<paste one block here>"

-- ── 1. Headline: how many people subscribed, how many confirmed ──────
SELECT
  status,
  COUNT(*) AS n,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM subscribers
GROUP BY status
ORDER BY n DESC;

-- ── 2. Topic popularity — what people actually pick ──────────────────
SELECT
  topic,
  COUNT(*) AS subscribers
FROM subscriber_topics st
JOIN subscribers s ON s.id = st.subscriber_id
WHERE s.status = 'confirmed'
GROUP BY topic
ORDER BY subscribers DESC;

-- ── 3. Frequency distribution — do people want digests? ──────────────
SELECT
  frequency,
  COUNT(*) AS n
FROM subscribers
WHERE status = 'confirmed'
GROUP BY frequency;

-- ── 4. The whole point: what people typed in the interests box ───────
-- Look for patterns. If you see the same word/phrase 3+ times, it's
-- probably a topic you should create.
SELECT
  s.email,
  s.interests_text,
  GROUP_CONCAT(st.topic, ', ') AS topics_picked
FROM subscribers s
LEFT JOIN subscriber_topics st ON st.subscriber_id = s.id
WHERE s.interests_text IS NOT NULL
  AND LENGTH(TRIM(s.interests_text)) > 0
GROUP BY s.id
ORDER BY s.created_at DESC;

-- ── 5. Mismatch: people who wrote interests but picked NO topics ─────
-- These are your highest-signal entries — they wanted to subscribe but
-- didn't see a topic that fit.
SELECT
  s.email,
  s.interests_text,
  s.created_at
FROM subscribers s
LEFT JOIN subscriber_topics st ON st.subscriber_id = s.id
WHERE s.interests_text IS NOT NULL
  AND LENGTH(TRIM(s.interests_text)) > 0
  AND st.subscriber_id IS NULL
ORDER BY s.created_at DESC;

-- ── 6. Topic gaps: which agencies' microsites get visits but no subs? ─
-- Cross-reference with your analytics to find pages with traffic but
-- zero subscriptions — usually means the topic name isn't intuitive.
SELECT
  topic,
  COUNT(DISTINCT subscriber_id) AS confirmed_subs
FROM subscriber_topics st
JOIN subscribers s ON s.id = st.subscriber_id
WHERE s.status = 'confirmed'
GROUP BY topic
HAVING confirmed_subs = 0;

-- ── 7. Co-subscription patterns — who picks what together? ───────────
-- If "city.police" and "city.coraform" almost always co-occur, you
-- might want to suggest one when the other is picked.
WITH pairs AS (
  SELECT
    a.topic AS topic_a,
    b.topic AS topic_b,
    COUNT(*) AS together
  FROM subscriber_topics a
  JOIN subscriber_topics b
    ON a.subscriber_id = b.subscriber_id
   AND a.topic < b.topic
  GROUP BY a.topic, b.topic
)
SELECT * FROM pairs
WHERE together >= 3
ORDER BY together DESC
LIMIT 25;

-- ── 8. Funnel — where people drop off ────────────────────────────────
-- Confirms how well the double-opt-in email is working.
SELECT
  COUNT(*) FILTER (WHERE status = 'pending')      AS never_confirmed,
  COUNT(*) FILTER (WHERE status = 'confirmed')    AS confirmed,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') AS unsubscribed,
  COUNT(*) FILTER (WHERE status = 'bounced')      AS bounced,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*), 1) AS confirm_rate_pct
FROM subscribers;

-- ── 9. Recent consent activity — sanity check the audit trail ────────
SELECT
  ce.created_at,
  ce.event,
  ce.topic,
  ce.source,
  s.email
FROM consent_events ce
JOIN subscribers s ON s.id = ce.subscriber_id
ORDER BY ce.created_at DESC
LIMIT 20;
