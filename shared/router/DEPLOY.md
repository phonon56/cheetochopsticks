# LLM Router — deploy guide

Plain-language `/api/route` endpoint on the existing Cloudflare Worker.
Calls Workers AI (Llama 3.3 70B Instruct) against the 119-topic catalog,
gated by Cloudflare Turnstile and a per-IP rate limit.

## Why these specific protections

Four layers, narrowest to widest. A request has to pass all four to actually
hit Workers AI:

| Threat                                       | Protection                | Bound                                      |
| -------------------------------------------- | ------------------------- | ------------------------------------------ |
| Single IP hammering the LLM                  | Per-IP rate limit         | 429 after 30 req / 60 s per IP             |
| Bot scraping the endpoint                    | Cloudflare Turnstile      | 403 on missing/invalid token               |
| **Distributed attack (many IPs at once)**    | **D1-backed daily cap**   | **429 after 1,500 successful calls/day**   |
| Workers AI exhausting paid quota             | Cloudflare free tier      | Auto-rejects beyond 10,000 Neurons/day     |
| Misconfigured deploy                         | Worker fails closed       | 503 if `AI`, `DB`, or `TURNSTILE_SECRET` missing |

The daily cap is the hard kill switch. Even if 10,000 IPs each pass the per-IP
limit AND solve Turnstile (which they won't), the 1,501st successful call
that day gets a 429 and never touches Workers AI. The counter is keyed on the
UTC date in D1 and resets at midnight UTC.

**Worst-case spend** with all four protections holding: zero. The default
daily cap of 1,500 × ~6 Neurons per call = ~9,000 Neurons/day, comfortably
under the 10k free tier. Even if Cloudflare changed the Neuron pricing or
the model got more expensive, the cap is the dollar-level ceiling — set
`ROUTE_DAILY_CAP` to whatever number of calls you can afford to lose in
a single day.

**To tighten further:**
- Drop `ROUTE_DAILY_CAP` to e.g. `500` in `wrangler.jsonc` and redeploy. No
  migration needed; the var is read on every request.
- Drop the per-IP limit from 30/min to 10/min by editing `ROUTE_LIMIT.simple.limit`.
- Add Cloudflare WAF managed rules to block known abusive ASNs (free, one custom rule).
- Set a Cloudflare billing alert to email at $1 (dashboard → Billing → Notifications).

## One-time setup

### 1. Create the Turnstile site/secret key pair (free)

1. Cloudflare dashboard → **Turnstile** → **Add site**.
2. **Domain**: `cheetochopsticks.com` (add `localhost` too for dev).
3. **Widget mode**: Managed (recommended) or Non-interactive.
4. Save. You'll get a **Site Key** (public) and a **Secret Key** (private).

### 2. Wire the keys into the Worker

```bash
# Public site key — edit wrangler.jsonc and replace the placeholder.
# It's safe to commit; the secret is the only sensitive half.
$EDITOR wrangler.jsonc
# Find "TURNSTILE_SITE_KEY" → paste your real site key

# Secret — never goes into source control.
wrangler secret put TURNSTILE_SECRET
# Paste the secret key when prompted
```

### 3. Apply the D1 migration for the daily-cap counter

```bash
wrangler d1 execute notify --remote --file shared/notify/migration-002-route-daily-cap.sql
```

This creates the `route_daily_usage` table. Without it, the worker returns
503 `cap_check_unavailable` on every `/api/route` call — the cap check is
deliberately fail-closed because the alternative is unbounded spend if D1
is unavailable.

To inspect usage at any time:
```bash
wrangler d1 execute notify --remote \
  --command "SELECT date, call_count FROM route_daily_usage ORDER BY date DESC LIMIT 7"
```

### 4. Confirm the Workers AI binding is on the account

Workers AI is free up to 10,000 Neurons/day on every Cloudflare account
created after Oct 2024. Older accounts may need to opt in once:

```bash
# Should show "AI: ..." in the bindings list after first deploy.
wrangler ai models list
```

If the command errors with "Workers AI not enabled," visit
**dashboard → AI → Workers AI** and click **Enable**.

### 5. Confirm the rate-limit binding is supported

Workers Rate Limiting is an `unsafe.bindings` entry in `wrangler.jsonc`
during the preview period (no separate enrollment needed as of 2026).
Just deploy — Wrangler will create the namespace on first push.

## Deploy

```bash
wrangler deploy
```

That's it. The new `/api/route` endpoint goes live. Existing routes
(`/api/subscribe`, `/api/confirm`, etc.) are unchanged.

## Testing the deploy

```bash
# Should 403 (missing Turnstile token in production):
curl -sX POST https://cheetochopsticks.com/api/route \
  -H 'content-type: application/json' \
  -d '{"query":"my neighbor has tall grass"}'
# → {"error":"turnstile_missing", "engine":"turnstile-failed", ...}

# With DEV_MODE=1 in wrangler dev, Turnstile is bypassed:
wrangler dev
# In another shell:
curl -sX POST http://localhost:8787/api/route \
  -H 'content-type: application/json' \
  -d '{"query":"my neighbor has tall grass"}' | jq
# → { "primary": { "topicId": "61750", ... }, "engine": "workers-ai" }
```

## Wiring the UI (follow-up work, not included)

The current `PlainLanguageSearch.tsx` (in
`microsites/city/goGov/cos-portal-prototype`) still uses synchronous
keyword routing. To wire the LLM endpoint into the UI:

1. **Load Turnstile in `index.html`**:
   ```html
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js"
           async defer></script>
   ```

2. **Render the widget** in `PlainLanguageSearch.tsx`:
   ```tsx
   const containerRef = useRef<HTMLDivElement>(null);
   const [turnstileToken, setTurnstileToken] = useState<string>();

   useEffect(() => {
     if (!window.turnstile || !containerRef.current) return;
     const id = window.turnstile.render(containerRef.current, {
       sitekey: TURNSTILE_SITE_KEY, // from wrangler.jsonc vars
       callback: (token: string) => setTurnstileToken(token),
       'refresh-expired': 'auto',
     });
     return () => window.turnstile.remove(id);
   }, []);

   // Render somewhere in the form:
   <div ref={containerRef} />
   ```

3. **Replace the synchronous `useMemo(routeRequest)`** with a debounced
   `useEffect` that calls `routeWithFallback` (already exists at
   `src/data/router-client.ts`):
   ```tsx
   import { routeWithFallback, type RouterResult } from '../data/router-client';

   useEffect(() => {
     if (!text.trim()) return;
     const handle = setTimeout(() => {
       routeWithFallback(text, { turnstileToken }).then(setResult);
     }, 450);
     return () => clearTimeout(handle);
   }, [text, turnstileToken]);
   ```

4. **Badge the result** so users see which engine produced it
   (`result.engine === 'workers-ai'` vs `'keyword-fallback'`).

5. **Rebuild**:
   ```bash
   cd microsites/city/goGov/cos-portal-prototype
   npm run build
   ```
   The built bundle in `build/` is what Cloudflare serves; the `src/`
   tree is excluded via `.assetsignore`.

## Why Workers AI and not Claude

The previous implementation (deleted in commit `cb3388e` and now
rebuilt) used Anthropic Claude Haiku 4.5. Two reasons for the switch:

1. **Cost containment.** Anthropic billing is a separate account with its
   own surface for runaway spend. Workers AI billing is on the same
   Cloudflare account as everything else; the free tier covers
   ~2,000-5,000 router calls/day at zero marginal cost.
2. **No third-party API key.** Anthropic required `ANTHROPIC_API_KEY` as
   a Worker secret. With Workers AI, the binding `env.AI` provides
   authenticated access — no key to rotate, no secret to leak.

The trade-off is quality: Claude Haiku is a stronger instruction-follower
than Llama 3.3 70B for structured-output tasks. The Worker compensates
with:
- A more directive system prompt (see `shared/router/prompt.js`).
- Defensive JSON parsing that strips code fences and finds the first
  valid `{...}` block in the response.
- Schema validation + default-filling so the client always receives the
  full envelope, even when Llama drops keys.

If Llama proves too inconsistent for the routing task in production,
swap `ROUTE_MODEL` in `subscribe-worker.js` to a stronger Workers AI
model (`@cf/meta/llama-3.3-70b-instruct-fp8` non-fast, or
`@hf/nousresearch/hermes-2-pro-mistral-7b` which is JSON-tuned).

## Monitoring the cap

The simplest check is the D1 query in section 3. If `call_count` is climbing
suspiciously fast for the day, options:

1. **Lower `ROUTE_DAILY_CAP` immediately.** Edit `wrangler.jsonc`, run
   `wrangler deploy`. No state to reset; the existing counter just hits the
   new ceiling sooner.
2. **Zero the day's counter** to slam the gate shut for the rest of the day
   without redeploying:
   ```bash
   wrangler d1 execute notify --remote \
     --command "UPDATE route_daily_usage SET call_count = 999999 WHERE date = strftime('%Y-%m-%d','now')"
   ```
3. **Disable the endpoint entirely** by removing the `case '/api/route':` line
   from `subscribe-worker.js` and redeploying. Two minutes of work; the
   client falls back to keyword routing seamlessly.

## File map

```
shared/router/
├── catalog.js          # 119 topics, sorted by id, byte-stable
├── prompt.js           # SYSTEM_PROMPT + OUTPUT_SCHEMA
└── DEPLOY.md           # this file

shared/notify/
├── subscribe-worker.js                     # adds /api/route case + cap check + verifyTurnstile + callWorkersAI
└── migration-002-route-daily-cap.sql       # creates route_daily_usage table

microsites/city/goGov/cos-portal-prototype/src/data/
└── router-client.ts    # client contract (not yet wired into the UI)

wrangler.jsonc          # adds ai binding, ROUTE_LIMIT binding,
                        # TURNSTILE_SITE_KEY var, ROUTE_DAILY_CAP var
```
