// Link integrity — fails if any internal <Link to>/PATHS target has no matching route.
// A dead nav link renders a blank page, which on a reference site reads as broken data.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).pathname;
const routes = new Set(
  [...readFileSync(join(ROOT, "src/main.tsx"), "utf8").matchAll(/<Route path="([^"]+)"/g)]
    .map((m) => "/" + m[1]).concat(["/"]));
const dynamic = [...routes].filter((r) => r.includes(":")).map((r) => r.split("/:")[0]);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

const bad = [];
for (const file of walk(join(ROOT, "src"))) {
  const src = readFileSync(file, "utf8");
  const targets = [
    ...[...src.matchAll(/to=["'{]+(\/[a-z0-9\-/]*)/g)].map((m) => m[1]),
    ...[...src.matchAll(/to: '(\/[a-z0-9\-/]*)'/g)].map((m) => m[1]),
  ];
  for (const t of targets) {
    const clean = t.split("#")[0].replace(/\/$/, "") || "/";
    if (routes.has(clean)) continue;
    if (dynamic.some((d) => clean.startsWith(d) && clean !== d)) continue;
    bad.push(`${file.replace(ROOT, "")} → ${clean}`);
  }
}
assert.deepEqual(bad, [], `internal links with no matching route:\n  ${bad.join("\n  ")}`);
console.log(`✓ every internal link resolves (${routes.size} routes)`);

// ─── anti-drift: stat strings must not hardcode build-computed counts ───────
// The 2026-08-02 lesson: a hardcoded "186 taggable photos · license verified"
// stat on the front door drifted from reality and broke the site's own
// attribution standard. Any count the build produces must be read from the
// build, not typed into a string literal. This check fails if a stat string
// in Home.tsx contains a bare number that looks like a dataset count.
const homeSrc = readFileSync(join(ROOT, "src/pages/Home.tsx"), "utf8");
// Pull every string literal assigned to a `stat:` field.
const statLiterals = [...homeSrc.matchAll(/stat:\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
// Also catch template literals referencing counts (those are fine — they read
// from data). We only flag PURE string literals that contain a digit sequence
// long enough to be a count (≥2 digits) alongside a unit keyword.
const unitWords = /\b(sighting|stills?|photos?|records?|cards?|references?|comps?|catalog|images?)\b/i;
const driftHits = [];
for (const lit of statLiterals) {
  const nums = [...lit.matchAll(/\d{2,}/g)].map((m) => m[0]);
  if (nums.length && unitWords.test(lit)) {
    driftHits.push(`'${lit}'`);
  }
}
assert.deepEqual(driftHits, [],
  `Home.tsx stat strings hardcode counts instead of reading them from the build:\n  ${driftHits.join("\n  ")}\n  → derive these from data/screen/catalog so they cannot drift.`);
console.log("✓ no hardcoded count strings in Home stat fields");

// The Data page is the audit trail; a literal ledger count there is especially
// dangerous because it looks authoritative after the dataset changes.
const dataSrc = readFileSync(join(ROOT, "src/pages/Data.tsx"), "utf8");
const literalDataCounts = [...dataSrc.matchAll(/<strong>\s*(\d{2,}[^<{]*?)<\/strong>/g)].map((m) => m[1]);
assert.deepEqual(literalDataCounts, [],
  `Data.tsx contains hardcoded counts inside <strong>: ${literalDataCounts.join(", ")}\n  → read them from the live dataset.`);
console.log("✓ no hardcoded ledger counts on the Data audit page");

assert.ok(dataSrc.includes('computed.estimate.value != null'),
  'Data refusal count must use the actual publishable estimate gate');
assert.ok(!dataSrc.includes('data.count - cardStats.withComps'),
  'having one comp is not the same as clearing the estimate gate');
console.log("✓ Data refusal count follows the publishable-estimate gate");

// The Pom page is the worked example for the valuation system. Its calculator
// must keep scenario math separate from the evidence-derived estimate, and its
// dossier buttons must never point at invented or renamed card ids.
const pomPageSrc = readFileSync(join(ROOT, "src/pages/Pom.tsx"), "utf8");
const pomDataSrc = readFileSync(join(ROOT, "src/lib/pom.ts"), "utf8");
const valueLabSrc = readFileSync(join(ROOT, "src/lib/value-lab.ts"), "utf8");
assert.match(valueLabSrc, /HOLDING_PERIODS = \[1, 2, 3, 10, 20\] as const/,
  'Pom value lab must publish the five requested holding periods');
assert.ok(valueLabSrc.includes('Math.pow(1 + annualRate / 100, years)'),
  'Pom projection must use explicit annual compounding');
assert.ok(pomPageSrc.includes('computed.estimate.value'),
  'Pom value lab must distinguish a computed estimate from a user scenario');
assert.ok((pomPageSrc.includes("setTab('saved')") || pomPageSrc.includes("openMode('saved')")) && pomPageSrc.includes('summarizeCollectionEstimates'),
  'Pom value lab must let a visitor model the browser-local saved collection');
assert.ok(pomPageSrc.includes('savedSummary.evidence_total') && pomPageSrc.includes('not a collection total'),
  'Pom must refuse to promote a priced subset into a collection valuation');
assert.ok(pomPageSrc.includes('SOURCE: DOSSIER ESTIMATORS') && pomPageSrc.includes('COMPONENTS AS OF'),
  'Pom collection totals must disclose source, confidence tier, and component date');
assert.ok(pomPageSrc.includes('NEUTRAL_ANNUAL_RATE'),
  'Pom must default growth to the neutral assumption');
assert.ok(pomPageSrc.includes("searchParams.get('watch')") && pomPageSrc.includes("setTab('watch')"),
  'a valid ?watch deep link must open the single-reference value lab');
assert.ok(pomPageSrc.includes('/marketplaces?watch='),
  'the value lab must carry its selected reference into selling-cost math');
const compoundBenchmark = 10_000 * Math.pow(1.05, 20);
assert.equal(Math.round(compoundBenchmark), 26_533,
  '20-year 5% compound benchmark must remain stable');

const publicData = JSON.parse(readFileSync(join(ROOT, "public/data.json"), "utf8"));
const publicCardIds = new Set(publicData.cards.map((card) => card.id));
const pomDossierIds = [...pomDataSrc.matchAll(/dossierId:\s*'([^']+)'/g)].map((match) => match[1]);
const deadPomDossiers = pomDossierIds.filter((id) => !publicCardIds.has(id));
assert.deepEqual(deadPomDossiers, [],
  `Pom dossier links missing from public data: ${deadPomDossiers.join(', ')}`);
console.log("✓ Pom value lab horizons, saved collection gate, compounding, and dossier links hold");

// ─── week-one anti-regression: home banner is load-bearing ──────────────────
assert.ok(homeSrc.includes('timepop-hero'),
  'Home must use the MoMA timepop-hero fold, not image-less HeroBanner alone');
assert.ok(homeSrc.includes('market-trends') && homeSrc.includes('loadMarketTrends'),
  'Home must render the daily market-attention band from loadMarketTrends');
assert.ok(homeSrc.includes('/img/hero/time-pop-banner.png'),
  'Home must render the load-bearing pop-art banner asset');
assert.ok(!homeSrc.includes('24 references'),
  'Home ticker count must come from ticker.length, not a hardcoded "24 references"');
console.log("✓ home pop-art banner fold is wired");

// ─── starter ladders must resolve on card.id ────────────────────────────────
const danglingStarters = [];
for (const card of publicData.cards) {
  const alt = card.narrative?.starter_alternative;
  if (!alt) continue;
  if (!publicCardIds.has(alt)) danglingStarters.push(`${card.id} → ${alt}`);
}
assert.deepEqual(danglingStarters, [],
  `starter_alternative targets missing from public data:\n  ${danglingStarters.join("\n  ")}\n  → resolve on card.id (not filename stem)`);
console.log("✓ every starter_alternative resolves to a live card id");

// ─── market trends snapshot must map to live cards ──────────────────────────
const trendsPath = join(ROOT, "public/data/market_trends.json");
assert.ok(existsSync(trendsPath), "public/data/market_trends.json missing — run npm run data:trends");
const trends = JSON.parse(readFileSync(trendsPath, "utf8"));
assert.ok(trends.as_of && trends.trending?.length >= 5,
  "market_trends snapshot must carry as_of + ≥5 ranked rows");
assert.ok(Array.isArray(trends.sources) && trends.sources.length >= 1,
  "market_trends must disclose sources");
assert.ok(typeof trends.limitation === "string" && trends.limitation.length > 40,
  "market_trends must state a limitation (attention ≠ price)");
const deadTrendCards = trends.trending
  .map((row) => row.card_id)
  .filter((id) => !publicCardIds.has(id));
assert.deepEqual(deadTrendCards, [],
  `market_trends card_ids missing from public data: ${deadTrendCards.join(", ")}`);
const inventedInterest = trends.trending.filter((row) =>
  row.trends?.interest != null && (row.trends.interest < 0 || row.trends.interest > 100));
assert.deepEqual(inventedInterest, [],
  "Google Trends interest must stay in 0–100 when present");
console.log(`✓ market trends snapshot (${trends.trending.length} rows, as_of ${trends.as_of})`);

// Saved is the collector's private view of the public attention snapshot.
// The set and its prior-day rank history must stay on-device, while its
// browse count must follow the build instead of drifting as the archive grows.
const savedSrc = readFileSync(join(ROOT, "src/pages/Saved.tsx"), "utf8");
const globalCss = readFileSync(join(ROOT, "src/index.css"), "utf8");
assert.ok(savedSrc.includes('loadMarketTrends') && savedSrc.includes('compareSavedAttention'),
  'Saved must join local watch ids to the daily public-attention snapshot');
assert.ok(savedSrc.includes("watch.attention.history.v1"),
  'Saved attention history must use an explicit browser-local storage key');
assert.ok(savedSrc.includes('BROWSE THE {data.count} OBJECTS'),
  'Saved empty-state archive count must come from the live dataset');
assert.ok(!savedSrc.includes('BROWSE THE 261 OBJECTS'),
  'Saved must not preserve the stale 261-object literal');
assert.ok(savedSrc.includes('ATTENTION ≠ PRICE'),
  'Saved pulse must visibly distinguish attention from price evidence');
console.log('✓ Saved pulse is private, evidence-labelled, and count-safe');

assert.match(globalCss, /\.cite-source-link\s*\{[^}]*pointer-events:\s*none;/s,
  'hidden citation links must not intercept clicks on nearby dossier controls');
assert.match(globalCss, /\.cite:hover \.cite-source-link,[^}]*pointer-events:\s*auto;/s,
  'citation links must become interactive with the visible citation popover');
console.log('✓ hidden citation popovers cannot steal dossier action clicks');

// ─── catalog picks: grow / precise / interesting without inventing comps ───
assert.ok(homeSrc.includes('media.length > 0'),
  'Home ticker must prefer photographed cards within each brand');
const discoverSrc = readFileSync(join(ROOT, "src/pages/Discover.tsx"), "utf8");
assert.ok(discoverSrc.includes('GRAIL_TIERS'),
  'Discover grail chip must key off identity.tier, not a scarcity cutoff that hits one card');
assert.ok(!discoverSrc.includes('SCARCITY ≥ 75') && !discoverSrc.includes('scarcity.value >= 75'),
  'Discover grail chip must not use the scarcity ≥ 75 gate');
assert.ok(discoverSrc.includes("filterVibe === 'watching'"),
  'Discover must expose today\'s market-attention watchlist as a vibe');
assert.ok(discoverSrc.includes('withPhoto'),
  'Discover roulette must prefer photographed cards when the filter has any');
const grailTiers = new Set(['crown', 'trinity', 'haute']);
const grailStories = publicData.cards.filter((c) => grailTiers.has(c.identity.tier) && c.narrative?.story).length;
assert.ok(grailStories >= 10,
  `grail pool by tier should be a real set, got ${grailStories}`);
const dossierSrc = readFileSync(join(ROOT, "src/pages/Dossier.tsx"), "utf8");
const marketplaceSrc = readFileSync(join(ROOT, "src/pages/Marketplaces.tsx"), "utf8");
assert.ok(dossierSrc.includes('/pom?watch=') && dossierSrc.includes('/marketplaces?watch='),
  'a dossier must carry its reference into both collector calculators');
assert.ok(marketplaceSrc.includes("searchParams.get('watch')") && marketplaceSrc.includes('/pom?watch='),
  'the fee lab must accept and preserve a selected reference');
assert.ok(dossierSrc.includes('(b.comp_summary?.n ?? 0) - (a.comp_summary?.n ?? 0)'),
  'Dossier related sort must parenthesize both n counts');
assert.ok(!dossierSrc.includes('b.comp_summary?.n ?? 0 - (a.comp_summary?.n ?? 0)'),
  'Dossier related sort must not use the unparenthesized n ?? 0 - n bug');
assert.ok(dossierSrc.includes('EXPLORE ON SCREEN'),
  'Dossier screen CTA must not pretend every sighting is Rolex');
assert.ok(!dossierSrc.includes('EXPLORE ROLEX ON SCREEN'),
  'Dossier screen CTA must not say Rolex on non-Rolex cards');
assert.ok(dossierSrc.includes('loadMarketTrends') && dossierSrc.includes('In public attention'),
  'Dossier evidence tab must surface today\'s attention when the card is on the watchlist');
const registerSrc = readFileSync(join(ROOT, "src/pages/Register.tsx"), "utf8");
assert.ok(registerSrc.includes("'trending'") && registerSrc.includes('WATCHING TODAY'),
  'Register must sort today\'s attention watchlist first when asked');
console.log('✓ ticker / grail / related / attention wiring holds');
