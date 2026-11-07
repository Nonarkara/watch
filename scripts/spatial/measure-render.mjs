/**
 * How long does a reader wait for the page to actually appear?
 *
 * The spatial-law probe settles on a stable geometry. This app's loading
 * placeholder is itself a stable geometry, so if the data has not landed
 * inside the probe's settle window the probe measures the PLACEHOLDER and
 * reports nothing. That is not a probe bug: it is the app being slow.
 *
 *   node scripts/spatial/measure.mjs --url <url> --expr "<expr>"
 */
const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf('--' + n);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const URL_ = arg('url', 'https://watch.nonarkara.org/');
const EXPR = String(arg('expr', '1'));

const { spawn } = await import('node:child_process');
const { mkdtempSync, rmSync, existsSync } = await import('node:fs');
const { tmpdir } = await import('node:os');
const { join } = await import('node:path');

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
].filter(Boolean).find((c) => existsSync(c));
if (!CHROME) throw new Error('no Chrome found');

const profile = mkdtempSync(join(tmpdir(), 'timing-'));
const port = 9500 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--disable-background-networking', '--hide-scrollbars', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

async function devtools() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('no devtools');
}

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
    setTimeout(() => { if (pend.has(mid)) { pend.delete(mid); reject(new Error('timeout ' + method)); } }, 60000);
  });
}

try {
  const ws = new WebSocket(await devtools());
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const send = cdp(ws);
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Page.enable');
  await S('Runtime.enable');
  await S('Network.enable');

  const t0 = Date.now();
  const events = [];
  S('Network.responseReceived', { requestId: 'x' }).catch(() => {});
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Network.responseReceived') {
      const r = m.params.response;
      events.push({ ms: Date.now() - t0, url: r.url.replace(/^https?:\/\/[^/]+/, ''), status: r.status, type: m.params.type });
    }
  });

  await S('Page.navigate', { url: URL_ });

  // Poll the page until the real content is there, and report when.
  let contentAt = null, h1At = null, done = false;
  for (let i = 0; i < 600 && !done; i++) {
    const r = await S('Runtime.evaluate', {
      expression: `(() => ({
        h1: !!document.querySelector('main h1'),
        boot: !!document.querySelector('.boot'),
        mainChildren: document.querySelector('main') ? document.querySelector('main').children.length : 0,
        sh: document.documentElement.scrollHeight
      }))()`, returnByValue: true,
    });
    const v = r.result.value || {};
    if (v.h1 && h1At == null) h1At = Date.now() - t0;
    if (!v.boot && v.mainChildren > 0 && v.sh > 2000 && contentAt == null) {
      contentAt = Date.now() - t0;
      done = true;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  const res = await S('Runtime.evaluate', { expression: EXPR, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify({
    url: URL_,
    ms_to_h1: h1At,
    ms_to_content: contentAt,
    final: res.result?.value,
    network: events.filter((e) => !e.url.startsWith('data:')).slice(0, 14),
  }, null, 2));
} finally {
  try { chrome.kill('SIGKILL'); } catch { /* gone */ }
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
