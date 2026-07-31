// Invariant self-check — smallest thing that fails if the index math breaks.
// Run: node scripts/test-invariants.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeAll, marketEstimate } from "./lib/indices.mjs";
import { validateCard } from "./validate_card.mjs";

const BUILD = "2026-07-31"; // pinned — idempotence requires it
const fixture = JSON.parse(readFileSync(new URL("./fixtures/test-card.json", import.meta.url), "utf8"));
const shared = {
  cpi: { series: "CPIAUCSL", observations: { "2021-07": 272.184, "2025-07": 322.132, "2026-07": 330.0, "2026-06": 329.5 } },
  brand_production: { testbrand: { annual_units: 50000, source_url: "https://example.com", year: 2025 } },
};

// fixture is a valid card
assert.deepEqual(validateCard(fixture, { id: "testbrand-tb1", buildDate: BUILD }), []);

const c1 = computeAll(fixture, shared, BUILD);
const c2 = computeAll(fixture, shared, BUILD);
// 1. Idempotence: byte-identical recomputation
assert.equal(JSON.stringify(c1), JSON.stringify(c2), "computeAll must be deterministic");

// 2. Estimate honesty: fixture has 8 comps in 12mo → trimmed mean, with n/window/as_of
assert.equal(c1.estimate.method, "trimmed_mean_20");
assert.equal(c1.estimate.n, 8);
assert.ok(c1.estimate.value > 0 && c1.estimate.as_of, "estimate carries value + as_of");
assert.ok(c1.estimate.band[0] <= c1.estimate.value && c1.estimate.value <= c1.estimate.band[1], "value inside band");

// 3. Refusal below n=3: strip comps → no estimate, reason code, no fake numbers
const bare = { ...fixture, market_evidence: { comps: [], listing_observations: [] } };
const cBare = computeAll(bare, shared, BUILD);
assert.equal(cBare.estimate.value, null);
assert.equal(cBare.estimate.reason, "no_comps");
assert.equal(cBare.premium.value, null);
assert.equal(cBare.confidence.tier, null);
assert.equal(cBare.liquidity.tier, "Unknown");

// 4. Indices in range with k-of disclosure
for (const ix of [c1.scarcity, c1.collectibility]) {
  assert.ok(ix.value >= 0 && ix.value <= 100, "index in [0,100]");
  assert.ok(ix.k_of[0] >= 1 && ix.k_of[0] <= ix.k_of[1], "k_of disclosure present");
  assert.ok(ix.limitation.length > 10, "limitation string present");
}

// 5a. A still-in-production card priced off an old MSRP must flag the stale baseline
const inProd = structuredClone(fixture);
inProd.identity.produced = { start_year: 2016, end_year: null, discontinued: false };
inProd.retail.current_msrp_usd = null;
const cInProd = computeAll(inProd, shared, BUILD);
assert.equal(cInProd.premium.stale_baseline, true, "in-production + old MSRP must mark a stale baseline");
assert.match(cInProd.premium.vs, /^\d{4} retail$/, "stale baseline must not claim 'final retail'");
assert.match(cInProd.premium.limitation, /still in production/, "stale baseline must say so");
// while the discontinued fixture calls the same number final retail
assert.match(c1.premium.vs, /^final retail \(\d{4}\)$/);
assert.notEqual(c1.premium.stale_baseline, true);

// 5. Premium math traces to inputs
const msrp = fixture.retail.msrp_history.at(-1).price_usd;
assert.equal(c1.premium.msrp_usd, msrp);
assert.equal(c1.premium.value, Math.round(((c1.estimate.value - msrp) / msrp) * 1000) / 10);

// 6. CPI-real change: nominal exists and real < nominal when CPI rose
assert.equal(c1.change_5y.n_now, 8);
assert.ok(c1.change_5y.nominal_pct != null && c1.change_5y.real_pct != null);
assert.ok(c1.change_5y.real_pct < c1.change_5y.nominal_pct, "inflation must reduce real gains when CPI rose");

// 7. Confidence tier re-derivable: 8 comps, 3 venues, fresh → B (needs ≥10/24mo for A)
assert.equal(c1.confidence.tier, "B");

// 8. Scarcity monotonicity: limited edition of 500 must score higher than unlimited, all else equal
const limited = structuredClone(fixture);
limited.scarcity_inputs.limited_edition = { is_limited: true, stated_size: 500, source_url: "https://example.com/le" };
assert.ok(computeAll(limited, shared, BUILD).scarcity.value > c1.scarcity.value, "limited > unlimited scarcity");

// 9. Non-comparable comps never reach the estimator: a $10M variant lot must not move the number
const variant = structuredClone(fixture);
variant.market_evidence.comps.push({ date: "2026-07-01", price_usd: 10000000, venue: "phillips",
  url: "https://example.com/variant", condition: "Special-dial variant, not the base reference", box_papers: "full_set", comparable: false });
assert.deepEqual(validateCard(variant, { id: "testbrand-tb1", buildDate: BUILD }), []);
const cVariant = computeAll(variant, shared, BUILD);
assert.equal(cVariant.estimate.value, c1.estimate.value, "comparable:false must not move the estimate");
assert.equal(cVariant.estimate.n, c1.estimate.n, "comparable:false must not inflate n");
// and a comparable:false comp without an explanation is rejected
const unexplained = structuredClone(variant);
unexplained.market_evidence.comps.at(-1).condition = null;
assert.ok(validateCard(unexplained, { id: "testbrand-tb1", buildDate: BUILD }).length > 0,
  "comparable:false without a reason must fail validation");

// 10. Windowing: comp dated after buildDate is ignored, not counted
const future = structuredClone(fixture);
future.market_evidence.comps.push({ date: "2027-01-01", price_usd: 999999, venue: "ebay", url: "https://example.com/f", condition: null, box_papers: null });
assert.equal(marketEstimate(future.market_evidence.comps, BUILD).n, 8, "future comps excluded");

console.log("✓ all invariants hold");
