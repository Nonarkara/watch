#!/usr/bin/env node
// Run the attention collector once on this machine and print or write the
// snapshot. Used by ops/install-live.sh to seed KV, and as a manual fallback.
// Swap gate: on macOS it refuses to run when free swap is under 512 MB, so it
// can never add pressure to a machine that is already swapping (the M3).
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectAttention, MIN_SIGNAL_ROWS } from './attention.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function swapFreeMb(text) {
  const m = /free\s*=\s*([\d.]+)M/.exec(text || '')
  return m ? Number(m[1]) : null
}

if (process.platform === 'darwin' && process.env.WATCH_SKIP_SWAP_GATE !== '1') {
  try {
    const text = execFileSync('sysctl', ['vm.swapusage'], { encoding: 'utf8' })
    const free = swapFreeMb(text)
    const total = /total\s*=\s*([\d.]+)M/.exec(text)
    if (free != null && total && Number(total[1]) > 0 && free < 512) {
      console.error(`swap gate: only ${free} MB swap free, skipping this run`)
      process.exit(75)
    }
  } catch { /* sysctl missing: not macOS-like, carry on */ }
}

const watchlist = JSON.parse(readFileSync(join(ROOT, 'data/shared/trend_watchlist.json'), 'utf8'))
const { snapshot, signalRows, total } = await collectAttention({ watchlist, pauseMs: 300, collector: 'local-run' })
if (signalRows < MIN_SIGNAL_ROWS) {
  console.error(`only ${signalRows}/${total} rows had a signal; refusing to write`)
  process.exit(1)
}
const outIdx = process.argv.indexOf('--out')
const json = JSON.stringify(snapshot, null, 2) + '\n'
if (outIdx > -1) {
  writeFileSync(process.argv[outIdx + 1], json)
  console.error(`✓ ${signalRows}/${total} rows → ${process.argv[outIdx + 1]} (as_of ${snapshot.as_of})`)
} else {
  process.stdout.write(json)
}
