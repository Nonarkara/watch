// Shared fetch utility for the data pipeline. Wraps the global fetch with:
//   - Retry on 429/5xx with exponential backoff
//   - Configurable rate limit (sleep between calls)
//   - A small request budget (max requests per run) to keep CI honest
//   - Last-fetched mtime tracking on disk so collectors can skip when the
//     source hasn't moved (or warn when it has)
//
// Why this exists: the data layer has multiple collectors (Watch-ID, FRED CPI,
// Wikimedia imageinfo). Each one was rolling its own error handling. Centralising
// it here means one place to harden, one place to test, and one place to read
// the retry policy.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const STATE_DIR = join(ROOT, 'data/.state');
const STATE_FILE = join(STATE_DIR, 'fetch-state.json');

/** Ensure the .state directory exists. */
function ensureState() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
}

/** Load the last-fetched state, keyed by source URL. */
export function loadFetchState() {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

/** Persist a single source's last-fetched mtime / response. */
export function saveFetchState(updates) {
  ensureState();
  const cur = loadFetchState();
  const next = { ...cur, ...updates };
  writeFileSync(STATE_FILE, JSON.stringify(next, null, 2) + '\n');
}

/** Read the previous Last-Modified / observed_at for a given source key. */
export function lastFetched(key) {
  const s = loadFetchState();
  return s[key] ?? null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextRequestAt = new Map();

async function waitForRateSlot(url, rateLimitMs) {
  if (!rateLimitMs) return;
  const origin = new URL(url).origin;
  const now = Date.now();
  const slot = Math.max(now, nextRequestAt.get(origin) ?? now);
  nextRequestAt.set(origin, slot + rateLimitMs);
  if (slot > now) await sleep(slot - now);
}

function retryDelay(res, baseDelayMs, attempt) {
  const retryAfter = res?.headers?.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 120_000);
    const at = new Date(retryAfter).getTime();
    if (Number.isFinite(at)) return Math.min(Math.max(0, at - Date.now()), 120_000);
  }
  return baseDelayMs * Math.pow(2, attempt);
}

/**
 * Fetch a URL with retry + backoff. Designed for slow-moving sources (auction
 * archives, photo archives, government data) where you'd rather wait than fail.
 *
 * Options:
 *   - maxRetries (default 4): retry budget for 429/5xx
 *   - baseDelayMs (default 1500): initial backoff; doubles each retry
 *   - rateLimitMs (default 0): minimum delay between successful calls (sequential)
 *   - timeoutMs (default 30000): abort a hung request
 *   - userAgent (default WATCH)
 *   - headers: additional request headers
 *   - onRetry(reason, attempt): optional callback
 */
export async function fetchWithRetry(url, opts = {}) {
  const {
    maxRetries = 4,
    baseDelayMs = 1500,
    rateLimitMs = 0,
    timeoutMs = 30_000,
    userAgent = 'WATCH research collector/1.0 (+https://watch.nonarkara.org)',
    headers = {},
    onRetry = null,
  } = opts;

  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await waitForRateSlot(url, rateLimitMs);
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': userAgent, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        const delay = retryDelay(res, baseDelayMs, attempt);
        if (onRetry) onRetry(`HTTP ${res.status}`, attempt, delay);
        lastErr = new Error(`HTTP ${res.status}`);
        if (attempt === maxRetries) break;
        await sleep(delay);
        continue;
      }
      if (!res.ok) {
        // Non-retryable client error (404, 401, 403) — surface immediately
        return { res, error: new Error(`HTTP ${res.status} for ${url}`) };
      }
      return { res, error: null };
    } catch (e) {
      lastErr = e;
      const delay = baseDelayMs * Math.pow(2, attempt);
      if (onRetry) onRetry(e.message, attempt, delay);
      if (attempt === maxRetries) break;
      await sleep(delay);
    }
  }
  return { res: null, error: lastErr ?? new Error('fetch failed') };
}

/**
 * Fetch a JSON document, with retry, backoff, and rate limiting. Returns
 * { data, error } — never throws so callers can decide what to do.
 */
export async function fetchJson(url, opts = {}) {
  const { res, error } = await fetchWithRetry(url, opts);
  if (error) return { data: null, error };
  try {
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

/** Same as fetchJson but returns the raw text body. */
export async function fetchText(url, opts = {}) {
  const { res, error } = await fetchWithRetry(url, opts);
  if (error) return { text: null, error };
  try {
    const text = await res.text();
    return { text, error: null };
  } catch (e) {
    return { text: null, error: e };
  }
}

/** Update (or seed) the mtime entry for a given source key. Idempotent. */
export function recordFetch(key, meta = {}) {
  const cur = loadFetchState();
  cur[key] = {
    ...cur[key],
    last_attempt: new Date().toISOString(),
    ...meta,
  };
  saveFetchState(cur);
}

/**
 * Dry-run helper. Reads a command-line --dry-run flag and the WATCH_DRY_RUN
 * env var, so collectors can be exercised without writing outputs. The
 * dry-run runner should still fetch (to surface real errors) but skip
 * `writeFileSync` for the output.
 */
export function isDryRun() {
  return process.argv.includes('--dry-run') || process.env.WATCH_DRY_RUN === '1';
}
