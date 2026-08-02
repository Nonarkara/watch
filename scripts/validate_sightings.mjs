#!/usr/bin/env node
// Sightings validator — the invariant gate for data/shared/screen_sightings.json.
// Mirrors scripts/validate_card.mjs shape (returns [] on pass, errors on fail).
// Run: node scripts/validate_sightings.mjs
//
// What we check, and why:
//   - id, brand, watch, title, description, source_url are required on every sighting
//     (a sighting without an id can't be deep-linked; without a brand the card-portrait
//     lookup can't find a match).
//   - media_type ∈ {film, television, other}; release_year is a 4-digit year or null.
//   - identification ∈ {reported, tentative}; match_level ∈ {exact_reference, family_only}.
//   - exact_reference sightings MUST name at least one card; family_only can be empty.
//   - iconic stills (media with Promotional / editorial licence) MUST carry credit, source_url,
//     license, caption — every field. The Watch-ID sightings (no media) are exempt.
//   - No duplicate ids.
//
// Note: data/shared/watch_id_rolex.json is a separate harvest source, not a duplicate of
// the canonical screen_sightings.json — it contains the 31 Rolex Watch-ID sightings that
// the build merges with 14 iconic stills into the canonical 45. The validator checks the
// canonical only.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const PATH = join(ROOT, 'data/shared/screen_sightings.json')

const ALLOWED_MEDIA = new Set(['film', 'television', 'other'])
const ALLOWED_ID = new Set(['reported', 'tentative'])
const ALLOWED_MATCH = new Set(['exact_reference', 'family_only'])
const PROMO = 'Promotional'

const isUrl = (u) => typeof u === 'string' && /^https?:\/\/.+\..+/.test(u)
const isYear = (y) => y === null || (Number.isInteger(y) && y >= 1900 && y <= 2100)

export function validateSightings(doc) {
  const errs = []
  const req = (cond, msg) => { if (!cond) errs.push(msg) }

  if (!doc || !Array.isArray(doc.sightings)) {
    errs.push('sightings array missing')
    return errs
  }
  const ids = new Set()
  for (const [i, s] of doc.sightings.entries()) {
    req(typeof s.id === 'string' && s.id.length > 0, `sighting[${i}].id required`)
    if (s.id) {
      req(!ids.has(s.id), `sighting[${i}].id duplicate: ${s.id}`)
      ids.add(s.id)
    }
    req(typeof s.brand === 'string' && s.brand, `sighting[${i}].brand required`)
    req(typeof s.watch === 'string' && s.watch, `sighting[${i}].watch required`)
    req(typeof s.title === 'string' && s.title, `sighting[${i}].title required`)
    req(typeof s.description === 'string' && s.description.length > 20, `sighting[${i}].description too short`)
    req(ALLOWED_MEDIA.has(s.media_type), `sighting[${i}].media_type invalid: ${s.media_type}`)
    req(isYear(s.release_year), `sighting[${i}].release_year invalid: ${s.release_year}`)
    req(ALLOWED_ID.has(s.identification), `sighting[${i}].identification invalid: ${s.identification}`)
    req(ALLOWED_MATCH.has(s.match_level), `sighting[${i}].match_level invalid: ${s.match_level}`)
    req(s.match_level === 'family_only' || Array.isArray(s.matched_card_ids),
      `sighting[${i}].matched_card_ids must be an array`)
    req(s.match_level !== 'exact_reference' || (s.matched_card_ids || []).length > 0,
      `sighting[${i}] exact_reference but no matched_card_ids`)
    req(isUrl(s.source_url), `sighting[${i}].source_url must be a URL`)

    // Iconic stills (in-scene / premiere / press) carry an explicit media block.
    if (s.media) {
      req(s.media.type === 'image', `sighting[${i}].media.type must be image`)
      req(typeof s.media.url === 'string' && s.media.url.length > 0,
        `sighting[${i}].media.url required`)
      req(isUrl(s.media.source_url), `sighting[${i}].media.source_url must be a URL`)
      req(typeof s.media.credit === 'string' && s.media.credit.length > 0,
        `sighting[${i}].media.credit required`)
      req(typeof s.media.license === 'string' && s.media.license.length > 0,
        `sighting[${i}].media.license required`)
      // Iconic stills are always Promotional / editorial — they are not free-reuse.
      // Reject any new sighting that claims a free-licence image source unless it
      // carries a CC0/CC-BY/PD mark.
      if (s.media.license.startsWith(PROMO) === false) {
        const licence = s.media.license || ''
        const freeReuse = /\b(CC0|CC BY(-SA)? \d|Creative Commons|Public Domain)\b/.test(licence)
        req(freeReuse, `sighting[${i}].media.license must be either Promotional/editorial OR a CC/PD free-reuse licence — got: ${licence.slice(0, 80)}`)
      }
      req(typeof s.media.caption === 'string' && s.media.caption.length > 10,
        `sighting[${i}].media.caption required`)
    }
  }
  return errs
}

// CLI: only when this file is the entrypoint, not when imported by test-invariants.mjs
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
const isDirectRun = process.argv[1] && (() => {
  try { return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]) }
  catch { return false }
})()

if (isDirectRun) {
  const doc = JSON.parse(readFileSync(PATH, 'utf8'))
  const errs = validateSightings(doc)
  if (errs.length > 0) {
    console.error('✗ sightings validation failed:')
    for (const e of errs) console.error('  -', e)
    process.exit(1)
  }

  const iconic = doc.iconic_stills ?? doc.sightings.filter((s) => s.media?.license?.startsWith('Promotional')).length
  console.log(`✓ ${doc.sightings.length} sightings validate (${iconic} iconic stills)`)
}
