// test-css-theme.mjs — structural guards against the two dark-mode failures
// that shipped and had to be found by a person clicking around.
//
// 1. Images. `mix-blend-mode: multiply` hides a white product-photo background
//    on white paper. Multiply against a near-black canvas is black, and the
//    watch vanishes. The fix is a single global reset — this test asserts it
//    exists in BOTH dark selectors, and that no dark-mode rule turns multiply
//    back on (a more-specific `.foo img { multiply }` would beat the reset).
//
// 2. Navy text. --navy (#11364B) is a dark hue; as *type* on the dark canvas
//    it is 1.4:1 — invisible. The --navy-ink token (navy in light, sky in dark)
//    is the one override. Raw `color: var(--navy)` is banned except on
//    constant-coloured surfaces (navy on a yellow tag is fine in both themes).
//
// Static on purpose: no browser, no deps, runs in npm test in milliseconds.

import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const appSrc = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const citeSrc = readFileSync(new URL('../src/components/Cite.tsx', import.meta.url), 'utf8')
const dossierSrc = readFileSync(new URL('../src/pages/Dossier.tsx', import.meta.url), 'utf8')
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
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

// A later, more-specific dark rule that sets multiply re-opens the hole the
// global reset closed. Fail on multiply inside either dark selector.
const darkMultiply = /:root(?:\[data-theme="dark"\]|:not\(\[data-theme="light"\]\))[^{]*\{[^}]*mix-blend-mode:\s*multiply/
if (darkMultiply.test(css)) fail('dark-mode selector re-enables mix-blend-mode: multiply; the global reset would lose')
if (/mix-blend-mode:\s*multiply\s*!important/.test(css)) {
  fail('multiply !important would beat the global dark img reset')
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

// navy-ink as a *plate* with light type fails in dark (sky + --paper ≈ 2.5:1).
// The brand-ref-pill hover is the correct pairing: navy-ink plate + --bg type.
lines.forEach((l, i) => {
  if (!l.includes('background: var(--navy-ink)')) return
  if (l.includes('color: var(--paper)') || l.includes('color: var(--ink)')) {
    fail(`navy-ink plate with light type at index.css:${i + 1} — use color: var(--bg) so dark-mode stays ink-on-sky`)
  }
})

// ── 3. --navy-ink token is defined in light AND both dark scopes ────────
const tokenDefs = (css.match(/--navy-ink:\s*var\(--(navy|sky)\)/g) || [])
if (tokenDefs.length < 3) fail(`--navy-ink must be defined in :root, [data-theme=dark], and the prefers-color-scheme block (found ${tokenDefs.length})`)

// ── 4. skip-link CSS is present and the App actually wires it ───────────
// A skip-link that points nowhere is a worse a11y lie than no link at all.
if (!css.includes('.skip-link')) fail('skip-link CSS rule missing from src/index.css')
if (/\\.skip-link[^{]*\\{[^}]*color:\\s*var\\(--paper\\)/.test(css)) {
  fail('skip-link must not use color: var(--paper); paper is white in light (fails on coral) and near-black in dark')
}
if (!css.includes('color: #0A0A0A')) fail('skip-link must set dark ink (#0A0A0A) so coral contrast holds in both themes')
if (!appSrc.includes('className="skip-link"') || !appSrc.includes('href="#main-content"')) {
  fail('App.tsx must render the skip-link to #main-content so it is not a dead a11y prop')
}
if (!appSrc.includes('id="main-content"')) {
  fail('App.tsx must give <main> id="main-content" so the skip-link target exists')
}
// First interactive node in the shell, before SearchPalette (which is null
// when closed, but the skip-link still has to precede the header in source).
if (!/skip-link[\s\S]*SearchPalette/.test(appSrc)) {
  fail('skip-link must render before SearchPalette / header so it is the first tab stop')
}

// ── 5. Cite must use the SPA Link, not <a href> ────────────────────────
// Importing Link and still rendering <a href> would pass a naive import check
// and re-mount the dossier on every methodology jump.
if (!/import\s+\{\s*Link\s*\}\s+from\s+['"]react-router-dom['"]/.test(citeSrc)) {
  fail('Cite.tsx must import { Link } from react-router-dom for client-side routing')
}
if (!/<Link\s+className="cite-source-link/.test(citeSrc)) {
  fail('Cite.tsx must render <Link className="cite-source-link"> (pointer-events CSS keys off that class)')
}
if (/<a\s+className="cite-source-link"/.test(citeSrc)) {
  fail('Cite.tsx still renders <a className="cite-source-link"> — that full-page-loads the methodology jump')
}

// ── 6. dossier tabs: aria-controls must resolve ─────────────────────────
// MiniMax added aria-controls="panel-evidence" with no panel id. Interleaved
// evidence/story fragments cannot share one static id, so the panel id is
// panel-${view} — one node, always matching the selected tab.
for (const name of ['evidence', 'venues', 'story']) {
  if (!dossierSrc.includes(`id="tab-${name}"`)) fail(`Dossier tab ${name} missing id="tab-${name}"`)
  if (!dossierSrc.includes(`aria-controls="panel-${name}"`)) fail(`Dossier tab ${name} missing aria-controls="panel-${name}"`)
}
if (!dossierSrc.includes('role="tabpanel"') || !dossierSrc.includes('id={`panel-${view}`}')) {
  fail('Dossier must wrap the view panes in role="tabpanel" id={`panel-${view}`} so aria-controls resolves')
}

// ── 7. no invented social handle ────────────────────────────────────────
if (/twitter:site/.test(html)) {
  fail('index.html twitter:site names a handle Time Pop does not have; omit the tag until there is a real account')
}

// ── 8. --amber must resolve to a text-safe value ─────────────────
// --amber is the legacy alias used by dozens of text rules. It must
// not resolve to the raw coral (#EF6A5B, 2.6:1 on white) — it must
// resolve to --coral-text (4.93:1) or an equivalent.
if (/--amber:\s*var\(--coral\)(?![-\w])/.test(css)) {
  fail('--amber must not alias to raw var(--coral) (2.6:1 on white fails AA)')
}
if (!/--amber:\s*var\(--coral-text\)/.test(css)) {
  fail('--amber must alias to var(--coral-text) so every text rule using it passes 4.5:1')
}

// ── 9. --dim opacity must be >= 0.60 in light mode ───────────────
// --dim: rgba(10,10,10,0.55) is ~5.25:1... actually 0.55 gives
// #787878 which is 4.42:1 — just below AA. 0.60 gives 5.25:1.
const dimLight = css.match(/--dim:\s*rgba\(10,\s*10,\s*10,\s*([\d.]+)\)/)
if (dimLight && parseFloat(dimLight[1]) < 0.60) {
  fail(`--dim light opacity ${dimLight[1]} is below 0.60 (fails 4.5:1 on white)`)
}

// ── 10. the compare dock must never cover the footer ──────────────────
// The dock grows with its contents (57px empty, 71px with four watches on a
// phone, 131px with four on desktop) and the footer is always the last thing
// in the document. Three approaches were tried and measured in a real layout:
//   - a hard-coded "+ 64px" footer reserve left the last link row 19px UNDER
//     a populated desktop dock (the original bug, never actually fixed);
//   - a `.cdock-spacer` placed in flow BEFORE the footer changed clearance by
//     0px (a flow element before the last element cannot protect it) and just
//     added ~100px of dead space above every footer;
//   - a JS-published height works, but needs a ResizeObserver and a CSS var.
// The robust fix has no number and no JS: the dock is `position: sticky` and
// rendered AFTER the footer, so it pins to the viewport bottom while scrolling
// and takes real space below the footer at the end of the page. A fixed bar
// covers the footer by however tall it is; an in-flow one cannot.
const cdockRule = css.match(/\n\.cdock\s*\{[^}]*\}/)
if (!cdockRule || !/position:\s*sticky/.test(cdockRule[0]) || /position:\s*fixed/.test(cdockRule[0])) {
  fail('.cdock must be position: sticky, not fixed: a fixed bar covers the footer by its own height, which varies 57-131px')
}
const dockAt = appSrc.indexOf('<CompareDock')
const footerAt = appSrc.indexOf('<footer')
if (dockAt < 0 || footerAt < 0 || dockAt < footerAt) {
  fail('App.tsx must render <CompareDock /> AFTER <footer> so the sticky dock sits below the footer in flow')
}
const ftrPad = (css.match(/\n\.ftr\s*\{[^}]*\}/) || [''])[0]
if (/padding:[^;]*\+\s*\d+px\s*\)/.test(ftrPad) || /cdock-h/.test(css)) {
  fail('.ftr must not reserve the dock with a hard-coded px number or a published height; the sticky dock needs no reserve')
}
if (/\.cdock-spacer/.test(css) || /cdock-spacer/.test(readFileSync(new URL('../src/components/CompareDock.tsx', import.meta.url), 'utf8'))) {
  fail('.cdock-spacer is a placebo (measured: removing it changes footer clearance by 0px); do not reintroduce it')
}

// ── 11. touch targets, as amended by §11.12 (MSH) ───────────────────────
// Isolated primary actions (search, theme, wordmark) are 44px+ phone targets
// and take their height from ONE token, --hdr-row, so the masthead cannot grow
// a second opinion. A dense group of text controls (the footer link list)
// keeps label-plus-padding boxes: >=32px, never 44. 44px slabs around one-word
// labels are the spatial hallucination §11.12 exists to kill.
const rule = (sel) => (css.match(new RegExp('\\n' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*\\}')) || [''])[0]
const hdrRow = css.match(/:root\s*\{\s*--hdr-row:\s*(\d+)px/)
if (!hdrRow || +hdrRow[1] < 44) fail('--hdr-row base (phone) must be >= 44px: it is the touch target of the isolated header actions')
for (const sel of ['.wordmark', '.srch-btn', '.theme-toggle']) {
  if (!/min-height:\s*var\(--hdr-row\)/.test(rule(sel))) fail(`${sel} must take its height from var(--hdr-row), not a private number`)
}
const ftrA = rule('.ftr-links a')
const ftrMin = ftrA.match(/min-height:\s*(\d+)px/)
if (!ftrMin || +ftrMin[1] < 32 || +ftrMin[1] > 40) fail('.ftr-links a is a dense text group: min-height must be 32-40px (WCAG 2.2 floor 24, MSH forbids 44px slabs)')

// ── 12. the masthead is one definition, in flow, and every grid is valid ──
// MiniMax's accreted header re-declared .hdr-in three times and made it
// sticky (30% of a phone, permanently). And ten rows were written as
// repeat(auto-fill, minmax(min-content, 1fr)): browsers reject auto-repeat
// over an intrinsic minimum, so every chip row silently collapsed to full-width
// stacked slabs while the page "looked" intact in a source scan.
if ((css.match(/\n\.hdr-in\s*\{/g) || []).length !== 1) fail('.hdr-in must be declared exactly once (re-declaration is how the masthead ballooned)')
if (/\n\.hdr\s*\{[^}]*position:\s*sticky/.test(css)) fail('.hdr must not be sticky: pinned chrome is a permanent screen cost (§11.12 tell 1)')
const badRepeat = css.match(/repeat\(\s*auto-(?:fill|fit)\s*,\s*minmax\(\s*(?:min|max)-content/)
if (badRepeat) fail(`invalid grid: ${badRepeat[0]}… — auto-repeat needs a fixed track size; this is silently ignored and stacks every item full width`)

// ── 13. a loading state is never rendered as a count of zero ─────────────
// Home printed "ON SCREEN 0" until the sightings file arrived: a fabricated
// number that reads as a finding. Unloaded is null and renders as an em dash.
const homeSrc = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
if (/const stills\s*=[^\n]*\?\?\s*0/.test(homeSrc)) fail('Home `stills` must be null until sightings load, not `?? 0` (renders a loading state as a measured zero)')
if (!/\{stills \?\? '—'\}/.test(homeSrc)) fail('Home must render unloaded stills as an em dash')

if (!process.exitCode) {
  console.log('✓ theme guards hold: global img blend reset present, no raw navy text, --navy-ink defined in all scopes, skip-link wired with ink-on-coral, Cite uses SPA Link, dossier tabpanels resolve, no fake twitter:site, --amber text-safe, --dim >= 0.60, compare dock sticky and after the footer, no placebo spacer, header actions on one --hdr-row token, footer links dense 32px, masthead single/in-flow, no invalid auto-repeat grids')
}
