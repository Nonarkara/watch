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
  for (const width of [375, 390, 639, 640, 768, 1024, 1280, 1440, 1728]) {
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
        const middle = evaluate(`(() => {
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
          const starter=document.querySelector('.starter-row'),asia=document.querySelector('.asia-spotlight');
          const distances=[...document.querySelectorAll('.starter-link')].map(link=>{
            const name=link.querySelector('.starter-name'),range=document.createRange();range.selectNodeContents(name);
            const ink=range.getBoundingClientRect(),stats=link.querySelector('.starter-stats').getBoundingClientRect();
            return stats.top>=ink.bottom ? stats.top-ink.bottom : stats.left-ink.right;
          });
          return {starter:rect(starter),asia:rect(asia),distances,
            filterInGrid:document.querySelector('.asia-spotlight-grid').contains(document.querySelector('.asia-spotlight-all')),
            namesFit:[...document.querySelectorAll('.ticker-name')].every(e=>e.scrollWidth<=e.clientWidth+1)};
        })()`)
        assert(middle.distances.every(d=>d>=-1 && d<=24), `watch/evidence separation at ${width}: ${middle.distances}`)
        assert(!middle.filterInGrid, 'Asia action must attach to its section, not occupy an orphan card')
        assert(middle.namesFit, 'archive labels must wrap inside their records')
        if (width>=960) {
          assert(Math.abs(middle.starter.y-middle.asia.y)<2, 'dossier and Asia regions must share a working row')
          assert(middle.starter.width<=m.stage.width*.51, 'short dossier records must not span the whole desktop')
        }
        Object.assign(m, {middle})
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
        evaluate("document.querySelector('.home-entry-grid').scrollIntoView({block:'start',behavior:'instant'})")
        run('screenshot', `${out}/middle-${width}.png`)
        run('scrollintoview', '.asia-spotlight-all')
        run('screenshot', `${out}/asia-action-${width}.png`)
        if (width===1440) {
          const separated=evaluate(`(() => {const link=document.querySelector('.starter-link'),old=link.style.gridTemplateColumns;
            link.style.gridTemplateColumns='24px 1fr auto';const range=document.createRange();range.selectNodeContents(link.querySelector('.starter-name'));
            const fails=link.querySelector('.starter-stats').getBoundingClientRect().left-range.getBoundingClientRect().right>24;
            link.style.gridTemplateColumns=old;return fails})()`)
          assert.equal(separated,true,'restoring the expanding middle track must fail the evidence-proximity gate')
          const matched= evaluate("fetch('/data.json').then(r=>r.json()).then(d=>[...document.querySelectorAll('.reference-photo img')].every(img=>{const id=img.closest('.reference-photo').dataset.reference;return d.cards.find(c=>c.id===id)?.media.some(m=>m.match==='exact_reference'&&m.url===img.getAttribute('src'))}))")
          assert(matched,'archive photos must be explicitly reference-matched, not buildings or logos from family metadata')
          const photo=evaluate("(() => {const img=document.querySelector('.ticker-thumb img');if(!img)return false;window.__failedPhoto=img.closest('a').getAttribute('href');img.dispatchEvent(new Event('error'));return true})()")
          assert(photo,'the archive must retain at least one verified photograph')
          assert(evaluate("[...document.querySelectorAll('.ticker-cell')].find(a=>a.getAttribute('href')===window.__failedPhoto).querySelector('.ticker-photo-status')?.textContent==='PHOTO UNVERIFIED'"),'failed photo becomes labelled text, not an empty image frame')
        }
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
