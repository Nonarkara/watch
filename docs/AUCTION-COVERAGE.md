# Auction coverage — the gap, named honestly, and the next move

Status: the `8a8d29a` census is published. The 5.5% headline is honest.
What follows is the strategic memo on closing it.

## Correction (2026-10-21): the first version of this memo was wrong

The first draft of this document recommended a **Voutilainen Vingt-6** card on the
reasoning that one card would "catch every Voutilainen lot in this census and the
next."

**That was false, and it was checked rather than assumed.** The four Voutilainen
lots are:

| Lot | Model as published | Realized |
| ---: | --- | ---: |
| 9 | Vingt-8 Inversé | $1,155,700 |
| 82 | Observatoire | $1,041,400 |
| 105 | Masterpiece Chronograph II "Number 1 of 10" | $1,841,500 |
| 140 | Vingt-8 ISO | $1,206,500 |

There is no Vingt-6 among them. A Vingt-6 card would have closed **zero** of the
four. The card that was actually built is the **Vingt-8 ISO**, which closes lot 140.

More important than the wrong model name is *why the guess was available at all*.

## The gap is structural, not a card shortage

142 of the 675 lots — **$98.0M, 43.9% of the census's value** — publish **no
reference number at all**. The haute-horlogerie tier does not issue them. Phillips
prints a model name instead: `Vingt-8 ISO`, `Chronomètre Souverain`,
`Observatoire`. Our register keyed identity on `brand + reference`, so for that
entire tier the coverage figure was structurally blind.

Of those 142, **119 carry a usable model name**, and those 119 are $169.1M of
original-currency value. The largest single block is F.P. Journe: 39 lots,
$108.1M, no references published.

So the honest reading of "5.5% coverage" is not *"we hold 5.5% of the market."*
It is: **our matching rule only ever worked for the tier that publishes reference
numbers** — Rolex, Patek, Audemars Piguet, Cartier. The number was measuring our
matching rule, not the market.

## Fix shipped: a second exact-identity channel, opt-in per card

`build_auction_census.mjs` now matches a lot on either of two exact identities:

1. **brand + published reference number** — the traditional channel (37 lots).
2. **brand + published model name** — tried *only* where the lot published no
   reference at all (1 lot so far).

Both are exact identities. Neither is a near-miss, and the fuzzy / FX channels
still count for nothing here.

The model-name channel is **opt-in per card** via a new
`identity.published_model_name` field, holding the string the maker or the auction
house actually prints. It is deliberately **not** inferred from `identity.name`.
The first implementation did infer it, and immediately produced a false positive:
`Rolex model="Day-Date" → rolex-1803`, because "Day-Date" is Rolex's *line*, not a
model. Inferring identity from a display name is the same class of error as the
Levenshtein matcher that was rejected earlier. Cards must now say so explicitly,
and `validate_card.mjs` rejects a malformed value.

## Result after the fix, and after the first pass (2026-10-21)

| Metric | Start of the fix | After the first pass |
| --- | --- | --- |
| Lots matching a card | 37 (5.5%) | **46 (6.8%)** |
| Value matching a card | $3.89M (1.7%) | **$17.81M (8.0%)** |
| — by reference number | 37 lots / $3.89M | 37 lots / $3.89M (1.7%) |
| — by published model name | *(channel did not exist)* | **9 lots / $13.92M (6.2%)** |
| Brands in register | 54 | 57 |
| Lots with no published reference | *(unreported)* | **142 = 43.9% of value** |

The model-name channel is where the movement came from: nine lots and $13.9M,
against one lot and $1.2M the moment it shipped. Six of those nine came from
**cards that already existed** and only needed an opt-in — the register was
holding references it simply could not be seen holding.

### What the first pass built

| Card | Basis | Lot | Realized |
| --- | --- | --- | ---: |
| `voutilainen-vingt-8-iso` | new card | NY XIV lot 140 | $1,206,500 |
| `louis-richard-triple-detent-tourbillon` | new card | CH XXIII lot 108 | $5,096,896 |
| `akrivia-ak-06` | new card | CH XXIII lot 36 | $3,853,500 |
| `voutilainen-observatoire` | new card | NY XIV lot 82 | $1,041,400 |
| `voutilainen-vingt-8-inverse` | new card | NY XIV lot 9 | $1,155,700 |
| `journe-resonance` | opt-in only | CH XXIII lot 906, HK XXII lot 1064 | $1,258,200 |
| `f-p-journe-chronometre-souverain` | opt-in only | HK XXII lot 1001 | $660,000 |
| `mbf-lmx` | opt-in only | HK XXII lot 987 | $518,000 |

### The second correction: "AK-07" was also wrong

An earlier draft of this document named **Akrivia AK-07** as a target. The lot is
**AK-06** — movement no. 03, stainless steel, the first AkriviA without a
tourbillon. Two separate model-name guesses in this document were wrong before
any lot was read: Vingt-6, and AK-7. Both were plausible-sounding and both would
have closed nothing. The rule adopted after that: **read the lot before naming it
in a plan.**

### The F.P. Journe reality check

The largest single pool in the census is F.P. Journe: 39 lots, $108.1M, no
references published. It was tempting to assume per-material opt-ins would sweep
it up. Reading the 39 lots shows they are **35 distinct model names**, not one:
`Chronomètre à Résonance "Souscription..."`, `"Pisa"`, `"Parking..."`,
`"RQ 40MM"`, `Tourbillon Souverain Anniversaire`, `Tourbillon Souverain
"Ruthenium"`, `Octa Calendrier`, `Octa Réserve de Marche "Souscription..."`,
`Octa Divine`, `Centigraphe Souverain`, and more. Quoted and material qualifiers
normalise into their own buckets, so only the two bare `Chronomètre à Résonance`
lots were safely claimable.

That is the honest yield: **2 lots, $1.26M**, from a brand that looked like
$108.1M. The remaining $106.8M is not one missing opt-in. It is a catalogue the
register does not hold — roughly thirty-five distinct limited and commissioned
references, most of them individually named pieces. Building it means building a
dozen-plus cards with per-lot research, not flipping a switch.

## What the gap actually is

`public/data/auction_census.json` reports, across three Phillips rooms (Geneva XXIII,
Hong Kong XXII, New York XIV, May–June 2026):

| Metric | Value |
| --- | --- |
| Lots | 675 |
| Hammer total (USD) | $223.5M |
| Brands seen at auction | 98 |
| Brands in our register | 55 |
| Lots matching a register card (exact identity) | 38 |
| Lots-matching-card percentage | **5.6%** |
| Value matching a card | $5.10M |
| Value-matching percentage | **2.3%** |
| Lots publishing no reference number | **142 (43.9% of value)** |
| Lots publishing neither reference nor model | 23 ($2.38M) |

The 2.3% figure is published. The 5.6% is the headline. Neither is faked, and the
reason the number is low is now published next to it.

## Where the gap sits

71 of the 98 brands sold at auction have **zero** cards in the register.
Those 71 brands account for $42.4M (19.0% of total value).

That gap is concentrated at the top — the largest zero-card brands by value:

| Rank | Brand | Lots | Value (USD) | Avg/lot | Notes |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | Louis Richard | 2 | $5.49M | $2.74M | Two lots; both are individual commissions |
| 2 | Voutilainen | 4 | $5.25M | $1.31M | **Now 1 card** (Vingt-8 ISO, closes lot 140) |
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
| F.P. Journe | 41 | 6 | 6.8× | 39 of the 41 lots publish **no reference** — this brand needs model-name opt-ins before more cards help |
| De Bethune | 12 | 1 | 12× | Only `db28`; could use DB25, DB27, DB28GS |

## Strategic priorities, revised

The original priority list assumed "add a card" was the lever everywhere. It is
not. The revised order accounts for the two different problems:

**First — finish the model-name channel.** This is the highest-leverage work in the
whole project and it is not "add cards":

1. **F.P. Journe** — 39 lots, $108.1M, no references. Needs `published_model_name`
   on the cards whose model name is genuinely 1:1 (`Chronomètre à Résonance`).
   *Deliberately not done in this pass:* `Chronomètre Souverain` names a whole
   family (CS platinum, CS ruthenium, and more) that are different objects with
   different values. One opt-in would sweep them all into one card. That is a
   near-miss wearing an identity's clothes, and it is the exact mistake the
   Day-Date false positive was. It needs per-material opt-ins with cited model
   strings, not one blanket entry.
2. **Philippe Dufour** — 1 lot, $9.46M, no reference.
3. **Cartier** — 9 lots, $5.19M, no reference (the house splits "Cartier" /
   "Cartier New York" / "Cartier Paris" in the feed, which also needs splitting).

**Second — add cards where the model name is already 1:1:**

4. **Voutilainen Vingt-8 Inversé** — closes lot 9 ($1,155,700). 26 made across
   three metals (10 tantalum, 8 titanium, 8 platinum), so one model name covers
   the family honestly.
5. **Voutilainen Observatoire** — closes lot 82 ($1,041,400).
6. **De Bethune DB25 / DB27** — a second card against 12 lots.
7. **Akrivia AK-07** — 1 lot, $3.85M, and the whole brand is one reference.

**Not on the list:** the `Masterpiece Chronograph II "Number 1 of 10"` lot. That is
a numbered individual piece, the same category as the co-signed lot: the register
tracks references, not unique commissions.

The remaining zero-card brands are mostly lower-volume and lower-dollar, and would
be tackled in a second pass, one card at a time, brand by brand.

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

1. **Voutilainen Vingt-8 ISO — DONE** (`voutilainen-vingt-8-iso`). Closes Phillips
   lot 140, $1,206,500. First card to carry `published_model_name`.
2. **F.P. Journe per-material model-name opt-ins.** The single biggest pool
   ($108.1M across 39 lots). Must be done per material/variant with cited model
   strings — one blanket `Chronomètre Souverain` opt-in is a near-miss.
3. **Voutilainen Vingt-8 Inversé** — closes lot 9, $1,155,700.
4. **Voutilainen Observatoire** — closes lot 82, $1,041,400.
5. **De Bethune DB25 or DB27** — 12 lots, 1 card today.
6. **Akrivia AK-07** — 1 lot, $3.85M, and the brand is a single reference.

Items 1 and 2 alone would take the headline from 5.6% to roughly 9% without
adding a single card beyond the one already built — because they make the
existing six F.P. Journe cards visible to a matching rule that could not see
them at all.

## What is NOT in scope here

- The matching algorithm stays conservative on purpose. It catches the cases it
  catches and refuses the rest. Loosening it would inflate the headline with fuzzy
  matches we already publish as `comparable:false` variant sales. That count is in
  `public/data/auction_census.json` and we keep it separate.
- The model-name channel is opt-in and is not inferred from a display name. The
  first implementation inferred it and produced a false positive on
  `Rolex model="Day-Date"`; that is recorded above so it does not get "simplified"
  back in later.
- The Live attention pipeline (commit `68b6027`) is a separate project. The
  auction census is a manual-review pipeline that runs on the M5 after approval,
  same as every other cited dataset.
- Re-running the harvest on the next Phillips sale (the August 2026 cycle) is
  queued; it will not change the cross-section this doc reasons over.

## The gap stays visible

Per the honesty law: the Auction Census page publishes the headline, publishes
the by-reference / by-model-name split, and publishes the
"142 lots published no reference at all" figure next to them. A reader can see
exactly why the number is low and what would move it. Until those cards exist,
the page says so plainly, and we do not estimate the rest.
