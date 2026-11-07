/**
 * A tiny CDP client for measuring layout geometry in a real browser.
 *
 * The spatial-law probe does the sweeping and the judging. This does the
 * one-off questions the sweep raises: "exactly how tall is that row, and
 * where does the copy actually sit inside it?"
 *
 * Uses Node's built-in WebSocket and the Chrome DevTools Protocol directly, so
 * it adds no dependency to the project. Chrome is launched headless with a
 * throwaway profile; the browser is always killed in a finally block.
 *
 *   node scripts/spatial/measure.mjs --url <url> --width 768 --sel ".a,.b"
 *   node scripts/spatial/measure.mjs --url <url> --width 768 --expr "document.title"
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf('--' + n);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const URL_ = arg('url', 'http://127.0.0.1:4322/');
const WIDTH = Number(arg('width', 768));
const HEIGHT = Number(arg('height', 900));
const SELS = arg('sel', null);
const EXPR = arg('expr', null);
const SETTLE = Number(arg('settle', 1200));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    try {
      if (require('node:fs').existsSync(c)) return c;
    } catch { /* fall through */ }
  }
  throw new Error('no Chrome found; set CHROME_PATH');
}

// existsSync without require (this is ESM)
import { existsSync } from 'node:fs';
function chromePath() {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error('no Chrome found; set CHROME_PATH');
}

const profile = mkdtempSync(join(tmpdir(), 'measure-'));
const port = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(chromePath(), [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  `--window-size=${WIDTH},${HEIGHT}`,
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
  await S('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
  });

  await S('Page.navigate', { url: URL_ });
  // wait for load
  for (let i = 0; i < 200; i++) {
    const r = await S('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (r.result.value === 'complete') break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, SETTLE));

  const expr = EXPR ? String(EXPR) : `(() => {
    const sels = ${JSON.stringify(String(SELS || '')).replace(/"/g, '"')};
    const list = sels ? sels.split(',').map(s => s.trim()).filter(Boolean) : [];
    const out = [];
    for (const sel of list) {
      document.querySelectorAll(sel).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        out.push({
          sel, i,
          tag: el.tagName.toLowerCase(),
          cls: el.className && typeof el.className === 'string' ? el.className : '',
          x: +r.x.toFixed(1), y: +r.y.toFixed(1),
          w: +r.width.toFixed(1), h: +r.height.toFixed(1),
          bottom: +r.bottom.toFixed(1), right: +r.right.toFixed(1),
          display: cs.display, alignSelf: cs.alignSelf,
          margin: cs.margin, padding: cs.padding,
          gridRow: cs.gridRow, gridColumn: cs.gridColumn,
          text: (el.textContent || '').trim().slice(0, 70),
        });
      });
    }
    const de = document.documentElement;
    return { url: location.href, scrollHeight: de.scrollHeight, viewport: { w: innerWidth, h: innerHeight }, els: out };
  })()`;

  const res = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    console.error('PAGE ERROR:', JSON.stringify(res.exceptionDetails.exception?.description || res.exceptionDetails));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(res.result.value, null, 2));
  }
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
