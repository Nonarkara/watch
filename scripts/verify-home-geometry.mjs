import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
const bin = process.env.WATCH_BROWSER_BIN || 'agent-browser'
const base = process.env.WATCH_TEST_URL || 'http://127.0.0.1:4187'
const before = process.env.WATCH_BEFORE_URL
const out = process.env.WATCH_PROOF_DIR || '/tmp/watch-home-geometry'
const session = `home-geometry-${process.pid}`
mkdirSync(out, { recursive: true })
function run(...args) {
  const r = JSON.parse(execFileSync(bin, ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 60000 }))
  assert(r.success, r.error); return r.data
}
const evaluate = code => run('eval', code).result
const measure = `(() => {
  const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
  return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,
    header:rect('header'),stage:rect('.timepop-hero-stage'),intro:rect('.timepop-hero-copy'),ledger:rect('.hero-ledger'),
    stats:[...document.querySelectorAll('.hero-ledger-grid > div')].map(e=>e.getBoundingClientRect().width),
    guides:rect('.guides-row'),hot:rect('.hot-row'),paths:rect('.lookbook-paths'),
    action:rect('.hero-actions a'),sections:[...document.querySelectorAll('main > section,.home-page > section')].map(e=>({name:e.className,x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width}))};})()`
const receipt = []
try {
  for (const width of [375, 390, 639, 640, 768, 1024, 1280, 1440]) {
    run('set', 'viewport', String(width), width <= 390 ? '844' : width === 1280 ? '720' : '900')
    for (const [name, url] of [...(before ? [['before', before]] : []), ['after', base]]) {
      run('open', url)
      run('wait', '.hero-ledger-grid')
      evaluate("localStorage.setItem('watch.theme','light');location.reload()")
      run('wait', '.hero-ledger-grid')
      evaluate('document.fonts.ready.then(()=>true)')
      run('wait', '.trending-now')
      run('wait', '.art-band-stage')
      const m = evaluate(measure)
      receipt.push({name,...m})
      if (name === 'after') {
        assert(m.pageWidth <= width + 1, `overflow ${width}`)
        assert(m.stats.every(w=>w<=125), `stretch-to-fill stat returned at ${width}`)
        assert(m.ledger.height <= (width<880 ? 190 : 140), `ledger too tall ${width}`)
        assert(m.action.bottom <= (width===1280 ? 720 : 844), `browse action below first screen ${width}`)
        assert(m.guides.height <= (width<640 ? 700 : 440), `guide padding returned ${width}`)
        assert(m.hot.height <= (width<640 ? 920 : 600), `image stacks returned ${width}`)
        const statRows = evaluate("(() => {const rows={};document.querySelectorAll('.hero-ledger-grid > div').forEach(e=>{const y=Math.round(e.getBoundingClientRect().top);rows[y]=(rows[y]||0)+1});return Object.values(rows)})()")
        assert(statRows.every(n=>n>1), `orphan stat at ${width}`)
        if (width>=880) assert(evaluate("document.querySelector('.spotlight-grid').getBoundingClientRect().height-document.querySelector('.spotlight-photo').getBoundingClientRect().height<=100"), 'narrative must not stretch the photo column')
        for (const s of m.sections) assert(Math.abs(s.x-m.stage.x)<2 && Math.abs(s.width-m.stage.width)<2, `misaligned ${s.name} ${width}`)
        // Restore the old equal-track stat layout locally: the same gate must fail.
        const falsified = evaluate(`(() => {const grid=document.querySelector('.hero-ledger-grid'),old=grid.style.cssText;
          const children=[...grid.children],styles=children.map(e=>e.style.cssText);children.forEach(e=>e.style.width='auto');
          grid.style.display='grid';grid.style.gridTemplateColumns='repeat(2,1fr)';
          const fails=children.some(e=>e.getBoundingClientRect().width>125);grid.style.cssText=old;
          children.forEach((e,i)=>e.style.cssText=styles[i]);return fails})()`)
        assert.equal(falsified, true, 'old equal-track layout must fail the stat-width gate')
        run('click', '.home-commitments summary')
        assert(evaluate("document.querySelector('.home-commitments').open"))
        run('screenshot', `${out}/commitments-${width}.png`)
        run('click', '.home-commitments summary')
        run('scrollintoview', '.trending-now-meta a')
        run('click', '.trending-now-meta a')
        assert(evaluate("document.querySelector('.home-attention-details').open"))
        const resultTop = evaluate("document.querySelector('.home-attention-details summary').getBoundingClientRect().top")
        assert(resultTop>=-1 && resultTop<80, `ranking action must bring its result into view at ${width}: ${resultTop}`)
        assert(evaluate("document.activeElement===document.querySelector('.home-attention-details summary')"), 'ranking action must move keyboard focus to its result')
        run('wait', '.market-trends-list')
        run('screenshot', `${out}/attention-${width}.png`)
        run('click', '.home-attention-details summary')
        // Walk the reading path so lazy images are exercised, not blank frames.
        for (const selector of ['.spotlight','.asia-spotlight','.hot-row','.guides-row','.lookbook-paths','.research-ledger']) run('scrollintoview',selector)
        run('scroll', 'up', '20000')
      }
      run('screenshot', `${out}/${name}-${width}.png`)
    }
  }
  run('set', 'viewport', '390', '844')
  run('open', base)
  run('wait', '.home-page')
  evaluate("localStorage.setItem('watch.theme','dark');location.reload()")
  run('wait', '.home-page')
  assert.equal(evaluate("getComputedStyle(document.querySelector('.ftr-meta')).color"), 'rgb(255, 255, 255)', 'footer receipt stays legible on its fixed blue ground')
  run('scrollintoview', '.ftr-meta')
  run('screenshot', `${out}/footer-dark-390.png`)
  writeFileSync(`${out}/receipt.json`,JSON.stringify(receipt,null,2))
  console.log(`✓ aligned sections, natural-width stats, bounded ledger/guides/image rows, first action, disclosures and original-layout falsifier → ${out}`)
} finally { run('close') }
