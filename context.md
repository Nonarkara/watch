# WATCH — Collectible Watch Intelligence System

**Project code:** `WATCH` · **Domain:** watch.nonarkara.org (Cloudflare Pages) · **Working name:** The Watch Register

## What this is

Free, highly detailed, AI-curated + human-verified yellow pages for luxury and collectible watches. ~300 reference cards with real market data: price vs retail (nominal + CPI-adjusted), Scarcity Index, Collectibility Index, provenance timelines (the "Federer effect" made visible), liquidity, and an honest A/B/C data-confidence tier. v1.0 is read-only intelligence; the marketplace/matchmaker is a later phase. Plan: `~/.claude/plans/a-new-project-graceful-lecun.md`.

## Decisions (2026-07-31, Dr Non)

- Data: **public sources only** — auction results, eBay sold, r/Watchexchange, ChronoPulse, Morgan Stanley × WatchCharts, brand MSRPs, FRED CPI. No FB/Telegram scraping.
- English-first, global, USD. Thai later.
- Research working paper (~5–8k words, design-science) ships with the site.

## Architecture (conservation law)

Every published number is a **pure function of on-card raw evidence + committed shared snapshots**. Nothing hand-entered in `computed`. Cards refuse to estimate below 3 comps and degrade honestly (reason codes, never fake numbers).

```
data/cards/*.json          raw cards (identity, MSRP history, comps w/ URLs, provenance, scarcity inputs)
data/shared/               committed snapshots: cpi_snapshot.json (FRED), brand_production.json (Morgan Stanley)
scripts/lib/indices.mjs    pure index math (7 metrics)
scripts/validate_card.mjs  invariant gate (build fails on violation)
scripts/build_indices.mjs  cards → public/data.json (MASKED: full comps internal, ≤5 cited notable sales public)
scripts/test-invariants.mjs assert-based self-check incl. idempotence — run before every commit
```

- `npm run data:build` → compile cards. `npm test` → invariants. `BUILD_DATE=YYYY-MM-DD` pins determinism.
- Frontend: Vite + React 19 + TS + Tailwind v4, react-router. Design tokens imported from `_shared/design-tokens/dr-non-brand.css`.
- Card schema contract: `data/SCHEMA.md` — read it before touching any card.

## Anti-Regression

- The **honesty ladder is the product**: no market price without ≥3 sourced comps; missing data renders "—" + reason, never 0, never a guess. Do not "fix" empty metrics by filling them.
- The **masked publish** is deliberate (Sabai Sabai pattern): full comps never ship to the client. Do not "helpfully" publish the raw comps array.
- Zero border-radius, one amber, 3 text sizes, hairline borders, mobile-first — house law (§11/§14).
- Every metric shows source, n, window, limitation. Removing a limitation string is a regression.
