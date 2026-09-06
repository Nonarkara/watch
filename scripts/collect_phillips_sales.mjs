#!/usr/bin/env node
// Phillips watch results -> a review queue. Discovery and parsing are automated;
// promotion into a valuation card is always a separate human decision.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchText, isDryRun, recordFetch } from './lib/fetch.mjs';
import {
  classifyLot, discoverPhillipsAuctionCodes, existingCompKeys, loadCardIndex,
  normalizeBrand, parsePhillipsAuctionPage, parsePhillipsDetailPage, sha256,
  summarizeRecords,
} from './lib/market-harvest.mjs';
import { writePublicMarketIntake } from './lib/market-intake.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISCOVERY_URL = 'https://www.phillips.com/features/watches';
const OUT_DIR = join(ROOT, 'data/market');
const QUEUE_FILE = join(OUT_DIR, 'review-queue.json');
const MANIFEST_FILE = join(OUT_DIR, 'harvest-manifest.json');
const PUBLIC_FILE = join(ROOT, 'public/data/market-intake.json');
const SNAPSHOT_ROOT = join(ROOT, 'data/.harvest/phillips');
const TODAY = new Date().toISOString().slice(0, 10);
const SOURCE_KEY = 'phillips-watch-results';

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

const requestedCodes = process.argv.filter((arg) => arg.startsWith('--auction='))
  .map((arg) => arg.slice('--auction='.length).toUpperCase());
const maxAuctions = Number(argValue('max-auctions', '12'));
const maxDetails = Number(argValue('max-details', '60'));
const brandFilter = argValue('brand');
const dryRun = isDryRun();
const refresh = process.argv.includes('--refresh');

if (!Number.isInteger(maxAuctions) || maxAuctions < 1 || maxAuctions > 50) {
  throw new Error('--max-auctions must be an integer from 1 to 50');
}
if (!Number.isInteger(maxDetails) || maxDetails < 0 || maxDetails > 300) {
  throw new Error('--max-details must be an integer from 0 to 300');
}

const fetchOpts = {
  maxRetries: 3,
  baseDelayMs: 1200,
  rateLimitMs: 350,
  timeoutMs: 45_000,
  userAgent: 'TimePopResearchBot/1.0 (+https://watch-1de.pages.dev; public auction evidence)',
  onRetry: (reason, attempt, delay) => console.warn(`[phillips] retry ${attempt + 1}: ${reason} (${delay}ms)`),
};

function snapshot(kind, key, html) {
  const digest = sha256(html);
  const dir = join(SNAPSHOT_ROOT, TODAY);
  const file = join(dir, `${kind}-${key}-${digest.slice(0, 12)}.html.gz`);
  if (!dryRun && !existsSync(file)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, gzipSync(html, { level: 9 }));
  }
  return { sha256: digest, path: relative(ROOT, file) };
}

async function getText(url, kind, key) {
  const started = Date.now();
  const { text, error } = await fetchText(url, fetchOpts);
  if (error) return { text: null, error: error.message, elapsed_ms: Date.now() - started };
  const raw = snapshot(kind, key, text);
  return { text, raw, error: null, elapsed_ms: Date.now() - started };
}

const cardIndex = loadCardIndex(ROOT);
const compKeys = existingCompKeys(cardIndex);
let previous = null;
if (existsSync(QUEUE_FILE)) {
  try { previous = JSON.parse(readFileSync(QUEUE_FILE, 'utf8')); } catch { /* a broken prior queue should not poison new evidence */ }
}
const previousById = new Map((previous?.records ?? []).map((record) => [record.source_id, record]));
const run = {
  schema_version: 1,
  run_id: `phillips-${new Date().toISOString().replace(/[:.]/g, '-')}`,
  started_at: new Date().toISOString(),
  source: 'Phillips public watch auction results',
  source_url: DISCOVERY_URL,
  policy: 'Discovery is automatic. Only exact-reference, realized USD sales can reach ready_for_review. Promotion remains a separate human decision.',
  options: { max_auctions: maxAuctions, max_details: maxDetails, brand: brandFilter ?? null, dry_run: dryRun, refresh },
  requests: [],
  auctions: [],
  failures: [],
};

let codes = requestedCodes;
if (!codes.length) {
  console.log('[phillips] discovering current watch auction pages');
  const discovery = await getText(DISCOVERY_URL, 'discovery', 'watches');
  run.requests.push({ url: DISCOVERY_URL, ...discovery.raw, elapsed_ms: discovery.elapsed_ms, error: discovery.error });
  if (discovery.error) throw new Error(`discovery failed: ${discovery.error}`);
  codes = discoverPhillipsAuctionCodes(discovery.text).slice(0, maxAuctions);
}
codes = [...new Set(codes)].slice(0, maxAuctions);
console.log(`[phillips] checking ${codes.length} auction pages`);

const parsedLots = [];
for (const code of codes) {
  const url = `https://www.phillips.com/auctions/auction/${code}`;
  const fetched = await getText(url, 'auction', code);
  run.requests.push({ url, ...fetched.raw, elapsed_ms: fetched.elapsed_ms, error: fetched.error });
  if (fetched.error) {
    run.failures.push({ stage: 'auction', code, url, error: fetched.error });
    console.warn(`[phillips] ${code}: ${fetched.error}`);
    continue;
  }
  const parsed = parsePhillipsAuctionPage(fetched.text, url);
  const completed = parsed.auction.start_date && parsed.auction.start_date <= TODAY;
  const hasResults = parsed.lots.some((lot) => lot.realized);
  run.auctions.push({ ...parsed.auction, raw: fetched.raw, lots: parsed.lots.length, completed, has_results: hasResults });
  console.log(`[phillips] ${code}: ${parsed.lots.length} lots, ${parsed.lots.filter((lot) => lot.realized).length} realized`);
  if (completed && hasResults) parsedLots.push(...parsed.lots);
}

if (!parsedLots.length) {
  recordFetch(SOURCE_KEY, { last_status: 'no_data', auctions_checked: codes.length });
  throw new Error('no completed auction results parsed; committed queue was not touched');
}

const details = new Map((previous?.records ?? [])
  .filter((record) => record.detail)
  .map((record) => [record.source_id, record.detail]));
const eligibleForDetail = parsedLots.filter((lot) => {
  if (!lot.realized || lot.currency !== 'USD' || !lot.reference_key) return false;
  if (brandFilter && normalizeBrand(lot.brand) !== normalizeBrand(brandFilter)) return false;
  if (!refresh && details.has(lot.source_id)) return false;
  return cardIndex.byIdentity.has(`${normalizeBrand(lot.brand)}|${lot.reference_key}`);
}).slice(0, maxDetails);

console.log(`[phillips] enriching ${eligibleForDetail.length} new or refreshed exact-reference USD matches`);
for (const [index, lot] of eligibleForDetail.entries()) {
  const key = lot.source_id.replace(':', '-');
  const fetched = await getText(lot.source_url, 'detail', key);
  run.requests.push({ url: lot.source_url, ...fetched.raw, elapsed_ms: fetched.elapsed_ms, error: fetched.error });
  if (fetched.error) {
    run.failures.push({ stage: 'detail', source_id: lot.source_id, url: lot.source_url, error: fetched.error });
    continue;
  }
  details.set(lot.source_id, parsePhillipsDetailPage(fetched.text));
  if ((index + 1) % 10 === 0 || index + 1 === eligibleForDetail.length) {
    console.log(`[phillips] detail ${index + 1}/${eligibleForDetail.length}`);
  }
}

run.finished_at = new Date().toISOString();
let observedRecords = parsedLots.map((lot) => {
  const prior = previousById.get(lot.source_id);
  const record = classifyLot(lot, cardIndex, compKeys, details.get(lot.source_id) ?? null);
  return {
    ...record,
    first_seen_at: prior?.first_seen_at ?? previous?.generated_at ?? run.finished_at,
    last_seen_at: run.finished_at,
    observed_this_run: true,
    ...(prior?.review ? { review: prior.review } : {}),
  };
});
if (brandFilter) observedRecords = observedRecords.filter((record) => normalizeBrand(record.brand) === normalizeBrand(brandFilter));
const observedIds = new Set(observedRecords.map((record) => record.source_id));
const retainedRecords = (previous?.records ?? [])
  .filter((record) => !observedIds.has(record.source_id))
  .map((prior) => ({
    ...classifyLot(prior, cardIndex, compKeys, prior.detail ?? null),
    first_seen_at: prior.first_seen_at ?? previous.generated_at,
    last_seen_at: prior.last_seen_at ?? previous.generated_at,
    observed_this_run: false,
    ...(prior.review ? { review: prior.review } : {}),
  }));
const records = [...observedRecords, ...retainedRecords];
records.sort((a, b) => `${b.sale_date ?? ''}|${a.brand ?? ''}|${a.reference ?? ''}`.localeCompare(`${a.sale_date ?? ''}|${b.brand ?? ''}|${b.reference ?? ''}`));

const summary = {
  ...summarizeRecords(records),
  observed_this_run: observedRecords.length,
  retained_history: retainedRecords.length,
};
run.duration_ms = new Date(run.finished_at) - new Date(run.started_at);
run.summary = summary;
run.observed_summary = summarizeRecords(observedRecords);

const queue = {
  schema_version: 1,
  generated_at: run.finished_at,
  source: 'Phillips public watch auction results',
  source_url: DISCOVERY_URL,
  limitation: 'This is an intake queue, not published market evidence. Exact reference is necessary but not sufficient: a person must still check material, dial, condition, provenance, and whether the lot is an ordinary example.',
  summary,
  records,
};

console.log(`[phillips] ${summary.harvested} harvested · ${summary.ready_for_review} ready · ${summary.quarantined} quarantined · ${summary.duplicate} duplicate · ${run.failures.length} request failures`);
if (dryRun) {
  console.log('[phillips] dry run: queue, manifest, and snapshots not written');
  recordFetch(SOURCE_KEY, { last_status: 'dry_run', ...summary, failures: run.failures.length });
  process.exit(run.failures.length ? 1 : 0);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + '\n');
writeFileSync(MANIFEST_FILE, JSON.stringify(run, null, 2) + '\n');
writePublicMarketIntake(queue, PUBLIC_FILE);
recordFetch(SOURCE_KEY, { last_status: run.failures.length ? 'partial' : 'ok', ...summary, failures: run.failures.length });
console.log('[phillips] ✓ retained review queue + manifest + public evidence waiting room');
