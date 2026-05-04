// subscribe-worker.js — Cloudflare Worker.
//
// All-in-Cloudflare deployment. Email transit is Resend (SaaS); everything
// else (subscriber identity, consent log, preference center, admin send) is
// served from this Worker against D1.
//
// Routes:
//   POST  /api/subscribe                — citizen-facing subscribe form
//   GET   /api/confirm?t=<token>        — double-opt-in landing
//   GET   /api/unsubscribe?t=<token>    — one-click unsubscribe (email footer link)
//   POST  /api/preferences/request      — magic-link flow start
//   GET   /api/preferences?t=<token>    — read current state
//   POST  /api/preferences?t=<token>    — save changes
//   POST  /api/admin/send               — blast a topic (Bearer ADMIN_TOKEN)
//   POST  /api/resend-webhook           — Resend → us, for bounces/complaints
//
// Required wrangler.jsonc bindings:
//   "main": "shared/notify/subscribe-worker.js"
//   "assets": { "directory": "_site", "binding": "ASSETS" }
//   "d1_databases": [{ "binding": "DB", "database_name": "notify",
//                      "database_id": "<from `wrangler d1 create notify`>" }]
//   "vars": {
//     "PUBLIC_ORIGIN": "https://cheetochopsticks.com",
//     "FROM_ADDRESS":  "notifications@cheetochopsticks.com",
//     "FROM_NAME":     "CheetoChopsticks Notifications",
//     "DEV_MODE":      "0"
//   }
//
// Required secrets (wrangler secret put):
//   RESEND_API_KEY          — from resend.com/api-keys
//   RESEND_WEBHOOK_SECRET   — from Resend webhook config (Svix)
//   PREFS_TOKEN_SECRET      — any long random string
//   ADMIN_TOKEN             — any long random string
//
// Optional secrets:
//   none

const ALLOWED_ORIGINS = new Set([
  'https://cheetochopsticks.com',
  'https://www.cheetochopsticks.com',
  'http://localhost:8080',  // eleventy --serve
  'http://localhost:8787',  // wrangler dev
]);

const CONSENT_VERSION       = '2026-04-30-v1';
const PREFS_TOKEN_TTL       = 7 * 24 * 60 * 60;   // 7 days
const CONFIRM_TOKEN_TTL     = 14 * 24 * 60 * 60;  // 14 days
const UNSUB_TOKEN_TTL       = 365 * 24 * 60 * 60; // 1 year
const ADMIN_BATCH_SIZE      = 100;                // Resend's per-call limit

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/api/subscribe':           return handleSubscribe(request, env);
      case '/api/confirm':             return handleConfirm(request, env, url);
      case '/api/unsubscribe':         return handleUnsubscribe(request, env, url);
      case '/api/preferences/request': return handlePrefsRequest(request, env);
      case '/api/preferences':         return handlePrefs(request, env, url);
      case '/api/admin/send':          return handleAdminSend(request, env);
      case '/api/resend-webhook':      return handleResendWebhook(request, env);
      default:
        return env.ASSETS.fetch(request);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDigestDelivery(event, env));
  },
};

// ─── /api/subscribe ────────────────────────────────────────────────────────

async function handleSubscribe(request, env) {
  const cors = corsFor(request);
  if (request.method === 'OPTIONS') return preflight(cors, 'POST');
  if (request.method !== 'POST')    return new Response('method not allowed', { status: 405 });

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, cors); }

  const email   = String(body.email || '').trim().toLowerCase();
  const source  = String(body.source || '').trim();
  const topics  = Array.isArray(body.topics) && body.topics.length
    ? body.topics
    : (body.topic ? [body.topic] : []);
  const frequency     = ['immediate','daily','weekly','monthly'].includes(body.frequency)
    ? body.frequency : 'immediate';
  const interestsText = String(body.interests_text || '').slice(0, 1000);
  const timezone      = validTimezone(body.timezone);

  if (!emailValid(email))    return json({ error: 'invalid email' }, 400, cors);
  if (!topics.length)         return json({ error: 'no topics selected' }, 400, cors);
  for (const t of topics) {
    if (!topicValid(t))       return json({ error: 'invalid topic: ' + t }, 400, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';

  // Upsert subscriber.
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO subscribers (id, email, status, frequency, interests_text, timezone)
    VALUES (?1, ?2, 'pending', ?3, ?4, ?5)
    ON CONFLICT(email) DO UPDATE SET
      frequency = excluded.frequency,
      interests_text = COALESCE(NULLIF(excluded.interests_text, ''), subscribers.interests_text),
      timezone = excluded.timezone
  `).bind(id, email, frequency, interestsText, timezone).run();

  const row = await env.DB.prepare(`SELECT id, status FROM subscribers WHERE email = ?1`).bind(email).first();
  const subscriberId = row.id;

  // Record opt-ins + consent events.
  const stmts = [];
  for (const t of topics) {
    stmts.push(env.DB.prepare(
      `INSERT OR IGNORE INTO subscriber_topics (subscriber_id, topic) VALUES (?1, ?2)`
    ).bind(subscriberId, t));
    stmts.push(env.DB.prepare(`
      INSERT INTO consent_events (subscriber_id, event, topic, source, ip, user_agent, consent_text_version)
      VALUES (?1, 'subscribe', ?2, ?3, ?4, ?5, ?6)
    `).bind(subscriberId, t, source, ip, ua, CONSENT_VERSION));
  }
  await env.DB.batch(stmts);

  // If they're already confirmed, don't make them re-confirm.
  if (row.status === 'confirmed') {
    return json({ ok: true, message: 'You\'re already subscribed. We added these topics.' }, 200, cors);
  }

  // Send double-opt-in confirmation via Resend.
  const confirmToken = await signToken(
    { sub: subscriberId, purpose: 'confirm', exp: nowSec() + CONFIRM_TOKEN_TTL },
    env.PREFS_TOKEN_SECRET
  );
  const confirmUrl = `${env.PUBLIC_ORIGIN}/api/confirm?t=${confirmToken}`;
  const prefsToken = await signToken(
    { sub: subscriberId, exp: nowSec() + PREFS_TOKEN_TTL },
    env.PREFS_TOKEN_SECRET
  );
  const prefsUrl = `${env.PUBLIC_ORIGIN}/preferences/?t=${prefsToken}`;

  await sendEmail(env, {
    to: email,
    subject: 'Confirm your subscription',
    html: confirmEmailHtml(confirmUrl, prefsUrl, topics, frequency, interestsText),
    text: confirmEmailText(confirmUrl, prefsUrl, topics, frequency, interestsText),
  }).catch((e) => console.log('resend send failed', e?.message));

  return json({
    ok: true,
    message: 'Check your email for a confirmation link.',
    ...(env.DEV_MODE === '1' ? { dev_confirm_url: confirmUrl } : {}),
  }, 200, cors);
}

// ─── /api/confirm ───────────────────────────────────────────────────────────

async function handleConfirm(request, env, url) {
  const token  = url.searchParams.get('t') || '';
  const claims = await verifyToken(token, env.PREFS_TOKEN_SECRET);
  if (!claims || claims.purpose !== 'confirm') {
    return htmlPage('Confirmation link invalid or expired',
      'This link has expired or already been used. <a href="/preferences/?manage=1">Request a new sign-in link</a>.');
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(`
      UPDATE subscribers SET status='confirmed', confirmed_at=?2
      WHERE id=?1 AND status != 'unsubscribed'
    `).bind(claims.sub, now),
    env.DB.prepare(`
      INSERT INTO consent_events (subscriber_id, event, source, ip, user_agent, consent_text_version)
      VALUES (?1, 'confirm', 'confirm-link', ?2, ?3, ?4)
    `).bind(claims.sub, ip, ua, CONSENT_VERSION),
  ]);

  // Issue a fresh prefs token so the redirect lands them on a working manage page.
  const prefsToken = await signToken(
    { sub: claims.sub, exp: nowSec() + PREFS_TOKEN_TTL },
    env.PREFS_TOKEN_SECRET
  );
  return Response.redirect(`${env.PUBLIC_ORIGIN}/preferences/?t=${prefsToken}&confirmed=1`, 302);
}

// ─── /api/unsubscribe ───────────────────────────────────────────────────────
// One-click unsubscribe link, included in every outgoing email's footer.
// RFC 8058 List-Unsubscribe-Post compatible (POST-unsubscribe with no body).

async function handleUnsubscribe(request, env, url) {
  const token  = url.searchParams.get('t') || '';
  const claims = await verifyToken(token, env.PREFS_TOKEN_SECRET);
  if (!claims || claims.purpose !== 'unsub') {
    return htmlPage('Unsubscribe link invalid or expired',
      'This link is no longer valid. <a href="/preferences/?manage=1">Manage your subscriptions →</a>');
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  const now = new Date().toISOString();
  const topic = claims.topic || null;

  if (topic) {
    // Topic-level unsubscribe.
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM subscriber_topics WHERE subscriber_id=?1 AND topic=?2`)
        .bind(claims.sub, topic),
      env.DB.prepare(`
        INSERT INTO consent_events (subscriber_id, event, topic, source, ip, user_agent, consent_text_version)
        VALUES (?1, 'unsubscribe', ?2, 'email-footer', ?3, ?4, ?5)
      `).bind(claims.sub, topic, ip, ua, CONSENT_VERSION),
    ]);
  } else {
    // Global unsubscribe.
    await env.DB.batch([
      env.DB.prepare(`UPDATE subscribers SET status='unsubscribed', unsubscribed_at=?2 WHERE id=?1`)
        .bind(claims.sub, now),
      env.DB.prepare(`DELETE FROM subscriber_topics WHERE subscriber_id=?1`).bind(claims.sub),
      env.DB.prepare(`
        INSERT INTO consent_events (subscriber_id, event, source, ip, user_agent, consent_text_version)
        VALUES (?1, 'unsubscribe', 'email-footer', ?2, ?3, ?4)
      `).bind(claims.sub, ip, ua, CONSENT_VERSION),
    ]);
  }

  return htmlPage('Unsubscribed',
    `You've been unsubscribed${topic ? ` from <code>${escapeHtml(topic)}</code>` : ''}. ` +
    `<a href="/preferences/?manage=1">Manage all your subscriptions →</a>`);
}

// ─── /api/preferences/request — magic link ──────────────────────────────────

async function handlePrefsRequest(request, env) {
  const cors = corsFor(request);
  if (request.method === 'OPTIONS') return preflight(cors, 'POST');
  if (request.method !== 'POST')    return new Response('method not allowed', { status: 405 });

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, cors); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!emailValid(email)) return json({ error: 'invalid email' }, 400, cors);

  const sub = await env.DB.prepare(`SELECT id, status FROM subscribers WHERE email = ?1`).bind(email).first();

  if (!sub || sub.status === 'unsubscribed') {
    // Don't reveal whether the email exists (anti-enumeration).
    return json({ ok: true, message: 'If that email exists, we sent a link.' }, 200, cors);
  }

  const token = await signToken({ sub: sub.id, exp: nowSec() + PREFS_TOKEN_TTL }, env.PREFS_TOKEN_SECRET);
  const link = `${env.PUBLIC_ORIGIN}/preferences/?t=${token}`;

  await sendEmail(env, {
    to: email,
    subject: 'Manage your subscriptions',
    html: magicLinkHtml(link),
    text: magicLinkText(link),
  }).catch((e) => console.log('resend send failed', e?.message));

  return json({
    ok: true,
    message: 'Check your email for a link to manage your subscriptions.',
    ...(env.DEV_MODE === '1' ? { dev_link: link } : {}),
  }, 200, cors);
}

// ─── /api/preferences GET / POST ────────────────────────────────────────────

async function handlePrefs(request, env, url) {
  const cors = corsFor(request);
  if (request.method === 'OPTIONS') return preflight(cors, 'GET,POST');

  const token = url.searchParams.get('t') || '';
  const claims = await verifyToken(token, env.PREFS_TOKEN_SECRET);
  if (!claims) return json({ error: 'invalid or expired link' }, 401, cors);
  const subscriberId = claims.sub;

  if (request.method === 'GET') {
    const sub = await env.DB.prepare(
      `SELECT email, status, frequency, interests_text FROM subscribers WHERE id = ?1`
    ).bind(subscriberId).first();
    if (!sub) return json({ error: 'subscriber not found' }, 404, cors);
    const rows = await env.DB.prepare(
      `SELECT topic FROM subscriber_topics WHERE subscriber_id = ?1`
    ).bind(subscriberId).all();
    return json({
      email: sub.email,
      status: sub.status,
      frequency: sub.frequency,
      interests_text: sub.interests_text || '',
      topics: rows.results.map((r) => r.topic),
    }, 200, cors);
  }

  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, cors); }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  const now = new Date().toISOString();

  if (body.unsubscribe_all === true) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE subscribers SET status='unsubscribed', unsubscribed_at=?2 WHERE id=?1`)
        .bind(subscriberId, now),
      env.DB.prepare(`DELETE FROM subscriber_topics WHERE subscriber_id=?1`).bind(subscriberId),
      env.DB.prepare(`
        INSERT INTO consent_events (subscriber_id, event, source, ip, user_agent, consent_text_version)
        VALUES (?1, 'unsubscribe', 'preferences-page', ?2, ?3, ?4)
      `).bind(subscriberId, ip, ua, CONSENT_VERSION),
    ]);
    return json({ ok: true, message: 'Unsubscribed from everything.' }, 200, cors);
  }

  const topics    = Array.isArray(body.topics) ? body.topics.filter(topicValid) : [];
  const frequency = ['immediate','daily','weekly','monthly'].includes(body.frequency)
    ? body.frequency : 'immediate';
  const interests = String(body.interests_text || '').slice(0, 1000);

  const cur = await env.DB.prepare(`SELECT topic FROM subscriber_topics WHERE subscriber_id=?1`)
    .bind(subscriberId).all();
  const before = new Set(cur.results.map((r) => r.topic));
  const after  = new Set(topics);
  const added   = [...after].filter((t) => !before.has(t));
  const removed = [...before].filter((t) => !after.has(t));

  const tz = validTimezone(body.timezone);
  const stmts = [
    env.DB.prepare(`UPDATE subscribers SET frequency=?2, interests_text=?3, timezone=?4 WHERE id=?1`)
      .bind(subscriberId, frequency, interests, tz),
  ];
  for (const t of removed) {
    stmts.push(env.DB.prepare(`DELETE FROM subscriber_topics WHERE subscriber_id=?1 AND topic=?2`)
      .bind(subscriberId, t));
    stmts.push(env.DB.prepare(`
      INSERT INTO consent_events (subscriber_id, event, topic, source, ip, user_agent, consent_text_version)
      VALUES (?1, 'unsubscribe', ?2, 'preferences-page', ?3, ?4, ?5)
    `).bind(subscriberId, t, ip, ua, CONSENT_VERSION));
  }
  for (const t of added) {
    stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO subscriber_topics (subscriber_id, topic) VALUES (?1, ?2)`)
      .bind(subscriberId, t));
    stmts.push(env.DB.prepare(`
      INSERT INTO consent_events (subscriber_id, event, topic, source, ip, user_agent, consent_text_version)
      VALUES (?1, 'subscribe', ?2, 'preferences-page', ?3, ?4, ?5)
    `).bind(subscriberId, t, ip, ua, CONSENT_VERSION));
  }
  await env.DB.batch(stmts);

  return json({ ok: true, added: added.length, removed: removed.length, frequency, interests_text: interests }, 200, cors);
}

// ─── /api/admin/send — blast a topic ────────────────────────────────────────
// Auth: Authorization: Bearer <ADMIN_TOKEN>
// Body: { topic, subject, html, text? }

async function handleAdminSend(request, env) {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const auth = request.headers.get('Authorization') || '';
  const expected = 'Bearer ' + (env.ADMIN_TOKEN || '');
  if (!env.ADMIN_TOKEN || !timingSafeEqual(auth, expected)) {
    return new Response('unauthorized', { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
  const topic   = String(body.topic || '');
  const subject = String(body.subject || '');
  const html    = String(body.html || '');
  const text    = String(body.text || '');

  if (!topicValid(topic)) return json({ error: 'invalid topic' }, 400);
  if (!subject || (!html && !text)) return json({ error: 'subject and html/text required' }, 400);

  // Find ALL confirmed subscribers for this topic (we'll split by frequency).
  const subs = await env.DB.prepare(`
    SELECT s.id, s.email, s.frequency
    FROM subscribers s
    JOIN subscriber_topics st ON st.subscriber_id = s.id
    WHERE st.topic = ?1
      AND s.status = 'confirmed'
  `).bind(topic).all();

  if (!subs.results.length) {
    return json({ ok: true, sent: 0, queued: 0, message: 'No confirmed subscribers for this topic.' });
  }

  const immediate = subs.results.filter((s) => s.frequency === 'immediate');
  const queued    = subs.results.filter((s) => s.frequency !== 'immediate');

  // Queue digest deliveries for non-immediate subscribers.
  let queuedCount = 0;
  if (queued.length) {
    const payload = JSON.stringify({ subject, html, text });
    const now = new Date().toISOString();
    const stmts = queued.map((s) => env.DB.prepare(`
      INSERT INTO pending_notifications (subscriber_id, topic, workflow, payload, scheduled_for)
      VALUES (?1, ?2, 'admin-send', ?3, ?4)
    `).bind(s.id, topic, payload, now));
    // D1 batch limit is 100 statements per call.
    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
      queuedCount += Math.min(100, stmts.length - i);
    }
  }

  if (!immediate.length) {
    return json({
      ok: true, topic, eligible: subs.results.length,
      sent: 0, queued: queuedCount, failed: 0,
      message: `Queued ${queuedCount} digest deliveries; no immediate subscribers.`
    });
  }

  // Render per-recipient and batch (immediate only).
  let sent = 0, failed = 0;
  for (let i = 0; i < immediate.length; i += ADMIN_BATCH_SIZE) {
    const batch = immediate.slice(i, i + ADMIN_BATCH_SIZE);
    const renderedBatch = await Promise.all(batch.map(async (s) => {
      const unsubToken = await signToken(
        { sub: s.id, purpose: 'unsub', topic, exp: nowSec() + UNSUB_TOKEN_TTL },
        env.PREFS_TOKEN_SECRET
      );
      const unsubUrl = `${env.PUBLIC_ORIGIN}/api/unsubscribe?t=${unsubToken}`;
      const prefsToken = await signToken(
        { sub: s.id, exp: nowSec() + PREFS_TOKEN_TTL },
        env.PREFS_TOKEN_SECRET
      );
      const prefsUrl = `${env.PUBLIC_ORIGIN}/preferences/?t=${prefsToken}`;

      return {
        from: `${env.FROM_NAME} <${env.FROM_ADDRESS}>`,
        to: s.email,
        subject,
        html: html
          ? withFooter(html, topic, prefsUrl, unsubUrl, true)
          : undefined,
        text: text
          ? withFooter(text, topic, prefsUrl, unsubUrl, false)
          : undefined,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe+${s.id}@${(env.FROM_ADDRESS || '').split('@')[1] || ''}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    }));

    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(renderedBatch),
    });
    if (r.ok) sent += renderedBatch.length;
    else      failed += renderedBatch.length;
  }

  return json({ ok: true, topic, eligible: subs.results.length, sent, queued: queuedCount, failed });
}

// ─── Scheduled digest delivery ──────────────────────────────────────────────
// Runs hourly. For each non-immediate subscriber whose local time is 8 AM
// today, who's "due" for their cadence, and who has un-delivered queued
// notices, render a per-topic digest and send it. Skip if queue is empty.

async function runDigestDelivery(event, env) {
  const now = new Date(event?.scheduledTime || Date.now());

  const subs = await env.DB.prepare(`
    SELECT id, email, frequency, timezone,
           last_daily_digest_at, last_weekly_digest_at, last_monthly_digest_at
    FROM subscribers
    WHERE status = 'confirmed' AND frequency != 'immediate'
  `).all();

  let processed = 0, skipped = 0, sent = 0, failed = 0;
  for (const sub of subs.results) {
    processed++;
    const tz = sub.timezone || 'America/Denver';
    const local = localParts(now, tz);
    if (!local || local.hour !== 8) { skipped++; continue; }

    if (sub.frequency === 'weekly'  && local.weekday !== 4) { skipped++; continue; } // Thursday
    if (sub.frequency === 'monthly' && local.day !== 1)     { skipped++; continue; } // 1st of month

    if (alreadySentForCadence(sub, local)) { skipped++; continue; }

    const pending = await env.DB.prepare(`
      SELECT id, topic, payload, created_at
      FROM pending_notifications
      WHERE subscriber_id = ?1 AND delivered_at IS NULL
      ORDER BY topic, created_at
    `).bind(sub.id).all();

    if (!pending.results.length) { skipped++; continue; }  // skip-if-empty

    const prefsToken = await signToken(
      { sub: sub.id, exp: nowSec() + PREFS_TOKEN_TTL },
      env.PREFS_TOKEN_SECRET
    );
    const unsubToken = await signToken(
      { sub: sub.id, purpose: 'unsub', exp: nowSec() + UNSUB_TOKEN_TTL },
      env.PREFS_TOKEN_SECRET
    );
    const prefsUrl = `${env.PUBLIC_ORIGIN}/preferences/?t=${prefsToken}`;
    const unsubUrl = `${env.PUBLIC_ORIGIN}/api/unsubscribe?t=${unsubToken}`;

    try {
      await sendEmail(env, {
        to: sub.email,
        subject: digestSubject(sub.frequency, pending.results.length),
        html: digestHtml(sub, pending.results, prefsUrl, unsubUrl),
        text: digestText(sub, pending.results, prefsUrl, unsubUrl),
      });
      sent++;

      // Mark delivered + bump last-sent timestamp.
      const col = sub.frequency === 'daily'  ? 'last_daily_digest_at'
                : sub.frequency === 'weekly' ? 'last_weekly_digest_at'
                :                              'last_monthly_digest_at';
      const ids = pending.results.map((p) => p.id);
      const placeholders = ids.map((_, i) => '?' + (i + 2)).join(',');
      const nowIso = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare(`UPDATE subscribers SET ${col} = ?1 WHERE id = ?2`)
          .bind(nowIso, sub.id),
        env.DB.prepare(
          `UPDATE pending_notifications SET delivered_at = ?1
           WHERE subscriber_id = ${placeholders.length ? '?' + (ids.length + 2) : 'NULL'}
             AND id IN (${placeholders})`
        ).bind(nowIso, ...ids, sub.id),
      ]);
    } catch (e) {
      failed++;
      console.log('digest send failed for', sub.email, e?.message);
    }
  }

  console.log(`digest run: processed=${processed} sent=${sent} skipped=${skipped} failed=${failed}`);
}

// Convert a UTC Date into the subscriber's local clock parts.
function localParts(date, timezone) {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', weekday: 'short',
    });
    const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
    const wmap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour) % 24,
      weekday: wmap[parts.weekday],
      yyyymmdd: `${parts.year}-${parts.month}-${parts.day}`,
      yyyymm: `${parts.year}-${parts.month}`,
    };
  } catch { return null; }
}

function alreadySentForCadence(sub, local) {
  if (sub.frequency === 'daily')   return sub.last_daily_digest_at   && sub.last_daily_digest_at.startsWith(local.yyyymmdd);
  if (sub.frequency === 'weekly')  return sub.last_weekly_digest_at  && sub.last_weekly_digest_at.startsWith(local.yyyymmdd);
  if (sub.frequency === 'monthly') return sub.last_monthly_digest_at && sub.last_monthly_digest_at.startsWith(local.yyyymm);
  return false;
}

function digestSubject(frequency, count) {
  const cadence = frequency === 'daily' ? 'daily' : frequency === 'weekly' ? 'weekly' : 'monthly';
  return `Your ${cadence} digest from CheetoChopsticks (${count} update${count === 1 ? '' : 's'})`;
}

function digestHtml(sub, items, prefsUrl, unsubUrl) {
  const byTopic = groupByTopic(items);
  const intro = `We bundled ${items.length} update${items.length === 1 ? '' : 's'} from the topics you subscribe to. Click any to read more.`;

  const sections = Object.keys(byTopic).sort().map((topic) => {
    const rows = byTopic[topic].map((p) => `
      <tr><td style="padding:14px 0;border-bottom:1px solid #eee">
        <h3 style="font:600 17px/1.3 system-ui,sans-serif;color:#0c1220;margin:0 0 6px">${escapeHtml(p.subject || '(no subject)')}</h3>
        <div style="font:15px/1.55 system-ui,sans-serif;color:#0c1220">${p.html || `<p>${escapeHtml(p.text || '')}</p>`}</div>
      </td></tr>
    `).join('');
    return `
      <h2 style="font:600 13px/1.3 system-ui,sans-serif;color:#5b6478;text-transform:uppercase;letter-spacing:.06em;margin:32px 0 8px;padding-bottom:6px;border-bottom:2px solid #c8a84b">${escapeHtml(prettyTopic(topic))}</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse">${rows}</table>
    `;
  }).join('');

  return baseEmailHtml(`
    <h1 style="font:600 22px/1.25 system-ui,sans-serif;color:#0c1220;margin:0 0 8px">Your ${escapeHtml(sub.frequency)} digest</h1>
    <p style="font:16px/1.55 system-ui,sans-serif;color:#0c1220;margin:0 0 8px">${escapeHtml(intro)}</p>
    ${sections}
    <hr style="margin:32px 0;border:0;border-top:1px solid #eee">
    <p style="font:13px/1.55 system-ui,sans-serif;color:#5b6478">
      <a href="${prefsUrl}" style="color:#0049b1">Manage preferences</a> ·
      <a href="${unsubUrl}" style="color:#0049b1">Unsubscribe from everything</a>
    </p>
  `);
}

function digestText(sub, items, prefsUrl, unsubUrl) {
  const byTopic = groupByTopic(items);
  const lines = [
    `Your ${sub.frequency} digest from CheetoChopsticks`,
    '',
    `${items.length} update${items.length === 1 ? '' : 's'} from your topics.`,
    '',
  ];
  for (const topic of Object.keys(byTopic).sort()) {
    lines.push('━━━ ' + prettyTopic(topic).toUpperCase() + ' ━━━');
    for (const p of byTopic[topic]) {
      lines.push('', p.subject || '(no subject)', '', p.text || stripHtml(p.html || ''));
    }
    lines.push('');
  }
  lines.push('---', `Manage preferences: ${prefsUrl}`, `Unsubscribe: ${unsubUrl}`);
  return lines.join('\n');
}

function groupByTopic(items) {
  const out = {};
  for (const it of items) {
    let p; try { p = JSON.parse(it.payload); } catch { p = { subject: '', text: '' }; }
    (out[it.topic] = out[it.topic] || []).push({ ...p, _at: it.created_at });
  }
  return out;
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function validTimezone(tz) {
  if (!tz || typeof tz !== 'string') return 'America/Denver';
  // Minimal validation: must look like an IANA TZ identifier.
  if (!/^[A-Za-z_]+(?:\/[A-Za-z_+\-0-9]+){0,2}$/.test(tz)) return 'America/Denver';
  // Trust it — Intl.DateTimeFormat will reject unknown TZs at use time.
  return tz;
}

// ─── /api/resend-webhook — bounce / complaint ───────────────────────────────
// Resend webhooks are signed by Svix. We verify the signature using the
// secret shown in Resend's webhook config.

async function handleResendWebhook(request, env) {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const id        = request.headers.get('svix-id') || '';
  const timestamp = request.headers.get('svix-timestamp') || '';
  const signature = request.headers.get('svix-signature') || '';
  const rawBody   = await request.text();

  if (!await verifySvix(env.RESEND_WEBHOOK_SECRET, id, timestamp, rawBody, signature)) {
    return new Response('unauthorized', { status: 401 });
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return new Response('bad json', { status: 400 }); }

  const type  = String(payload.type || '');
  const email = String(payload.data?.to?.[0] || payload.data?.email || '').toLowerCase();
  if (!email) return new Response('no email', { status: 200 });

  const sub = await env.DB.prepare(`SELECT id FROM subscribers WHERE email=?1`).bind(email).first();
  if (!sub) return new Response('unknown subscriber', { status: 200 });

  const ip = '';

  if (type === 'email.bounced' || type === 'email.complained') {
    await env.DB.batch([
      env.DB.prepare(`UPDATE subscribers SET status='bounced' WHERE id=?1`).bind(sub.id),
      env.DB.prepare(`
        INSERT INTO consent_events (subscriber_id, event, source, ip, consent_text_version)
        VALUES (?1, 'bounce', 'resend-webhook', ?2, ?3)
      `).bind(sub.id, ip, CONSENT_VERSION),
    ]);
  }

  return new Response('ok', { status: 200 });
}

// ─── Resend send helper ─────────────────────────────────────────────────────

async function sendEmail(env, { to, subject, html, text, replyTo }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${env.FROM_NAME} <${env.FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
  return r.json();
}

// ─── Email templates ────────────────────────────────────────────────────────

function confirmEmailHtml(confirmUrl, prefsUrl, topics, frequency, interests) {
  const topicRows = topics.map(t => `
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font:500 15px/1.4 system-ui,sans-serif;color:#0c1220">
      ${escapeHtml(prettyTopic(t))}
    </td></tr>
  `).join('');
  const interestsBlock = interests && interests.trim()
    ? `<div style="margin:20px 0;padding:14px 16px;background:#fdf6e3;border-left:3px solid #c8a84b;border-radius:3px">
         <p style="margin:0 0 4px;font:600 13px/1.3 system-ui,sans-serif;color:#5b6478;text-transform:uppercase;letter-spacing:.05em">You also told us:</p>
         <p style="margin:0;font:italic 15px/1.5 system-ui,sans-serif;color:#0c1220">"${escapeHtml(interests)}"</p>
         <p style="margin:8px 0 0;font:13px/1.4 system-ui,sans-serif;color:#5b6478">We'll use this to decide which topics to add next.</p>
       </div>`
    : '';

  return baseEmailHtml(`
    <h1 style="font:600 22px/1.25 system-ui,sans-serif;color:#0c1220;margin:0 0 8px">Confirm your subscription</h1>
    <p style="font:16px/1.55 system-ui,sans-serif;color:#0c1220;margin:0 0 24px">Quick check — here's what you asked for. If it looks right, click confirm at the bottom.</p>

    <h2 style="font:600 13px/1.3 system-ui,sans-serif;color:#5b6478;text-transform:uppercase;letter-spacing:.06em;margin:24px 0 8px">Topics (${topics.length})</h2>
    <table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #eee">
      ${topicRows}
    </table>

    <h2 style="font:600 13px/1.3 system-ui,sans-serif;color:#5b6478;text-transform:uppercase;letter-spacing:.06em;margin:24px 0 8px">How often</h2>
    <p style="font:500 16px/1.4 system-ui,sans-serif;color:#0c1220;margin:0 0 4px">${escapeHtml(frequencyLabel(frequency))}</p>
    ${frequency !== 'immediate' ? `<p style="font:13px/1.4 system-ui,sans-serif;color:#5b6478;margin:0">Digest delivery is launching soon — until then we'll send each one immediately and group them on your chosen schedule once the digest job is live.</p>` : ''}

    ${interestsBlock}

    <div style="margin:32px 0 24px;text-align:center">
      <a href="${confirmUrl}" style="display:inline-block;background:#c8a84b;color:#0c1220;padding:14px 28px;border-radius:4px;font:700 15px/1 system-ui,sans-serif;text-decoration:none;letter-spacing:.02em">Confirm subscription</a>
    </div>

    <div style="margin:24px 0;padding-top:20px;border-top:1px solid #eee">
      <p style="font:14px/1.5 system-ui,sans-serif;color:#5b6478;margin:0 0 8px"><strong style="color:#0c1220">Need to change something?</strong></p>
      <p style="font:14px/1.5 system-ui,sans-serif;color:#5b6478;margin:0">
        <a href="${prefsUrl}" style="color:#0049b1">Manage topics, frequency, or unsubscribe →</a>
      </p>
    </div>

    <p style="font:13px/1.5 system-ui,sans-serif;color:#5b6478;margin:24px 0 0;padding-top:16px;border-top:1px solid #eee">
      If you didn't ask to subscribe, ignore this email — you'll receive nothing further. The confirm link expires in 14 days.
    </p>
  `);
}

function confirmEmailText(confirmUrl, prefsUrl, topics, frequency, interests) {
  const lines = [
    'Confirm your subscription',
    '',
    'Quick check — here\'s what you asked for. If it looks right, click confirm at the bottom.',
    '',
    `Topics (${topics.length}):`,
    ...topics.map(t => '  • ' + prettyTopic(t)),
    '',
    'How often:',
    '  ' + frequencyLabel(frequency),
  ];
  if (frequency !== 'immediate') {
    lines.push('  (Digest delivery launches soon; until then we send immediately.)');
  }
  if (interests && interests.trim()) {
    lines.push('', 'You also told us:', '  "' + interests + '"', '  (We\'ll use this to decide which topics to add next.)');
  }
  lines.push('', 'Confirm: ' + confirmUrl, '', 'Need to change something? Manage your preferences:', '  ' + prefsUrl, '', 'If you didn\'t ask to subscribe, ignore this. Confirm link expires in 14 days.');
  return lines.join('\n');
}

// "gov.specialdistricts.LorsonRanch" → "Special districts › Lorson Ranch"
function prettyTopic(t) {
  const parts = t.split('.').filter(p => p && p !== 'gov');
  return parts.map(humanize).join(' › ');
}

// Light-touch humanization. Mirrors the logic in _data/topics.js so labels
// in emails match what the user saw in the picker.
function humanize(name) {
  if (/^[A-Z0-9_-]+$/.test(name)) return name;        // pure acronym: CSPD, FBI, BOCC
  if (/[A-Z]/.test(name) && /[a-z]/.test(name)) {     // mixed case: LorsonRanch
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function frequencyLabel(f) {
  switch (f) {
    case 'immediate': return 'Immediately when posted';
    case 'daily':     return 'As a daily digest';
    case 'weekly':    return 'As a weekly digest';
    case 'monthly':   return 'As a monthly digest';
    default:          return 'Immediately when posted';
  }
}
function magicLinkHtml(link) {
  return baseEmailHtml(`
    <h1 style="font:600 20px/1.3 system-ui,sans-serif;color:#0c1220;margin:0 0 12px">Manage your subscriptions</h1>
    <p>Click below to update which topics you receive, change frequency, or unsubscribe.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="display:inline-block;background:#c8a84b;color:#0c1220;padding:14px 24px;border-radius:4px;font-weight:700;text-decoration:none">Open my preferences</a>
    </p>
    <p style="font-size:14px;color:#5b6478">If you didn't request this, ignore the email. The link expires in 7 days.</p>
  `);
}
function magicLinkText(link) {
  return `Manage your subscriptions\n\n${link}\n\nIf you didn't request this, ignore. Link expires in 7 days.`;
}
function baseEmailHtml(content) {
  return `<!doctype html><html><body style="font-family:system-ui,-apple-system,sans-serif;color:#0c1220;background:#f4f4f1;margin:0;padding:24px">
    <table role="presentation" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:8px"><tr><td style="padding:32px">
      ${content}
    </td></tr></table></body></html>`;
}
function withFooter(body, topic, prefsUrl, unsubUrl, isHtml) {
  if (isHtml) {
    return body + `<hr style="margin:32px 0;border:0;border-top:1px solid #ddd">
      <p style="font-size:12px;color:#5b6478;line-height:1.5">
        You're subscribed to <code>${escapeHtml(topic)}</code>.
        <a href="${prefsUrl}">Manage preferences</a> ·
        <a href="${unsubUrl}">Unsubscribe from this topic</a>
      </p>`;
  }
  return body + `\n\n---\nYou're subscribed to ${topic}.\nManage preferences: ${prefsUrl}\nUnsubscribe from this topic: ${unsubUrl}\n`;
}

// ─── Token signing (HMAC-SHA256, base64url) ─────────────────────────────────

async function signToken(claims, secret) {
  const enc = new TextEncoder();
  const body = b64url(enc.encode(JSON.stringify(claims)));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return body + '.' + b64url(sig);
}
async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(body));
  if (!ok) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (claims.exp && claims.exp < nowSec()) return null;
    return claims;
  } catch { return null; }
}
function b64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
function b64urlDecode(s) {
  s = s.replaceAll('-', '+').replaceAll('_', '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// ─── Svix signature verification (for Resend webhooks) ──────────────────────

async function verifySvix(secret, id, timestamp, body, signatureHeader) {
  if (!secret || !id || !timestamp || !body || !signatureHeader) return false;
  const cleanSecret = secret.replace(/^whsec_/, '');
  const enc = new TextEncoder();
  const keyBytes = b64urlDecodeStandard(cleanSecret);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const toSign = `${id}.${timestamp}.${body}`;
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(toSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  // signatureHeader looks like "v1,sig1 v1,sig2 ..."
  const sigs = signatureHeader.split(' ').map(s => s.split(',')[1]).filter(Boolean);
  return sigs.some((s) => timingSafeEqual(s, expected));
}
function b64urlDecodeStandard(s) {
  // Svix secrets are standard base64.
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ─── Tiny helpers ───────────────────────────────────────────────────────────

const nowSec = () => Math.floor(Date.now() / 1000);
const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const topicValid = (t) => /^gov(\.[a-zA-Z0-9-]+){1,3}$/.test(t);

function corsFor(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' }
    : {};
}
function preflight(cors, methods) {
  return new Response(null, { headers: {
    ...cors,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }});
}
function json(obj, status = 200, cors = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
function htmlPage(title, body) {
  return new Response(
    `<!doctype html><html><head><meta charset=utf-8><title>${escapeHtml(title)}</title>
     <style>body{font:16px/1.5 system-ui,sans-serif;background:#0c1220;color:#ede8dc;padding:48px 24px;max-width:560px;margin:0 auto}
     h1{color:#c8a84b}a{color:#c8a84b}code{background:#1c2a3e;padding:2px 6px;border-radius:3px}</style>
     </head><body><h1>${escapeHtml(title)}</h1><p>${body}</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
