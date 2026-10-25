// Palette's real-browser proof adapted to the watch archive. No browser code
// ships to visitors. Run with agent-browser on PATH, or WATCH_BROWSER_BIN set.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const base = process.env.WATCH_TEST_URL || 'http://127.0.0.1:4178'
const out = process.env.WATCH_PROOF_DIR || '/tmp/watch-experience-proof'
const binary = process.env.WATCH_BROWSER_BIN || 'agent-browser'
const session = `watch-proof-${process.pid}`
mkdirSync(out, { recursive: true })
function browser(...args) {
  const raw = execFileSync(binary, ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 60000 })
  const response = JSON.parse(raw)
  assert(response.success, response.error || raw)
  return response.data
}
function evaluate(code) { return browser('eval', code).result }
const proofs = []
try {
  for (const width of [390, 1024, 1440]) {
    browser('set', 'viewport', String(width), '900')
    for (const [name, path] of [['home', '/'], ['register', '/register'], ['data', '/data'], ['collector', '/pom?watch=rolex-116500ln#value-lab']]) {
      browser('open', base + path)
      browser('wait', 'main h1')
      evaluate('document.fonts.ready.then(() => true)')
      if (name === 'collector') browser('scrollintoview', '.pom-decision')
      const proof = evaluate(`({width:innerWidth, documentWidth:document.documentElement.scrollWidth,
        heading:document.querySelector('main h1').textContent,
        jost:document.fonts.check('16px Jost'), bodyFont:getComputedStyle(document.body).fontFamily,
        fontLoaded:[...document.fonts].some(f=>f.family==='Jost' && f.status==='loaded')})`)
      assert(proof.documentWidth <= width + 1, `${name} overflows at ${width}: ${proof.documentWidth}`)
      assert(proof.fontLoaded && proof.bodyFont.includes('Jost'), 'self-hosted Jost must actually load')
      if (name === 'register') {
        const coverage = evaluate("fetch('/data.json').then(r=>r.json()).then(d=>({refused:d.cards.filter(c=>c.computed.estimate.value==null).length,text:document.querySelector('.pop-panel').textContent}))")
        assert(coverage.text.includes(`${coverage.refused} without publishable estimates`), 'Register must count the estimate gate, not sale coverage')
      }
      const screenshot = join(out, `${name}-${width}.png`)
      browser('screenshot', screenshot)
      proofs.push({ name, ...proof, screenshot })
    }
  }
  // Exercise a real input and keyboard selection rather than checking links only.
  browser('open', base + '/')
  browser('wait', 'main h1')
  browser('click', '.srch-btn')
  browser('fill', '.srch-input', '5513')
  browser('press', 'Enter')
  browser('wait', '--url', '**/w/rolex-5513')
  assert(evaluate('location.pathname') === '/w/rolex-5513', 'search must open the selected dossier')
  browser('set', 'viewport', '390', '900')
  evaluate("[...document.querySelectorAll('main p, main h1, main h2, main label')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]).forEach(([e,size])=>e.style.fontSize=(size*2)+'px')")
  assert(evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'enlarged text must reflow')
  browser('screenshot', join(out, 'dossier-enlarged-390.png'))
  // Block both font providers and reload. Fallback must preserve the core flow.
  browser('network', 'route', '**/fonts/*', '--abort')
  browser('network', 'route', '*fonts.googleapis.com*', '--abort')
  browser('open', base + '/register')
  browser('wait', 'main h1')
  assert(evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'font failure must reflow')
  browser('fill', 'input[aria-label="Search the register"]', '5513')
  assert(evaluate("document.querySelector('main').textContent.includes('5513')"), 'search survives failed fonts')
  browser('screenshot', join(out, 'register-fallback-390.png'))
  writeFileSync(join(out, 'receipt.json'), JSON.stringify({ base, proofs, search: 'passed', enlarged: 'passed', fallback: 'passed' }, null, 2))
  console.log(`✓ ${proofs.length} responsive proofs, loaded font, search, enlargement and font-failure fallback → ${out}`)
} finally { browser('close') }
