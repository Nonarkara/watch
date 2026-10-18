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
    venue: 'phillips',
    url: m.source_url,
    box_papers: null,
    // The condition is the "why excluded" string the build script maps to the
    // variant-sales table. It names the harvested reference, and for a
    // converted lot it also names the currency the hammer was struck in.
    condition: [
      `similar reference: ${m.harvested_brand} ${m.harvested_reference}${m.harvested_model ? ` · ${m.harvested_model}` : ''}`,
      ...(m.original_currency ? [`hammer ${m.original_display} in ${m.original_currency}`] : []),
    ].join(' · '),
    // Real and cited, but it prices a similar-but-not-identical reference, so
    // it is shown and never averaged into the market estimate.
    comparable: false,
    fuzzy_match: {
      harvested_brand: m.harvested_brand,
      harvested_reference: m.harvested_reference,
      harvested_model: m.harvested_model,
      match_level: m.match_level,
      match_score: m.match_score,
      match_reason: m.match_reason,
      auction_name: m.auction_name,
      lot_number: m.lot_number,
    },
    // Present only for HKD/CHF lots. Names the rate, the business day the ECB
    // actually published it, and the provider, so the conversion is auditable
    // from the card alone without opening the harvest queue.
    ...(m.fx_conversion ? {
      fx_conversion: {
        ...m.fx_conversion,
        original_realized: m.original_realized,
        original_currency: m.original_currency,
        original_display: m.original_display,
      },
    } : {}),
  });
  added++;
  touched.add(m.card_id);
  writeFileSync(path, JSON.stringify(card, null, 2) + '\n');
}

console.log(`applied ${added} fuzzy matches to ${touched.size} cards (skipped ${skipped} duplicates)`);
for (const cid of touched) console.log(`  ${cid}`);
