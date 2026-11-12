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
  for (const [width, height] of [[390, 844], [1024, 900], [1440, 900], [1280, 720]]) {
    browser('set', 'viewport', String(width), String(height))
    for (const [name, path] of [['home', '/'], ['register', '/register'], ['data', '/data'], ['collector', '/pom?watch=rolex-116500ln#value-lab'], ['dossier-gap', '/w/casio-ae-1200'], ['dossier-photo', '/w/ap-15202st']]) {
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
      const ground = evaluate("getComputedStyle(document.querySelector('main')).backgroundColor")
      assert(ground !== 'rgba(0, 0, 0, 0)' && ground !== 'transparent', 'transparent reading ground exposes dark text to the night city')
      if (name === 'home' || name === 'register') {
        const selector = name === 'home' ? 'main a[href="/register"]' : 'input[aria-label="Search the register"]'
        const geometry = evaluate(`(() => { const action=document.querySelector(${JSON.stringify(selector)});
          const r=action.getBoundingClientRect(), header=document.querySelector('header').getBoundingClientRect();
          return {header:header.height,actionTop:r.top,actionBottom:r.bottom,visible:r.top>=0&&r.bottom<=innerHeight,
            clear:action.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}; })()`)
        assert(geometry.header <= 160, `masthead exceeds the 160px task budget at ${width}`)
        assert(geometry.visible && geometry.clear, `first useful action must be visible and unobstructed on ${name} at ${width}`)
        Object.assign(proof, { geometry })
        if (name === 'register' && width === 390) {
          const falsifier = evaluate("(() => {const h=document.querySelector('header');const old=h.style.paddingTop;h.style.paddingTop='250px';const fails=h.getBoundingClientRect().height>160;h.style.paddingTop=old;return fails})()")
          assert(falsifier, 'the original inflated-chrome defect must fail this same budget')
        }
      }
      if (name === 'register') {
        const coverage = evaluate("fetch('/data.json').then(r=>r.json()).then(d=>({refused:d.cards.filter(c=>c.computed.estimate.value==null).length,text:document.querySelector('.pop-panel').textContent}))")
        assert(coverage.text.includes(`${coverage.refused} without publishable estimates`), 'Register must count the estimate gate, not sale coverage')
      }
      if (name === 'dossier-gap') {
        const geometry = evaluate(`(() => {
          const top=document.querySelector('.dsr-top'), heading=top.querySelector('h1');
          const note=top.querySelector('.dsr-photo-status'), action=top.querySelector('.dsr-action-save');
          const identity=top.querySelector('.dsr-identity').getBoundingClientRect(), verdict=top.querySelector('.dsr-verdict').getBoundingClientRect();
          return {headingTop:heading.getBoundingClientRect().top, statusHeight:note?.getBoundingClientRect().height,
            status:note?.textContent, actionBottom:action.getBoundingClientRect().bottom,
            inset:heading.getBoundingClientRect().left-top.getBoundingClientRect().left,
            photo:!!top.querySelector('figure'), verdictRows:top.querySelectorAll('.dsr-verdict-row').length,
            sideBySide:verdict.left>=identity.right && Math.abs(verdict.top-identity.top)<=1};
        })()`)
        assert(geometry.status?.includes('PHOTO UNVERIFIED') && geometry.statusHeight <= 48 && !geometry.photo)
        assert(geometry.headingTop <= 300 && Math.abs(geometry.inset) <= 1, `missing photo displaced the watch identity at ${width}`)
        assert(geometry.actionBottom <= height && geometry.verdictRows === 4, `missing-photo evidence and save action must fit at ${width}`)
        if (width >= 960) assert(geometry.sideBySide, 'use the second track for the verdict, not a desktop void')
        Object.assign(proof, { geometry })
        if (width === 390) {
          const oldFrameFails = evaluate(`(() => {
            const top=document.querySelector('.dsr-top'), frame=document.createElement('div');
            frame.style.height='180px';top.prepend(frame);
            const fails=top.querySelector('h1').getBoundingClientRect().top>300;
            frame.remove();return fails;
          })()`)
          assert.equal(oldFrameFails, true, 'restoring the old 180px frame must fail the heading budget')
          const ledger = evaluate(`(() => {
            const section=document.querySelector('.dsr-evidence-ledger');
            return { height:section.getBoundingClientRect().height,
              refusal:section.querySelector('.dsr-estimate-refusal')?.textContent,
              missing:section.querySelector('.dsr-unavailable')?.querySelectorAll('.mcell').length,
              placeholder:!!document.querySelector('.txn-graphic-card.empty') };
          })()`)
          assert(ledger.height <= 112 && ledger.refusal.includes('No verified sales') && ledger.missing === 8 && !ledger.placeholder,
            'unavailable measures must not create a stack of tiles or a placeholder chart')
          const oldTilesFail = evaluate(`(() => {
            const ledger=document.querySelector('.dsr-evidence-ledger'), old=document.createElement('div');
            old.className='metric-strip';
            old.append(...[...ledger.querySelectorAll('.mcell')].map(row=>row.cloneNode(true)));
            ledger.after(old);const fails=old.getBoundingClientRect().height>112;old.remove();return fails;
          })()`)
          assert.equal(oldTilesFail, true, 'restoring the tile layout must fail the sparse ledger budget')
          browser('click', '.dsr-unavailable > summary')
          browser('wait', '.dsr-unavailable[open] .mcell')
          assert(evaluate("document.querySelector('.dsr-unavailable[open]').textContent.includes('Screen attention')"))
          browser('click', '.dsr-unavailable .mcell:first-of-type .why summary')
          browser('wait', '.dsr-unavailable .why[open] p')
          assert(evaluate("document.querySelector('.dsr-unavailable .why[open] p').textContent.includes('verified sales')"))
          browser('screenshot', join(out, 'dossier-evidence-expanded-390.png'))
          browser('click', '.dsr-unavailable > summary')
          evaluate('window.scrollTo(0, 0)')
          Object.assign(proof, { ledger })
        }
      }
      if (name === 'dossier-photo') {
        assert(evaluate("!!document.querySelector('.dossier-object img') && document.querySelector('.dossier-object figcaption').textContent.includes('SOURCE') && !document.querySelector('.dsr-photo-status')"), 'preserve the sourced portrait and credit')
      }
      const screenshot = join(out, `${name}-${width}.png`)
      browser('screenshot', screenshot)
      proofs.push({ name, ...proof, screenshot })
    }
  }
  browser('open', base + '/w/rolex-116500ln')
  browser('wait', '.dsr-evidence-ledger')
  const priced = evaluate(`(() => ({
    published:document.querySelectorAll('.dsr-evidence-ledger > .mcell').length,
    text:document.querySelector('.dsr-evidence-ledger').textContent,
    marks:document.querySelectorAll('svg[aria-label="Price evidence chart"] rect').length,
    citations:document.querySelectorAll('.sales-table .src-a').length,
    settlement:!!document.querySelector('.txn-graphic-card:not(.empty)')
  }))()`)
  assert(priced.published === 5 && priced.text.includes('$25,600') && priced.text.includes('HISTORICAL, AS OF 2024-12') && priced.marks === 4 && priced.citations >= 4 && priced.settlement,
    'available estimates, their age, cited sales, and the existing charts must survive compaction')
  browser('scrollintoview', '.dsr-evidence-ledger')
  browser('screenshot', join(out, 'dossier-evidence-priced.png'))
  // Exercise a real input and keyboard selection rather than checking links only.
  browser('open', base + '/')
  browser('wait', 'main h1')
  browser('click', '.srch-btn')
  browser('wait', '.srch-input')
  browser('fill', '.srch-input', '5513')
  browser('press', 'Enter')
  browser('wait', '--url', '**/w/rolex-5513')
  browser('wait', '.dsr-top h1')
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
