import assert from 'node:assert/strict'
import {
  HOLDING_PERIODS,
  NEUTRAL_ANNUAL_RATE,
  compoundValue,
  projectHoldingPeriods,
  summarizeCollectionEstimates,
} from '../src/lib/value-lab.ts'

assert.deepEqual(HOLDING_PERIODS, [1, 2, 3, 10, 20])
assert.equal(NEUTRAL_ANNUAL_RATE, 0, 'an unchosen growth assumption must not imply appreciation')

const complete = summarizeCollectionEstimates([
  { id: 'a', estimate: 10_000 },
  { id: 'b', estimate: 25_000 },
])
assert.deepEqual(complete, {
  count: 2,
  priced_count: 2,
  missing_ids: [],
  known_subtotal: 35_000,
  evidence_total: 35_000,
  complete: true,
})

const incomplete = summarizeCollectionEstimates([
  { id: 'a', estimate: 10_000 },
  { id: 'b', estimate: null },
  { id: 'c', estimate: Number.NaN },
])
assert.equal(incomplete.known_subtotal, 10_000)
assert.equal(incomplete.evidence_total, null, 'a partial subtotal must not become a collection valuation')
assert.deepEqual(incomplete.missing_ids, ['b', 'c'])
assert.equal(summarizeCollectionEstimates([]).evidence_total, null)

assert.equal(Math.round(compoundValue(10_000, 5, 20)), 26_533)
assert.deepEqual(projectHoldingPeriods(10_000, 0).map((row) => row.value),
  [10_000, 10_000, 10_000, 10_000, 10_000])
assert.deepEqual(projectHoldingPeriods(10_000, 5).map((row) => row.years), [1, 2, 3, 10, 20])

console.log('✓ value lab keeps collection coverage separate from scenario math')
