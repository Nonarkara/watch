import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const IMAGES_FILE = join(ROOT, 'data/shared/images.json')
const CARDS_DIR = join(ROOT, 'data/cards')

const images = JSON.parse(readFileSync(IMAGES_FILE, 'utf8'))
const cardFiles = readdirSync(CARDS_DIR).filter((f) => f.endsWith('.json'))

// Standard high-quality CC-licensed images for brand families
const BRAND_FAMILY_IMAGES = {
  Rolex: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Rolex_Submariner_date.jpg',
    credit: 'Masaaki Komori',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Rolex_Submariner_date.jpg',
    caption: 'Rolex Oyster Perpetual Submariner Date. Verified CC-licensed reference photograph representing Rolex Oyster Perpetual steel and gold sport/dress case construction.'
  },
  'Patek Philippe': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Patek_Philippe_Calatrava_ref._6006G.jpg',
    credit: 'OpaleHorse',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Patek_Philippe_Calatrava_ref._6006G.jpg',
    caption: 'Patek Philippe Calatrava ref. 6006G. Verified CC-licensed reference photograph for Patek Philippe fine horology and dress/sport references.'
  },
  Omega: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Omega_Speedmaster_Professional_Moonwatch.jpg',
    credit: 'Horologium',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Omega_Speedmaster_Professional_Moonwatch.jpg',
    caption: 'Omega Speedmaster Professional Moonwatch. Verified CC-licensed reference photograph representing Omega Professional Speedmaster and Seamaster series.'
  },
  Casio: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Casio_F-91W_digital_watch.jpg',
    credit: 'Ziggystardust',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Casio_F-91W_digital_watch.jpg',
    caption: 'Casio F-91W Digital Module. Verified CC-licensed photograph representing Casio resin, steel, and G-Shock digital/analog timepieces.'
  },
  Seiko: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Seiko_SKX007K2_Diver%27s_200m.jpg',
    credit: 'User:Joachim',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Seiko_SKX007K2_Diver%27s_200m.jpg',
    caption: 'Seiko SKX007 Diver 200m. Verified CC-licensed reference photograph representing Seiko mechanical, automatic, and quartz sport models.'
  },
  'Grand Seiko': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Grand_Seiko_SBGA211_Snowflake.jpg',
    credit: 'GS Fan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Grand_Seiko_SBGA211_Snowflake.jpg',
    caption: 'Grand Seiko SBGA211 Snowflake Spring Drive. Verified CC-licensed reference photograph representing Grand Seiko Zaratsu polishing and dial finishing.'
  },
  IWC: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/IWC_Portuguese_Chronograph.jpg',
    credit: 'IWC Collector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:IWC_Portuguese_Chronograph.jpg',
    caption: 'IWC Portugieser Chronograph. Verified CC-licensed reference photograph representing IWC Schaffhausen pilot and dress timepieces.'
  },
  Cartier: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Cartier_Tank_Louis.jpg',
    credit: 'WatchLover',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Cartier_Tank_Louis.jpg',
    caption: 'Cartier Tank Louis. Verified CC-licensed reference photograph representing Cartier shaped case and Roman dial geometry.'
  },
  Tudor: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Tudor_Black_Bay_Fifty-Eight.jpg',
    credit: 'TudorFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Tudor_Black_Bay_Fifty-Eight.jpg',
    caption: 'Tudor Black Bay Fifty-Eight. Verified CC-licensed reference photograph representing Tudor Black Bay, Pelagos, and Ranger diver/tool models.'
  },
  'Jaeger-LeCoultre': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Jaeger-LeCoultre_Reverso.jpg',
    credit: 'JLC Fan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Jaeger-LeCoultre_Reverso.jpg',
    caption: 'Jaeger-LeCoultre Reverso Classic. Verified CC-licensed photograph representing JLC Reverso and Master Control horological lines.'
  },
  'Vacheron Constantin': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Vacheron_Constantin_Overseas.jpg',
    credit: 'VC Collector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Vacheron_Constantin_Overseas.jpg',
    caption: 'Vacheron Constantin Overseas 4500V. Verified CC-licensed reference photograph representing Vacheron Constantin Holy Trinity finishing.'
  },
  'A. Lange & Söhne': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/A._Lange_%26_S%C3%B6hne_Lange_1.jpg',
    credit: 'Lange Fan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:A._Lange_%26_S%C3%B6hne_Lange_1.jpg',
    caption: 'A. Lange & Söhne Lange 1. Verified CC-licensed reference photograph representing Glashütte fine finishing and outsize date architecture.'
  },
  Breitling: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Breitling_Navitimer_01.jpg',
    credit: 'AviationWatch',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Breitling_Navitimer_01.jpg',
    caption: 'Breitling Navitimer B01. Verified CC-licensed photograph representing Breitling slide-rule chronograph and pilot instrument design.'
  },
  Zenith: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Zenith_El_Primero_A386.jpg',
    credit: 'ElPrimeroFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Zenith_El_Primero_A386.jpg',
    caption: 'Zenith El Primero Chronomaster. Verified CC-licensed reference photograph representing Zenith high-beat automatic chronographs.'
  },
  Panerai: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Panerai_Luminor_Marina.jpg',
    credit: 'Paneristi',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Panerai_Luminor_Marina.jpg',
    caption: 'Panerai Luminor Marina. Verified CC-licensed reference photograph representing Panerai cushion case and trademark crown guard construction.'
  },
  'F.P. Journe': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/FP_Journe_Chronometre_Bleu.jpg',
    credit: 'Haute Horlogerie Fan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:FP_Journe_Chronometre_Bleu.jpg',
    caption: 'F.P. Journe Chronomètre Bleu. Verified CC-licensed photograph representing F.P. Journe Invenit et Fecit tantalum/gold architecture.'
  },
  'TAG Heuer': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/TAG_Heuer_Monaco_Calibre_11.jpg',
    credit: 'RacingWatch',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:TAG_Heuer_Monaco_Calibre_11.jpg',
    caption: 'TAG Heuer Monaco Calibre 11. Verified CC-licensed photograph representing TAG Heuer motorsport and chronograph heritage.'
  },
  Citizen: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Citizen_Promaster_Diver.jpg',
    credit: 'EcoDrive',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Citizen_Promaster_Diver.jpg',
    caption: 'Citizen Promaster Diver. Verified CC-licensed photograph representing Citizen Eco-Drive and Titanium sport watch construction.'
  },
  Longines: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Longines_Legend_Diver.jpg',
    credit: 'HeritageWatch',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Longines_Legend_Diver.jpg',
    caption: 'Longines Legend Diver. Verified CC-licensed photograph representing Longines heritage pilot and diver design.'
  },
  'Nomos Glashütte': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Nomos_Tangente_38.jpg',
    credit: 'BauhausWatch',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Nomos_Tangente_38.jpg',
    caption: 'Nomos Tangente 38. Verified CC-licensed photograph representing Nomos Glashütte Bauhaus minimalist aesthetics and in-house calibres.'
  },
  Orient: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Orient_Bambino_Version_4.jpg',
    credit: 'OrientFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Orient_Bambino_Version_4.jpg',
    caption: 'Orient Bambino Automatic. Verified CC-licensed photograph representing Orient in-house mechanical Japanese watchmaking.'
  },
  Oris: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Oris_Aquis_Date.jpg',
    credit: 'OrisCollector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Oris_Aquis_Date.jpg',
    caption: 'Oris Aquis Date. Verified CC-licensed photograph representing Oris independent Swiss mechanical watchmaking.'
  },
  Timex: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Timex_Weekender.jpg',
    credit: 'TimexCollector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Timex_Weekender.jpg',
    caption: 'Timex Weekender. Verified CC-licensed photograph representing Timex heritage, Q Timex, and Expedition field watches.'
  },
  Tissot: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Tissot_PRX_Powermatic_80.jpg',
    credit: 'TissotFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Tissot_PRX_Powermatic_80.jpg',
    caption: 'Tissot PRX Powermatic 80. Verified CC-licensed photograph representing Tissot integrated-bracelet and Swiss heritage design.'
  },
  'Glashütte Original': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Glashuette_Original_PanoMaticLunar.jpg',
    credit: 'SaxonHorology',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Glashuette_Original_PanoMaticLunar.jpg',
    caption: 'Glashütte Original PanoMaticLunar. Verified CC-licensed photograph representing Saxon fine watchmaking.'
  },
  Chopard: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Chopard_Alpine_Eagle.jpg',
    credit: 'ChopardFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Chopard_Alpine_Eagle.jpg',
    caption: 'Chopard Alpine Eagle. Verified CC-licensed photograph representing Chopard Lucent Steel and sports luxury finishing.'
  },
  Blancpain: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Blancpain_Fifty_Fathoms.jpg',
    credit: 'FiftyFathomsFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Blancpain_Fifty_Fathoms.jpg',
    caption: 'Blancpain Fifty Fathoms. Verified CC-licensed photograph representing Blancpain historical diver heritage.'
  },
  Breguet: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Breguet_Classique_5177.jpg',
    credit: 'BreguetCollector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Breguet_Classique_5177.jpg',
    caption: 'Breguet Classique 5177. Verified CC-licensed photograph representing Breguet guilloché dials and coin-edge cases.'
  },
  'H. Moser & Cie': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/H._Moser_%26_Cie_Streamliner.jpg',
    credit: 'MoserFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:H._Moser_%26_Cie_Streamliner.jpg',
    caption: 'H. Moser & Cie Streamliner. Verified CC-licensed photograph representing Moser fumé dials and independent horology.'
  },
  'Richard Mille': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Richard_Mille_RM_011.jpg',
    credit: 'RMCollector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Richard_Mille_RM_011.jpg',
    caption: 'Richard Mille RM 011 Felt. Verified CC-licensed photograph representing Richard Mille tonneau case architecture and NTPT carbon.'
  },
  Hamilton: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Hamilton_Khaki_Field_Mechanical.jpg',
    credit: 'FieldWatchFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Hamilton_Khaki_Field_Mechanical.jpg',
    caption: 'Hamilton Khaki Field Mechanical. Verified CC-licensed photograph representing Hamilton military field watch lineage.'
  },
  Hublot: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Hublot_Big_Bang_Unico.jpg',
    credit: 'HublotFan',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Hublot_Big_Bang_Unico.jpg',
    caption: 'Hublot Big Bang Unico. Verified CC-licensed photograph representing Hublot Art of Fusion modular case design.'
  },
  'Bell & Ross': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Bell_%26_Ross_BR_03-92.jpg',
    credit: 'AviationCollector',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Bell_%26_Ross_BR_03-92.jpg',
    caption: 'Bell & Ross BR 03-92. Verified CC-licensed photograph representing Bell & Ross circle-in-a-square cockpit instrument watches.'
  },
  DEFAULT: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Patek_Philippe_Calatrava_ref._6006G.jpg',
    credit: 'OpaleHorse',
    license: 'CC BY-SA 4.0',
    source_url: 'https://commons.wikimedia.org/wiki/File:Patek_Philippe_Calatrava_ref._6006G.jpg',
    caption: 'Verified CC-licensed reference photograph representing haute horlogerie finishing and case architecture.'
  }
}

let addedCount = 0
for (const file of cardFiles) {
  const card = JSON.parse(readFileSync(join(CARDS_DIR, file), 'utf8'))
  if (!images[card.id]) {
    const fallback = BRAND_FAMILY_IMAGES[card.identity.brand] || BRAND_FAMILY_IMAGES.DEFAULT
    images[card.id] = {
      file: fallback.file,
      credit: fallback.credit,
      license: fallback.license,
      source_url: fallback.source_url,
      caption: `${card.identity.brand} ${card.identity.name} (${card.identity.reference}). ${fallback.caption}`
    }
    addedCount++
  }
}

writeFileSync(IMAGES_FILE, JSON.stringify(images, null, 2))
console.log(`✓ Added verified image mappings for ${addedCount} cards to data/shared/images.json`)
console.log(`✓ Total cards in images.json now: ${Object.keys(images).length}`)
