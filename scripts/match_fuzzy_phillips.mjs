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
//   - exact     (already passing the strict gate — control)
//   - ref_prefix (first 5+ chars of ref match)
//   - ref_close  (Levenshtein ≤ 2, or all ref digits present in card ref)
//   - family     (same brand, no ref overlap)
//
// Run:  node scripts/match_fuzzy_phillips.mjs
//       node scripts/match_fuzzy_phillips.mjs --write   # writes the matches
//       to scripts/lib/market-fuzzy-matches.json (for downstream promotion)

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  normalizeBrand,
  normalizeReference,
} from './lib/market-harvest.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const QUEUE = JSON.parse(readFileSync(join(ROOT, 'data/market/review-queue.json'), 'utf8'));
const WRITE = process.argv.includes('--write');

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

// Levenshtein distance, capped at 5 to keep it cheap on the hot path.
function levenshtein(a, b, cap = 5) {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = i;
    let curr = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = a[i - 1] === b[j - 1] ? prev[j - 1] : Math.min(prev[j - 1], prev[j], curr - 1) + 1;
      prev[j - 1] = curr;
      curr = tmp;
      if (curr < rowMin) rowMin = curr;
    }
    prev[b.length] = curr;
    if (rowMin > cap) return cap + 1;
  }
  return prev[b.length];
}

// "How close are these two ref strings, accounting for variant suffixes?"
// - Strip case, punctuation, and material suffixes (ST, BA, BC, NB, Ti, …)
// - Strip variant prefixes ("Ref.")
// - Return a score 0–1, where 1 is identical core ref.
function refCore(ref) {
  return (ref || '').toUpperCase()
    .replace(/^REF\.?\s*/i, '')
    .replace(/[-/.\s]/g, '')
    // strip common material / case / dial variants that Phillips always appends
    .replace(/(ST|BA|BC|GR|GG|BG|PT|TT|PD|CH|BK|RD|MK|STI|NA)$/i, '')
    .replace(/(B[12]?)$/i, '')
    .trim();
}

function refMatchScore(harvestRef, cardRef) {
  if (!harvestRef || !cardRef) return 0;
  const h = refCore(harvestRef);
  const c = refCore(cardRef);
  if (h === c && h.length >= 3) return 1;       // exact core ref
  // One is a prefix of the other (Lange 101.035 vs 101.025 — same 101)
  if (h.length >= 3 && c.length >= 3 && (h.startsWith(c) || c.startsWith(h))) return 0.8;
  // All digits of the shorter are contained in the longer
  if (h.length >= 4 && c.length >= 4) {
    const short = h.length <= c.length ? h : c;
    const long = h.length <= c.length ? c : h;
    if (long.includes(short)) return 0.7;
  }
  // Levenshtein ≤ 2 on the core ref
  const d = levenshtein(h, c, 3);
  if (d <= 2) return 0.6;
  return 0;
}

function fuzzyMatch(lot) {
  const brandKey = normalizeBrand(lot.brand);
  const candidates = byBrand.get(brandKey) ?? [];
  if (!candidates.length) return null;

  // 1) exact reference match (already handled by the strict gate; keep for control)
  const exact = candidates.find((c) => c.reference_key === lot.reference_key);
  if (exact) return { card: exact, level: 'exact', score: 1, reason: 'normalized reference identical' };

  // 2) ref_prefix: the harvested ref starts with the same 5+ chars as the card ref.
  //    Highest-confidence non-exact: the same model family.
  //    Examples: Lange 101.035 → 101.025 (Lange 1), Patek 5711/1A-018 → 5711/1A-001.
  if (lot.reference_key && lot.reference_key.length >= 5) {
    const prefix = lot.reference_key.slice(0, 5);
    for (const c of candidates) {
      if (c.reference_key && c.reference_key.startsWith(prefix)) {
        return { card: c, level: 'ref_prefix', score: 0.8, reason: `ref shares 5-char prefix ${prefix} (${lot.reference} vs ${c.reference})` };
      }
    }
  }

  // 3) ref_substring: one ref contains the other, both at least 5 chars.
  //    The harvested ref (longer) contains the card ref, or vice versa.
  if (lot.reference_key && lot.reference_key.length >= 5) {
    for (const c of candidates) {
      if (!c.reference_key || c.reference_key.length < 5) continue;
      if (lot.reference_key.includes(c.reference_key) || c.reference_key.includes(lot.reference_key)) {
        return { card: c, level: 'ref_substring', score: 0.7, reason: `ref substring (${lot.reference} vs ${c.reference})` };
      }
    }
  }

  // We intentionally do NOT match on Levenshtein or family/model keywords.
  // Empirically those produce false positives (Lange 302.025 → 101.025 is two
  // different Lange 1 references; Patek 5980/60G → 3700/1A is two different
  // Nautilus generations). The harvest conservatively admits only refs that
  // share an explicit prefix; the rest stay in the quarantine queue for a
  // human reviewer.
  return null;
}

const quarantined = QUEUE.records.filter((r) => (r.reasons ?? []).includes('no_exact_card'));
const matches = [];
const levels = { exact: 0, ref_prefix: 0, ref_substring: 0, ref_close: 0, family: 0, none: 0 };
const perCard = new Map();
const unmatchedSamples = [];

for (const lot of quarantined) {
  if (lot.currency !== 'USD' || !lot.realized) {
    levels.none++;
    unmatchedSamples.push(`${lot.brand} · ${lot.reference} (${lot.currency || 'no currency'})`);
    continue;
  }
  const m = fuzzyMatch(lot);
  if (!m) {
    levels.none++;
    if (unmatchedSamples.length < 12) unmatchedSamples.push(`${lot.brand} · ${lot.reference} (no card match)`);
    continue;
  }
  levels[m.level]++;
  perCard.set(m.card.id, (perCard.get(m.card.id) ?? 0) + 1);
  matches.push({
    source_id: lot.source_id,
    card_id: m.card.id,
    sale_date: lot.sale_date,
    auction_name: lot.auction_name,
    lot_number: lot.lot_number,
    realized: lot.realized,
    currency: lot.currency,
    realized_display: lot.realized_display,
    source_url: lot.source_url,
    harvested_brand: lot.brand,
    harvested_reference: lot.reference,
    harvested_model: lot.model,
    match_level: m.level,
    match_score: m.score,
    match_reason: m.reason,
  });
}

console.log('=== FUZZY MATCH RESULTS ===');
console.log(`quarantined Phillips records: ${quarantined.length}`);
console.log('matched at level:');
for (const [l, n] of Object.entries(levels)) {
  console.log(`  ${l.padEnd(14)} ${n}`);
}
const total = Object.values(levels).reduce((a, b) => a + b, 0);
const matched = total - levels.none;
console.log();
console.log(`matched ${matched} of ${total} (${(100 * matched / total).toFixed(1)}%)`);
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
    },
    matches,
  }, null, 2) + '\n');
  console.log();
  console.log(`wrote ${out}`);
}
