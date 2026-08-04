#!/usr/bin/env node
// Seed the global-coverage pass: adds brands and references that a watch
// audience in Thai and global markets would expect to find in a complete
// register — Orient, Oris, Nomos, Blancpain, Hublot, Chopard, Breguet,
// Bell & Ross, Glashütte Original, Timex, plus Citizen/Seiko/Casio staples.
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
      limited_edition: { is_limited: false, stated_size: null, source_url: null },
      waitlist_evidence: [],
      auction_appearances_5y: null,
    },
    provenance_events: c.provs ?? [],
    narrative: {
      story: c.story,
      collector_notes: c.collector_notes ?? '',
      starter_alternative: c.starter_alt ?? null,
    },
    meta: {
      curated_by: 'agent-global-coverage',
      curated_date: DATE,
      sources: [c.msrp_url, ...(c.extra_sources ?? [])].filter(Boolean),
    },
  }
}

const CARDS = [
  // ─── ORIENT (3) — the entry-mechanical brand of SEA ───────────────────────
  make({
    id: 'orient-bambino-v4-ra-ac0900',
    brand: 'Orient', reference: 'RA-AC0900L',
    name: 'Bambino Version IV', nickname: 'Bambino', collection: 'Bambino', tier: 'attainable',
    start_year: 2022, discontinued: false,
    caliber: 'F6724', type: 'automatic', mm: 40.5, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 330, msrp_year: 2022, msrp_url: 'https://orientwatch.com/collections/bambino',
    one_liner: 'The affordable dress automatic that defined entry-level mechanical watchmaking for a generation of collectors across Asia and beyond.',
    story: 'The Bambino Version IV refines the 2012 original with a domed mineral crystal, a sunburst domed dial, and Orient\'s in-house F6724 caliber — hand-winding and hacking, both rare at this price point. The 40.5mm case and 21mm lug width give it a presence that reads above its cost. The Bambino has been Orient\'s most-cited dress watch since the first version launched, and the V4 is the most refined of the series.',
    collector_notes: 'The F6724 replaced the earlier 46943 in the Bambino line, adding hand-wind and hacking. Check domed crystal height — the V4 sits taller than the V1-V3.',
    starter_alt: null,
  }),
  make({
    id: 'orient-kamasu-ra-aa0003',
    brand: 'Orient', reference: 'RA-AA0003R19B',
    name: 'Kamasu', nickname: 'Kamasu', collection: 'Mako', tier: 'attainable',
    start_year: 2019, discontinued: false,
    caliber: 'F6724', type: 'automatic', mm: 41.8, material: 'stainless steel', bezel: 'unidirectional 60-min dive',
    msrp_usd: 225, msrp_year: 2019, msrp_url: 'https://orientwatch.com/collections/mako-kamasu',
    one_liner: 'The sub-$250 automatic dive watch with sapphire crystal, 200m water resistance, and hacking — the most-recommended entry diver in Southeast Asia.',
    story: 'The Kamasu (Japanese for barracuda) pairs Orient\'s in-house F6724 automatic with a sapphire crystal and 200m water resistance at a price that undercuts Seiko and Citizen by a wide margin. Orient sells it in Asia under the Mako III name; the Kamasu designation is the one most collectors cite. It is the most-recommended sub-$300 automatic dive watch in the SEA market and the watch a first-time buyer lands on before graduating to a Seiko Prospex or a Tudor Black Bay.',
    collector_notes: 'The Kamasu and the Mako III share the same F6724 movement and case; the naming varies by market. Sapphire crystal and a solid end-link bracelet distinguish it from the older Mako II.',
    starter_alt: null,
  }),
  make({
    id: 'orient-star-semi-skeleton-re-au0002',
    brand: 'Orient', reference: 'RE-AU0002L00B',
    name: 'Orient Star Semi-Skeleton', nickname: null, collection: 'Orient Star', tier: 'attainable',
    start_year: 2020, discontinued: false,
    caliber: 'F6N47', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 695, msrp_year: 2020, msrp_url: 'https://orientwatch.jp/en/collections/orient-star/',
    one_liner: 'The higher-tier Orient Star with a semi-skeleton open heart — the gateway to Japanese manufacture watchmaking at the sub-$700 price point.',
    story: 'The Orient Star line sits above the standard Orient range in finish, movement decoration, and case execution. The Semi-Skeleton exposes part of the in-house F6N47 caliber through an open-heart window at 9 o\'clock. The 40mm case, sapphire crystal with anti-reflective coating, and 50-hour reserve put it in direct competition with entry Seiko Presage and Tissot. In the Asian market it is the watch a buyer chooses when they want mechanical watchmaking with visible decoration at the sub-$700 tier.',
    collector_notes: 'The F6N47 is a decorated version of the F6 series with a semi-skeleton bridge. Orient Star models are assembled in Japan, unlike the standard Orient range.',
    starter_alt: null,
  }),

  // ─── ORIS (3) — the independent Swiss manufacture ─────────────────────────
  make({
    id: 'oris-aquis-calibre-400',
    brand: 'Oris', reference: '01 400 7763 4151',
    name: 'Aquis Calibre 400 Date', nickname: 'Aquis', collection: 'Aquis', tier: 'core',
    start_year: 2020, discontinued: false,
    caliber: 'Oris 400', type: 'automatic', mm: 41.5, material: 'stainless steel', bezel: 'ceramic unidirectional 60-min',
    msrp_usd: 3800, msrp_year: 2020, msrp_url: 'https://www.oris.ch/en/watch-collection/divers/aquis-date',
    one_liner: 'The Aquis dive watch with Oris\'s first in-house 5-day automatic caliber — the movement that moved Oris from base-Sellita to a true manufacture.',
    story: 'The Calibre 400, launched in 2020, is Oris\'s first in-house automatic movement in a generation: a 120-hour (5-day) power reserve, anti-magnetic to 2,250 gauss, and a 10-year service interval. The Aquis case — 41.5mm with the trademark integrated crown protector — had been Oris\'s flagship diver since 2011. The Calibre 400 replaced the Sellita-based Oris 733 inside it. The Aquis Calibre 400 is the most-cited modern Oris and the watch that re-positioned the brand from a Sellita-base house to a credible independent manufacture.',
    collector_notes: 'The Calibre 400 is a true manufacture movement designed in-house. Earlier Aquis models used the Sellita SW200-1-based Oris 733 — check the caseback marking.',
    starter_alt: 'orient-kamasu-ra-aa0003',
  }),
  make({
    id: 'oris-divers-sixty-five',
    brand: 'Oris', reference: '01 733 7764 4054',
    name: 'Divers Sixty-Five', nickname: 'Divers 65', collection: 'Divers', tier: 'core',
    start_year: 2015, discontinued: false,
    caliber: 'Oris 733', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'aluminum unidirectional 60-min',
    msrp_usd: 2200, msrp_year: 2015, msrp_url: 'https://www.oris.ch/en/watch-collection/divers/divers-sixty-five',
    one_liner: 'The 2015 reissue of Oris\'s 1965 dive watch — 40mm, vintage proportions, the most-cited modern Oris diver before the Calibre 400.',
    story: 'The Divers Sixty-Five is the reissue of the 1965 Oris dive watch (ref. 6518), scaled to 40mm from the original 36mm. The Oris 733 caliber is a Sellita SW200-1 base with a 38-hour reserve. The domed sapphire crystal and the thin aluminum bezel give it a vintage profile that reads closer to a 1960s watch than any modern diver at the $2,200 price point. The Divers Sixty-Five is the most-cited Oris diver before the Calibre 400 era.',
    collector_notes: 'The Divers Sixty-Five is available in 36mm, 40mm, and 42mm. The 40mm is the most-cited size. The 733 caliber is Sellita-based; the later Calibre 400 version (2023) added the 5-day reserve.',
    starter_alt: 'orient-kamasu-ra-aa0003',
  }),
  make({
    id: 'oris-big-crown-pointer-date',
    brand: 'Oris', reference: '01 754 7779 4054',
    name: 'Big Crown Pointer Date', nickname: 'Pointer Date', collection: 'Aviation', tier: 'core',
    start_year: 2019, discontinued: false,
    caliber: 'Oris 754', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'coin-edge fluted',
    msrp_usd: 2200, msrp_year: 2019, msrp_url: 'https://www.oris.ch/en/watch-collection/aviation/big-crown-pointer-date',
    one_liner: 'The pointer-date complication on a coin-edge Aviator case — the only series-production automatic with a center-hand date complication at this price point.',
    story: 'The Big Crown Pointer Date pairs Oris\'s 754 caliber (a Sellita SW200-1 with an in-house pointer-date module) with the 1938 Big Crown aviation case — the coin-edge bezel and the oversized crown are the 1938 originals. The pointer-date complication — a fourth hand that points to a date scale on the dial periphery — is rare in series production and unique at this price. The Big Crown Pointer Date is the most-cited Oris non-diver and the watch a collector cites when they want a complication no Swiss competitor offers at the $2,200 price point.',
    collector_notes: 'The pointer-date module is an in-house Oris design on a Sellita base. The Big Crown line dates to 1938; the coin-edge bezel and oversized crown are original design elements.',
    starter_alt: 'orient-bambino-v4-ra-ac0900',
  }),

  // ─── NOMOS GLASHÜTTE (3) — Bauhaus German manufacture ─────────────────────
  make({
    id: 'nomos-tangente-38-164',
    brand: 'Nomos Glashütte', reference: '164',
    name: 'Tangente 38', nickname: 'Tangente', collection: 'Tangente', tier: 'haute',
    start_year: 1992, discontinued: false,
    caliber: 'Alpha', type: 'manual', mm: 37.5, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 2280, msrp_year: 2020, msrp_url: 'https://nomos-glashuette.com/en/collections/tangente',
    one_liner: 'The German Bauhaus dress watch that has defined Nomos Glashütte since 1992 — a hand-wound manufacture movement in a pared-down steel case.',
    story: 'The Tangente has been Nomos\'s most-cited model since the brand\'s 1990 founding in Glashütte, Saxony. The Alpha caliber is Nomos\'s first in-house movement, a hand-wound movement with a 43-hour reserve and a Glashütte three-quarter plate. The 37.5mm stainless steel case, the thin bezel, and the printed Arabic numerals are the Tangente\'s unchanged design language since 1992. The Tangente 38 is the most-cited affordable German manufacture watch and the reference a collector cites when arguing that Glashütte watchmaking is not limited to the higher-priced A. Lange & Söhne.',
    collector_notes: 'The Alpha caliber was Nomos\'s first in-house movement (launched 2005). Earlier Tangente models used a Peseux 7001 base. The "38" in the name refers to the 37.5mm case diameter.',
    starter_alt: 'orient-bambino-v4-ra-ac0900',
  }),
  make({
    id: 'nomos-club-campus-710',
    brand: 'Nomos Glashütte', reference: '710',
    name: 'Club Campus', nickname: 'Campus', collection: 'Club', tier: 'haute',
    start_year: 2017, discontinued: false,
    caliber: 'Alpha', type: 'manual', mm: 36.4, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 1780, msrp_year: 2017, msrp_url: 'https://nomos-glashuette.com/en/collections/club',
    one_liner: 'The entry Nomos — a 36.4mm hand-wound with the Alpha manufacture caliber, designed as the first serious mechanical watch for students and young collectors.',
    story: 'The Club Campus is the entry point to Nomos\'s manufacture lineup: the same Alpha hand-wind movement as the Tangente, in a smaller 36.4mm case with a more casual dial. Nomos designed the Campus line for students and first-time buyers, and the caseback is engravable — a deliberate gesture toward the graduation-gift market. The Club Campus is the most-cited entry German manufacture watch and the watch a collector cites when they want Glashütte watchmaking under $2,000.',
    collector_notes: 'The Club line dates to 1992. The Campus variant (2017) uses the same Alpha movement but drops the date and simplifies the dial.',
    starter_alt: 'orient-bambino-v4-ra-ac0900',
  }),
  make({
    id: 'nomos-metro-1102',
    brand: 'Nomos Glashütte', reference: '1102',
    name: 'Metro 38 Datum', nickname: 'Metro', collection: 'Metro', tier: 'haute',
    start_year: 2014, discontinued: false,
    caliber: 'DUW 4401', type: 'manual', mm: 37, material: 'stainless steel', bezel: 'wire-lug thin',
    msrp_usd: 4200, msrp_year: 2020, msrp_url: 'https://nomos-glashuette.com/en/collections/metro',
    one_liner: 'The Metro with Nomos\'s in-house swing-system escapement — the watch that proved the brand could build its own escapement.',
    story: 'The Metro (2014) was the first Nomos to carry the DUW 4401 caliber with the Nomos Swing System — the brand\'s in-house-designed escapement, balance wheel, balance spring, and pallet fork. Before the Swing System, Nomos sourced escapement components from Swiss suppliers. The Metro\'s 37mm case with wire lugs and the distinctive two-tone minute track is a design by Mark Braun. The Metro 38 Datum is the most-cited Nomos above the entry tier and the watch a collector cites when arguing Nomos is a full manufacture, not a design house with sourced movements.',
    collector_notes: 'The Nomos Swing System (2014) is the brand\'s first fully in-house escapement. Wire lugs and the Braun-designed minute track distinguish it from the Tangente.',
    starter_alt: 'orient-bambino-v4-ra-ac0900',
  }),

  // ─── BLANCPAIN (2) — the original luxury diver ────────────────────────────
  make({
    id: 'blancpain-fifty-fathoms-5015',
    brand: 'Blancpain', reference: '5015-12B40-NABA',
    name: 'Fifty Fathoms', nickname: null, collection: 'Fifty Fathoms', tier: 'core',
    start_year: 2007, discontinued: false,
    caliber: '1315', type: 'automatic', mm: 45, material: 'stainless steel', bezel: 'sapphire unidirectional 60-min',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 45mm modern Fifty Fathoms with sapphire bezel and the 1315 caliber — the dive watch that predates the Submariner and defined the luxury dive category.',
    story: 'Blancpain launched the Fifty Fathoms in 1953, a year before the Rolex Submariner, and the original was specified by French Navy combat swimmers (Robert Maloubier and Claude Riffaud). The modern 5015 reissue (2007) scales the case to 45mm, uses a sapphire crystal bezel (not aluminum or ceramic), and houses the in-house 1315 caliber with a 120-hour reserve. The Fifty Fathoms is the oldest continuously-produced luxury dive watch and the one a collector cites when arguing that the dive-watch category did not begin with the Submariner.',
    collector_notes: 'The sapphire bezel is a Blancpain signature — most competitors use ceramic. The 1315 has a 120-hour (5-day) reserve with three barrels. The 45mm case wears large; the 43mm Bathyscaphe is the smaller alternative.',
    starter_alt: 'orient-kamasu-ra-aa0003',
    extra_sources: ['https://www.blancpain.com/en/fifty-fathoms'],
  }),
  make({
    id: 'blancpain-bathyscaphe-5000',
    brand: 'Blancpain', reference: '5000-1110-B52A',
    name: 'Fifty Fathoms Bathyscaphe', nickname: 'Bathyscaphe', collection: 'Fifty Fathoms', tier: 'core',
    start_year: 2013, discontinued: false,
    caliber: '1315', type: 'automatic', mm: 43, material: 'stainless steel', bezel: 'ceramic unidirectional 60-min',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 43mm Bathyscaphe — the smaller, more wearable Fifty Fathoms with a ceramic bezel and the 1315 caliber, designed as the everyday-luxury diver.',
    story: 'The Bathyscaphe line references the 1956 Blancpain Bathyscaphe (named for Auguste Piccard\'s deep-sea submersible). The 2013 reissue scaled the Fifty Fathoms case down from 45mm to 43mm and swapped the sapphire bezel for ceramic — a lighter, more everyday wearable result. The 1315 caliber (120-hour reserve) is the same as in the 45mm Fifty Fathoms. The Bathyscaphe is the most-cited modern Blancpain for daily wear and the watch a collector cites when they want the Fifty Fathoms heritage in a case that fits under a cuff.',
    collector_notes: 'The Bathyscaphe is 43mm vs the Fifty Fathoms 45mm; the bezel is ceramic (not the sapphire of the 45mm). The 1315 caliber runs at 28,800 vph with a 120-hour reserve.',
    starter_alt: 'orient-kamasu-ra-aa0003',
    extra_sources: ['https://www.blancpain.com/en/fifty-fathoms/bathyscaphe'],
  }),

  // ─── HUBLOT (2) ───────────────────────────────────────────────────────────
  make({
    id: 'hublot-big-bang-unico-421-nx',
    brand: 'Hublot', reference: '421.NX.1177.RX',
    name: 'Big Bang Unico', nickname: null, collection: 'Big Bang', tier: 'core',
    start_year: 2018, discontinued: false,
    caliber: 'HUB1280', type: 'automatic chronograph', mm: 42, material: 'titanium', bezel: 'brushed titanium 6-screw',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 42mm Big Bang Unico flyback chronograph with Hublot\'s in-house HUB1280 caliber — the watch that defined the modern Hublot identity.',
    story: 'The Big Bang line launched in 2005 under Jean-Claude Biver; the Unico variant (2018) houses Hublot\'s in-house HUB1280 flyback chronograph caliber — a column-wheel, vertical-clutch movement with a 72-hour reserve. The 42mm titanium case uses Hublot\'s "Art of Fusion" construction: a layered case middle with exposed 6-screw bezel. The Big Bang Unico is the most-cited modern Hublot and the watch a collector cites when they want a flyback chronograph with a recognizable case design that is not a Daytona or a Royal Oak Offshore.',
    collector_notes: 'The HUB1280 is a Unico movement — Hublot\'s first fully in-house chronograph caliber (launched 2010). The flyback function resets and restarts the chronograph in one button press.',
    starter_alt: 'tissot-prx-t137-407',
    extra_sources: ['https://www.hublot.com/en-us/watches/big-bang/unico'],
  }),
  make({
    id: 'hublot-classic-fusion-521-nx',
    brand: 'Hublot', reference: '521.NX.1171.LR',
    name: 'Classic Fusion', nickname: null, collection: 'Classic Fusion', tier: 'core',
    start_year: 2010, discontinued: false,
    caliber: 'HUB1112', type: 'automatic', mm: 45, material: 'titanium', bezel: 'polished titanium 6-screw',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 45mm Classic Fusion — the toned-down Big Bang with the Sellita-based HUB1112 and a thinner profile, Hublot\'s entry into the integrated-bracelet segment.',
    story: 'The Classic Fusion (2010) is the simpler sibling of the Big Bang: a thinner case (9.4mm vs 15mm), a Sellita SW300-1-based HUB1112 movement instead of the in-house Unico, and a cleaner dial without a chronograph. The 45mm titanium case retains the layered case middle and the 6-screw bezel. The Classic Fusion is Hublot\'s most-cited dress/sport watch and the watch a collector cites when they want the Hublot design language without the flyback-chronograph complication or the 15mm case height.',
    collector_notes: 'The HUB1112 is a Sellita SW300-1 base — not an in-house movement. The Classic Fusion is available in 38mm, 42mm, and 45mm; the 45mm is the most-cited.',
    starter_alt: 'tissot-prx-t137-407',
    extra_sources: ['https://www.hublot.com/en-us/watches/classic-fusion'],
  }),

  // ─── CHOPARD (2) ──────────────────────────────────────────────────────────
  make({
    id: 'chopard-alpine-eagle-298600',
    brand: 'Chopard', reference: '298600-3001',
    name: 'Alpine Eagle', nickname: null, collection: 'Alpine Eagle', tier: 'core',
    start_year: 2019, discontinued: false,
    caliber: 'Chopard 01.01-C', type: 'automatic', mm: 41, material: 'Lucent steel A223', bezel: 'integrated round-textured',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 41mm integrated-bracelet sport watch in Chopard\'s proprietary Lucent Steel A223 — the steel-sport competitor to the Royal Oak and Nautilus that entered the market in 2019.',
    story: 'The Alpine Eagle (2019) is Chopard\'s entry into the integrated-bracelet steel-sport category defined by the Royal Oak and the Nautilus. The case material is Lucent Steel A223 — a proprietary Chopard alloy that is harder than conventional stainless steel and has a brighter reflectivity. The Chopard 01.01-C caliber is an in-house automatic with a 60-hour reserve. The textured dial references the iris of an eagle. The Alpine Eagle is the most-cited modern Chopard sport watch and the one a collector cites when they want an integrated-bracelet design that is not from the established Swiss trio.',
    collector_notes: 'Lucent Steel A223 is a Chopard-exclusive alloy, recycled and harder than 316L. The Alpine Eagle line was inspired by the 1980 Chopard St. Moritz (Karl-Friedrich Scheufele\'s first design).',
    starter_alt: 'tissot-prx-t137-407',
    extra_sources: ['https://www.chopard.com/us/en/watches/alpine-eagle'],
  }),
  make({
    id: 'chopard-mille-miglia-168571',
    brand: 'Chopard', reference: '168571-3002',
    name: 'Mille Miglia Classic', nickname: 'Mille Miglia', collection: 'Mille Miglia', tier: 'core',
    start_year: 2017, discontinued: false,
    caliber: 'Chopard 03.05-C', type: 'automatic chronograph', mm: 40.5, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 40.5mm Mille Miglia chronograph — the watch Chopard has made as the official timekeeper of the Mille Miglia vintage car race since 1988.',
    story: 'Chopard has been the official timekeeper of the Mille Miglia (the 1,000-mile Italian vintage car race) since 1988, and the Mille Miglia watch line is the brand\'s motorsport-heritage entry. The 40.5mm case houses the in-house Chopard 03.05-C automatic chronograph caliber with a 60-hour reserve. The dial design references 1960s racing dashboards — the tire-tread strap and the race-route map on the caseback are Mille Miglia signatures. The Mille Miglia is the most-cited Chopard chronograph and the watch a collector cites when they want a motorsport watch from a brand that actually races.',
    collector_notes: 'Chopard co-president Karl-Friedrich Scheufele drives the Mille Miglia every year. The 03.05-C is a COSC-certified chronometer.',
    starter_alt: 'tissot-prx-t137-407',
    extra_sources: ['https://www.chopard.com/us/en/watches/mille-miglia'],
  }),

  // ─── BREGUET (2) ──────────────────────────────────────────────────────────
  make({
    id: 'breguet-type-xx-1050',
    brand: 'Breguet', reference: 'Type XX 1050ST/62/W670',
    name: 'Type XX', nickname: 'Type 20', collection: 'Type XX', tier: 'haute',
    start_year: 2023, discontinued: false,
    caliber: '728', type: 'automatic flyback chronograph', mm: 39, material: 'stainless steel', bezel: 'bidirectional 12-hr',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 2023 Type XX reissue with the in-house caliber 728 flyback chronograph — the 1950s French Air Force navigation chronograph reissued in a 39mm civilian case.',
    story: 'The Type XX (Type 20 in French) was originally specified by the French Air Force in the 1950s as a navigation chronograph; Breguet, Dodane, and Airain all produced versions. Breguet\'s civilian Type XX has been in the catalogue since the 1960s, and the 2023 reissue (Type 20) houses the new in-house caliber 728 flyback chronograph — a column-wheel, vertical-clutch movement with a 60-hour reserve. The 39mm steel case and the bidirectional 12-hour bezel are the 1950s originals. The Type XX is the most-cited Breguet sport chronograph and the watch a collector cites when they want a military-heritage flyback.',
    collector_notes: 'The caliber 728 (2023) replaces the earlier 582 used in the previous Type XX. The flyback function allows resetting and restarting the chronograph without stopping it first.',
    starter_alt: 'tissot-prx-t137-407',
    extra_sources: ['https://www.breguet.com/en/collections/type-xx'],
  }),
  make({
    id: 'breguet-classique-7777',
    brand: 'Breguet', reference: '7777BB/29/9V6',
    name: 'Classique', nickname: null, collection: 'Classique', tier: 'haute',
    start_year: 2020, discontinued: false,
    caliber: '537/3', type: 'automatic perpetual calendar', mm: 39, material: '18k white gold', bezel: 'fluted (coin-edge)',
    msrp_usd: null, msrp_year: null, msrp_url: null,
    one_liner: 'The 39mm Classique perpetual calendar with the fluted caseband and Breguet hands — the dress-watch reference for the oldest name in Swiss watchmaking.',
    story: 'Abraham-Louis Breguet founded the house in 1775, and the Classique line carries the brand\'s founding design codes: the fluted (coin-edge) caseband, the Breguet hands (the open-tipped "pomme" hands Breguet designed in 1783), and the guilloché dial. The 537/3 caliber is an automatic perpetual calendar based on a Lemania-derived platform with a silicon balance spring. The Classique perpetual is the most-cited Breguet dress complication and the watch a collector cites when they want a perpetual calendar from the house that invented the tourbillon.',
    collector_notes: 'The fluted caseband is hand-knurled. Breguet hands (open-tipped blue steel) are a house signature since 1783. The silicon balance spring is Breguet\'s modern addition to the classic Lemania base.',
    starter_alt: 'grandseiko-sbga413g',
    extra_sources: ['https://www.breguet.com/en/collections/classique'],
  }),

  // ─── BELL & ROSS (2) ──────────────────────────────────────────────────────
  make({
    id: 'bell-ross-br-03-92',
    brand: 'Bell & Ross', reference: 'BR0392-BL-ST/SCA',
    name: 'BR 03-92 Steel', nickname: 'BR 03', collection: 'BR 03', tier: 'core',
    start_year: 2017, discontinued: false,
    caliber: 'BR-CAL.302', type: 'automatic', mm: 42, material: 'stainless steel', bezel: 'integrated square 4-screw',
    msrp_usd: 3500, msrp_year: 2017, msrp_url: 'https://www.bell-ross.com/en/collection/br-03',
    one_liner: 'The 42mm square-instrument three-hand watch — the 1990s cockpit-panel design language that has defined Bell & Ross since the BR 01.',
    story: 'The BR 03 is the 42mm civilian version of the 46mm BR 01 (2005), which was itself a wristwatch interpretation of an airplane cockpit clock. The "circle within a square" case reads as an instrument panel — the Bell & Ross design brief since the brand\'s 1992 founding. The BR-CAL.302 caliber is a Sellita SW300-1 base. The BR 03-92 Steel is the most-cited Bell & Ross and the watch a collector cites when they want a square-case sport watch that is not a Monaco.',
    collector_notes: 'The BR 03 is the 42mm case; the BR 01 is 46mm (discontinued); the BR S is 39mm. The four visible bezel screws are a direct cockpit-clock reference.',
    starter_alt: 'tissot-prx-t137-407',
  }),
  make({
    id: 'bell-ross-br-05',
    brand: 'Bell & Ross', reference: 'BR05A-BL-ST/SRB',
    name: 'BR 05', nickname: null, collection: 'BR 05', tier: 'core',
    start_year: 2019, discontinued: false,
    caliber: 'BR-CAL.321', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'integrated square with rounded bezel ring',
    msrp_usd: 4200, msrp_year: 2019, msrp_url: 'https://www.bell-ross.com/en/collection/br-05',
    one_liner: 'The 2019 BR 05 — Bell & Ross\'s integrated-bracelet sport watch, the case that competes with the Royal Oak and the Nautilus at the sub-$5,000 price point.',
    story: 'The BR 05 (2019) is Bell & Ross\'s answer to the integrated-bracelet steel-sport category. The 40mm case softens the BR 03\'s hard square edges with a rounded bezel ring and an integrated bracelet — a design that reads as a cockpit panel refined for the wrist rather than a cockpit panel strapped to the wrist. The BR-CAL.321 (Sellita SW300-1 base) is the same movement family as the BR 03. The BR 05 is the most-cited modern Bell & Ross and the watch a collector cites when they want the integrated-bracelet design language at a price point below the Swiss trio.',
    collector_notes: 'The BR 05 was designed by Bruno Belamich (the "Bell" of Bell & Ross). The integrated bracelet distinguishes it from the BR 03\'s strap-only design.',
    starter_alt: 'tissot-prx-t137-407',
  }),

  // ─── GLASHÜTTE ORIGINAL (2) ───────────────────────────────────────────────
  make({
    id: 'gop-senator-excellence-100-14',
    brand: 'Glashütte Original', reference: '100-14-05-02-04',
    name: 'Senator Excellence', nickname: null, collection: 'Senator', tier: 'haute',
    start_year: 2016, discontinued: false,
    caliber: 'Calibre 36', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 9000, msrp_year: 2016, msrp_url: 'https://www.glashuette-original.com/en/collections/senator',
    one_liner: 'The 40mm Senator Excellence with the in-house Calibre 36 — the German manufacture dress watch with a 100-hour reserve and a Glashütte three-quarter plate.',
    story: 'Glashütte Original is the other major manufacture in Glashütte, Saxony (the first being A. Lange & Söhne), and the Senator Excellence is its flagship three-hand dress watch. The Calibre 36 (2016) is a fully in-house automatic with a 100-hour reserve, a silicon balance spring, and the Glashütte three-quarter plate — the architectural signature of Saxon watchmaking. The Senator Excellence is the most-cited GO dress watch and the reference a collector cites when they want German manufacture quality at a price point below Lange.',
    collector_notes: 'The Calibre 36 replaced the older Calibre 39. The three-quarter plate is a Glashütte signature that differs from the Swiss full-bridge or cock architecture.',
    starter_alt: 'grandseiko-sbga413g',
  }),
  make({
    id: 'gop-panomaticlunar-90-02',
    brand: 'Glashütte Original', reference: '90-02-42-32-61',
    name: 'PanoMaticLunar', nickname: null, collection: 'Pano', tier: 'haute',
    start_year: 2016, discontinued: false,
    caliber: 'Calibre 90-02', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 10000, msrp_year: 2016, msrp_url: 'https://www.glashuette-original.com/en/collections/pano',
    one_liner: 'The PanoMaticLunar with the asymmetric panodate dial layout and an in-house moon-phase — the most-cited Glashütte Original complication.',
    story: 'The PanoMaticLunar pairs the asymmetric "Pano" dial layout (off-centre hour/minute, large panorama date, moon-phase at 2 o\'clock) with the in-house Calibre 90-02 — a Glashütte three-quarter-plate automatic with a 42-hour reserve. The moon-phase display is a hand-painted golden moon against a blue sky. The PanoMaticLunar is the most-cited Glashütte Original complication and the watch a collector cites when they want a moon-phase that is a German manufacture piece rather than a Swiss classic.',
    collector_notes: 'The asymmetric dial is a GO signature. The panorama date (large double-digit date window) is a Glashütte watchmaking tradition shared with Lange\'s outsize date.',
    starter_alt: 'grandseiko-sbga413g',
  }),

  // ─── TIMEX (3) — global entry volume ──────────────────────────────────────
  make({
    id: 'timex-weekender-tw2p139',
    brand: 'Timex', reference: 'TW2P13900',
    name: 'Weekender', nickname: 'Weekender', collection: 'Weekender', tier: 'attainable',
    start_year: 2011, discontinued: false,
    caliber: 'Indiglo quartz', type: 'quartz', mm: 38, material: 'brass case with leather strap', bezel: 'smooth polished',
    msrp_usd: 40, msrp_year: 2011, msrp_url: 'https://www.timex.com/weekender-38mm-leather-strap-watch/TW2P13900.html',
    one_liner: 'The $40 quartz field watch with the Indiglo backlight — the most-sold affordable watch in North America and the one most-cited as a first watch.',
    story: 'The Weekender (2011) is the watch that re-established Timex as a volume player in the 2010s. The 38mm brass case, the interchangeable slip-thru strap, and the Indiglo backlight (Timex\'s 1992 electroluminescent technology) are the core specification. The Weekender is sold in hundreds of dial/strap colorways and is the most-sold affordable watch in North America. It is the watch most-cited as a first watch — the one a non-collector buys and the one a collector cites when they want a beater that costs less than a meal.',
    collector_notes: 'The Weekender\'s ticking is audible — the quartz module ticks once per second. The brass case is not stainless; it scratches and patinas. Indiglo is a Timex patent.',
    starter_alt: null,
  }),
  make({
    id: 'timex-expedition-tw4b272',
    brand: 'Timex', reference: 'TW4B27200',
    name: 'Expedition Gallatin', nickname: 'Expedition', collection: 'Expedition', tier: 'attainable',
    start_year: 2014, discontinued: false,
    caliber: 'Indiglo quartz', type: 'quartz', mm: 41, material: 'brass with resin overlay', bezel: 'bidirectional compass',
    msrp_usd: 50, msrp_year: 2014, msrp_url: 'https://www.timex.com/expedition-gallatin-41mm-fabric-strap-watch/TW4B27200.html',
    one_liner: 'The $50 field/tactical quartz with compass bezel and Indiglo — Timex\'s entry in the outdoor-instrument category.',
    story: 'The Expedition Gallatin is Timex\'s field-and-trail watch, named for the Gallatin National Forest. The 41mm case combines a brass body with a resin overlay for impact resistance. The bidirectional compass bezel and the Indiglo backlight are the functional features. The Expedition is the most-cited Timex field watch and the watch a collector cites when they want an affordable outdoor instrument that runs on a coin-cell battery.',
    collector_notes: 'The Expedition line has been in the Timex catalogue since the 1990s. The Gallatin variant is the mid-size (41mm); the Field Expedition is smaller.',
    starter_alt: null,
  }),
  make({
    id: 'timex-q-tw2v308',
    brand: 'Timex', reference: 'TW2V30800',
    name: 'Q Timex Reissue', nickname: 'Q Timex', collection: 'Q Timex', tier: 'attainable',
    start_year: 2019, discontinued: false,
    caliber: 'mechanical hand-wind', type: 'manual', mm: 38, material: 'stainless steel', bezel: 'bidirectional 12-hr (pepsi)',
    msrp_usd: 199, msrp_year: 2019, msrp_url: 'https://www.timex.com/q-timex-1979-reissue-38mm-stainless-steel-bracelet-watch/TW2V30800.html',
    one_liner: 'The 2019 reissue of the 1979 Q Timex — a hand-wound mechanical with a Pepsi bezel and a woven stainless bracelet at under $200.',
    story: 'The Q Timex (1979) was Timex\'s first electronic/mechanical hybrid; the 2019 reissue is fully mechanical — a hand-wind movement with a Pepsi (red/blue) bidirectional bezel, a woven stainless-steel expansion bracelet, and a 38mm case that matches the original. The reissue was the surprise of 2019: a sub-$200 mechanical from a brand known for $40 quartz. The Q Timex is the most-cited affordable mechanical reissue and the watch a collector cites when they want 1970s design without the 1970s maintenance.',
    collector_notes: 'The 2019 Q Timex is hand-wind only (no automatic). The woven expansion bracelet is a stretch-link design from the 1970s.',
    starter_alt: null,
  }),

  // ─── CITIZEN (3) — Japanese entry/mid expansion ───────────────────────────
  make({
    id: 'citizen-tsuyosa-nj0150',
    brand: 'Citizen', reference: 'NJ0150-12L',
    name: 'Tsuyosa', nickname: 'Tsuyosa', collection: 'Series 8', tier: 'attainable',
    start_year: 2021, discontinued: false,
    caliber: '8210', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'smooth integrated',
    msrp_usd: 350, msrp_year: 2021, msrp_url: 'https://www.citizenwatch.com/us/en/collections/tsuyosa/',
    one_liner: 'The sub-$400 integrated-bracelet automatic that brought the Royal Oak/Nautilus design language to the entry tier — Citizen\'s answer to the Tissot PRX.',
    story: 'The Tsuyosa (Japanese for "strength") is Citizen\'s integrated-bracelet entry, launched in Japan in 2021. The 40mm stainless steel case, the integrated bracelet, and the in-house 8210 automatic (40-hour reserve, 21,600 vph) give it the same design language as the Tissot PRX at a comparable price. The crown is integrated into the case side (a flush push-pull design). The Tsuyosa is the most-cited modern Citizen in the enthusiast community and the watch a collector cites when they want an integrated-bracelet automatic under $400.',
    collector_notes: 'The Tsuyosa uses the 8210 — an older Citizen automatic caliber, not the newer 09X series. The integrated crown sits flush with the case side; pulling it out requires a fingernail.',
    starter_alt: null,
  }),
  make({
    id: 'citizen-series-8-nh4020',
    brand: 'Citizen', reference: 'NH4020-54L',
    name: 'Series 8 Automatic', nickname: 'Series 8', collection: 'Series 8', tier: 'core',
    start_year: 2023, discontinued: false,
    caliber: '0950', type: 'automatic', mm: 40, material: 'stainless steel', bezel: 'smooth polished with fluted variant',
    msrp_usd: 700, msrp_year: 2023, msrp_url: 'https://www.citizenwatch.com/us/en/collections/promaster/',
    one_liner: 'The Series 8 automatic with the in-house caliber 0950 — Citizen\'s mid-range manufacture line, positioned between the Tsuyosa and the high-end Citizen Chronomaster.',
    story: 'The Series 8 is Citizen\'s mid-tier mechanical line, launched globally in 2023 (sold in Japan since the 2010s as the "8" series). The 0950 caliber is a modern Citizen automatic with a 50-hour reserve and anti-magnetic resistance to 16,000 A/m. The 40mm case comes in smooth, fluted, and integrated-bracelet variants. The Series 8 is the most-cited Citizen mechanical above the entry tier and the watch a collector cites when they want Japanese automatic watchmaking with anti-magnetic specs at the $700 price point.',
    collector_notes: 'The 0950 caliber is the modern Citizen mechanical platform; it differs from the older 8210 in the Tsuyosa by adding anti-magnetic shielding and a longer reserve.',
    starter_alt: 'citizen-tsuyosa-nj0150',
  }),
  make({
    id: 'citizen-navihawk-at-j80',
    brand: 'Citizen', reference: 'J80-Y028E',
    name: 'Navihawk A-T', nickname: 'Navihawk', collection: 'Eco-Drive', tier: 'core',
    start_year: 2016, discontinued: false,
    caliber: 'U600 Eco-Drive', type: 'quartz (solar)', mm: 45, material: 'titanium', bezel: 'slide-rule bidirectional',
    msrp_usd: 650, msrp_year: 2016, msrp_url: 'https://www.citizenwatch.com/us/en/collections/navihawk/',
    one_liner: 'The solar-powered pilot chronograph with radio-controlled timekeeping and a slide-rule bezel — the most feature-dense Citizen at the $650 price point.',
    story: 'The Navihawk A-T is the full-spec pilot watch from Citizen\'s Eco-Drive line: solar charging (any light), radio-controlled time sync (Multi-Band 6), a slide-rule bezel, a 1/100-second chronograph, a world timer (43 cities), and two alarms. The U600 caliber is the Eco-Drive movement that powers it all from ambient light — no battery replacement. The 45mm titanium case keeps the weight manageable. The Navihawk is the most-cited Citizen pilot watch and the watch a collector cites when they want maximum functions per dollar.',
    collector_notes: 'Eco-Drive is Citizen\'s solar-charging technology (launched 1995). Multi-Band 6 syncs with radio towers in the US, UK, Germany, China, and Japan (2 towers). The slide-rule bezel performs fuel and distance calculations.',
    starter_alt: 'casio-ga-2100',
  }),

  // ─── SEIKO (2) — Presage/Prospex top-up ───────────────────────────────────
  make({
    id: 'seiko-presage-sharp-dial-spb429',
    brand: 'Seiko', reference: 'SPB429',
    name: 'Presage Sharp Dial', nickname: 'Sharp Dial', collection: 'Presage', tier: 'attainable',
    start_year: 2023, discontinued: false,
    caliber: '6R35', type: 'automatic', mm: 40.2, material: 'stainless steel', bezel: 'smooth polished',
    msrp_usd: 850, msrp_year: 2023, msrp_url: 'https://www.seikowatches.com/us-en/products/presage/spb429',
    one_liner: 'The 40.2mm Presage with the sharp-edged Sharaku dial pattern and the 6R35 caliber — the most-cited Seiko dress automatic at the $850 price point.',
    story: 'The SPB429 is part of Seiko\'s Presage Sharp Dial series, which draws on the Japanese Sharaku woodblock-print aesthetic — the dial pattern is a series of radiating sharp-edged lines. The 6R35 caliber (hand-wind, hacking, 70-hour reserve) is Seiko\'s mid-range automatic. The 40.2mm stainless steel case, sapphire crystal, and see-through caseback are the modern Presage specification. The SPB429 is the most-cited Presage dress watch at the $850 price point.',
    collector_notes: 'The 6R35 replaced the 6R15 with a longer reserve (70h vs 50h). The Sharaku pattern references Toshusai Sharaku, an 18th-century ukiyo-e artist.',
    starter_alt: 'casio-f-91w',
  }),
  // ─── CASIO (2) — AE-1200 "Royale" + MQ-24 ─────────────────────────────────
  make({
    id: 'casio-ae-1200',
    brand: 'Casio', reference: 'AE-1200WH-1AV',
    name: 'Casio Royale', nickname: 'Casio Royale', collection: 'Casio Standard', tier: 'attainable',
    start_year: 2008, discontinued: false,
    caliber: 'quartz module 3768', type: 'quartz', mm: 42.4, material: 'resin case and strap', bezel: 'fixed resin (4-screw)',
    msrp_usd: 25, msrp_year: 2008, msrp_url: 'https://www.casio.com/us/watches/casio/ae1200wh-1av',
    one_liner: 'The $25 digital field watch nicknamed for its James Bond resemblance — the most feature-rich Casio at the bottom of the catalogue, with world time and a 10-year battery.',
    story: 'The AE-1200 (dubbed the "Casio Royale" for its resemblance to a watch in Casino Royale media) is the feature-dense entry in Casio\'s digital line: world time (31 time zones, 48 cities), a 1/100-second stopwatch, a countdown timer, five daily alarms, an LED backlight, and a 10-year battery. The 42.4mm resin case has a 100m water resistance — more than most digitals at this price. The AE-1200 is the most-cited affordable digital after the F-91W and the watch a collector cites when they want maximum function per dollar.',
    collector_notes: 'The AE-1200 and the AE-1500 share the 3768 module. The "Royale" nickname is collector slang; the watch has no official Bond association. The case screws are decorative.',
    starter_alt: 'casio-f-91w',
  }),
  make({
    id: 'casio-mq-24',
    brand: 'Casio', reference: 'MQ-24-7B',
    name: 'Casio MQ-24 Analog', nickname: 'MQ-24', collection: 'Casio Standard', tier: 'attainable',
    start_year: 2003, discontinued: false,
    caliber: 'quartz module 536', type: 'quartz', mm: 35, material: 'resin case and strap', bezel: 'fixed resin (round)',
    msrp_usd: 15, msrp_year: 2003, msrp_url: 'https://www.casio.com/us/watches/casio/mq24-7b',
    one_liner: 'The $15 analog quartz — the cheapest watch in the Casio catalogue, and the most-cited "just a watch" in the affordable-collecting conversation.',
    story: 'The MQ-24 is the bottom of Casio\'s analog line: a 35mm resin case, a mineral glass crystal, a basic three-hand quartz movement (module 536), and a 3-year battery. It is the cheapest watch Casio makes and the one most-cited when collectors discuss the minimum viable watch. The MQ-24 is the watch a collector cites when they want to make the point that a functional timepiece does not require a mechanical movement or a four-figure budget.',
    collector_notes: 'The MQ-24 has no water resistance rating beyond splash resistant. The resin strap is non-replaceable without modification. The mineral glass is unusual at this price point (most competitors use acrylic).',
    starter_alt: 'casio-f-91w',
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
console.log(`✓ ${added} new cards written, ${skipped} existing cards skipped (agent-global-coverage, ${DATE})`)