# WATCH v1.0 — todo

- [x] Plan approved (2026-07-31)
- [x] Scaffold: Vite + React 19 + TS + Tailwind v4
- [x] Index engine: schema, indices.mjs, validator, build, invariant tests (all passing)
- [x] CPI snapshot from FRED (197 months, keyless CSV endpoint)
- [x] brand_production.json: Rolex 1.1M, Patek 72k, AP 53k (sourced)
- [x] Corpus: 186 cards (Rolex 39, Trinity 31, Omega+Tudor 23, CJZI 29, haute 22,
      Japan 22, BPT 16, + 4 starter references)
- [x] Frontend: Home / Register / Dossier / Compare / Discover / Rehome / Scarcity /
      Patterns / Starter / Methodology / Paper
- [x] Research working paper: 6,464 words, 31 verified refs, PDF + MD, wired to /paper
- [x] Scarcity economics: evidence-led tier explorer
- [x] Patterns: outperformer trait screen (measured cohort → evidence-marker fallback)
- [x] Impeccable audit + mobile 390px check
- [x] CDPT: commit, push, Cloudflare Pages production deploy, live route verification
- [ ] IN FLIGHT: comp enrichment wave (2 agents) — unlock the premium metric
- [ ] BLOCKED ON DR NON: watch.nonarkara.org custom domain (see below)
- [ ] v1.1: expand attainable references (Oris/Swatch/Nomos/Sinn/Junghans/CW/Bell&Ross)

## Blocked: custom domain
Pages project `watch` is live at watch-1de.pages.dev. Attaching watch.nonarkara.org needs
either (a) the domain added to the Pages project in the dashboard, or (b) a
`CLOUDFLARE_API_TOKEN` with Pages:Edit in `shared/.secrets-backup/` — wrangler has no
`pages domains` command and its OAuth token is rejected by the domains API endpoint.
Same token would also enable CI deploys via the template in
`_reference/github-actions-cloudflare-pages-template.yml`.

## Data state (2026-07-31 build)
- 186 cards · 33 verified comps across 22 cards · 65 with sourced MSRP
- 2 cards with a market estimate · 0 with a computable premium
- Premium needs ≥3 comps inside a 36-month window AND a sourced MSRP on the same card.
  Most comps are either single sales or historic (pre-2023), so the window excludes them.
  This is the single highest-leverage data gap — it gates the premium, both price-change
  metrics, and the measured mode of the Patterns screen.

## Data notes
- WebSearch fleet quota (200 calls) exhausted during the corpus run — CJZI + Japan batches
  have thin market data (0 comps).
- Honesty calls preserved by agents: Speedygate CK2915 excluded from comps; McQueen 5513
  excluded (withdrawn from sale); EUR/CHF results skipped per no-conversion rule.
- Auction-house blocks: Sotheby's hides realized prices behind login; Geneva/HK sales are
  CHF/HKD so they fail the no-conversion rule. New York sales are the productive source.
