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

// ── 11. header + footer controls are 44px phone targets (§11.8.2) ──────
// Measured at 375px: all 18 footer links were 18px tall, the search button
// 28x32, the theme toggle 36x32, the wordmark 36px. Base CSS is phone-first;
// only fine-pointer desktops may relax the two header buttons to 32px.
const rule = (sel) => (css.match(new RegExp('\\n' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*\\}')) || [''])[0]
const need44 = [
  ['.ftr-links a', /min-height:\s*44px/],
  ['.wordmark', /min-height:\s*44px/],
  ['.srch-btn', /height:\s*44px/],
  ['.theme-toggle', /height:\s*44px/],
]
for (const [sel, re] of need44) {
  if (!re.test(rule(sel))) fail(`${sel} must be a 44px phone target in its base rule (relax only inside a fine-pointer media query)`)
}

if (!process.exitCode) {
  console.log('✓ theme guards hold: global img blend reset present, no raw navy text, --navy-ink defined in all scopes, skip-link wired with ink-on-coral, Cite uses SPA Link, dossier tabpanels resolve, no fake twitter:site, --amber text-safe, --dim >= 0.60, compare dock sticky and after the footer, no placebo spacer, header/footer controls 44px')
}
