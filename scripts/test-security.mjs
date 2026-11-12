import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateCard } from './validate_card.mjs';
import { loadDataset } from '../src/lib/data.ts';

const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  const hash = createHash('sha256').update(script).digest('base64');
  assert(headers.includes(`'sha256-${hash}'`), 'bootstrap script must be authorized by exact content hash');
}
assert.match(headers, /object-src 'none'/);
assert.match(headers, /frame-ancestors 'none'/);
const scriptPolicy = headers.match(/script-src ([^;]+)/)[1];
assert(!scriptPolicy.includes('unsafe-inline') && !scriptPolicy.includes('unsafe-eval'));

// HSTS must be present: the domain 301s to HTTPS, but without HSTS a returning
// visitor can be downgraded on the first hop of an unsecured network.
assert.match(headers, /Strict-Transport-Security:\s*max-age=\d{5,}/,
  'HSTS missing from _headers — returning visitors get no TLS pinning');

// No window.opener link to a cross-origin page: this site opens none, and a
// compromised linked origin must not be able to reach back into it.
assert.match(headers, /Cross-Origin-Opener-Policy:\s*same-origin/, 'COOP same-origin missing from _headers');

// CI supply chain: every third-party Action is pinned to a full commit SHA (a
// tag can be moved by whoever controls it), and no workflow interpolates
// attacker-influenced event text into a shell step.
import { readdirSync } from 'node:fs';
const wfDir = new URL('../.github/workflows/', import.meta.url);
for (const f of readdirSync(wfDir).filter((n) => n.endsWith('.yml'))) {
  const src = readFileSync(new URL(f, wfDir), 'utf8');
  for (const m of src.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)) {
    assert.match(m[1], /@[0-9a-f]{40}$/, `${f}: Action ${m[1]} must be pinned to a 40-hex commit SHA, not a tag`);
  }
  assert(!/\$\{\{\s*github\.(event|head_ref)/.test(src), `${f}: github.event/head_ref text must not be interpolated into a workflow`);
}

// The canonical tracker (index.html imports it from nonarkara.org on load)
// POSTs to Google Apps Script and geo-enriches via ipapi.co. If connect-src
// does not allow those two origins the import succeeds and every ping fails
// silently — which is exactly what shipped for months. Keep the CSP and the
// tracker's actual endpoints in one contract.
const connectPolicy = headers.match(/connect-src ([^;]+)/)[1];
for (const origin of ['https://script.google.com', 'https://ipapi.co', 'https://nonarkara.org']) {
  assert(connectPolicy.includes(origin),
    `connect-src must allow ${origin} — the canonical visitor tracker pings it and the failure is silent`);
}

const fixture = JSON.parse(readFileSync(new URL('./fixtures/test-card.json', import.meta.url), 'utf8'));
fixture.market_evidence.comps[0].url = 'https://user:password@example.com/lot';
fixture.market_evidence.comps[1].price_usd = Infinity;
fixture.retail.msrp_history[0].source_url = 'javascript:void(0)';
const errors = validateCard(fixture);
assert(errors.some((e) => e.includes('comps[0].url')));
assert(errors.some((e) => e.includes('finite')));
assert(errors.some((e) => e.includes('msrp_history[0].source_url')));

const originalFetch = globalThis.fetch;
const dataset = JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8'));
const screen = JSON.parse(readFileSync(new URL('../public/data/screen_sightings.json', import.meta.url), 'utf8'));
const harvested = JSON.parse(readFileSync(new URL('../data/shared/watch_id_rolex.json', import.meta.url), 'utf8'));
assert.equal(screen.collected, harvested.collected, 'a rebuild must preserve source collection age');
let requests = 0;
try {
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify(requests === 1 ? { cards: [], count: 302 } : dataset));
  };
  await assert.rejects(loadDataset(), /Invalid dataset structure/);
  assert.equal((await loadDataset()).count, dataset.count, 'invalid response must not permanently poison the retry cache');
  assert.equal(requests, 2);
} finally { globalThis.fetch = originalFetch; }
console.log('✓ CSP hashes, HSTS, tracker endpoints, unsafe source rejection, and dataset retry boundary');
