// Build: data/imports/rolex_watchpages_*.tsv → public/data/rolex_catalog.json.
// Reads every dated TSV in the imports folder (alphabetical), parses each row,
// dedupes by source URL, and emits a single catalog. New TSVs can be dropped
// in without touching this script.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const importDir = join(ROOT, 'data/imports');
const tsvFiles = readdirSync(importDir)
  .filter((f) => f.startsWith('rolex_watchpages_') && f.endsWith('.tsv'))
  .sort();

function referenceFromUrl(url) {
  // Slug shape: rolex-{collection-words}-{ref}-{config}?-{disambiguator}?
  // Examples:
  //   rolex-cosmograph-daytona-126502-0001          → 126502, 126502-0001
  //   rolex-yacht-master-40-126622-0001-2            → 126622, 126622-0001
  //   rolex-cosmograph-daytona-126500ln-0001         → 126500LN, 126500LN-0001
  // The "disambiguator" is a trailing non-numeric segment after the config.
  const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1);
  const m = slug.match(/-(\d{4,6}[A-Z0-9]*?)(?:-(\d{3,5}))?(?:-[a-z0-9]+)?$/i);
  if (!m) throw new Error(`Cannot parse reference from ${url}`);
  let reference = m[1].toUpperCase();
  if (/^M\d/.test(reference)) reference = reference.slice(1);
  const config = m[2];
  return { reference, configuration_reference: config ? `${reference}-${config}` : reference };
}

const seen = new Set()
const records = []
let observedAt = ''
for (const file of tsvFiles) {
  const lines = readFileSync(join(importDir, file), 'utf8').trim().split(/\r?\n/)
  // Pick up the most recent observed_at from the filename, e.g. ..._2026-08-04.tsv
  const m = file.match(/(\d{4}-\d{2}-\d{2})\.tsv$/)
  if (m) observedAt = m[1]
  for (const [rowIndex, line] of lines.slice(1).entries()) {
    const [image_url, source_url, description, collection, listed] = line.split('\t')
    if (![image_url, source_url, description, collection, listed].every(Boolean)) {
      throw new Error(`${file} row ${rowIndex + 2}: expected five tab-separated fields`)
    }
    if (seen.has(source_url)) continue // dedupe across files
    seen.add(source_url)
    const { reference, configuration_reference } = referenceFromUrl(source_url)
    const listed_price_usd = Number(listed.replace(/[$,]/g, ''))
    if (!Number.isFinite(listed_price_usd) || listed_price_usd <= 0) throw new Error(`${file} row ${rowIndex + 2}: invalid price`)
    if (new URL(image_url).hostname !== 'cdn.thewatchpages.com') throw new Error(`${file} row ${rowIndex + 2}: unexpected image host`)
    if (new URL(source_url).hostname !== 'www.thewatchpages.com') throw new Error(`${file} row ${rowIndex + 2}: unexpected source host`)
    records.push({
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
      observed_at: observedAt,
    })
  }
}

if (new Set(records.map((r) => r.source_url)).size !== records.length) throw new Error('Duplicate source URLs after merge')
if (new Set(records.map((r) => r.image_url)).size !== records.length) throw new Error('Duplicate image URLs after merge')

const output = {
  built: observedAt,
  count: records.length,
  brand: 'Rolex',
  source: 'User-supplied scrape of The Watch Pages',
  limitation: 'Prices are catalog figures displayed by the source. They are not sold prices and never enter the market estimator.',
  records,
}

mkdirSync(join(ROOT, 'public/data'), { recursive: true })
writeFileSync(join(ROOT, 'data/shared/rolex_catalog.json'), JSON.stringify(output, null, 2) + '\n')
writeFileSync(join(ROOT, 'public/data/rolex_catalog.json'), JSON.stringify(output, null, 2) + '\n')
console.log(`✓ ${records.length} sourced Rolex catalog records (across ${tsvFiles.length} TSV${tsvFiles.length === 1 ? '' : 's'}) → public/data/rolex_catalog.json`)
