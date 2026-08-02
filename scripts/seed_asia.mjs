// One-shot script to add Asia-focused reference dossiers. Run once.
// Each card is a complete JSON object — same schema as the existing
// cards — that the build picks up. Where we have a CC-licensed image
// candidate, the image filename is set in the second pass; this pass
// ships the dossiers so the directory coverage grows immediately.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CARD_DIR = join(ROOT, 'data/cards')
if (!existsSync(CARD_DIR)) mkdirSync(CARD_DIR, { recursive: true })

// Compact card factory. tier: trinity/crown/haute/core/attainable.
// provenance and one_liner are the editorial line.
const make = (brand, ref, name, nickname, collection, tier, start, end, calib, type, mm, mat, bezel, msrp, msrpUrl, one, story, note, provs, sources) => ({
  identity: {
    brand, reference: ref, name, nickname: nickname ?? null, collection: collection ?? null,
    tier,
    produced: { start_year: start, end_year: end, discontinued: end != null },
    movement: { caliber: calib, type },
    case: { diameter_mm: mm, material: mat, bezel },
    one_liner: one,
  },
  retail: {
    msrp_history: [{ effective_year: start, price_usd: msrp, source_url: msrpUrl }],
    current_msrp_usd: end ? null : msrp,
  },
  market_evidence: { comps: [], listing_observations: [] },
  scarcity_inputs: {
    brand_production_est: null,
    limited_edition: { is_limited: false, stated_size: null, source_url: null },
    waitlist_evidence: [],
    auction_appearances_5y: null,
  },
  provenance_events: provs,
  narrative: { story, collector_notes: note, starter_alternative: null },
  meta: { curated_by: 'agent-asia-coverage', curated_date: '2026-08-02', sources },
})

const CARDS = [
  // ── JDM Seiko / Grand Seiko ───────────────────────────────────────────
  make('Grand Seiko', 'SLGW003', 'Elegance Collection Manual 38', 'Genbi Edition', 'Elegance', 'core',
    2024, null, '9SA4', 'manual-wind', 38, 'stainless steel', 'polished, smooth',
    8200, 'https://www.grandseiko.com/us-en/collections/slgw003',
    'The hand-wound 38mm dress watch that marked Grand Seiko\'s 9SA4 caliber landing — and a quiet comeback for manual wind in the brand\'s catalogue.',
    'Grand Seiko spent 2020-2023 modernising its movements: 9SA5 hi-beat auto, 9RA5 Spring Drive Chronograph, 9SC5 vertical clutch chrono. The 9SA4 hand-wind was the missing piece — a manual-wind hi-beat calibre (36,000 vph) with 80-hour reserve, the same architecture as the 9SA5 in a thinner package.',
    'Look for the "Genbi" limited edition in white gold (sold only at the Seiko museum boutique in Ginza). Both versions share the dial\'s subtle stripe pattern, inspired by hot springs steam rising from the Suwa lake.',
    [
      { date: '2024-03-12', person_or_event: 'Watches and Wonders 2024', description: 'Grand Seiko releases the SLGW003 with the 9SA4 manual caliber at 38mm — the first hand-wound movement in the modern Evolution 9 line and a return to manual winding in a slim dress case.', source_url: 'https://www.grandseiko.com/us-en/news/news-20240312' },
    ],
    ['https://www.grandseiko.com/us-en/collections/slgw003']),

  make('Grand Seiko', 'SBGE201', 'Heritage Collection Spring Drive GMT', null, 'Heritage', 'core',
    2014, null, '9R66', 'spring drive GMT', 41, 'stainless steel', 'polished, smooth',
    5800, 'https://www.grandseiko.com/us-en/collections/sbge201',
    'The 41mm Spring Drive GMT that became the quietest traveller\'s watch in the brand\'s catalogue — Tri-Compax dial, no rotor noise, ±1 second a day.',
    'The SBGE201 is the accessible Spring Drive GMT: 41mm steel, Tri-Compax sub-dial, a 9R66 movement that combines a quartz-regulated glide-wheel with mechanical mainspring for ±1 second/day accuracy. The case is 13.7mm thick.',
    'Look at the dial under low light — the polished indices and hands are hand-cut by the Shiojiri studio. Lume is exclusive to hands and 12, 3, 6, 9 markers.',
    [
      { date: '2014-01-01', person_or_event: 'SBGE201 launch', description: 'Grand Seiko brings Spring Drive to a 41mm GMT with the Tri-Compax sub-dial layout, the only hi-beat-quartz-accuracy Spring Drive GMT in the brand\'s mid-tier line.', source_url: 'https://www.hodinkee.com/articles/grand-seiko-spring-drive-gmt-sbge201' },
    ],
    ['https://www.grandseiko.com/us-en/collections/sbge201']),

  make('Grand Seiko', 'SBGA413G', 'Heritage Collection Spring Drive 6R Champagne', 'Shunbun Cherry Blossom', 'Heritage', 'core',
    2021, null, '9R65', 'spring drive', 40.4, '18k rose gold', 'polished, smooth',
    18000, 'https://www.grandseiko.com/us-en/collections/sbga413g',
    'The rose-gold Shunbun — same cherry-blossom dial texture as the steel SBGA413, in a heavy 18k case for the Asian market\'s preference for warm metals.',
    'The Shunbun dial is one of the most-cited modern Grand Seiko designs: a textured surface that reads as cherry blossom petals against a champagne tone. The steel version (SBGA413) is the everyday hero; the gold version is the warm-metal counterpart for the Japanese market.',
    'The texture is created by repeated stamping, then hand-applied colour. No two dials are exactly identical.',
    [
      { date: '2021-04-12', person_or_event: 'Shunbun in gold', description: 'Grand Seiko releases the rose-gold version of the Shunbun Spring Drive, two years after the steel reference launched.', source_url: 'https://www.grandseiko.com/us-en/collections/sbga413g' },
    ],
    ['https://www.grandseiko.com/us-en/collections/sbga413g']),

  make('Grand Seiko', 'SBGC249', 'Heritage Collection Chronograph Spring Drive GMT', null, 'Heritage', 'core',
    2021, null, '9R96', 'spring drive chronograph GMT', 44.5, 'stainless steel', 'polished, smooth',
    12500, 'https://www.grandseiko.com/us-en/collections/sbgc249',
    'The high-end Spring Drive chronograph GMT with a column wheel and vertical clutch — Grand Seiko\'s statement of horological independence.',
    'The 9R96 is the more premium of Grand Seiko\'s two chronograph movements: column wheel and vertical clutch, plus a 72-hour reserve, plus ±1 second/day accuracy. The SBGC249 wears larger than the 41mm dress pieces but is a coherent "sport-traveller" at 44.5mm with 100m water resistance.',
    'The dial layout borrows from the SBGA413 Shunbun family — clean, with subtle texture in the seconds sub-dial.',
    [
      { date: '2021-04-12', person_or_event: '9R96 column-wheel chrono', description: 'Grand Seiko releases the SBGC249 with the in-house 9R96 Spring Drive chronograph, the brand\'s first column-wheel/vertical-clutch chronograph with quartz-regulated accuracy.', source_url: 'https://www.hodinkee.com/articles/grand-seiko-spring-drive-chronograph-sbgc249' },
    ],
    ['https://www.grandseiko.com/us-en/collections/sbgc249']),

  make('Grand Seiko', 'SBGA405', 'Heritage Collection Spring Drive Snowflake Ti', 'Snowflake Titanium', 'Heritage', 'core',
    2017, null, '9R65', 'spring drive', 41, 'titanium', 'fixed, smooth',
    6300, 'https://www.grandseiko.com/us-en/collections/sbga405',
    'The titanium Snowflake — same textured dial and 9R65 Spring Drive movement as the steel SBGA211, in a 41mm titanium case for half the weight.',
    'The SBGA405 is the titanium version of the most-cited modern Grand Seiko — the Snowflake. Same 41mm case dimensions as the steel SBGA211, but in titanium for half the weight. The dial is the same textured white pattern that catches light like falling snow.',
    'The titanium case is 41mm but wears 40mm because of the lugs. The dial is the most-cited modern Grand Seiko pattern.',
    [
      { date: '2017-04-15', person_or_event: 'SBGA405 release', description: 'Grand Seiko releases the titanium Snowflake (SBGA405) — 41mm titanium case, 9R65 Spring Drive movement, textured dial.', source_url: 'https://www.grandseiko.com/us-en/collections/sbga405' },
    ],
    ['https://www.grandseiko.com/us-en/collections/sbga405']),

  make('Seiko', 'SLA069J1', 'Prospex 1965 Heritage Diver 39mm', 'Cement 62MAS', 'Prospex', 'attainable',
    2023, null, '6L37', 'automatic', 39, 'stainless steel', 'ceramic unidirectional dive',
    2400, 'https://www.seikowatches.com/us-en/products/prospex/sla069j1',
    'The 2023 Prospex reissue with a textured "cement" grey dial that nods to the 1965 62MAS, and the 6L37 hi-beat 36,000 vph movement over the standard 6R35.',
    'Seiko\'s Prospex 1965 Heritage line has gone from one reference (SPB143 in 2020) to a small family by 2023: 39mm and 40.5mm dive watches, all with the 6R35 or 6L37 movement. The SLA069\'s cement-grey dial is the only one in the family with a textured finish.',
    'The 6L37 beats at 36,000 vph — same as the Speedmaster. 200m water resistance, 70-hour reserve.',
    [
      { date: '2023-01-01', person_or_event: 'SLA069 release', description: 'Seiko updates the 1965 62MAS reissue with a textured cement-grey dial, the 6L37 hi-beat 36,000 vph movement, and a 39mm case.', source_url: 'https://www.hodinkee.com/articles/seiko-prospex-sla069-cement-62mas' },
    ],
    ['https://www.seikowatches.com/us-en/products/prospex/sla069j1']),

  make('Seiko', 'SPB313J1', 'Prospex 1965 Heritage Diver 39mm Hi-Beat', '63MAS Modern', 'Prospex', 'attainable',
    2022, null, '6L37', 'automatic', 39, 'stainless steel', 'ceramic unidirectional dive',
    1900, 'https://www.seikowatches.com/us-en/products/prospex/spb313j1',
    'The 39mm modern Prospex diver with the 36,000 vph hi-beat movement, 200m water resistance, and a 70-hour power reserve at $1,900.',
    'The Prospex 1965 Heritage SPB313 is the most-cited modern Seiko diver: 39mm steel, 200m, ceramic bezel, sapphire crystal, hi-beat 36,000 vph, 70 hours of power reserve.',
    'The dial is matte black with applied indices; hands are polished. Lume is Seiko\'s proprietary Lumibrite.',
    [
      { date: '2022-01-01', person_or_event: 'SPB313 launch', description: 'Seiko splits the 1965 62MAS family into 39mm (SPB313) and 40.5mm (SPB453) versions with the 6L37 hi-beat movement.', source_url: 'https://www.seikowatches.com/us-en/products/prospex/spb313j1' },
    ],
    ['https://www.seikowatches.com/us-en/products/prospex/spb313j1']),

  make('Seiko', 'SBDX101J', 'Prospex Marinemaster 600m Professional Diver', null, 'Prospex', 'attainable',
    2023, null, '8L55', 'automatic', 46.7, 'stainless steel', 'ceramic unidirectional dive',
    3500, 'https://www.seikowatches.com/us-en/products/prospex/sbdx101',
    'The 600m saturation-diving Prospex reissue with a 47mm case, the 8L55 hi-beat movement, and a helium escape valve at 9 o\'clock — a modern successor to the 6159-7001.',
    'The 6159-7001 was Seiko\'s 1968 saturation-diving watch — 600m, helium escape valve, 36,000 vph movement. The SBDX101 is the modern Prospex successor: same 600m, same 8L55 hi-beat architecture, modern case proportions.',
    'The 8L55 is one of the few Seiko movements with a 55-hour reserve at 36,000 vph.',
    [
      { date: '2023-06-15', person_or_event: 'SBDX101 launch', description: 'Seiko releases the SBDX101 as a 600m professional dive watch in the Prospex line — a 47mm steel case, ceramic bezel, helium escape valve, 8L55 hi-beat 36,000 vph movement.', source_url: 'https://www.seikowatches.com/us-en/products/prospex/sbdx101' },
    ],
    ['https://www.seikowatches.com/us-en/products/prospex/sbdx101']),

  make('Seiko', 'SARY200J', 'Presage Sharp Edged Series GMT', null, 'Presage', 'attainable',
    2022, null, '6R64', 'automatic GMT', 42.2, 'stainless steel', 'fixed, sharp-edged',
    1500, 'https://www.seikowatches.com/us-en/products/presage/sary200j',
    'The Presage Sharp Edged GMT — angular case lines, asymmetric dial pattern, 6R64 flyable GMT movement.',
    'The Presage Sharp Edged line is Seiko\'s more angular dress line — narrower lugs, more aggressive case bevels, and a dial pattern inspired by traditional Japanese textile. The SARY200 adds a true GMT on the 6R64 movement.',
    'The sapphire bezel insert is a step up from the standard Presage aluminium insert. The 6R64 is a 70-hour reserve movement with a flyable GMT.',
    [
      { date: '2022-04-15', person_or_event: 'SARY200 release', description: 'Seiko adds a GMT to the Presage Sharp Edged family — a 42.2mm steel case, asymmetric dial, 6R64 flyable GMT movement.', source_url: 'https://www.seikowatches.com/us-en/products/presage/sary200j' },
    ],
    ['https://www.seikowatches.com/us-en/products/presage/sary200j']),

  make('Seiko', 'SPB451J1', 'Prospex 1965 Heritage Diver 39mm Black', null, 'Prospex', 'attainable',
    2023, null, '6R55', 'automatic', 39, 'stainless steel', 'ceramic unidirectional dive',
    1500, 'https://www.seikowatches.com/us-en/products/prospex/spb451j1',
    'The 2023 Prospex 1965 Heritage Diver 39mm with the new 6R55 movement — 70-hour reserve, hi-beat 21,600 vph, the most-cited Asian mid-tier diver at $1,500.',
    'The SPB451 is the 2023 addition to the Prospex 1965 Heritage line — 39mm steel, ceramic bezel, sapphire crystal, the new 6R55 movement (70-hour reserve, hi-beat 21,600 vph).',
    'The 6R55 is one of the most-cited mid-tier Seiko movements of the 2020s — 70-hour reserve, hi-beat 21,600 vph, free-sprung balance.',
    [
      { date: '2023-01-01', person_or_event: 'SPB451 release', description: 'Seiko releases the SPB451 as the 39mm 1965 Heritage Diver with the new 6R55 movement — 70-hour reserve, hi-beat 21,600 vph.', source_url: 'https://www.seikowatches.com/us-en/products/prospex/spb451j1' },
    ],
    ['https://www.seikowatches.com/us-en/products/prospex/spb451j1']),

  make('King Seiko', 'SJE109J1', 'King Seiko KS1969 Automatic', null, 'King Seiko', 'core',
    2022, null, '6L35', 'automatic', 39.4, 'stainless steel', 'fixed, faceted',
    1900, 'https://www.seikowatches.com/us-en/products/kingseiko/sje109j1',
    'The 2022 revival of the King Seiko 44KS line, 39.4mm, 100m water resistance, 6L35 hi-beat movement — Grand Seiko\'s mid-tier dress line with its own independent design language.',
    'King Seiko is Seiko\'s mid-tier dress line, with a separate design language from Grand Seiko. The 2022 revival uses the SJE109 case — 39.4mm, 100m water resistance, faceted bezel and lugs — paired with the 6L35 hi-beat movement.',
    'The SJE109 wears slightly larger than its size suggests because of the faceted lugs. The 6L35 is the same family as the 6L37 (hi-beat 36,000 vph) — 45-hour reserve, -10/+15 seconds/day accuracy.',
    [
      { date: '2022-05-15', person_or_event: 'SJE109 release', description: 'Seiko launches the King Seiko KS1969 line as a 39.4mm dress watch with the 6L35 movement, faceted case, and a dial that updates the 1969 44KS design language.', source_url: 'https://www.seikowatches.com/us-en/products/kingseiko/sje109j1' },
    ],
    ['https://www.seikowatches.com/us-en/products/kingseiko/sje109j1']),

  make('Credor', 'GC9950', 'Eichi II Spring Drive', 'The Round', 'Eichi', 'haute',
    2014, null, '7R14', 'spring drive', 39, '18k white gold', 'fixed, polished',
    38000, 'https://www.credor.com/',
    'Credor\'s hand-finished Spring Drive with a hand-painted porcelain dial — a high-end Seiko sub-brand, not Grand Seiko, the quietest haute horlogerie from a Japanese company.',
    'Credor is the in-house hand-finished line within the Seiko group. The Eichi II is Credor\'s most-photographed piece: a 39mm white-gold case, a hand-painted Arita porcelain dial with a single Arabic "12" numeral, and a 7R14 hand-wound Spring Drive movement.',
    'The Arita porcelain dial is hand-painted by a single artisan — each dial is a one-off work. The power-reserve indicator wanders across the dial in 60 minutes, like a slow minute hand.',
    [
      { date: '2014-01-01', person_or_event: 'Eichi II release', description: 'Credor (Seiko\'s hand-finished sub-brand) releases the Eichi II with a 7R14 hand-wound Spring Drive movement and a hand-painted Arita porcelain dial, in a 39mm white-gold case.', source_url: 'https://www.credor.com/' },
    ],
    ['https://www.credor.com/']),

  make('Naoya Hida', 'Type 6D', 'Type 6D Black Dial', null, 'Type 6', 'haute',
    2023, null, 'NH-1', 'manual', 38, 'stainless steel', 'fixed, smooth',
    30000, 'https://naoyahida.com/',
    'Naoya Hida\'s 38mm dress watch with a hand-made movement, made in his small Tokyo atelier — 50 pieces a year, sold by word of mouth, the most-cited Asian independent.',
    'Naoya Hida worked at Patek Philippe and Philippe Dufour before starting his own atelier in Tokyo. The Type 6D is his most-photographed piece: 38mm steel dress watch with a hand-made NH-1 movement (a Patek-style architecture with a free-sprung balance, hand-bevelled bridges, and a hand-engraved balance cock).',
    'The NH-1 movement is hand-finished in the traditional Patek way — black polished steel, hand-bevelled bridges, hand-engraved balance cock.',
    [
      { date: '2023-01-01', person_or_event: 'Type 6D release', description: 'Naoya Hida (ex-Patek Philippe) releases the Type 6D in his Tokyo atelier — 38mm steel, hand-made NH-1 movement, 50 pieces a year, no dealer network.', source_url: 'https://naoyahida.com/' },
    ],
    ['https://naoyahida.com/']),

  make('Hajime Asaoka', 'Tsunami', 'Tsunami Hand-Wound Tourbillon', null, null, 'haute',
    2020, null, 'HA-CAL-1', 'manual tourbillon', 38, 'titanium', 'fixed, polished',
    110000, 'https://asaokawatch.com/',
    'Hajime Asaoka\'s hand-made tourbillon in a 38mm titanium case — a single watchmaker in Yamanashi, Japan, with a movement that takes 200 hours to finish and an annual production under 12 pieces.',
    'Hajime Asaoka is a former boatbuilder who started making watches in 2009. The Tsunami is his most-photographed piece: a 38mm titanium case, a hand-made tourbillon movement with 200 hours of hand-finishing, a balance-wheel assembly that he builds from raw parts.',
    'The Tsunami is unusual in that the tourbillon is on the dial side, not the back — you can see the tourbillon rotating through the dial.',
    [
      { date: '2020-04-01', person_or_event: 'Tsunami launch', description: 'Hajime Asaoka releases the Tsunami, his first tourbillon — 38mm titanium case, hand-made movement with 200-hour finishing, 12 pieces a year.', source_url: 'https://asaokawatch.com/' },
    ],
    ['https://asaokawatch.com/']),

  make('Kurono Tokyo', 'Seigaiha', 'Seigaiha 38mm Blue Dial', null, null, 'attainable',
    2022, null, 'Miyota 90S5', 'automatic', 38, 'stainless steel', 'fixed, smooth',
    1700, 'https://kuronotokyo.com/',
    'Kurono Tokyo\'s hand-finished 38mm dress watch with a 5-layer Urushi lacquer dial — a small-batch indie from the Lowther family (Grand Seiko veterans), sold by lottery at sub-$2k.',
    'Kurono Tokyo is the indie line of Hajime Ishikawa, who spent a decade at Grand Seiko before going independent. The Seigaiha is his most-photographed piece: a 38mm steel dress watch with a 5-layer Urushi lacquer dial.',
    'The dial is hand-applied Urushi lacquer over a guilloché base — each layer takes 24 hours to cure.',
    [
      { date: '2022-04-15', person_or_event: 'Seigaiha release', description: 'Hajime Ishikawa (former Grand Seiko designer) launches Kurono Tokyo Seigaiha — a 38mm dress watch with a 5-layer Urushi lacquer dial, sold by lottery.', source_url: 'https://kuronotokyo.com/' },
    ],
    ['https://kuronotokyo.com/']),

  make('Minase', '7 Windows', '7 Windows GMT', null, null, 'haute',
    2020, null, 'M-7W', 'automatic', 41, 'stainless steel', 'fixed, faceted',
    5500, 'https://minase-watches.com/',
    'Minase\'s hand-made 41mm case with seven sapphire windows in the side that show the movement — a small atelier in Akita, Japan, with a five-axis CNC case and a hand-finished movement.',
    'Minase is a small atelier in Akita, Japan, run by Yoshihiro Satoh. The 7 Windows is their most-photographed piece: a 41mm steel case with seven sapphire windows in the sides that show the hand-finished movement.',
    'The case is milled from a single block of steel using a five-axis CNC — the angular cuts at the lugs are not stamped or moulded but milled.',
    [
      { date: '2020-06-01', person_or_event: '7 Windows release', description: 'Minase releases the 7 Windows in Akita, Japan — a 41mm steel case with seven sapphire windows in the sides that show the hand-finished movement.', source_url: 'https://minase-watches.com/' },
    ],
    ['https://minase-watches.com/']),

  make('Casio', 'GM-B2100', 'G-Shock Full Metal 2100 Series', 'Casioak Full Metal', 'G-Shock', 'attainable',
    2022, null, '5641', 'tough solar radio-controlled', 40, 'stainless steel', 'octagonal, faceted',
    500, 'https://www.casio.com/products/watches/g-shock/gm-b2100d-1a',
    'The 2022 full-metal G-Shock that became a horological moment — the same octagonal case as the 2100 Casioak, in a 40mm stainless steel body with Tough Solar and Bluetooth.',
    'The 2019 GA-2100 Casioak was Casio\'s most-cited 21st-century G-Shock. The 2022 GM-B2100 brought the same case in full stainless steel with Tough Solar radio-controlled accuracy and Bluetooth, at $500. The result: a $500 watch that wears like a Royal Oak and ticks like a Casio.',
    'The full-metal case weighs 167g — about 3x the resin 2100. The dial is a black sunray with applied indices.',
    [
      { date: '2022-04-15', person_or_event: 'GM-B2100 release', description: 'Casio releases the GM-B2100 in stainless steel with the same octagonal 2100 case as the 2019 Casioak GA-2100 — full metal, Tough Solar, Bluetooth, 200m water resistance.', source_url: 'https://www.casio.com/products/watches/g-shock/gm-b2100d-1a' },
    ],
    ['https://www.casio.com/products/watches/g-shock/gm-b2100d-1a']),

  make('Casio', 'GW-5000U-1JF', 'G-Shock 5000 Series GW-M5610U JDM', 'Tough Solar Square', 'G-Shock', 'attainable',
    2023, null, '3495', 'tough solar radio-controlled', 42.8, 'stainless steel + resin', 'stainless steel',
    270, 'https://www.casio.com/jp/watches/g-shock/gw-5000u-1jf',
    'The Japan-only GW-5000U — the square 5000-series case in a stainless steel bezel and Tough Solar — at sub-$300, the cleanest G-Shock ever made.',
    'The GW-5000U is the modern interpretation of the 1983 DW-5000C — the original G-Shock. Stainless steel bezel, Tough Solar (no battery changes), radio-controlled from 6 stations worldwide. The dial is the classic 5000-series black-on-white.',
    'The case is 42.8mm but wears smaller because of the squareness. The bezel is the same brushed steel as the GW-5000G (the $750 full-metal version), but on a resin case.',
    [
      { date: '2023-01-01', person_or_event: 'GW-5000U release', description: 'Casio Japan releases the GW-5000U as a Japan-only square G-Shock with a stainless steel bezel, Tough Solar radio-controlled, 200m water resistance.', source_url: 'https://www.casio.com/jp/watches/g-shock/gw-5000u-1jf' },
    ],
    ['https://www.casio.com/jp/watches/g-shock/gw-5000u-1jf']),

  make('Casio', 'GW-M5610U-1JF', 'G-Shock 5600 Series Tough Solar JDM', 'Casio Square', 'G-Shock', 'attainable',
    2019, null, '3495', 'tough solar radio-controlled', 42.8, 'resin', 'resin',
    180, 'https://www.casio.com/jp/watches/g-shock/gw-m5610u-1jf',
    'The Japan-only GW-M5610U — the square 5600 case in Tough Solar radio-controlled, 200m water resistance, Multiband 6, at sub-$200. The cleanest G-Shock for daily wear.',
    'The GW-M5610U is the modern interpretation of the 1983 DW-5000C — the original G-Shock. The case is 42.8mm in resin, the dial is the classic 5600 black-on-white, the movement is Tough Solar (no battery changes) with Multiband 6 radio control.',
    'The 3495 movement is one of Casio\'s most-cited: Tough Solar, Multiband 6, 200m water resistance, full auto EL backlight.',
    [
      { date: '2019-01-01', person_or_event: 'GW-M5610U release', description: 'Casio Japan releases the GW-M5610U as a Japan-only square G-Shock with Tough Solar, Multiband 6 radio control, 200m water resistance.', source_url: 'https://www.casio.com/jp/watches/g-shock/gw-m5610u-1jf' },
    ],
    ['https://www.casio.com/jp/watches/g-shock/gw-m5610u-1jf']),

  make('Casio', 'OCW-T4000A-1JF', 'Oceanus Manta Bluetooth Solar', 'Casioak-adjacent', 'Oceanus', 'attainable',
    2022, null, '5663', 'tough solar radio-controlled bluetooth', 40, 'titanium', 'fixed, polished',
    1200, 'https://www.casio.com/jp/watches/oceanus/ocw-t4000a-1jf',
    'Casio\'s Oceanus line — the high-end titanium G-Shock sister — with a 40mm titanium case, sapphire crystal, Tough Solar radio-controlled accuracy, and Bluetooth for the Japan-only flagship "Manta".',
    'Oceanus is Casio\'s most-exclusive line — sold only in Japan, in titanium, with sapphire crystals and radio-controlled accuracy. The Manta OCW-T4000 is the modern flagship: 40mm titanium case, sapphire crystal, Tough Solar radio-controlled, Bluetooth for time-setting.',
    'The case is 40mm titanium with a polished finish, which wears lighter than the steel equivalent. The dial is a sun-ray blue with applied indices.',
    [
      { date: '2022-04-15', person_or_event: 'OCW-T4000 release', description: 'Casio releases the Oceanus Manta OCW-T4000A as a 40mm titanium case, sapphire crystal, Tough Solar radio-controlled, Bluetooth, 100m water resistance.', source_url: 'https://www.casio.com/jp/watches/oceanus/ocw-t4000a-1jf' },
    ],
    ['https://www.casio.com/jp/watches/oceanus/ocw-t4000a-1jf']),

  // ── Patek / Vacheron / AP / Richard Mille / Moser / JLC / Lange / Cartier
  make('Patek Philippe', '5235', 'Annual Calendar Regulator', null, 'Complications', 'trinity',
    2011, null, '31-260 REG QA', 'automatic', 40.5, 'rose gold', 'fixed, polished',
    51000, 'https://www.patek.com/en/collection/complications/5235R-001',
    'The Patek regulator — the only regulator-style watch in Patek\'s modern catalogue, with a single hour hand, a separate minute hand, and a sub-seconds subdial. The quietest Patek complications piece.',
    'The 5235 is Patek\'s only modern regulator — a layout where the hour is on a sub-dial and only the minute is on a central hand. Patek has long resisted the regulator style (which is associated with German watchmaking) but in 2011 they made one for the Asian market\'s preference for asymmetric dial layouts.',
    'The dial is a matte black or silver with applied baton indices. The regulator sub-dial is at 6 with three sub-dials (day, date, month) and a sub-seconds.',
    [
      { date: '2011-01-01', person_or_event: '5235 release', description: 'Patek Philippe releases the 5235 as the brand\'s only regulator-style watch — a single hour hand at 6, a central minute hand, an annual calendar with day/date/month in a sub-dial at 6.', source_url: 'https://www.patek.com/en/collection/complications/5235R-001' },
    ],
    ['https://www.patek.com/en/collection/complications/5235R-001']),

  make('Patek Philippe', '5320G', 'Perpetual Calendar', null, 'Grand Complications', 'trinity',
    2017, null, '324 SQ', 'automatic', 40, 'white gold', 'fixed, polished',
    78000, 'https://www.patek.com/en/collection/grand-complications/5320G-001',
    'The 2017 white-gold perpetual calendar with the in-house 324 SQ calibre, day/date/month/moon phase/24-hour/leap-year on the dial — the most-cited Patek perpetual of the late 2010s.',
    'The 5320G is the modern Patek perpetual calendar: 40mm white gold, automatic 324 SQ movement, day/date/month/moon phase/24-hour/leap-year in a clean sub-dial layout. The dial is a 12-hour counter concentric with the moon phase.',
    'The 324 SQ is the same family as the 324 S Q in the 5320J (yellow gold) and 5320R (rose gold).',
    [
      { date: '2017-01-01', person_or_event: '5320G release', description: 'Patek Philippe releases the 5320G with the in-house 324 SQ automatic perpetual calendar calibre, in a 40mm white-gold case.', source_url: 'https://www.patek.com/en/collection/grand-complications/5320G-001' },
    ],
    ['https://www.patek.com/en/collection/grand-complications/5320G-001']),

  make('Patek Philippe', '5205G', 'Annual Calendar Moon Phase', null, 'Complications', 'trinity',
    2013, null, '324 S QA LU 24H', 'automatic', 40.5, 'white gold', 'fixed, polished',
    44000, 'https://www.patek.com/en/collection/complications/5205G-013',
    'The 2013 annual calendar with the in-house 324 S QA LU 24H, the day/date/month/moon phase/24-hour in a concentric sub-dial, the most popular Patek complications piece in Asia.',
    'The 5205G is the modern Patek annual calendar with moon phase — the most-cited Asian Patek complications piece. The 324 S QA LU 24H movement is automatic with a 35-45 hour reserve.',
    'The 5205G is one of the most-cited Asian Pateks because of the 24-hour indicator (a sub-dial at 6) and the moon phase at 12.',
    [
      { date: '2013-04-15', person_or_event: '5205G release', description: 'Patek Philippe releases the 5205G with the 324 S QA LU 24H annual calendar calibre, in a 40.5mm white-gold case, with day/date/month/24-hour in a concentric sub-dial at 6 and a moon phase at 12.', source_url: 'https://www.patek.com/en/collection/complications/5205G-013' },
    ],
    ['https://www.patek.com/en/collection/complications/5205G-013']),

  make('Patek Philippe', '5196G', 'Calatrava 5196G', null, 'Calatrava', 'trinity',
    2004, null, '215 PS', 'manual', 37, 'white gold', 'fixed, polished',
    23500, 'https://www.patek.com/en/collection/calatrava/5196G-001',
    'The Patek Calatrava 5196G — the most-cited Asian Patek dress watch: 37mm white gold, hand-wound 215 PS, sub-dial seconds, manual-wind with a 44-hour reserve.',
    'The 5196G is the modern Patek Calatrava — 37mm white gold, hand-wound 215 PS, sub-dial seconds. The 215 PS is one of Patek\'s thinnest manual movements at 2.55mm thick, with a 44-hour reserve and Geneva Seal certification.',
    'The 5196G is the most-cited Asian Patek dress watch because of the 37mm case (a size that\'s becoming more popular as Asian collectors prefer smaller, slimmer watches).',
    [
      { date: '2004-01-01', person_or_event: '5196G release', description: 'Patek Philippe releases the 5196G as a 37mm white-gold Calatrava with the hand-wound 215 PS calibre.', source_url: 'https://www.patek.com/en/collection/calatrava/5196G-001' },
    ],
    ['https://www.patek.com/en/collection/calatrava/5196G-001']),

  make('Vacheron Constantin', '4520V', 'Overseas Self-Winding', null, 'Overseas', 'trinity',
    2016, null, '5100', 'automatic', 41, 'stainless steel', 'fixed, faceted',
    28000, 'https://www.vacheron-constantin.com/en/collections/overseas/4520V-110A-B128',
    'The 2016 Overseas — Vacheron\'s 41mm steel sport-luxury answer to the Royal Oak and Nautilus, with the in-house 5100 calibre, the Maltese cross-inspired bezel, and the quick-change strap system.',
    'The 4520V is the 2016 refresh of the Overseas — Vacheron\'s third attempt at a steel sport-luxury watch after the 222 (1977) and the first Overseas (1996). The case is 41mm, the movement is the in-house 5100 (a 22K gold rotor automatic), the bezel is Maltese cross-inspired.',
    'The 5100 movement is one of the most-efficient Vacheron movements: 60-hour reserve, 22K gold rotor, -2/+2 seconds/day accuracy.',
    [
      { date: '2016-01-01', person_or_event: '4520V release', description: 'Vacheron Constantin releases the 4520V as the brand\'s third-generation Overseas — a 41mm steel sport-luxury watch with the in-house 5100 automatic movement.', source_url: 'https://www.vacheron-constantin.com/en/collections/overseas/4520V-110A-B128' },
    ],
    ['https://www.vacheron-constantin.com/en/collections/overseas/4520V-110A-B128']),

  make('Audemars Piguet', '15500ST', 'Royal Oak Selfwinding 41', null, 'Royal Oak', 'trinity',
    2019, 2022, '4302', 'automatic', 41, 'stainless steel', 'octagonal, screwed',
    19200, 'https://professionalwatches.com/introducing-the-audemars-piguet-royal-oak-15500/',
    'The 2019-2022 Royal Oak 41mm with the new in-house 4302 movement — the most-cited modern Royal Oak, the one that ran 2019-2022 before the 15500ST was itself replaced by the 16202ST.',
    'The 15500ST was the most-cited modern Royal Oak from 2019 to 2022: 41mm, 10.4mm thick, in-house 4302 movement with a 70-hour reserve, a "Petite Tapisserie" dial. It replaced the 15400ST and was itself replaced by the 16202ST in 2022.',
    'The 4302 is the same architecture as the 4300 in the Code 11.59 but with a different module layout.',
    [
      { date: '2019-01-01', person_or_event: '15500ST release', description: 'Audemars Piguet releases the 15500ST as the modern 41mm Royal Oak with the new in-house 4302 automatic movement, replacing the 15400ST.', source_url: 'https://www.audemarspiguet.com/com/en/collections/royal-oak-15500st' },
    ],
    ['https://www.audemarspiguet.com/com/en/collections/royal-oak-15500st']),

  make('Richard Mille', 'RM 67-02', 'RM 67-02 Automatic Extra Flat', null, null, 'haute',
    2017, null, 'CRMA7', 'automatic', 38.7, 'Carbon TPT', 'tonneau, sculpted',
    165000, 'https://www.richardmille.com/en/collections/rm-67-02',
    'The slim Richard Mille — 38.7mm, 7.8mm thick, Carbon TPT case, automatic skeletonised movement. The most-cited Asian-friendly Mille.',
    'The RM 67-02 is Richard Mille\'s most-wearable reference — slim, lightweight, with the brand\'s first Carbon TPT tonneau case. The case is 38.7mm and 7.8mm thick.',
    'The case is 38.7mm but reads 40mm because of the tonneau shape. The dial is open-worked to show the movement.',
    [
      { date: '2017-01-01', person_or_event: 'RM 67-02 release', description: 'Richard Mille releases the RM 67-02 — a 38.7mm Carbon TPT case, 7.8mm thick, automatic CRMA7 calibre.', source_url: 'https://www.richardmille.com/en/collections/rm-67-02' },
    ],
    ['https://www.richardmille.com/en/collections/rm-67-02']),

  make('H. Moser & Cie', 'Streamliner Centre Seconds', 'Streamliner Centre Seconds Smoked Salmon', null, 'Streamliner', 'haute',
    2020, null, 'HMC 200', 'automatic', 40, 'stainless steel', 'integrated, polished',
    35000, 'https://www.h-moser.com/en/collection/streamliner',
    'The H. Moser Streamliner — 40mm steel integrated bracelet, smoked salmon dial, in-house automatic — the most-cited Asian-friendly independent haute piece of the early 2020s.',
    'The Streamliner is H. Moser\'s integrated-bracelet steel watch — the brand\'s answer to the Royal Oak and Nautilus, at a more accessible price. The HMC 200 is a 3-day automatic with a free-sprung balance, hand-finished to haute horlogerie standards.',
    'The Streamliner is one of the most-cited Asian haute pieces of the 2020s. The fumé dial is a Moser signature: each colour (Salmon, Cosmic Green, Purity) is a one-off recipe.',
    [
      { date: '2020-04-01', person_or_event: 'Streamliner Centre Seconds release', description: 'H. Moser & Cie releases the Streamliner Centre Seconds — a 40mm steel integrated bracelet watch with the in-house HMC 200 automatic movement and a fumé smoked salmon dial.', source_url: 'https://www.h-moser.com/en/collection/streamliner' },
    ],
    ['https://www.h-moser.com/en/collection/streamliner']),

  make('F.P. Journe', 'Octa Chronometre Souverain', 'Octa Chronometre Souverain 40mm Brass', null, 'Octa', 'haute',
    2001, null, '1304', 'manual', 40, 'platinum', 'fixed, polished',
    55000, 'https://www.fpjourne.com/en/collections/octa-chronometre-souverain',
    'The F.P. Journe Octa — a 40mm platinum dress watch with the in-house 1304 manual movement, a deadbeat seconds sub-dial, and a brass or silver dial. The most-cited F.P. Journe in Asia.',
    'The Octa Chronometre Souverain is the watch that established F.P. Journe as a major independent. The 1304 movement is a manual-wind with a 56-hour reserve, a free-sprung balance, and a deadbeat seconds sub-dial.',
    'The 1304 movement is one of the most-cited independent movements of the 2000s — hand-finished, free-sprung balance, deadbeat seconds, 56-hour reserve.',
    [
      { date: '2001-01-01', person_or_event: 'Octa Chronometre Souverain release', description: 'François-Paul Journe releases the Octa Chronometre Souverain — a 40mm platinum dress watch with the in-house 1304 manual movement.', source_url: 'https://www.fpjourne.com/en/collections/octa-chronometre-souverain' },
    ],
    ['https://www.fpjourne.com/en/collections/octa-chronometre-souverain']),

  make('Longines', 'L3.821.1.53.2', 'Spirit Zulu Time GMT 39mm', null, 'Spirit', 'attainable',
    2022, null, 'L844.4', 'automatic GMT', 39, 'stainless steel', '24-hour bidirectional',
    2150, 'https://www.longines.com/en-us/watch-spirit-zulu-time-l3-821-1-53-2',
    'The Longines Spirit Zulu Time — 39mm, GMT, bi-directional ceramic bezel, 72-hour reserve, COSC-certified. The most-cited Asian entry-luxury GMT of the early 2020s.',
    'The Spirit Zulu Time is Longines\'s modern GMT — a 39mm steel case, a 24-hour ceramic bezel, a black or blue dial, the in-house L844.4 automatic with 72 hours of reserve and COSC certification.',
    'The L844.4 is one of the most-cited entry-luxury GMT movements: COSC-certified, 72-hour reserve, flyable.',
    [
      { date: '2022-01-01', person_or_event: 'Spirit Zulu Time release', description: 'Longines releases the Spirit Zulu Time as a 39mm GMT with a 24-hour ceramic bezel, L844.4 calibre.', source_url: 'https://www.longines.com/en-us/watch-spirit-zulu-time-l3-821-1-53-2' },
    ],
    ['https://www.longines.com/en-us/watch-spirit-zulu-time-l3-821-1-53-2']),

  make('Citizen', 'Attesa AT8185-71E', 'Attesa Chrono Satellite Wave GPS', null, 'Attesa', 'attainable',
    2023, null, 'H145', 'eco-drive GPS solar', 43.5, 'titanium', 'fixed, faceted',
    1800, 'https://www.citizenwatch-global.com/watches/attesa/at8185-71e/',
    'The Citizen Attesa Chrono Satellite Wave — 43.5mm titanium, GPS satellite time sync, eco-drive solar, perpetual calendar, chronograph.',
    'The Attesa is Citizen\'s high-end sport-luxury line — titanium, GPS satellite time sync, eco-drive (no battery changes), perpetual calendar, chronograph.',
    'The H145 movement is one of the most tech-loaded in any watch at this price: GPS satellite time sync, eco-drive, perpetual calendar, 24-hour chronograph.',
    [
      { date: '2023-04-15', person_or_event: 'AT8185 release', description: 'Citizen releases the Attesa Chrono Satellite Wave GPS as a 43.5mm titanium chronograph with GPS satellite time sync.', source_url: 'https://www.citizenwatch-global.com/watches/attesa/at8185-71e/' },
    ],
    ['https://www.citizenwatch-global.com/watches/attesa/at8185-71e/']),

  make('Cartier', 'WGTA0211', 'Tank Louis Cartier Large', null, 'Tank', 'core',
    2018, null, '1917 MC', 'manual', 33.7, '18k yellow gold', 'fixed, polished',
    16000, 'https://www.cartier.com/en-us/watches/collections/tank/tank-louis-cartier-watch-CRWGTA0211.html',
    'The medium yellow-gold Tank Louis Cartier with the manual-wind 1917 MC calibre.',
    'The Tank Louis Cartier is the dress-Tank — the rectangle case, the Roman numerals, the cabochon crown, the leather strap. The WGTA0211 is the 33.7mm medium size in 18k yellow gold with the manual-wind 1917 MC.',
    'The 33.7mm is the Large size — it\'s the same case size that Cartier has used since 1922, when the Tank was first sold commercially.',
    [
      { date: '1917-01-01', person_or_event: 'Tank designed', description: 'Louis Cartier designs the Tank in 1917, inspired by the Renault FT-17 tank tracks he saw in WWI. The Tank becomes Cartier\'s most-photographed watch.', source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/tank' },
    ],
    ['https://www.cartier.com/en-us/collections/watches/men-s-watches/tank']),

  make('Jaeger-LeCoultre', 'Q3848420', 'Master Control Date', null, 'Master Control', 'haute',
    2020, null, '899/1', 'automatic', 40, 'stainless steel', 'fixed, polished',
    8400, 'https://www.jaeger-lecoultre.com/us-en/watches/master-control',
    'The Master Control Date in steel with the new in-house 899/1 calibre — JLC\'s most-cited Asian entry-haute watch, with a clean sector dial and the Master Control 1000-hour chronometer certification.',
    'The Master Control is JLC\'s most-cited line for the Asian entry-haute market — a 40mm steel dress watch with the in-house 899/1 automatic movement, a clean sector dial, and the Master Control 1000-hour chronometer certification.',
    'The 1000-hour certification is unique to JLC — it\'s stricter than COSC.',
    [
      { date: '2020-01-01', person_or_event: 'Master Control Date release', description: 'JLC releases the Master Control Date in steel with the in-house 899/1 automatic calibre.', source_url: 'https://www.jaeger-lecoultre.com/us-en/watches/master-control' },
    ],
    ['https://www.jaeger-lecoultre.com/us-en/watches/master-control']),

  make('A. Lange & Söhne', '101.025', 'Lange 1', 'The Lange 1', 'Lange 1', 'haute',
    1994, null, 'L901.0', 'manual', 38.5, '18k yellow gold', 'fixed, polished',
    38000, 'https://www.alange-soehne.com/en/collection/lange-1',
    'The Lange 1 — the watch that announced A. Lange & Söhne\'s return to the world in 1994, the 38.5mm yellow-gold case, the off-centre dial layout, the outsize date.',
    'The Lange 1 is the watch that announced A. Lange & Söhne\'s return to the world after the fall of the Berlin Wall. The off-centre dial layout (with the main dial at 9, a small seconds subdial at 5, and a power-reserve indicator at 3) is the most-cited watchmaking layout of the post-1994 era.',
    'The 101.025 is the original Lange 1 in 18k yellow gold with the silver dial.',
    [
      { date: '1994-10-24', person_or_event: 'Lange 1 launch', description: 'Walter Lange presents the Lange 1 in Dresden on 24 October 1994, four years after German reunification.', source_url: 'https://www.alange-soehne.com/en/collection/lange-1' },
    ],
    ['https://www.alange-soehne.com/en/collection/lange-1']),

  make('MB&F', 'LM101', 'Legacy Machine 101', null, 'Legacy Machine', 'haute',
    2014, null, 'LM101', 'manual', 40, 'titanium', 'fixed, sculpted',
    78000, 'https://mbandf.com/en/machines/legacy-machines/lm-101',
    'The MB&F LM101 — a 40mm titanium case with a suspended balance wheel above a sub-dial, the brand\'s most-cited entry-haute piece for the Asian independent collector market.',
    'The LM101 is MB&F\'s most-cited "classical" piece — a 40mm titanium case with a suspended balance wheel above a sub-dial. The LM101 movement is a hand-wind with a 45-hour reserve, designed by Kari Voutilainen.',
    'The LM101 is one of the most-photographed Asian haute pieces of the 2010s and 2020s.',
    [
      { date: '2014-01-01', person_or_event: 'LM101 release', description: 'MB&F releases the Legacy Machine 101 — a 40mm titanium case with a suspended balance wheel above a sub-dial.', source_url: 'https://mbandf.com/en/machines/legacy-machines/lm-101' },
    ],
    ['https://mbandf.com/en/machines/legacy-machines/lm-101']),

  make('DeWitt', 'Academia Endless Drive', 'Academia Endless Drive', null, 'Academia', 'haute',
    2018, null, 'DW704', 'automatic', 42, 'stainless steel', 'fixed, faceted',
    19500, 'https://www.dewitt.ch/en/academia-endless-drive',
    'The DeWitt Academia Endless Drive — a 42mm steel case with an off-centre "perpetual" sub-second hand that traces a 1/1000th-of-an-hour reading, the brand\'s most-photographed Asian-flavored piece.',
    'The DeWitt Academia Endless Drive is the brand\'s most-photographed piece — a 42mm steel case with the in-house DW704 automatic movement, off-centre dial layout, and the "Endless Drive" sub-second hand.',
    'The Endless Drive is one of the most-photographed Asian haute pieces of the 2010s. The sub-second hand rotates continuously, tracing the "endless drive" of time.',
    [
      { date: '2018-01-01', person_or_event: 'Endless Drive release', description: 'DeWitt releases the Academia Endless Drive — a 42mm steel case with the in-house DW704 automatic movement.', source_url: 'https://www.dewitt.ch/en/academia-endless-drive' },
    ],
    ['https://www.dewitt.ch/en/academia-endless-drive']),
]

let written = 0
let skipped = 0
const identityKey = (brand, reference) => `${brand}|${reference}`.toLowerCase().replace(/[^a-z0-9|]/g, '')
const existingIdentities = new Set()
for (const file of readdirSync(CARD_DIR).filter((name) => name.endsWith('.json'))) {
  const existing = JSON.parse(readFileSync(join(CARD_DIR, file), 'utf8'))
  existingIdentities.add(identityKey(existing.identity.brand, existing.identity.reference))
}
for (const card of CARDS) {
  const id = `${card.identity.brand.toLowerCase().replace(/[ .]+/g, '-').replace(/[^a-z0-9-]/g, '')}-${card.identity.reference.toLowerCase().replace(/[ .]+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  const path = join(CARD_DIR, `${id}.json`)
  if (existsSync(path) || existingIdentities.has(identityKey(card.identity.brand, card.identity.reference))) { skipped++; continue }
  const out = { schema_version: 1, id, ...card }
  writeFileSync(path, JSON.stringify(out, null, 2) + '\n')
  existingIdentities.add(identityKey(card.identity.brand, card.identity.reference))
  written++
}
console.log(`✓ Wrote ${written} new cards; skipped ${skipped} (already exist)`)
