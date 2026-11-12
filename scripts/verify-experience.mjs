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
    for (const [name, path] of [['home', '/'], ['register', '/register'], ['data', '/data'], ['auction-census', '/auction-census'], ['collector', '/pom?watch=rolex-116500ln#value-lab'], ['dossier-gap', '/w/casio-ae-1200'], ['dossier-photo', '/w/ap-15202st']]) {
      browser('open', base + path)
      browser('wait', 'main h1')
      evaluate('document.fonts.ready.then(() => true)')
      if (name === 'collector') {
        browser('wait', '.pom-history-toggle')
        assert(evaluate(`(() => {
          const cards = [...document.querySelectorAll('.pom-card')];
          return cards.length === 14 && cards.every(card => {
            const bounds = card.getBoundingClientRect();
            const note = card.querySelector('.pom-card-note').getBoundingClientRect();
            const chips = [...card.querySelectorAll('.score-axis')];
            return card.querySelector('img') && card.querySelector('.pom-card-actions a') &&
              note.width >= bounds.width * 0.75 && chips.length === 4 && chips.every(chip => {
                const box = chip.getBoundingClientRect();
                return box.left >= bounds.left && box.right <= bounds.right &&
                  [...chip.children].every(child => child.scrollWidth <= child.clientWidth + 1 &&
                    child.getBoundingClientRect().right <= box.right + 1);
              });
          });
        })()`), 'Pom portraits and links must stay present; notes must span the card and score text must stay inside its chip')
        assert(evaluate("!document.querySelector('.pom-decision') && !document.querySelector('.pom-basis-snapshot') && !document.querySelector('.pom-basis-jumps')"),
          'stale estimates must not silently start a projection')
        if (width === 390) {
          browser('fill', '#pom-watch-start', '18000')
          assert(evaluate("document.querySelector('.pom-basis-snapshot').textContent.includes('$18,000') && !document.querySelector('.pom-basis-snapshot').textContent.includes('HISTORICAL STARTING VALUE')"))
          browser('reload')
          browser('wait', '.pom-history-toggle')
        }
        browser('scrollintoview', '.pom-lab-controls')
        browser('screenshot', join(out, `collector-basis-${width}.png`))
        browser('click', '.pom-history-toggle')
        browser('wait', '.pom-decision')
        browser('click', '.pom-basis-jumps a[href="#pom-decision"]')
        assert(evaluate(`document.activeElement.id==='pom-decision' &&
          document.querySelector('#pom-decision-title').getBoundingClientRect().bottom<innerHeight &&
          document.querySelector('.pom-decision-foot').textContent.includes('historical estimate · newest sale 2024-12-13')`),
          'the decision jump must move keyboard focus to the rendered decision')
        if (width === 390) {
          browser('click', '.pom-decision-foot a')
          assert(evaluate("document.activeElement.id==='pom-exit-costs' && !!document.querySelector('#pom-exit-costs .pom-net-source a')"))
          browser('click', '.pom-basis-jumps a[href="#pom-decision"]')
        }
        assert(evaluate("document.querySelector('.pom-basis-snapshot').textContent.includes('HISTORICAL STARTING VALUE')"))
        assert(evaluate(`(() => {
          const box=document.querySelector('.pom-net-source'), style=getComputedStyle(box);
          const luminance=color=>color.match(/[\\d.]+/g).slice(0,3).map(Number).map(n=>n/255)
            .map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[0.2126,0.7152,0.0722][i],0);
          const [lo,hi]=[luminance(style.color),luminance(style.backgroundColor)].sort((a,b)=>a-b);
          return (hi+0.05)/(lo+0.05)>=4.5 && box.textContent.includes('newest sale 2024-12-13');
        })()`), 'historical basis must remain legible beside exit assumptions')
        assert(evaluate(`(() => {
          const section=document.querySelector('.pom-decision'), controls=section.querySelector('.pom-decision-controls');
          const grid=section.querySelector('.pom-decision-grid'), top=section.getBoundingClientRect().top;
          const fits=()=>grid.getBoundingClientRect().bottom-top<=innerHeight &&
            controls.getBoundingClientRect().height<=110 && grid.children.length===4 &&
            [...controls.querySelectorAll('input, select')].every(e=>e.getBoundingClientRect().height>=32);
          const compact=fits();
          if(innerWidth!==390) return compact;
          controls.style.gridTemplateColumns='1fr';
          controls.style.minHeight='232px';
          grid.style.minHeight='390px';
          const oldFails=!fits();
          controls.removeAttribute('style');
          grid.removeAttribute('style');
          return compact && oldFails;
        })()`), `decision controls and four results must fit one view from the decision heading at ${width}`)
        browser('scrollintoview', '.pom-decision')
        if (width === 390) {
          const chart = evaluate(`(() => {
            const chart=document.querySelector('.pom-scenario-chart'), svg=chart.querySelector('svg');
            const labels=[...svg.querySelectorAll('text')].map(e=>e.textContent);
            const styles=['gross','net','cost'].map(key=>getComputedStyle(svg.querySelector('.pom-scenario-'+key)).strokeDasharray);
            const table=document.querySelector('.pom-net-table');
            const net=[...table.tBodies[0].rows].map(row=>row.cells[4].textContent);
            const shown=[...chart.querySelectorAll('.pom-scenario-milestones strong')].map(e=>e.textContent);
            return labels.slice(-4).join(',')==='0y,3y,10y,20y' && new Set(labels.slice(0,-4)).size===3 &&
              new Set(styles).size===3 && shown.slice(1).every((value,i)=>value===net[i+2]) &&
              chart.querySelector('.pom-scenario-milestones small').textContent==='AT START · NET' &&
              !document.querySelector('.pom-net-breakdown').open;
          })()`)
          assert(chart, 'chart labels, stroke keys and exact net readouts must match the detailed ledger')
          browser('click', '.pom-net-breakdown summary')
          assert(evaluate("document.querySelector('.pom-net-breakdown').open && document.querySelector('.pom-net-table').tBodies[0].rows.length===5"))
          browser('click', '.pom-net-breakdown summary')
          browser('scrollintoview', '.pom-decision')
        }
      }
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
        const coverage = evaluate("fetch('/data.json').then(r=>r.json()).then(d=>({refused:d.cards.filter(c=>c.computed.estimate.value==null).length,text:document.querySelector('.register-coverage').textContent}))")
        assert(coverage.text.includes(`${coverage.refused} without publishable estimates`), 'Register must count the estimate gate, not sale coverage')
        if (width === 390 || width === 1024) {
          const search = 'input[aria-label="Search the register"]'
          browser('fill', search, 'AE-1200WH-1AV')
          assert(evaluate("document.querySelector('.rc-media-empty').getBoundingClientRect().height<=24 && !document.querySelector('.reg-card .rc-media')"))
          browser('fill', search, '5712/1A')
          assert(evaluate(`(() => {
            const card=document.querySelector('.rc-name-link[href="/w/patek-5712-1a"]').closest('.reg-card');
            const photo=card.querySelector('img'), note=card.querySelector('.rc-media-note');
            return photo ? note.textContent==='Related watch · not this reference' &&
              photo.alt.includes('not reference 5712/1A') && note.getBoundingClientRect().height>0
              : card.querySelector('.rc-media-empty')?.textContent==='PHOTO COULD NOT LOAD';
          })()`), 'a related portrait must be visibly and accessibly qualified, or fail to a labeled photo status')
          browser('fill', search, '116710BLNR')
          assert(evaluate("document.querySelector('.rc-data dt').textContent==='Historical'"))
          browser('click', '.register-view-toggle button:last-child')
          if (width === 390) assert(evaluate(`(() => {
            const heading=document.querySelector('.register-heading'), row=document.querySelector('.lrow');
            window.scrollTo(0,0);
            const fits=row.getBoundingClientRect().bottom<=innerHeight;
            heading.style.minHeight='470px';
            const oldFails=row.getBoundingClientRect().bottom>innerHeight;
            heading.style.removeProperty('min-height');
            return fits && oldFails;
          })()`), 'the complete phone search result must fit and the old masthead height must fail')
          assert(evaluate(`(() => {
            const price=document.querySelector('.lrow[href="/w/rolex-116710blnr-batman"] .l-price');
            return price.dataset.estimate==='historical' && price.querySelector('abbr').title==='Historical estimate' &&
              price.scrollWidth<=price.clientWidth+1 && document.documentElement.scrollWidth<=innerWidth;
          })()`), 'historical estimate must fit the ledger price cell with its marker')
          browser('fill', search, '116400GV')
          assert(evaluate("document.querySelector('.lrow .l-price').dataset.estimate==='recent' && !document.querySelector('.lrow .l-price abbr')"))
          browser('fill', search, '')
          browser('click', '.register-view-toggle button:first-child')
        }
      }
      if (name === 'data') {
        browser('wait', '.data-intake-price small')
        const intakeDates = evaluate(`[...document.querySelectorAll('.data-intake-price small')].map(e=>e.textContent)`)
        assert(intakeDates.some(label=>label.startsWith('AUCTION START ')) && intakeDates.every(label=>!label.startsWith('REALIZED ')),
          'legacy intake dates are auction opening dates, not verified lot dates')
        const coverage = evaluate(`fetch('/data.json').then(r=>r.json()).then(d=>{
          const estimate=d.cards.filter(c=>c.computed.estimate.value!=null).length;
          const historical=d.cards.filter(c=>c.computed.estimate.value!=null&&c.computed.estimate.stale).length;
          const sales=d.cards.filter(c=>c.computed.estimate.value==null&&c.comp_summary).length;
          const counts=[estimate-historical,historical,sales,d.count-estimate-sales];
          const rows=[...document.querySelectorAll('.data-coverage-rows dd')], parts=[...document.querySelectorAll('.data-coverage-bar > span')];
          const plotWidth=parts.reduce((n,p)=>n+p.getBoundingClientRect().width,0);
          const link=document.querySelector('.data-coverage-links a');
          return {complete:rows.length===3 && rows[0].querySelector('[data-basis="estimated"]').textContent===counts[0]+' recent' &&
              rows[0].querySelector('[data-basis="historical"]').textContent===counts[1]+' historical' &&
              rows.slice(1).every((row,i)=>row.textContent===counts[i+2]+' / '+d.count),
            proportional:parts.length===4 && parts.every((part,i)=>Math.abs(part.getBoundingClientRect().width-plotWidth*counts[i]/d.count)<1),
            first:link.getBoundingClientRect().bottom,
            wideFit:innerWidth<900 || (document.querySelector('.data-coverage-secondary').getBoundingClientRect().left>=document.querySelector('.data-coverage-primary').getBoundingClientRect().right &&
              document.querySelector('#evidence-field-title').getBoundingClientRect().top<=520)};
        })`)
        assert(coverage.complete && coverage.proportional && coverage.first<=height && coverage.wideFit, JSON.stringify(coverage))
        const plot = evaluate(`(() => {
          const wrap=document.querySelector('.evidence-plot-wrap'), svg=wrap.querySelector('svg');
          const fits=svg.getBoundingClientRect().width<=wrap.clientWidth+1;
          svg.style.minWidth='620px'; const oldSwipes=svg.getBoundingClientRect().width>wrap.clientWidth+1; svg.removeAttribute('style');
          return {fits, oldSwipes, dots:svg.querySelectorAll('.evidence-point').length, counts:svg.querySelectorAll('.evidence-axis-number').length};
        })()`)
        assert(plot.fits && plot.dots>0 && plot.counts===6 && (width!==390 || plot.oldSwipes),
          'all six plot columns must fit; restoring the old minimum width must fail on phone')
        const fieldGeometry = evaluate(`(() => {
          const controls = document.querySelector('.evidence-controls'), plot = document.querySelector('.evidence-plot');
          const bounds = () => ({ controlsBottom: controls.getBoundingClientRect().bottom,
            plotBottom: plot.getBoundingClientRect().bottom,
            filterGap: controls.querySelector('label').getBoundingClientRect().left -
              controls.firstElementChild.getBoundingClientRect().right,
            plotTail: plot.parentElement.getBoundingClientRect().bottom -
              plot.parentElement.lastElementChild.getBoundingClientRect().bottom });
          const current = bounds();
          // Restore the measured cost of the previous intro/filter stack.
          controls.style.marginTop = '240px';
          const oldPlotBottom = bounds().plotBottom;
          controls.style.removeProperty('margin-top');
          return { ...current, oldPlotBottom };
        })()`)
        assert(fieldGeometry.controlsBottom <= height && (height < 844 || fieldGeometry.plotBottom <= height) &&
          (width < 760 || (fieldGeometry.filterGap <= 12 && fieldGeometry.plotTail <= 2)),
          `the Data plot and filters must fit at ${width}×${height}: ${JSON.stringify(fieldGeometry)}`)
        if (width === 390) assert(fieldGeometry.oldPlotBottom > height, 'the previous pre-plot stack must fail the phone budget')
        Object.assign(proof, { fieldGeometry })
        if (width===390) {
          assert(evaluate(`(() => {
            const hero=document.querySelector('.data-coverage .lede'), link=document.querySelector('.data-coverage-links a');
            hero.style.minHeight='600px'; const fails=link.getBoundingClientRect().bottom>innerHeight;
            hero.removeAttribute('style'); return fails;
          })()`), 'a tall introductory band must fail the first-action budget')
          browser('click','.data-coverage-links a:first-child')
          assert(evaluate("location.hash==='#evidence-field-title' && document.activeElement.id==='evidence-field-title' && document.activeElement.getBoundingClientRect().top<innerHeight"))
          assert(evaluate(`(() => {
            const action = document.querySelector('.evidence-open'), next = action.nextElementSibling;
            const score = document.querySelector('.evidence-readout-score');
            const before = action.getBoundingClientRect(), visible = before.bottom <= innerHeight && before.height >= 44 &&
              before.top - score.getBoundingClientRect().bottom <= 12;
            action.parentElement.append(action);
            const oldGap = action.getBoundingClientRect().top - score.getBoundingClientRect().bottom;
            next.before(action);
            return visible && oldGap > 100;
          })()`), 'after the chart jump the dossier action belongs by the score, not below the evidence ledger')
          browser('click','.evidence-toggle button:last-child')
          assert(evaluate("document.querySelector('.evidence-toggle button:last-child').getAttribute('aria-pressed')==='true'"))
          browser('click', '.evidence-field-guide summary')
          assert(evaluate("document.querySelector('.evidence-field-guide').open && document.querySelector('.evidence-field-guide').textContent.includes('missing scores stay off the plot')"))
          browser('click', '.evidence-field-guide summary')
          browser('scrollintoview','.evidence-plot-wrap')
          browser('screenshot',join(out,'data-evidence-plot-390.png'))
          evaluate('window.scrollTo(0,0)')
        }
      }
      if (name === 'auction-census') {
        const census = evaluate(`fetch('/data/auction_census.json').then(r=>r.json()).then(d=>{
          const tables=[...document.querySelectorAll('.census-sales')], rows=tables[0].tBodies[0].rows;
          return {complete:rows.length===d.totals.auctions, starts:document.querySelector('.census-fx-note').textContent.includes(d.totals.lots_converted_at_auction_start+' conversions use auction-opening FX'),
            first:rows[0].getBoundingClientRect().bottom, fits:tables.every(t=>t.getBoundingClientRect().right<=innerWidth && t.scrollWidth<=t.clientWidth+1),
            compact:[...document.querySelectorAll('.census-sort button')].every(b=>b.getBoundingClientRect().width<=120),
            countUnbroken:tables.every(t=>getComputedStyle(t.tHead.rows[0].cells[1]).whiteSpace==='nowrap')};
        })`)
        assert(census.complete && census.starts && census.fits && census.first <= height && census.compact && census.countUnbroken, `census result and its caveat must fit at ${width}: ${JSON.stringify(census)}`)
        if (width === 390) {
          assert(evaluate(`(() => {
            const sort=document.querySelector('.census-sort'), note=document.querySelector('.census-sort-note');
            const fits=sort.getBoundingClientRect().bottom<=innerHeight;
            sort.before(note);
            sort.style.marginTop='48px';
            const oldFails=sort.getBoundingClientRect().bottom>innerHeight;
            sort.style.removeProperty('margin-top');
            sort.after(note);
            return fits && oldFails;
          })()`), 'marque sorting must fit before scrolling; restoring the old spacing must fail')
          browser('click', '.census-sort button:nth-child(2)')
          assert(evaluate("document.querySelector('.census-sort button:nth-child(2)').getAttribute('aria-pressed')==='true'"))
          evaluate('window.scrollTo(0,0)')
          browser('click', '.census-method > summary')
          assert(evaluate("!!document.querySelector('.census-method[open] .census-channels')"))
          browser('click', '.census-method > summary')
        }
      }
      if (name === 'dossier-gap') {
        assert(evaluate(`(() => {
          const row=document.querySelector('.dsr-verdict-row--teal');
          return row.querySelector('.dsr-verdict-cap').textContent==='NO COMPS' &&
            row.querySelector('.dsr-verdict-state').textContent==='UNKNOWN';
        })()`), 'missing comparable sales must not imply a weak score or that the watch never traded')
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
          assert(ledger.height <= 112 && ledger.refusal.includes('No comparable sales') && ledger.missing === 8 && !ledger.placeholder,
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
          assert(evaluate("document.querySelector('.dsr-unavailable .why[open] p').textContent.includes('No comparable sales')"))
          browser('screenshot', join(out, 'dossier-evidence-expanded-390.png'))
          browser('click', '.dsr-unavailable > summary')
          evaluate('window.scrollTo(0, 0)')
          Object.assign(proof, { ledger })
        }
      }
      if (name === 'dossier-photo') {
        assert(evaluate("!!document.querySelector('.dossier-object img') && document.querySelector('.dossier-object figcaption').textContent.includes('SOURCE') && !document.querySelector('.dsr-photo-status')"), 'preserve the sourced portrait and credit')
        const variant = evaluate(`fetch('/data.json').then(r=>r.json()).then(data=>{
          const card=data.cards.find(c=>c.id==='ap-15202st');
          const table=document.querySelector('[aria-label="Variant sales excluded from the estimate"]');
          const rows=[...table.tBodies[0].rows];
          return {width:table.getBoundingClientRect().width, complete:rows.length===card.variant_sales.length &&
            rows.every((row,i)=>{
              const sale=card.variant_sales[i], link=row.querySelector('a');
              return link.getAttribute('href')===sale.url && link.getBoundingClientRect().right<=innerWidth &&
                row.textContent.includes(sale.condition) && row.querySelector('time').dateTime===sale.date &&
                (!sale.fx_conversion || (
                  row.querySelector('.dossier-variant-native').textContent===sale.fx_conversion.original_display &&
                  row.querySelector('.dossier-variant-fx').textContent.startsWith('≈ $') &&
                  row.querySelector('.dossier-variant-fx').textContent.includes('ECB '+sale.fx_conversion.rate_date) &&
                  (sale.fx_conversion.date_basis!=='auction_start' || row.textContent.includes('Opening-date FX'))
                )) && (sale.date_basis!=='auction_start' || row.textContent.includes('Auction opened'));
            })};
        })`)
        assert(variant.complete && variant.width <= width, `variant evidence and its citations must fit at ${width}`)
        if (width === 390) {
          browser('scrollintoview', '.dossier-sales[aria-label^="Variant"]')
          browser('screenshot', join(out, 'dossier-variant-citations-390.png'))
          evaluate('window.scrollTo(0, 0)')
        }
      }
      const screenshot = join(out, `${name}-${width}.png`)
      browser('screenshot', screenshot)
      proofs.push({ name, ...proof, screenshot })
    }
  }
  for (const [width, height, id] of [[320, 720, 'rolex-5513'], [390, 844, 'rolex-116500ln']]) {
    browser('set', 'viewport', String(width), String(height))
    browser('open', base + '/w/' + id)
    browser('wait', '.dsr-action-save')
    assert(evaluate(`document.fonts.ready.then(() => {
      const top = document.querySelector('.dsr-top'), action = top.querySelector('.dsr-action-save');
      const photo = top.querySelector('figure'), verdict = top.querySelector('.dsr-verdict');
      const bar = top.querySelector('.dsr-actions'), parent = bar.parentElement;
      const fits = () => action.getBoundingClientRect().bottom <= innerHeight;
      const current = fits() && photo.querySelector('img').getBoundingClientRect().height > 100 &&
        photo.querySelector('figcaption').textContent.includes('PHOTO:') &&
        !!photo.querySelector('figcaption a[aria-label="Photo source"][href]') &&
        document.documentElement.scrollWidth <= innerWidth + 1;
      verdict.after(bar);
      const oldFails = !fits();
      parent.append(bar);
      return current && oldFails;
    })`), `portrait and Save must fit on the first screen at ${width}, unlike the old order`)
    if (width === 320) {
      assert(evaluate("document.querySelector('.dossier-object img').alt.startsWith('Related configuration for ')"))
      browser('click', '.dossier-photo-note > summary')
      assert(evaluate("document.querySelector('.dossier-photo-note[open] span').textContent.includes('1953')"))
      browser('click', '.dossier-photo-note > summary')
    }
    browser('screenshot', join(out, `dossier-first-action-${width}.png`))
  }
  browser('open', base + '/w/rolex-6239-paul-newman')
  browser('wait', '.dsr-evidence-ledger')
  assert(evaluate(`document.querySelector('.dsr-evidence-ledger').textContent.includes('$419,100') &&
    document.querySelectorAll('svg[aria-label="Price evidence chart"] rect').length === 3`),
    'three sourced Paul Newman sales must be visible with the historical median')
  browser('open', base + '/w/patek-5711-1a-018-tiffany')
  browser('wait', '.dsr-estimate-refusal')
  assert(evaluate(`document.querySelector('.dsr-estimate-refusal').textContent.includes('Market estimate') &&
    [...document.querySelectorAll('main a')].some(a=>a.href.endsWith('/NY080121/1T'))`),
    'Tiffany must retain its charity citation without publishing an estimate')
  browser('open', base + '/w/rolex-116500ln')
  browser('wait', '.dsr-evidence-ledger')
  const priced = evaluate(`(() => ({
    published:document.querySelectorAll('.dsr-evidence-ledger > .mcell').length,
    text:document.querySelector('.dsr-evidence-ledger').textContent,
    marks:document.querySelectorAll('svg[aria-label="Price evidence chart"] rect').length,
    citations:document.querySelectorAll('.sales-table .src-a').length,
    settlement:!!document.querySelector('.txn-graphic-card:not(.empty)')
  }))()`)
  assert(priced.published === 4 && priced.text.includes('$28,750') && priced.text.includes('HISTORICAL, AS OF 2024-12') && priced.marks === 3 && priced.citations >= 3 && priced.settlement,
    'available estimates, their age, cited sales, and the existing charts must survive compaction')
  browser('click', '.dossier-retail-records summary')
  const observations = evaluate(`fetch('/data.json').then(r=>r.json()).then(data=>{
    const card=data.cards.find(c=>c.id==='rolex-116500ln');
    const chart=document.querySelector('.dossier-price-chart');
    const svg=chart.querySelector('svg');
    const retail=card.retail.msrp_history;
    const sales=card.notable_sales;
    const years=[...retail.map(r=>r.effective_year),...sales.map(s=>Number(s.date.slice(0,4)))];
    const dates=[...chart.querySelectorAll('.dossier-chart-dates span')].map(e=>Number(e.textContent));
    const sources=[...chart.querySelectorAll('.dossier-retail-records[open] a')];
    return svg.querySelectorAll('circle').length===retail.length &&
      svg.querySelectorAll('rect').length===sales.length && !svg.querySelector('path,polyline') &&
      dates[0]===Math.min(...years) && dates.at(-1)===Math.max(...years) &&
      sources.length===retail.length && sources.every((source,i)=>source.getAttribute('href')===retail[i].source_url) &&
      chart.querySelector('.dossier-chart-key').textContent.includes('List price by year');
  })`)
  assert(observations, 'chart marks and source links must match observations, without a carried-forward line')
  browser('click', '.dossier-retail-records summary')
  browser('scrollintoview', '.dsr-evidence-ledger')
  browser('screenshot', join(out, 'dossier-evidence-priced.png'))
  for (const [width, height] of [[390, 844], [1024, 900], [1440, 900]]) {
    browser('set', 'viewport', String(width), String(height))
    const geometry = evaluate(`(() => {
      const actions=document.querySelector('.dsr-actions'), bounds=actions.getBoundingClientRect();
      const controls=[...actions.querySelectorAll('.dsr-action')];
      const contained=controls.every(control => {
        const box=control.getBoundingClientRect();
        return box.left>=bounds.left-1 && box.right<=bounds.right+1 && box.height>=32;
      });
      const chart=document.querySelector('.txn-graphic-card');
      const axes=[...chart.querySelectorAll('.spectrum-axis')];
      const rects=axes.map(axis=>axis.getBoundingClientRect());
      const sameScale=rects.length===2 && rects[0].x===rects[1].x && rects[0].width===rects[1].width;
      const labels=[...chart.querySelectorAll('.spectrum-reading')].map(label=>label.textContent);
      return { contained, controls:controls.length, actionHeight:bounds.height, scroll:actions.scrollWidth-actions.clientWidth,
        sameScale, labels, chartHeight:chart.getBoundingClientRect().height, textInMarks:axes.some(axis=>axis.textContent.trim()) };
    })()`)
    assert(geometry.contained && geometry.controls === 5 && geometry.scroll <= 1 && geometry.actionHeight <= 96,
      `the five actions must fit in at most two compact rows at ${width}: ${JSON.stringify(geometry)}`)
    assert(geometry.sameScale && !geometry.textInMarks && geometry.chartHeight <= 330 &&
      geometry.labels.some(label=>label.includes('Sale evidence band')) &&
      geometry.labels.some(label=>label.includes('80–85%') && label.includes('Not a quote')),
      `price marks and scenario labels must be separate, compact, and readable at ${width}`)
    if (width === 1024) {
      assert(evaluate(`(() => {
        const actions=document.querySelector('.dsr-actions');
        actions.style.flexWrap='nowrap';
        for (const group of actions.children) group.style.flexShrink='0';
        const fails=actions.scrollWidth > actions.clientWidth+1;
        actions.removeAttribute('style');
        for (const group of actions.children) group.removeAttribute('style');
        return fails;
      })()`), 'the old nowrap behavior must fail the tablet action budget')
    }
    browser('scrollintoview', '.dsr-actions')
    browser('screenshot', join(out, `dossier-actions-${width}.png`))
    browser('scrollintoview', '.txn-graphic-card')
    browser('screenshot', join(out, `dossier-settlement-${width}.png`))
    const citationsFit = evaluate(`(() => {
      const table=document.querySelector('[aria-label="Verified sales"]');
      const links=[...table.querySelectorAll('a')];
      const fits=()=>links.length===${priced.marks} && new Set(links.map(link=>link.getAttribute('aria-label'))).size===${priced.marks} && links.every(link=>{
        const r=link.getBoundingClientRect();
        return r.left>=0 && r.right<=innerWidth && r.height>=32;
      });
      const chart=document.querySelector('.dossier-price-chart').getBoundingClientRect();
      const records=table.getBoundingClientRect();
      const current=fits() && (innerWidth<900 || (chart.right<records.left && Math.abs(chart.top-records.top)<1)) &&
        [...table.tBodies[0].rows].every(row=>row.getBoundingClientRect().height<=64);
      table.style.minWidth='560px';
      const oldFails=!fits();
      table.removeAttribute('style');
      return current && (innerWidth!==390 || oldFails);
    })()`)
    assert(citationsFit, `all sale citations must fit without the old horizontal scrolling at ${width}`)
    browser('scrollintoview', '.dossier-sales[aria-label="Verified sales"]')
    browser('screenshot', join(out, `dossier-sale-citations-${width}.png`))
    proofs.push({ name: 'dossier-settlement', width, geometry })
  }
  browser('click', '.txn-scenario-details > summary')
  assert(evaluate("document.querySelector('.txn-scenario-details[open]').textContent.includes('94–97%')"))
  browser('click', '.dsr-action-group--models a:last-child')
  browser('wait', '--url', '**/marketplaces?watch=rolex-116500ln')
  for (const [width, height] of [[390,844], [1024,900], [1440,900]]) {
    browser('set', 'viewport', String(width), String(height))
    browser('open', base + '/marketplaces?watch=rolex-116500ln')
    browser('wait', '.venue-receipt tbody tr')
    const receipt = evaluate(`(() => {
      const table=document.querySelector('.venue-receipt'), first=table.tBodies[0].rows[0];
      return {fits:table.scrollWidth<=table.clientWidth+1, first:first.getBoundingClientRect().bottom,
        baseline:document.querySelector('.swb-info').textContent, sources:[...table.querySelectorAll('tbody tr')].every(r=>!!r.querySelector('a[href^="https://"]'))};
    })()`)
    assert(receipt.fits && receipt.sources && receipt.first<=height && receipt.baseline.includes('HISTORICAL BASELINE: $28,750'), JSON.stringify(receipt))
    browser('screenshot', join(out, `venue-receipt-${width}.png`))
    if(width===390) {
      browser('select', 'select[aria-label="Choose a watch reference"]', 'casio-ae-1200')
      assert(evaluate("!document.querySelector('.venue-receipt') && document.querySelector('.swb-info').textContent.includes('NO MARKET BASELINE')"))
    }
    proofs.push({name:'venue-receipt',width,...receipt})
  }
  browser('set', 'viewport', '390', '844')
  browser('open', base + '/w/rolex-116500ln')
  browser('wait', '.spectrum-axis')
  const enlargedChart = evaluate(`(() => {
    const chart=document.querySelector('.txn-graphic-card');
    const elements=[...chart.querySelectorAll('h3,p,span,summary')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
    for (const [element,size] of elements) element.style.fontSize=(size*2)+'px';
    return chart.scrollWidth<=chart.clientWidth+1 && document.documentElement.scrollWidth<=innerWidth+1;
  })()`)
  assert(enlargedChart, 'the settlement chart must reflow with doubled text')
  browser('scrollintoview', '.txn-graphic-card')
  browser('screenshot', join(out, 'dossier-settlement-enlarged-390.png'))
  assert(evaluate(`(() => {
    const table=document.querySelector('.dossier-sales[aria-label="Verified sales"]');
    const elements=[...table.querySelectorAll('th,td,time,span,a')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
    for (const [element,size] of elements) element.style.fontSize=(size*2)+'px';
    return [...table.querySelectorAll('a')].every(link=>link.getBoundingClientRect().right<=innerWidth) &&
      document.documentElement.scrollWidth<=innerWidth+1;
  })()`), 'sale records must stay visible with doubled phone text')
  // The reviewed lots must reach the price ledger with their actual source and age.
  for (const [id, price, date, source] of [
    ['lange-odysseus-363-179', '$60,960', '2025-04', 'https://www.phillips.com/detail/a-lange-sohne/144993'],
    ['patek-5712-1a', '$101,600', '2024-06', 'https://www.phillips.com/detail/patek-philippe/190077'],
  ]) {
    browser('open', base + '/w/' + id)
    browser('wait', '.dossier-sales[aria-label="Verified sales"]')
    const reviewed = evaluate(`(() => {
      const text=document.querySelector('.dsr-evidence-ledger').textContent;
      const table=document.querySelector('.dossier-sales[aria-label="Verified sales"]');
      const links=[...table.querySelectorAll('a')];
      return text.includes(${JSON.stringify(price)}) && text.includes(${JSON.stringify('HISTORICAL, AS OF ' + date)}) &&
        links.length===3 && links.some(link=>link.href===${JSON.stringify(source)}) &&
        links.every(link=>link.getBoundingClientRect().right<=innerWidth);
    })()`)
    assert(reviewed, `${id} must show three cited records and an explicitly historical estimate`)
  }
  for (const [width, height] of [[390,844], [1024,900], [1440,900]]) {
    browser('set', 'viewport', String(width), String(height))
    browser('open', base + '/rehome')
    browser('wait', '#rehome-watch')
    assert(evaluate("document.querySelector('#rehome-watch').getBoundingClientRect().bottom<innerHeight && !document.querySelector('.brief-preview')"),
      'the first action fits and no empty preview is reserved')
    browser('select', '#rehome-watch', 'rolex-116500ln')
    browser('wait', '.rehome-actions button')
    assert(evaluate("location.search==='?watch=rolex-116500ln' && document.documentElement.scrollWidth<=innerWidth+1"))
    assert(evaluate("document.querySelectorAll('.brief-facts > div').length===1 && document.querySelector('.rehome-market-context').textContent.startsWith('Historical estimate')"))
    assert(evaluate("document.querySelector('.rehome-form .section-rule').getBoundingClientRect().height<=48"), 'preview link must share the form heading row')
    browser('screenshot', join(out, `rehome-draft-${width}.png`))
    if (width === 390) {
      browser('fill', '.rehome-form label:nth-of-type(2) textarea', 'Family watch, service receipt included.')
      browser('select', '#rehome-watch', 'casio-ae-1200')
      assert(evaluate("!document.querySelector('.brief-preview').textContent.includes('Family watch') && !document.querySelector('.brief-preview .txn-graphic-card')"))
      browser('select', '#rehome-watch', 'rolex-116500ln')
      assert(evaluate("document.querySelector('.rehome-form textarea').value.startsWith('Family watch')"))
      browser('click', '.rehome-preview-link')
      assert(evaluate("document.querySelector('.rehome-actions button').getBoundingClientRect().bottom<=innerHeight"), 'phone jump must reveal copy')
      evaluate("Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async()=>{throw new Error('denied')}} }); true")
      browser('click', '.rehome-actions button')
      browser('wait', '.rehome-copy-fallback textarea')
      const text = evaluate("document.querySelector('.rehome-copy-fallback textarea').value")
      assert(text.includes('Family watch') && text.includes('Historical estimate: $28,750') && text.includes('newest sale 2024-12-13') &&
        evaluate('location.search') === '?watch=rolex-116500ln')
      evaluate("Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async text=>{window.__copiedBrief=text}} }); true")
      browser('click', '.rehome-actions button')
      assert(evaluate('window.__copiedBrief') === text, 'clipboard and manual selection must carry the same provenance')
      browser('screenshot', join(out, 'rehome-copy-390.png'))
    }
    proofs.push({name:'rehome', width})
  }
  browser('open', base + '/w/rolex-116500ln')
  browser('wait', '#tab-venues')
  browser('click', '#tab-venues')
  browser('wait', 'a[href="/rehome?watch=rolex-116500ln"]')
  browser('click', 'a[href="/rehome?watch=rolex-116500ln"]')
  browser('wait', '.rehome-actions button')
  assert(evaluate("document.querySelector('#rehome-watch').value==='rolex-116500ln'"), 'handover should start with the dossier reference selected')
  browser('set', 'viewport', '390', '844')
  browser('open', base + '/pom#value-lab')
  browser('wait', '.pom-lab-tabs')
  evaluate("localStorage.setItem('watch.saved', JSON.stringify(['rolex-116500ln','rolex-116500ln',42])); true")
  browser('reload')
  browser('wait', '[aria-controls="pom-saved-panel"]')
  browser('click', '[aria-controls="pom-saved-panel"]')
  browser('wait', '#pom-saved-start')
  assert(evaluate("document.querySelector('#pom-saved-panel .pom-value-status').textContent.includes('1/1') && !document.querySelector('#pom-saved-panel .pom-projection-table')"))
  assert(evaluate(`[...document.querySelectorAll('.pom-saved-row strong,.pom-saved-row small')].every(e=>e.scrollWidth<=e.clientWidth+1)`),
    'watch identity and its dated provenance must not clip on phone')
  browser('scrollintoview', '#pom-saved-start')
  browser('screenshot', join(out, 'collector-saved-basis-390.png'))
  browser('click', '#pom-saved-panel .pom-history-toggle')
  assert(evaluate("document.querySelector('#pom-saved-panel .pom-formula').textContent.includes('HISTORICAL START · COMPONENTS AS OF 2024-12-13')"))
  evaluate("localStorage.setItem('watch.saved', JSON.stringify(['rolex-116500ln','missing-legacy-reference'])); true")
  browser('reload')
  browser('wait', '[aria-controls="pom-saved-panel"]')
  browser('click', '[aria-controls="pom-saved-panel"]')
  assert(evaluate("document.querySelector('#pom-saved-panel .pom-value-status').textContent.includes('1/2') && document.querySelector('.pom-saved-gap').textContent.includes('not in this build') && !document.querySelector('#pom-saved-panel .pom-history-toggle')"))
  browser('fill', '#pom-saved-start', '18000')
  assert(evaluate("document.querySelector('#pom-saved-panel .pom-formula').textContent.includes('USER-ENTERED START · $18,000')"))
  browser('network', 'route', '**/live/market_trends.json', '--abort')
  evaluate("localStorage.setItem('watch.saved', JSON.stringify(['cartier-santos-wssa0018','rolex-116500ln'])); true")
  browser('open', base + '/saved')
  browser('wait', '.saved-pulse-photo-note')
  assert(evaluate(`(() => {
    const related=document.querySelector('.saved-pulse-row[href="/w/cartier-santos-wssa0018"]');
    const exact=document.querySelector('.saved-pulse-row[href="/w/rolex-116500ln"]');
    return related.querySelector('img').alt==='Related watch, not reference WSSA0018' &&
      related.querySelector('.saved-pulse-photo-note').textContent==='Related photo · not this reference' &&
      !!exact.querySelector('img') && !exact.querySelector('.saved-pulse-photo-note') &&
      document.documentElement.scrollWidth<=innerWidth;
  })()`), 'Saved attention must distinguish exact and related thumbnails without phone overflow')
  assert(evaluate(`(() => {
    const root=document.documentElement, original=root.getAttribute('data-theme');
    const luminosity=value=>value.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255)
      .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4)
      .reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
    const contrast=['dark','light'].every(theme=>{
      root.setAttribute('data-theme',theme);
      return ['.saved-pulse-meta','.saved-pulse-foot'].every(selector=>{
        const css=getComputedStyle(document.querySelector(selector));
        const [lo,hi]=[luminosity(css.color),luminosity(css.backgroundColor)].sort((a,b)=>a-b);
        return (hi+0.05)/(lo+0.05)>=4.5;
      });
    });
    if(original===null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme',original);
    const pulse=document.querySelector('.saved-pulse');
    return contrast && pulse.textContent.includes('BUNDLED SNAPSHOT') &&
      pulse.textContent.includes('AS OF ') && !pulse.textContent.toLowerCase().includes('today');
  })()`), 'a bundled snapshot must be dated and both source bands readable in light and dark')
  browser('open', base + '/register')
  browser('wait', '.rc-trend-badge')
  assert(evaluate(`document.querySelector('.count-line').textContent.includes('ATTENTION AS OF 2026-11-06') &&
    document.querySelector('.rc-trend-badge').textContent.includes('RANK #') &&
    getComputedStyle(document.querySelector('.rc-trend-badge-dot')).animationName==='none'`))
  browser('open', base + '/w/rolex-116500ln')
  browser('wait', '.dsr-trending')
  assert(evaluate(`document.querySelector('.dsr-trending strong').textContent.includes('2026-11-06') &&
    getComputedStyle(document.querySelector('.dsr-trending-pulse')).animationName==='none'`))
  browser('network', 'unroute', '**/live/market_trends.json')
  browser('open', base + '/compare')
  browser('wait', 'select[aria-label="Add a reference"]')
  for (const id of ['rolex-116500ln','casio-ae-1200','patek-5712-1a','lange-odysseus-363-179'])
    browser('select', 'select[aria-label="Add a reference"]', id)
  for (const [width,height] of [[390,844],[1024,900],[1440,900]]) {
    browser('set','viewport',String(width),String(height))
    evaluate('window.scrollTo(0,0)')
    const compare = evaluate(`(() => {
      const receipt=document.querySelector('.cmp-price-receipt'), cols=[...document.querySelectorAll('.cmp-col')];
      return {rows:receipt.tBodies[0].rows.length, text:receipt.textContent, bottom:receipt.getBoundingClientRect().bottom,
        width:document.documentElement.scrollWidth, distinct:new Set(cols.map(c=>Math.round(c.getBoundingClientRect().left))).size,
        overflow:cols.some(c=>c.scrollWidth>c.clientWidth+1),
        exactPhotos:!cols.find(c=>c.querySelector('a[href="/w/patek-5712-1a"]')).querySelector('img') &&
          !!cols.find(c=>c.querySelector('a[href="/w/rolex-116500ln"]')).querySelector('img'),
        dates:[...receipt.querySelectorAll('.cmp-price-date')].every(e=>getComputedStyle(e).whiteSpace==='nowrap')};
    })()`)
    assert(compare.rows===4 && compare.text.includes('Historical · 3 sales · 2024-12-13') && compare.text.includes('No estimate') &&
      compare.bottom<=height && compare.width<=width+1 && !compare.overflow && compare.exactPhotos && compare.dates &&
      compare.distinct===(width===1440?4:width===1024?2:1), JSON.stringify(compare))
    browser('screenshot',join(out,`compare-receipt-${width}.png`))
  }
  browser('open', base + '/saved')
  browser('wait', '.saved-price-date')
  assert(evaluate("document.querySelector('.saved-price-date').textContent.includes('Historical · 2024-12-13')"))
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
  evaluate("fetch('/data.json').then(r=>r.json()).then(d=>{localStorage.setItem('watch.saved',JSON.stringify(d.cards.slice(0,200).map(c=>c.id)));return true})")
  browser('reload')
  browser('wait', '.saved-badge[aria-label="Saved watches: 200"]')
  browser('wait', '.dsr-verdict')
  browser('set','viewport','1440','900')
  evaluate('document.fonts.ready.then(() => document.querySelector(".nav").offsetWidth)')
  for (const [width,height] of [[320,720],[390,844],[721,900],[1024,900],[1440,900]]) {
    browser('set','viewport',String(width),String(height))
    evaluate('document.fonts.ready.then(() => true)')
    const masthead = evaluate(`(() => {
      const city=document.querySelector('.city-toggle-btn'), name=city.querySelector('.city-toggle-name'), pin=city.querySelector('.city-toggle-pin');
      const cluster=document.querySelector('.hdr-cluster'), mark=document.querySelector('.wm-main');
      const fits=()=>mark.getBoundingClientRect().right <= cluster.getBoundingClientRect().left+1;
      const current=fits();
      let falsifier=true;
      if(innerWidth===320) {
        city.style.width='auto';city.style.paddingInline='10px';name.style.display='inline';pin.style.display='none';
        falsifier=!fits();
        for(const el of [city,name,pin])el.removeAttribute('style');
        const verdict=document.querySelector('.dsr-verdict');
        const rows=[...verdict.querySelectorAll('.dsr-verdict-row')];
        const verdictFits=()=>document.documentElement.scrollWidth<=innerWidth+1 && rows.length===4 &&
          rows.every(row=>row.lastElementChild.getBoundingClientRect().right<=verdict.getBoundingClientRect().right);
        const compact=verdictFits();
        for(const row of rows) {row.style.gridTemplateColumns='80px 56px 1fr 80px';row.style.columnGap='0';row.style.overflowWrap='normal';}
        const fixedFails=!verdictFits();
        for(const row of rows)row.removeAttribute('style');
        falsifier=falsifier && compact && fixedFails;
      }
      const controls=[...cluster.querySelectorAll('button,a')];
      return {current,falsifier,controls:controls.length,targets:controls.every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44}),
        height:document.querySelector('.hdr').getBoundingClientRect().height, label:city.getAttribute('aria-label'),
        pin:getComputedStyle(pin).display!=='none', doc:document.documentElement.scrollWidth,
        navFits:[...document.querySelectorAll('.nav-a')].every(el=>el.scrollWidth<=el.clientWidth+1 &&
          el.getBoundingClientRect().right<=innerWidth+1 &&
          getComputedStyle(el).transitionProperty.split(',').every(p=>['color','background-color','none'].includes(p.trim())))};
    })()`)
    assert(masthead.current && masthead.falsifier && masthead.controls===4 && masthead.targets && masthead.height<=160 &&
      masthead.label.includes('currently') && masthead.pin===(width<=460) && masthead.doc<=width+1 && masthead.navFits, JSON.stringify(masthead))
    browser('screenshot',join(out,`masthead-populated-${width}.png`))
  }
  browser('set','viewport','320','720')
  browser('click','.city-toggle-btn')
  browser('wait','#city-options')
  browser('press','Escape')
  assert(evaluate("document.activeElement===document.querySelector('.city-toggle-btn')"))
  browser('click','.saved-badge')
  browser('wait','--url','**/saved')
  browser('set','viewport','390','900')
  // Block both font providers and reload. Fallback must preserve the core flow.
  browser('network', 'route', '**/fonts/*', '--abort')
  browser('network', 'route', '*fonts.googleapis.com*', '--abort')
  browser('open', base + '/register')
  browser('wait', 'main h1')
  assert(evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'font failure must reflow')
  browser('fill', 'input[aria-label="Search the register"]', '5513')
  assert(evaluate("document.querySelector('main').textContent.includes('5513')"), 'search survives failed fonts')
  browser('screenshot', join(out, 'register-fallback-390.png'))
  browser('set','viewport','320','720')
  assert(evaluate("document.querySelector('.wm-main').getBoundingClientRect().right <= document.querySelector('.hdr-cluster').getBoundingClientRect().left+1"),
    'the populated wordmark must fit even when fonts are blocked')
  writeFileSync(join(out, 'receipt.json'), JSON.stringify({ base, proofs, search: 'passed', enlarged: 'passed', fallback: 'passed' }, null, 2))
  console.log(`✓ ${proofs.length} responsive proofs, loaded font, search, enlargement and font-failure fallback → ${out}`)
} finally { browser('close') }
