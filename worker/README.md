# wanitrack-events (usage analytics Worker)

A first-party endpoint at `wanitrack.com/api/event`. It receives the app's anonymous usage events
and stores them in D1 as aggregate rows. The design, privacy rationale, queries and decision
criteria are in [`docs/analytics-plan.md`](../docs/analytics-plan.md).

## One-time setup

Run these from the repo root. `npx wrangler` needs a Cloudflare login (`npx wrangler login`).

```bash
# 1. Create the database and paste the printed database_id into worker/wrangler.toml
npx wrangler d1 create wanitrack-analytics

# 2. Create the tables
npx wrangler d1 execute wanitrack-analytics --remote --file=worker/schema.sql

# 3. Set the HMAC secret (keep it only in Cloudflare; destroying it anonymises stored ids)
openssl rand -hex 32 | npx wrangler secret put UID_SECRET --config worker/wrangler.toml

# 4. Deploy the Worker and its route
npx wrangler deploy --config worker/wrangler.toml
```

Deploy the Worker **before** merging the app change. `deploy.yml` builds with
`VITE_ANALYTICS_ENDPOINT=/api/event`. Without the Worker those POSTs reach GitHub Pages and fail
harmlessly, but no data is collected.

Optional hardening (Cloudflare dashboard → Security → WAF → Rate limiting rules): limit
`/api/event` to about 60 requests/minute per IP.

## Excluding your own usage

1. Right after deploying, open WaniTrack while logged in, before anyone else is likely to. Then
   find your server uid. It will be the only, or earliest, `users` row:
   ```bash
   npx wrangler d1 execute wanitrack-analytics --remote --command "SELECT * FROM users ORDER BY first_day LIMIT 5"
   ```
   To confirm it's you, open only one rarely used page (for example Accuracy) and check which
   `user_days` row's `pages` bitmask gains that page's bit.
2. Add it to `wrangler.toml`:
   ```toml
   [vars]
   EXCLUDE_UIDS = "<uid>"
   ```
3. Redeploy, and delete your existing rows:
   `DELETE FROM user_days WHERE uid='<uid>'; DELETE FROM users WHERE uid='<uid>';`

## Reading the numbers

Run the queries in `docs/analytics-plan.md` §4:

```bash
npx wrangler d1 execute wanitrack-analytics --remote --command "<sql>"
```

## Retention and teardown

- A daily cron (03:17 UTC) deletes `user_days` and `counters` rows older than 90 days, plus
  `users` rows with no remaining activity.
- To end the study:
  ```bash
  npx wrangler delete --config worker/wrangler.toml
  npx wrangler d1 delete wanitrack-analytics
  ```
  Then remove `VITE_ANALYTICS_ENDPOINT` from `.github/workflows/deploy.yml`.
