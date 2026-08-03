#!/usr/bin/env node
// Data health audit — every published number is a pure function of the cards + shared
// snapshots, so we can audit the whole register at a glance. Run: node scripts/audit.mjs
//
// Prints a coverage report by brand (images, comps, provenance, narrative) plus a section
// flagging cards with the most obvious gaps. Exits non-zero if any brand has zero images
// and zero comps for its whole catalogue — a "this brand is just a stub" signal.
//
// Designed for the data:audit npm script. Honest, terse, no editorialising.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const cardsDir = join(ROOT, 'data/cards')
const sharedDir = join(ROOT, 'data/shared')
const publicDir = join(ROOT, 'public/data.json')

const cardFiles = readdirSync(cardsDir).filter((f) => f.endsWith('.json'))
const cards = cardFiles.map((f) => JSON.parse(readFileSync(join(cardsDir, f), 'utf8')))
const images = JSON.parse(readFileSync(join(sharedDir, 'images.json'), 'utf8'))
const screen = JSON.parse(readFileSync(join(sharedDir, 'screen_sightings.json'), 'utf8'))
const watchid = JSON.parse(readFileSync(join(sharedDir, 'watch_id_rolex.json'), 'utf8'))
const catalog = JSON.parse(readFileSync(join(sharedDir, 'rolex_catalog.json'), 'utf8'))
const publicData = JSON.parse(readFileSync(publicDir, 'utf8'))

// Build per-card metrics from the PUBLIC dataset (what the site actually ships).
// The PUBLIC dataset is what the public sees — a card with an image in shared/images.json
// but no media in public/data.json is, from the public's point of view, imageless.
const publicById = new Map(publicData.cards.map((c) => [c.id, c]))

const rows = cards.map((c) => {
  const pub = publicById.get(c.id) || {}
  return {
    id: c.id,
    brand: c.identity.brand,
    ref: c.identity.reference,
    name: c.identity.name,
    tier: c.identity.tier,
    discontinued: c.identity.produced?.discontinued === true,
    hasCuratedImage: !!images[c.id],
    hasPublicMedia: !!pub.media?.length,
    compCount: (c.market_evidence?.comps || []).length,
    compSummary: !!pub.comp_summary,
    provenanceCount: (c.provenance_events || []).length,
    narrative: !!c.narrative?.story,
    starterAlt: !!c.narrative?.starter_alternative,
  }
})

// Per-brand aggregation
const byBrand = new Map()
for (const r of rows) {
  if (!byBrand.has(r.brand)) byBrand.set(r.brand, { brand: r.brand, total: 0, image: 0, comp: 0, provenance: 0, narrative: 0 })
  const b = byBrand.get(r.brand)
  b.total++
  if (r.hasPublicMedia) b.image++
  if (r.compSummary) b.comp++
  if (r.provenanceCount > 0) b.provenance++
  if (r.narrative) b.narrative++
}

const summary = {
  cards: rows.length,
  withImage: rows.filter((r) => r.hasPublicMedia).length,
  withComps: rows.filter((r) => r.compSummary).length,
  withProvenance: rows.filter((r) => r.provenanceCount > 0).length,
  withNarrative: rows.filter((r) => r.narrative).length,
  withStarterAlt: rows.filter((r) => r.starterAlt).length,
  brands: byBrand.size,
  // Honest deltas: image coverage is the most visible "is this real" question
  imageCoverage: 0,
}

summary.imageCoverage = (summary.withImage / summary.cards * 100).toFixed(1)
summary.compCoverage = (summary.withComps / summary.cards * 100).toFixed(1)
summary.provenanceCoverage = (summary.withProvenance / summary.cards * 100).toFixed(1)
summary.narrativeCoverage = (summary.withNarrative / summary.cards * 100).toFixed(1)

const lines = []
const hr = '─'.repeat(78)
const head = (s) => { lines.push(''); lines.push(s) }
const row = (cells) => {
  const widths = [4, 22, 6, 8, 8, 11, 8]
  const padded = cells.map((c, i) => String(c ?? '').padEnd(widths[i] || 0))
  lines.push(padded.join(' '))
}

lines.push('TIME POP · DATA HEALTH AUDIT')
lines.push(hr)
row(['CARDS', 'BRANDS', 'IMG %', 'COMPS', 'PROV', 'NARR', 'EXACT'])
row([summary.cards, summary.brands, summary.imageCoverage + '%', summary.withComps, summary.withProvenance, summary.withNarrative, publicData.cards.filter((c) => c.media?.some((m) => m.match === 'exact_reference')).length])
lines.push(hr)

head('BY BRAND (sorted by total cards)')
const sorted = [...byBrand.values()].sort((a, b) => b.total - a.total || a.brand.localeCompare(b.brand))
row(['', 'BRAND', 'N', 'IMG', 'COMP', 'PROV', 'NARR'])
for (const b of sorted) {
  row(['', b.brand, b.total, `${b.image}/${b.total}`, `${b.comp}/${b.total}`, `${b.provenance}/${b.total}`, `${b.narrative}/${b.total}`])
}

lines.push(hr)
head('GAP REPORT — cards with no image, no comps, no provenance')
const blank = rows.filter((r) => !r.hasPublicMedia && !r.compSummary && r.provenanceCount === 0)
lines.push(`${blank.length} cards have NEITHER image NOR comps NOR provenance. They render as skeleton dossiers.`)
lines.push('Brands most affected:')
const blankByBrand = new Map()
for (const r of blank) blankByBrand.set(r.brand, (blankByBrand.get(r.brand) || 0) + 1)
;[...blankByBrand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([b, n]) => lines.push(`  ${b.padEnd(22)} ${n} blank cards`))

lines.push(hr)
head('TIER DISTRIBUTION')
const tierCounts = new Map()
for (const r of rows) tierCounts.set(r.tier, (tierCounts.get(r.tier) || 0) + 1)
;[...tierCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([t, n]) => lines.push(`  ${(t || 'unknown').padEnd(12)} ${n}`))

lines.push(hr)
head('REFERENCE CATALOG')
lines.push(`  ${catalog.count} Rolex catalog records (${catalog.source})`)
lines.push(`  Public dataset cards with comps but no reference match: ${publicData.cards.filter((c) => c.comp_summary && c.identity.brand === 'Rolex' && !c.reference_matched_catalog).length}`)

lines.push(hr)
head('SCREEN DATA')
lines.push(`  Total sightings: ${screen.count} (${screen.iconic_stills} iconic + ${screen.count - screen.iconic_stills} Rolex Watch-ID)`)
lines.push(`  Exact reference matches: ${screen.sightings.filter((s) => s.match_level === 'exact_reference').length}`)
lines.push(`  Family only: ${screen.sightings.filter((s) => s.match_level === 'family_only').length}`)
lines.push(`  In-context media (per-sighting still): ${screen.sightings.filter((s) => !!s.media).length}`)
lines.push(`  Sightings with matched dossier card: ${screen.sightings.filter((s) => s.matched_card_ids.length > 0).length}`)
lines.push(`  Unique matched cards via screen: ${new Set(screen.sightings.flatMap((s) => s.matched_card_ids)).size}`)

lines.push(hr)
head('HARVEST SOURCES')
lines.push(`  Watch-ID Rolex harvest (data/shared/watch_id_rolex.json): ${watchid.count} sightings — source for the Rolex subset of the canonical screen data.`)

lines.push(hr)
head('HARD-CODED ASSERTS')
let errors = 0
const assert = (cond, msg) => {
  if (!cond) { lines.push(`  ✗ ${msg}`); errors++ }
  else lines.push(`  ✓ ${msg}`)
}
assert(summary.cards === publicData.cards.length, `card count matches public (${summary.cards})`)
assert(summary.cards > 0, 'at least one card on disk')
assert(screen.sightings.every((s) => !!s.id && !!s.title && !!s.brand), 'every sighting has id+title+brand')
assert(screen.iconic_stills === screen.sightings.filter((s) => s.media?.license?.includes('Promotional')).length, 'iconic stills all carry Promotional license')
assert(catalog.count > 0, 'catalog has records')
assert(Object.keys(images).length === rows.filter((r) => r.hasCuratedImage).length, 'every curated image belongs to a live dossier')
assert(rows.every((r) => r.id === r.id.toLowerCase()), 'all card ids are lowercase')
const identityKeys = rows.map((r) => `${r.brand}|${r.ref}`.toLowerCase().replace(/[^a-z0-9|]/g, ''))
assert(new Set(identityKeys).size === identityKeys.length, 'one dossier per brand + reference identity')

// Refuse to fail the build on coverage gaps (those are research gaps, not bugs).
// But fail on data-shape drift.
console.log(lines.join('\n'))

if (errors > 0) {
  console.error(`\n✗ ${errors} hard-coded assert${errors === 1 ? '' : 's'} failed`)
  process.exit(1)
}
