# WATCH — lessons log

(§13 Rule 3/10 — every correction lands here. Read at session start.)

## 2026-07-31 · Dashboard-token overflow kills document scroll

- **What went wrong:** `_shared/design-tokens/dr-non-brand.css` sets `html, body { height: 100dvh; overflow: hidden }` for app shells. The Register overrode with `overflow: visible` then `overflow-x: hidden`. Lightning CSS merged that to `overflow: hidden visible`. The root kept failing to scroll, so Codex’s tall atelier home looked like a frozen demo.
- **Correct behaviour:** override the two axes separately on `html` (`overflow-x: hidden; overflow-y: scroll`) and leave `body` at `overflow: visible`. Also reset `overscroll-behavior`, re-enable text selection / touch callout, and give `#root` `min-height: 100%`. Never write the visible-then-x-hidden pair.
- **How to recognise:** content taller than the viewport, wheel/trackpad does nothing, and the built CSS shows `overflow:hidden` or `overflow:hidden visible` on `html,body`.

## 2026-07-31 · A comp must be the same object as the card

- **What went wrong:** A comp-enrichment pass added three Tiffany-signed Aquanaut lots (two of
  them the *same physical watch* resold — identical Certificate of Origin date) and a
  Tiffany-dial plus Eric Clapton's own Nautilus. Every entry was real, cited, and correctly
  sourced. Averaged in, they produced a +218% and a +729% premium on ordinary steel
  references. The pipeline had no notion of comparability, so "verified sale" was silently
  treated as "verified sale *of this watch*".
- **Correct behaviour:** `comps[].comparable: false` excludes a lot from every computed metric
  while keeping it on the card as a cited variant sale with its reason displayed; the validator
  refuses `comparable: false` without an explanation. Set it whenever the lot prices a different
  object: special-signed dial, celebrity ownership, charity lot, different metal. Also check for
  the same physical watch appearing across multiple sales — that is one data point, not two.
- **How to recognise:** any comp whose price is a large multiple of its siblings, or whose
  `condition` names a person, a retailer signature, or a charity. If a collector would not call
  it an ordinary example of the reference, it is not a comp.
- **The general rule:** sourcing discipline is necessary but not sufficient. A number can be
  fully cited and still measure the wrong thing. The correctness question is always "what
  exactly does this number describe?", not "where did it come from?"

## 2026-07-31 · A pattern screen must score reachable traits

- **What went wrong:** The Patterns candidate list rendered empty. The cohort's dominant trait
  was "discontinued" (100% of it), and candidates were scored against that trait — but a watch
  you can still buy new can never satisfy it, so nothing ever cleared the bar.
- **Correct behaviour:** score candidates only on traits the candidate population can actually
  hold, and say on the page which trait was excluded and why.
- **How to recognise:** a screen that returns zero results across every threshold setting is
  usually asking for a logically impossible combination, not reporting a real absence.

## 2026-07-31 · Static assets that change need revalidation

- **What went wrong:** `data.json` keeps its filename across data builds, so after a deploy the
  Pages alias domain served a cached dataset alongside freshly hashed JS — new code, old
  numbers. The deployment itself was correct; only the alias was stale.
- **Correct behaviour:** `public/_headers` sets `max-age=0, must-revalidate` on `data.json` and
  the paper, while hashed `/assets/*` stay immutable.
- **How to recognise:** deploy-specific URL is correct but the alias domain disagrees.

## 2026-07-31 · Premium needs to say which retail price it used

- **What went wrong:** Two unlocked premiums (OP41 +248%, Pepsi GMT +175%) were computed
  against 2022 and 2018 list prices for references *still in production*, and the UI labelled
  both "final retail" — a phrase that only makes sense for a discontinued watch. The gap was
  overstated and the label was false.
- **Correct behaviour:** `premiumToRetail` now takes the discontinued flag and distinguishes
  three baselines: current retail, final retail (YEAR) for discontinued, and a plain
  "YEAR retail" for in-production references whose current list price is not on record. The
  last case sets `stale_baseline: true`, which the dossier prints inline — not inside the
  collapsed limits toggle — stating the real premium is smaller.
- **How to recognise:** any in-production card whose `retail.current_msrp_usd` is null. The
  premium is still publishable, but only with the baseline named.
- **The general rule:** a ratio is only as honest as its denominator's label. Naming the
  baseline is part of the number, not decoration around it.

## 2026-07-31 · Verify the agent, not just its sourcing

- Two lots priced at exactly $17,920 on the same date looked like a copy-paste error. Fetching
  both Bonhams pages showed a genuine coincidence — a Pepsi GMT and a ceramic Daytona really
  did both sell for US$17,920 inc. premium. The suspicion was worth the two fetches; the
  agent was accurate, and the check cost less than a wrong retraction would have.
- Cloudflare Pages alias domains serve the previous deployment for roughly a minute after
  `wrangler pages deploy` reports success. Verify against the deployment-specific URL first,
  then poll the alias — a stale alias read is not a failed deploy.

## 2026-08-01 · The cliché was a banned typeface, not a vague vibe

- **What went wrong:** A design pass moved the register to Bodoni Moda on a cream wash with
  the accent token redefined to blue, plus blob-radius speech bubbles, hard offset shadows,
  rotated stickers and five pastel fills. Dr Non read the result as "Louis Vuitton", not
  a reference work. Fat display serifs, radii, shadows and pastel palettes are each named
  bans in house law (§11.6, §14) — the regression was checkable, not a matter of taste.
- **Correct behaviour:** overhaul the *facade* and keep the composition. Every grid, span and
  rhythm was preserved; only the surface changed — one neutral grotesque carrying hierarchy
  by weight and scale, near-white paper, ink, and a single accent spent on interaction.
- **How to recognise:** grep the stylesheet for `border-radius` on non-circles, `box-shadow`
  without `inset`, `rotate(`, more than one accent hex, and any serif in `--font-display`.

## 2026-08-01 · Cards that grow with their titles make a grid look accidental

- Register cards were a flex column, so a two-line name pushed that card's metric rows below
  its neighbours' and the row lost its baseline. Fixed rows plus a two-line clamp on the name
  and a permanent one-line sub-row put every "Market" figure on one line across the grid.
- The general rule: in a grid of records, the *record* must have a fixed rhythm. Alignment
  between cards is not a property of the container.

## 2026-08-01 · Verify image rights before display, not just image quality

- **What went wrong:** the shared Rolex catalogue supplied card images by hotlinking
  `cdn.thewatchpages.com`, with its own rights field reading "reuse license not asserted" —
  80 unlicensed third-party images on a site whose entire argument is that provenance is
  checkable.
- **Correct behaviour:** catalogue images are gated behind an explicit
  `image_license_asserted === true`; the catalogue still supplies reference data. Displayed
  photography must carry a named author, a stated licence and a source URL.
- **Also:** Wikimedia Commons hosts replica watches with self-applied CC0 tags and brand press
  photos CC-tagged by non-holders. Read the file description, not just the licence box — two
  candidates for this build were counterfeits that described themselves as such.

## 2026-08-02 · Compiled AI research gets its own layer, never the estimator

- The four research documents (Grok/Perplexity/Google) carried genuinely useful index
  figures and frameworks alongside citation lists polluted with junk entries. The honest
  integration: a `market_context` layer republished with named-report attribution and a
  visible "compiled, not verified by us" limitation, kept structurally separate from the
  register's computed metrics. Where sources disagreed, the chart draws the range instead
  of averaging it away.
- The tiered price-band framework became a computed, invariant-tested metric because it is
  a pure function of on-card prices; the index percentages stayed context because they are
  not derivable from our evidence. The dividing line: can the build recompute it?
