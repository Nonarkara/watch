# Auction coverage — the gap, named honestly, and the next move

Status: the `8a8d29a` census is published. The 5.5% headline is honest.
What follows is the strategic memo on closing it.

## What the gap actually is

`public/data/auction_census.json` reports, across three Phillips rooms (Geneva XXIII,
Hong Kong XXII, New York XIV, May–June 2026):

| Metric | Value |
| --- | --- |
| Lots | 675 |
| Hammer total (USD) | $223.5M |
| Brands seen at auction | 98 |
| Brands in our register | 54 |
| Lots matching a register card (exact brand + reference) | 37 |
| Lots-matching-card percentage | **5.5%** |
| Value matching a card | $3.89M |
| Value-matching percentage | **1.7%** |

The 1.7% figure is published. The 5.5% is the headline. Neither is faked.

## Where the gap sits

71 of the 98 brands sold at auction have **zero** cards in the register.
Those 71 brands account for $42.4M (19.0% of total value).

That gap is concentrated at the top — the largest zero-card brands by value:

| Rank | Brand | Lots | Value (USD) | Avg/lot | Notes |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | Louis Richard | 2 | $5.49M | $2.74M | Two lots; both are individual commissions |
| 2 | Voutilainen | 4 | $5.25M | $1.31M | Vingt-6 / 28SC / TMU series, all in platinum or precious metal |
| 3 | Akrivia | 1 | $3.85M | $3.85M | Single AK-07 prototype Akrivia chronometer lot |
| 4 | Louis Audemars & Co | 1 | $3.23M | $3.23M | Singular 1920s twin-barrel pocket watch |
| 5 | Urban Jürgensen | 7 | $2.54M | $0.36M | Reference set across two centuries |
| 6 | Roger Smith | 2 | $2.13M | $1.07M | Series 1 / Series 2 — small but deep |
| 7 | Greubel Forsey × Philippe Dufour × Michel Boulanger co-signed | 1 | $2.12M | $2.12M | One-off; do not card into the register |
| 8 | Agassiz Watch Co. | 1 | $1.88M | $1.88M | Long-birdseye-maple-cased Swiss pocket watch |
| 9 | Paul Ditisheim | 1 | $1.63M | $1.63M | Observatoire-grade 1920s regulator pocket watch |
| 10 | Dino & Roberto Falcone | 1 | $1.14M | $1.14M | Italian independent, signed by both Falcone brothers |

The "do not card" case (#7) is a one-off co-signed piece — it has no product line to
register against and the register exists to track serialisable references, not unique
collaborations. Its $2.12M sits firmly in the "we will not estimate this" zone and
that is a feature, not a bug.

Under-carded but already in the register:

| Brand | Lots | Cards | Ratio | Comment |
| --- | ---: | ---: | ---: | --- |
| F.P. Journe | 41 | 6 | 6.8× | CS, CB, RS, TN, Octa CS 40mm, Élégante — already strong; gap-fill the most-cited variants |
| De Bethune | 12 | 1 | 12× | Only `db28`; could use DB25, DB27, DB28GS |

## Strategic priorities — by dollar-of-coverage-per-card

If the goal is **to raise the 5.5% figure as honestly as possible** with one card
added in each priority slot, the highest-leverage brands are:

1. **Voutilainen — Vingt-6 (or 28SC) reference** — 4 lots, $5.25M. One card catches
   every Voutilainen lot in this census and the next.
2. **F.P. Journe — Chronomètre Souverain holocene (CS Platinum, CS Ruthenium,
   or Quantième Perpétuel)** — close to half of the 41 F.P. Journe lots are CS
   variants; adding one more CS spec catches multiple lots.
3. **Louis Richard — one of the two lots** — both lots are signed and dated;
   1 of them, carded, would catch the brand for the next census.
4. **Urban Jürgensen — Copenhagen Five Minutes Repeater (or telescopic escapement era)** — 7 lots;
   the brand is a quality-and-quantity play.
5. **De Bethune — DB25 or DB27** — a second card that catches the rest of the 12 lots.

The "$5.49M Louis Richard both-lots" and "$3.85M single Akrivia" cases are also
high-leverage for absolute value, but the reference delta between the two Louis
Richard lots is unclear from census alone — they may be serial variants of the same
movement, in which case one reference = two lots.

## What "honesty" demands at each step

For every card the schema requires:

- `identity`: brand, reference, name, nickname, collection, tier (haute/mainstream/etc.),
  produced (year), movement (caliber / type), case (diameter / material / bezel),
  one_liner.
- `retail`: msrp_history with cited source_url (or refused if no public MSRP).
- `market_evidence`: `comps` can be empty at creation; build_indices must yield a
  `comp_summary` once data lands. **No invented comps.**
- `provenance_events`: dated, with `source_url` per event. **No invented stories.**
- `media`: image URLs come from the curated `data/shared/images.json`. **No fallback
  reuse across 3+ unrelated cards.**
- `meta.curated_by`: "agent-mcode-2026-10-21" (or whoever the curator is in this turn).

Reference sources for each new card should be one of:
- the manufacturer's own current line page
- a manufacturer-published press release or a serious long-form review
- the Phillips lot page itself (for the auction appearance and reference spelling)

Anything beyond these — "I think it costs X" or "it looks like Y" — is refused and
the card may go without that field, exactly the way the existing register handles
"INVENTED 0".

## What "AI design slop" demands at each step

When the new card lands:
- The dossier page must not invent a hero image, an editorial line, or a 5-second
  verdict that the sources do not back.
- The Spotlight feature on Home picks dossiers with at least 2 provenance events
  and ≥1 cited comp. A new card will need both before it can carry spotlight.
- The starter alternatives chain (`narrative.starter_alternative`) is hand-set —
  no LLM inference linking cards.

## Execution plan, ordered

1. **Voutilainen (Vingt-6) — first card.** 4 lots, ~$5.25M. Single biggest
   *low-card-count* dollar delta.
2. **F.P. Journe CS platinum / Ruthenium — gap-fill.** Closes ~10–15 of the
   41 lots if the reference spelling matches what Phillips used.
3. **Louis Richard — one of the two lots.** High average dollar value; low number
   of cards (1) needed to start covering.
4. **De Bethune — DB25 (or DB27 if DB25 lots are not seen in census).** One card,
   12 lots at auction this round.
5. **Akrivia AK-07** — 1 lot at $3.85M, the only Akrivia lot in the census. The
   brand has very few production refs, so this is high-leverage.

These five priority cards, if built, would push coverage from 5.5% → ~14% by
our exact-match rule and from 1.7% → ~4–5% by value. The remaining zero-card
brands are mostly lower-volume and lower-dollar, and would be tackled in a
second pass (one card at a time, character by character).

## What is NOT in scope here

- The matching algorithm is conservative on purpose. It catches the cases it
  catches and refuses the rest. Loosening it would inflate the 5.5% headline
  with fuzzy matches we already publish as `comparable:false` variant sales.
  That count is in `public/data/auction_census.json` and we keep it separate.
- The Live attention pipeline (commit 68b6027) is a separate project. The
  auction census is a manual-review pipeline that runs on the M5 after approval,
  same as every other cited dataset.
- Re-running the harvest on the next Phillips sale (the August 2026 cycle) is
  queued; it will not change the cross-section this doc reasons over.

## The gap stays visible

Per the honesty law: the Auction Census page on the live site publishes the
5.5% number as the headline. The new cards above, once built, raise that number.
Until they are built, the page must say "1.7% of value" plainly, and we do not
estimate the rest.
