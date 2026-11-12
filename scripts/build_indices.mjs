// Build: data/cards/*.json + data/shared/* → public/data.json (masked publish).
// Full comps stay internal; the public gets gauges + comp_summary + ≤5 cited notable sales.
// BUILD_DATE env pins the date for deterministic builds (tests); defaults to today.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { computeAll, isComparable } from "./lib/indices.mjs";
import { validateCard } from "./validate_card.mjs";
import { isExcludedPortrait } from "./lib/portrait-evidence.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const buildDate = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
const intake = JSON.parse(readFileSync(join(ROOT, "data/market/review-queue.json"), "utf8"));
const openingDates = new Set(intake.records
  .filter(record => record.sale_date && record.sale_date_basis !== 'single_day_auction')
  .map(record => `${record.source_url}|${record.sale_date}`));

const shared = {
  cpi: JSON.parse(readFileSync(join(ROOT, "data/shared/cpi_snapshot.json"), "utf8")),
  brand_production: JSON.parse(readFileSync(join(ROOT, "data/shared/brand_production.json"), "utf8")),
  brand_tiers: JSON.parse(readFileSync(join(ROOT, "data/shared/brand_tiers.json"), "utf8")),
  rolex_catalog: JSON.parse(readFileSync(join(ROOT, "data/shared/rolex_catalog.json"), "utf8")),
  // Canonical screen-data source — single file, single source of truth.
  // Contains Rolex Watch-ID sightings (31) + iconic film stills (14), 45 total.
  screen_sightings: JSON.parse(readFileSync(join(ROOT, "data/shared/screen_sightings.json"), "utf8")),
  // Hand-curated, licence-checked photography. Optional: absent means every card
  // falls back to the catalogue, and a card with neither simply shows no image.
  images: existsSync(join(ROOT, "data/shared/images.json"))
    ? JSON.parse(readFileSync(join(ROOT, "data/shared/images.json"), "utf8"))
    : {},
  // Named third-party index figures and structural facts. Context layer only —
  // published verbatim with attribution, never fed to the estimator.
  market_context: JSON.parse(readFileSync(join(ROOT, "data/shared/market_context.json"), "utf8")),
};

function brandContext(brand) {
  for (const [tier, data] of Object.entries(shared.brand_tiers.tiers)) {
    if (data.brands.includes(brand)) return {
      tier: Number(tier), label: data.label, source_url: shared.brand_tiers.source_url,
      limitation: shared.brand_tiers.limitation,
    };
  }
  return { tier: null, label: null, source_url: shared.brand_tiers.source_url,
    limitation: "This brand is not classified in the cited editorial tier framework." };
}

function mediaFor(card) {
  // A curated, licence-verified photograph wins over a catalogue match: it is the
  // image we can actually attribute.
  const curated = shared.images[card.id];
  if (curated?.file && !isExcludedPortrait(curated.file, curated.source_url)) {
    return [{
      type: "image", url: curated.file, source_url: curated.source_url,
      credit: curated.credit, license: curated.license ?? null,
      rights_status: "licensed", caption: curated.caption ?? null,
      match: curated.caption ? "reference_family" : "exact_reference",
    }];
  }
  // The scraped catalogue's own rights field says "reuse license not asserted", and its
  // images live on a third party's CDN. Publishing those would mean hotlinking pictures we
  // hold no licence to — on a site whose whole argument is that provenance is checkable.
  // The catalogue stays for its reference data; it is not an image source. Flip this gate
  // only for records that carry a real, asserted licence.
  return shared.rolex_catalog.records
    .filter((record) => record.brand === card.identity.brand
      && record.reference === card.identity.reference.toUpperCase()
      && record.image_license_asserted === true
      && !isExcludedPortrait(record.image_url, record.source_url))
    .slice(0, 3)
    .map((record) => ({
      type: "image", url: record.image_url, source_url: record.source_url,
      credit: record.image_credit, rights_status: record.rights_status,
      configuration_reference: record.configuration_reference,
      match: "reference_family",
    }));
}

const cardDir = join(ROOT, "data/cards");
const files = readdirSync(cardDir).filter((f) => f.endsWith(".json")).sort();
const identityFiles = new Map();
for (const f of files) {
  const card = JSON.parse(readFileSync(join(cardDir, f), "utf8"));
  const key = `${card.identity.brand}|${card.identity.reference}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
  if (identityFiles.has(key)) {
    console.error(`✗ Duplicate watch identity: ${card.identity.brand} ${card.identity.reference}\n  - ${identityFiles.get(key)}\n  - ${f}`);
    process.exit(1);
  }
  identityFiles.set(key, f);
}
let failed = 0;
const published = [];
const comparableSaleOwners = new Map();

for (const f of files) {
  const card = JSON.parse(readFileSync(join(cardDir, f), "utf8"));
  const errs = validateCard(card, { id: f.replace(/\.json$/, ""), buildDate, comparableSaleOwners });
  if (errs.length) { failed++; console.error(`✗ ${f}\n  - ${errs.join("\n  - ")}`); continue; }

  const computed = computeAll(card, shared, buildDate);
  const comps = card.market_evidence.comps.filter(isComparable);
  const notable = [...comps].sort((a, b) => b.price_usd - a.price_usd).slice(0, 5)
    .map(({ date, price_usd, venue, url, box_papers }) => ({ date, price_usd, venue, url, box_papers: box_papers ?? null }));
  // Real, cited sales of a different configuration — shown, never averaged.
  // The native result and the FX date basis travel together. Legacy fuzzy
  // matches inherited the auction opening date, not the verified lot date.
  const variants = card.market_evidence.comps.filter((c) => !isComparable(c))
    .sort((a, b) => b.price_usd - a.price_usd)
    .map(({ date, price_usd, venue, url, condition, fx_conversion, fuzzy_match, date_source_url }) => {
      const date_basis = date_source_url ? 'lot_date'
        : fuzzy_match || openingDates.has(`${url}|${date}`) ? 'auction_start' : 'unverified';
      const suffix = fx_conversion ? ` · hammer ${fx_conversion.original_display} in ${fx_conversion.original_currency}` : '';
      const conversion = fx_conversion && {
        ...fx_conversion,
        date_basis: fx_conversion.date_basis ?? (fuzzy_match ? 'auction_start' : 'unverified'),
      };
      if (conversion?.date_basis === 'auction_start') {
        conversion.reference_date ??= date;
        conversion.note = 'Published sale result converted at the last available ECB rate on or before the auction opening date.';
      } else if (conversion?.date_basis === 'unverified') {
        conversion.note = 'The rate date is recorded; the date used to choose that rate was not verified.';
      }
      return {
        date, date_basis, price_usd, venue, url,
        condition: suffix && condition.endsWith(suffix) ? condition.slice(0, -suffix.length) : condition,
        ...(conversion ? { fx_conversion: conversion } : {}),
      };
    });

  published.push({
    id: card.id,
    identity: card.identity,
    brand_context: brandContext(card.identity.brand),
    media: mediaFor(card),
    retail: card.retail,
    scarcity_public: {
      limited_edition: card.scarcity_inputs.limited_edition,
      discontinued: card.identity.produced.discontinued,
      waitlist_evidence_n: (card.scarcity_inputs.waitlist_evidence || []).length,
    },
    provenance_events: card.provenance_events,
    screen_events: shared.screen_sightings.sightings.filter((event) =>
      event.match_level === "exact_reference" && event.matched_card_ids.includes(card.id)),
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
  market_context: shared.market_context,
  methodology_version: 2,
  cards: published,
};
writeFileSync(join(ROOT, "public/data.json"), JSON.stringify(out));
console.log(`✓ ${published.length} cards → public/data.json (build ${buildDate})`);

// Mirror the collector fetch-state (if it exists) so the /data page can show
// upstream source freshness. Collectors write to data/.state/fetch-state.json,
// which is gitignored — we copy it into the public bundle so the page
// actually has something to read at runtime.
try {
  const state = JSON.parse(readFileSync(join(ROOT, "data/.state/fetch-state.json"), "utf8"));
  writeFileSync(join(ROOT, "public/data/fetch-state.json"), JSON.stringify(state, null, 2));
} catch {
  // No local fetch state (fresh clone, other machine). Keep the committed copy
  // instead of blanking it, so a clean-clone build doesn't erase the /data
  // page's source freshness. Only write {} when there is nothing at all.
  if (!existsSync(join(ROOT, "public/data/fetch-state.json"))) {
    writeFileSync(join(ROOT, "public/data/fetch-state.json"), "{}");
  }
}
