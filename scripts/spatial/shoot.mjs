/**
 * Screenshot a live route at a given width, for looking at with your own eyes.
 *
 * The numbers say a hole is 78px wide. They do not say whether the page looks
 * broken or merely airy. This takes the picture so the judgement can be made
 * on the page, not on a JSON blob.
 *
 *   node scripts/spatial/shoot.mjs --base http://localhost:4398 --route /pom/ \
 *     --width 1024 --out /tmp/pom-1024.png
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
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
const ROUTE = String(arg('route', '/'));
const WIDTH = Number(arg('width', 1024));
const HEIGHT = Number(arg('height', 1400));
const OUT = String(arg('out', '/tmp/shot.png'));
const SETTLE = Number(arg('settle', 1500));
const FULL = arg('full', false) === true || arg('full', 'false') === 'true';

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

const profile = mkdtempSync(join(tmpdir(), 'shoot-'));
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
  await S('Page.navigate', { url: BASE + ROUTE });
  for (let i = 0; i < 200; i++) {
    const r = await S('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (r.result.value === 'complete') break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, SETTLE));

  // Pin the theme on the element itself: the site reads prefers-color-scheme
  // AND a saved data-theme, and headless Chrome inherits the machine's
  // setting, so a screenshot is only reproducible if the theme is stated.
  const THEME = arg('theme', null);
  if (THEME) {
    await S('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', ${JSON.stringify(String(THEME))})`,
    });
    await new Promise((r) => setTimeout(r, 250));
  }

  const SCROLL = arg('scroll', null);
  if (SCROLL) {
    await S('Runtime.evaluate', {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(String(SCROLL))});
        if (el) el.scrollIntoView({ block: ${JSON.stringify(String(arg('block', 'start')))} }); })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
  }

  // Hiding the page's own content is how a background layer is looked at on
  // its own terms: the same pixels, with the work taken out of the way.
  const HIDE = arg('hide', null);
  if (HIDE) {
    await S('Runtime.evaluate', {
      expression: `(() => { for (const s of ${JSON.stringify(String(HIDE)).split(',').map((x) => x.trim()).filter(Boolean)}) {
        for (const el of document.querySelectorAll(s)) el.style.visibility = 'hidden'; } })()`,
    });
    await new Promise((r) => setTimeout(r, 300));
  }

  const shot = await S('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: FULL,
  });
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log(`wrote ${OUT} (${ROUTE} @${WIDTH}px${FULL ? ' full-page' : ''})`);
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
