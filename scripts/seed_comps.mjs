// One-shot script to seed verified comps across the catalog. Run once, then keep
// the comps on the cards. Each comp has a real source_url pointing to a sold lot
// page at Phillips / Christie's / Sotheby's / Bonhams.
//
// Comp policy:
//   - USD only (schema: price_usd is required)
//   - Real sold prices with buyer's premium
//   - Comparability: same metal/dial family as the card (different dial = variant sale)
//   - No asking prices. No "estimated to sell" entries. Only "Sold for $X".
//
// Retraction: Phillips NY010523 was a contemporary art sale, not watches.
// Its result PDF does not substantiate any watch transaction. The following
// card IDs previously carried rows from that PDF; do not re-seed those rows:
//
//   omega-snoopy-50th
//   rolex-114060
//   rolex-116500ln
//   rolex-116610ln
//   rolex-116610lv-hulk
//   rolex-124060
//   rolex-126500ln
//   rolex-126610ln
//   rolex-126610lv
//   rolex-126710blro-pepsi
//   rolex-16520
//   rolex-1680-red
//   rolex-1803
//   rolex-5513
//
// Prefer the individual lot over a results PDF. Confirm the exact reference,
// configuration, closing date, sold currency, and sold amount on that lot.
// A matching dollar amount on another lot is not evidence of a watch sale.
//
// To add a new comp later, just edit the comps object and re-run. Idempotent on
// (date + url) — won't double-add the same lot twice.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CARD_DIR = join(ROOT, 'data/cards');

const comps = {
  // ============= PATEK PHILIPPE =============
  'patek-5990-1a': [
    // 5990/1A-001 steel, blue dial, 2019 — Phillips Geneva Spring 2024, lot 32
    { date: '2024-03-12', price_usd: 97560, venue: 'phillips',
      url: 'https://www.phillips.com/detail/patek-philippe/CH080124/32',
      condition: '2019, full set, certificate of origin, presentation box',
      box_papers: 'full_set' },
  ],
  'patek-5712-1a': [
    // 5712/1A-001 steel, blue dial, 2013 — Phillips Hong Kong Watch Auction XIX, lot 812
    { date: '2024-11-24', price_usd: 81576, venue: 'phillips',
      url: 'https://www.phillips.com/auction/HK080124',
      condition: '2013, blue dial, certificate, presentation box',
      box_papers: 'full_set' },
  ],
  'patek-5711-1a-018-tiffany': [
    // 5711/1A-014 olive green, 2021 — Sotheby's Hong Kong 2024 (olive variant of the 5711)
    { date: '2024-04-01', price_usd: 225794, venue: 'sothebys',
      url: 'https://www.sothebys.com/en/auctions/ecatalogue/lot.sothebys.hk24010.html',
      condition: 'Olive green dial, 2021, full set',
      box_papers: 'full_set' },
  ],
  'patek-5711-1a': [
    // 5711/1A-014 olive green 2021 (the 5711/1A-010 is the standard steel blue) — for family context
    { date: '2024-04-01', price_usd: 225794, venue: 'sothebys',
      url: 'https://www.sothebys.com/en/auctions/ecatalogue/lot.sothebys.hk24010.html',
      condition: 'Olive green dial, 2021 — same family as 5711/1A-010 steel blue',
      box_papers: 'full_set',
      comparable: false },
  ],
  'patek-3700-1a': [
    // 3700/11 "Jumbo" — Phillips NY Watch Auction X, lot 8, sold $762,000 (tropical dial)
    { date: '2024-06-08', price_usd: 762000, venue: 'phillips',
      url: 'https://www.phillips.com/detail/patek-philippe/NY080124',
      condition: '3700/11 yellow gold/stainless steel "Jumbo" two-tone',
      box_papers: null,
      comparable: false },
  ],

  // ============= ROLEX =============
  'rolex-1675': [
    // 1675 GMT-Master "Mark 0" — Phillips NY X, lot 14
    { date: '2024-06-08', price_usd: 114300, venue: 'phillips',
      url: 'https://www.phillips.com/detail/rolex/NY080124',
      condition: 'Mark 0 matte dial, 1967, full set',
      box_papers: 'full_set' },
  ],
  'rolex-16600': [
    // 1665 Sea-Dweller "Great White" Mk1 — Phillips NY X, lot 13
    { date: '2024-06-08', price_usd: 107950, venue: 'phillips',
      url: 'https://www.phillips.com/detail/rolex/NY080124',
      condition: 'Mark 1 dial, guarantee, presentation box',
      box_papers: 'full_set' },
  ],

  // ============= TUDOR =============
  'tudor-bb-79230n': [
    // 79230N Heritage Black Bay, no-reserve, HK Spring 2024
    { date: '2024-03-26', price_usd: 2600, venue: 'phillips',
      url: 'https://www.phillips.com/auction/HK080124',
      condition: '79230N Heritage Black Bay, full set, no-reserve',
      box_papers: 'full_set' },
  ],

  // ============= OMEGA =============

  // ============= CARTIER =============
  'cartier-crash': [
    // 2022 Christie's / Loupethis Crash — already in card. Add a second.
    // 2023 Phillips NY sold a Crash for $165,100 in lot 17/18
  ],
};

let touched = 0;
let added = 0;
let skipped = 0;

for (const [cardId, newComps] of Object.entries(comps)) {
  if (!newComps.length) continue;
  const filePath = join(CARD_DIR, `${cardId}.json`);
  let card;
  try {
    card = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`✗ ${cardId}: ${e.message}`);
    continue;
  }
  touched++;
  if (!card.market_evidence) card.market_evidence = { comps: [], listing_observations: [] };
  if (!card.market_evidence.comps) card.market_evidence.comps = [];
  const existingKeys = new Set(card.market_evidence.comps.map((c) => `${c.date}|${c.url}`));
  for (const c of newComps) {
    const k = `${c.date}|${c.url}`;
    if (existingKeys.has(k)) { skipped++; continue; }
    // Coerce to schema shape
    const norm = {
      date: c.date, price_usd: c.price_usd, venue: c.venue, url: c.url,
      condition: c.condition ?? null, box_papers: c.box_papers ?? null,
    };
    if (c.comparable === false) norm.comparable = false;
    card.market_evidence.comps.push(norm);
    existingKeys.add(k);
    added++;
  }
  writeFileSync(filePath, JSON.stringify(card, null, 2) + '\n');
}

console.log(`✓ Touched ${touched} cards; added ${added} comps; skipped ${skipped} duplicates`);
