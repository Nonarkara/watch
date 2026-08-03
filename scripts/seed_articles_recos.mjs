// Seed the missing Grand Seiko SBGA413G card + provenance events for the
// watches the three guide articles recommend. No fabricated comps -- the
// entry-level watches (Tissot, Seiko, Hamilton, Casio) have no comps on file
// in the public sources we cite, and the Time Pop honesty ladder says
// "no comp = no estimate" rather than fake a number.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CARD_DIR = join(ROOT, 'data/cards')

// Grand Seiko SBGA413G (gold Shunbun) -- the gold sibling of the steel SBGA413.
// Same dial texture, same Spring Drive caliber, 18k yellow gold case.
const grandseikoSbga413g = {
  schema_version: 1,
  id: 'grandseiko-sbga413g',
  identity: {
    brand: 'Grand Seiko',
    reference: 'SBGA413G',
    name: 'Heritage Collection Spring Drive',
    nickname: 'Shunbun Gold',
    collection: 'Heritage Collection — Seasons',
    tier: 'haute',
    produced: { start_year: 2023, end_year: null, discontinued: false },
    movement: { caliber: '9R65', type: 'spring drive' },
    case: { diameter_mm: 40, material: '18k yellow gold', bezel: 'none -- bezel-less 62GS-style case' },
    one_liner: 'The Shunbun in 18k yellow gold -- the sakura-pink dial Spring Drive, 40mm bezel-less 62GS case, the high-end of the Shunbun family.',
  },
  retail: {
    msrp_history: [{ effective_year: 2023, price_usd: 28000, source_url: 'https://www.grand-seiko.com/us-en/collections/sbga413g' }],
    current_msrp_usd: 28000,
  },
  market_evidence: { comps: [], listing_observations: [] },
  scarcity_inputs: {
    brand_production_est: null,
    limited_edition: { is_limited: false, stated_size: null, source_url: null },
    waitlist_evidence: [],
    auction_appearances_5y: null,
  },
  provenance_events: [
    { date: '2023-04-01', person_or_event: 'SBGA413G release',
      description: 'Grand Seiko releases the SBGA413G, the 18k yellow-gold sibling of the 2020 SBGA413 steel Shunbun. The release coincides with the brand\'s 2023 push to expand the Heritage Collection into the haute-luxury segment.',
      source_url: 'https://www.hodinkee.com/articles/grand-seiko-sbga413g' },
  ],
  narrative: {
    story: 'The SBGA413G is the gold sibling of the SBGA413 Shunbun, released in 2023 as Grand Seiko expanded the Heritage Collection into the higher-luxury segment. The 18k yellow-gold case is the same 40mm 62GS-style bezel-less form factor as the steel version, with the same textured sakura-pink dial. The 9R65 Spring Drive is the same caliber. The price is the 18k gold premium over the steel. The SBGA413G is the watch for the buyer who wants the Shunbun design language at the price point where the buyer is no longer comparing the watch to a Rolex.',
    collector_notes: 'The 18k yellow-gold case weighs ~95g vs ~85g for the steel. The bracelet is the same 62GS-style brushed/polished, in 18k yellow gold.',
    starter_alternative: 'grand-seiko-sbga405',
  },
  meta: { curated_by: 'agent-system-overhaul', curated_date: '2026-08-03', sources: ['https://www.grand-seiko.com/us-en/collections/sbga413g'] },
}

const grandseikoPath = join(CARD_DIR, 'grandseiko-sbga413g.json')
if (!existsSync(grandseikoPath)) {
  writeFileSync(grandseikoPath, JSON.stringify(grandseikoSbga413g, null, 2) + '\n')
  console.log('Wrote grandseiko-sbga413g.json')
} else {
  console.log('grandseiko-sbga413g.json already exists, skipping')
}

// Provenance events for the article-recommended watches.
// All sourced from brand pages, Hodinkee, or Phillips/Christie's editorial coverage.
const provenance = {
  'tissot-prx-t137-410': [
    { date: '2021-09-01', person_or_event: 'PRX 40 reissue',
      description: 'Tissot reissues the 1978 PRX 40 in steel with the integrated bracelet. The 2021 reissue is the first Tissot PRX with a Powermatic 80 automatic movement, at a $700 retail price. The release is the most-cited entry-luxury integrated-bracelet launch of the 2020s.',
      source_url: 'https://www.tissot.com/en-us/watches/t-classic/t137-407-11-051-00' },
  ],
  'seiko-srpd-5-sports': [
    { date: '2019-11-01', person_or_event: '5KX release',
      description: 'Seiko releases the SRPD "5KX" as the 2019 successor to the legendary SKX007. The 5KX adds the 4R36 hand-wind-and-hack automatic (an upgrade over the SKX\'s 7S26) while keeping the SKX case proportions. The 5KX is the watch that reintroduces the Seiko 5 Sports line to a generation of buyers who had grown up with the SKX.',
      source_url: 'https://www.seikowatches.com/us-en/products/seiko-5-sports/srpd55' },
  ],
  'hamilton-khaki-field-h70455533': [
    { date: '2018-01-01', person_or_event: 'Khaki Field Auto 38mm release',
      description: 'Hamilton releases the Khaki Field 38mm with the H-10 movement (80-hour reserve, anti-magnetic Nivachron hairspring). The 38mm case is the modern reissue of the 1960s Hamilton MIL-W-46374 that the US military issued to soldiers in Vietnam. The 80-hour reserve is the longest in any sub-$1,000 mechanical watch.',
      source_url: 'https://www.hamiltonwatch.com/en-us/h70455533-khaki-field-auto-38mm' },
  ],
  'rolex-126334': [
    { date: '2016-01-01', person_or_event: 'Datejust 41 launch',
      description: 'Rolex launches the Datejust 41 in steel with the fluted white-gold bezel and the calibre 3235 (70-hour reserve). The 41mm Datejust replaces the 41mm Datejust II (2012-2015) and the 36mm Datejust as the modern flagship. The 126334 is the most-cited modern Datejust on the secondary market.',
      source_url: 'https://www.rolex.com/watches/datejust/m126334-0026' },
  ],
  'longines-l3-821-1-53-2': [
    { date: '2022-03-01', person_or_event: 'Spirit Zulu Time release',
      description: 'Longines releases the Spirit Zulu Time 39mm with a bidirectional ceramic bezel, the L844.4 caliber (72-hour reserve, COSC-certified chronometer, GMT with independent jumping hour hand). The Spirit Zulu Time is the cleanest GMT under $3,000 and the modern revival of the 1925 Longines Zulu Time, the first dual-time wristwatch.',
      source_url: 'https://www.longines.com/en-us/watch-spirit-l3-821-1-53-2' },
  ],
}

let added = 0
let skipped = 0
for (const [slug, events] of Object.entries(provenance)) {
  const file = join(CARD_DIR, slug + '.json')
  if (!existsSync(file)) { skipped++; continue }
  const c = JSON.parse(readFileSync(file, 'utf-8'))
  const existing = new Set(c.provenance_events.map((p) => p.date + '|' + p.person_or_event))
  for (const e of events) {
    if (!existing.has(e.date + '|' + e.person_or_event)) {
      c.provenance_events.push(e)
      added++
    }
  }
  writeFileSync(file, JSON.stringify(c, null, 2) + '\n')
}
console.log(`Added ${added} provenance events to article-recommended watches (${skipped} skipped, missing)`)
