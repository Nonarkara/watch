#!/usr/bin/env node
/**
 * Data layer health report. Run: node scripts/data-status.mjs  (or `npm run data:status`)
 *
 * Single-screen check of:
 *   - Source freshness (last fetch date for each collector source)
 *   - Source reachability (HEAD request, fail-loud if a URL is gone)
 *   - Shared snapshot counts vs expected
 *   - Cards validation status
 *   - Audit-script health (image, comp, provenance coverage)
 *
 * Designed to be the first thing you run when something looks off. The
 * opposite of "I think it broke somewhere — let me dig."
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fetchWithRetry, lastFetched } from './lib/fetch.mjs';

const ROOT = new URL('..', import.meta.url).pathname;

const lines = [];
const log = (s = '') => lines.push(s);
const ok = (s) => `  ✓ ${s}`;
const warn = (s) => `  ! ${s}`;
const fail = (s) => `  ✗ ${s}`;

const SOURCES = [
  {
    key: 'watch-id-rolex',
    label: 'Watch-ID Rolex index',
    url: 'https://www.watch-id.com/brands/rolex',
    expected: { min: 25, label: 'sightings' },
    file: 'data/shared/watch_id_rolex.json',
    field: 'count',
  },
  {
    key: 'fred-cpiau-csl',
    label: 'FRED CPI (CPIAUCSL)',
    url: 'https://fred.stlouisfed.org/series/CPIAUCSL',
    expected: { min: 100, label: 'months' },
    file: 'data/shared/cpi_snapshot.json',
    field: 'observations',
  },
  {
    key: 'rolex-catalog-tsv',
    label: 'Rolex catalog TSV (input)',
    url: null, // local file, no URL
    expected: { min: 80, label: 'rows' },
    file: 'data/imports/rolex_watchpages_2026-07-31.tsv',
    field: null,
  },
];

const SECTION = (s) => {
  log('');
  log('─'.repeat(78));
  log(s);
  log('─'.repeat(78));
};

log('');
log('TIME POP — DATA STATUS');
log('A single-screen check of the data layer. If something looks off, run this first.');

SECTION('SOURCE FRESHNESS');

for (const src of SOURCES) {
  const state = lastFetched(src.key);
  const fileExists = existsSync(join(ROOT, src.file));
  if (!fileExists) {
    log(`${src.label}:`);
    log(fail(`file missing: ${src.file}`));
    continue;
  }
  const fileMtime = statSync(join(ROOT, src.file)).mtime.toISOString();
  log(`${src.label}:`);
  log(ok(`${src.file} present (mtime ${fileMtime})`));
  if (state?.last_attempt) {
    const days = Math.round((Date.now() - new Date(state.last_attempt).getTime()) / 86400000);
    const ageStr = days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
    log(ok(`last fetched: ${state.last_attempt.slice(0, 10)} (${ageStr})`));
    if (state.last_status) log(ok(`last status: ${state.last_status}`));
  } else {
    log(warn(`no fetch state recorded — first run?`));
  }
  // Quick stat read — JSON files only; TSV/CSV count rows.
  try {
    if (src.file.endsWith('.json')) {
      const data = JSON.parse(readFileSync(join(ROOT, src.file), 'utf8'));
      // Resolve `field` to a number. If the field holds an object/array, count its
      // entries; if it holds a number, use it directly.
      let n = null;
      if (src.field) {
        const v = data[src.field];
        if (typeof v === 'number') n = v;
        else if (v && typeof v === 'object') n = Object.keys(v).length;
      }
      if (n != null) {
        if (n < src.expected.min) {
          log(warn(`count: ${n} ${src.expected.label} (expected >= ${src.expected.min})`));
        } else {
          log(ok(`count: ${n} ${src.expected.label}`));
        }
      }
    } else if (src.file.endsWith('.tsv') || src.file.endsWith('.csv')) {
      const text = readFileSync(join(ROOT, src.file), 'utf8');
      const n = text.trim().split(/\r?\n/).length - 1; // minus header
      if (n < src.expected.min) {
        log(warn(`rows: ${n} ${src.expected.label} (expected >= ${src.expected.min})`));
      } else {
        log(ok(`rows: ${n} ${src.expected.label}`));
      }
    }
  } catch (e) {
    log(fail(`failed to read: ${e.message}`));
  }
}

SECTION('SOURCE REACHABILITY (HEAD)');

const offline = process.argv.includes('--offline') || process.env.WATCH_OFFLINE === '1';
if (offline) {
  log(warn('skipped (--offline)'));
} else {
  for (const src of SOURCES) {
    if (!src.url) continue;
    process.stdout.write(`${src.label}... `);
    const { res, error } = await fetchWithRetry(src.url, { maxRetries: 1, baseDelayMs: 1000 });
    if (error) {
      console.log('FAILED');
      log(fail(`${src.url}: ${error.message}`));
    } else {
      console.log(`HTTP ${res.status}`);
      log(ok(`${src.url}: HTTP ${res.status}`));
    }
  }
}

SECTION('SHARED SNAPSHOTS');

const SHARED_FILES = [
  'data/shared/brand_production.json',
  'data/shared/brand_tiers.json',
  'data/shared/cpi_snapshot.json',
  'data/shared/images.json',
  'data/shared/rolex_catalog.json',
  'data/shared/screen_sightings.json',
  'data/shared/watch_id_rolex.json',
];

for (const f of SHARED_FILES) {
  const path = join(ROOT, f);
  if (!existsSync(path)) {
    log(fail(`missing: ${f}`));
    continue;
  }
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const n = Array.isArray(data) ? data.length : data.records?.length ?? data.sightings?.length ?? data.count ?? Object.keys(data).length;
    log(ok(`${f} (${n} entries)`));
  } catch (e) {
    log(fail(`${f}: ${e.message}`));
  }
}

SECTION('MARKET EVIDENCE INTAKE');

const marketQueuePath = join(ROOT, 'data/market/review-queue.json');
const marketManifestPath = join(ROOT, 'data/market/harvest-manifest.json');
if (!existsSync(marketQueuePath) || !existsSync(marketManifestPath)) {
  log(warn('no market review queue — run `npm run data:market:harvest`'));
} else {
  try {
    const queue = JSON.parse(readFileSync(marketQueuePath, 'utf8'));
    const manifest = JSON.parse(readFileSync(marketManifestPath, 'utf8'));
    const s = queue.summary || {};
    const ageDays = Math.floor((Date.now() - new Date(queue.generated_at).getTime()) / 86400000);
    log(ok(`${s.harvested ?? 0} harvested: ${s.ready_for_review ?? 0} ready, ${s.quarantined ?? 0} quarantined, ${s.duplicate ?? 0} duplicate, ${s.failed ?? 0} failed`));
    log(ok(`${manifest.auctions?.filter((a) => a.has_results).length ?? 0} completed auctions; ${manifest.failures?.length ?? 0} request failures; queue age ${ageDays}d`));
    log('  Rule: scraping discovers candidates; only one-record human promotion can edit a card.');
  } catch (e) {
    log(fail(`market intake unreadable: ${e.message}`));
  }
}

SECTION('CARDS VALIDATION');

try {
  const validate = (await import('./validate_card.mjs')).validateCard;
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(join(ROOT, 'data/cards')).filter((f) => f.endsWith('.json'));
  let failed = 0;
  for (const f of files) {
    const c = JSON.parse(readFileSync(join(ROOT, 'data/cards/' + f), 'utf8'));
    const errs = validate(c, { id: f.replace('.json', ''), buildDate: new Date().toISOString().slice(0, 10) });
    if (errs.length) {
      failed++;
      log(fail(`${f}: ${errs[0]}`));
    }
  }
  if (failed === 0) {
    log(ok(`${files.length} cards, all validate`));
  } else {
    log(fail(`${failed} of ${files.length} cards fail validation`));
  }
} catch (e) {
  log(fail(`validate_card import: ${e.message}`));
}

SECTION('AUDIT SUMMARY');

try {
  const { execSync } = await import('node:child_process');
  const out = execSync('node scripts/audit.mjs', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  // Pull just the headline: cards / image% / comps / provenance
  const m = out.match(/CARDS BRANDS\s+IMG %\s+COMPS\s+PROV\s+NARR\s+EXACT\s*\n(\d+)\s+(\d+)\s+([\d.]+%)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
  if (m) {
    log(ok(`${m[1]} cards, ${m[2]} brands, image ${m[3]}, comps ${m[4]}, provenance ${m[5]}, narrative ${m[6]}, exact ${m[7]}`));
  } else {
    log(ok('audit ran — see `npm run data:audit` for the full report'));
  }
} catch (e) {
  log(fail(`audit script failed: ${e.message}`));
}

console.log(lines.join('\n'));
