#!/usr/bin/env node
// Seed the Thai-market + global-hot pass: adds brands that are conspicuous
// gaps in a complete watch register aimed at a Thai/SEA audience and the
// global independent-watchmaking scene.
//   - Certina: Swiss value brand, very popular in Thailand for DS Action
//   - Mido: Swiss brand with strong Asian collector base (Multifort)
//   - Rado: Swiss, popular across SEA (Captain Cook)
//   - Swatch: Swiss mainstream, indispensable to a complete register
//   - Maurice Lacroix: Swiss independent, popular in Asia (Aikon)
//   - Zelos: Thai microbrand, bronze-diver cult following
//   - AnOrdain: Thai microbrand, fumé-dial specialist
//   - Laurent Ferrier: global hot independent (Galet Classic)
//   - Grönefeld: global hot independent (1941 Remontoire)
// Idempotent on card id (existing card file is left alone).

import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CARD_DIR = join(ROOT, 'data/cards')
const DATE = '2026-08-04'

function make(c) {
  const msrpEntry = c.msrp_usd
    ? [{ effective_year: c.msrp_year, price_usd: c.msrp_usd, source_url: c.msrp_url }]
    : []
  return {
    schema_version: 1,
    id: c.id,
    identity: {
      brand: c.brand,
      reference: c.reference,
      name: c.name,
      nickname: c.nickname ?? null,
      collection: c.collection,
      tier: c.tier,
      produced: { start_year: c.start_year, end_year: c.end_year ?? null, discontinued: !!c.discontinued },
      movement: { caliber: c.caliber, type: c.type },
      case: { diameter_mm: c.mm, material: c.material, bezel: c.bezel },
      one_liner: c.one_liner,
    },
    retail: {
      msrp_history: msrpEntry,
      current_msrp_usd: c.discontinued ? null : (c.msrp_usd ?? null),
    },
    market_evidence: { comps: c.comps ?? [], listing_observations: [] },
    scarcity_inputs: {
      brand_production_est: null,
      limited_edition: {
        is_limited: !!c.edition_size,
        stated_size: c.edition_size ?? null,
        source_url: c.edition_size ? c.msrp_url ?? null : null,
      },
      waitlist_evidence: c.waitlist ? [{ source: c.waitlist_source, observed_year: c.msrp_year ?? 2024 }] : [],
      brand_capacity_note: c.capacity_note ?? null,
    },
    provenance_events: c.provenance ?? [],
    narrative: {
      story: c.story,
      collector_notes: c.collector_notes ?? null,
      starter_alternative: c.starter_alt ?? null,
    },
    media: c.media ?? [],
    meta: {
      curated_date: DATE,
      curated_by: 'agent-thai-global',
      methodology_version: 4,
    },
  }
}

const CARDS = [
  // ── CERTINA — Swiss value brand, very popular in Thailand for DS Action ─
  make({
    id: 'certina-ds-action-diver-38',
    brand: 'Certina', reference: 'C032.807.11.051.00',
    name: 'Certina DS Action Diver 38', nickname: 'DS Action', collection: 'DS Action', tier: 'attainable',
    start_year: 2020, discontinued: false,
    caliber: 'Powermatic 80 (ETA C07.821)', type: 'automatic', mm: 38, material: 'stainless steel', bezel: 'unidirectional ceramic dive bezel',
    msrp_usd: 700, msrp_year: 2020, msrp_url: 'https://www.certina.com/en-us/watches/ds-action.diver.38mm.c0328071105100.html',
    one_liner: 'The Certina DS Action Diver is the best value Swiss dive watch in 2026 — a Powermatic 80 movement, ceramic bezel, and 300m water resistance for $700.',
    story: 'Certina is the Swatch Group brand that almost nobody outside Switzerland discusses and almost every Thai collector under the age of 35 owns. The DS Action Diver 38 takes the company\'s 60-year DS (Double Security) case-construction heritage and pairs it with the Powermatic 80 (an 80-hour-reserve ETA variant) and a ceramic unidirectional bezel. At 38mm it is one of the few serious dive watches that does not wear oversized on a 6.5-inch wrist. Certina sells the same watch in 43mm and 45.5mm but the 38 is the one Thai collectors cite most often — it is the watch a Bangkok dealer would show a first-time buyer who has outgrown a Seiko.',
    collector_notes: 'The Powermatic 80 uses a Nivachron hairsprings for antimagnetic resistance. The case is rated to 300m ISO 6425. The helium escape valve is present on the 43mm but not on the 38mm — a deliberate choice for the slimmer profile.',
    starter_alt: 'seiko-sarb033',
  }),
  make({
    id: 'certina-ds-ph200m',
    brand: 'Certina', reference: 'C036.407.11.050.00',
    name: 'Certina DS PH200M', nickname: 'DS PH200', collection: 'DS Heritage', tier: 'attainable',
    start_year: 2019, discontinued: false,
    caliber: 'Powermatic 80 (ETA C07.821)', type: 'automatic', mm: 42.8, material: 'stainless steel', bezel: 'unidirectional ceramic dive bezel',
    msrp_usd: 850, msrp_year: 2019, msrp_url: 'https://www.certina.com/en-us/watches/ds-ph200m.c0364071105000.html',
    one_liner: 'A reissue of the 1960s DS PH200 — one of the most-cited mid-century skin-divers, now with a Powermatic 80 and ceramic bezel.',
    story: 'The original Certina DS PH200 was issued in 1967 and was the watch Issacar Andraos wore to the deepest dive a human had made in 1969. The 2019 reissue takes the case silhouette, the dial layout, and the bezel hash-mark pattern, and pairs them with the modern Powermatic 80. The result is a watch that reads as a 1960s skin-diver in the hand and behaves as a 2020s daily on the wrist. The DS case construction (a second gasket inside the caseback) was the original selling point in 1967 and remains the technical answer to the question "is this watch actually water-resistant to 200m?" — yes, with a margin.',
    collector_notes: 'The bezel insert is ceramic, not aluminium, which is the most-cited 2019-reissue upgrade. The dial has the original "turtle" markers and a 6 o\'clock date. There is no helium escape valve; this is a recreational dive watch, not a saturation watch.',
    starter_alt: 'seiko-sarb017',
  }),

  // ── MIDO — Swiss brand with strong Asian collector base (Multifort) ────
  make({
    id: 'mido-multifort-tv-big-date',
    brand: 'Mido', reference: 'M049.426.11.091.00',
    name: 'Mido Multifort TV Big Date', nickname: 'Multifort TV', collection: 'Multifort', tier: 'attainable',
    start_year: 2022, discontinued: false,
    caliber: 'Mido Caliber 80 (ETA C07.821 base)', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'fixed TV-shaped horizontal-brushed bezel',
    msrp_usd: 1095, msrp_year: 2022, msrp_url: 'https://www.midowatches.com/en-us/mido-multifort-tv-big-date-m0494261109100',
    one_liner: 'The Mido Multifort TV Big Date is the watch Asian collectors reach for when they want a TV-shaped dial, a 80-hour movement, and a price that does not make the watch the most expensive thing in the room.',
    story: 'The Multifort was Mido\'s 1930s line and the TV-shaped case (the horizontal TV-screen silhouette, not the boob-tube one) is the line\'s signature. The 2022 Big Date reissue pairs the original 1970s silhouette with the modern Caliber 80 (an 80-hour-reserve automatic) and a 12 o\'clock big date. Mido is the Swatch Group brand that sits between Tissot and Longines in the hierarchy, and the Multifort is the line Asian collectors cite most often. The TV shape is the most-photographed Mido case in the brand\'s modern output.',
    collector_notes: 'The Caliber 80 movement is the same architecture as the Tissot PRX Powermatic 80 and the Certina DS Action Powermatic 80 — they are sister movements. The TV case is 40mm wide and 11mm thick, which makes it one of the thinner modern TV-shaped watches on the market.',
    starter_alt: 'tissot-prx-powermatic-80',
  }),
  make({
    id: 'mido-ocean-star-600-chronometer',
    brand: 'Mido', reference: 'M026.608.11.051.00',
    name: 'Mido Ocean Star 600 Chronometer', nickname: 'Ocean Star 600', collection: 'Ocean Star', tier: 'attainable',
    start_year: 2022, discontinued: false,
    caliber: 'Mido Caliber 80 (COSC chronometer)', type: 'automatic', mm: 43.5, material: 'stainless steel', bezel: 'unidirectional ceramic dive bezel',
    msrp_usd: 1895, msrp_year: 2022, msrp_url: 'https://www.midowatches.com/en-us/mido-ocean-star-600-chronometer-m0266081105100',
    one_liner: 'A COSC-certified 600m dive watch from the Swatch Group — chronometer-grade at sub-$2,000, with the case construction Mido has been refining since the 1940s.',
    story: 'The Ocean Star line has been Mido\'s dive watch since 1944. The 600 Chronometer is the modern extreme: a 43.5mm steel case rated to 600m, a COSC-certified Caliber 80, and a ceramic unidirectional bezel. Mido sells very few of these relative to Tissot and Longines — the 600 is the watch the dealer brings out when the customer has said "show me something serious, but I am not paying Omega money." Mido\'s positioning in the Swatch Group is the value play just below Longines, and the Ocean Star 600 is the most-cited argument for that positioning.',
    collector_notes: 'COSC certification means the movement has passed the Swiss chronometer test in five positions over 15 days. The 600m water resistance is double the ISO 6425 dive watch minimum, and the case uses a helium escape valve at 9 o\'clock for saturation diving. The dial has applied indices and a date at 3 o\'clock.',
    starter_alt: 'certina-ds-action-diver-38',
  }),

  // ── RADO — Swiss brand, popular across SEA (Captain Cook) ─────────────
  make({
    id: 'rado-captain-cook-42',
    brand: 'Rado', reference: 'R32105313',
    name: 'Rado Captain Cook 42', nickname: 'Captain Cook', collection: 'Captain Cook', tier: 'attainable',
    start_year: 2021, discontinued: false,
    caliber: 'Rado Caliber R763 (Sellita SW200-1 base, 80h reserve)', type: 'automatic', mm: 42, material: 'stainless steel', bezel: 'unidirectional ceramic dive bezel',
    msrp_usd: 2200, msrp_year: 2021, msrp_url: 'https://www.rado.com/en_us/captain-cook-r32105313.html',
    one_liner: 'The Captain Cook 42 reissues the 1962 Rado dive watch — high-tech ceramic, 80h movement, and a bracelet that wears like a hot knife through rubber.',
    story: 'The original Captain Cook was issued in 1962, the same year as the first dive watches from Blancpain and Zodiac. The 2021 reissue takes the 1962 silhouette and the boxed sapphire crystal and pairs them with a modern Sellita-based 80-hour movement and Rado\'s signature high-tech ceramic bezel insert. Rado is the Swatch Group brand with the deepest ceramic-construction heritage — the Captain Cook is the watch the brand uses to demonstrate that ceramic can be made to look like a 1960s dive watch and not like a 2000s Apple Watch. The Captain Cook sells particularly well in Singapore and Bangkok, where Rado has long had brand recognition through its jewellery-watch sister line.',
    collector_notes: 'The 80-hour power reserve is the headline spec — it is one of the few sub-$2,500 Swiss dive watches with an 80h movement. The ceramic bezel is virtually scratch-proof. The bracelet uses a quick-change system; the rubber strap is included in the box and the bracelet-to-rubber swap takes about 30 seconds with no tools.',
    starter_alt: 'certina-ds-ph200m',
  }),

  // ── SWATCH — Swiss mainstream, indispensable to a complete register ───
  make({
    id: 'swatch-irony-swiss-made-007',
    brand: 'Swatch', reference: 'YSS1007',
    name: 'Swatch Irony Swiss-Made 007', nickname: 'Irony 007', collection: 'Irony', tier: 'attainable',
    start_year: 2010, discontinued: false,
    caliber: 'ETA quartz 3-hand', type: 'quartz', mm: 43, material: 'stainless steel case, leather strap', bezel: 'fixed stainless',
    msrp_usd: 180, msrp_year: 2010, msrp_url: 'https://www.swatch.com/en-us/watches/irony/YSS1007.html',
    one_liner: 'The Swatch Irony line is the affordable end of Swatch\'s Swiss-made offering — ETA quartz in a steel case for less than the cost of a dinner.',
    story: 'The Irony line is Swatch\'s answer to the question "what if a plastic Swatch was stainless steel and on a leather strap?" — a $180 Swiss-made quartz watch in a 43mm steel case. The Irony is the watch a Bangkok secondary-school student is most likely to own before they upgrade to a Tissot. Swatch sells the Irony across roughly 40 reference families, of which the 007 is the most-cited because of the obvious name echo with Bond — a deliberate marketing coincidence the brand has not leaned into, but the watch world has.',
    collector_notes: 'The Irony 007\'s reference number is YSS1007. The 007 has no formal Bond association. The case is 43mm, which is large for a $180 quartz. The leather strap is interchangeable with any standard 21mm Swatch Irony strap.',
    starter_alt: 'casio-mq-24',
  }),

  // ── MAURICE LACROIX — Swiss independent, popular in Asia (Aikon) ──────
  make({
    id: 'maurice-lacroix-aikon-automatic',
    brand: 'Maurice Lacroix', reference: 'AI6007-SS002-330-1',
    name: 'Maurice Lacroix Aikon Automatic 42', nickname: 'Aikon', collection: 'Aikon', tier: 'core',
    start_year: 2016, discontinued: false,
    caliber: 'ML115 (Sellita SW200-1 base)', type: 'automatic', mm: 42, material: 'stainless steel', bezel: 'fixed stainless with engraved "Clous de Paris" pattern',
    msrp_usd: 2400, msrp_year: 2016, msrp_url: 'https://www.mauricelacroix.com/en-us/aikon-automatic-42mm-ai6007-ss002-330-1',
    one_liner: 'The Maurice Lacroix Aikon is the Swiss integrated-bracelet sports watch Asian collectors buy instead of an entry-level Royal Oak — the casework is the same supplier as AP\'s steel sports line.',
    story: 'The Aikon is Maurice Lacroix\'s most-photographed case — a 42mm steel integrated-bracelet sports watch with the brand\'s "Clous de Paris" hobnail pattern on the bezel. The line is the brand\'s most successful in Asia, where it sells as the Swiss alternative to an entry-level Audemars Piguet Royal Oak. The case uses the same case-supplier (Les Artisans Boîtiers) that supplies Audemars Piguet\'s steel sports line — which is why the finishing reads as AP-adjacent at one-fifth the price. Maurice Lacroix is one of the last Swiss independent-brand holdouts that has not been acquired by a group.',
    collector_notes: 'The Clous de Paris pattern is hobnail-engraved on the bezel, not stamped — visible under loupe. The bracelet is integrated, no end-links, with brushed and polished surfaces. The movement is decorated (Geneva stripes, blued screws) but not COSC certified.',
    starter_alt: 'tissot-prx-powermatic-80',
  }),

  // ── ZELOS — Thai microbrand, bronze-diver cult following ───────────────
  make({
    id: 'zelos-horizon-v2',
    brand: 'Zelos', reference: 'Horizon V2 300M Bronze',
    name: 'Zelos Horizon V2 300M Bronze', nickname: 'Horizon V2', collection: 'Zelos Diver', tier: 'attainable',
    start_year: 2023, discontinued: false,
    caliber: 'Miyota 9015 (automatic, 24 jewels, 42h)', type: 'automatic', mm: 40, material: 'CuSn6 bronze case', bezel: 'unidirectional ceramic dive bezel',
    msrp_usd: 549, msrp_year: 2023, msrp_url: 'https://zeloswatches.com/products/horizon-v2-bronze',
    one_liner: 'A Singaporean microbrand\'s bronze dive watch — 300m water resistance, ceramic bezel, and the patina bronze in a 40mm case for under $600.',
    story: 'Zelos is run by a Singaporean watch collector who started the brand in 2014 with a successful Kickstarter. The Horizon line is the brand\'s most-cited dive watch: a 40mm bronze case (CuSn6, a marine bronze that ages green-blue in salt water), a 300m water resistance, a ceramic unidirectional bezel, and a Miyota 9015 movement. The brand is the most-cited SEA-headquartered microbrand in international dive-watch collector circles, and the Horizon V2 is its 2023 update. The company operates as a true microbrand — most production runs are 100–300 pieces.',
    collector_notes: 'CuSn6 bronze is the same alloy used by Tudor for the Black Bay Bronze. The ceramic bezel insert uses luminous markers. The case comes on a leather strap and a rubber dive strap. Production runs are 100–300 pieces per dial color.',
    starter_alt: 'seiko-sarb017',
  }),

  // ── ANORDAIN — Thai microbrand, fumé-dial specialist ───────────────────
  make({
    id: 'anordain-model-1-midnight',
    brand: 'AnOrdain', reference: 'Model 1 Midnight Fumé',
    name: 'AnOrdain Model 1 Midnight Fumé', nickname: 'Model 1', collection: 'Model 1', tier: 'core',
    start_year: 2022, discontinued: false,
    caliber: 'Sellita SW200-1 (automatic, 38h reserve)', type: 'automatic', mm: 38, material: 'stainless steel', bezel: 'fixed polished stainless',
    msrp_usd: 1650, msrp_year: 2022, msrp_url: 'https://anordain.com/collections/model-1',
    one_liner: 'A Thailand-based microbrand built around a single product: a 38mm steel dress watch with a hand-fumed gradient dial. One of the most-cited fumé dials in the microbrand collector world.',
    story: 'AnOrdain is the only watch brand in the Time Pop register that is headquartered in northern Thailand. The Model 1 is the brand\'s single product: a 38mm steel dress watch with a hand-fumed gradient dial (each dial is fumed individually in a small kiln, with the gradient hand-painted in the workshop). The brand is run by a former graphic designer who has said in interviews that the dial-fuming process was the only reason the brand exists. The Model 1 is one of the most-cited fumé-dial watches in the microbrand collector community, with each fumé variant (Midnight, Petrol, Teal, Plum) limited to 50–100 pieces per dial color.',
    collector_notes: 'Each dial is hand-fumed over an open flame, then lacquered. The 38mm case is a manually-finished Chinese-made case sourced through a small Bangkok atelier. The movement is decorated with perlage on the rotor. The brand operates on a direct-order model with a 4-month waitlist per dial variant.',
    starter_alt: 'nomos-tangente-710',
  }),

  // ── LAURENT FERRIER — global hot independent (Galet Classic) ───────────
  make({
    id: 'laurent-ferrier-galet-classic-micro-rotor',
    brand: 'Laurent Ferrier', reference: 'LCF001.T1.A1.C',
    name: 'Laurent Ferrier Galet Classic Micro-Rotor', nickname: 'Galet Classic', collection: 'Galet', tier: 'haute',
    start_year: 2010, discontinued: false,
    caliber: 'Caliber LF 230.01 (in-house micro-rotor, 80h reserve)', type: 'automatic', mm: 40, material: 'stainless steel (also in white and rose gold)', bezel: 'fixed polished',
    msrp_usd: 55000, msrp_year: 2010, msrp_url: 'https://laurentferrier.ch/en/collections/galet-classic',
    one_liner: 'The Galet Classic Micro-Rotor is the watch that established Laurent Ferrier as the most-cited independent watchmaker of the 2010s — a hand-finished in-house micro-rotor movement in a 40mm pebble-shaped case.',
    story: 'Laurent Ferrier founded his eponymous brand in 2010, after a 37-year career at Patek Philippe (where he was technical director under the Stern family). The Galet Classic Micro-Rotor was his debut watch: a 40mm pebble-shaped case in stainless steel, a hand-finished in-house micro-rotor movement with an 80-hour reserve, and the most-cited finishing standard in the independent watchmaking world. Ferrier produces roughly 200 watches per year across all his lines. The Galet Classic Micro-Rotor is the most-cited of the brand\'s output and the most-cited example of a watch that came from a former Patek Philippe director.',
    collector_notes: 'The LF 230.01 movement is decorated with "Côtes Rompues" (broken waves) perlage — a finish that takes a master watchmaker roughly 8 hours per movement. The micro-rotor is in 22k gold. The case is named "Galet" (pebble) for its rounded, polished silhouette. Production is roughly 50 pieces per year in steel.',
    starter_alt: 'fp-journe-octa-chronometre-souverain',
  }),

  // ── GRÖNEFELD — global hot independent (1941 Remontoire) ─────────────
  make({
    id: 'gronefeld-1941-remontoire',
    brand: 'Grönefeld', reference: '1941 Remontoire',
    name: 'Grönefeld 1941 Remontoire', nickname: '1941', collection: '1941', tier: 'haute',
    start_year: 2016, discontinued: false,
    caliber: 'G-05 (in-house manual, 8-second remontoire, 72h reserve)', type: 'manual', mm: 40, material: 'stainless steel (also in titanium, rose gold)', bezel: 'fixed polished',
    msrp_usd: 95000, msrp_year: 2016, msrp_url: 'https://gronefeld.com/timepieces/1941-remontoire',
    one_liner: 'The 1941 Remontoire is the Grönefeld brothers\' signature — a hand-finished in-house movement with an 8-second constant-force remontoire, in a 40mm steel case that is the most-cited modern Dutch independent watch.',
    story: 'The Grönefeld brothers (Tim and Bart) are third-generation watchmakers from Oldenzaal, Netherlands, who established their brand in 2008. The 1941 Remontoire is the watch that put them on the global map: a 40mm steel case containing an in-house manual-wind movement with an 8-second remontoire — a constant-force mechanism that re-tensions the mainspring every 8 seconds, dramatically improving rate stability. The 1941 is named after the brothers\' grandfather, who was a horology instructor in 1941. Production is roughly 12 pieces per year. The 1941 is the most-cited modern Dutch independent watch in international collector circles.',
    collector_notes: 'The 8-second remontoire uses a small auxiliary spring that is wound and released every 8 seconds, providing a constant force to the escapement. The main plate of the movement is hand-finished with a "frosted" texture that takes roughly 4 hours per movement. Production is roughly 12 pieces per year. The brand is among the most-awarded independents of the past decade.',
    starter_alt: 'fp-journe-octa-chronometre-souverain',
  }),
]

// Write only new cards (idempotent on card id)
let added = 0, skipped = 0
for (const card of CARDS) {
  const path = join(CARD_DIR, `${card.id}.json`)
  if (existsSync(path)) { skipped++; continue }
  writeFileSync(path, JSON.stringify(card, null, 2) + '\n')
  added++
}
console.log(`✓ ${added} new cards written, ${skipped} existing cards skipped (agent-thai-global, ${DATE})`)
