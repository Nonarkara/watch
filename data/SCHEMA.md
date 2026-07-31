# WATCH card schema — the contract

One JSON file per watch reference: `data/cards/<brand-slug>-<ref-slug>.json` (lowercase, hyphens, e.g. `rolex-116500ln.json`, `tissot-prx-t137-407.json`).

**The honesty law (non-negotiable):** every fact is either (a) verifiable public knowledge (identity/specs), or (b) carries a `source_url` you actually found. **Omit rather than guess.** A sparse honest card beats a full fabricated one — the build system is designed to degrade gracefully. NEVER invent a URL, a price, a date, or a production number. NEVER estimate a comp. If you didn't see it, it isn't in the card.

Validate before finishing: `node scripts/validate_card.mjs data/cards/<file>.json`

```jsonc
{
  "schema_version": 1,
  "id": "rolex-116500ln",                  // = filename without .json
  "identity": {
    "brand": "Rolex",
    "reference": "116500LN",
    "name": "Cosmograph Daytona",          // official model name
    "nickname": "Ceramic Daytona",         // community name, null if none
    "collection": "Daytona",               // model family
    "tier": "crown",                       // one of: trinity | crown | haute | core | attainable
    "produced": { "start_year": 2016, "end_year": 2023, "discontinued": true },  // end_year null if current
    "movement": { "caliber": "4130", "type": "automatic chronograph" },  // type: automatic|manual|quartz|spring drive|automatic chronograph|...
    "case": { "diameter_mm": 40, "material": "Oystersteel", "bezel": "black Cerachrom" },
    "one_liner": "The steel sports chronograph that defined the waitlist era."  // one factual sentence, no hype words
  },
  "retail": {
    "msrp_history": [                       // launch price first; source_url required per entry
      { "effective_year": 2016, "price_usd": 12400, "source_url": "https://..." }
    ],
    "current_msrp_usd": null                // null iff discontinued (successor's price doesn't count)
  },
  "market_evidence": {
    "comps": [                              // REAL SOLD PRICES ONLY (auction results, eBay sold). Not asking prices.
      { "date": "2024-06-08", "price_usd": 27940, "venue": "phillips",   // venue: phillips|christies|sothebys|antiquorum|bonhams|ebay|other_auction
        "url": "https://...", "condition": null, "box_papers": "full_set" },  // box_papers: full_set|box_only|papers_only|watch_only|null
      // Set comparable:false when the lot prices a DIFFERENT OBJECT than this reference —
      // a special-signed dial (Tiffany), a celebrity-owned example, a charity lot, a wrong
      // metal. It stays on the card as cited evidence and renders as a "variant sale", but
      // never enters the estimate. condition MUST explain why (the validator enforces it).
      { "date": "2025-12-06", "price_usd": 254000, "venue": "phillips", "url": "https://...",
        "condition": "Tiffany & Co.-signed dial", "box_papers": "full_set", "comparable": false }
    ],
    "listing_observations": []              // asking-price context (r/Watchexchange etc): {date, venue, active_count} — script-filled, leave []
  },
  "scarcity_inputs": {
    "brand_production_est": null,           // leave null — resolved from data/shared/brand_production.json by brand
    "limited_edition": { "is_limited": false, "stated_size": null, "source_url": null },
    "waitlist_evidence": [],                // [{date:"2022-03", description:"...", source_url:"https://..."}] — only if sourced
    "auction_appearances_5y": null          // integer count of big-4 auction lots you found for this ref, null if not researched
  },
  "provenance_events": [                    // dated, sourced. Celebrity sightings, record sales, cultural moments.
    { "date": "2017-10-26", "person_or_event": "Paul Newman auction",
      "description": "Paul Newman's own 6239 sells for $17.75M at Phillips NY, the record for any wristwatch at the time.",
      "source_url": "https://..." }
  ],
  "narrative": {                            // the "knowledgeable owner" layer — factual, sourced where claims are specific
    "story": "2-4 sentences: why this reference matters in horological history. No marketing fluff.",
    "collector_notes": "1-3 sentences: what collectors check on this ref (dial variants, service history quirks).",
    "starter_alternative": null             // id of an attainable-tier card with similar DNA, e.g. "tissot-prx-t137-407", null if this IS attainable
  },
  "meta": {
    "curated_by": "agent-<batch>",
    "curated_date": "2026-07-31",
    "sources": ["https://..."]              // every URL consulted for identity/retail facts
  }
}
```

## Field rules

- `comps`: sold prices with the URL of the page stating the sale. USD figures only — if a result is only in CHF/HKD/GBP, skip it (no conversions). Auction prices include buyer's premium when that's what the page reports.
- **Comparability is the estimator's trust boundary.** A comp must be the same object the card describes. Before adding one, ask: would a collector consider this an ordinary example of this reference? A Tiffany-signed dial, a celebrity's own watch, a charity lot, or a different metal answers no — add it with `"comparable": false` and explain in `condition`. Getting this wrong is worse than having no comp: three special lots produced a fake +729% premium on a standard Nautilus before this rule existed. Also watch for the *same physical watch* appearing twice across sales (match the Certificate of Origin date) — that is one data point, not two.
- `msrp_history`: launch MSRP is the single most valuable retail fact. US MSRP. Archived brand pages, period press coverage, or reputable price-guide articles are acceptable sources.
- `provenance_events`: the influence layer ("Federer effect"). Only real, dated, sourced events. 0 events is fine for most references.
- `nickname`, `one_liner`, `story`: your knowledge, no source needed, but factual register — the no-AI-tells law applies (no "iconic", "boasts", "elevate", "testament to").
- Do NOT add a `computed` block — the build system owns it entirely.
