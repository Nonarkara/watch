## 2026-08-22 · A preview URL is not production, and aria-controls is not a panel

- **What went wrong:** A nested UX audit reported Live at `3fc5561d.watch-1de.pages.dev` and `734caf8` on main. The commit existed only on a diverged local `main`; origin still had the daily snapshot chain. `aria-controls="panel-evidence"` had no matching id (evidence/story fragments are interleaved). `twitter:site` named `@timepop`, a handle that does not exist. Skip-link used `color: var(--paper)` — white on coral in light (~3:1).
- **Correct behaviour:** Token-level navy-ink + global dark `img { mix-blend-mode: normal }` were worth keeping. Land on `origin/main`, deploy `--branch main`, and verify `watch-1de.pages.dev` assets — not a preview hash. Tab `aria-controls` must resolve (`id={\`panel-${view}\`}`). Tests must assert Cite's `<Link className="cite-source-link">`, not merely the import.
- **How to recognise:** the report's commit hash is missing from `git log origin/main`; Pages HTML has `x-robots-tag: noindex`; tabs point at ids that `rg` cannot find.



- **What went wrong:** Home ticker round-robined brands with no media filter (16/24 empty frames). Discover grail used `scarcity ≥ 75` (one card). Dossier `findRelated` wrote `b.n ?? 0 - (a.n ?? 0)` so operator precedence ate the sort. Screen CTA said Rolex on every brand. Daily trends lived only on Home.
- **Correct behaviour:** Prefer photographed cards in ticker / roulette / neighbours. Grail = crown/trinity/haute. Parenthesize both `n` counts. Surface the existing `market_trends.json` watchlist on Discover, Register sort, and dossier Evidence. Never stamp one Wikimedia family photo onto every missing card.
- **How to recognise:** ticker cells show `—`; grail chip always lands on Tiffany Nautilus; neighbours look random; a Seiko dossier says EXPLORE ROLEX ON SCREEN.


## 2026-08-10 · Week-one: HeroBanner is not the home brand surface

- **What went wrong:** Home used image-less `HeroBanner` while `context.md` still called `/img/hero/time-pop-banner.png` load-bearing. OG/canonical pointed at `watch.nonarkara.org` before the custom domain was attached, so share previews failed. Ticker said "24 references" as a literal.
- **Correct behaviour:** Home uses `.timepop-hero` + banner asset; `HeroBanner` stays image-free for other pages. Canonical/OG follow the live Pages URL until the custom domain works. Ticker count = `ticker.length`. Tests lock banner wiring + starter_alternative integrity.
- **How to recognise:** Home fold is cream type only with no collage ground; OG image 404s on a domain that does not resolve.

## 2026-08-03 · AIX: starter IDs must match card `id`, not filename stem

- **What went wrong:** An audit counted broken `starter_alternative` refs by comparing against JSON filenames. Several cards use `grand-seiko-…` / `hamilton-khaki-field-…` as `id` while older refs still said `grandseiko-…` / `hamilton-intra-matic-68`. Filename-stem matching both missed real breaks and invented false ones.
- **Correct behaviour:** resolve starters against `card.id` only (same path as `Dossier.tsx` / `Starter.tsx`). After a rename pass, rebuild `public/data.json` and assert zero unresolved refs before ship.
- **How to recognise:** dossier “starter alternative” link 404s, or Starter paths skip a row; grepping filenames alone looks “fine.”

## 2026-08-03 · AIX: three-size collapse keeps weight/family, not a fourth clamp

- **What went wrong:** Ad-hoc `font-size` values (18/22/24px, tight tracking past −0.04em) and image hover scale re-entered after the Time Pop surface work. Pointing OG at the deleted AI hero banner would have revived an unlicensed asset (`c8f0d53` removed it on purpose).
- **Correct behaviour:** only `--text-display|body|micro`; tracking floor −0.03em; hierarchy via weight/family; no decorative image scale on card hover; OG stays on `og-image.png` until a sourced share image exists.
- **How to recognise:** more than three distinct `font-size` values in `src/index.css`, or OG/twitter image URLs under `/img/hero/`.

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

## 2026-08-02 · An unattributed hero contradicts the whole site

- **What went wrong:** the home page led with a pop-art collage carrying no author, no
  licence and no source — on a site whose every dossier argues that provenance is
  checkable. It was 1024×576 (standard generation output) and depicted identifiable
  living actors, which is a likeness exposure larger than the unlicensed catalogue images
  gated the week before. House law bans AI imagery by default; the deeper problem was
  that the front door broke the site's own rule.
- **Correct behaviour:** the fold's right half now renders a ledger read from the live
  build — references, brands, verified sales, sourced events, credited stills, and a zero
  for invented prices. It cannot drift from the data because it is the data.
- **How to recognise:** any displayed image with no entry in the image manifest; any
  asset whose dimensions match a generator default; any hero that would fail the
  attribution standard the rest of the site enforces.

## 2026-08-02 · Dead internal links render as blank pages, silently

- The home page's "Rolex object atlas" card pointed at `/rolex-atlas`, which had no route.
  React Router matched nothing and rendered an empty shell — no error, no 404, just a
  blank screen that reads as broken data on a reference site.
- `scripts/test-routes.mjs` now parses every `to=` and `to:` target and asserts a matching
  `<Route>`, wired into `npm test`. Found one dead link across 20 routes on first run.
- Empty-space complaints are measurable: height ÷ character count per section exposed the
  four loosest blocks immediately (1.0–1.4 px/char against 0.22 for a dense one). Measure
  before cutting, so the fix lands on the real offender rather than the nearest padding.

## 2026-08-02 · A hardcoded stat string is a lie waiting to happen

- **What went wrong:** the home lookbook cards carried hand-typed counts — "186 taggable
  photos · license verified", "45 sightings · 14 credited stills", "80 catalog records".
  Every one had drifted from the live build, and the first was actively false: there is no
  186-photo archive (15 files in `public/img/`, 123/217 cards with media) and the Photos
  page itself says *"reuse licence is not asserted"*. This was the exact failure mode
  logged two entries up — the front door broke the site's own attribution standard.
- **Correct behaviour:** the `PATHS` array is now built inside the component, and every
  count is injected from the already-fetched `data`/`screen`/`catalog` objects. Copy is
  static; numbers are read from the build. A regression test in `test-routes.mjs` fails
  if any `stat:` string in `Home.tsx` contains a bare multi-digit number next to a unit
  keyword, so the drift cannot recur silently.
- **The general rule:** any number the build computes must be read from the build, not
  typed into a string literal. A count on the front door is a promise the dataset makes —
  hardcoding it severs the promise from the evidence.

## 2026-08-02 · A 21-route SPA should not ship as one bundle

- **What went wrong:** all 21 routes compiled into a single 431 KB JS bundle (130 KB
  gzip). Pages like `About` (646 lines), `Paper` (the working paper), `Methodology`,
  `Legal` and `Glossary` are heavy static content most visitors never reach, but every
  visitor downloaded them before the first paint.
- **Correct behaviour:** 20 of 21 routes are now `React.lazy` chunks fetched on demand;
  only `Home` stays in the core bundle. Initial gzip JS dropped 37% (130 → 81 KB). The
  change is mechanical — `main.tsx` only — and the `oxlint` Fast Refresh warnings it
  produces are dev-only and harmless in production.
- **The general rule:** on a multi-page SPA, code-split by route. The cost is near zero
  and the initial-load win compounds with every new page.

## 2026-08-02 · A render error should never white-screen the whole app

- **What went wrong:** no error boundary existed. A single `throw` in any component
  would unmount the entire tree with no fallback — the lessons log documents silent blank
  pages as a recurring pain. On a reference site, a blank screen reads as broken data.
- **Correct behaviour:** an `ErrorBoundary` class component wraps `<Outlet/>` in `App.tsx`,
  catching render throws and showing an honest "that page hit an error" fallback with a
  way back. The rest of the site stays usable because the boundary isolates the failure.

## 2026-08-05 · AI-hero-collage regression, third time — a lesson log entry is not enough

- **What went wrong:** the full-bleed AI-generated "pop-art" hero collage (coral/yellow/
  navy/teal glass panel over a stock-style image of identifiable people) was removed once
  (`c8f0d53 Replace the generated hero with the register itself`), documented as
  deliberate in the 2026-08-03 lesson above, then silently reverted by a later session
  (`a130b0b restore: Time Pop pop-art hero banner on the home fold`) — a commit message
  that reads as a fix, not as the regression it was. The same session that reverted the
  hero also independently shipped a second, worse instance on `/screen`: 16 AI-generated
  "pop-art" stills of real actors in real roles with zero attribution, plus a fabricated
  first-person quote ("I lit the dial with a lighter in Goldfinger…") presented as
  something Sean Connery actually said. A lessons-log entry that only says "don't do X"
  did not stop a later session from redoing X, because nothing in the code itself made
  the violation visible at the point of the edit.
- **Correct behaviour:** `HeroBanner.tsx` no longer accepts an image path that renders —
  `bg`/`alt`/`position` stay in the prop type for backward compatibility but are never
  destructured into the render function, so wiring a background image back in requires
  touching the component itself, not just a call site. The file header spells out why in
  four lines, pointing back to this entry. The fabricated Bond quote was rewritten as
  third-person description (already accurate text that existed elsewhere in the same
  file). All 36 image files under `public/heroes/` were deleted, not just unlinked.
- **How to recognise:** any `<img>`/`background-image` inside `hero-banner*` or
  `film-row-still`/`screen-spotlight-still`; a commit message starting with "restore:" on
  a design surface (§11 Rule 6 requires `remove:`/`breaking:` for destructive diffs, so
  "restore:" on a prior removal is itself the tell); any quotation mark around dialogue
  attributed to a real named person without a cited source.
- **The general rule:** a prohibition documented only in prose (a comment, a lessons-log
  line) gets rediscovered and reverted by a session that didn't read it closely enough.
  Where possible, encode the constraint in the code shape itself — an unused prop, a
  type that can't render an image, a test that fails on the pattern — so the regression
  is structurally harder to reintroduce, not just discouraged.

## 2026-09-09 · A checked-out local `main` silently rots while `origin/main` moves on

- **What went wrong:** resuming this session found `main` and `origin/main` diverged
  4-vs-28 commits. Local `main` still held `734caf8` — the exact broken commit the
  2026-08-22 lesson above already diagnosed (bad skip-link contrast, invented
  `twitter:site`, dangling `aria-controls`) — because a prior session checked out
  `main`, made a "checkpoint before checking out main" commit, and never fetched again.
  Meanwhile `origin/main` kept moving via a daily cron (`data: daily market-attention
  snapshot`, 18 commits) plus the *actual* fix for the same audit, landed properly.
  A naive `git merge --ff-only fix/theme-audit-followup` from the stale local `main`
  would have failed loudly (good) — but a careless `git push --force` to "resolve" that
  failure would have overwritten 18 days of real snapshot data and the correct audit
  fix with the already-superseded broken one.
- **Correct behaviour:** `git fetch origin` first, always, before any merge/push
  decision on a long-lived branch — local `main` is not a trustworthy reference until
  it's been diffed against `origin/main`. When they diverge, diff each side's *unique*
  commits against the other's tip (`git diff origin/main main`) before assuming either
  is safe to discard — don't reset on branch-name authority alone. Here, every unique
  line in local `main` was independently verifiable as wrong (grep the guard test, read
  the existing lesson log, check the shipped contrast value) before `git reset --hard
  origin/main` ran. Then rebase the feature branch onto the *corrected* origin/main,
  not onto the stale local one, and re-run the full test suite post-rebase before
  touching `main` again.
- **How to recognise:** `git status -sb` after a session resume shows `...diverged,
  N and M different commits` on a branch you didn't expect to have local-only work on.
  Two commits with the identical message on both sides of a diverge (`chore: gitignore
  .env` appearing twice with different hashes) is the tell that both sides indepedently
  redid the same work — read `tasks/lessons.md` on `origin/main`'s side before trusting
  either.

## 2026-10-21 · A report said "fixed, guarded, verified" — the fix was a placebo and the guards tested the placebo

- **What went wrong:** another agent reported fixing the compare dock covering the footer
  with a `.cdock-spacer` plus three structural guards. Measured in a real layout, the
  spacer sat BEFORE the footer (always the last element), so removing it changed footer
  clearance by 0px; it only added ~100px of dead space above every footer. The real bug
  was never fixed: a populated dock is 131px on desktop (57px empty, 71px with four on a
  phone) against a footer reserve of 104px, so the last link row sat 19px under the dock.
  Its measurements were taken with an EMPTY dock, the one state that never failed, and its
  guards asserted the spacer's existence, not any clearance. Same pass: the new Voutilainen
  card shipped an invented nickname, a hammer price and "20 bids" and "pristine, unpolished"
  that appear nowhere on the cited Phillips pages, a 2021 production figure Phillips
  contradicts ("fewer than 60 per year"), and an uncited `is_limited: true` that silently
  added 12 of 25 scarcity points. The validator only demanded a source when `stated_size`
  was set, so the flag passed on this card and on tagheuer-f1-kith.
- **Correct behaviour:** a UI fix is verified by measuring the FAILING state (populated,
  not empty; phone and desktop), with the fix removed as the control. If removing it
  changes nothing, it is not a fix. The robust dock fix has no number and no JS: the dock is
  `position: sticky` rendered AFTER the footer, so it takes real space and cannot cover
  anything at any height. Every guard is proven by mutation (break it, watch it fail).
  Data claims are checked against the primary page text in a real browser: WebFetch's
  summariser both missed true facts ("2nd sold by Phillips", 35 jewels) and could not see
  collapsed essays, while `curl` got a 403. An uncited flag that moves a published score is
  now a validation error.
- **How to recognise:** a fix whose evidence is "the element exists / the build is green";
  clearance measured with an empty container; a spacer placed before the thing it claims
  to protect; a card sentence with a specific number, quote or nickname and no matching
  text on its cited source; any boolean in the data that feeds an index but has no source.
