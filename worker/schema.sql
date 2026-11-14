-- WaniTrack usage analytics (Cloudflare D1)
-- Apply with: npx wrangler d1 execute wanitrack-analytics --remote --file=worker/schema.sql
-- Design notes: docs/analytics-plan.md §4. No IPs, user agents, usernames or
-- tokens are stored anywhere. `uid` is HMAC(UID_SECRET, sha256(user uuid)).

-- One row per pseudonymous user: when they were first seen, and whether that
-- first appearance was a fresh token connect (1) or an existing user (0).
CREATE TABLE IF NOT EXISTS users (
  uid         TEXT PRIMARY KEY,
  first_day   TEXT NOT NULL,             -- YYYY-MM-DD (UTC)
  via_connect INTEGER NOT NULL DEFAULT 0
);

-- One row per user per active day. No raw event log is kept.
CREATE TABLE IF NOT EXISTS user_days (
  day   TEXT NOT NULL,                   -- YYYY-MM-DD (UTC)
  uid   TEXT NOT NULL,
  opens INTEGER NOT NULL DEFAULT 0,      -- app loads that day
  pages INTEGER NOT NULL DEFAULT 0,      -- bitmask of pages viewed (see `pages`)
  PRIMARY KEY (day, uid)
);
CREATE INDEX IF NOT EXISTS user_days_uid ON user_days (uid, day);

-- Identifier-free daily counters: landing, connect_ok, connect_fail:<reason>,
-- open_pwa, open_uncached, error:<kind>:<status|na>
CREATE TABLE IF NOT EXISTS counters (
  day  TEXT NOT NULL,
  name TEXT NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name)
);

-- Static lookup for decoding user_days.pages. Must match PAGES in
-- src/lib/analytics/events.ts (bit = 1 << index).
CREATE TABLE IF NOT EXISTS pages (
  bit  INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT OR IGNORE INTO pages (bit, name) VALUES
  (1, 'dashboard'),
  (2, 'progress'),
  (4, 'activity'),
  (8, 'accuracy'),
  (16, 'forecast'),
  (32, 'leeches'),
  (64, 'trainer'),
  (128, 'kanji'),
  (256, 'readiness'),
  (512, 'settings');
