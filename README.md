# Time Pop

An evidence-first cultural register for collectible watches. It helps people explore watches as
objects, understand the economics of scarcity, compare references, learn through stories, and make
more transparent handovers when a watch needs a new custodian.

The public site is designed to refuse false precision: no market estimate is published without at
least three verified sales in a 36-month window. Missing evidence renders as a reason, never a guess.

## What ships

- 261 unique reference dossiers across five collecting tiers
- Deterministic scarcity, collectibility, liquidity, price-change, and confidence metrics
- A searchable register, comparison table, starter paths, and playful discovery mode
- A scarcity-economics explainer grounded in the published dataset
- An 80-record, source-linked Rolex object atlas with catalog prices kept out of market estimates
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
npm run data:build  # validate cards and rebuild public/data.json
npm test            # deterministic index invariants
npm run data:audit  # coverage report plus identity-integrity assertions
npm run lint
npm run build
npm run dev
```

The production site is deployed to Cloudflare Pages at
[watch-1de.pages.dev](https://watch-1de.pages.dev/). The custom domain remains the intended canonical URL once its DNS record is active.
