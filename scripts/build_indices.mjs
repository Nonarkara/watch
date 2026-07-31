// Build: data/cards/*.json + data/shared/* → public/data.json (masked publish).
// Full comps stay internal; the public gets gauges + comp_summary + ≤5 cited notable sales.
// BUILD_DATE env pins the date for deterministic builds (tests); defaults to today.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { computeAll, isComparable } from "./lib/indices.mjs";
import { validateCard } from "./validate_card.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const buildDate = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

const shared = {
  cpi: JSON.parse(readFileSync(join(ROOT, "data/shared/cpi_snapshot.json"), "utf8")),
  brand_production: JSON.parse(readFileSync(join(ROOT, "data/shared/brand_production.json"), "utf8")),
};

const cardDir = join(ROOT, "data/cards");
const files = readdirSync(cardDir).filter((f) => f.endsWith(".json")).sort();
let failed = 0;
const published = [];

for (const f of files) {
  const card = JSON.parse(readFileSync(join(cardDir, f), "utf8"));
  const errs = validateCard(card, { id: f.replace(/\.json$/, ""), buildDate });
  if (errs.length) { failed++; console.error(`✗ ${f}\n  - ${errs.join("\n  - ")}`); continue; }

  const computed = computeAll(card, shared, buildDate);
  const comps = card.market_evidence.comps.filter(isComparable);
  const notable = [...comps].sort((a, b) => b.price_usd - a.price_usd).slice(0, 5)
    .map(({ date, price_usd, venue, url, box_papers }) => ({ date, price_usd, venue, url, box_papers: box_papers ?? null }));
  // Real, cited sales of a different configuration — shown, never averaged.
  const variants = card.market_evidence.comps.filter((c) => !isComparable(c))
    .sort((a, b) => b.price_usd - a.price_usd)
    .map(({ date, price_usd, venue, url, condition }) => ({ date, price_usd, venue, url, condition }));

  published.push({
    id: card.id,
    identity: card.identity,
    retail: card.retail,
    scarcity_public: {
      limited_edition: card.scarcity_inputs.limited_edition,
      discontinued: card.identity.produced.discontinued,
      waitlist_evidence_n: (card.scarcity_inputs.waitlist_evidence || []).length,
    },
    provenance_events: card.provenance_events,
    narrative: card.narrative,
    comp_summary: comps.length ? {
      n: comps.length,
      venues: [...new Set(comps.map((c) => c.venue))].sort(),
      date_range: [comps.map((c) => c.date).sort()[0], comps.map((c) => c.date).sort().at(-1)],
    } : null,
    notable_sales: notable,
    variant_sales: variants,
    computed,
    meta: { ...card.meta, build_date: buildDate },
  });
}

if (failed) { console.error(`\n${failed} card(s) failed validation — build refused.`); process.exit(1); }

published.sort((a, b) => a.id.localeCompare(b.id));
const out = {
  built: buildDate,
  count: published.length,
  methodology_version: 1,
  cards: published,
};
writeFileSync(join(ROOT, "public/data.json"), JSON.stringify(out));
console.log(`✓ ${published.length} cards → public/data.json (build ${buildDate})`);
