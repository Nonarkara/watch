// Invariant self-check — smallest thing that fails if the index math breaks.
// Run: node scripts/test-invariants.mjs
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { computeAll, marketEstimate, priceChange } from "./lib/indices.mjs";
import { validateCard } from "./validate_card.mjs";
import { validateSightings } from "./validate_sightings.mjs";
import { isExcludedPortrait } from "./lib/portrait-evidence.mjs";

const BUILD = "2026-07-31"; // pinned — idempotence requires it
// Identical historical sales cannot become both ends of a one-year trend.
const historicalOnly = [100, 200, 300].map((price_usd, i) => ({
  date: `2025-0${6 - i}-01`, price_usd,
}));
assert.equal(priceChange(historicalOnly, "2026-09-08", 1, {
  observations: { "2026-09": 110, "2025-09": 100 },
}).nominal_pct, null, "overlapping cohorts must refuse a trend");
const newmanCard = JSON.parse(readFileSync(new URL("../data/cards/rolex-6239-paul-newman.json", import.meta.url), "utf8"));
assert.equal(newmanCard.market_evidence.comps.find((c) => c.price_usd === 17752500).comparable, false,
  "celebrity-owned lot must remain outside ordinary valuation");
const resonance = JSON.parse(readFileSync(new URL("../data/cards/journe-resonance.json", import.meta.url), "utf8"));
for (const lot of ["230170", "225726"]) {
  assert.equal(resonance.market_evidence.comps.find((c) => c.url.endsWith(`/${lot}`))?.comparable, false,
    "the Souscription and Coppola RN lots must stay outside the standard RS valuation");
}
assert.ok(!resonance.market_evidence.comps.some((c) => c.url.includes("152081113")),
  "the Résonance charity result belongs in provenance, not in the market series");
assert.ok(resonance.provenance_events.some((event) => event.source_url.includes("152081113") && event.description.includes("SGD 4 million")),
  "retain the charity result in its original currency");
const simplicity = JSON.parse(readFileSync(new URL("../data/cards/dufour-simplicity.json", import.meta.url), "utf8"));
for (const [lot, result] of [["147960", "CHF 1,361,000"], ["232982", "HKD 9,461,500"]]) {
  assert.equal(simplicity.provenance_events.filter((event) => event.source_url.endsWith(`/${lot}`) && event.description.includes(result)).length, 1,
    "retain each exceptional Simplicity sale once in its original currency");
  assert.ok(!simplicity.market_evidence.comps.some((comp) => comp.url.endsWith(`/${lot}`) ||
    [1500000, 1210000, 1207287].includes(comp.price_usd)),
  "exceptional Simplicity lots and their secondary USD quotes must stay out of the comparable series");
}
const fixture = JSON.parse(readFileSync(new URL("./fixtures/test-card.json", import.meta.url), "utf8"));

// Curated image assignments — checked by invariant 13 below.
const IMAGES_FILE = new URL("../data/shared/images.json", import.meta.url);
const images = existsSync(IMAGES_FILE)
  ? JSON.parse(readFileSync(IMAGES_FILE, "utf8"))
  : {};
const shared = {
  cpi: { series: "CPIAUCSL", observations: { "2021-07": 272.184, "2025-07": 322.132, "2026-07": 330.0, "2026-06": 329.5 } },
  brand_production: { testbrand: { annual_units: 50000, source_url: "https://example.com", year: 2025 } },
  screen_sightings: { sightings: [] },
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
assert.equal(cBare.attention.value, null);

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

// 10a. The Phillips art auction cannot enter any watch's market evidence.
{
  const cardDir = new URL("../data/cards/", import.meta.url);
  for (const file of readdirSync(cardDir).filter((name) => name.endsWith(".json"))) {
    const card = JSON.parse(readFileSync(new URL(file, cardDir), "utf8"));
    assert.ok(!card.market_evidence.comps.some((comp) => /NY010523/i.test(comp.url)),
      `${file}: Phillips NY010523 is an art auction, not a watch sale`);
  }
  for (const id of ["rolex-126610ln", "rolex-116610lv-hulk", "rolex-1680-red", "rolex-1803", "rolex-5513"]) {
    const card = JSON.parse(readFileSync(new URL(`${id}.json`, cardDir), "utf8"));
    const comps = card.market_evidence.comps.filter((comp) => comp.comparable !== false);
    const estimate = marketEstimate(comps, BUILD);
    assert.ok(estimate.n >= 2, `${id} must retain its supported sales`);
    assert.equal(new Set(comps.map((comp) => comp.url)).size, comps.length, `${id} must cite distinct sales`);
    if (estimate.n < 3) {
      assert.equal(estimate.value, null, `${id} cannot publish an estimate with two sales`);
      assert.equal(estimate.reason, "insufficient_comps");
    }
  }
}

// 10b. Fuzzy-matched Phillips comps route correctly: every fuzzy match is
// comparable:false (so the market estimate ignores it), carries a condition
// that names the harvested reference (so the dossier can show *why* it's
// excluded), and uses a phillips.com URL that points to a real lot. The
// fuzzy-matches.json file is the single source of truth for what's been
// promoted from the harvest queue.
{
  const { readdirSync, existsSync } = await import("node:fs");
  const matchesFile = new URL("../data/market/fuzzy-matches.json", import.meta.url);
  if (!existsSync(matchesFile)) {
    // No fuzzy-matches.json means the harvest hasn't been promoted yet;
    // the silent skip is fine, the next pipeline run will materialise it.
  } else {
    const matches = JSON.parse(readFileSync(matchesFile, "utf8"));
    assert.ok(matches.matches.length > 0, "fuzzy-matches.json should have at least one promotion");
    // Re-read every touched card and assert the promoted comps are honest.
    const cardFiles = readdirSync(new URL("../data/cards", import.meta.url))
      .filter((name) => name.endsWith(".json"));
    let promotedComps = 0;
    for (const file of cardFiles) {
      const card = JSON.parse(readFileSync(new URL(`../data/cards/${file}`, import.meta.url), "utf8"));
      const fuzzy = (card.market_evidence?.comps ?? []).filter((c) => c.fuzzy_match);
      for (const c of fuzzy) {
        promotedComps++;
        assert.equal(c.comparable, false,
          `${file} fuzzy comp must be comparable:false so the estimate ignores it`);
        assert.ok(/^https:\/\/www\.phillips\.com\/detail\//.test(c.url ?? ""),
          `${file} fuzzy comp URL must point to a real Phillips lot page`);
        assert.ok(typeof c.condition === "string" && /similar reference/.test(c.condition),
          `${file} fuzzy comp must carry a 'similar reference:' condition`);
        assert.ok(c.fuzzy_match.harvested_reference && c.fuzzy_match.match_level,
          `${file} fuzzy comp must preserve the harvested reference + match level`);
      }
    }
    assert.equal(promotedComps, matches.matches.length,
      `every fuzzy match in fuzzy-matches.json must land on a card (got ${promotedComps} comps, ${matches.matches.length} matches)`);

    // 10c. An FX-converted comp must carry its own provenance. A converted row
    // without {from, rate, rate_date, provider, original_display} reads on the
    // dossier as a native USD sale, which it is not. The ECB publishes on
    // business days only, so rate_date is frequently the day *before* sale_date —
    // the test asserts rate_date is on or before the sale, not equal to it.
    let fxRows = 0;
    for (const file of cardFiles) {
      const card = JSON.parse(readFileSync(new URL(`../data/cards/${file}`, import.meta.url), "utf8"));
      for (const c of (card.market_evidence?.comps ?? [])) {
        if (!c.fx_conversion) continue;
        fxRows++;
        const fx = c.fx_conversion;
        assert.ok(fx.from && fx.original_currency && fx.original_display,
          `${file} fx comp must name the source currency and the original hammer display`);
        assert.equal(fx.from, fx.original_currency,
          `${file} fx comp from/original_currency must agree`);
        assert.ok(Number.isFinite(fx.rate) && fx.rate > 0,
          `${file} fx comp must carry a positive numeric rate`);
        assert.ok(/central bank|ecb/i.test(fx.provider),
          `${file} fx comp must name a central-bank rate provider, got "${fx.provider}"`);
        assert.ok(fx.rate_date <= c.date,
          `${file} fx rate_date ${fx.rate_date} must be on or before the sale date ${c.date}`);
        // The USD figure must actually be the converted hammer, not a rounding
        // of the original — this catches a hardcoded or mis-copied rate.
        const expected = Math.round(fx.original_realized * fx.rate);
        assert.equal(c.price_usd, expected,
          `${file} fx comp price_usd must equal original_realized × rate`);
        assert.ok(!c.fuzzy_match || c.comparable === false,
          `${file} an fx-converted comp must never be comparable`);
      }
    }
    assert.ok(fxRows > 0, "at least one fx-converted comp must be on file (the HKD/CHF lots)");
  }
}

// The 1675 clears the market gate with distinct USD sales and deliberately
// excludes gold and special-provenance variants.
for (const expected of [
  { file: "rolex-1675.json", n: 3, value: 22860, window: 120, asOf: "2024-12-07" },
]) {
  const card = JSON.parse(readFileSync(new URL(`../data/cards/${expected.file}`, import.meta.url), "utf8"));
  const comps = card.market_evidence.comps.filter((c) => c.comparable !== false);
  const estimate = marketEstimate(comps, BUILD);
  assert.equal(estimate.n, expected.n, `${card.id} must retain three comparable USD sales`);
  assert.equal(estimate.value, expected.value, `${card.id} estimate must be the three-sale median`);
  assert.equal(estimate.window_months, expected.window, `${card.id} must disclose its evidence window`);
  assert.equal(estimate.as_of, expected.asOf);
  assert.equal(new Set(comps.map((c) => c.url)).size, expected.n,
    `${card.id} comps must point to three distinct source records`);
}

// 11. Screen exposure changes attention pressure, never scarcity.
const withScreen = { ...shared, screen_sightings: { sightings: [{
  media_type: "film", match_level: "exact_reference", matched_card_ids: [fixture.id],
}] } };
const cScreen = computeAll(fixture, withScreen, BUILD);
assert.equal(cScreen.attention.value, 20);
assert.equal(cScreen.attention.screen_count, 1);
assert.equal(cScreen.scarcity.value, c1.scarcity.value, "screen exposure must not alter scarcity");
assert.equal(cScreen.attention.pressure, Math.round(Math.sqrt(c1.scarcity.value * 20)));

// ─── sightings schema invariants ────────────────────────────────────────────
// The validator rejects bad data; the canonical screen data passes; the test
// fixtures exercise the positive + negative paths. We never let a malformed
// sighting reach the public dataset.
const sFx = JSON.parse(readFileSync(new URL("./fixtures/test-sightings.json", import.meta.url), "utf8"));

// positive: every well-formed fixture sighting passes
for (const key of ["synthetic_exact", "synthetic_family", "synthetic_iconic", "synthetic_orphan_rolex"]) {
  assert.deepEqual(validateSightings({ sightings: [sFx[key]] }), [], `expected ${key} to validate`);
}

// negative: missing source_url
{
  const errs = validateSightings({ sightings: [sFx.synthetic_missing_url] });
  assert.ok(errs.some((e) => e.includes("source_url")), "missing source_url must fail validation");
}

// negative: duplicate id
{
  const errs = validateSightings({ sightings: [sFx.synthetic_exact, sFx.synthetic_dup_id] });
  assert.ok(errs.some((e) => e.includes("duplicate")), "duplicate id must fail validation");
}

// negative: iconic still claiming a free-reuse licence — the design rule says
// iconic stills are always Promotional/editorial because the film studio owns
// the still. A "fair use, public domain" claim must be rejected.
{
  const errs = validateSightings({ sightings: [sFx.synthetic_fake_license_iconic] });
  assert.ok(errs.some((e) => e.includes("Promotional") || e.includes("free-reuse")),
    "iconic still with a fake free-reuse license must fail validation");
}

// The actual canonical screen data is valid
{
  const canonical = JSON.parse(readFileSync(new URL("../data/shared/screen_sightings.json", import.meta.url), "utf8"));
  const errs = validateSightings(canonical);
  assert.deepEqual(errs, [], `canonical screen data must validate — errors: ${errs.join("; ")}`);
}

console.log("✓ all invariants hold");

// 12. Price band shelves on the best-available price and says which price it used.
import { marketBand } from "./lib/indices.mjs";
const BANDS = { bands: [
  { band: "Trophy", min_usd: 1000000 }, { band: "Blue chip", min_usd: 10000 },
  { band: "Accessible", min_usd: 2000 }, { band: "Entry", min_usd: 300 }, { band: "Everyday", min_usd: 0 },
]};
{
  const b = marketBand(fixture, c1.estimate, BANDS);
  assert.equal(b.band, "Blue chip", "fixture estimate ~$20k must land Blue chip");
  assert.equal(b.basis, "market estimate");
  // no comps + no msrp → no band, honest reason
  const noPrices = structuredClone(fixture);
  noPrices.market_evidence.comps = [];
  noPrices.retail = { msrp_history: [], current_msrp_usd: null };
  const cNo = computeAll(noPrices, shared, BUILD);
  assert.equal(cNo.market_band.band, null);
  assert.equal(cNo.market_band.reason, "no_price_basis");
  // retail-only card names the retail basis, never claims a market estimate
  const retailOnly = structuredClone(fixture);
  retailOnly.market_evidence.comps = [];
  const bR = marketBand(retailOnly, { value: null }, BANDS);
  assert.equal(bR.band, "Blue chip");
  assert.match(bR.basis, /retail/);
}
console.log("✓ price-band invariants hold");

// 13. Image fallback invariant — no URL in images.json should be shared by 3+
// different cards. A URL used by 2 cards is fine (a single photo legitimately
// covers a two-config Rolex family). 3+ means the same generic photo is
// standing in for unrelated watches, which is the "Certina shows a Patek" lie.
{
  const urlCounts = new Map();
  for (const [id, entry] of Object.entries(images)) {
    if (!entry?.file) continue;
    const u = entry.file;
    if (!urlCounts.has(u)) urlCounts.set(u, []);
    urlCounts.get(u).push(id);
  }
  const offenders = [...urlCounts.entries()]
    .filter(([, ids]) => ids.length >= 3)
    .map(([u, ids]) => ({ url: u, count: ids.length, sample: ids.slice(0, 5) }));
  if (offenders.length) {
    const detail = offenders.map((o) =>
      `  ${o.count}x  ${o.url.slice(0, 100)}\n    used by: ${o.sample.join(', ')}`).join('\n');
    assert.fail(`images.json has ${offenders.length} URL(s) used by 3+ cards. Each is a "Certina shows a Patek" lie. Re-run scripts/fix_fallback_images.mjs to repair.\n${detail}`);
  }
}
console.log("✓ no image fallback URL is shared by 3+ cards");

// 14. Cross-brand dup2 invariant — a photo of one brand must not stand
// in for a DIFFERENT brand (the JLC-perpetual-on-Lange lie). Same-brand
// family shares are allowed; cross-brand 2-shares are not.
{
  const brandForCard = new Map();
  const cardFiles = readdirSync(new URL('../data/cards', import.meta.url)).filter(f => f.endsWith('.json'));
  for (const cf of cardFiles) {
    const c = JSON.parse(readFileSync(new URL('../data/cards/' + cf, import.meta.url), 'utf8'));
    brandForCard.set(c.id, c.identity.brand);
  }
  const urlBrand = new Map();
  for (const [id, entry] of Object.entries(images)) {
    if (!entry?.file) continue;
    const u = entry.file;
    const brand = brandForCard.get(id) ?? 'unknown';
    if (!urlBrand.has(u)) urlBrand.set(u, new Set());
    urlBrand.get(u).add(brand);
  }
  const crossBrand = [...urlBrand.entries()]
    .filter(([, brands]) => brands.size > 1)
    .map(([u, brands]) => ({ url: u, brands: [...brands] }));
  if (crossBrand.length) {
    const detail = crossBrand.map(o => `  ${o.url.slice(0, 90)} — brands: ${o.brands.join(', ')}`).join('\n');
    assert.fail(`images.json has cross-brand image shares (one brand's photo standing in for another). Re-run scripts/fix_fallback_images.mjs to repair.\n${detail}`);
  }
}
console.log("✓ no cross-brand image shares in images.json");

// A licence permits reuse; it does not prove the subject is the named watch.
assert.ok(isExcludedPortrait('https://commons.wikimedia.org/wiki/File%3ACounterfeit%20Casio%20F-91W%20digital%20watch.jpg'));
assert.ok(isExcludedPortrait('https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Counterfeit_Casio_F-91W_digital_watch.jpg/250px-Counterfeit_Casio_F-91W_digital_watch.jpg'));
assert.ok(isExcludedPortrait('/img/local-copy.jpg', images['anordain-model-1-midnight'].source_url));
assert.equal(isExcludedPortrait(images['ap-15202st'].file, images['ap-15202st'].source_url), false);
const portraitOutput = JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8'));
const louisVariant = portraitOutput.cards.find(card => card.id === 'louis-richard-triple-detent-tourbillon')
  ?.variant_sales.find(sale => sale.url.endsWith('/232871'));
assert.equal(louisVariant?.date_basis, 'lot_date', 'Phillips session I confirms lot 108 sold on May 9');
assert.equal(louisVariant?.fx_conversion?.original_display, 'CHF3,968,000');
assert.equal(louisVariant?.fx_conversion?.date_basis, 'auction_start',
  'a verified sale date does not retroactively change the FX lookup basis');
for (const card of portraitOutput.cards) {
  for (const sale of card.variant_sales) {
    const fx = sale.fx_conversion;
    if (!fx) continue;
    assert(fx.original_display && fx.original_currency && fx.rate_date && fx.date_basis,
      `${card.id}: converted variants need both the native result and the rate basis`);
    assert(!card.notable_sales.some(comp => comp.url === sale.url),
      `${card.id}: excluded conversions must not enter the verified sale series`);
    if (fx.date_basis === 'auction_start') assert.equal(fx.reference_date, sale.date);
  }
}
const misleadingPortraits = portraitOutput.cards.flatMap(card => card.media
  .filter(media => isExcludedPortrait(media.url, media.source_url)).map(() => card.id));
assert.deepEqual(misleadingPortraits, [], 'excluded portrait assets must not publish');
assert.ok(portraitOutput.cards.find(card => card.id === 'ap-15202st')?.media
  .some(media => media.url === images['ap-15202st'].file), 'keep the sourced 15202ST portrait');
console.log('✓ rejected portrait assets stay out of the public dataset');

// 15. Model-name channel guard — a published model name may not be a LINE.
// The auction census matches a lot on brand + published model name when the
// reference channel cannot, because the haute-horlogerie tier publishes names
// instead of reference numbers. Exact normalised equality already stops a
// declared name sweeping variants ("Day-Date II" ≠ "Day-Date"). What it cannot
// stop is a bare name that is itself a family: "Day-Date" spans refs 1803–2286
// and roughly $10k–$2M, so one card claiming it would be a near-miss wearing an
// identity's clothes. That mistake was made once already, when the first
// implementation inferred the model name from identity.name and swept a
// Rolex lot into the 1803 card. Two rules hold the line now:
//
//   a) no declared model name may be a known line name (committed list), and
//   b) two cards of the same brand may not claim the same model name, which
//      would make the channel double-assign one lot to two references.
//
// The list lives in scripts/model-name-family-guard.json with its reason.
const guard = JSON.parse(readFileSync(new URL('./model-name-family-guard.json', import.meta.url), 'utf8'));
const watchedLineNames = guard.family_names.length;
{
  const banned = new Set(guard.family_names.map((n) => n.toUpperCase().replace(/[^A-Z0-9]/g, '')));
  const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cardFiles = readdirSync(new URL('../data/cards', import.meta.url)).filter((f) => f.endsWith('.json'));

  // How many distinct cards does each brand hold under each collection name? A
  // collection that appears more than once is holding several different models,
  // so the collection NAME is a family and must never be claimed as a model name.
  // A collection with one card is that maker's single reference, and for a small
  // independent the collection genuinely is the model — AkriviA's AK-06 is both.
  const collectionWidth = new Map();
  for (const cf of cardFiles) {
    const card = JSON.parse(readFileSync(new URL('../data/cards/' + cf, import.meta.url), 'utf8'));
    const c = card.identity?.collection;
    if (typeof c !== 'string' || !c.trim()) continue;
    const k = `${card.identity.brand.toUpperCase()}|${norm(c)}`;
    collectionWidth.set(k, (collectionWidth.get(k) ?? 0) + 1);
  }

  const offenders = [];
  const claims = new Map(); // `${brand}|${model}` -> [card ids]
  for (const cf of cardFiles) {
    const card = JSON.parse(readFileSync(new URL('../data/cards/' + cf, import.meta.url), 'utf8'));
    const pmn = card.identity?.published_model_name;
    if (typeof pmn !== 'string' || !pmn.trim()) continue;
    const key = norm(pmn);
    if (banned.has(key)) {
      offenders.push(`  ${card.id} — published_model_name "${pmn}" is a LINE, not a model`);
      continue;
    }
    const collection = card.identity?.collection;
    if (typeof collection === 'string' && collection.trim() && norm(collection) === key) {
      const width = collectionWidth.get(`${card.identity.brand.toUpperCase()}|${key}`) ?? 1;
      if (width > 1) {
        offenders.push(`  ${card.id} — published_model_name "${pmn}" is its collection name, and ${width} cards sit under that collection, so it names a family of models, not one watch`);
      }
    }
    const claimKey = `${card.identity.brand.toUpperCase()}|${key}`;
    if (!claims.has(claimKey)) claims.set(claimKey, []);
    claims.get(claimKey).push(card.id);
  }
  const doubleClaimed = [...claims.entries()].filter(([, ids]) => ids.length > 1);
  for (const [, ids] of doubleClaimed) {
    offenders.push(`  ${ids.join(' + ')} — two cards of one brand claim the same published model name`);
  }
  if (offenders.length) {
    assert.fail(`published_model_name channel guard failed. A line name claimed as a model name would sweep a family of watches into one reference and call it an exact identity.\n${offenders.join('\n')}\nIf a name really is a specific model, remove it from scripts/model-name-family-guard.json and say why in that file's _why field.`);
  }
}
console.log(`✓ model-name channel declares no line names and no double claims (${watchedLineNames} line names watched)`);
