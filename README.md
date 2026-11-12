# Time Pop

An evidence-first cultural register for collectible watches. It helps people explore watches as
objects, understand the economics of scarcity, compare references, learn through stories, and make
more transparent handovers when a watch needs a new custodian.

The public site is designed to refuse false precision: no market estimate is published without at
least three comparable cited sales. Evidence windows widen from 12 months to all time on file;
older windows are disclosed and must be read as historical evidence. Missing evidence renders as a reason.

## What ships

- 302 unique reference dossiers across five collecting tiers
- Deterministic scarcity, collectibility, liquidity, price-change, and confidence metrics
- A searchable register, comparison table, starter paths, and playful discovery mode
- A scarcity-economics explainer grounded in the published dataset
- A source-linked Rolex object atlas with catalog prices kept out of market estimates
- A 31-sighting Rolex screen register with exact/family and reported/tentative evidence labels
- A demand-side screen-attention signal that cannot alter the scarcity score
- A responsible rehoming-brief builder; the site does not broker transactions
- Public methodology and a 6,464-word working paper

## Architecture

Raw cards live in `data/cards/`. The build validates each card, computes every derived metric from
raw evidence plus committed shared snapshots, and publishes a masked client dataset to
`public/data.json`. Full comparable-sale sets remain internal; the client receives aggregates and up
to five cited notable sales.

See [context.md](context.md) for the system contract and [data/SCHEMA.md](data/SCHEMA.md) before
editing cards.

## Commands

```bash
npm install
npm run data:catalog # rebuild the user-supplied Rolex catalog snapshot
npm run data:screen  # rebuild the canonical screen snapshot from committed sources
npm run data:screen:harvest # refresh the Watch-ID Rolex source snapshot (network)
npm run data:market:harvest # discover Phillips results and build a review queue
npm run data:market:promote -- --id=phillips:<lot> --decision=comparable --dry-run
npm run data:build  # validate cards and rebuild public/data.json
npm test            # deterministic index invariants
npm run data:audit  # coverage report plus identity-integrity assertions
npm run lint
npm run build
npm run dev
```

The market harvester keeps compressed raw pages under ignored `data/.harvest/`, writes a request
manifest to `data/market/harvest-manifest.json`, and sends every parsed lot to one of four states:
ready for review, quarantined, duplicate, or failed. It never edits a dossier. Promotion is a
separate one-record command after a person checks reference, material, dial, condition, provenance,
and accessories. Non-USD results remain quarantined until the schema can preserve source currency
and source-backed exchange rates.

Where source access permits it, `--enrich-foreign` lets the harvester collect detail for
exact-reference, realized non-USD lots within the same `--max-details` budget. USD candidates
keep first priority. Foreign-currency lots can gain reference, material and dial checks without
becoming comparable or eligible for promotion.

To audit an existing archive without fetching or changing any data, run
`node scripts/replay_phillips_archive.mjs /path/to/archive-checkout`. The command checks
snapshot hashes and applies the current parser and dossier matcher to the archived results.

Promotion also checks the Phillips lot identity across URL forms. For multi-day or legacy
auction records, verify the session containing the lot and supply `--sale-date=YYYY-MM-DD`
and `--date-source=<Phillips session or lot URL>`. The auction opening date alone is not a sale date.

The production site is deployed to Cloudflare Pages and served at the custom domain
[watch.nonarkara.org](https://watch.nonarkara.org/) (Cloudflare Pages project `watch`, also reachable
at the fallback `watch-1de.pages.dev`). Canonical, OG, sitemap, and crawler user-agents all name the
custom domain.

The scheduled Spatial law workflow measures production. To measure a release
candidate, run it manually on the candidate branch with its immutable Pages
preview URL (for example, `https://1234abcd.watch-1de.pages.dev/`). A green
production monitor does not clear a preview.
