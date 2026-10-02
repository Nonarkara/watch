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

const fixture = JSON.parse(readFileSync(new URL('./fixtures/test-card.json', import.meta.url), 'utf8'));
fixture.market_evidence.comps[0].url = 'https://user:password@example.com/lot';
fixture.market_evidence.comps[1].price_usd = Infinity;
const errors = validateCard(fixture);
assert(errors.some((e) => e.includes('comps[0].url')));
assert(errors.some((e) => e.includes('finite')));

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
console.log('✓ CSP hashes, unsafe source rejection, and dataset retry boundary');
