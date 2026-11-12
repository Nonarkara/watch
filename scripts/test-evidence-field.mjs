import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  EVIDENCE_CHANNELS,
  evidenceChannels,
  evidenceColumnOffset,
  evidenceDepth,
  metricValue,
} from '../src/lib/evidence-field.ts'

const data = JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8'))
const depths = data.cards.map(evidenceDepth)
for (const id of ['rolex-126900', 'rolex-16710', 'rolex-116610ln']) {
  const card = data.cards.find(row => row.id === id)
  assert.ok(card?.media[0]?.caption && card.media[0].source_url.includes('commons.wikimedia.org'))
  assert.equal(card.media[0].match, 'exact_reference', `${id}: a source caption does not make an exact photo a family match`)
  assert.equal(evidenceChannels(card).photo, true)
}

assert.equal(depths.length, data.count, 'one evidence-field point per published dossier')
assert.ok(depths.every((depth) => Number.isInteger(depth) && depth >= 0 && depth <= 5), 'evidence depth stays in [0,5]')
assert.equal(depths.reduce((sum, _depth, index) => sum + Object.values(evidenceChannels(data.cards[index])).filter(Boolean).length, 0),
  depths.reduce((sum, depth) => sum + depth, 0), 'depth is exactly the five disclosed binary channels')
assert.equal(Array.from({ length: 6 }, (_, depth) => depths.filter((value) => value === depth).length).reduce((a, b) => a + b, 0),
  data.count, 'evidence-depth columns conserve the full dataset')
assert.ok(data.cards.every((card) => metricValue(card, 'scarcity') === card.computed.scarcity.value
  && metricValue(card, 'collectibility') === card.computed.collectibility.value), 'the chart reads published metrics without recomputing them')
assert.equal(EVIDENCE_CHANNELS.length, 5, 'the public evidence contract has five named channels')
const specimen = structuredClone(data.cards[0])
specimen.media = [{ match: 'reference_family' }]
assert.equal(evidenceChannels(specimen).photo, false)
specimen.media = [{ match: 'exact_reference' }]
assert.equal(evidenceChannels(specimen).photo, true)
for (const value of [null, NaN, -1, 101]) {
  specimen.computed.scarcity.value = value
  assert.equal(metricValue(specimen, 'scarcity'), null)
}
specimen.computed.scarcity.value = 0
assert.equal(metricValue(specimen, 'scarcity'), 0, 'a published zero remains a plotted value')
const offsets = data.cards.map((card) => evidenceColumnOffset(card.id))
assert.deepEqual(offsets, data.cards.map((card) => evidenceColumnOffset(card.id)), 'point spread is deterministic')
assert.ok(offsets.every((offset) => Math.abs(offset) <= 24), 'point spread stays inside its evidence-depth column')

console.log(`✓ evidence field conserves ${data.count} dossiers across five disclosed channels`)
