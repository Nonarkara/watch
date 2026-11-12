import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  GLOBAL_VENUES,
  VERIFIED_FEE_RULES,
  getVenueScenarios,
} from '../src/lib/venues.ts'

const data = JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8'))
const submariner = data.cards.find((card) => card.id === 'rolex-126610ln')
assert.ok(submariner, '126610LN fixture must exist in the public build')

// Keep fee arithmetic independent of changes to the published market evidence.
const feeFixture = structuredClone(submariner)
Object.assign(feeFixture.computed.estimate, { value: 13_750, n: 3, as_of: '2025-11-20', reason: null })
feeFixture.computed.confidence.tier = 'C'
const scenarios = getVenueScenarios(feeFixture)
assert.equal(scenarios.length, GLOBAL_VENUES.length, 'fee lab must preserve the full venue directory')
assert.equal(Object.keys(VERIFIED_FEE_RULES).length, 2, 'only checked fee schedules may produce math')

const chrono24 = scenarios.find((row) => row.venue.id === 'chrono24')
assert.equal(chrono24.baseline_value, 13_750)
assert.equal(chrono24.seller_proceeds, 12_856)
assert.equal(chrono24.buyer_total, null, 'an unverified buyer fee must stay blank')
assert.equal(chrono24.baseline_n, 3)
assert.equal(chrono24.baseline_confidence, 'C')
assert.equal(chrono24.baseline_as_of, '2025-11-20')
assert.match(chrono24.fee_rule.sources[0].url, /^https:\/\/www\.chrono24\.com\//)
assert.match(chrono24.limitation, /Assumes the watch sells at the dossier baseline/)

const loupe = scenarios.find((row) => row.venue.id === 'loupe-this')
assert.equal(loupe.seller_proceeds, 13_250)
assert.equal(loupe.buyer_total, 15_125)
assert.equal(loupe.fee_rule.sources.length, 2, 'seller and buyer fee claims need their own records')
assert.ok(loupe.fee_rule.sources.every((source) => /^https:\/\/loupethis\.com\//.test(source.url)))
assert.match(loupe.limitation, /Assumes the dossier baseline is the hammer price/)

const unverified = scenarios.find((row) => row.venue.id === 'phillips')
assert.equal(unverified.fee_rule, null)
assert.equal(unverified.seller_proceeds, null)
assert.equal(unverified.buyer_total, null)

const noEstimate = structuredClone(submariner)
noEstimate.computed.estimate = { ...noEstimate.computed.estimate, value: null, reason: 'insufficient_comps' }
const refused = getVenueScenarios(noEstimate)
assert.ok(refused.every((row) => row.seller_proceeds == null && row.buyer_total == null),
  'fee schedules must not turn MSRP or missing evidence into a resale baseline')

const venueEngine = readFileSync(new URL('../src/lib/venues.ts', import.meta.url), 'utf8')
assert.ok(!venueEngine.includes('venue.valuation_multiplier'),
  'unsourced venue multipliers must never enter fee math')
const dossier = readFileSync(new URL('../src/pages/Dossier.tsx', import.meta.url), 'utf8')
assert.ok(!dossier.includes('Real-time estimated clearing tags'))
assert.ok(dossier.includes('These are not live venue quotes'))
const marketplace = readFileSync(new URL('../src/pages/Marketplaces.tsx', import.meta.url), 'utf8')
assert.ok(!marketplace.includes('v.description'),
  'uncited venue marketing claims and listing counts must not render')
assert.ok(marketplace.includes('SOURCE: TIME POP DIRECTORY · TIER WORKING · BUILD 2026-08-17'))

console.log('✓ venue math uses one cited baseline and verified fee schedules only')
