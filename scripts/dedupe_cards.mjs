// One-shot dedupe script: removes duplicate-watch cards (same brand+reference).
// Keeps the more recently-curated card (the one with provenance_events), or the
// first alphabetically. Merges provenance_events from the dropped card into the
// kept card.

import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CARD_DIR = join(ROOT, 'data/cards')

const seen = new Map()  // key: "brand|ref" → filename
const toDrop = []

for (const f of readdirSync(CARD_DIR).filter(f => f.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(CARD_DIR, f), 'utf-8'))
  const key = c.identity.brand + '|' + c.identity.reference
  if (seen.has(key)) {
    toDrop.push([seen.get(key), f, c])
  } else {
    seen.set(key, f)
  }
}

let merged = 0, removed = 0
for (const [keep, drop, dropCard] of toDrop) {
  const keepPath = join(CARD_DIR, keep)
  const dropPath = join(CARD_DIR, drop)
  if (existsSync(dropPath)) {
    if (existsSync(keepPath)) {
      const keepCard = JSON.parse(readFileSync(keepPath, 'utf-8'))
      const existingKeys = new Set(keepCard.provenance_events.map(p => p.date + '|' + p.person_or_event))
      let added = 0
      for (const p of dropCard.provenance_events || []) {
        if (!existingKeys.has(p.date + '|' + p.person_or_event)) {
          keepCard.provenance_events.push(p)
          added++
        }
      }
      if (added > 0) {
        writeFileSync(keepPath, JSON.stringify(keepCard, null, 2) + '\n')
        merged += added
      }
    }
    unlinkSync(dropPath)
    removed++
    console.log(`removed ${drop} (kept ${keep}, merged ${dropCard.provenance_events?.length || 0} provs)`)
  }
}
console.log(`\n${removed} duplicates removed, ${merged} provenance events merged`)
