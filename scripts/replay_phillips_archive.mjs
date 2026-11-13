// Read-only audit of a recorded harvest. No network or queue writes.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { classifyLot, existingCompKeys, loadCardIndex, parsePhillipsAuctionPage, sha256, summarizeRecords } from './lib/market-harvest.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const archiveRoot = resolve(process.argv[2] ?? root);
const manifest = JSON.parse(readFileSync(join(archiveRoot, 'data/market/harvest-manifest.json'), 'utf8'));
if (manifest.schema_version !== 1 || !Array.isArray(manifest.requests)) throw new Error('Invalid harvest manifest');

const index = loadCardIndex(root);
const keys = existingCompKeys(index);
const queue = JSON.parse(readFileSync(join(root, 'data/market/review-queue.json'), 'utf8'));
const prior = new Map(queue.records.map(record => [record.source_id, record]));
const pages = [];
const records = new Map();
for (const request of manifest.requests) {
  const code = /^https:\/\/www\.phillips\.com\/auctions\/auction\/([A-Z]{2}\d{6})$/.exec(request.url)?.[1];
  if (!code || request.error) continue;
  if (!new RegExp(`^data/\\.harvest/phillips/\\d{4}-\\d{2}-\\d{2}/auction-${code}-[a-f0-9]{12}\\.html\\.gz$`).test(request.path ?? '')) {
    throw new Error(`Invalid archive path for ${code}`);
  }
  const html = gunzipSync(readFileSync(join(archiveRoot, request.path)), { maxOutputLength: 32 * 1024 * 1024 }).toString('utf8');
  if (sha256(html) !== request.sha256) throw new Error(`Snapshot checksum mismatch: ${code}`);
  const parsed = parsePhillipsAuctionPage(html, request.url);
  const realized = parsed.lots.filter(lot => lot.realized > 0);
  pages.push({ code, parsed: parsed.lots.length, realized: realized.length });
  for (const lot of realized) {
    const old = prior.get(lot.source_id);
    const sameEvidence = old?.source_url === lot.source_url && old?.currency === lot.currency && old?.realized === lot.realized;
    records.set(lot.source_id, classifyLot(lot, index, keys, sameEvidence ? old.detail : null));
  }
}
if (!records.size) throw new Error('No realized results recovered from the archive');
const lots = [...records.values()];
console.log(JSON.stringify({
  archive_run: manifest.run_id,
  pages,
  ...summarizeRecords(lots),
  exact_card_candidates: lots.filter(lot => lot.card_id).length,
  foreign_candidates_without_detail: lots.filter(lot => lot.card_id && lot.currency !== 'USD' && !lot.detail).length,
  not_in_current_queue: lots.filter(lot => !prior.has(lot.source_id)).length,
}, null, 2));
