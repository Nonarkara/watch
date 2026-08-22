// test-css-theme.mjs — structural guards against the two dark-mode failures
// that shipped and had to be found by a person clicking around.
//
// 1. Images. `mix-blend-mode: multiply` hides a white product-photo background
//    on white paper. Multiply against a near-black canvas is black, and the
//    watch vanishes. Ten rules set multiply; they were patched back one class
//    at a time and six were missed (the dossier hero among them). The fix is a
//    single global reset — this test asserts it exists in BOTH dark selectors,
//    so nobody can remove one half and re-open the hole.
//
// 2. Navy text. --navy (#11364B) is a dark hue; as *type* on the dark canvas
//    it is 1.4:1 — invisible. Three separate patch layers accumulated for the
//    same cause. The fix is the --navy-ink token (navy in light, sky in dark).
//    This test fails on any raw `color: var(--navy)` outside an explicit
//    allow-list of constant-coloured surfaces (navy on a yellow tag is fine in
//    both themes and must stay navy).
//
// Static on purpose: no browser, no deps, runs in npm test in milliseconds.

import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const lines = css.split('\n')
const fail = (msg) => { console.error(`✗ ${msg}`); process.exitCode = 1 }

// ── 1. global dark image reset, both selectors ──────────────────────────
const need = [
  ':root[data-theme="dark"] img { mix-blend-mode: normal; }',
  ':root:not([data-theme="light"]) img { mix-blend-mode: normal; }',
]
for (const rule of need) {
  if (!css.includes(rule)) fail(`missing global dark image reset: ${rule}`)
}

// ── 2. no raw navy as text ──────────────────────────────────────────────
// Allow-list: rules where navy sits on a background that does NOT flip with
// the theme. Each entry is a substring that must appear on the same line.
const ALLOW_RAW_NAVY_TEXT = [
  'background: var(--yellow)',   // .screen-card-image-tag — navy on yellow
]
const rawNavy = /color:\s*var\(--navy\)(?![-\w])/
lines.forEach((l, i) => {
  if (!rawNavy.test(l)) return
  if (l.trim().startsWith('/*') || l.trim().startsWith('*')) return
  if (ALLOW_RAW_NAVY_TEXT.some((a) => l.includes(a))) return
  fail(`raw navy text at index.css:${i + 1} — use var(--navy-ink) (flips to sky in dark)\n    ${l.trim().slice(0, 100)}`)
})

// ── 3. --navy-ink token is defined in light AND both dark scopes ────────
const tokenDefs = (css.match(/--navy-ink:\s*var\(--(navy|sky)\)/g) || [])
if (tokenDefs.length < 3) fail(`--navy-ink must be defined in :root, [data-theme=dark], and the prefers-color-scheme block (found ${tokenDefs.length})`)

// ── 4. skip-link CSS is present and the App actually wires it ───────────
// A skip-link that points nowhere is a worse a11y lie than no link at all:
// a screen-reader user clicks it, nothing moves, and they lose their place.
if (!css.includes('.skip-link')) fail('skip-link CSS rule missing from src/index.css')
import { readFileSync as read } from 'node:fs'
const appSrc = read(new URL('../src/App.tsx', import.meta.url), 'utf8')
if (!appSrc.includes('className="skip-link"') || !appSrc.includes('href="#main-content"')) {
  fail('App.tsx must render the skip-link to #main-content so it is not a dead a11y prop')
}
if (!appSrc.includes('id="main-content"')) {
  fail('App.tsx must give <main> id="main-content" so the skip-link target exists')
}

// ── 5. Cite must use the SPA Link, not <a href> ────────────────────────
// A full <a href="/methodology#foo"> reloads the page just to jump inside
// the same SPA, killing the dossier state and re-running the data fetch.
const citeSrc = read(new URL('../src/components/Cite.tsx', import.meta.url), 'utf8')
if (!/import\s+\{\s*Link\s*\}\s+from\s+['"]react-router-dom['"]/.test(citeSrc)) {
  fail('Cite.tsx must import { Link } from react-router-dom for client-side routing')
}

if (!process.exitCode) console.log('✓ theme guards hold: global img blend reset present, no raw navy text, --navy-ink defined in all scopes, skip-link wired, Cite uses SPA Link')
