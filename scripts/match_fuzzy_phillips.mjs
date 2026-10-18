#!/usr/bin/env node
// match_fuzzy_phillips.mjs — try to map Phillips records that failed the exact
// reference gate to the closest card in the register, by brand + reference
// similarity. The strict gate (the `byIdentity` Map in market-harvest.mjs) only
// matches when normalized brand AND normalized reference are identical. That
// correctly refuses records for watches we don't catalogue, but it also
// refuses records for close-but-not-identical references we *do* have — and
// we have ~6 Lange and 10 AP cards, so Phillips's 25 Lange and 47 AP
// records mostly fail for a notational mismatch (101.035 vs 101.025, etc).
//
// This script reports the potential lift from a relaxed matcher:
//   - exact       (already passing the strict gate — control)
//   - ref_prefix  (first 5+ chars of ref match)
//   - ref_substring (one ref contains the other, both ≥ 5 chars)
//
// Levenshtein and model-keyword family matching are deliberately NOT used —
// both produced false positives in the first pass (Lange 302.025 → 101.025 are
// two different Lange 1 references; Patek 5980/60G → 3700/1A are two different
// Nautilus generations).
//
// Input: the quarantined records in review-queue.json, PLUS any records that
// fx_convert_market.mjs normalised from HKD/CHF to USD. The converted lots
// carry an fx_conversion block so downstream code can label them honestly.
//
// Run:  node scripts/match_fuzzy_phillips.mjs
//       node scripts/match_fuzzy_phillips.mjs --write   # writes the matches
//       to data/market/fuzzy-matches.json (for downstream promotion)

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  normalizeBrand,
  normalizeReference,
} from './lib/market-harvest.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const QUEUE = JSON.parse(readFileSync(join(ROOT, 'data/market/review-queue.json'), 'utf8'));
const FX_FILE = join(ROOT, 'data/market/fx-converted.json');
const WRITE = process.argv.includes('--write');

// The FX-normalised lots, if the converter has been run. They arrive in USD with
// an fx_conversion block; the native USD lots arrive without one.
const FX = existsSync(FX_FILE) ? JSON.parse(readFileSync(FX_FILE, 'utf8')) : { records: [] };
const FX_BY_ID = new Map(FX.records.map((r) => [r.source_id, r]));

function loadCards() {
  const cards = [];
  for (const file of readdirSync(join(ROOT, 'data/cards')).filter((n) => n.endsWith('.json'))) {
    const card = JSON.parse(readFileSync(join(ROOT, 'data/cards', file), 'utf8'));
    cards.push({
      id: card.id,
      brand: card.identity.brand,
      brand_key: normalizeBrand(card.identity.brand),
      reference: card.identity.reference,
      reference_key: normalizeReference(card.identity.reference),
      name: card.identity.name,
      collection: card.identity.collection ?? null,
    });
  }
  return cards;
}

const cards = loadCards();
const byBrand = new Map();
for (const c of cards) {
  if (!byBrand.has(c.brand_key)) byBrand.set(c.brand_key, []);
  byBrand.get(c.brand_key).push(c);
}

// ─── ref similarity ────────────────────────────────────────────────────────
// A lot is promotable only when its normalised reference shares an explicit
// 5+ character prefix with a card we hold, or when one reference string
// contains the other. Nothing looser.
function refCore(ref) {
  return (ref || '').toUpperCase()
    .replace(/^REF\.?\s*/i, '')
    .replace(/[-/.\s]/g, '')
    .replace(/(ST|BA|BC|GR|GG|BG|PT|TT|PD|CH|BK|RD|MK|STI|NA)$/i, '')
    .replace(/(B[12]?)$/i, '')
    .trim();
}

function fuzzyMatch(lot) {
  const brandKey = normalizeBrand(lot.brand);
  const candidates = byBrand.get(brandKey) ?? [];
  if (!candidates.length) return null;

  // 1) exact reference match (control — the strict gate already passes these)
  const exact = candidates.find((c) => c.reference_key === lot.reference_key);
  if (exact) return { card: exact, level: 'exact', score: 1, reason: 'normalized reference identical' };

  // 2) ref_prefix — same model family, explicit shared prefix
  if (lot.reference_key && lot.reference_key.length >= 5) {
    const prefix = lot.reference_key.slice(0, 5);
    for (const c of candidates) {
      if (c.reference_key && c.reference_key.startsWith(prefix)) {
        return { card: c, level: 'ref_prefix', score: 0.8, reason: `ref shares 5-char prefix ${prefix} (${lot.reference} vs ${c.reference})` };
      }
    }
  }

  // 3) ref_substring — one contains the other, both ≥ 5 chars
  if (lot.reference_key && lot.reference_key.length >= 5) {
    for (const c of candidates) {
      if (!c.reference_key || c.reference_key.length < 5) continue;
      if (lot.reference_key.includes(c.reference_key) || c.reference_key.includes(lot.reference_key)) {
        return { card: c, level: 'ref_substring', score: 0.7, reason: `ref substring (${lot.reference} vs ${c.reference})` };
      }
    }
  }

  // Deliberately no Levenshtein, no model-keyword family match. Both produced
  // false positives: different references in the same family, different
  // generations of the same model. Refs that don't share an explicit prefix
  // stay in the quarantine queue for a human.
  return null;
}

const quarantined = QUEUE.records.filter((r) => (r.reasons ?? []).includes('no_exact_card'));
const matches = [];
const levels = { exact: 0, ref_prefix: 0, ref_substring: 0, none: 0 };
const perCard = new Map();
const unmatchedSamples = [];
let fxPromoted = 0;
let nativeUsdPromoted = 0;

for (const lot of quarantined) {
  // Prefer the FX-normalised copy when one exists: it carries the USD price
  // plus the provenance block that lets the dossier label the conversion.
  const fxLot = FX_BY_ID.get(lot.source_id);
  const work = fxLot ? { ...lot, ...fxLot } : lot;
  if (!work.realized || work.currency !== 'USD') {
    levels.none++;
    if (unmatchedSamples.length < 12) unmatchedSamples.push(`${lot.brand} · ${lot.reference} (${lot.currency || 'no currency'})`);
    continue;
  }
  const m = fuzzyMatch(work);
  if (!m) {
    levels.none++;
    if (unmatchedSamples.length < 12) unmatchedSamples.push(`${lot.brand} · ${lot.reference} (no card match)`);
    continue;
  }
  levels[m.level]++;
  perCard.set(m.card.id, (perCard.get(m.card.id) ?? 0) + 1);
  if (fxLot) fxPromoted++; else nativeUsdPromoted++;
  matches.push({
    source_id: lot.source_id,
    card_id: m.card.id,
    sale_date: work.sale_date,
    auction_name: work.auction_name,
    lot_number: work.lot_number,
    realized: work.realized,
    currency: 'USD',
    realized_display: work.realized_display,
    source_url: work.source_url,
    harvested_brand: work.brand,
    harvested_reference: work.reference,
    harvested_model: work.model,
    match_level: m.level,
    match_score: m.score,
    match_reason: m.reason,
    ...(work.fx_conversion ? { fx_conversion: work.fx_conversion, original_realized: work.original_realized, original_currency: work.original_currency, original_display: work.original_display } : {}),
  });
}

console.log('=== FUZZY MATCH RESULTS ===');
console.log(`quarantined Phillips records: ${quarantined.length}`);
console.log(`FX-normalised lots available: ${FX.records.length}`);
console.log('matched at level:');
for (const [l, n] of Object.entries(levels)) {
  console.log(`  ${l.padEnd(14)} ${n}`);
}
const total = Object.values(levels).reduce((a, b) => a + b, 0);
const matched = total - levels.none;
console.log();
console.log(`matched ${matched} of ${total} (${(100 * matched / total).toFixed(1)}%)`);
console.log(`  from native USD lots: ${nativeUsdPromoted}`);
console.log(`  from FX-normalised lots: ${fxPromoted}`);
console.log(`cards that would receive new comps: ${perCard.size}`);
console.log();
console.log('=== TOP 15 CARDS BY NEW COMPS ===');
const topCards = [...perCard.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [cid, n] of topCards) {
  const card = cards.find((c) => c.id === cid);
  console.log(`  ${n.toString().padStart(3)} new comps → ${cid} (${card?.brand} ${card?.reference} ${card?.name})`);
}
console.log();
console.log('=== SAMPLE UNMATCHED ===');
for (const s of unmatchedSamples) console.log(`  ${s}`);

if (WRITE) {
  const out = join(ROOT, 'data/market/fuzzy-matches.json');
  writeFileSync(out, JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: {
      quarantined: quarantined.length,
      matched,
      unmatched: levels.none,
      levels,
      cards_with_new_comps: perCard.size,
      native_usd_promoted: nativeUsdPromoted,
      fx_promoted: fxPromoted,
    },
    matches,
  }, null, 2) + '\n');
  console.log();
  console.log(`wrote ${out}`);
}
