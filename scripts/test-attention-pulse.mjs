import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  advanceAttentionHistory,
  attentionAgeDays,
  compareSavedAttention,
  parseAttentionHistory,
  snapshotFromRows,
} from '../src/lib/attention-pulse.ts'

const dayOne = snapshotFromRows('2026-08-15', [
  { card_id: 'a', rank: 5 },
  { card_id: 'b', rank: 2 },
  { card_id: '', rank: 1 },
  { card_id: 'bad-rank', rank: 0 },
])
assert.deepEqual(dayOne.ranks, { a: 5, b: 2 })

const firstVisit = advanceAttentionHistory(null, dayOne)
assert.equal(firstVisit.previous, null)
assert.equal(compareSavedAttention(['a'], firstVisit.current, firstVisit.previous)[0].movement, 'current')

const sameDay = advanceAttentionHistory(firstVisit, snapshotFromRows('2026-08-15', [{ card_id: 'a', rank: 4 }]))
assert.equal(sameDay.previous, null, 'same-day refresh must not invent a prior day')
assert.equal(sameDay.current.ranks.a, 4)

const dayTwo = snapshotFromRows('2026-08-16', [
  { card_id: 'a', rank: 2 },
  { card_id: 'c', rank: 1 },
  { card_id: 'd', rank: 7 },
])
const nextVisit = advanceAttentionHistory(firstVisit, dayTwo)
assert.equal(nextVisit.previous?.as_of, '2026-08-15')

const pulse = compareSavedAttention(['a', 'b', 'c', 'd', 'quiet'], nextVisit.current, nextVisit.previous)
const byId = new Map(pulse.map((row) => [row.card_id, row]))
assert.deepEqual(byId.get('a'), { card_id: 'a', current_rank: 2, previous_rank: 5, movement: 'up', places: 3 })
assert.equal(byId.get('b')?.movement, 'out')
assert.equal(byId.get('c')?.movement, 'new')
assert.equal(byId.get('d')?.movement, 'new')
assert.equal(byId.get('quiet')?.movement, 'quiet')

assert.equal(attentionAgeDays('2026-08-16', new Date('2026-08-17T12:00:00Z')), 1)
assert.equal(attentionAgeDays('2026-08-16', new Date(2026, 7, 17, 0, 30)), 1,
  'age follows the visitor calendar day, not a rolling UTC 24-hour window')
assert.equal(attentionAgeDays('not-a-date', new Date('2026-08-17T12:00:00Z')), null)
assert.equal(parseAttentionHistory({ nope: true }), null)
assert.deepEqual(parseAttentionHistory(nextVisit), nextVisit)

console.log('✓ saved attention pulse preserves private daily rank history')

// ─── honest envelope: a stale harvest must say so ────────────────────────────
// The Sep–Oct 2026 GitHub Actions billing outage stopped the daily harvest for
// nine days and the site kept printing "AS OF <date>" as if it were current.
// Every surface that shows the attention snapshot must also show its age, and
// Home must be able to mark the snapshot stale. This is a disclosure test, not
// a styling test: the age string has to exist on both pages.
const homeSrc = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const savedSrc = readFileSync(new URL('../src/pages/Saved.tsx', import.meta.url), 'utf8')
assert.ok(homeSrc.includes('attentionAgeDays'),
  'Home must compute the attention snapshot age with attentionAgeDays')
assert.ok(homeSrc.includes('trendStale'),
  'Home must be able to mark the attention snapshot stale')
assert.ok(/STALE/.test(homeSrc) && /trendAge/.test(homeSrc),
  'Home must render the stale marker and the age value, not just compute them')
assert.ok(savedSrc.includes('attentionAgeDays') && /\$\{trendAge\} DAY/.test(savedSrc),
  'Saved must keep disclosing the attention snapshot age')
assert.equal(attentionAgeDays('2026-08-16', new Date('2026-08-25T12:00:00Z')), 9,
  'a nine-day-old snapshot must report nine days, so the UI can label it stale')
console.log('✓ stale attention snapshots disclose their age on Home and Saved')
