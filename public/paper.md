# The Register: Epistemic Humility as Market Infrastructure

### A design-science study of decision support for collectible watch markets

**Working paper · The Watch Register · watch.nonarkara.org · 31 July 2026 · v1.0**

---

## Abstract

The secondhand market for collectible watches ran a full boom–bust cycle between 2018 and 2026 while its information infrastructure stayed thin: prices scattered across venues, provenance opaque, counterfeits improving faster than detection. We present The Watch Register, a free public intelligence layer of roughly 300 reference cards. Each card carries a market-price estimate computed from sourced comparable sales, a premium-to-retail figure, CPI-adjusted price change, a proxy Scarcity Index, a composite Collectibility Index, a provenance-event timeline, and an A/B/C data-confidence tier. The system's central design commitment is refusal: no estimate is published from fewer than three sourced sales, composite indices disclose how many of their five components were observed, and missing data renders as a reason code, never as a number. We argue that encoding epistemic humility into product architecture addresses the market's three compounding failure modes — choice overload, information asymmetry, and fraud risk — and we present dateable event–price couplings that qualify provenance timelines as a pricing input rather than gossip.

---

## 1. Introduction: a market for lemons, on the wrist

The secondhand collectible watch market is a live, well-documented case of the adverse-selection dynamic Akerlof (1970) described for used cars. Quality is unevenly observable. The seller knows whether the dial was refinished, whether the movement carries service parts, whether the bracelet was swapped; the buyer, in most transactions, does not. Akerlof's prediction is that when buyers cannot distinguish good units from bad, they discount everything, good sellers exit, and average quality falls — a feedback loop that can thin a market to the point of failure. The watch market has not failed, but it exhibits every precondition, and its participants pay the Akerlof tax daily: wide bid-ask spreads, authentication fees, dealer premiums that are partly information rents, and a persistent background hum of disputes.

The market is also large enough for these costs to matter. Boston Consulting Group estimated preowned watch sales at $22 billion in 2021 — close to a third of the total $75 billion luxury watch market — and found that average secondhand prices for top models from Rolex, Patek Philippe, and Audemars Piguet rose at roughly 20% per year between August 2018 and January 2023, against roughly 8% for the S&P 500 over the same window (BCG, 2023a; 2023b). The cycle then turned. The WatchCharts Overall Market Index peaked in March–April 2022, coinciding with the peak of the crypto wealth effect (WWD, 2022), and then fell for thirteen consecutive quarters through Q2 2025 (ScrewDownCrown, 2025), with secondary prices for Rolex reaching four-year lows (WatchPro, 2025) before industry coverage began describing stabilization in late 2025 and early 2026 (Robb Report, 2026; WatchCharts, 2026). On the supply side, Morgan Stanley and LuxeConsult estimate that Rolex produced about 1.1 million watches in 2025 and holds roughly a third of the Swiss industry by retail value, while total Swiss shipments fell to 14.6 million units — a multi-decade low (Monochrome, 2026; Revolution, 2026; Trilogy Jewellers, n.d.).

A market of this size, this volatile, and this informationally lopsided would normally have grown a thick layer of public decision infrastructure by now — the equivalent of vehicle history reports, standardized condition grading, and accessible price records. It has grown some: subscription price-tracking services, auction databases behind paywalls, brand-run certification (Rolex launched its Certified Pre-Owned programme with Bucherer in December 2022, an implicit admission that authentication asymmetry required brand-level correction; Rolex, 2022; Forbes, 2022). What it has not grown is a free, methodologically explicit layer that tells an individual collector, for a specific reference, what is known, how well it is known, and what is not known.

This paper documents such a layer, built and published as The Watch Register: approximately 300 reference cards, each computing seven metrics from committed raw evidence through pure functions. We frame the work as design science (Hevner, March, Park, & Ram, 2004; Simon, 1996): the artifact is the research output, and its central design decision — refusing to publish numbers the evidence cannot support — is the contribution we defend.

We state two hypotheses.

**H1.** Collector purchase and sale decisions in the secondhand watch market degrade under three compounding conditions — choice overload, information asymmetry, and fraud risk — and a transparent, provenance-linked intelligence layer measurably restores decision confidence.

**H2.** Publicly observable influence events — celebrity provenance, discontinuations — produce measurable, dateable price effects, and an event timeline is therefore a legitimate pricing input rather than editorial decoration.

The artifact operationalizes the intervention H1 describes; the causal test of H1 requires instrumentation that belongs to the project's marketplace phase (Section 8). H2 is supported now, with observational evidence from three well-documented episodes (Section 6). Sections 2–4 establish the problem and the prior literature; Section 5 describes the methodology in full, because in this system the code is the methodology.

---

## 2. Three failure modes of collector decision-making

The Register is designed against a specific model of how collector decisions go wrong. Three mechanisms compound: too many options, too little verifiable information per option, and a live risk that the option itself is counterfeit. Each mechanism is individually documented in the literature; the watch market runs all three at once.

### 2.1 Choice overload

The canonical demonstration is the field experiment of Iyengar and Lepper (2000): shoppers offered 24 jam varieties stopped to browse more often than shoppers offered six, but purchased at 3% versus 40%. Schwartz (2004) generalized the finding into an account of how expanding option sets raise search costs, expectation, and anticipated regret together, degrading both decision quality and post-decision satisfaction.

The honest reading of the subsequent literature is more conditional. Scheibehenne, Greifeneder, and Todd (2010) meta-analyzed 50 experiments and found a mean effect of choice overload near zero, with strong heterogeneity. Chernev, Böckenholt, and Goodman (2015), meta-analyzing 99 observations, resolved the heterogeneity: overload reliably appears when four moderators are elevated — choice set complexity, decision task difficulty, preference uncertainty, and decision goal orientation. Overload is not a law of large assortments; it is a predictable outcome of large assortments under specific conditions.

The secondhand watch market elevates all four moderators at once. Choice set complexity: a single reference exists across dial variants, bracelet variants, production years, service states, and paper/box configurations, each materially affecting price. Decision task difficulty: options are scattered across auction houses, dealers, forums, and marketplaces with incompatible condition vocabularies, so alternatives resist side-by-side comparison. Preference uncertainty: most buyers are infrequent participants who have not yet learned their own trade-off weights between condition, originality, and price. Decision goal: a four- or five-figure purchase with resale consequences is maximizing, not satisficing. On the Chernev et al. moderator model, the watch buyer is close to a worst-case configuration. The design implication is direct: the intervention is not fewer watches but lower comparison cost — a standard card, computed the same way for every reference, that converts an unstructured search into a structured one.

### 2.2 Information asymmetry and provenance opacity

The watch market's asymmetry is worse than the used-car market Akerlof modeled, in one specific way: there is no odometer. A car carries a mandated, tamper-resistant record of use; a watch carries nothing. Service history lives in paper receipts that rarely follow the watch. Case polishing — which permanently removes metal and value — is detectable only by trained eyes. Dial refinishing, movement part swaps, and bracelet substitutions are invisible to most buyers. The seller knows; the buyer pays to find out, or does not find out.

Provenance opacity is the same asymmetry extended in time. A watch's history of ownership and its exposure to publicly dateable events — a celebrity association, a discontinuation announcement, an auction record — measurably move prices (Section 6), yet this history is not attached to the object in any standard way. It circulates as folklore. A market where the single largest price determinant after reference and condition is undocumented folklore is a market where information rents accrue to whoever curates the folklore privately. The industry's own responses confirm the diagnosis: Rolex's Certified Pre-Owned programme (Rolex, 2022) sells exactly one product — the brand's verification of what the seller could not credibly assert — and Morgan Stanley's coverage reports the programme generating $594 million in 2025 (Revolution, 2026). Verification, priced by the party with the least information disadvantage, at a premium.

### 2.3 Fraud: superfakes and frankenwatches

The third mechanism is the one that turns caution into paralysis. Watchfinder & Co. (2023) reported more than 23 million counterfeit watches circulating in the US market, with 9% of Americans having purchased one, and — the operative statistic — that its own experts could once identify roughly 80% of fakes on sight and can now identify roughly 20%, because manufacturing quality on the counterfeit side has improved that fast. Rolex alone accounts for about half of the counterfeit luxury watch trade (Robb Report, 2023).

The vintage segment adds a category Akerlof's binary good/bad model handles poorly: the frankenwatch, assembled from genuine parts of different watches — a dial from one year, a case from another, a movement from a third — with intent to present the assembly as an original whole (Chrono24, n.d.). Every component authenticates; the object does not. Frankenwatches defeat part-level authentication entirely, which is why provenance — the documented continuity of a specific watch through time — is the only reliable answer to them, and why provenance opacity (Section 2.2) and fraud risk are the same problem at different depths.

The compounding structure matters for design. Choice overload raises the cost of evaluating each option; asymmetry raises the stakes of evaluating it wrong; fraud raises the tail risk from "overpaid" to "worthless." A rational response to all three is to not transact — and the thirteen-quarter decline (Section 6.3) unfolded in a market where trust infrastructure was thinnest exactly when confidence was most needed. The Register targets the compound, not any single term.

---

## 3. Related work

### 3.1 Collectibles as financial assets

The economics literature on collectibles establishes two stable findings: positive long-run real returns, and risk-adjusted underperformance against equities. Burton and Jacobsen (1999) surveyed the field and found most collectible classes yield positive real returns that are nonetheless below stock returns, with higher volatility and severe transaction costs. Dimson and Spaenjers (2011) constructed a century-long index of British collectible stamps (1900–2008) and measured 7.0% nominal, 2.9% real annualized returns — above bonds, below equities, with volatility approaching equities. Knight Frank's Luxury Investment Index, which has tracked watches as a component since 2005, recorded the post-2022 deceleration directly: watches grew just 1.7% in 2024 within an overall index that fell for a second consecutive year (Knight Frank, 2026).

These works price the asset class. None of them helps a single collector standing in front of a single listing. Index-level methods — repeat-sales regressions, hedonic models — are legitimate precisely because they aggregate away the unit-level uncertainty that the individual buyer must resolve. The Register occupies the complementary position: unit-level (strictly, reference-level) decision support, with the uncertainty exposed rather than aggregated away.

### 3.2 Industry measurement

Two industry sources now anchor quantitative discussion of this market, and the Register uses both as committed input snapshots. BCG (2023a) sized the preowned segment and its 2018–2023 price run. The annual Morgan Stanley × LuxeConsult reports estimate per-brand production and revenue for an industry that publishes neither: the ninth report puts Rolex at about 1.1 million units and CHF 11 billion for 2025, with the four largest private brands controlling 49.1% of the market by value (Monochrome, 2026; Revolution, 2026). The quarterly Morgan Stanley × WatchCharts series tracks the secondary market itself, and documented the thirteen-quarter decline through Q2 2025 (ScrewDownCrown, 2025; Trilogy Jewellers, n.d.). These are estimates built on stated methodologies with acknowledged error bars — which is the correct epistemic posture for this industry, and the one the Register adopts at card level.

### 3.3 The provenance premium

The single most vivid data point in the collectible watch literature is an auction result. On 26 October 2017, Phillips sold Paul Newman's own Rolex Daytona reference 6239 — the watch that named the "Paul Newman" dial — for $17,752,500, then a world record for any wristwatch at auction (Phillips, 2017; Forbes, 2017). Comparable exotic-dial 6239s without the actor's ownership traded at the time in the mid six to low seven figures. The gap between an ordinary example and this example is not condition, rarity, or reference — it is provenance alone, capitalized at roughly an order of magnitude. Section 6 treats this and two further episodes as evidence for H2. Here it earns its place in related work for a different reason: it demonstrates that provenance is not a soft attribute. It is a priced attribute, with magnitude, and any card format that omits it is omitting a first-order pricing input.

---

## 4. Design stance

Design science treats the constructed artifact as the carrier of the research contribution, evaluated against the problem environment it was built for (Hevner et al., 2004). Simon (1996) gives the field its charter: design is the transformation of existing situations into preferred ones, and the sciences of the artificial study how well the artifact's inner structure fits its outer environment. The outer environment here is Section 2: a market that punishes unverifiable claims. The inner structure follows one governing invariant, stated before any code was written:

> **Every published number is a pure function of on-card raw evidence and committed shared snapshots.**

Concretely: each reference card is a JSON document containing identity, MSRP history, comparable sales with URLs, provenance events with sources, and scarcity inputs. Two shared snapshots are committed alongside: a CPI series (FRED series CPIAUCSL; FRED, n.d.) and per-brand production estimates (from the Morgan Stanley × LuxeConsult reports). A single module of pure functions computes all seven metrics. The build is deterministic — the same card, snapshots, and pinned build date produce byte-identical output — and is gated by a validator that fails the build on any invariant violation, plus an idempotence test run before every commit. Nothing in the computed layer is hand-entered. There is no cache to go stale, no manual override to drift, and no way for a published number to exist without traceable evidence beneath it.

This is the conservation law of the system, in the sense that it can be checked by arithmetic at every build: published output = f(committed evidence). The rest of this paper describes f.

---

## 5. The artifact: seven metrics and an honesty ladder

### 5.1 The seven metrics

**(a) Market price estimate.** The estimator searches widening windows — 12, then 24, then 36 months back from the build date — and stops at the first window containing at least three comparable sales. With eight or more comps, it publishes a 20% trimmed mean with an interquartile band (25th–75th percentile), labeled `trimmed_mean_20`. With three to seven comps, it publishes a median with a full min–max band, labeled `median`, and a limitation string stating the small sample outright ("Only *n* sales over *m* months; small-sample median"). Below three comps in every window, it refuses: the value is null and a reason code (`no_comps` or `insufficient_comps`) is published instead. Every estimate carries its n, window length, distinct-venue count, and as-of date (the newest comp used); an estimate whose newest comp is older than a year is additionally flagged stale. The choice of trimmed mean over mean is standard outlier hygiene for auction data, where a single charity sale or bidding war can distort a small sample; the choice of median below n=8 concedes that trimming is meaningless at that scale.

**(b) Premium to retail.** The estimate is compared against the current MSRP where the reference is in production, or the final published MSRP (labeled with its effective year) where it is not. The output is a percentage, the MSRP used, and an explicit statement of which retail baseline applied — "current retail" versus "final retail (2021)" are different claims and are labeled differently. The metric refuses with `no_msrp` when no published MSRP exists, and inherits the estimate's refusal when there is no estimate to compare. Its permanent limitation string notes that MSRP excludes taxes and dealer discounts.

**(c) Price change, nominal and real.** Change over *N* years compares the median of comps in the trailing 12-month window against the median of comps in the 12-month window ending *N* years earlier. Both windows must independently contain at least three sales, or the metric refuses with `insufficient_comps_in_period` and reports the two counts so the reader can see which side failed. The real (inflation-adjusted) figure deflates the price ratio by the CPI ratio between the two dates, using the committed CPI snapshot and walking back up to six months to absorb CPI publication lag; if CPI is unavailable for the period, the nominal figure publishes and the real figure refuses with `no_cpi`. The limitation is stated on every card: these are windowed medians, not like-for-like condition pairs. The Register computes 1-year and 5-year change.

**(d) Scarcity Index (0–100).** No brand publishes per-reference production figures, so scarcity must be a proxy, and the card says so in a permanent limitation string. The index composites up to five signals, each with a maximum weight: discontinued status (25 points — a discontinued reference has a permanently capped supply); limited-edition status (25 points, log-scaled against stated edition size, so an edition of 10 scores ~20, an edition of 1,000 scores 10; a stated limited edition of unknown size scores 12); brand production tightness (15 points, log-linear against the brand's estimated annual units from the committed snapshot: 50,000 units/year maps to 15 points, 1.15 million to 2); market availability (20 points, decaying logarithmically with the median count of active listings observed in the last six months — zero observed listings scores 20, ~100 listings scores near 0); and documented waitlist evidence (15 points). Scores map to four labeled tiers: Grail (≥75), Scarce (≥50), Limited (≥25), Common.

**(e) Collectibility Index (0–100).** The composite of composites, with up to five components: market premium over retail (30 points, saturating at a 60% premium — the market's own vote is the heaviest weight); scarcity (25 points, the Scarcity Index scaled); provenance depth (15 points, log-scaled in the number of documented provenance events, saturating around seven); auction presence (15 points, log-scaled in five-year auction appearances — a reference the major houses repeatedly select carries a curatorial signal); and durability (15 points, scaled from the 5-year *real* price change, floored at zero — a reference must beat inflation to score here at all, which is exactly the discipline Section 3.1's literature demands).

**(f) Liquidity signal.** Sales per year counted across tracked venues, mapped to labeled tiers: High (≥12), Medium (≥4), Low (≥1), Unknown (0). The limitation string states the obvious honestly: the count covers only venues we track, and true market volume is higher. This metric deliberately answers the question price estimates cannot — not "what is it worth" but "how long will you wait to realize that worth."

**(g) Data-confidence tier.** Described in Section 5.5.

### 5.2 Refusal as architecture: the honesty ladder

The central design contribution of this system is that it refuses to publish numbers its evidence cannot support, and that the refusal is a first-class output, not an error state.

Every metric degrades down an explicit ladder. At the top rung, full evidence yields a full publication: value, band, method label, n, window, venues, as-of date. At the middle rung, thin evidence yields a degraded publication that names its own weakness: the small-sample median with a min–max band and a limitation string that says "small-sample median" in those words. At the bottom rung, insufficient evidence yields a structured refusal: a null value plus a machine-readable reason code from a closed set — `no_comps`, `insufficient_comps`, `no_msrp`, `insufficient_comps_in_period`, `no_cpi` — plus a human-readable limitation. The interface renders a refusal as an em dash and the reason, never as zero, and never as an interpolated guess.

Three properties make this architecture rather than policy. First, the refusal conditions are encoded in the same pure functions that compute the values, so a card cannot be published in a state that violates them — the build gate fails instead. A future maintainer cannot "helpfully" fill an empty metric without changing audited code. Second, the ladder is monotone in evidence: adding a comp can only move a metric up the ladder, so contributors are never incentivized to withhold data. Third, the limitation string is part of the output contract — every metric ships one, on every card, always. Removing a limitation is a build-breaking change, and this is deliberate: the system may never claim more certainty than it has.

The contrast with standard practice explains why this is a contribution and not a concession. Price aggregators face the same sparse-data problem and typically solve it with imputation: hedonic models, interpolation from similar references, or silent extension of lookback windows until a number appears. At market level this is sound statistics. At card level it manufactures the exact commodity this market is short of — unwarranted confidence. A collector reading "$14,200" cannot distinguish a number backed by thirty sales from a number backed by a model's opinion of a number backed by two. The Register's position is that the second case should say "—, fewer than 3 verified sales in any 36-month window," because that sentence is the true state of knowledge, and the true state of knowledge is the product.

We name this stance epistemic humility as product architecture. It costs coverage — a meaningful fraction of cards launch with refusals showing — and we regard the visible refusals as load-bearing: they are what make the published numbers believable. A register that always has an answer is an oracle; a register that sometimes declines is a witness.

### 5.3 Renormalization and the k-of-5 disclosure

The two composite indices face a subtler version of the missing-data problem: a card may lack listing observations, or its brand may lack a production estimate, through no fault of the reference. Treating an absent signal as zero would encode "we didn't look" as "it is common," collapsing absence of evidence into evidence of absence — the exact confusion the honesty ladder exists to prevent.

Both indices therefore renormalize over present signals. Each candidate signal has a maximum weight; the index is the sum of achieved values over the sum of maximum weights *of the signals actually observed*, scaled to 100. A card scored on three of five scarcity signals is scored on a 60-point basis stretched to 100 — and the card discloses this as a `k_of` field, rendered as "based on 3/5 components" in the index's limitation string.

The trade-off is stated rather than hidden: two cards with different k are not strictly comparable, because their indices summarize different evidence sets. We accept this because the alternative failure modes are worse. Zero-filling biases sparse cards downward systematically; refusing to compute any composite below k=5 would blank the index on most of the catalog and discard real information. Renormalization with mandatory k-disclosure publishes the best available summary while handing the reader exactly what they need to discount it. It is the composite-index expression of the same ladder: degrade honestly, and say how far you degraded.

### 5.4 The masked publish

The build maintains two views of the evidence. Internally, every card holds its complete comparable-sales array — every price, date, venue, and source URL — and the full array feeds every computation and every audit. Publicly, the compiled dataset ships the computed metrics with their full evidential metadata (n, windows, venues, bands, reasons, limitations) plus at most five *cited notable sales* per reference — individually sourced results, such as auction records, chosen for public interest and verifiability.

The masking serves three purposes. It respects the venues and researchers whose published results the comps derive from — the Register cites and links notable results rather than republishing a bulk dataset assembled from others' pages. It resists gaming: a public bulk comp database is a target for laundering fabricated sales into apparent legitimacy, and for wholesale republication stripped of methodology. And it preserves spot-checkability: the cited sales give every reader a handful of verifiable anchors, while the deterministic build gives any future auditor with access to the internal evidence the ability to reproduce every published number byte-for-byte. Full transparency of method, sampled transparency of data — the inverse of the industry norm, which is opaque method over proprietary data.

### 5.5 The confidence tier

Every card wears a letter grade summarizing its own evidential footing, computed from the comp set alone. Tier A requires at least ten sales within 24 months, across at least three distinct venues, with the newest sale no more than 90 days old. Tier B requires at least four sales across at least two venues, with the newest no more than a year old. Everything else is C, and a card with no comps at all has no tier — a null, with `no_comps`, because grading nothing is itself a fabrication.

The venue-diversity requirement is the quiet load-bearing term. Ten sales from one venue measure that venue's clientele; ten sales across three venues begin to measure a market. The recency requirement enforces the same discipline against time: in a market that fell for thirteen consecutive quarters, a two-year-old comp is a historical document, not a price. The tier is displayed as prominently as the price estimate it qualifies. A collector should never absorb the number without its grade, and the layout enforces the pairing.

---

## 6. Event–price coupling: evidence for H2

H2 claims that publicly observable influence events produce measurable, dateable price effects. Three episodes — each documented by independent parties before this project existed — establish the pattern at three scales: a single physical watch, a reference, and the whole market.

### 6.1 One watch: the Newman Daytona, October 2017

Phillips sold Paul Newman's own Daytona 6239 for $17,752,500 on 26 October 2017, after a twelve-minute bidding contest that opened with a $10 million phone bid (Phillips, 2017; Forbes, 2017). Exotic-dial 6239s of comparable specification, without the actor's ownership, traded in the mid six to low seven figures at the time. Reference, condition, and rarity were held roughly constant; the documented chain of ownership was the treatment. The market capitalized that single provenance fact at roughly an order of magnitude — and the effect propagated: "Paul Newman dial" examples across the vintage Daytona family repriced in the sale's aftermath, a spillover from one watch's event timeline to its reference cohort. For the Register's design, the lesson is structural: a provenance event attached to a reference is a persistent input to that reference's price formation, years after the gavel.

### 6.2 One reference: the Nautilus 5711, January–December 2021

Patek Philippe discontinued the Nautilus 5711/1A, its most demanded model, with rumors surfacing 22 January 2021 and official confirmation on 25 January (Chrono24, 2021). Chrono24's transaction data resolves the price response at daily granularity: secondary prices rose about 25% above the 2020 average on the rumor alone, reached +31% after confirmation, and January 2021 as a whole closed 49% above the 2020 average (Chrono24, 2021). No metal moved — supply and demand for the physical object were unchanged over those four days. Information alone repriced the reference, which is the cleanest available demonstration that the event, dated to the day, is the pricing input. Patek's president Thierry Stern confirmed the mechanism from the inside, observing that the discontinuation decision itself pushed grey-market prices higher (Monochrome, 2021a). The coda arrived in December 2021, when Phillips sold the first Tiffany-dial 5711/1A-018 — a farewell edition of 170 pieces retailing at $52,635 — for $6.5 million in a charity auction (Monochrome, 2021b): roughly 123 times retail. The Register's methodology treats that result the way its own honesty ladder demands — as a citable provenance event, not a comp. A charity sale measures generosity and spectacle as much as market price, and feeding it into a trimmed mean would poison the estimator the trimming exists to protect.

### 6.3 The whole market: the 2022 peak and the thirteen-quarter decline

The aggregate cycle is itself an event–price coupling, with macro-financial events as the treatment. Secondary prices peaked in March–April 2022 — the terminal months of the crypto and speculative-asset boom, a linkage industry observers drew explicitly as both unwound together (WWD, 2022). What followed was the longest documented drawdown in the modern secondary market: thirteen consecutive quarters of decline in the WatchCharts Overall Market Index through Q2 2025, by which point the quarterly moves had flattened to −0.3% (ScrewDownCrown, 2025), Rolex secondary prices sat at four-year lows (WatchPro, 2025), and coverage through late 2025 and early 2026 described a market finding its floor (Robb Report, 2026; WatchCharts, 2026). Knight Frank's index recorded the same deceleration from the demand side of luxury portfolios (Knight Frank, 2026).

The cycle matters to the Register twice over. Substantively, it is why the CPI-real price change and the 5-year durability component exist: a nominal chart drawn from the 2020–2022 segment alone tells a false story, and the literature's consistent finding (Section 3.1) is that collectibles' inflation-adjusted performance is the honest baseline. Methodologically, it is why the confidence tier decays with comp age: any estimate resting on boom-era sales describes a market that no longer exists.

### 6.4 What this licenses — and what it does not

Together the three episodes support H2's operative claim: influence events are public, dateable, and coupled to price with magnitudes visible in ordinary transaction data. This licenses the provenance-event timeline as a card-level pricing input — each event carrying a date, a type, and a source, displayed on the same surface as the metrics it helps explain. It does not license causal certainty in any individual case, nor event-based price prediction; the couplings shown here are the best-documented episodes, selected precisely because they are legible, and Section 7 counts that selection among the limitations. The claim defended is deliberately minimal: a collector reading a price without the reference's event history is missing an input the market demonstrably uses. The Register attaches the input, dated and sourced, and stops there.

---

## 7. Limitations

The system's own limitation strings are the summary of this section; here we state the full account.

**Venue coverage bias.** Comps come from the venues we track — auction results, marketplace sold listings, forum sales with evidence. These venues over-represent English-language, USD-denominated, collector-grade transactions. Dealer-to-dealer trades, regional markets, and private sales are invisible, and the liquidity signal explicitly undercounts for this reason. The bias direction is not neutral: auction-weighted samples skew toward better examples and event-driven results.

**Small-n estimation.** Many references publish at the median rung of the ladder, where a single unusual sale visibly moves the estimate. The band and n are displayed precisely because the point estimate deserves less attention than users habitually give point estimates. Refusal below n=3 bounds the worst case but does not make n=4 comfortable.

**Survivorship and selection.** The catalog itself is curated toward references with collector interest — the set of watches for which the question "what is this worth" gets asked. Indices computed over this catalog say nothing about the unselected universe, and the Collectibility Index in particular must not be read as a return forecast: it summarizes the present footprint of past demand, which is exactly what survivorship inflates.

**Asking versus sold.** Comps are sold prices wherever the venue distinguishes them, but the scarcity signal's availability component counts active listings — asking behavior — and mixing the two epistemic grades is a known compromise, confined to that one signal and disclosed on the card.

**Condition heterogeneity.** Windowed medians compare pools, not like-for-like pairs. Two honest sales of the same reference can differ 40% on condition and completeness. The limitation string on every price-change figure exists because this is the metric where pooling bites hardest.

**Proxy scarcity.** No brand publishes per-reference production. The Scarcity Index composites observable shadows of scarcity, and its brand-tightness component inherits whatever error the Morgan Stanley × LuxeConsult production estimates carry. It is a reasoned proxy with a stated basis — and still a proxy.

**Comparability under renormalization.** As Section 5.3 concedes, k-of-5 disclosure mitigates but does not remove the incomparability of composites computed over different evidence sets.

**No causal identification.** The H2 episodes are observational. Events coincide with cycles, marketing, and each other; the 5711's discontinuation landed inside the steepest demand boom in the market's history, and the two effects cannot be fully separated in public data. We claim coupling with dates and magnitudes, not identified causal effects. H1 — the decision-confidence claim — is at this stage a motivated hypothesis with an artifact built to test it, and we have deliberately published the artifact before the test rather than claim the test.

---

## 8. Future work: the marketplace as a natural experiment

The project's second phase — a matchmaking marketplace layered on the Register — converts H1 from motivation into a measurable question, because it instruments the moment of decision.

The design is a within-platform natural experiment. Every listing in the marketplace phase links a reference card, and the card's evidential state varies naturally across references: confidence tiers A through C, estimates at every rung of the honesty ladder, provenance timelines of varying depth. Decision-confidence outcomes are then observable behaviorally rather than by survey alone: time from first view to offer, offer-to-asking ratios, abandonment rates at each evidential state, renegotiation and reversal rates after purchase, and the premium (if any) that transactions under tier-A cards command over comparable transactions under tier-C cards. The sharpest available comparison is at the refusal boundary: do buyers facing an honest "—, insufficient comps" transact more cautiously but more durably — fewer reversals, fewer disputes — than buyers facing a thin number? If epistemic humility is infrastructure rather than ornament, it should be visible there, in lower downstream failure rates purchased at the cost of slower conversion.

Alongside the marketplace instrumentation, three extensions are planned: formal event-study estimation over the internal comp panel, using the provenance timelines as the event register and the thirteen-quarter cycle as the background control; venue expansion with per-venue reliability weighting, which the confidence tier's venue-diversity term already anticipates; and longitudinal snapshots of every card at every build — the deterministic architecture makes each build a citable, reproducible dataset, so the Register accumulates its own panel data as a side effect of operating honestly.

The larger wager of the project is the one stated in the title. Markets for lemons are conventionally repaired by warranties, brands, and certification — instruments that transfer risk. A public register transfers knowledge instead, including knowledge of its own limits. Whether that is enough to shift behavior in a market this adversarial is precisely what the next phase measures. The system was built so that either answer will be legible.

---

## 9. References

Akerlof, G. A. (1970). The market for "lemons": Quality uncertainty and the market mechanism. *The Quarterly Journal of Economics, 84*(3), 488–500. https://academic.oup.com/qje/article-abstract/84/3/488/1896241

BCG — Boston Consulting Group. (2023a). *Luxury preowned watches, your time has come.* https://web-assets.bcg.com/d9/2c/54d07ddd411aae9a095519930101/bcg-luxury-preowned-watches-your-time-has-come-mar-2023.pdf

BCG — Boston Consulting Group. (2023b, March 12). *Preowned luxury watch prices outperforming the S&P 500* [Press release]. https://www.bcg.com/news/12march2023-preowned-luxury-watch-prices-outperforming-s-p-500

Burton, B. J., & Jacobsen, J. P. (1999). Measuring returns on investments in collectibles. *Journal of Economic Perspectives, 13*(4), 193–212. https://www.aeaweb.org/articles?id=10.1257/jep.13.4.193

Chernev, A., Böckenholt, U., & Goodman, J. (2015). Choice overload: A conceptual review and meta-analysis. *Journal of Consumer Psychology, 25*(2), 333–358. https://myscp.onlinelibrary.wiley.com/doi/abs/10.1016/j.jcps.2014.08.002

Chrono24 Magazine. (2021). *Patek Philippe has discontinued the Nautilus ref. 5711. What impact will this have on the model's performance?* https://www.chrono24.com/magazine/patek-philippe-ceases-production-of-the-nautilus-5711-whats-next-p_74440/

Chrono24 Magazine. (n.d.). *Vintage watches as collector's items: Original condition vs. the "Frankenwatch."* Accessed July 2026. https://www.chrono24.com/magazine/vintage-watches-as-collectors-items-original-condition-vs-the-frankenwatch-p_64855/

Dimson, E., & Spaenjers, C. (2011). Ex post: The investment performance of collectible stamps. *Journal of Financial Economics, 100*(2), 443–458. https://www.sciencedirect.com/science/article/abs/pii/S0304405X10002941

Forbes — Doerr, E. (2017, October 27). *Paul Newman's own Rolex Daytona reference 6239 breaks world auction record, sells for $17,752,500.* https://www.forbes.com/sites/elizabethdoerr/2017/10/27/paul-newmans-own-rolex-daytona-reference-6239-breaks-world-auction-record-sells-for-17752500/

Forbes — Besler, C. (2022, December 1). *Rolex to establish a certified pre-owned program, rolling it out with authorized retailers, starting in Europe.* https://www.forbes.com/sites/carolbesler/2022/12/01/rolex-to-establish-a-certified-pre-owned-program-rolling-it-out-with-authorized-retailers-starting-in-europe/

FRED — Federal Reserve Bank of St. Louis. (n.d.). *Consumer Price Index for All Urban Consumers: All Items in U.S. City Average (CPIAUCSL)* [Data series]. U.S. Bureau of Labor Statistics. Accessed July 2026. https://fred.stlouisfed.org/series/CPIAUCSL

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly, 28*(1), 75–105. https://misq.umn.edu/misq/article/28/1/75/261/Design-Science-in-Information-Systems-Research1

Iyengar, S. S., & Lepper, M. R. (2000). When choice is demotivating: Can one desire too much of a good thing? *Journal of Personality and Social Psychology, 79*(6), 995–1006. https://business.columbia.edu/faculty/research/when-choice-demotivating-can-one-desire-too-much-good-thing

Knight Frank. (2026, April). *The Wealth Report: Luxury Investment Index results.* https://www.knightfrank.com/research/article/2026/4/knight-frank-luxury-investment-index-luxury-holds-steady

Monochrome Watches. (2021a). *Must read: Thierry Stern on why stopping the Patek Philippe Nautilus 5711.* https://monochrome-watches.com/must-read-thierry-stern-on-why-stopping-the-patek-philippe-nautilus-5711/

Monochrome Watches. (2021b, December). *Phillips breaks records with the first Patek Philippe Nautilus 5711/1A-018 Tiffany sold for $6.5 million.* https://monochrome-watches.com/phillips-sells-the-first-patek-philippe-nautilus-5711-1a-018-tiffany-for-usd-6-5-million/

Monochrome Watches. (2026). *Industry news: Morgan Stanley's top 50 watch brands for 2025 — Rolex still leading the pack, strong polarization of the market.* https://monochrome-watches.com/industry-new-morgan-stanley-top-50-watch-brands-for-2025-rolex-still-leading-the-pack-strong-polarization-of-the-market/

Phillips. (2017, October). *Paul Newman's "Paul Newman" Rolex Daytona sets world record.* https://www.phillips.com/article/18461746/paul-newmans-paul-newman-rolex-daytona-sets-record-fetches-17-dollars-8-cents-million

PRNewswire — Watchfinder & Co. (2023, November). *Over 23 million fake watches are circulating the US as counterfeit goods market continues to grow* [Press release]. https://www.prnewswire.com/news-releases/watchfinder--co-over-23-million-fake-watches-are-circulating-the-us-as-counterfeit-goods-market-continues-to-grow-301985034.html

Revolution Watch. (2026). *What we can learn from Morgan Stanley's ninth annual Swiss watch report.* https://revolutionwatch.com/what-we-can-learn-from-morgan-stanleys-ninth-annual-swiss-watch-report/

Robb Report. (2023). *Fake Rolexes make up 50% of the counterfeit luxury watch market, exec says.* https://robbreport.com/lifestyle/news/counterfeit-rolex-watches-replica-market-1234864485/

Robb Report. (2026). *Why the secondary watch market is finally turning a corner.* https://robbreport.com/style/watch-collector/secondary-watch-market-changes-1237546673/

Rolex. (2022, December). *Rolex Certified Pre-Owned: Because a Rolex watch often lives several lives* [Newsroom]. https://newsroom.rolex.com/about-rolex/rolex-certified-pre-owned-programme

Scheibehenne, B., Greifeneder, R., & Todd, P. M. (2010). Can there ever be too many options? A meta-analytic review of choice overload. *Journal of Consumer Research, 37*(3), 409–425. https://academic.oup.com/jcr/article-abstract/37/3/409/1827647

Schwartz, B. (2004). *The paradox of choice: Why more is less.* Ecco/HarperCollins. https://archive.org/details/paradoxofchoice00barr

ScrewDownCrown. (2025). *Morgan Stanley's Q2 2025 Swiss watch market report.* https://www.screwdowncrown.com/p/morgan-stanley-q2-2025

Simon, H. A. (1996). *The sciences of the artificial* (3rd ed.). MIT Press. https://mitpress.mit.edu/9780262690232/the-sciences-of-the-artificial/

Trilogy Jewellers. (n.d.). *The Morgan Stanley × WatchCharts watch market review.* Accessed July 2026. https://trilogyjewellers.com/blogs/articles/the-morgan-stanley-x-watchcharts-watch-market-review

WatchCharts. (2026, March). *March 2026 watch market update.* https://watchcharts.com/articles/p/9189/march-2026-watch-market-update

WatchPro USA. (2025). *Rolex prices sink to four-year low and there is no upturn in sight.* https://usa.watchpro.com/rolex-prices-sink-to-four-year-low-on-secondary-market/

WWD — Women's Wear Daily. (2022). *Has the crypto-crash really burst the high-end watch's bubble?* https://wwd.com/accessories-news/watches/crypto-crash-burst-luxury-watch-secondary-market-bubble-1235305137/

---

*All numerical claims about The Watch Register's methodology in Section 5 are descriptions of `scripts/lib/indices.mjs` at v1.0; the code is the methodology, and the deterministic build makes every published figure reproducible from committed evidence. Correspondence: watch.nonarkara.org.*
