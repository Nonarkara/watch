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

## Product and design law — Civic/Editorial + “Doraemon on LV”

The register is a civic research instrument wearing a playful maison lookbook. “Doraemon on Louis
Vuitton” is the named folly: full editorial play, not a console with a novelty sticker. Use cream
paper, ink, quiet catalog typography, generous object photography, and hairline rules. Let one
comic device interrupt each surface—a speech bubble, doodled orbit, bright label, or deliberately
crooked card. The result should feel classy, generous, and curious.

Incomplete research is visible material. An absent image becomes an empty sourced-media frame;
thin comps become an unfinished ledger line; an uncomputable claim stays crossed out. Never rotate
generic stock images through references. Source-linked catalog media may be shown with credit and a
clear rights status, but a reuse licence must never be invented.

Screen exposure is demand-side attention, never physical scarcity. Only exact-reference film and TV
matches enter the attention heuristic; family-level and tentative identifications remain visibly
qualified. Brand tiers are editorial peer context only and never multiply price, scarcity, or
collectibility.

## Anti-Regression

- The **honesty ladder is the product**: no market price without ≥3 sourced comps; missing data renders "—" + reason, never 0, never a guess. Do not "fix" empty metrics by filling them.
- The **masked publish** is deliberate (Sabai Sabai pattern): full comps never ship to the client. Do not "helpfully" publish the raw comps array.
- Paper, ink, primary-color play, editorial type, hairline borders, mobile-first. Curves belong to the
  named playful interrupt (speech bubbles, circles), not every container.
- Every metric shows source, n, window, limitation. Removing a limitation string is a regression.
