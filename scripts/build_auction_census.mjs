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
import { normalizeBrand, normalizeReference, normalizeModelName } from './lib/market-harvest.mjs';
import { matchingConvertedUsd } from './lib/market-intake.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const QUEUE = JSON.parse(readFileSync(join(ROOT, 'data/market/review-queue.json'), 'utf8'));
const FX = (() => {
  try { return JSON.parse(readFileSync(join(ROOT, 'data/market/fx-converted.json'), 'utf8')); }
  catch { return { records: [] }; }
})();
const FX_BY_ID = new Map(FX.records.map((r) => [r.source_id, r]));

// The register, for coverage arithmetic.
// Two exact-identity channels, because the market publishes identity two ways:
//
//   1. brand + reference   — Rolex, Patek, AP, Cartier publish a ref number.
//   2. brand + model name  — Voutilainen, F.P. Journe, Louis Richard, Akrivia and
//                            most of the independent tier publish NO ref at all;
//                            they publish a model name. Brand + model name is
//                            still an exact identity, so it counts as coverage.
//
// Channel 2 is OPT-IN, per card. A card only joins the model-name index by
// declaring `identity.published_model_name`: the string the maker or the auction
// house actually prints as the model name for that watch. It is deliberately NOT
// inferred from `identity.name`, because a display name is often a family name —
// "Day-Date" is Rolex's line, not a model, and matching every Day-Date lot to
// one card would be a near-miss dressed up as an identity.
//
// Neither channel is a near-miss. A fuzzy or FX lot still counts for nothing
// here; those live in the separate variant-sales channel and never move this
// number.
const cardRefKeys = new Set();
const cardModelKeys = new Set();
const cardBrands = new Map();
let cardsOptedIntoModelNames = 0;
for (const file of readdirSync(join(ROOT, 'data/cards')).filter((n) => n.endsWith('.json'))) {
  const card = JSON.parse(readFileSync(join(ROOT, 'data/cards', file), 'utf8'));
  const bk = normalizeBrand(card.identity.brand);
  cardRefKeys.add(`${bk}|${normalizeReference(card.identity.reference)}`);
  const pmn = card.identity.published_model_name;
  if (typeof pmn === 'string' && pmn.trim()) {
    cardModelKeys.add(`${bk}|${normalizeModelName(pmn)}`);
    cardsOptedIntoModelNames++;
  }
  cardBrands.set(bk, (cardBrands.get(bk) ?? 0) + 1);
}

const records = QUEUE.records;
const priced = records.filter((r) => r.realized);

// USD value, converted where needed.
function usdValue(r) {
  if (r.currency === 'USD') return r.realized;
  return matchingConvertedUsd(r, FX_BY_ID.get(r.source_id));
}

const auctions = new Map();
const brands = new Map();
let heldLots = 0;
let heldValueUsd = 0;
let heldByRefLots = 0;
let heldByRefValueUsd = 0;
let heldByModelLots = 0;
let heldByModelValueUsd = 0;
let unnamedLots = 0;
let unnamedValueUsd = 0;
let totalValueUsd = 0;
let unconvertedLots = 0;
let convertedCount = 0;
let openingDateFxCount = 0;

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
    if (r.currency !== 'USD') {
      convertedCount++;
      if (FX_BY_ID.get(r.source_id)?.fx_conversion?.date_basis !== 'verified_sale_date') openingDateFxCount++;
    }
  }

  const bk = normalizeBrand(r.brand || '');
  if (!brands.has(bk)) {
    brands.set(bk, { brand: r.brand, brand_key: bk, lots: 0, priced_lots: 0, value_usd: 0, cards_in_register: cardBrands.get(bk) ?? 0 });
  }
  const b = brands.get(bk);
  b.lots++;
  if (r.realized) b.priced_lots++;
  if (usd != null) b.value_usd += usd;

  // Identity channel 1: a published reference number. Channel 2: a published
  // model name, tried ONLY when the lot published no reference at all — so a lot
  // that carries a ref is never rescued by a coincidental model-name hit.
  const refKey = `${bk}|${normalizeReference(r.reference)}`;
  const modelKey = `${bk}|${normalizeModelName(r.model)}`;
  const byRef = cardRefKeys.has(refKey);
  const byModel = !byRef && !r.reference_key && cardModelKeys.has(modelKey);

  if (byRef || byModel) {
    heldLots++;
    if (usd != null) heldValueUsd += usd;
    if (byRef) {
      heldByRefLots++;
      if (usd != null) heldByRefValueUsd += usd;
    } else {
      heldByModelLots++;
      if (usd != null) heldByModelValueUsd += usd;
    }
  } else if (!r.reference_key && !r.model) {
    // The maker published neither a reference nor a model name. There is
    // nothing to match against and we say so rather than guessing.
    unnamedLots++;
    if (usd != null) unnamedValueUsd += usd;
  }
}

for (const r of records) {
  if (r.realized && usdValue(r) == null) unconvertedLots++;
}

const census = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source: QUEUE.source,
  source_url: QUEUE.source_url,
  harvest_date: QUEUE.generated_at,
  method: 'Phillips “Sold For” results as published, not hammer-only prices. Non-USD results use the last available European Central Bank rate on or before the conversion reference date. Legacy conversions use the auction opening date, not a verified lot date (see data/market/fx-rates.json).',
  limitation: 'This is the shape of three auction rooms, not the whole secondary market. Phillips selects consignments; absence from these three sales is not evidence a reference does not trade. Catalogue coverage counts only lots whose normalised brand plus published identity matches a card we hold exactly. "Published identity" is either a reference number or a model name — the haute-horlogerie tier publishes no reference numbers at all, so a model name is an exact identity too. Near-miss references are reported separately and are never counted as covered.',
  totals: {
    auctions: auctions.size,
    lots: records.length,
    priced_lots: priced.length,
    value_usd: Math.round(totalValueUsd),
    lots_converted_from_other_currency: convertedCount,
    lots_converted_at_auction_start: openingDateFxCount,
    unconverted_lots: unconvertedLots,
    brands_seen: brands.size,
    brands_in_register: [...cardBrands.keys()].length,
    lots_with_no_published_reference: records.filter((r) => !r.reference_key).length,
    lots_publishing_neither_reference_nor_model: unnamedLots,
    value_with_no_published_reference_usd: Math.round(
      records.filter((r) => !r.reference_key).reduce((n, r) => n + (usdValue(r) ?? 0), 0)),
    value_publishing_neither_reference_nor_model_usd: Math.round(unnamedValueUsd),
  },
  coverage: {
    lots_matching_a_card: heldLots,
    lots_matching_a_card_pct: records.length ? +(100 * heldLots / records.length).toFixed(1) : 0,
    value_matching_a_card_usd: Math.round(heldValueUsd),
    value_matching_a_card_pct: totalValueUsd ? +(100 * heldValueUsd / totalValueUsd).toFixed(1) : 0,
    by_reference: {
      lots: heldByRefLots,
      value_usd: Math.round(heldByRefValueUsd),
      value_pct: totalValueUsd ? +(100 * heldByRefValueUsd / totalValueUsd).toFixed(1) : 0,
      meaning: 'Brand + published reference number matched a card. The traditional channel, and the only one that worked for most of the register until this build.',
    },
    by_model_name: {
      lots: heldByModelLots,
      value_usd: Math.round(heldByModelValueUsd),
      value_pct: totalValueUsd ? +(100 * heldByModelValueUsd / totalValueUsd).toFixed(1) : 0,
      cards_in_channel: cardsOptedIntoModelNames,
      meaning: 'Brand + published model name matched a card, used only where the lot published no reference number. A card opts into this channel by declaring identity.published_model_name — the string the maker or auction house actually prints. It is never inferred from the display name, because a display name is often a family name ("Day-Date" is a Rolex line, not a model). Voutilainen, F.P. Journe, Louis Richard, Akrivia and most of the independent tier identify their watches by name rather than by ref, so without this channel the coverage figure could not see them at all.',
    },
    note: 'Both channels are exact identity matches, never near-misses. The fuzzy matcher finds a further set of near-miss references and the FX matcher converts other currencies; those two sets are real sales of neighbouring references and are deliberately not counted here.',
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
console.log(`    by reference number: ${census.coverage.by_reference.lots} lots · by model name: ${census.coverage.by_model_name.lots} lots`);
console.log(`    ${census.totals.lots_with_no_published_reference}/${census.totals.lots} lots publish no reference number at all`);
console.log(`  ${census.totals.lots_converted_from_other_currency} lots converted from HKD/CHF at ECB rates`);
