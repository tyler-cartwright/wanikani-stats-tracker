# WaniTrack usage analytics: investigation and plan

Status: **implemented** on branch `feat/usage-analytics`, shipping in the next release-please release; the Worker still needs deploying (see `worker/README.md`). Investigation written 2026-11-14 against `main` @ `6c4238b` (v2.25.0).

Goal: within 4–6 weeks, find out whether WaniTrack has enough real, returning users to keep it,
and do this without ever sending the API token or username anywhere.

---

## 0. TL;DR

- WaniTrack is a client-only React SPA. **`/` serves two different screens**: the Setup/landing page
  when there is no token, and the Dashboard when there is one. So Cloudflare's "every visit lands
  on `/`" figure mixes people who never connected with signed-in users, and it can't separate them.
- Cloudflare Web Analytics can't count distinct users, returning users, retention, or the
  landing→connect funnel. Ad blockers also block its beacon (`static.cloudflareinsights.com`),
  which probably undercounts a technical audience like WaniKani's by a large margin.
- **Recommendation:** a ~100-line Cloudflare Worker on `wanitrack.com/api/event` that writes to
  **D1**, plus about 80 lines of client code that send five event types. It costs £0 on the
  Workers Free plan. It answers every question in §4. No data leaves Cloudflare, which is
  already your CDN and processor. The user identifier is
  `HMAC(server_secret, SHA-256("wanitrack:" + wanikani_user_uuid))`, and the token never leaves
  the browser.
- **Proposed main metric:** weekly active returning users (WARU). Proposed rule: **retire the site if
  median WARU < 5 over weeks 3–6 *and* fewer than 2 new connects per week.** Full criteria are in §5.

---

## 1. How the app works

### Framework and build

| | |
|---|---|
| UI | React 18 + TypeScript 5.6, Tailwind v4 |
| Build | Vite 6 (`tsc -b && vite build`), output `dist/` |
| Routing | `react-router-dom` v6 `BrowserRouter` (client-side routes, real paths, no hash) |
| Data | TanStack Query v5 (in-memory) over an **IndexedDB** cache (`src/lib/db/*`) |
| State | Zustand stores persisted to **localStorage** (`wanikani-auth`, `wanikani-settings`, `wanikani-export`) |
| PWA | `vite-plugin-pwa` (`registerType: 'autoUpdate'`), Workbox precaches every asset and lazy route chunk, with a navigation fallback to `index.html` |
| Hosting | GitHub Pages, deployed by `.github/workflows/deploy.yml` on push to `main`. `public/CNAME` = `wanitrack.com`, proxied through Cloudflare. `VITE_CUSTOM_DOMAIN=true` gives base path `/` |
| Server code | None |

### Routing

`src/App.tsx` is a single-page app with lazily loaded route chunks (`lazyWithRetry`).

- **Cold deep links** (for example typing `wanitrack.com/kanji` on a first visit) get GitHub
  Pages' `public/404.html`. That page saves the path in `sessionStorage` and redirects to `/`.
  `index.html` then restores it with `history.replaceState`. After the service worker is
  installed, its navigation fallback serves `index.html` for any path, so the 404 step only
  happens on the first visit.
- This is part of the reason "every visit lands on `/`". The PWA `start_url` is also `/`, so
  installed-app launches always begin there too.
- Gating happens at `src/App.tsx:53`. With no token, the app renders `<Setup/>` for **every**
  URL, with no routes. With a token, it renders `<InitialSync><AppShell><Routes>…`.

### Routes (authenticated)

| Path | Page file | What it shows |
|---|---|---|
| `/` | `pages/dashboard.tsx` | Hero stats, level progress, level-up blockers, SRS summary, review/guru forecast, leech alert |
| `/progress` | `pages/progress.tsx` | Level timeline, level-60 projection, burn velocity, knowledge stability, milestones, streak records, reset notice |
| `/activity` | `pages/activity.tsx` | Activity heatmap, streaks, year-in-review (from locally captured history, 2.23+) |
| `/accuracy` | `pages/accuracy.tsx` | Accuracy breakdown by type and meaning/reading, distribution, time heatmap |
| `/forecast` | `pages/forecast.tsx` | Workload chart, lesson-pace selector, level progression forecast |
| `/leeches` | `pages/leeches.tsx` | Priority leech list, root causes, confusion pairs, "train these" entry points |
| `/trainer` | `pages/trainer.tsx` | Self-study flashcards, confusion-pair mode, audio (new in 2.25, **too new to appear in your Cloudflare numbers**) |
| `/kanji` | `pages/kanji.tsx` | Kanji grid by level with SRS colouring, filters, tooltips |
| `/readiness` | `pages/readiness.tsx` | JLPT/Jōyō readiness, frequency coverage (`/jlpt` redirects here) |
| `/settings` | `pages/settings.tsx` | Token/logout, sync, display preferences, data export/import |
| `*` | | Redirects to `/` |
| any path, no token | `pages/setup.tsx` | Landing page: feature list, "how it works", token form |

Header nav (`components/layout/header.tsx`) and mobile nav list all nine feature pages. Settings
is only reachable from the user menu, which explains its low traffic.

### Token entry and storage

1. The user pastes a token into `components/settings/api-token-input.tsx` (on Setup and Settings).
2. `handleValidate` calls `validateToken()` (`GET /user`; returns `false` on 401, throws on other
   errors), then calls `fetchUser()` a second time and discards the result. Next it runs
   `saveToken()` (line 44).
3. `stores/user-store.ts` persists **only the token** to `localStorage['wanikani-auth']`.
4. Logout (`clearAuth`) clears IndexedDB, the query cache and the token.
5. The token is sent only to `https://api.wanikani.com/v2` (`lib/api/client.ts`) as a Bearer header.

### Data fetched, and when

| Data | Fetched by | Stored | When |
|---|---|---|---|
| `/user` | `useUser()` (`lib/api/queries.ts:51`) | IndexedDB snapshot (offline fallback) | Each app load (staleTime 5 min) |
| `/resets` | `useResets()` | IndexedDB snapshot | Each load |
| `/summary` | `useSummary()` | memory | Each load |
| `/subjects`, `/assignments`, `/review_statistics`, `/level_progressions` | `performSync()` (`lib/sync/sync-manager.ts`) | IndexedDB | First load: **full sync**. After that: **delta sync** using `updated_after` cursors |
| Activity history | `recordSyncActivity()` after each sync | IndexedDB, never re-downloadable | Each successful sync |

Requests are rate-limited to 1/s, with 429 back-off and retry.

### First load compared with a return visit

| | First load (no token) | Connect | Return visit (token present) |
|---|---|---|---|
| Screen | Setup landing at whatever URL | "Validating…", then the app shell mounts | Brief "Checking local data…" |
| Network | Static assets only | `/user` ×2 | `/user`, `/resets`, `/summary`, plus a **background delta sync** |
| `InitialSync` | n/a | `syncStatus.hasData === false`, so it shows a blocking full-sync progress card (subjects → assignments/stats/progressions in parallel) | `hasData === true`, so the app shows **immediately** from IndexedDB and syncs in the background (`initial-sync.tsx:25`) |
| Offline | Landing renders (SW precache) | "You're offline" card | Fully works from cache. Syncs when the connection returns |

---

## 2. Where to measure

| Signal | Where it can be detected | Notes |
|---|---|---|
| **(a) New user connects a token** | `api-token-input.tsx:44`, immediately after `saveToken()`. The `fetchUser()` result on line 43 already contains `user.id` (a UUID). | The same component is on Settings, so a re-connect after logout also fires here. That's fine: the server dedupes by user hash. |
| **(a′) Connect fails** | `api-token-input.tsx:50` (invalid token, i.e. 401) and `:52` (`catch`: network, 5xx, 429) | No user ID is available, so only aggregate counts are possible |
| **(a″) First full sync finished** | `initial-sync.tsx:44–47` (`await sync()` succeeds while `hasData` was false) | Separates "connected" from "actually saw their stats" |
| **(b) Returning user loads data** | `initial-sync.tsx:25` (`syncStatus.hasData === true`). The user ID comes from `useUser()` (`queries.ts:59`). | Send once per page load, after both `hasData` and `user.id` are known |
| **(c) Feature page viewed** | A new `<RouteTracker/>` inside `<BrowserRouter>` (`App.tsx:90`) using `useLocation()`. Alternatively, `useDocumentTitle()` is already called once per page. | Use the route path, never query strings |
| **(c′) Landing page viewed** | `pages/setup.tsx` mount (`useEffect`) | The only way to tell "homepage, not connected" apart from Dashboard |
| **(d) Errors** | Invalid token: as in (a′). Sync failure: `use-sync.ts:47` (`!result.success`) and `:74` (`catch`). API status: `WaniKaniAPIError.status` (`client.ts:122`; status 0 = network). Render crash: `ErrorBoundary.componentDidCatch` (`error-boundary.tsx:23`). Chunk load: `lazy-with-retry.ts`. Mid-session 401 (token revoked): `useUser` error with status 401. | Send **error class and status only**, never messages (they can contain URLs or other details) |
| Logout (optional churn signal) | `user-store.ts:32` `clearAuth` | Cheap to add, and useful context for retention |

---

## 3. Options

All options assume the site stays on GitHub Pages behind the Cloudflare proxy. A Worker route on
`wanitrack.com/api/*` runs in front of Pages on the same origin, so it needs no CORS and no new
domain.

### Option A: Cloudflare Worker + D1 (recommended)

- **Setup effort:** about half a day to a day. That covers a Worker (`wrangler`), one D1 database
  with three tables, a route `wanitrack.com/api/event*`, about 80 lines of client code, and the
  privacy-copy updates. You write the dashboard queries yourself as SQL (provided in §4), run with
  `wrangler d1 execute` or from the D1 console.
- **Ongoing cost:** £0. The Workers Free plan allows 100k requests/day. D1 Free allows about 5M row
  reads/day, 100k row writes/day, and 500 MB per database. Expected volume is hundreds of events per
  day. Check the current limits in Cloudflare's docs before relying on them.
- **Can answer:** everything in §4. Exact distinct users (not sampled), cohort retention, feature
  use by returning users, the landing→connect funnel, error rates. Retention is unlimited until
  you delete the data.
- **Can't answer:** anything about users who block `/api/event`. That should be few, because it's
  first-party, but users with strict filter lists or GPC are excluded by design. You'll have no
  dashboards unless you build one.
- **Privacy:** data stays within Cloudflare, which already processes every request as your CDN
  under its DPA. You control the schema, so the minimum is easy to enforce: no IP, no user agent,
  no username, no token.

**Variant A2: Workers Analytics Engine instead of D1.** It's built for high-volume event writes and
also free at this scale. However, retention is reportedly about 3 months (verify), and its SQL
dialect is limited, so cohort retention joins are awkward. D1 is the better fit for a 6-week
retention study with a few hundred events per day.

### Option B: GoatCounter (hosted, free for non-commercial use)

- **Setup effort:** about 1 hour. Add one script tag, call `goatcounter.count({path})` on route
  change, and send custom events as pseudo-paths (`/event/connect`).
- **Ongoing cost:** £0 (donation-ware). It can also be self-hosted.
- **Can answer:** page views per route, approximate unique visitors per day (session hash), event
  counts, referrers.
- **Can't answer:** returning users, week-1/week-4 retention, or "which features *returning* users
  use". Distinct users across days are deliberately impossible, because there's no persistent ID.
  You could send the hashed UID as a path, but that defeats the tool's model and its terms.
- **Privacy:** cookieless, no localStorage, very light. It's a third party (EU-hosted) that sees
  visitor IPs, so it needs a mention in the privacy notice.

### Option C: Plausible (hosted, paid)

- **Setup effort:** about 1 hour, similar to B. It supports custom events with properties, and
  funnels on higher tiers.
- **Ongoing cost:** about £8–9/month for the smallest plan (verify current pricing). That's more
  than the domain costs per year.
- **Can answer and can't answer:** the same as GoatCounter, plus nicer goals/funnels and custom
  props. Its daily-rotating salt **by design** prevents cross-day identification, so there's no
  retention or returning-user data.
- **Privacy:** cookieless, EU-hosted, strong reputation. Third-party processor.

### Option D: PostHog Cloud EU (hosted, free tier)

- **Setup effort:** 2–3 hours. Install the `posthog-js` SDK, then configure `persistence: 'memory'`,
  `autocapture: false`, session recording off, and IP capture off. Call
  `posthog.identify(hashedUid)` and capture events explicitly.
- **Ongoing cost:** £0 (the free tier is about 1M events/month).
- **Can answer:** everything, with ready-made retention, cohort, funnel and DAU/WAU/MAU charts
  and no SQL. This is the strongest no-code alternative to A.
- **Can't answer:** nothing significant at this scale.
- **Privacy:** the weakest of the four. The default config uses cookies and localStorage (it must
  be changed to avoid them), the SDK is tens of KB, and it's a US company (EU region available).
  Its data model invites capturing more than you need. It's also a visible third party, which is
  awkward for a site whose landing page says "No server, no cookies".

### Comparison

| | A: Worker+D1 | B: GoatCounter | C: Plausible | D: PostHog EU |
|---|---|---|---|---|
| Setup | ½–1 day | ~1 h | ~1 h | 2–3 h |
| Cost | £0 | £0 | ~£9/mo | £0 |
| DAU/WAU/MAU (distinct users) | ✅ exact | ≈ daily uniques only | ≈ daily uniques only | ✅ |
| New vs returning, W1/W4 retention | ✅ | ❌ | ❌ | ✅ |
| Features used by returning users | ✅ | ❌ | ❌ | ✅ |
| Landing → connect funnel | ✅ (aggregate) | ✅ (aggregate) | ✅ | ✅ |
| Third parties added | none | 1 | 1 | 1 |
| Dashboards | DIY SQL | ✅ | ✅ | ✅ |

### Current Cloudflare Web Analytics

It's worth keeping as a sanity check on raw traffic and referrers. It's cookieless, but it can't
answer any of the §4 questions.

### UK GDPR and PECR

**PECR reg. 6 (storage and access)** covers *any* storing of, or access to, information on the
user's device: cookies, localStorage, IndexedDB, and reading data the app already stored, if
that's done for a new purpose.

- Reading the stored token to call WaniKani, and caching data in IndexedDB, are *strictly
  necessary* for the service the user requested, so they're exempt.
- Using that stored data **for analytics** is a separate purpose. Before 2026 it needed opt-in
  consent.
- The **Data (Use and Access) Act 2025** added a PECR exception for storage/access whose *sole*
  purpose is collecting **statistical information about how the service is used, with a view to
  improving it**. The user must get clear information and a **free, simple way to object**.
  Commentary says the exception came into force on 5 Feb 2026 (Commencement No. 6, SI 2026/82).
  **Checked 2026-11-14 against the ICO's "What are the exceptions?" guidance; see the decision
  record below.**
- Data that would breach the "sole purpose" condition, and so fall outside the exception: anything
  reused for marketing, profiling or advertising, or shared with a third party for its own purposes.

**Decision record (2026-11-14):** the ICO's guidance on the statistical-purposes exception says:
- the resulting information must be aggregate, and the exception is "not for identifying, tracking
  or monitoring people";
- individual-level data may only be held as long as needed to aggregate it (it suggests daily
  aggregation) and must not be kept afterwards;
- information accessed must be used solely for that purpose.

This design keeps a pseudonymous per-user row per day for 90 days and derives it from the WaniKani
ID the app already fetches. So it **probably falls outside the exception** on the ICO's reading.

Alternatives considered:
- an identifier-free design (per-device cohort week and daily/weekly summary pings, aggregate
  counts only);
- opt-in consent.

**The maintainer chose to ship the design as-is,** with the notice and opt-out, accepting that
risk. If it needs revisiting, the identifier-free design is the low-effort path.

**What this means for the recommended design:**

- **No new storage on the device.** The hash is computed in memory on each load, and the server
  dedupes per user-day. The only possible write is an opt-out flag
  (`localStorage['wanitrack-analytics-optout']`), which is itself strictly necessary to honour the
  objection.
- **Notice and objection:** add a short "Usage statistics" paragraph on Setup and Settings, with a
  toggle ("Send anonymous usage statistics"). Respect the `navigator.globalPrivacyControl` signal
  as an automatic opt-out.
- **Logged-out landing visitors:** some commentary suggests the exception is harder to rely on for
  non-users. The landing-page event therefore reads and stores **nothing** from the device and
  carries no identifier, only `{e:"landing"}`. That's an aggregate count, comparable to a server
  log line, and it doesn't touch reg. 6.

**UK GDPR:** a salted/HMAC'd user ID is **pseudonymous personal data**, not anonymous, because you
hold the secret and could re-hash a known UUID. So:

- **Lawful basis:** legitimate interests (deciding whether to keep running a free service). Write a
  three-line LIA. The impact is minimal: no content data, no IP, a short retention period, and an
  opt-out.
- **Transparency:** update the Setup copy (`setup.tsx:72` "nothing is sent to any server",
  `setup.tsx:141` "No server, no cookies, no personal data collected") and the README "Privacy &
  Security" list. **Those statements become untrue once events are sent, so they must change in
  the same release.**
- **Minimisation and retention:** no IP, user agent, username, level or token is stored.
  Cloudflare sees the IP in transit, as it already does for every page. Delete raw rows after
  **90 days**. Destroy the HMAC secret when the evaluation ends, which makes the stored hashes
  effectively anonymous.
- **Processor:** Cloudflare's standard DPA covers Workers/D1. For options B, C and D, the vendor is
  an additional processor to list.
- **ICO data protection fee:** check whether this hobby project needs to pay it. Most small
  controllers pay the lowest tier, and some non-commercial cases are exempt. The ICO's online
  self-assessment takes a few minutes.

---

## 4. Recommendation: Option A (Worker + D1) with five events

### Anonymous identifier

```
client:  uidc = hex(SHA-256("wanitrack:v1:" + user.id))     // user.id = WaniKani UUID from /user
server:  uid  = hex(HMAC-SHA256(env.UID_SECRET, uidc)).slice(0, 32)
```

- **Two layers, because the client "salt" is public in the bundle.** The server secret stops
  anyone with the database from hashing a guessed UUID. WaniKani UUIDs aren't public anyway, but
  this costs nothing.
- **The secret stays fixed for the evaluation period**, because rotating it would break retention.
  Delete it afterwards.
- **The token and username are never included.** `user.id` is read from the `/user` response the
  app already fetches.
- **Your own UID:** put your own `uid` in `env.EXCLUDE_UIDS` (or filter it out in queries) so your
  own usage doesn't count.

### Events (POST `wanitrack.com/api/event`, JSON, `navigator.sendBeacon`, fire-and-forget)

| `e` | When | Payload (complete) |
|---|---|---|
| `landing` | Setup page mounted (once per page load) | `{e, v}`, with **no** identifier |
| `connect` | Token validated and saved (`api-token-input.tsx:44`) | `{e, v, uidc}` |
| `connect_fail` | Validation failed | `{e, v, reason: "invalid_token" \| "network" \| "rate_limited" \| "server" \| "other"}` |
| `open` | Authenticated app loaded, once per page load, after `user.id` is known | `{e, v, uidc, cached: bool, pwa: bool}` (`cached` = `hasData` at boot; `pwa` = `display-mode: standalone`) |
| `view` | Each route change while authenticated | `{e, v, uidc, page: "dashboard" \| "progress" \| … }`, validated against an allowlist on the server |
| `error` | Sync failure, ErrorBoundary, chunk error, mid-session 401 | `{e, v, uidc?, kind: "sync" \| "crash" \| "chunk" \| "auth", status?: number}` |

`v` is the app version. That's six event names, but `connect_fail` is just `connect` with
`ok:false`, so there are five concepts.

### Storage (D1)

```sql
CREATE TABLE users (
  uid         TEXT PRIMARY KEY,
  first_day   TEXT NOT NULL,          -- YYYY-MM-DD (UTC) first event seen
  via_connect INTEGER NOT NULL        -- 1 if first event was `connect` (genuinely new), 0 = pre-existing user
);
CREATE TABLE user_days (              -- one row per user per active day
  day    TEXT NOT NULL,
  uid    TEXT NOT NULL,
  opens  INTEGER NOT NULL DEFAULT 0,
  pages  INTEGER NOT NULL DEFAULT 0,  -- bitmask of pages viewed that day
  PRIMARY KEY (day, uid)
);
CREATE TABLE counters (               -- aggregate, identifier-free
  day TEXT NOT NULL, name TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name)             -- e.g. landing, connect_ok, connect_fail:invalid_token, error:sync:500, open_pwa
);
```

All writes are `INSERT … ON CONFLICT DO UPDATE` upserts. That gives at most about 3 row writes per
event, and no raw event log. This "one row per user per day" design is both the most private
option and the easiest to query.

**Cutover cohort:** users who already use the site will first appear through `open`, not
`connect`, so `via_connect = 0` marks them. They're your existing base. Report them separately and
measure new-user retention only on `via_connect = 1`.

### Queries that answer the questions

```sql
-- DAU for a day / WAU / MAU (rolling)
SELECT COUNT(*) FROM user_days WHERE day = :d;
SELECT COUNT(DISTINCT uid) FROM user_days WHERE day >  date(:d, '-7 days')  AND day <= :d;
SELECT COUNT(DISTINCT uid) FROM user_days WHERE day >  date(:d, '-30 days') AND day <= :d;

-- New vs returning per ISO week
SELECT strftime('%Y-%W', d.day) wk,
       COUNT(DISTINCT CASE WHEN u.first_day >= date(d.day,'-6 days') THEN d.uid END) new_users,
       COUNT(DISTINCT CASE WHEN u.first_day <  date(d.day,'-6 days') THEN d.uid END) returning_users  -- = WARU
FROM user_days d JOIN users u USING (uid) GROUP BY wk;

-- Week-1 / week-4 retention for new users (cohort = first_day)
SELECT u.first_day,
       COUNT(*) cohort,
       AVG(EXISTS(SELECT 1 FROM user_days d WHERE d.uid=u.uid AND d.day BETWEEN date(u.first_day,'+7 days')  AND date(u.first_day,'+13 days'))) w1,
       AVG(EXISTS(SELECT 1 FROM user_days d WHERE d.uid=u.uid AND d.day BETWEEN date(u.first_day,'+28 days') AND date(u.first_day,'+34 days'))) w4
FROM users u WHERE u.via_connect = 1 GROUP BY u.first_day;

-- Feature reach among returning users over the last 28 days (bit order = PAGES array)
WITH ret AS (                          -- returning-user days in the window
  SELECT d.uid, d.pages FROM user_days d JOIN users u USING (uid)
  WHERE d.day > date('now','-28 days') AND u.first_day < date(d.day,'-6 days'))
SELECT p.name, COUNT(DISTINCT ret.uid) * 1.0 / (SELECT COUNT(DISTINCT uid) FROM ret) reach
FROM ret, pages p WHERE (ret.pages & p.bit) != 0
GROUP BY p.name ORDER BY reach DESC;   -- `pages` is a tiny static lookup table

-- Landing visitors who never connect (aggregate funnel, per week)
SELECT strftime('%Y-%W', day) wk,
       SUM(CASE WHEN name='landing'    THEN n END) landings,
       SUM(CASE WHEN name='connect_ok' THEN n END) connects
FROM counters GROUP BY wk;     -- "never connect" ≈ landings − connects
```

**Limit of the funnel:** landings are page loads, not people. A visitor who reloads Setup three
times counts three times. That's acceptable for a go/no-go decision. If it ever matters, add an
in-memory (never stored) per-tab random ID to collapse reloads.

### Worker safeguards

- Accept `POST` only. Reject when `Origin` isn't `https://wanitrack.com`. Reject bodies over 1 KB
  and unknown `e`/`page`/`reason`/`kind` values. Return `204` and never echo anything back.
- Ignore the `CF-Connecting-IP` header entirely, and don't enable Worker logs/Logpush for this route.
- Use the free-plan Cloudflare rate-limiting rule (1 rule) on `/api/event`, for example
  60 req/min per IP. Fake events are possible, because any public endpoint can be spammed, but
  they're unlikely to matter for a hobby site.
- Add a cron trigger (daily) that deletes `user_days` and `counters` rows older than 90 days.

### Implementation outline (after approval)

| File | Change |
|---|---|
| `worker/wrangler.toml` *(new)* | Worker `wanitrack-events`, route `wanitrack.com/api/event`, D1 binding `DB`, secret `UID_SECRET`, daily cron |
| `worker/src/index.ts` *(new)* | Validate, HMAC, upsert into D1, 204. Scheduled handler for 90-day cleanup |
| `worker/schema.sql` *(new)* | The tables above plus the `pages` lookup table |
| `src/lib/analytics/track.ts` *(new)* | `track(event)`: no-op in dev, when opted out, or under GPC. Uses `sendBeacon` and swallows all errors. `hashUserId()` via `crypto.subtle.digest` |
| `src/lib/analytics/route-tracker.tsx` *(new)* | `useLocation()` maps to a page name and sends `view`. Sends `open` once per load when `user.id` and the sync status are known |
| `src/App.tsx` | Mount `<RouteTracker/>` inside the authenticated tree (around `:62`) |
| `src/pages/setup.tsx` | `landing` on mount. **Rewrite the privacy copy at `:72` and `:141`** and add the usage-statistics notice |
| `src/components/settings/api-token-input.tsx` | Send `connect` with `uidc` after `saveToken`, using the existing `fetchUser()` result instead of discarding it. Send `connect_fail` in the error branches |
| `src/hooks/use-sync.ts` | `error{kind:"sync"}` on failure, with status taken from `WaniKaniAPIError` |
| `src/components/shared/error-boundary.tsx`, `src/lib/utils/lazy-with-retry.ts` | `error{kind:"crash"\|"chunk"}` |
| `src/components/settings/usage-stats-toggle.tsx` *(new)*, `src/pages/settings.tsx` | Settings → Privacy toggle, the landing-page opt-out link, and the shared notice text. The opt-out is stored in its own localStorage key, not the settings store |
| `README.md` | Update "Privacy & Security", including a new "what we collect" section |
| `CHANGELOG.md`, `package.json` | Set by release-please when the release PR is merged |
| `src/lib/analytics/*.test.ts` *(new)* | Hash is deterministic and never contains the token. Opt-out and GPC suppress sends. Page allowlist |

Not changed: the deploy workflow. The Worker is deployed separately with `wrangler deploy`, or with
an optional second workflow job using a scoped `CLOUDFLARE_API_TOKEN` secret.

**Release-order note:** versions are now set by release-please (see the README's "Releasing"
section). This change is a `feat`, so it bumps the minor version: if it's released on its own, it
becomes 2.26.0 and "Real JLPT" moves to 2.27. Releasing it first starts the 4–6 weeks of data
sooner. The hand-written changelog prose for this feature is in commit `ccf6e77`'s `CHANGELOG.md`;
paste it into the release PR if you want fuller notes than the generated bullets.

---

## 5. Decision criteria

Evaluate after **6 weeks** of data. Weeks 1–2 are mostly existing users appearing for the first
time, so judge on weeks 3–6. Exclude your own UID.

**Primary metric: WARU (weekly active returning users).** These are distinct users active in an
ISO week whose `first_day` is at least 7 days before that week.

| Outcome | Rule (all over weeks 3–6) | Action |
|---|---|---|
| **Retire** | median WARU **< 5** **and** new connects **< 2/week** **and** (W4 retention of new users **< 10%** or fewer than 5 new users to measure) | Retire gracefully (see below) |
| **Maintenance mode** | median WARU **5–25**, *or* WARU < 5 but new connects ≥ 2/week with W1 retention ≥ 30% (people try it and stay, there just aren't many) | Freeze features. Security/dependency fixes only. Re-check in 6 months |
| **Keep investing** | median WARU **> 25**, *or* WARU growing ≥ 10% week on week, *or* W4 retention ≥ 25% | Continue the roadmap, guided by feature reach |

**Secondary checks** (these change *what* to do, not whether to keep the site):

- **Landing → connect conversion < 15%:** the landing page or the token step is losing people. Try
  a cheap fix first, such as a demo mode or clearer token instructions. If conversion is fine but
  landings are low, the problem is discovery, not the product.
- **Feature reach < 10% of WARU over 4 weeks:** candidate for removal or demotion in the nav
  (Accuracy looks likely, based on your current numbers). Reach > 50%: protect it and build on it.
- **`error:auth` or `connect_fail:invalid_token` > 20% of connect attempts:** a UX problem with the
  token instructions, not a demand problem.
- **`cached:false` opens from returning users:** these mean storage was evicted (common on iOS
  Safari). If frequent, users see a full re-sync and may churn. Worth fixing before judging retention.

### Cheapest way to keep it running if usage is low but not zero

- **Current running costs are already about the minimum:** GitHub Pages (free), Cloudflare Free
  plan (free), and the Worker/D1 (free). The only real cost is the `wanitrack.com` domain renewal.
  It's about £8–10/year at Cloudflare Registrar's at-cost pricing; if it's at another registrar,
  transferring it can reduce the cost.
- **Keep the domain if anyone uses the site.** Moving back to `tyler-cartwright.github.io/...`
  changes the origin. Every user would lose their stored token, their IndexedDB cache, and their
  **un-redownloadable activity history**, and installed PWAs would break.
- **Maintenance mode:**
  - Pin dependencies.
  - Limit Dependabot to security updates only.
  - Leave CI running.
  - Remove the Worker after the evaluation, or leave it, since it's free.
  - The WaniKani API revision (`20170710`) is the main external breaking risk, so check it
    yearly.
- **If retiring:**
  - Ship one final release that shows a "WaniTrack is being retired" banner for 30–60 days, keeping
    **Settings → Export** working so users can save their activity history.
  - Then replace the site with a static notice page. The autoUpdate service worker will pick it up.
    Leave the domain pointing there until it expires.
  - Archive the repo.
  - Delete the D1 database and the `UID_SECRET`.

---

## Sources and things to verify before launch

- ICO, *Guidance on storage and access technologies* (final post-DUAA version): check the scope of
  the statistical-purposes exception and the objection requirements.
- DUAA 2025 commencement: commentary (for example
  [RPC, spring 2026 commencement update](https://www.rpclegal.com/snapshots/data-protection/spring-2026/the-data-use-and-access-act-2025-commencement-update/),
  [Mondaq: new exceptions for non-intrusive cookies](https://www.mondaq.com/uk/privacy-protection/1794248/new-exceptions-for-non-intrusive-cookies-the-icos-updated-guidance-has-landed),
  [Osborne Clarke](https://marketinglaw.osborneclarke.com/advertising-regulation/new-exceptions-explained-in-ico-final-guidance-on-storage-and-access-technologies-could-online-advertising-be-next/))
  gives 5 Feb 2026. Confirm on legislation.gov.uk or ico.org.uk.
- Cloudflare limits: [Workers limits](https://developers.cloudflare.com/workers/platform/limits),
  [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
  [Analytics Engine limits](https://developers.cloudflare.com/analytics/analytics-engine/limits).
  The free-tier figures above came partly from third-party summaries.
- Plausible and PostHog pricing change often. Check them if you choose B, C or D.
