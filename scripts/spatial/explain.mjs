/**
 * Explain spatial-law findings: print the geometry that produced them.
 *
 * The gate reports a finding as "X leaves N px empty beneath it in a M px
 * row". That is a question, not a verdict. This prints the container's
 * layout, every child's rect, and the hole, so a human can say whether the
 * space is a decision or a defect.
 *
 * One browser, many questions — the sweep is slow because every measurement
 * is a fresh page load, but this is a one-off investigation and the page is
 * only read once per route.
 *
 *   node scripts/spatial/explain.mjs --base http://127.0.0.1:4399 \
 *     --ask "/marketplaces/:1024:.vc-type-tag.mono" \
 *     --ask "/photos/:1024:p.micro.mono"
 *
 * The format is route:width:selector. For every element that matches, the
 * hole beneath it is measured in its OWN COLUMN — the next child of the same
 * container that overlaps it horizontally and starts below it — and the
 * biggest hole is printed first, because that is the one the gate reported.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf('--' + n);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const BASE = String(arg('base', 'http://127.0.0.1:4399')).replace(/\/$/, '');
const ASKS = String(arg('ask', '')).split('||').map((s) => s.trim()).filter(Boolean);
const SETTLE = Number(arg('settle', 800));
const HEIGHT = Number(arg('height', 900));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
function chromePath() {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error('no Chrome found; set CHROME_PATH');
}

const profile = mkdtempSync(join(tmpdir(), 'explain-'));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(chromePath(), [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  `--window-size=1280,${HEIGHT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-background-networking',
  '--hide-scrollbars',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });

async function waitForDevtools() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('chrome devtools never came up. stderr:\n' + chromeErr.slice(-1500));
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  return (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (pending.has(mid)) { pending.delete(mid); reject(new Error('timeout: ' + method)); }
      }, 45000);
    });
}

// The hole beneath an element, measured in the element's OWN COLUMN — the
// same rule the probe uses, so the number printed here is the number the
// gate printed.
const EXPR = (sel) => `(() => {
  const R = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return {
    tag: e.tagName.toLowerCase(),
    cls: String(e.className || '').trim().split(/\\s+/).filter(Boolean).slice(0,3).join('.'),
    x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
    bottom: +b.bottom.toFixed(1), right: +b.right.toFixed(1),
    display: s.display, position: s.position, alignSelf: s.alignSelf, margin: s.margin,
    padding: s.padding, gap: s.gap, flex: s.flex }; };
  const txt = (e) => (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 48);
  const targets = [...document.querySelectorAll(${JSON.stringify(sel)})];
  if (!targets.length) return { error: 'no element matches ' + ${JSON.stringify(sel)} };
  const out = [];
  for (const t of targets) {
    const cont = t.parentElement;
    const cs = getComputedStyle(cont);
    const items = [...cont.children].map((k) => {
      const s = getComputedStyle(k);
      if (s.display === 'none' || s.visibility === 'hidden') return null;
      const r = k.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      return { el: k, r };
    }).filter(Boolean);
    const tr = t.getBoundingClientRect();
    let next = null;
    for (const o of items) {
      if (o.el === t) continue;
      const overlap = Math.min(o.r.right, tr.right) - Math.max(o.r.left, tr.left);
      if (overlap <= 0) continue;
      if (o.r.top < tr.bottom - 4) continue;
      if (!next || o.r.top < next.r.top) next = o;
    }
    const floor = next ? next.r.top : cont.getBoundingClientRect().bottom;
    const hole = floor - tr.bottom;
    // The band: the children that overlap the target vertically.
    const band = items.filter((o) => o.r.top < tr.bottom - 4 && o.r.bottom > tr.top + 4);
    const bandTop = Math.min(...band.map((o) => o.r.top), tr.top);
    const bandBottom = Math.max(...band.map((o) => o.r.bottom), tr.bottom);
    out.push({
      hole: +hole.toFixed(1),
      bandH: +(bandBottom - bandTop).toFixed(1),
      target: R(t),
      targetText: txt(t),
      container: { ...R(cont), gridTemplateColumns: cs.gridTemplateColumns, gridTemplateRows: cs.gridTemplateRows,
        flexDirection: cs.flexDirection, alignItems: cs.alignItems, justifyContent: cs.justifyContent,
        rowGap: cs.rowGap, columnGap: cs.columnGap, border: cs.border, borderBottom: cs.borderBottom,
        paddingBottom: cs.paddingBottom },
      below: next ? { ...R(next.el), text: txt(next.el) } : null,
      children: items.map((o) => ({ ...R(o.el), text: txt(o.el) })),
    });
  }
  out.sort((a, b) => b.hole - a.hole);
  return { url: location.pathname, w: innerWidth, n: out.length, worst: out.slice(0, 2) };
})()`;

try {
  const wsUrl = await waitForDevtools();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const send = cdp(ws);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);

  await S('Page.enable');
  await S('Runtime.enable');

  for (const ask of ASKS) {
    const [route, widthRaw, sel] = ask.split(':');
    const width = Number(widthRaw);
    await S('Emulation.setDeviceMetricsOverride', { width, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    await S('Page.navigate', { url: `${BASE}${route}` });
    for (let i = 0; i < 200; i++) {
      const r = await S('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
      if (r.result.value === 'complete') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    await new Promise((r) => setTimeout(r, SETTLE));
    const res = await S('Runtime.evaluate', { expression: EXPR(sel), returnByValue: true, awaitPromise: true });
    const value = res.exceptionDetails
      ? { error: res.exceptionDetails.exception?.description || 'exception' }
      : res.result.value;
    console.log(`\n### ${ask}`);
    if (value.error) { console.log('  ERROR:', value.error); continue; }
    console.log(`  instances=${value.n}`);
    for (const w of value.worst) {
      const t = w.target, c = w.container;
      console.log(`  hole=${w.hole} bandH=${w.bandH}`);
      console.log(`    target: ${t.tag}.${t.cls} h=${t.h} w=${t.w} y=${t.y} bottom=${t.bottom} | ${w.targetText}`);
      console.log(`    target styles: display=${t.display} margin=${t.margin} padding=${t.padding} alignSelf=${t.alignSelf}`);
      console.log(`    container: ${c.tag}.${c.cls} display=${c.display} w=${c.w} h=${c.h} align=${c.alignItems} justify=${c.justifyContent} rowGap=${c.rowGap} border=${c.border}`);
      console.log(`    below: ${w.below ? `${w.below.tag}.${w.below.cls} y=${w.below.y} h=${w.below.h} | ${w.below.text}` : '(container bottom)'}`);
      console.log('    children:');
      for (const k of w.children) console.log(`      ${k.tag}.${k.cls} x=${k.x} y=${k.y} w=${k.w} h=${k.h} bottom=${k.bottom} | ${k.text}`);
    }
  }
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
