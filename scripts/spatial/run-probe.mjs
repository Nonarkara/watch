/**
 * The MSH probe, run against a page, with no baseline and no waiver.
 *
 * The gate compares a measurement with a recorded receipt and tells you what
 * CHANGED. The probe tells you what IS, every time, with nothing to excuse
 * it: the chrome's share of the first screen, the interactive boxes far
 * bigger than their label, the rows widened to share a track, the text
 * somebody is standing on top of, and whether the page scrolls sideways.
 *
 *   node scripts/spatial/run-probe.mjs --base http://127.0.0.1:4399 --route /
 *
 * The probe itself is scripts/spatial/msh-probe.js, which returns plain
 * numbers. Deciding what they mean is the reviewer's job — that is the
 * point of it.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROBE = readFileSync(join(HERE, 'msh-probe.js'), 'utf8');

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf('--' + n);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const BASE = String(arg('base', 'http://127.0.0.1:4399')).replace(/\/$/, '');
const ROUTE = String(arg('route', '/'));
const WIDTH = Number(arg('width', 1440));
const HEIGHT = Number(arg('height', 900));
const SETTLE = Number(arg('settle', 1200));

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

const profile = mkdtempSync(join(tmpdir(), 'msh-probe-'));
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

let stderr = '';
chrome.stderr.on('data', (d) => { stderr += d.toString(); });

async function devtoolsUrl() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('chrome devtools never came up. stderr:\n' + stderr.slice(-1200));
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
  const ws = new WebSocket(await devtoolsUrl());
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
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

  const res = await S('Runtime.evaluate', { expression: PROBE, returnByValue: true, awaitPromise: true });
  const out = res.exceptionDetails
    ? { error: res.exceptionDetails.exception?.description || 'exception' }
    : res.result.value;
  console.log(JSON.stringify(out, null, 2));
  if (out && out.sideways) {
    console.error('\nFAIL — the page scrolls sideways.');
    process.exitCode = 1;
  }
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* already gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
