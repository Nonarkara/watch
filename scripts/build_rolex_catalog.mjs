import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const input = join(ROOT, 'data/imports/rolex_watchpages_2026-07-31.tsv');
const lines = readFileSync(input, 'utf8').trim().split(/\r?\n/);

function referenceFromUrl(url) {
  const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1);
  const parts = slug.split('-');
  const suffix = /^\d{4}$/.test(parts.at(-1)) ? parts.pop() : null;
  let reference = parts.at(-1).toUpperCase();
  if (/^M\d/.test(reference)) reference = reference.slice(1);
  if (!/^\d{4,6}[A-Z0-9]*$/.test(reference)) throw new Error(`Cannot parse reference from ${url}`);
  return { reference, configuration_reference: suffix ? `${reference}-${suffix}` : reference };
}

const records = lines.slice(1).map((line, index) => {
  const [image_url, source_url, description, collection, listed] = line.split('\t');
  if (![image_url, source_url, description, collection, listed].every(Boolean)) {
    throw new Error(`Row ${index + 2}: expected five tab-separated fields`);
  }
  const { reference, configuration_reference } = referenceFromUrl(source_url);
  const listed_price_usd = Number(listed.replace(/[$,]/g, ''));
  if (!Number.isFinite(listed_price_usd) || listed_price_usd <= 0) throw new Error(`Row ${index + 2}: invalid price`);
  if (new URL(image_url).hostname !== 'cdn.thewatchpages.com') throw new Error(`Row ${index + 2}: unexpected image host`);
  if (new URL(source_url).hostname !== 'www.thewatchpages.com') throw new Error(`Row ${index + 2}: unexpected source host`);
  return {
    id: `watchpages-${configuration_reference.toLowerCase()}`,
    brand: 'Rolex',
    reference,
    configuration_reference,
    name: description,
    collection,
    listed_price_usd,
    image_url,
    source_url,
    image_credit: 'The Watch Pages / source catalog',
    rights_status: 'Source-linked editorial image; reuse license not asserted.',
    price_status: 'Catalog price shown by source; not a verified sale or market estimate.',
    observed_at: '2026-07-31',
  };
});

if (records.length !== 80) throw new Error(`Expected 80 Rolex records, found ${records.length}`);
if (new Set(records.map((r) => r.source_url)).size !== records.length) throw new Error('Duplicate source URLs');
if (new Set(records.map((r) => r.image_url)).size !== records.length) throw new Error('Duplicate image URLs');

const output = {
  built: '2026-07-31',
  count: records.length,
  brand: 'Rolex',
  source: 'User-supplied scrape of The Watch Pages',
  limitation: 'Prices are catalog figures displayed by the source. They are not sold prices and never enter the market estimator.',
  records,
};

mkdirSync(join(ROOT, 'public/data'), { recursive: true });
writeFileSync(join(ROOT, 'data/shared/rolex_catalog.json'), JSON.stringify(output, null, 2) + '\n');
writeFileSync(join(ROOT, 'public/data/rolex_catalog.json'), JSON.stringify(output, null, 2) + '\n');
console.log(`✓ ${records.length} sourced Rolex catalog records → public/data/rolex_catalog.json`);
