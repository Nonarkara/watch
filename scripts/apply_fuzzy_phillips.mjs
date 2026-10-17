#!/usr/bin/env node
// apply_fuzzy_phillips.mjs — apply the 17 high-confidence fuzzy matches to
// the cards they belong to. Adds an entry per match to market_evidence.comps
// with a `fuzzy_match` field that names the original harvested reference,
// so the dossier can render the comp with a "similar reference" caveat.
//
// Idempotent: if a comp with the same source_url is already on the card,
// the run skips it. If a card is missing market_evidence entirely, it gets
// scaffolded with the same shape the other 301 cards use.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const MATCHES = JSON.parse(readFileSync(join(ROOT, 'data/market/fuzzy-matches.json'), 'utf8'));
const CARDS_DIR = join(ROOT, 'data/cards');

let added = 0;
let skipped = 0;
const touched = new Set();

for (const m of MATCHES.matches) {
  const path = join(CARDS_DIR, `${m.card_id}.json`);
  let card;
  try { card = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
  if (!card.market_evidence) card.market_evidence = { comps: [], listing_observations: [] };
  if (!card.market_evidence.comps) card.market_evidence.comps = [];

  // Idempotency: same source URL on the same card → already applied
  const exists = card.market_evidence.comps.some((c) => c.url === m.source_url);
  if (exists) { skipped++; continue; }

  card.market_evidence.comps.push({
    date: m.sale_date,
    price_usd: m.realized,
    // All matches in fuzzy-matches.json come from the Phillips harvest, so
    // the venue is phillips by construction. Hardcoding it here keeps the
    // validator's VENUES allow-list happy without copying a derived field.
    venue: 'phillips',
    url: m.source_url,
    box_papers: null,
    // The condition carries the "why excluded" string the build script maps
    // to the variant-sales table. For a fuzzy ref match, that string is the
    // harvested reference itself — "Patek 3700/11 sold while this card is
    // 3700/1A". Honest about the gap, and lets a reader follow the original
    // Phillips URL to see the actual dial / case / lot notes.
    condition: `similar reference: ${m.harvested_brand} ${m.harvested_reference}${m.harvested_model ? ` · ${m.harvested_model}` : ''}`,
    // Fuzzy matches price a *similar but not identical* reference, so they
    // are real and shown but excluded from the comparable comps that drive
    // the market estimate. Same routing the build uses for charity lots
    // and celebrity-owned examples.
    comparable: false,
    fuzzy_match: {
      harvested_brand: m.harvested_brand,
      harvested_reference: m.harvested_reference,
      harvested_model: m.harvested_model,
      match_level: m.match_level,
      match_score: m.match_score,
      match_reason: m.match_reason,
    },
  });
  added++;
  touched.add(m.card_id);
  writeFileSync(path, JSON.stringify(card, null, 2) + '\n');
}

console.log(`applied ${added} fuzzy matches to ${touched.size} cards (skipped ${skipped} duplicates)`);
for (const cid of touched) console.log(`  ${cid}`);
