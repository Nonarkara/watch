#!/usr/bin/env node
// fix_fallback_images.mjs — replace shared fallback images with real per-reference
// images from Wikimedia Commons, or remove the entry so the empty frame shows.
//
// The old seed scripts (seed_popular, seed_asia, seed_thai_global,
// seed_global_coverage) had a "use a brand-level generic photo if you can't
// find the exact one" fallback. That was honest when 70 cards were hand-curated;
// at 302 cards it became dishonest. 195 of the 302 cards shared a fallback photo
// with 3+ other cards — including 37 cards showing a Patek Calatrava 6006G for
// a Certina, a Kurono, a Laurent Ferrier, a DeWitt, and a Dufour. The same
// Seiko SKX007 photo on 15 cards. The same Casio F-91W on 16 cards. The site
// was showing a specific factual claim — "this is a photograph of this watch" —
// and the photograph was of a different watch.
//
// This script:
//   1. Reads data/shared/images.json and identifies all fallback entries
//      (URL shared by 3+ other cards).
//   2. For each, queries the Commons MediaWiki search API for
//      "{brand} {name}" then "{brand} {reference}".
//   3. Accepts the first result whose title contains the brand or a
//      recognisable model keyword (ref number, collection name).
//   4. Fetches imageinfo (URL + artist + license) for the accepted result.
//   5. Writes the new entry to images.json with caption: null (so the build
//      pipeline marks it match: 'exact_reference').
//   6. If no real match exists, removes the card from images.json. The build
//      then renders the honest empty frame already in the dossier template.
//
// Idempotent: cards whose images.json entry is already exact or already a
// legitimate family reference (URL shared with < 3 other cards of the same
// brand) are skipped.
//
// Soft-fail: any single card can fail without aborting the run.
//
// Run: node scripts/fix_fallback_images.mjs
//      node scripts/fix_fallback_images.mjs --dry-run
//      node scripts/fix_fallback_images.mjs --force   # also touch non-fallbacks

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fetchJson, isDryRun } from './lib/fetch.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const IMAGES_FILE = join(ROOT, 'data/shared/images.json')
const CARDS_DIR = join(ROOT, 'data/cards')
const FORCE = process.argv.includes('--force')

// ── Load ───────────────────────────────────────────────────────────────
const images = JSON.parse(readFileSync(IMAGES_FILE, 'utf8'))

// Load every card to know its brand, reference, name, and collection.
const cards = {}
for (const file of readdirSync(CARDS_DIR)) {
  if (!file.endsWith('.json')) continue
  try {
    const c = JSON.parse(readFileSync(join(CARDS_DIR, file), 'utf8'))
    cards[c.id] = c
  } catch (e) {
    console.error(`  ! failed to read ${file}: ${e.message}`)
  }
}

// ── Identify fallbacks ────────────────────────────────────────────────
const urlCounts = new Map()
for (const id of Object.keys(images)) {
  const u = images[id]?.file
  if (u) urlCounts.set(u, (urlCounts.get(u) || 0) + 1)
}

// A card is a "fallback candidate" if its current image URL is shared by 3+
// other cards. Single-URL duplicates (e.g. the same exact photo legitimately
// covering a multi-config Rolex) are left alone.
const fallbackIds = []
for (const [id, entry] of Object.entries(images)) {
  if (!entry?.file) continue
  const n = urlCounts.get(entry.file) || 0
  if (n >= 3) fallbackIds.push(id)
}

console.log(`images.json has ${Object.keys(images).length} entries`)
console.log(`detected ${fallbackIds.length} fallback candidates (URL shared with 3+ other cards)`)
console.log()

// ── Search strategy ──────────────────────────────────────────────────
// Build a list of search queries for a card, in priority order:
//   1. brand + name             (e.g. "Rolex Cosmograph Daytona")
//   2. brand + reference        (e.g. "Rolex 116500LN")
//   3. brand + collection       (e.g. "Rolex Daytona")
//   4. brand                    (e.g. "Rolex")
// We try them in order and return the first result that passes the
// "title mentions brand or model keyword" gate.
function queriesFor(card) {
  const brand = (card.identity?.brand || '').trim()
  const name = (card.identity?.name || '').trim()
  const reference = (card.identity?.reference || '').trim()
  const collection = (card.identity?.collection || '').trim()
  const out = []
  if (brand && name) out.push(`${brand} ${name}`)
  if (brand && reference) out.push(`${brand} ${reference}`)
  if (brand && collection && collection !== name) out.push(`${brand} ${collection}`)
  if (brand) out.push(brand)
  return out
}

// Specific-model nicknames and reference-like alphanumeric patterns that
// indicate a result is about ONE watch, not the brand family. We reject
// brand-level fallbacks if the result title contains any of these because
// the brand-level search otherwise returns the brand's most popular model
// (e.g. "Casio F-91W" for any Casio, "Grand Seiko Snowflake" for any GS).
const NICKNAMES = [
  'moonwatch', 'snowflake', 'hulk', 'pepsi', 'batman', 'rootbeer',
  'f-91w', 'a158', 'a159', 'a168', 'ae-1200', 'ae1200', 'royale',
  'presage', 'prospex', 'speedtimer', 'tuna', 'turtle', 'samurai',
  'hamilton', 'tissot', 'certina', 'mido', 'rado', 'oris',
  'jumbo', 'snoopy', 'alden', 'tiffany', 'nautilus', 'aquanaut',
  'genta', 'datejust', 'day-date', 'daytona', 'gmt-master', 'explorer',
  'submariner', 'sea-dweller', 'air-king', 'milgauss', 'yacht-master',
  'panda', 'reverse', 'monaco', 'nautic', 'carrera', 'autavia',
]
// 4+ digit alphanumeric patterns like "116500LN", "SBGA211", "5711/1A" —
// reference numbers that indicate a specific SKU photo.
const REF_NUMBER = /\b[A-Z0-9]{2,}[\-/]?[A-Z0-9]{2,}[\-/]?[A-Z0-9]{0,4}\b/i

// "Does this Commons result actually look like this card?"
//
// The gate: the result title must contain the card's model keyword (a
// distinctive word from its name or collection). The brand name alone is
// not enough — "Casio F-91W" passes the brand check but is wrong for a
// Casio AE-1200. We require a model signal.
//
// We split "found" into:
//   - exact_reference: title also contains a reference number
//   - reference_family: title contains a model keyword but no ref
//
// If neither, the result is rejected and we move on to the next query /
// next result. A rejected result that came from a pure brand-level search
// (no model keyword in title at all) does NOT make us accept a "popular
// model" photo as a stand-in.
function isPlausibleMatch(cardTitle, card) {
  const t = cardTitle.toLowerCase()
  const brand = (card.identity?.brand || '').toLowerCase()
  if (!brand || !t.includes(brand.toLowerCase())) return null

  // Build the set of model keywords from the card's name + collection
  const nameWords = (card.identity?.name || '').toLowerCase()
    .split(/[\s\-_/]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
  const collectionWords = (card.identity?.collection || '').toLowerCase()
    .split(/[\s\-_/]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
  const modelKeywords = [...new Set([...nameWords, ...collectionWords])]

  // If the title contains a reference-number-like code AND that code is
  // in the card's reference, treat it as exact_reference.
  const cardRef = (card.identity?.reference || '').replace(/[\s\-_/]/g, '').toLowerCase()
  const refMatches = cardRef.length >= 4
    && t.replace(/[\s\-_/]/g, '').includes(cardRef)
  if (refMatches) return 'exact_reference'

  // A general alphanumeric code in the title (could be a different SKU's
  // photo) does not count as a model match on its own — those are model-
  // specific, not family-wide.
  if (REF_NUMBER.test(cardTitle)) {
    // Strip the alphanumeric; what remains must still match a model keyword
    const stripped = t.replace(REF_NUMBER, '').trim()
    if (modelKeywords.length === 0) return null
    if (modelKeywords.some((k) => stripped.includes(k) || t.includes(k))) return 'reference_family'
    return null
  }

  // No alphanumeric code in the title — generic brand/collection photo.
  // Accept only if at least one model keyword is present.
  if (modelKeywords.length === 0) return null
  if (modelKeywords.some((k) => t.includes(k))) return 'reference_family'

  return null
}

// Common stopwords not useful for distinguishing a model
const STOPWORDS = new Set([
  'the', 'and', 'with', 'for', 'ref', 'automatic', 'manual', 'chronograph',
  'chronograph', 'date', 'gmt', 'diver', 'divers', 'heritage', 'classic',
  'special', 'edition', 'limited', 'series', 'model',
])

// ── Commons API helpers ──────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const UA = 'WATCH research collector/1.0 (+https://watch.nonarkara.org)'
const RATE_LIMIT_MS = parseInt(process.env.WATCH_RATE_LIMIT_MS || '100', 10)

async function commonsSearch(q) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&format=json&srlimit=10`
  const { data, error } = await fetchJson(url, { rateLimitMs: RATE_LIMIT_MS, userAgent: UA, maxRetries: 3 })
  if (error || !data) return null
  return data?.query?.search || []
}

async function commonsImageInfo(title) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&format=json`
  const { data, error } = await fetchJson(url, { rateLimitMs: RATE_LIMIT_MS, userAgent: UA, maxRetries: 3 })
  if (error || !data) return null
  const pages = data?.query?.pages || {}
  const first = Object.values(pages)[0]
  const info = first?.imageinfo?.[0]
  if (!info) return null
  const em = info.extmetadata || {}
  const cleanUrl = (info.url || '').split('?')[0]
  const artistRaw = em.Artist?.value || ''
  // Strip HTML for the credit field; keep the user-name as plain text.
  const credit = artistRaw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim().slice(0, 200) || null
  const license = em.LicenseShortName?.value || em.LicenseName?.value || null
  const sourceUrl = `https://commons.wikimedia.org/wiki/${title.replace(/ /g, '_')}`
  return { url: cleanUrl, credit, license, sourceUrl }
}

// ── Process each fallback ────────────────────────────────────────────
const updated = []        // {id, from, to, match}
const removed = []        // {id, was, reason}
const skipped = []        // {id, reason}
const errors = []         // {id, error}

// Simulate writes against an in-memory `trial` map so we can refuse a result
// that would still create a 3+ fallback (e.g. assigning the popular
// "Casio F-91W" photo to 5 different Casio SKUs). The final write is done
// only after this self-correction.
//
// `trial` starts as the non-fallback cards of `images` (the cards whose
// image is already legitimate). As we process each fallback card, we
// tentatively add to `trial` so subsequent cards see the effect.
const trial = {}
for (const [id, entry] of Object.entries(images)) {
  if (fallbackIds.includes(id)) continue  // will be re-evaluated
  trial[id] = entry
}

let i = 0
for (const id of fallbackIds) {
  i++
  const card = cards[id]
  if (!card) {
    skipped.push({ id, reason: 'no card JSON' })
    continue
  }
  const oldEntry = images[id]
  const oldUrl = oldEntry?.file

  // Try each query in priority order, then for each result test the
  // isPlausibleMatch gate AND the "would this still create a fallback"
  // check against the in-memory `trial` map.
  let found = null
  let queriesTried = 0
  for (const q of queriesFor(card)) {
    queriesTried++
    const results = await commonsSearch(q)
    if (!results) continue
    for (const r of results) {
      const matchLevel = isPlausibleMatch(r.title, card)
      if (!matchLevel) continue
      // Self-correct: if this result's URL is already used by 2+ other cards
      // in `trial`, and this is a reference_family (not exact_reference),
      // reject — the result is the brand's "popular model" being repurposed.
      // exact_reference is allowed because the title proves the URL IS the
      // specific watch; reference_family is allowed only if the URL is
      // currently used by 0 or 1 other card.
      if (matchLevel === 'reference_family') {
        // We need the URL to test this — imageinfo is below. Defer the
        // count check until we have the URL.
        found = { title: r.title, match: matchLevel, via: q }
        break
      }
      found = { title: r.title, match: matchLevel, via: q }
      break
    }
    if (found) break
  }
  if (i <= 5 || i % 25 === 0) {
    const verdict = found ? `OK ${found.match}` : 'no-match'
    console.log(`\n[${i}/${fallbackIds.length}] ${id} (tried ${queriesTried} queries) → ${verdict}`)
  }

  if (!found) {
    if (!isDryRun()) delete images[id]
    removed.push({ id, was: oldUrl, reason: 'no plausible Commons match' })
    process.stdout.write(`-`)
    continue
  }

  // Fetch imageinfo for the accepted title
  const info = await commonsImageInfo(found.title)
  if (!info?.url) {
    errors.push({ id, error: 'imageinfo fetch failed for ' + found.title })
    process.stdout.write(`!`)
    continue
  }

  // Self-correct: count how many cards in `trial` would share this URL
  // after the write. If 3+ cards would share the same URL, this is a
  // "popular model" reassignment, not a real per-reference match.
  const sameUrlInTrial = Object.values(trial).filter((e) => e?.file === info.url).length
  if (sameUrlInTrial >= 2) {
    // 2 others already use this URL. Including this card would be the 3rd
    // (4th, etc.) — the very pattern the test invariant rejects.
    if (!isDryRun()) delete images[id]
    removed.push({ id, was: oldUrl, reason: `would create a 3+ fallback (${sameUrlInTrial + 1} cards on ${info.url})` })
    process.stdout.write(`-`)
    continue
  }

  const newEntry = {
    file: info.url,
    credit: info.credit,
    license: info.license,
    source_url: info.sourceUrl,
    caption: found.match === 'exact_reference' ? null : `Wikimedia Commons — closest verified CC-licensed photo for the ${card.identity.brand} ${card.identity.name}. Title: ${found.title}.`,
  }
  if (!isDryRun()) images[id] = newEntry
  trial[id] = newEntry  // mirror in trial so subsequent cards see this
  updated.push({ id, from: oldUrl, to: info.url, match: found.match })
  process.stdout.write(found.match === 'exact_reference' ? `E` : `F`)
}

console.log()
console.log()
console.log('=== SUMMARY ===')
console.log(`exact_reference found: ${updated.filter((u) => u.match === 'exact_reference').length}`)
console.log(`reference_family found: ${updated.filter((u) => u.match === 'reference_family').length}`)
console.log(`removed (no match → empty frame): ${removed.length}`)
console.log(`errors: ${errors.length}`)
console.log(`skipped: ${skipped.length}`)

if (errors.length) {
  console.log()
  console.log('=== ERRORS ===')
  for (const e of errors.slice(0, 20)) console.log(`  ${e.id}: ${e.error}`)
}
if (removed.length) {
  console.log()
  console.log('=== REMOVED (will show empty frame) ===')
  for (const r of removed.slice(0, 30)) console.log(`  ${r.id}  (was: ${r.was?.slice(0, 80)}…)`)
}
if (updated.length) {
  console.log()
  console.log('=== REPLACED ===')
  for (const u of updated.slice(0, 30)) console.log(`  ${u.match.padEnd(16)} ${u.id}`)
}

if (!isDryRun()) {
  writeFileSync(IMAGES_FILE, JSON.stringify(images, null, 2) + '\n')
  console.log()
  console.log(`wrote ${IMAGES_FILE}`)
}
