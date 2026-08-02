// Test the shared fetch utility. Network-bound — runs only when WATCH_TEST_NETWORK=1.
// Run: WATCH_TEST_NETWORK=1 node scripts/test-fetch.mjs
import assert from 'node:assert/strict';
import { fetchWithRetry, isDryRun, loadFetchState } from './lib/fetch.mjs';

if (!process.env.WATCH_TEST_NETWORK) {
  console.log('SKIP: network tests (set WATCH_TEST_NETWORK=1 to run)');
  process.exit(0);
}

// 1. isDryRun returns false by default, true when flag passed.
const prevArgv = process.argv;
process.argv = [...prevArgv, '--dry-run'];
assert.equal(isDryRun(), true, '--dry-run flag is detected');
process.argv = prevArgv;
process.env.WATCH_DRY_RUN = '1';
assert.equal(isDryRun(), true, 'WATCH_DRY_RUN env is detected');
delete process.env.WATCH_DRY_RUN;
assert.equal(isDryRun(), false, 'no flag = no dry-run');
console.log('✓ isDryRun()');

assert.equal(typeof loadFetchState(), 'object', 'loadFetchState returns object');
console.log('✓ loadFetchState()');

// 2. A real URL returns OK. Use a small endpoint that won't 429 us.
const { res, error } = await fetchWithRetry('https://example.com', { maxRetries: 1, baseDelayMs: 500 });
assert.equal(error, null, 'example.com fetch has no error');
assert.equal(res.status, 200, 'example.com returns 200');
console.log('✓ fetchWithRetry() against example.com');

console.log('\n✓ all fetch tests pass');
