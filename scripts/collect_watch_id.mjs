// Watch-ID Rolex → data/shared/watch_id_rolex.json. Run: node scripts/collect_watch_id.mjs
//
// Refactored to use the shared fetch utility (retry + backoff + mtime tracking)
// and to honour --dry-run. Page fetches are batched with rateLimitMs so the
// collector respects the source's tolerance.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fetchText, recordFetch, isDryRun } from './lib/fetch.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = 'https://www.watch-id.com';
const INDEX_PAGES = ['/brands/rolex', '/brands/rolex?page=1'];
const SOURCE_KEY = 'watch-id-rolex';

// Reference-level matches only. Family-only sightings stay useful editorial facts but
// never alter a particular card's attention calculation.
const CARD_MATCHES = {
  '/rolex-milgauss-patrick-schwarzenegger-the-white-lotus-season-3': ['rolex-116400gv'],
  '/rolex-gmt-master-ii-sterling-k-brown-paradise': ['rolex-126710blro-pepsi'],
  '/sightings/rolex-oyster-perpetual-milgauss-jeff-daniels-man-full': ['rolex-116400gv'],
  '/sightings/rolex-submariner-titus-welliver-bosch': ['rolex-116610ln'],
  '/sightings/rolex-explorer-1016-jennifer-connelly-top-gun-maverick': ['rolex-1016'],
  '/sightings/rolex-gmt-master-james-spader-blacklist': ['rolex-16710'],
  '/sightings/rolex-oyster-perpetual-39-adam-driver-marriage-story': ['rolex-114300'],
  '/sightings/rolex-oyster-perpetual-day-date-john-travolta-speed-kills': ['rolex-228238'],
  '/sightings/rolex-submariner-date-kiefer-sutherland-24': ['rolex-16610'],
};

const TENTATIVE_PATHS = new Set([
  '/rolex-milgauss-patrick-schwarzenegger-the-white-lotus-season-3',
  '/rolex-gmt-master-ii-sterling-k-brown-paradise',
  '/sightings/rolex-submariner-titus-welliver-bosch',
  '/sightings/rolex-submariner-date-two-tone-josh-lucas-black-demon',
  '/sightings/rolex-submariner-florence-pugh-good-person',
  '/sightings/rolex-oyster-perpetual-39-adam-driver-marriage-story',
  '/sightings/rolex-oyster-perpetual-day-date-john-travolta-speed-kills',
  '/sightings/rolex-sea-dweller-dwayne-johnson-baywatch',
]);

const clean = (s = '') => s
  .replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
  .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const log = (...args) => console.log('[watch-id]', ...args);

// Rate limit: 800ms between sequential calls. Watch-ID is a small server.
const fetchOpts = { maxRetries: 3, baseDelayMs: 1500, rateLimitMs: 800,
  onRetry: (reason, attempt, delay) => log(`retry ${attempt + 1} after ${reason} (${delay}ms)`) };

// Index: pull all listing links across the brand index pages.
const links = [];
for (const page of INDEX_PAGES) {
  const { text, error } = await fetchText(BASE + page, fetchOpts);
  if (error) { log(`index fetch failed: ${error.message}`); continue; }
  for (const match of text.matchAll(/href="([^"]+)"[^>]*>(Rolex[^<]+)</g)) {
    if (!match[1].startsWith('/brands/')) links.push({ path: match[1], title: clean(match[2]) });
  }
}
const unique = [...new Map(links.map((item) => [item.path, item])).values()];
log(`index: ${unique.length} unique listing links`);

const sightings = [];

for (let offset = 0; offset < unique.length; offset += 5) {
  const batch = await Promise.all(unique.slice(offset, offset + 5).map(async (item) => {
    const { text: html, error } = await fetchText(BASE + item.path, fetchOpts);
    if (error) {
      log(`page fetch failed for ${item.path}: ${error.message}`);
      return null;
    }
    const description = clean(html.match(/<meta name="description" content="([^"]*)"/)?.[1]);
    const bodyStart = html.indexOf('<div class="sighting-page-body">');
    const bodyEnd = html.indexOf('</article>', bodyStart);
    const articleBody = bodyStart >= 0 ? clean(html.slice(bodyStart, bodyEnd > bodyStart ? bodyEnd : undefined)) : description;
    const media_type = html.includes('href="/movies/') ? 'film'
      : html.includes('href="/series/') ? 'television' : 'other';
    const release_year = Number(description.match(/\b(19|20)\d{2}\b/)?.[0]) || null;
    const watch = item.title.split(' - ')[0].replace(/^Rolex\s+/, '');
    const matched_card_ids = CARD_MATCHES[item.path] ?? [];
    const tentative = TENTATIVE_PATHS.has(item.path) ||
      /looks like|possible candidate|probably the model|not 100% sure|could be the/i.test(`${description} ${articleBody}`);
    return {
      id: item.path.split('/').filter(Boolean).at(-1),
      brand: 'Rolex',
      watch,
      title: item.title,
      description,
      media_type,
      release_year,
      identification: tentative ? 'tentative' : 'reported',
      match_level: matched_card_ids.length ? 'exact_reference' : 'family_only',
      matched_card_ids,
      source_url: BASE + item.path,
    };
  }));
  sightings.push(...batch.filter(Boolean));
  log(`  batch ${Math.floor(offset / 5) + 1}/${Math.ceil(unique.length / 5)} done (${sightings.length} sightings)`);
}

if (!sightings.length) {
  log('no sightings fetched — refusing to overwrite the committed file');
  recordFetch(SOURCE_KEY, { last_status: 'no_data' });
  process.exit(1);
}

// Preserve any human-curated fields from the existing file. The scrape only knows
// what Watch-ID publishes; curated additions (in-scene stills, longer copy,
// editorial cross-checks) belong in the file too and must survive a re-run.
// The merge is field-level: a field present in the old file but absent from the
// new scrape is kept. A field present in both is overwritten by the scrape.
const existingFile = join(ROOT, 'data/shared/watch_id_rolex.json');
if (existsSync(existingFile)) {
  let existing = null;
  try { existing = JSON.parse(readFileSync(existingFile, 'utf8')); } catch {}
  if (existing?.sightings?.length) {
    const byId = new Map(existing.sightings.map((s) => [s.id, s]));
    for (const s of sightings) {
      const prev = byId.get(s.id);
      if (!prev) continue;
      for (const key of Object.keys(prev)) {
        // Fields the scrape always produces — let the scrape win.
        if (['description', 'media_type', 'release_year', 'identification',
             'match_level', 'matched_card_ids', 'source_url', 'title',
             'watch', 'brand', 'id'].includes(key)) continue;
        // Anything else (media, editorial_url, longer descriptions) is
        // curated; preserve it.
        if (!(key in s)) s[key] = prev[key];
      }
    }
    log(`preserved curated fields from existing file (${existing.sightings.length} entries)`);
  }
}

// Watch-ID is a live source — the index page can grow or shrink without notice. Warn on
// change but do not throw, so a re-harvest after the source adds a new entry does not break
// the build. The audit script can flag drift between runs.
if (sightings.length !== 31) log(`! Watch-ID returned ${sightings.length} sightings (was 31 on 2026-07-31); audit will flag this`);

// Compare to previous file and report flips in `identification` so re-runs are visible.
if (existsSync(existingFile)) {
  let prev = null;
  try { prev = JSON.parse(readFileSync(existingFile, 'utf8')); } catch {}
  if (prev?.sightings) {
    const prevById = new Map(prev.sightings.map((s) => [s.id, s]));
    let flips = 0;
    for (const s of sightings) {
      const p = prevById.get(s.id);
      if (p && p.identification && p.identification !== s.identification) flips++;
    }
    if (flips) log(`! ${flips} sighting(s) flipped identification (reported ↔ tentative) — review before commit`);
  }
}
const output = {
  collected: new Date().toISOString().slice(0, 10),
  source_url: `${BASE}/brands/rolex`,
  count: sightings.length,
  screen_count: sightings.filter((s) => s.media_type !== 'other').length,
  limitation: 'Watch-ID is a specialist identification source. Family-only and tentative identifications are displayed as such and never scored at reference level.',
  sightings,
};
const outFile = existingFile;

if (isDryRun()) {
  log(`[dry-run] would write ${sightings.length} sightings (${output.screen_count} film/TV)`);
  recordFetch(SOURCE_KEY, { last_status: 'dry_run', count: sightings.length });
  process.exit(0);
}

writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n');
recordFetch(SOURCE_KEY, { last_status: 'ok', count: sightings.length, screen_count: output.screen_count });
log(`✓ ${sightings.length} sightings (${output.screen_count} film/TV) → data/shared/watch_id_rolex.json`);
