# TIME POP — Collectible Watch Intelligence System

**Project code:** `WATCH` · **Domain:** watch.nonarkara.org (Cloudflare Pages) · **Working name:** Time Pop (formerly The Watch Register)

## What this is

Free, highly detailed, AI-curated + human-verified living archive for luxury and collectible watches. The current build contains 302 unique reference cards with real market data: price vs retail (nominal + CPI-adjusted), Scarcity Index, Collectibility Index, provenance timelines (the "Federer effect" made visible), liquidity, credited film/TV stills, and an honest A/B/C data-confidence tier. v1.0 is read-only intelligence; the marketplace/matchmaker is a later phase.

## Decisions (2026-07-31 / 2026-08-02, Dr Non)

- Data: **public sources only** — auction results, eBay sold, r/Watchexchange, ChronoPulse, Morgan Stanley × WatchCharts, brand MSRPs, FRED CPI. No FB/Telegram scraping.
- English-first, global, USD. Thai later.
- Research working paper (~5–8k words, design-science) ships with the site.
- **Public name is Time Pop** (2026-08-02). Internal project code stays `WATCH`.
- Film stills: promotional/editorial only — credit studio + editorial roundup (Teddy Baldassarre). Never invent a free-reuse licence.

## Architecture (conservation law)

Every published number is a **pure function of on-card raw evidence + committed shared snapshots**. Nothing hand-entered in `computed`. Cards refuse to estimate below 3 comps and degrade honestly (reason codes, never fake numbers).

**Market-evidence intake.** `npm run data:market:harvest` discovers completed Phillips watch
auctions, saves compressed raw responses locally, parses all lots, exact-matches them to dossiers,
deduplicates against existing comps, and writes a manifest plus `data/market/review-queue.json`.
Every harvested lot must become ready-for-review, quarantined, duplicate, or failed. Scraping never
changes a valuation. `data:market:promote` moves one human-reviewed realized USD sale into one card;
comparable promotion is blocked for material mismatches, named provenance, special signatures,
charity lots, non-USD prices, missing detail evidence, and ambiguous references.

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

Time Pop is a civic research instrument wearing refined pop art: warm canvas `#F6F0E5`, navy `#11364B`, coral accent `#EF6A5B` (CSS `--amber` maps to coral so existing rules keep working). Zero border-radius except true circles. No Inter/Roboto/etc. Jost + Spectral. Halftone and offset color blocks are selective — one gesture per section.

**Typography receipt (2026-10-25).** A collector reads a name, compares reference numbers and prices,
then opens the evidence. Jost's geometric labels follow the object-catalogue register, with tabular
figures for comparison; Spectral carries sustained reading. Jost is a self-hosted variable font
(100–900, SIL OFL 1.1, licence under `public/fonts/`); Spectral has a Georgia fallback. The legacy
`--font-mono` role uses Jost with tabular figures, not a third loaded family. This is not a code editor.
Palette's contextual-type and Bauhaus method inform the choice; its colour-field layout does not
belong in a watch archive. Keep the existing object-first composition rather than recasting every
dossier as an oversized typographic poster. Prove phone, tablet, desktop, enlarged text and font
failure against real labels and evidence. Automated proof does not constitute a human usability study.

**Named law exemptions (exhaustive, 2026-10-12).** Three deviations from the no-gradient / no-drop-shadow core are deliberate and load-bearing; each is commented at its rule in `src/index.css`: `.art-band-scrim` (dark-to-transparent legibility scrim over the art-band painting), `.art-withheld-plate` (neutral print-catalog hatch that *draws* a missing image instead of hiding the refusal), and `.srch` (one soft elevation shadow on the search-palette modal over its dimmed backdrop). Nothing else may use a gradient or a soft shadow — especially not cards or sections.

**Hero banner is load-bearing.** `public/img/hero/time-pop-banner.png` is the Time Pop brand surface on the home fold (and OG share image). Composition (Grok 4.5 audit 2026-08-03): banner = oversized full-bleed *ground* via `.timepop-hero` (not `HeroBanner`, which intentionally renders no image); cream slab = thesis + CTAs; 8-cell ledger = floor with live counts (invented prices hard-coded 0). Do not demote the banner to a sibling column or replace the ledger with a second proof ribbon.

**Live URL (2026-10-11):** production is served at the custom domain `https://watch.nonarkara.org`
(Cloudflare Pages project `watch`; the fallback `watch-1de.pages.dev` still resolves). Canonical +
OG tags, `public/sitemap.xml`, and crawler user-agents all follow the custom domain so share
previews and search resolve to one host.

**Market attention (daily).** `npm run data:trends` harvests Google Trends (US, unofficial) + Wikimedia Pageviews for a curated watchlist (`data/shared/trend_watchlist.json`) into `public/data/market_trends.json`. Home shows the ranked band under the hero. Discover exposes it as WATCHING TODAY. Register can sort by it. A matching dossier Evidence tab says the card is in public attention. Attention ≠ price — limitation is on the face of the UI. The daily refresh is the Cloudflare Worker cron in `worker/live/` (06:40 UTC), served at `/live/market_trends.json`; the build copy is the fallback and the page names which one it shows. The GitHub Action is manual-only (Actions is budget-blocked on purpose). See `docs/LIVE-PIPELINE.md`.

**Personal pulse (browser-private).** `/saved` joins the visitor's `watch.saved` ids to that public snapshot and retains only the current and previous rank map in `watch.attention.history.v1`. This creates visible NEW / UP / DOWN / OUT movement without accounts or remote tracking. The conservation law is explicit: the saved set never leaves the device; the daily public signal changes around it. Snapshot age follows the visitor's calendar day, and every surface says `ATTENTION ≠ PRICE`.

**Personal value lab (browser-private).** `/pom#value-lab` has three modes: Uncle Pom's reported 2018 basket, the visitor's `watch.saved` set, and one reference from the register. A system-derived saved-collection total exists only when every saved watch has a publishable estimate; a priced subset is shown but never promoted into a total. Otherwise the visitor must enter an appraisal baseline. All five holding periods are scenario arithmetic, default growth is neutral 0%, and the total names its component source, confidence tier, and as-of date.

For a single watch, current value and owner cost basis are separate inputs. Future gross value compounds from the current market value; net gain and break-even compare sale proceeds with what the owner paid. If cost basis is blank, the neutral default is a purchase today at today’s value. Never let a historical purchase price silently replace the present valuation baseline.

The owner-scenario curve is a view of those same table rows, never a second calculator: gross comes from current value × user rate; net subtracts the checked seller fee and user costs; the cost-basis line never moves. Years are spaced to scale and the plotted value range is printed on the chart.

The single-watch picker keeps the native select but adds search plus three dataset-derived scopes: all references, price anchors above $1,000, and publishable estimates. Filtering changes only the candidate list; it never changes the selected dossier or its calculations until the visitor chooses another reference. Every result count names the data build date.

**Venue fee lab.** `/marketplaces` and each dossier’s venue tab preserve the global directory, but only checked official fee schedules may produce arithmetic. Every scenario starts from the single dossier estimate and names its comp count, confidence tier, estimate date, fee source, and fee check date. A venue multiplier is never a quote; MSRP is never a resale baseline. Unverified venues stay searchable with fee math visibly off.

When two sightings map to the same reference (e.g. Milgauss 116400GV on White Lotus and A Man in Full), show the dossier portrait once. The second card says the portrait is shared — never paste the same photo as if it were two different stills.

Screen exposure is demand-side attention, never physical scarcity. Exact-reference matches only enter the attention heuristic; family-level and tentative IDs stay labeled.

**Watchmaking artifacts** live in `public/img/watchmaking/` + `public/data/watchmaking_artifacts.json`. Wikimedia Commons only: CC0 / Public Domain / CC BY / CC BY-SA (no NC/ND). Every figure shows artist + licence + Commons link.

## Design Read — Mondrian register (2026-10-29)

**Read:** a ruled Mondrian composition on a quiet ground. Ink rules of three weights by role
(3px structural floor under the masthead, 2px frame, 1px ledger), unequal modules sized to
their content, one flat colour block per fold (yellow = where you are, in the nav; navy =
the counter-field plates: hero ledger, footer facts), one coral strip at the very top.
**Reference:** Mondrian, *Composition II in Red, Blue, and Yellow* (1930): few cells, unequal,
every rule runs to another rule or the edge. **Not** a template: no radius, no shadow, no
gradient.

**MSH measured, not asserted (390 x 844 / 1440 x 900):** masthead one definition, in flow,
104px = 11.6% desktop / 121px = 14.3% phone (was 156px / 17.4% and 253px / 30%, sticky);
nav is a ruled 4 x 2 / 8 x 1 table whose phone tracks are unequal so no label clips; the
register is 72 screens on a phone (was 183) via a two-column ruled grid; dense chip groups
32px, isolated actions 44px from one token (`--hdr-row`). Probe: `scripts/spatial/msh-probe.js`
(no baseline, no waivers). The MiniMax gate (`scripts/spatial/spatial-*.mjs`,
`design/spatial-baseline.json`, `.github/workflows/spatial-law.yml`) is NOT shipped: its
baseline stores self-written waiver reasons, which §11.12(b) forbids, and it was never
validated end to end.

## Anti-Regression

- Home hero pop-art banner (`/img/hero/time-pop-banner.png`) — keep; named brand surface.
- Labs workshop art (`/img/hero/time-pop-banner-alt.png` + `/img/labs/*.jpg`) — Labs-only mood plates; do not demote to text-only cards or reuse as Screen stills.
- Honesty ladder: no market price without ≥3 sourced comps; missing data renders "—" + reason.
- Masked publish: full comps never ship to the client.
- Film stills always carry studio + editorial credit and a promotional/editorial rights line.
- Every metric shows source, n, window, limitation.
- Value Lab never adds priced and unpriced saved watches into a collection total; projection defaults to 0% until the visitor chooses an assumption.
- Venue cards never turn directory multipliers, stale fee notes, or MSRP into independent venue valuations.
- Hidden citation popovers must keep `pointer-events: none`; their links become interactive only while the popover is visible, or they steal clicks from dossier actions below.
- A brand + reference identity may appear only once. The build refuses duplicate dossiers even when their slugs differ.
