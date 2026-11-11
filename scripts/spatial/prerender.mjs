/**
 * PRERENDER THE MEASUREMENT COPY — put the real page in the document.
 *
 * THE PROBLEM
 *
 * The spatial gate measures a page at the browser's `load` event. That event
 * means "the document's resources have arrived", and for a document that is
 * written out in full, that is also "the page is here". This site is a
 * single-page app: the document that arrives is a shell, and the page is
 * assembled afterwards by React from a 1.6 MB dataset fetched at runtime.
 * Measured on this build, a WARM load — CSS, fonts and chunks already in the
 * browser's cache — fires `load` at ~150ms and paints the real page at ~700ms.
 * The gate therefore settled on the loading placeholder and measured that
 * under the name of the page it was asked to measure. Its own cross-check
 * caught the disagreement and refused to pass, which is the gate working as
 * designed: it will not report a layout no reader sees.
 *
 * THE FIX
 *
 * Take the page the app actually renders and put it in the document, so the
 * document that arrives IS the page. The measurement copy is prerendered: a
 * headless browser visits each route, waits for the app to stop working, and
 * writes the resulting DOM into that route's HTML. The app's own module
 * script is removed from the snapshot, so the snapshot is the finished page
 * and nothing re-renders it afterwards. The stylesheets, the fonts and the
 * images are all still the site's own, so the layout measured is the layout
 * the site serves.
 *
 * Why this and not a cleverer harness: the gate is a shared, byte-identical
 * instrument, and the only thing that may differ between projects is the
 * project. Prerendering the measurement copy is a project-side change: the
 * instrument stays exactly as it is, and what it measures is the app's own
 * output rather than a guess at it.
 *
 * It is also honest in a way a timing hack is not. The snapshot is the DOM
 * the app produced, from the app's own data, in the app's own stylesheets. A
 * harness that merely waits longer measures the same thing; this one cannot
 * measure the loading placeholder at all, because the placeholder is not in
 * the document.
 *
 * The copy is NEVER deployed. It lives in .spatial-dist/ and dist/ is
 * untouched.
 *
 *   node scripts/spatial/prerender.mjs --dir .spatial-dist
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf('--' + n);
  return i === -1 ? d : argv[i + 1];
};
const DIR = resolve(arg('dir', '.spatial-dist'));
const PORT = Number(arg('port', 4455));
const ONLY = arg('routes', null);

if (!existsSync(join(DIR, 'index.html'))) {
  console.error(`${DIR}/index.html is missing — run scripts/spatial/make-measure-copy.mjs first.`);
  process.exit(1);
}

// ---------------------------------------------------------------- the load event
/**
 * The snapshot must reach its load event, and it must do it before the gate
 * measures it.
 *
 * The gate waits for the page to have ARRIVED - every image complete, the
 * fonts loaded - and then for it to be still. That is a page that has finished
 * loading, and in a snapshot the images are the last thing to arrive, so the
 * real load event fires late: after the images, after the gate has already
 * measured.
 *
 * Anything that waits for load to do its work therefore never ran before the
 * measurement. The falsifier's fixtures are exactly that - a defect mounted
 * on load - and the gate measured the page without it and called the rule
 * dead, which is a false accusation of the instrument in the other
 * direction: the defect WAS in the page a reader gets, and the gate read a
 * page that no reader would ever see.
 *
 * In a snapshot the load event means "the document is parsed", and that is
 * true the moment the parser reaches the end of the body. So the snapshot
 * says so: one task after the document is parsed, the window is told the
 * page has loaded. The setTimeout is deliberate - the event has to be fired
 * AFTER every script in the body has run and registered its listener, and
 * the scripts are what the event is for.
 *
 * This copy is never deployed. Nothing here is in the site's own code path.
 */
function withLoadEvent(html) {
  const script = [
    '<script id="__spatial_load__">',
    'setTimeout(function () {',
    '  try { window.dispatchEvent(new Event("load")); } catch (e) {}',
    '}, 0);',
    '</script>',
  ].join('\n');
  const i = html.lastIndexOf('</body>');
  if (i === -1) return html + '\n' + script;
  return html.slice(0, i) + '\n' + script + '\n' + html.slice(i);
}

// ---------------------------------------------------------------- the routes
const routes = ['/'];
for (const e of readdirSync(DIR, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  if (e.name.startsWith('_') || e.name.startsWith('.') || e.name === '404') continue;
  if (existsSync(join(DIR, e.name, 'index.html'))) routes.push(`/${e.name}/`);
}
routes.sort();

// ---------------------------------------------------------------- the server
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.pdf': 'application/pdf', '.map': 'application/json; charset=utf-8',
};
const server = createServer((req, res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  let p = join(DIR, raw);
  try {
    if (existsSync(p) && p.endsWith('/')) p = join(p, 'index.html');
    else if (existsSync(p) && existsSync(join(p, 'index.html'))) p = join(p, 'index.html');
  } catch { /* fall through */ }
  if (!existsSync(p)) {
    const idx = join(DIR, 'index.html');
    if (existsSync(idx)) { res.writeHead(200, { 'content-type': MIME['.html'] }); res.end(readFileSync(idx)); return; }
    res.writeHead(404); res.end('not found'); return;
  }
  const ext = p.slice(p.lastIndexOf('.'));
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
import { readFileSync } from 'node:fs';

await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

// ---------------------------------------------------------------- the browser
const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
].filter(Boolean).find((c) => existsSync(c));
if (!CHROME) {
  console.error('No Chrome found — set CHROME_PATH.');
  server.close();
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'spatial-prerender-'));
const chromePort = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${chromePort}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--disable-background-networking', '--hide-scrollbars', '--window-size=1440,1000',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

function cdp(ws) {
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { resolve, reject } = pend.get(m.id);
      pend.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  });
  return (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const mid = ++id;
    pend.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
    setTimeout(() => { if (pend.has(mid)) { pend.delete(mid); reject(new Error('timeout ' + method)); } }, 120000);
  });
}

async function devtoolsUrl() {
  for (let i = 0; i < 150; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('no devtools');
}

/**
 * Wait until the app has stopped working: the loading placeholder is gone and
 * the page's shape has held still for 400ms. The same rule the spatial
 * instrument uses to decide a page is finished.
 */
const READY_EXPR = `(() => {
  var m = document.querySelector('main#content') || document.querySelector('main');
  if (!m) return { ok: false, why: 'no main' };
  if (m.querySelector('.boot')) return { ok: false, why: 'still loading' };
  return {
    ok: true,
    sig: document.documentElement.scrollHeight + '|' + m.textContent.length + '|' + document.getElementsByTagName('*').length
  };
})()`;

/**
 * Strip the app's own code out of the snapshot. The snapshot must be the
 * finished page, so nothing in it may run and re-render it.
 */
const STRIP_EXPR = `(() => {
  var removed = [];
  document.querySelectorAll('script[src]').forEach(function (n) {
    var src = n.getAttribute('src') || '';
    if (src.indexOf('/assets/') !== -1 || src.indexOf('/_shared/') !== -1) { n.remove(); removed.push('script ' + src); }
  });
  document.querySelectorAll('link[rel="modulepreload"], link[rel="preload"]').forEach(function (n) {
    n.remove(); removed.push('preload ' + (n.getAttribute('href') || ''));
  });
  document.querySelectorAll('script:not([src])').forEach(function (n) {
    if ((n.textContent || '').indexOf('visitor-tracking') !== -1) { n.remove(); removed.push('inline visitor-tracking'); }
  });
  // A canvas is sized in PIXELS by the script that draws it, and the snapshot
  // keeps those pixels. The snapshot was taken at one width, so the canvas in
  // it was the width of that one width - and at every other width the fixed
  // canvas was wider than the page. The gate caught it: /register/ at 878px
  // scrolled sideways by 562px, which is 1440 - 878.
  //
  // The canvas is a backdrop that fills the viewport, so it is written down
  // as a percentage and takes its size from the viewport it is measured at.
  document.querySelectorAll('canvas').forEach(function (n) {
    n.style.width = '100%';
    n.style.height = '100%';
    removed.push('canvas sized to the viewport');
  });
  // Every image loads EAGERLY in the snapshot. The gate waits for the page to
  // have arrived before it measures, and "arrived" means every image is
  // complete. A lazy image below the fold never loads in a headless page
  // that is never scrolled, so the wait ran out its full five seconds on
  // every single measurement. Eager images make the wait honest AND quick.
  document.querySelectorAll('img[loading="lazy"]').forEach(function (n) {
    n.setAttribute('loading', 'eager');
    removed.push('eager ' + (n.getAttribute('src') || '').slice(-40));
  });
  return removed;
})()`;

try {
  const ws = new WebSocket(await devtoolsUrl());
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const send = cdp(ws);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Page.enable');
  await S('Runtime.enable');

  const list = ONLY ? String(ONLY).split(',').map((r) => r.trim()).filter(Boolean) : routes;
  let done = 0;
  for (const route of list) {
    const url = `http://127.0.0.1:${PORT}${route}`;
    await S('Page.navigate', { url });

    // Wait for the app to finish.
    let sig = null, stable = 0, ok = false, why = '';
    for (let i = 0; i < 400 && !ok; i++) {
      const r = await S('Runtime.evaluate', { expression: READY_EXPR, returnByValue: true });
      const v = r.result && r.result.value;
      if (v && v.ok) {
        if (v.sig === sig) stable++; else stable = 0;
        sig = v.sig;
        if (stable >= 8) ok = true;
      } else {
        stable = 0; sig = null;
        why = (v && v.why) || 'not ready';
      }
      if (!ok) await new Promise((r) => setTimeout(r, 50));
    }
    if (!ok) {
      console.error(`  ✗ ${route} — never settled (${why})`);
      continue;
    }

    // Take the page out of the document's hands, then write it down.
    await S('Runtime.evaluate', { expression: STRIP_EXPR, returnByValue: true });
    const html = await S('Runtime.evaluate', {
      expression: '"<!doctype html>\\n" + document.documentElement.outerHTML',
      returnByValue: true,
    });
    const out = html.result.value;
    const file = route === '/' ? join(DIR, 'index.html') : join(DIR, route, 'index.html');
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, withLoadEvent(out), 'utf8');
    done++;
    console.log(`  ✓ ${route}  (${(out.length / 1024).toFixed(0)} KB)`);
  }
  console.log(`\n✓ prerendered ${done}/${list.length} route(s) into ${DIR}`);
  console.log('  the copy is a measurement artefact and is never deployed.');
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
  server.close();
}
