# WaniTrack — Long-Term Product Strategy & Implementation Plan

> Drafted 2026-06-09 against v2.20.1. This is a living document: strategy research
> snapshot + tiered recommendations + release sequencing. Revisit assumptions
> (especially competitor capabilities) every few months.
>
> **Updated 2026-06-09**: added §6 (PWA/offline audit) after discovering the
> offline story is broken in ways that block the activity-history plan; roadmap
> re-sequenced — "Solid ground" now precedes "The flight recorder".
>
> **Updated 2026-06-12**: competitive research refresh at v2.24.0 (2.21–2.24 all
> shipped). §2 competitor table rebuilt — Wanilog has expanded substantially.
> New §2.1 user-request log from our community thread. §7 roadmap extended
> through 2.29: 2.25 leech trainer confirmed, then Real JLPT → "Can I read
> this?" → projections overhaul → demo mode/SEO.

---

## 1. Context snapshot (June 2026)

### Where the product stands

- Eight feature pages: Dashboard, Progress, Activity (added 2.23), Accuracy, Forecast, Leeches, Kanji Grid, Readiness.
- Recent releases (2.17–2.20.x) shifted from feature-building to correctness and
  polish: reset handling via `/resets`, weighted accuracy matching WKStats, sync
  race fixes, CI workflow. Solid foundation.
- **Synced to IndexedDB**: subjects, assignments, review_statistics, level_progressions.
- **Fetched live**: user, summary, resets.
- **Untapped API surface**: `/study_materials` (user notes/synonyms — read/write,
  but GET-only keeps our read-only token stance), `/spaced_repetition_systems`,
  `/voice_actors` (irrelevant).
- Calculations layer: ~15 pure, framework-independent modules in
  `src/lib/calculations/` — the natural target for the test suite (issue #47).

### The strategic opening

WaniKani **permanently disabled `GET /reviews` in April 2023** (returns 404).
Historical per-review data is gone from the API and can never be backfilled by
anyone. This broke the Heatmap userscript's data source; it survives only by
recording review sessions live as a userscript running on the WaniKani page —
something no standalone web app can do.

Consequence: any app that **accumulates its own review-activity history going
forward** builds data that is (a) unavailable to late entrants and (b) a real
switching cost for users. Most recommendations below orbit this fact.

### Hard constraints

- No backend; local-first and privacy-focused is a selling point — keep it.
- WaniKani API: 60 req/min, app is read-only against it.
- Solo maintainer; test suite landed in 2.21 (#47 closed), no eslint. Prefer
  high value-to-maintenance ratio.

---

## 2. Competitive landscape (re-researched 2026-06-12 at v2.24.0)

| Competitor | What they have that we don't | Weakness |
|---|---|---|
| **Wanilog** ⚠️ *primary threat* | **Leech trainer** (full-screen flashcards, tap-to-flip, self-grade, auto audio on reveal, **three selectable scoring algorithms**); **"Can I read this?"** paste-text readability analyzer (gap characters highlighted); **direct JLPT N5–N1 coverage with drill-down**; live NHK-headlines reading coverage (Best coverage / Best for learning / Most recent filters); statistical projections with **confidence intervals**, goal level/date, **what-if pace slider**; **standalone calculator suite** as SEO landing pages (level-by-date, daily review budget, vacation impact, queue burndown, reset recovery, JLPT countdown, burn time); **demo mode** (try without a token); achievements/medals; manual known-kanji input; "effective accuracy" (meaning × reading); Japanese UI, 4 palettes; cinematic 1→60 replay; a **comparison landing page vs wkstats** | Smaller mindshare; **no historical activity capture** — no heatmap, no streaks-over-time, no data moat. Optional server features (public profiles, achievement sync) dilute their privacy pitch. Walked back NHK Easy integration as unreliable — external-content maintenance burden is real |
| **wkstats.com** | Items grouped by JLPT/Jōyō/**frequency**; canonical brand (still the first name people search) | v2 projections never finished; stale, desktop-era UI; lost review history when API died; no workload forecast, no leech tools. Fading — Wanilog markets directly against it |
| **Heatmap userscript (Kumirei)** | Per-day **drill-down to item level** (SRS, type, accuracy), time-spent estimates, level-up markers on calendar, configurable color intervals/themes | Desktop Tampermonkey only; invisible to mobile/PWA users |
| **Item Inspector userscript** | Deeply configurable item tables, leech filters, export | Userscript-only, notoriously complex UI |
| **Self-Study Quiz / Extra Practice userscripts** | Quiz over **arbitrary filtered item sets** (recently failed, current level, custom lists) | Userscript-only; recurring community wish for this off-desktop |
| **Ultimate Timeline 2 userscript** | Hour-by-hour review timeline | We already have review forecast; userscript-only |
| **Tsurukame / Smouldering Durtles** | Offline reviews/lessons (review clients — different category); Smouldering Durtles bundles a self-study quiz | Stats are an afterthought |
| **BishBashBosh** | Cram quiz for Apprentice-1 items + recent failures | Single-purpose, dated |

Userscripts are less a threat than a roadmap: they prove demand for features
that only reach desktop userscript users; we can bring them to everyone,
mobile included.

**Positioning (June 2026)**: Wanilog wins on breadth and acquisition surface
(calculators-as-SEO, demo mode, comparison pages); a solo maintainer cannot
out-feature them release-for-release. We win by (a) owning the historical-data
axis they structurally lack — activity capture compounds switching cost every
month, (b) making analysis *actionable* (leech trainer fed by confusion-pairs
data nobody else has), and (c) answering our own users' requests fast (§2.1 —
all three are covered by 2.26–2.28).

Reference threads:
- /reviews shutdown: https://community.wanikani.com/t/api-changes-get-all-reviews/61617
- Wanilog: https://community.wanikani.com/t/wanilog-modern-wanikani-stats/74139
- Wanilog vs wkstats comparison: https://wanilog.com/compare/wkstats
- Heatmap: https://community.wanikani.com/t/userscript-wanikani-heatmap/34947
- Item Inspector: https://community.wanikani.com/t/userscript-wanikani-item-inspector/44564
- Self-Study Quiz: https://community.wanikani.com/t/userscript-self-study-quiz/13191

### 2.1 User-request log (our community thread)

Source: https://community.wanikani.com/t/i-built-a-wanikani-stats-tracker-with-some-features-i-thought-were-missing/72569

| Request | Who / when | Status |
|---|---|---|
| Speedrun-aware projections: levels 1–2 and 43–60 are ~3d10h, others ~6d20h; project from *current* level, not uniform averages | NihongoDhruv, Dec 2025 | → 2.28 |
| Related bug: speedrun pace computed slower than active pace | Shiveringomelet, Dec 2025 | → 2.28 |
| Toggleable YYYY-MM-DD labels for exact level-up dates on the timeline | pabbles, Dec 2025 | → 2.28 |
| JLPT readiness flexibility: real N-level coverage (not just Jōyō proxy), custom goal percentages, multiple measurement methods; cited wkstats' percentage coverage as the model | lizziemeaow, Mar 2026 | → 2.26 |
| Broader community: custom item lists to quiz outside the review cycle (Apr 2025); review-availability notifications (recurring) | community-wide | → 2.25 pools / Tier 3 badge |

---

## 3. Tier 1 — Quick wins (≈ a weekend each, data already synced)

### 3.1 Review activity capture engine ← first *feature* (after §6 durability work)
- **What**: On every sync, diff each subject's review-statistics answer totals
  (`meaning_correct + meaning_incorrect + reading_correct + reading_incorrect`)
  against previous values; bucket deltas into the current date. Detect lessons
  via `started_at`. Store one small row per day in a new IndexedDB store.
  Also snapshot the 10-number SRS-stage distribution daily (enables a future
  "SRS over time" stacked-area chart, nearly free).
- **Who**: everyone — but the value compounds for long-term users.
- **Why**: data can never be backfilled; every week of delay is history users
  permanently lose. Once a user has months of history here, switching to
  Wanilog means abandoning it. This is the moat.
- **Shape**: hook into `performSync()` in `src/lib/sync/sync-manager.ts`;
  new `src/lib/db/repositories/activity-history.ts`; `DB_VERSION` bump.
  Granularity is per-sync — day-level for daily users; acceptable.
- **Note**: pure-function diff logic — ideal first target for the #47 test
  suite. A bad diff corrupts history users cannot regenerate; write tests first
  here specifically.

### 3.2 Level-up blockers panel
- **What**: "You need 4 more Guru'd kanji to level up — here they are; earliest
  possible level-up is Thursday 9am." From assignments (`srs_stage`,
  `available_at`) + current-level kanji: find the 90% passing threshold,
  identify blocking items, walk remaining SRS intervals to earliest Guru date.
- **Who**: new and mid-level users; daily-utility feature.
- **Why**: Wanilog markets "level-up clarity"; wkstats and WaniKani itself
  don't have it. Highest daily-engagement-per-effort on this list.
- **Shape**: dashboard card + drill-down via existing `DrilldownModal` /
  `ItemDetailContent`; new `src/lib/calculations/level-up-blockers.ts`.

### 3.3 Streaks & personal records
- **What**: surface per-item streak fields already synced in
  review_statistics (`meaning_current_streak`, `meaning_max_streak`, reading
  equivalents — displayed nowhere today): items on 20+ streaks, longest streak
  ever, items whose current streak is 1 after a long max (recently broke —
  at-risk). Later, daily study streak from 3.1 data.
- **Who**: veterans and motivation-driven users.
- **Why**: Heatmap script's most-loved feature is streaks; we can do item-level
  streaks today with zero new data.
- **Shape**: mostly display work; complements Knowledge Stability.

### 3.4 Kanji frequency coverage
- **What**: "You can recognize 87.4% of kanji in typical newspaper text."
  Static frequency-rank JSON (newspaper/Wikipedia corpus) joined against kanji
  SRS stages.
- **Who**: intermediate learners.
- **Why**: closes a gap vs both wkstats (frequency grouping) and Wanilog
  (reading coverage). Zero new API data, zero ongoing maintenance.
- **Shape**: new data file alongside `src/data/jlpt/joyo-kanji.json`; slots
  into the Readiness page's existing threshold UI.

---

## 4. Tier 2 — Differentiators

### 4.1 Activity heatmap + streaks page (payoff of 3.1)
- GitHub-style year calendar of reviews/lessons per day, streak stats, busiest
  day, totals. Today this exists **only** as a desktop userscript; wkstats lost
  it forever; Wanilog doesn't list it. We'd be the only place mobile/PWA users
  can get a review heatmap at all.
- **Effort**: ~2 weekends once capture exists (calendar grid is the only new
  UI primitive).
- **Must ship with history export/import** (extend `src/lib/export/`) —
  accumulated history is irreplaceable; users need a backup path before they
  trust it.

### 4.2 Share cards
- Canvas-rendered PNG stat cards ("Level 23 · 4,512 items · 1,847 burned ·
  92.3% accuracy") for level-ups, milestones (Milestone Timeline already
  computes these), year-in-review.
- WaniKani's forum is extremely active; stat-sharing posts are a genre. Every
  shared card is an ad. Wanilog already has this — it's their growth engine.
- **Effort**: ~1–2 weekends (offscreen canvas, fixed-layout templates). No new
  data, near-zero maintenance.

### 4.3 Leech trainer (self-study quiz)
- Flashcard quiz over the leech list: show character → reveal reading/meaning →
  self-grade. Purely local; never writes to WaniKani (read-only token stance
  holds). Turns the Leeches page from a report into a tool.
- This is BishBashBosh's / Self-Study Quiz's entire reason to exist; Wanilog
  has one. Our confusion-pairs data enables a mode nobody has: quizzing
  visually-similar items against each other.
- **Who**: struggling mid-level users — the segment most likely to churn from
  WaniKani entirely.
- **Effort**: ~2–3 weekends — new interaction model, but no new data or sync.

### 4.4 Study materials integration
- Sync `GET /study_materials` (one more collection, identical repository
  pattern — the only meaningful API resource we don't touch). Show users' own
  notes/synonyms in item detail modals; flag leeches with no note ("your 10
  worst leeches have no mnemonic notes").
- **Effort**: ~1 weekend. Modest standalone value; compounds with the trainer.

---

## 5. Tier 3 — Bigger bets

### 5.1 Review-availability notifications (PWA)
- Badging API (icon badge with review count) + periodic background sync works
  adequately on Android/desktop Chrome, no backend. True push needs a push
  server — a real backend, straining the "no intermediary servers" pledge.
  iOS background sync for PWAs remains unreliable.
- **Recommendation**: ship badge-only (~2 weekends); **skip the push server**
  (4–6 weekends + a server to operate forever — worst value-to-maintenance
  ratio here for a solo maintainer).

### 5.2 Opt-in cloud backup of accumulated history
- Once the activity moat exists, losing it to a cleared browser becomes the top
  support complaint. Order of attack: (a) file export/import (4.1 — sufficient
  for v1); (b) client-side OAuth sync to the user's own Google Drive appData
  folder — no server of ours, privacy story intact (~3–4 weekends; OAuth
  refresh edge cases are the maintenance tail). Build only if users ask.

### 5.3 "WaniTrack Wrapped" (year in review)
- December feature: activity history + share cards + milestones as an annual
  story. High community-buzz potential. Requires ~a year of activity data —
  itself an argument for shipping capture now (Dec 2026 Wrapped needs data
  from June 2026).

### 5.4 Vocabulary/JLPT-vocab readiness
- Deliberately removed in 2.5.0 as "too subjective"; Wanilog tracks it anyway
  and users like it. Revisit with clear caveats (~2–3 weekends incl. sourcing
  vocab lists). Lower priority than everything above.

---

## 6. PWA / offline audit (June 2026) — prerequisite work

The roadmap's heatmap/streak features assume the PWA is trustworthy as a
daily-open app, including offline. Audited 2026-06-09 at v2.20.1: the service
worker layer mostly works; **the app's own cache-clearing code sabotages it**,
and the data layer has offline correctness bugs.

### What works today

- Production build registers the service worker (`registerSW.js` injected by
  vite-plugin-pwa, correct scope under the custom domain via
  `VITE_CUSTOM_DOMAIN` in `deploy.yml`), precaches all assets including every
  lazy route chunk, and has a `NavigationRoute` fallback to `index.html` —
  the shell and all pages load with no network.
- All four synced collections read from IndexedDB, so Progress / Accuracy /
  Leeches / Kanji / Readiness render real data offline.
- `InitialSync` shows the app immediately when cached data exists (sync runs in
  background); an `OfflineIndicator` banner already exists.

### What breaks it

1. **Version manager destroys the PWA on every release (critical).**
   `checkAndUpdateVersion()` (`src/lib/cache/version-manager.ts`) runs before
   first render; on any version change it calls `clearDatabase()` — wiping all
   synced IndexedDB data and forcing a full re-sync every release — and
   `clearServiceWorkerCaches()`, which deletes **every** Cache Storage cache
   including Workbox's precache out from under the live service worker.
   Offline loads then hard-fail until the SW reinstalls. Likely the true root
   cause of the "stale chunk errors" that `lazyWithRetry` papers over. The
   same nuke runs on Force Full Sync (`use-sync.ts`) and logout
   (`user-store.ts`). **Roadmap blocker**: the future activity-history store
   would be erased on every version bump, killing the moat before it starts.
2. **Network-only queries with no offline fallback** (`src/lib/api/queries.ts`):
   - `/user` is never persisted (user store deliberately holds only the
     token) → offline, the dashboard hero renders `user?.level ?? 1` =
     **"Level 1"** for everyone; every calculation needing current level
     degrades.
   - `/resets` defaults to `[]` on failure → offline, reset users **silently
     see pre-reset data again** — the exact bug fixed in 2.19.1 resurfaces.
   - `/summary` just fails → no lessons count / next-review time (reviews
     count already has an assignment-based fallback; lessons doesn't).
3. **Smaller**: Google Fonts from CDN with no runtime caching (cosmetic
   fallback offline); first-ever launch offline shows a generic "Sync Failed"
   instead of "connect once to set up"; offline sync failures are
   indistinguishable from API outages in the UI.

### Work items ("Solid ground")

- Replace the version-change nuke with real IndexedDB migrations — the
  `DB_VERSION` / `onupgradeneeded` machinery in `src/lib/db/database.ts`
  already exists and is unused for this. Version bumps must preserve synced
  data (delta sync handles freshness) and must never touch durable
  history stores.
- Never delete the Workbox precache from app code (version change, force
  sync, or logout) — `autoUpdate` already handles asset freshness. Once
  fixed, `lazyWithRetry` is likely removable.
- Persist last-known `/user` and `/resets` snapshots (IndexedDB or
  localStorage) as offline fallbacks → real level + correct post-reset data
  offline.
- Derive lessons-available / next-review from assignments when `/summary` is
  unreachable.
- Offline-aware sync UX: suppress "Sync Failed" when `navigator.onLine` is
  false; retry on the `online` event; friendly first-launch-offline message.
- (Polish) Runtime-cache or self-host fonts.
- **Issue #47 (test suite) is in-scope for this release, not a separate
  chore.** The migration code replacing the version-nuke is the
  highest-stakes code in the app — a bad migration destroys data users can't
  regenerate — so it gets written test-first. That means the harness decision
  (likely Vitest + fake-indexeddb, given Vite) and the CI wiring in
  `ci.yml` land here, and every later release inherits a working test setup.

**Estimated effort**: 2–3 weekends. **Hard prerequisite** for the activity
capture engine: the moat argument collapses if a routine release wipes
history, and the heatmap's daily-PWA-user story depends on offline being
trustworthy.

---

## 7. Release roadmap

Shipped:

| Release | Theme | Contents |
|---|---|---|
| **2.21** ✅ | "Solid ground" | Offline & data durability (§6 work items): IDB migrations replace version-nuke, precache preserved, offline fallbacks, offline-aware sync UX. Closed #47: test harness + CI |
| **2.22** ✅ | "The flight recorder" | Activity capture engine + SRS-distribution snapshots + streaks/records + history export-import |
| **2.23** ✅ | "Show your work" | Activity heatmap page + share cards |
| **2.24** ✅ | "Daily driver" | Level-up blockers on Dashboard + frequency coverage on Readiness |

Planned (re-sequenced 2026-06-12 after competitive refresh):

| Release | Theme | Contents | Rationale |
|---|---|---|---|
| **2.25** | "Treatment, not just diagnosis" | **Leech trainer**: flashcard quiz over leeches; **confusion-pair mode** (quiz visually-similar items against each other — unique to us); selectable item pools (leeches / recently failed / current level — answers the custom-lists community wish); audio from subject data; session results recorded locally. Study materials sync (§4.4) if it fits | Engagement loop; matches Wanilog's headline feature and beats it with confusion-pairs data |
| **2.26** | "Real JLPT" | Direct **JLPT N5–N1 coverage** with drill-down, **custom goal %**, per-level coverage; keep Jōyō view alongside | Verbatim user request (§2.1) + the most-cited gap vs both Wanilog and wkstats; static data file + existing Readiness threshold UI |
| **2.27** | "Can I read this?" | Paste-text readability analyzer: % readable at chosen SRS threshold, gap characters highlighted, each gap linked to its WaniKani item | High-delight, fully client-side, zero ongoing maintenance, very shareable. Deliberately *not* live NHK integration (Wanilog already walked theirs back) |
| **2.28** | "Honest projections" | Speedrun-aware fast-level math (levels 1–2 / 43–60 at ~3d10h), median projection + confidence band, what-if pace slider, goal-date mode, exact level-up date labels on timeline; fixes the speedrun-pace bug | Clears the entire §2.1 projection backlog in one release; closes Wanilog's projection-math lead |
| **2.29** | "Open door" | **Demo mode** (bundled sample dataset behind the setup page — explore without a token) + a wkstats comparison/SEO landing page | Acquisition: today every tokenless visitor bounces; Wanilog proved both plays work |

Later bucket (sequenced behind the above): achievements (local-only, feeds
share cards) · badge-only PWA notifications (§5.1) · heatmap per-day drill-down
to item level (Kumirei parity — needs richer capture granularity; consider
starting the richer capture earlier even if UI waits) · "WaniTrack Wrapped"
Dec 2026 (§5.3) · manual known-kanji input · vocab/JLPT-vocab readiness (§5.4).

Explicitly skipped: Japanese UI / palettes / cinematic replay (polish, not
value), live NHK content (maintenance tail), offline reviews / write-API
(different product category), public profiles / server-side anything (violates
no-backend principle — our counter is the local moat + export).

---

## 8. Maintenance principles

- Every new calculation ships with tests (#47); the activity-diff engine is the
  one place tests-first is genuinely the cheap option (stateful, corrupts
  irreplaceable data if wrong).
- Prefer features whose data is already synced; each new synced collection adds
  sync-time, rate-limit pressure, and migration surface.
- Never compromise: local-first, no intermediary servers, read-only token.
- Static data files (frequency lists, JLPT/Jōyō) > new API dependencies.
