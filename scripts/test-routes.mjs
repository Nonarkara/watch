// Link integrity — fails if any internal <Link to>/PATHS target has no matching route.
// A dead nav link renders a blank page, which on a reference site reads as broken data.
import { readFileSync, readdirSync, statSync } from "node:fs";
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
assert.match(pomPageSrc, /const HORIZONS = \[1, 2, 3, 10, 20\] as const/,
  'Pom value lab must publish the five requested holding periods');
assert.ok(pomPageSrc.includes('Math.pow(1 + annualRate / 100, years)'),
  'Pom projection must use explicit annual compounding');
assert.ok(pomPageSrc.includes('computed.estimate.value'),
  'Pom value lab must distinguish a computed estimate from a user scenario');
const compoundBenchmark = 10_000 * Math.pow(1.05, 20);
assert.equal(Math.round(compoundBenchmark), 26_533,
  '20-year 5% compound benchmark must remain stable');

const publicData = JSON.parse(readFileSync(join(ROOT, "public/data.json"), "utf8"));
const publicCardIds = new Set(publicData.cards.map((card) => card.id));
const pomDossierIds = [...pomDataSrc.matchAll(/dossierId:\s*'([^']+)'/g)].map((match) => match[1]);
const deadPomDossiers = pomDossierIds.filter((id) => !publicCardIds.has(id));
assert.deepEqual(deadPomDossiers, [],
  `Pom dossier links missing from public data: ${deadPomDossiers.join(', ')}`);
console.log("✓ Pom value lab horizons, compounding, estimate gate, and dossier links hold");
