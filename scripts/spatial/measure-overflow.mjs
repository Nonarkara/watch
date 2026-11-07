/**
 * Batch horizontal-overflow check against a LIVE app (not a prerender).
 *
 * The sweep's `overflow` findings are absolute failures in the gate, so they
 * have to be fixed, never baselined. But before fixing one, it has to be
 * shown to be real: the measurement copy is prerendered, and a prerender can
 * lie if the live app lays out differently.
 *
 * This measures the live app in one browser, across many (route, width) pairs,
 * and reports:
 *   - documentElement.scrollWidth vs clientWidth
 *   - every element whose right edge passes the viewport's right edge
 *
 *   node scripts/spatial/measure-overflow.mjs --base http://localhost:4398 \
 *     --pairs "/bible/:359,/bible/:360"
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

const BASE = String(arg('base', 'http://localhost:4398')).replace(/\/$/, '');
const PAIRS = String(arg('pairs', '')).split(',').map((s) => s.trim()).filter(Boolean);
const SETTLE = Number(arg('settle', 1500));
const OUT = arg('out', null);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function chromePath() {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error('no Chrome found; set CHROME_PATH');
}

const profile = mkdtempSync(join(tmpdir(), 'overflow-'));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(chromePath(), [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
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

const PROBE = `(() => {
  const de = document.documentElement;
  const cw = de.clientWidth;
  const over = [];
  const every = document.querySelectorAll('*');
  for (let i = 0; i < every.length; i++) {
    const el = every[i];
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > cw + 1) {
      over.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string') ? el.className : '',
        right: +r.right.toFixed(1),
        left: +r.left.toFixed(1),
        width: +r.width.toFixed(1),
        text: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60),
      });
    }
  }
  over.sort((a, b) => b.right - a.right);
  return {
    scrollWidth: de.scrollWidth,
    clientWidth: cw,
    overflowBy: de.scrollWidth - cw,
    worst: over.slice(0, 12),
  };
})()`;

try {
  const wsUrl = await waitForDevtools();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });
  const send = cdp(ws);

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);

  await S('Page.enable');
  await S('Runtime.enable');

  const rows = [];
  for (const pair of PAIRS) {
    const idx = pair.lastIndexOf(':');
    const route = pair.slice(0, idx);
    const w = Number(pair.slice(idx + 1));
    if (!route || !Number.isFinite(w)) continue;

    await S('Emulation.setDeviceMetricsOverride', {
      width: w, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await S('Page.navigate', { url: BASE + route });
    for (let i = 0; i < 200; i++) {
      const r = await S('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
      if (r.result.value === 'complete') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    await new Promise((r) => setTimeout(r, SETTLE));

    const res = await S('Runtime.evaluate', { expression: PROBE, returnByValue: true });
    if (res.exceptionDetails) {
      rows.push({ route, w, error: res.exceptionDetails.exception?.description || 'probe failed' });
      continue;
    }
    rows.push({ route, w, ...res.result.value });
    const o = res.result.value;
    const flag = o.overflowBy > 1 ? 'OVERFLOW' : 'ok      ';
    console.log(`${flag} ${route} @${w}px  scrollW=${o.scrollWidth} clientW=${o.clientWidth} by=${o.overflowBy}`);
    if (o.overflowBy > 1) {
      for (const e of o.worst.slice(0, 6)) {
        console.log(`         right=${e.right} w=${e.width} ${e.tag}.${e.cls} "${e.text}"`);
      }
    }
  }

  if (OUT) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(String(OUT), JSON.stringify(rows, null, 2));
    console.log(`\nwrote ${OUT}`);
  }
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
