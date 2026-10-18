#!/usr/bin/env node
// build_auction_census.mjs — publish the Phillips harvest as an aggregate the
// site can render: three auctions, 675 lots, three currencies, five months.
//
// The intake queue is deliberately private: it carries raw page text, per-lot
// detail fields, and every unmatched record. That's the right shape for a
// reviewer's desk and the wrong shape for a reader. What IS publishable is the
// shape of the market itself — how much traded, where, in what currency, and
// which references we hold versus which we don't.
//
// Two numbers here do real work on the site:
//   1. catalogue_coverage — of the references that sold, how many we hold a card
//      for. This is the honest measure of how complete the register is, and it
//      is currently 7%. Publishing it is the point.
//   2. per-brand lot counts — the auction's view of which marques are actually
//      trading, which is not the same list as the marque's market cap.
//
// Run: node scripts/build_auction_census.mjs   (wired into npm run build)

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeBrand, normalizeReference } from './lib/market-harvest.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const QUEUE = JSON.parse(readFileSync(join(ROOT, 'data/market/review-queue.json'), 'utf8'));
const FX = (() => {
  try { return JSON.parse(readFileSync(join(ROOT, 'data/market/fx-converted.json'), 'utf8')); }
  catch { return { records: [] }; }
})();
const FX_BY_ID = new Map(FX.records.map((r) => [r.source_id, r]));

// The register, for coverage arithmetic.
const cardKeys = new Set();
const cardBrands = new Map();
for (const file of readdirSync(join(ROOT, 'data/cards')).filter((n) => n.endsWith('.json'))) {
  const card = JSON.parse(readFileSync(join(ROOT, 'data/cards', file), 'utf8'));
  cardKeys.add(`${normalizeBrand(card.identity.brand)}|${normalizeReference(card.identity.reference)}`);
  const bk = normalizeBrand(card.identity.brand);
  cardBrands.set(bk, (cardBrands.get(bk) ?? 0) + 1);
}

const records = QUEUE.records;
const priced = records.filter((r) => r.realized);

// USD value, converted where needed.
function usdValue(r) {
  if (r.currency === 'USD') return r.realized;
  const fx = FX_BY_ID.get(r.source_id);
  return fx ? fx.realized : null;
}

const auctions = new Map();
const brands = new Map();
let heldLots = 0;
let heldValueUsd = 0;
let totalValueUsd = 0;
let unconvertedValue = 0;
let convertedCount = 0;

for (const r of records) {
  const key = r.auction_code || r.auction_name || 'unknown';
  if (!auctions.has(key)) {
    auctions.set(key, { code: key, name: r.auction_name, venue: r.venue, date: r.sale_date, lots: 0, priced_lots: 0, value_usd: 0, currencies: new Set() });
  }
  const a = auctions.get(key);
  a.lots++;
  if (r.realized) { a.priced_lots++; a.currencies.add(r.currency); }
  if (r.currency) a.currencies.add(r.currency);

  const usd = usdValue(r);
  if (usd != null) {
    a.value_usd += usd;
    totalValueUsd += usd;
    if (r.currency !== 'USD') convertedCount++;
  }

  const bk = normalizeBrand(r.brand || '');
  if (!brands.has(bk)) {
    brands.set(bk, { brand: r.brand, brand_key: bk, lots: 0, priced_lots: 0, value_usd: 0, cards_in_register: cardBrands.get(bk) ?? 0 });
  }
  const b = brands.get(bk);
  b.lots++;
  if (r.realized) b.priced_lots++;
  if (usd != null) b.value_usd += usd;

  const identityKey = `${bk}|${normalizeReference(r.reference)}`;
  if (cardKeys.has(identityKey)) {
    heldLots++;
    if (usd != null) heldValueUsd += usd;
  }
}

for (const r of records) {
  if (r.realized && usdValue(r) == null) unconvertedValue += r.realized;
}

const census = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source: QUEUE.source,
  source_url: QUEUE.source_url,
  harvest_date: QUEUE.generated_at,
  method: `Lots parsed from ${QUEUE.source} public auction results pages. USD values for non-USD sales are converted at the European Central Bank reference rate for the last business day on or before the sale date (see data/market/fx-rates.json).`,
  limitation: 'This is the shape of three auction rooms, not the whole secondary market. Phillips selects consignments; absence from these three sales is not evidence a reference does not trade. Catalogue coverage counts only lots whose normalised brand + reference matches a card we hold exactly — near-miss references are reported separately and are not counted as covered.',
  totals: {
    auctions: auctions.size,
    lots: records.length,
    priced_lots: priced.length,
    value_usd: Math.round(totalValueUsd),
    lots_converted_from_other_currency: convertedCount,
    unconverted_lots: unconvertedValue > 0 ? 1 : 0,
    brands_seen: brands.size,
    brands_in_register: [...cardBrands.keys()].length,
  },
  coverage: {
    lots_matching_a_card: heldLots,
    lots_matching_a_card_pct: records.length ? +(100 * heldLots / records.length).toFixed(1) : 0,
    value_matching_a_card_usd: Math.round(heldValueUsd),
    value_matching_a_card_pct: totalValueUsd ? +(100 * heldValueUsd / totalValueUsd).toFixed(1) : 0,
    note: 'Exact brand + reference match only. The fuzzy matcher finds a further set of near-miss references; those are real sales of a neighbouring reference and are deliberately not counted here.',
  },
  auctions: [...auctions.values()]
    .map((a) => ({ ...a, currencies: [...a.currencies].filter(Boolean).sort() }))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
  brands: [...brands.values()]
    .map((b) => ({ ...b, value_usd: Math.round(b.value_usd) }))
    .sort((a, b) => b.value_usd - a.value_usd),
};

writeFileSync(join(ROOT, 'public/data/auction_census.json'), JSON.stringify(census, null, 2) + '\n');

console.log(`✓ auction census → public/data/auction_census.json`);
console.log(`  ${census.totals.auctions} auctions · ${census.totals.lots} lots · $${(census.totals.value_usd / 1e6).toFixed(1)}M`);
console.log(`  catalogue coverage: ${census.coverage.lots_matching_a_card}/${census.totals.lots} lots (${census.coverage.lots_matching_a_card_pct}%)`);
console.log(`  ${census.totals.lots_converted_from_other_currency} lots converted from HKD/CHF at ECB rates`);