import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const bin = process.env.WATCH_BROWSER_BIN || 'agent-browser';
const base = process.env.WATCH_TEST_URL || 'http://127.0.0.1:4186';
const session = `watch-city-${process.pid}`;
function run(...args) {
  const r = JSON.parse(execFileSync(bin, ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 60000 }));
  assert(r.success, r.error);
  return r.data;
}
const evaluate = (code) => run('eval', code).result;
try {
  run('set', 'viewport', '390', '844');
  run('open', base);
  run('wait', 'canvas.city-layer[data-state="ready"]');
  // Observe new listener registrations over repeated city switches. The old
  // anonymous resize callback accumulated; a stable layer owns one callback.
  evaluate(`(() => {
    const add=window.addEventListener.bind(window), remove=window.removeEventListener.bind(window);
    window.__resizeObservers=new Set();
    window.addEventListener=(type,fn,options)=>{if(type==='resize')window.__resizeObservers.add(fn);return add(type,fn,options)};
    window.removeEventListener=(type,fn,options)=>{if(type==='resize')window.__resizeObservers.delete(fn);return remove(type,fn,options)};
  })()`);
  for (const slug of ['tokyo', 'london', 'bangkok', 'new-york', 'bangkok']) {
    run('click', '.city-toggle-btn');
    run('wait', '.city-toggle-menu');
    const names = { tokyo: 'Tokyo', london: 'London', bangkok: 'Bangkok', 'new-york': 'New York' };
    run('click', `[aria-label="Choose ${names[slug]}"]`);
    run('wait', `canvas.city-layer[data-city="${slug}"][data-state="ready"]`);
    assert.equal(evaluate('window.__resizeObservers.size'), 1, 'city changes must not accumulate resize listeners');
  }
  run('click', '.city-toggle-btn');
  run('press', 'Escape');
  assert.equal(evaluate("document.activeElement.className"), 'city-toggle-btn mono', 'Escape restores trigger focus');
  run('set', 'media', 'reduced-motion');
  assert(evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"));
  evaluate(`(() => {const proto=CanvasRenderingContext2D.prototype, clear=proto.clearRect;
    window.__cityClears=0;proto.clearRect=function(...args){window.__cityClears++;return clear.apply(this,args)};})()`);
  run('scroll', 'down', '600');
  run('wait', '200');
  assert.equal(evaluate('window.__cityClears'), 0, 'reduced motion must stay still when the page scrolls');
  run('network', 'route', '**/data/city/tokyo.json', '--body', '{"slug":"tokyo","buildings":[null]}');
  run('scroll', 'up', '10000');
  run('click', '.city-toggle-btn');
  run('wait', '.city-toggle-menu');
  run('click', '[aria-label="Choose Tokyo"]');
  run('wait', 'canvas.city-layer[data-city="tokyo"][data-state="unavailable"]');
  assert(evaluate("document.querySelector('main h1').textContent.length>0"), 'invalid city geometry must not break watch content');
  assert(evaluate("document.querySelector('.city-toggle-btn').textContent.includes('TOKYO')"));
  console.log('✓ city switching, stable listeners, keyboard recovery, reduced motion, invalid-model isolation');
} finally { run('close'); }
