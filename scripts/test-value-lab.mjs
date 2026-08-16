import assert from 'node:assert/strict'
import {
  HOLDING_PERIODS,
  NEUTRAL_ANNUAL_RATE,
  compoundValue,
  projectHoldingPeriods,
  projectNetHoldingPeriods,
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

const net = projectNetHoldingPeriods(10_000, 5, 200, {
  seller_fee_pct: 6.5,
  seller_flat_fee_usd: null,
})
assert.equal(Math.round(net[0].value), 10_500)
assert.equal(Math.round(net[0].exit_fee), 683)
assert.equal(net[0].ownership_cost, 200)
assert.equal(net[0].net_proceeds, 9_617)
assert.equal(net[0].net_change, -383)
assert.equal(Number(net[0].break_even_annual_rate.toFixed(2)), 9.09)
assert.equal(net[4].ownership_cost, 4_000)
assert.equal(Math.round(net[4].net_proceeds), 20_808)
assert.ok(net.every((row) => row.value - row.exit_fee - row.ownership_cost === row.net_proceeds),
  'displayed whole-dollar inputs must conserve exactly into displayed net proceeds')

const flatFee = projectNetHoldingPeriods(10_000, 0, 0, {
  seller_fee_pct: null,
  seller_flat_fee_usd: 500,
}, [1])
assert.equal(flatFee[0].exit_fee, 500)
assert.equal(flatFee[0].net_proceeds, 9_500)
assert.equal(Number(flatFee[0].break_even_annual_rate.toFixed(2)), 5)

console.log('✓ value lab keeps evidence, gross scenarios, and net exit math separate')
