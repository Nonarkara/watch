// build_art_timepieces.mjs — the timepiece in art.
//
// Same policy as watchmaking_artifacts: Wikimedia Commons only, and only
// files whose licence is CC0 / Public domain / CC BY / CC BY-SA. Nothing
// NC, nothing ND, nothing "fair use". If the licence does not normalise to
// something on the accept list, the artwork is dropped and the script says
// so — it never guesses and never writes a licence it did not read.
//
// Every caption below was written after looking at the actual image. Where a
// caption says a watch is in the picture, a watch is in the picture. Modern
// works (Dalí, Picasso, Warhol, González-Torres, Wiley) are NOT here: they
// are still in copyright, so the site describes and links them instead of
// reproducing them. See ART_WITHHELD in src/pages/Watchmaking.tsx.
//
// Run: node scripts/build_art_timepieces.mjs

import { writeFileSync, mkdirSync } from 'node:fs'

const UA = { 'User-Agent': 'WatchRegister/1.0 (https://watch.nonarkara.org)' }
const OUT_IMG = 'public/img/art'
const OUT_JSON = 'public/data/art_timepieces.json'
const OUT_TS = 'src/lib/art-timepieces.ts'
// Bands crop to 200–400px tall and plates are contained at ~320px, so 1200
// is already generous. The originals run to 6000px; shipping those would be
// several megabytes of decoration on a page about honest measurement.
const WIDTH = 1200

const ACCEPTED = /^(CC0|Public domain|CC BY [\d.]+|CC BY-SA [\d.]+)$/i

// slot: where the piece is allowed to appear. `band` = wide enough to run as a
// full-bleed divider; `plate` = portrait/object, shown in the grid only.
const WORKS = [
  {
    id: 'aelst-flowers-watch',
    file: 'Willem van Aelst - Vase of Flowers with Pocket Watch - WGA00050.jpg',
    slot: 'plate',
    artwork: 'Vase of Flowers with a Pocket Watch',
    artist: 'Willem van Aelst',
    year: '1656',
    collection: 'Mauritshuis, The Hague',
    focus: 'center 70%',
    caption:
      'An open gold watch lies on a blue ribbon at the foot of the vase. The flowers are the claim — beauty, at its peak, already going. The watch is the instrument measuring how fast.',
  },
  {
    id: 'claesz-vanitas-1632',
    file: 'Pieter Claesz - Vanitas Still Life - 943 - Mauritshuis.jpg',
    slot: 'band',
    artwork: 'Vanitas Still Life',
    artist: 'Pieter Claesz',
    year: '1632',
    collection: 'Mauritshuis, The Hague',
    focus: 'center 60%',
    caption:
      'A skull, a toppled glass, a guttered lamp — and a gold pocket watch lying open on a blue ribbon with its winding key beside it. The skull states the conclusion; the watch is the only object on the table actually counting.',
  },
  {
    id: 'collier-vanitas-1662',
    file: 'Vanitas Still Life MET DP146494.jpg',
    slot: 'band',
    artwork: 'Vanitas Still Life',
    artist: 'Evert Collier',
    year: '1662',
    collection: 'The Metropolitan Museum of Art, New York',
    focus: 'center 55%',
    caption:
      'A globe, a violin, sheet music, books, an hourglass at the upper right and a skull at the edge of the frame. Everything a 17th-century gentleman used to fill a life, arranged around the two objects that measure it.',
  },
  {
    id: 'pereda-knights-dream',
    file: 'Antonio de Pereda - El sueño del caballero - Google Art Project.jpg',
    slot: 'band',
    artwork: "The Knight's Dream (El sueño del caballero)",
    artist: 'Antonio de Pereda',
    year: 'c. 1650',
    collection: 'Real Academia de Bellas Artes de San Fernando, Madrid',
    focus: 'center 45%',
    caption:
      'A knight sleeps while an angel unrolls a banner reading AETERNE PVNGIT · CITO VOLAT · ET OCCIDIT — it stings forever, it flies swiftly, and it kills. On the table beside the skull and the coins sits a gilt table clock.',
  },
  {
    id: 'steenwijck-vanitas',
    file: 'Harmen Steenwijck - Vanitas Still-Life - WGA21768.jpg',
    slot: 'band',
    artwork: 'Vanitas Still-Life',
    artist: 'Harmen Steenwijck',
    year: 'c. 1640',
    collection: 'Stedelijk Museum De Lakenhal, Leiden',
    focus: 'center 50%',
    caption:
      'Books, a lute, a shell, a Japanese sword, a skull — the possessions of a life of taste, lit from the left and going nowhere. Steenwijck was the Leiden school at its most severe.',
  },
  {
    id: 'oosterwijck-vanitas-1668',
    file: 'Vanitas-Still Life, Oosterwijck.jpg',
    slot: 'plate',
    artwork: 'Vanitas Still Life',
    artist: 'Maria van Oosterwijck',
    year: '1668',
    collection: 'Kunsthistorisches Museum, Vienna',
    focus: 'center 55%',
    caption:
      'An hourglass stands upright between a celestial globe and a ledger marked Rekeningh — "account." Oosterwijck was paid more than most of her male contemporaries and never joined a guild that would have taken a cut.',
  },
  // The four below carry the page dividers on Home / About / Economy / Bible.
  // None is museum-held — each surfaced through an auction house — so the
  // `collection` field says that instead of borrowing a museum's authority.
  {
    id: 'willebeeck-vanity-fruit',
    file: 'Peter Willebeeck - Vanity with fruit, books, pocket watch, wine glass, extinguished candle and skull on partially draped stone entablature.jpg',
    slot: 'band',
    artwork: 'Vanity with Fruit, Books, Pocket Watch, Wine Glass, Extinguished Candle and Skull',
    artist: 'Petrus Willebeeck',
    year: '1632–1648',
    collection: 'Private collection (via Christie’s)',
    focus: 'center 58%',
    caption:
      'A melon, grapes and plums at the peak of ripeness, a skull resting on a book behind them, and a jewelled gold watch on a blue ribbon at the front edge of the table. Fruit rots on a schedule; the watch is the schedule.',
  },
  {
    id: 'roestraten-vanitas-carpet',
    file: 'Pseudo-Roestraten - Vanitas with a skull, lute, hourglass, watch, letters and other objects on an table draped with an oriental carpet.jpg',
    slot: 'band',
    artwork: 'Vanitas with a Skull, Lute, Hourglass, Watch and Letters',
    artist: 'Pseudo-Roestraten',
    year: 'c. 1675–1725',
    collection: 'Private collection (via Christie’s)',
    focus: 'center 62%',
    caption:
      'Letters, sheet music, a lute and a skull on an oriental carpet, with an open gold watch lying flat among the papers. The correspondence is the life; the watch is the deadline nobody in the picture has read yet.',
  },
  {
    id: 'gijsbrechts-vanitas-1662',
    file: 'Cornelis Norbertus Gijsbrechts - Vanitas still life with a skull, sheet music, violin, globe, candle, hourglass and playing cards, all on a draped table.jpg',
    slot: 'band',
    artwork: 'Vanitas Still Life with a Skull, Violin, Globe, Candle and Playing Cards',
    artist: 'Cornelis Norbertus Gijsbrechts',
    year: '1662',
    collection: 'Sœr Rusche Collection (via Sotheby’s, 2019)',
    focus: 'center 55%',
    caption:
      'A violin, a globe, playing cards, a guttering candle and a skull — and a watch on a blue ribbon hanging off the right edge of the table. Gijsbrechts painted the same argument for twenty years and never softened it.',
  },
  {
    id: 'renard-vanitas',
    file: 'Simon Renard De Saint-André - Vanitas Still-Life - WGA19268.jpg',
    slot: 'band',
    artwork: 'Vanitas Still-Life',
    artist: 'Simon Renard de Saint-André',
    year: 'later 17th century',
    collection: 'Collection not recorded',
    focus: 'center 55%',
    caption:
      'A skull garlanded with pearls and laurel, a violin bow, a recorder, an open score — and a watch on a pale blue ribbon at the lower left. The instruments make the music; the watch is what the music is measured in.',
  },
  {
    id: 'huaud-watch-case',
    file: 'Boitier de montre Adoration des bergers (Louvre, OA 8438).jpg',
    slot: 'plate',
    artwork: 'Watch case: The Adoration of the Shepherds',
    artist: 'Jean-Pierre and Ami Huaud (Les frères Huaud), Geneva',
    year: '1686–1700',
    collection: 'Musée du Louvre, Paris',
    focus: 'center 50%',
    caption:
      'Before the dial was a canvas, the case was. The Huaud brothers of Geneva painted in enamel on the backs of pocket watches — a museum picture roughly 50mm across, made to be carried in a pocket and shut.',
  },
]

const strip = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const normLicense = (raw) => {
  const v = strip(raw)
  if (!v) return null
  if (/^cc0/i.test(v) || /^public domain/i.test(v)) return /^cc0/i.test(v) ? 'CC0' : 'Public domain'
  const sa = v.match(/CC BY-SA (\d+\.\d+)/i)
  if (sa) return `CC BY-SA ${sa[1]}`
  const by = v.match(/CC BY (\d+\.\d+)/i)
  if (by) return `CC BY ${by[1]}`
  return null
}

async function info(file) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + file)}&prop=imageinfo&iiprop=url|extmetadata|size&format=json`
  const r = await fetch(u, { headers: UA })
  if (!r.ok) return null
  const d = await r.json()
  for (const p of Object.values(d.query?.pages ?? {})) if (p.imageinfo) return p.imageinfo[0]
  return null
}

async function download(file, dest) {
  const u = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${WIDTH}`
  const r = await fetch(u, { headers: UA, redirect: 'follow' })
  if (!r.ok) throw new Error(`download ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(dest, buf)
  return buf.length
}

mkdirSync(OUT_IMG, { recursive: true })

const out = []
let dropped = 0

for (const w of WORKS) {
  const ii = await info(w.file)
  if (!ii) {
    console.error(`✗ ${w.id} — no Commons record, dropped`)
    dropped++
    continue
  }
  const meta = ii.extmetadata ?? {}
  const license = normLicense(meta.LicenseShortName?.value)
  if (!license || !ACCEPTED.test(license)) {
    console.error(`✗ ${w.id} — licence "${strip(meta.LicenseShortName?.value)}" not on accept list, dropped`)
    dropped++
    continue
  }
  const ext = w.file.slice(w.file.lastIndexOf('.')).toLowerCase()
  const local = `/img/art/${w.id}${ext}`
  const bytes = await download(w.file, `${OUT_IMG}/${w.id}${ext}`)

  out.push({
    id: w.id,
    slot: w.slot,
    artwork: w.artwork,
    artist: w.artist,
    year: w.year,
    collection: w.collection,
    caption: w.caption,
    focus: w.focus,
    local,
    license,
    credit: strip(meta.Credit?.value).slice(0, 120) || null,
    source_url: ii.descriptionurl,
    commons_file: w.file,
    width: ii.width,
    height: ii.height,
    bytes,
  })
  console.log(`✓ ${w.id} — ${license} — ${(bytes / 1024).toFixed(0)}KB`)
}

if (dropped) {
  console.error(`\n${dropped} work(s) dropped. Not writing a partial file silently — fix or remove them.`)
  process.exit(1)
}

const POLICY =
  'Wikimedia Commons only; CC0, Public domain, CC BY or CC BY-SA (no NC, no ND). Attribution and licence shown on the page, linked to the Commons file. Works still in copyright are described and linked, never reproduced.'

const payload = {
  built: new Date().toISOString().slice(0, 10),
  policy: POLICY,
  count: out.length,
  works: out,
}

// The JSON is the auditable record — licence proof, byte counts, source URLs.
writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + '\n')

// The TS module is what the app imports. Seven records is far too little to
// justify a runtime fetch, and a synchronous import means an art band can
// never pop in late or shift the layout under a reader.
writeFileSync(
  OUT_TS,
  `// GENERATED by scripts/build_art_timepieces.mjs — do not edit by hand.
// Re-run the script to change anything here. Licence strings are read from
// the Commons API at build time, never typed in.

export interface ArtWork {
  id: string
  slot: 'band' | 'plate'
  artwork: string
  artist: string
  year: string
  collection: string
  caption: string
  focus: string
  local: string
  license: string
  credit: string | null
  source_url: string
  commons_file: string
  width: number
  height: number
  bytes: number
}

export const ART_POLICY = ${JSON.stringify(POLICY)}

export const ART_BUILT = ${JSON.stringify(payload.built)}

export const ART_WORKS: ArtWork[] = ${JSON.stringify(out, null, 2)}

export const artById = (id: string): ArtWork | undefined =>
  ART_WORKS.find((w) => w.id === id)
`,
)

console.log(`\n✓ ${out.length} artworks → ${OUT_JSON} + ${OUT_TS}`)
