# Live pipeline: what refreshes itself, what is a snapshot, and why

Status (2026-11-06): KV provisioned and seeded with 20/20 Wikimedia rows;
`watch-live` Worker deployed with the daily cron. The Pages binding is declared
in the root `wrangler.toml`. M3 monitoring is not installed. A deployed schedule
is not proof of a completed scheduled run; check health after the next 06:40 UTC run.

## The short version

- **Daily, automatic:** the attention band ("Trending in public attention"). A Cloudflare
  Worker cron (`worker/live/`) fetches Wikimedia Pageviews once a day at 06:40 UTC
  (13:40 ICT), writes one snapshot to KV, and the site reads it at `/live/market_trends.json`
  through a Pages Function (`functions/live/`). Nothing runs on the M3.
- **Snapshot, refreshed by a person:** everything that feeds a computed number (CPI, FX,
  auction comps, catalog, sightings). The conservation law says every published number is a
  pure function of committed evidence, so these are refreshed by running the collector,
  reviewing the diff, committing, and redeploying. A live feed would bypass review.
- **Never faked:** if the live endpoint is down, the page falls back to the copy baked into
  the build and says so ("BUILD SNAPSHOT"). A source that is not connected is named as
  "NOT CONNECTED", not hidden.

## Sources

| Panel / dataset | Source | Licence / terms | Cadence | How it is refreshed |
| --- | --- | --- | --- | --- |
| Attention band (Home, Discover, Register sort, Saved pulse, Dossier) | Wikimedia Pageviews REST API | Official, free, keyless; descriptive User-Agent required (sent) | Daily | Worker cron → KV → `/live/` |
| Attention band, Trends column | Google Trends | Only an unofficial endpoint exists; not called by the cron | — | **Not connected** in the live path. Manual `npm run data:trends` still works and is labelled unofficial |
| CPI adjustment | FRED CPIAUCSL (`fredgraph.csv`) | Public, keyless; cite FRED / BLS | Monthly (mid-month) | `npm run data:cpi`, review, commit, redeploy |
| FX for non-USD auction lots | ECB reference rates via Frankfurter (`api.frankfurter.dev`) | ECB data, free, keyless | Daily (only needed per sale date) | `npm run data:fx` after a harvest |
| Auction comps / census | Phillips public results pages | Terms page blocks automated readers, so not verified; robots.txt allows auction pages | Per sale (a few a year) | Manual, low-rate `npm run data:market:harvest`; human promotion only. Not scheduled |
| Screen sightings | watch-id.com + editorial roundups | Public pages; credited | Rarely | Manual `npm run data:screen:harvest` |
| Market context (index %s) | WatchCharts public index pages | API is paid ($600+/mo) and display needs a distribution licence | — | Hand-compiled snapshot dated "July 2026"; no automated path at $0 |
| Rolex catalog | User-supplied TSV (2026-07-31/08-04) | — | — | Manual |
| Watchmaking artifacts | Wikimedia Commons (CC0/PD/CC BY/BY-SA) | Per-file licence shown | Rarely | Manual |

## Caps (Cloudflare has no spend cap, so the design carries its own)

- One cron run a day. One Wikimedia request per watchlist row, capped at 40 rows
  (Workers Free allows 50 subrequests per run).
- Two KV writes per run (snapshot + health). Free plan allows 1,000 a day.
- Only `/live/*` invokes a Function; every other path is a static asset. `/live/` responses
  carry `max-age=600` and go through the edge cache, so KV reads stay far below 100,000/day.
- On the Workers Free plan an overrun returns an error instead of a bill; the page then falls
  back to the build snapshot. If the account is on Workers Paid, set a usage notification in
  the Cloudflare dashboard (Notifications → Workers usage).

## Failure handling

- A run with fewer than 5 rows carrying a signal never overwrites the last good snapshot.
- `health` in KV records `last_attempt`, `last_ok`, `consecutive_failures`, `last_error`.
- `/live/health.json` returns `ok` (200), or `stale` (served snapshot older than 36 h),
  `failing` (2+ failed runs in a row), `not_connected` (no KV binding or no snapshot) as 503.
- `ops/m3/watch-live-health.sh` curls that endpoint every 5 minutes and alerts only after a
  problem has lasted more than 10 minutes, once per incident, plus one recovery note.
- The frontend picks the fresher valid snapshot of live vs build, so a stale KV entry never
  hides a newer deploy, and the SPA fallback HTML is never mistaken for data.

## Why not a collector on the M3

The M3 runs FloodDash (must not fail) and was at 12.9 of 13.3 GB swap used when this was
designed. None of these sources needs a residential IP or a browser, and a Worker cron costs
the M3 nothing. Deploying from the M3 would also mean building the site there, and a
clean-clone build there could ship a tree that differs from what is live. `worker/live/run-local.mjs`
can still run on any Mac as a manual fallback; it refuses to run when free swap is under 512 MB.

## Installation / recovery

1. Initial provisioning only: `ops/install-live.sh` (creates KV `watch-live`, deploys the
   Worker with its cron, seeds KV once, writes `wrangler.toml` files). Commit the two
   `wrangler.toml` files.
   For the existing installation, use `wrangler deploy --config worker/live/wrangler.toml`;
   do not create a second namespace.
2. Deploy the site: `npm run deploy`.
3. Check: `curl -s https://watch.nonarkara.org/live/health.json` shows `"status":"ok"`.
4. On the M3 (separate go): `ops/m3/install-health-agent.sh`, with `WATCH_ALERT_CMD` set in the
   plist if alerts should reach Telegram.

No keys are needed.
