// Merge verified batch 4b into data/shared/images.json. Idempotent (skips
// cardId already in the file).
//
// For each new entry:
//   - First card to claim a file gets `caption: null` → match: "exact_reference"
//   - Subsequent cards claiming the same file get a caption explaining the
//     family distance → match: "reference_family"

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const IMAGES_FILE = join(ROOT, 'data/shared/images.json')
const VERIFIED_FILE = '/tmp/verified-batch4b.json'
const CARDS_DIR = join(ROOT, 'data/cards')

const images = JSON.parse(readFileSync(IMAGES_FILE, 'utf8'))
const verified = JSON.parse(readFileSync(VERIFIED_FILE, 'utf8'))

// Build reference for "what does this card actually look like" — so we can write
// a caption that says "this is a 1990s sub-family, not the 2020 successor" rather
// than just "this is the family".
const cardMeta = new Map()
for (const f of readdirSync(CARDS_DIR).filter((f) => f.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(CARDS_DIR, f), 'utf8'))
  cardMeta.set(c.id, {
    brand: c.identity.brand,
    ref: c.identity.reference,
    name: c.identity.name,
    startYear: c.identity.produced?.start_year,
  })
}

// Track which cards have already been assigned to a given file. First claim wins
// (no caption). Subsequent claims get a caption explaining what the photo shows
// vs. what the card actually is.
const fileFirstClaim = new Map()
for (const [cardId, entry] of Object.entries(images)) {
  if (!fileFirstClaim.has(entry.file)) fileFirstClaim.set(entry.file, cardId)
}

let added = 0
let skipped = 0
const captions = {
  // Per-card captions for family references. These are added when a file
  // represents a related reference (not the exact one). The format follows
  // the existing convention: "[Brand] [Ref] — what this photo shows.
  // The closest verified CC-licensed photograph for [Card] [Ref]; [family context]."

  'patek-5980-1a': null,  // exact reference
  'patek-5711-1a-018-tiffany': 'Patek Philippe Calatrava ref. 6006G (modern Calatrava family). The closest verified CC-licensed photograph for the 5711/1A-018 Tiffany-blue final-series Nautilus; both are Patek dress/sport references in the same Calatrava-Nautilus era.',
  'patek-6119r': 'Patek Philippe Calatrava ref. 6006G. The closest verified CC-licensed photograph for the 6119R-001 Calatrava; both are modern Calatrava references in the same generation.',
  'patek-5227g': 'Patek Philippe Calatrava ref. 3919G (early 1990s). The closest verified CC-licensed photograph for the 5227G Calatrava; same Calatrava dress-watch family, two generations apart.',
  'patek-5712-1a': 'Patek Philippe Calatrava ref. 96 (vintage, late 1930s). The closest verified CC-licensed photograph for the 5712/1A Nautilus; vintage Calatrava dial DNA — same brand, opposite ends of the Patek dress-sport divide.',
  'cartier-tank-must-wsta0041': null,  // exact reference (Cartier Tank Must 2021)
  'cartier-tank-louis': null,  // exact reference
  'cartier-panthere-medium': 'Cartier Panthère Ruban. The closest verified CC-licensed photograph for the WSPN0015 Panthère de Cartier Medium; both are Panthère-family Cartier pieces with the integrated link bracelet.',
  'cartier-pasha-41': 'Cartier Pasha GMT ref. 2388. The closest verified CC-licensed photograph for the WHPA0018 Pasha de Cartier 41mm; both are Pasha-family Cartier pieces with the chain-and-medallion crown.',
  'cartier-santos-wssa0029': 'Cartier Santos Galbée ref. 1564. The closest verified CC-licensed photograph for the WSSA0029 Santos de Cartier; both are Santos-family Cartier pieces with the exposed-screw bezel.',
  'cartier-ballon-bleu-42': 'Cartier Ronde in oro rosa al quarzo ref. 2886. The closest verified CC-licensed photograph for the WSBB0049 Ballon Bleu 42; same Cartier round-case dress watch DNA.',
  'cartier-tank-cintree': 'Cartier Tank Américaine automatic in steel. The closest verified CC-licensed photograph for the Tank Cintrée; both are elongated Tank-family Cartier pieces.',
  'cartier-santos-dumont': 'Cartier Santos Dumont al quarzo ref. 4240. The closest verified CC-licensed photograph for the WSSA0085 Santos-Dumont; same Santos-Dumont family.',
  'tudor-bb54-79000n': null,  // exact reference
  'tudor-7924': null,  // exact reference (Tudor Oyster Prince Submariner)
  'tudor-bb-79230n': 'Tudor Black Bay 54 ref. m79000n. The closest verified CC-licensed photograph for the 79230N Black Bay; both are Black Bay 41mm/37mm divers with the snowflake handset.',
  'tudor-bbgmt-79830rb': 'Tudor Black Bay 58 ref. M79018V (gold, special). The closest verified CC-licensed photograph for the 79830RB Black Bay GMT; same Black Bay family, different complication.',
  'tudor-pelagos-25600tn': null,  // exact reference (Tudor Pelagos)
  'tudor-bb58-79030b': 'Tudor Black Bay 58 ref. M79018V. The closest verified CC-licensed photograph for the 79030B Black Bay Fifty-Eight; same Black Bay Fifty-Eight family.',
  'tudor-bb58-79030n': 'Tudor Black Bay 58 ref. M79018V. The closest verified CC-licensed photograph for the 79030N Black Bay Fifty-Eight; same Black Bay Fifty-Eight family.',
  'tudor-chrono-79360n': null,  // exact reference
  'omega-2531-80': 'Omega Seamaster automatico ref. 166.087 (1970s). The closest verified CC-licensed photograph for the 2531.80 Seamaster 300M Chronometer; both are mid-size Seamaster divers from the same era.',
  'omega-seamaster-300m': 'Omega Seamaster Chrono ref. 176.007 (1970s). The closest verified CC-licensed photograph for the 210.30.42.20.01.001 Seamaster Diver 300M; same Seamaster family, automatic chronograph vs three-hand diver.',
  'omega-aqua-terra-150m': 'Omega Seamaster Aqua Terra. The closest verified CC-licensed photograph for the 220.10.41.21.03.004 Seamaster Aqua Terra 150M; same Aqua Terra family.',
  'jlc-reverso-classic-q3858520': null,  // exact reference
  'jlc-master-control-date': 'JLC Master Control Chronograph Calendar. The closest verified CC-licensed photograph for the Q4018420 Master Control Date; same Master Control family.',
  'jlc-master-ultra-thin-moon': 'JLC Master Ultra Thin Perpetual. The closest verified CC-licensed photograph for the Q1368430 Master Ultra Thin Moon; same Master Ultra Thin family.',
  'jlc-memovox': 'JLC Reverso con datario e riserva di carica. The closest verified CC-licensed photograph for the Q2028420 Memovox; same JLC dress-watch DNA.',
  'vacheron-4600e': 'Vacheron Constantin Overseas first-generation caseback decoration. The closest verified CC-licensed photograph for the 4600E/000A FiftySix; the Overseas case DNA is the Vacheron 1996-2004 sport-luxury reference.',
  'vacheron-81180': 'Vacheron Constantin Malte Tourbillon Regulateur Reserve de Marche ref. 30080. The closest verified CC-licensed photograph for the 81180 Patrimony; same Vacheron dress-watch DNA, complex vs simple.',
  'vacheron-82035': 'Vacheron Constantin Cioccolatone con calendario ref. 4764. The closest verified CC-licensed photograph for the 82035/000R Historiques American 1921; same Vacheron asymmetric-case DNA.',
  'iwc-aquatimer-iw3290': null,  // exact reference
  'iwc-big-pilot-iw501001': null,  // exact reference
  'breitling-navitimer-b01-43': null,  // exact reference
  'breitling-chronomat-b01-42': 'Breitling Chronomat ref. B13047 (late 1980s). The closest verified CC-licensed photograph for the AB0134 Chronomat B01 42; same Chronomat family.',
  'lange-lange1-191-032': 'JLC Master Ultra Thin Perpetual. The closest verified CC-licensed photograph for the A. Lange & Söhne 191.032 Lange 1; both are high-end dress watches with off-axis dial layouts.',
  'lange-datograph-405-035': 'JLC Master Control Chronograph Calendar. The closest verified CC-licensed photograph for the 405.035 Datograph Up/Down; both are in-house chronograph references with calendar.',
  'lange-1815-chronograph-414-028': 'JLC Master Control Chronograph Calendar. The closest verified CC-licensed photograph for the 414.028 1815 Chronograph; both are chronograph references with calendar.',
  'journe-resonance': 'JLC Master Geographic ref. Q4128420. The closest verified CC-licensed photograph for the F.P. Journe Résonance; both are haute horlogerie complications with travel/dual-time functions.',
  'journe-tourbillon-souverain': 'Breguet Tradition ref. 7097. The closest verified CC-licensed photograph for the F.P. Journe Tourbillon Souverain; both are exposed-tourbillon haute horlogerie pieces.',
  'journe-chronometre-bleu': 'JLC Master Control Chronograph Calendar. The closest verified CC-licensed photograph for the F.P. Journe Chronomètre Bleu; both are high-end dress chronometers.',
  'moser-endeavour-centre-seconds': 'Hamilton Khaki Field Murph 38mm. The closest verified CC-licensed photograph for the H. Moser Endeavour Centre Seconds; both are dress watches with centre-seconds at the attainable-haute boundary.',
  'richardmille-rm011': 'AP Royal Oak Chronograph with modular calibre, ref. 25721 (early 1990s). The closest verified CC-licensed photograph for the Richard Mille RM 011; same large tonneau-shape sport-luxury space.',
  'richardmille-rm035': 'AP Royal Oak Chronograph with modular calibre, ref. 25721 (early 1990s). The closest verified CC-licensed photograph for the Richard Mille RM 035; same sport-luxury space.',
  'richardmille-rm055': 'AP Royal Oak Chronograph with modular calibre, ref. 25721 (early 1990s). The closest verified CC-licensed photograph for the Richard Mille RM 055; same sport-luxury space.',
  'richardmille-rm067-02': 'AP Royal Oak Chronograph with modular calibre, ref. 25721 (early 1990s). The closest verified CC-licensed photograph for the Richard Mille RM 67-02; same sport-luxury space.',
  'debethune-db28': 'Breguet ref. 5177 con datario. The closest verified CC-licensed photograph for the De Bethune DB28; both are haute horlogerie references with centre-seconds and date.',
  'rolex-126600': 'Rolex Sea-Dweller ref. 16600 (late 1980s, no cyclops). The closest verified CC-licensed photograph for the 126600 Sea-Dweller; same Sea-Dweller family, two generations apart.',
  'panerai-luminor-marina-pam01312': 'Panerai Luminor Marina PAM01312. The closest verified CC-licensed photograph for the PAM01312 Luminor Marina; same reference family.',
  'panerai-luminor-base-logo-pam01000': 'Panerai Luminor Base Logo. The closest verified CC-licensed photograph for the PAM01000 Luminor Base Logo; same Luminor family.',
  'panerai-luminor-due-pam00927': 'Panerai Luminor Due 42. The closest verified CC-licensed photograph for the PAM00927 Luminor Due 42mm Automatic; same Luminor Due family.',
  'panerai-radiomir-pam00992': 'Panerai Radiomir PAM00992. The closest verified CC-licensed photograph for the PAM00992 Radiomir 8 Days; same Radiomir family.',
  'panerai-submersible-pam00973': 'Panerai Submersible PAM00973. The closest verified CC-licensed photograph for the PAM00973 Luminor Submersible 42mm; same Luminor Submersible family.',
  'tagheuer-monaco-caw211p': null,  // exact reference
  'tagheuer-carrera-glassbox-cbs2210': 'TAG Heuer Carrera Glassbox. The closest verified CC-licensed photograph for the CBS2210 Carrera Chronograph; same Carrera family.',
  'tagheuer-autavia-heritage': 'TAG Heuer Autavia Heritage. The closest verified CC-licensed photograph for the CBE2110 Heritage Autavia; same Autavia family.',
  'tagheuer-aquaracer-pro-300': 'TAG Heuer Aquaracer Professional 300. The closest verified CC-licensed photograph for the WBP201 Aquaracer Pro 300 Date; same Aquaracer family.',
  'tagheuer-f1-kith': 'TAG Heuer Formula 1 quartz steel/ceramic ref. WAH1213.BA0861. The closest verified CC-licensed photograph for the WA121F.BA0023 Formula 1 x Kith; same Formula 1 family.',
  'zenith-chronomaster-original': 'Zenith El Primero TV ref. 01-0200-415 (1970s). The closest verified CC-licensed photograph for the 03.3200.3600 Chronomaster Original; same El Primero DNA.',
  'ap-26331st': 'AP Royal Oak Chronograph with modular calibre, ref. 25721 (early 1990s). The closest verified CC-licensed photograph for the 26331ST Royal Oak Chronograph 41; same Royal Oak chronograph family.',
  'ap-26393': null,  // exact reference
}

const outImages = { ...images }
for (const [cardId, v] of Object.entries(verified)) {
  if (outImages[cardId]) { skipped++; continue }
  const isFirst = !fileFirstClaim.has(v.url)
  fileFirstClaim.set(v.url, isFirst ? cardId : fileFirstClaim.get(v.url))
  const explicitCaption = captions[cardId]
  outImages[cardId] = {
    file: v.url,
    credit: v.artist,
    license: v.license,
    source_url: v.source_url,
    caption: isFirst && explicitCaption == null ? null : (explicitCaption ?? `Reference family — file shows ${v.title}.`),
  }
  added++
}

writeFileSync(IMAGES_FILE, JSON.stringify(outImages, null, 2) + '\n')
console.log(`✓ Added ${added} images; skipped ${skipped} duplicates. Total: ${Object.keys(outImages).length}`)
