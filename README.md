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

The production site is deployed to Cloudflare Pages and served at the custom domain
[watch.nonarkara.org](https://watch.nonarkara.org/) (Cloudflare Pages project `watch`, also reachable
at the fallback `watch-1de.pages.dev`). Canonical, OG, sitemap, and crawler user-agents all name the
custom domain.

Before a production upload, use a clean checkout of the intended `main` commit on Node 24.
Check that the `gate` workflow passed for that commit, then exercise the candidate in a
Pages preview. The scheduled `Spatial law` workflow checks production; its result is not
proof that a preview passes. Run `npm run spatial:gate` and `npm run spatial:falsify` on the
built candidate when changing layout or the spatial tooling.

`npm run deploy` runs the production dependency audit, lint, build, and tests before
uploading to the Pages production branch. It does not enforce GitHub status checks or
run the browser checks. After upload, verify that Pages serves the built assets before
checking the custom domain and exercising the affected routes there.
