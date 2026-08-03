# TIME POP — Collectible Watch Intelligence System

**Project code:** `WATCH` · **Domain:** watch.nonarkara.org (Cloudflare Pages) · **Working name:** Time Pop (formerly The Watch Register)

## What this is

Free, highly detailed, AI-curated + human-verified living archive for luxury and collectible watches. The current build contains 261 unique reference cards with real market data: price vs retail (nominal + CPI-adjusted), Scarcity Index, Collectibility Index, provenance timelines (the "Federer effect" made visible), liquidity, credited film/TV stills, and an honest A/B/C data-confidence tier. v1.0 is read-only intelligence; the marketplace/matchmaker is a later phase.

## Decisions (2026-07-31 / 2026-08-02, Dr Non)

- Data: **public sources only** — auction results, eBay sold, r/Watchexchange, ChronoPulse, Morgan Stanley × WatchCharts, brand MSRPs, FRED CPI. No FB/Telegram scraping.
- English-first, global, USD. Thai later.
- Research working paper (~5–8k words, design-science) ships with the site.
- **Public name is Time Pop** (2026-08-02). Internal project code stays `WATCH`.
- Film stills: promotional/editorial only — credit studio + editorial roundup (Teddy Baldassarre). Never invent a free-reuse licence.

## Architecture (conservation law)

Every published number is a **pure function of on-card raw evidence + committed shared snapshots**. Nothing hand-entered in `computed`. Cards refuse to estimate below 3 comps and degrade honestly (reason codes, never fake numbers).

```
data/cards/*.json          raw cards
data/shared/               cpi, brand_production, screen_sightings, images
scripts/build_indices.mjs  cards → public/data.json (MASKED)
scripts/build_screen_sightings.mjs  Rolex Watch-ID + iconic film stills
scripts/test-invariants.mjs
```

- `npm run data:screen` rebuilds sightings. `npm test` before every commit.
- Frontend: Vite + React 19 + TS + Tailwind v4. Schema: `data/SCHEMA.md`.

## Product and design law — Time Pop pop-art (named folly)

Time Pop is a civic research instrument wearing refined pop art: warm canvas `#F6F0E5`, navy `#11364B`, coral accent `#EF6A5B` (CSS `--amber` maps to coral so existing rules keep working). Zero border-radius except true circles. No Inter/Roboto/etc. Archivo + Spectral + IBM Plex Mono. Halftone and offset color blocks are selective — one gesture per section.

**Hero banner is load-bearing.** `public/img/hero/time-pop-banner.png` is the Time Pop brand surface on the home fold (and OG share image). Composition (Grok 4.5 audit 2026-08-03): banner = oversized full-bleed *ground*; cream slab = thesis + CTAs; 8-cell ledger = floor with live counts (invented prices hard-coded 0). Do not demote the banner to a sibling column or replace the ledger with a second proof ribbon.

When two sightings map to the same reference (e.g. Milgauss 116400GV on White Lotus and A Man in Full), show the dossier portrait once. The second card says the portrait is shared — never paste the same photo as if it were two different stills.

Screen exposure is demand-side attention, never physical scarcity. Exact-reference matches only enter the attention heuristic; family-level and tentative IDs stay labeled.

**Watchmaking artifacts** live in `public/img/watchmaking/` + `public/data/watchmaking_artifacts.json`. Wikimedia Commons only: CC0 / Public Domain / CC BY / CC BY-SA (no NC/ND). Every figure shows artist + licence + Commons link.

## Anti-Regression

- Home hero pop-art banner (`/img/hero/time-pop-banner.png`) — keep; named brand surface.
- Honesty ladder: no market price without ≥3 sourced comps; missing data renders "—" + reason.
- Masked publish: full comps never ship to the client.
- Film stills always carry studio + editorial credit and a promotional/editorial rights line.
- Every metric shows source, n, window, limitation.
- A brand + reference identity may appear only once. The build refuses duplicate dossiers even when their slugs differ.
