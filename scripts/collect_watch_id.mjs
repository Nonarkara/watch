import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = 'https://www.watch-id.com';
const INDEX_PAGES = ['/brands/rolex', '/brands/rolex?page=1'];

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

async function get(path) {
  const response = await fetch(BASE + path, { headers: { 'user-agent': 'WATCH research collector/1.0 (+https://watch.nonarkara.org)' } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

const links = [];
for (const page of INDEX_PAGES) {
  const html = await get(page);
  for (const match of html.matchAll(/href="([^"]+)"[^>]*>(Rolex[^<]+)</g)) {
    if (!match[1].startsWith('/brands/')) links.push({ path: match[1], title: clean(match[2]) });
  }
}
const unique = [...new Map(links.map((item) => [item.path, item])).values()];
const sightings = [];

for (let offset = 0; offset < unique.length; offset += 5) {
  const batch = await Promise.all(unique.slice(offset, offset + 5).map(async (item) => {
    const html = await get(item.path);
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
  sightings.push(...batch);
}

// Watch-ID is a live source — the index page can grow or shrink without notice. Warn on
// change but do not throw, so a re-harvest after the source adds a new entry does not break
// the build. The audit script can flag drift between runs.
if (sightings.length !== 31) console.warn(`! Watch-ID returned ${sightings.length} sightings (was 31 on 2026-07-31); audit will flag this`)
const output = {
  collected: new Date().toISOString().slice(0, 10),
  source_url: `${BASE}/brands/rolex`,
  count: sightings.length,
  screen_count: sightings.filter((s) => s.media_type !== 'other').length,
  limitation: 'Watch-ID is a specialist identification source. Family-only and tentative identifications are displayed as such and never scored at reference level.',
  sightings,
};
writeFileSync(join(ROOT, 'data/shared/watch_id_rolex.json'), JSON.stringify(output, null, 2) + '\n');
console.log(`✓ ${sightings.length} Rolex sightings (${output.screen_count} film/TV) → data/shared/watch_id_rolex.json`);
