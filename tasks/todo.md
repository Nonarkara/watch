# WATCH v1.0 — todo

- [x] Plan approved (2026-07-31)
- [x] Scaffold: Vite + React 19 + TS + Tailwind v4
- [x] Index engine: schema, indices.mjs, validator, build, invariant tests (all passing)
- [x] CPI snapshot from FRED (197 months, keyless CSV endpoint)
- [x] brand_production.json: Rolex 1.1M, Patek 72k, AP 53k (sourced)
- [x] Corpus: 302 cards · 54 brands (as of build 2026-08-07)
- [x] Frontend: Home / Register / Dossier / Compare / Discover / Rehome / Scarcity /
      Patterns / Starter / Methodology / Paper / Labs / Screen / Bible / Watchmaking / Pom
- [x] Research working paper: 6,464 words, 31 verified refs, PDF + MD, wired to /paper
- [x] Scarcity economics: evidence-led tier explorer
- [x] Patterns: outperformer trait screen (measured cohort → evidence-marker fallback)
- [x] Impeccable audit + mobile 390px check
- [x] CDPT: commit, push, Cloudflare Pages production deploy, live route verification
- [x] Week-one audit (2026-08-10): restore MoMA home banner, OG→live Pages URL,
      ticker count from data, starter-integrity + banner regression tests
- [ ] IN FLIGHT: comp enrichment wave — unlock the premium metric (34/302 have comps; 9 publishable estimates)
- [ ] BLOCKED ON DR NON: watch.nonarkara.org custom domain (see below)
- [ ] Coverage push: 113 skeleton dossiers (no image, no comps, no provenance) — Casio/GS/Panerai worst
- [ ] v1.1: expand attainable references (Oris/Swatch/Nomos/Sinn/Junghans/CW/Bell&Ross)

## Blocked: custom domain
Pages project `watch` is live at watch-1de.pages.dev. Attaching watch.nonarkara.org needs
either (a) the domain added to the Pages project in the dashboard, or (b) a
`CLOUDFLARE_API_TOKEN` with Pages:Edit in `shared/.secrets-backup/` — wrangler has no
`pages domains` command and its OAuth token is rejected by the domains API endpoint.
Until then, canonical + OG point at the Pages URL so share cards resolve.

## Data state (build 2026-08-07 · audited 2026-08-10)
- 302 cards · 54 brands · 125 with media (41%) · 34 with comps (11%) · 131 with provenance
- 9 publishable market estimates · 293 honest refusals
- 14 credited promotional film stills · 45 screen sightings
- Premium needs ≥3 comps inside a 36-month window AND a sourced MSRP on the same card.
  This remains the single highest-leverage data gap.

## Data notes
- Honesty calls preserved: Speedygate CK2915 excluded from comps; McQueen 5513
  excluded (withdrawn from sale); EUR/CHF results skipped per no-conversion rule.
- Auction-house blocks: Sotheby's hides realized prices behind login; Geneva/HK sales are
  CHF/HKD so they fail the no-conversion rule. New York sales are the productive source.
