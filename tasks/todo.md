# WATCH v1.0 — todo

- [x] Plan approved (2026-07-31)
- [x] Scaffold: Vite + React 19 + TS + Tailwind v4
- [x] Index engine: schema, indices.mjs, validator, build, invariant tests (all passing)
- [x] CPI snapshot from FRED (197 months, keyless CSV endpoint)
- [x] brand_production.json: Rolex 1.1M, Patek 72k, AP 53k (sourced)
- [x] Corpus: 186 cards landed (seven original research batches totalled 182:
      Rolex 39 w/ 17 comps, Trinity 31 w/ 6 comps, Omega+Tudor 23, CJZI 29,
      haute 22 w/ 7 comps, Japan 22, BPT 16; four references added later)
- [ ] v1.1 enrichment: expand attainable references (Tissot/Hamilton/Longines/Oris/
      Swatch/Nomos) and thin market-comparison coverage
- [x] Frontend: Register / Dossier / Compare / Starter / Methodology / Paper
      (+ Home / Discover / Rehome added by Dr Non's parallel session — styled, integrated)
- [x] Research working paper: 6,464 words, 31 verified refs, PDF + MD, wired to /paper
- [x] Scarcity economics: evidence-led tier explorer replacing the empty premium screener
- [x] Impeccable audit + final mobile 390px check
- [x] CDPT: commit, push, and Cloudflare Pages production deploy
- [ ] CDPT: create watch.nonarkara.org CNAME and verify the custom-domain release

## Data notes
- WebSearch fleet quota (200 calls) exhausted mid-run — CJZI + Japan batches have thin
  market data (0 comps); enrichment wave = natural v1.1 task.
- Honesty calls preserved by agents: Speedygate CK2915 excluded from comps; McQueen 5513
  excluded (withdrawn from sale); EUR/CHF results skipped per no-conversion rule.
