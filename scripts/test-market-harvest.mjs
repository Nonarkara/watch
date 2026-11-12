import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  classifyLot, discoverPhillipsAuctionCodes, existingCompKeys, normalizeReference, parseMoney,
  parsePhillipsAuctionPage, parsePhillipsDetailPage, resolvePromotionDate, sha256, summarizeRecords,
} from './lib/market-harvest.mjs';
import { matchingConvertedUsd, publicMarketIntake } from './lib/market-intake.mjs';

// A stale review queue can offer a lot already used on a different dossier.
const sandbox = mkdtempSync(join(tmpdir(), 'watch-promotion-'));
try {
  const root = new URL('../', import.meta.url);
  for (const dir of ['scripts', 'data/cards', 'data/market']) mkdirSync(join(sandbox, dir), { recursive: true });
  for (const path of ['scripts/promote_market_sale.mjs', 'scripts/replay_phillips_archive.mjs', 'scripts/validate_card.mjs', 'scripts/lib']) {
    cpSync(new URL(path, root), join(sandbox, path), { recursive: true });
  }
  const owner = JSON.parse(readFileSync(new URL('data/cards/rolex-116520.json', root), 'utf8'));
  const candidate = JSON.parse(readFileSync(new URL('data/cards/rolex-16520.json', root), 'utf8'));
  const queue = JSON.parse(readFileSync(new URL('data/market/review-queue.json', root), 'utf8'));
  const lot = queue.records.find((row) => row.source_id === 'phillips:231653');
  candidate.market_evidence.comps = [];
  delete candidate.market_evidence.comparable_dial;
  Object.assign(lot, { card_id: candidate.id, status: 'ready_for_review', reasons: [] });
  const candidatePath = join(sandbox, 'data/cards', `${candidate.id}.json`);
  const queuePath = join(sandbox, 'data/market/review-queue.json');
  const candidateBytes = JSON.stringify(candidate);
  const queueBytes = JSON.stringify({ records: [lot] });
  writeFileSync(join(sandbox, 'data/cards', `${owner.id}.json`), JSON.stringify(owner));
  writeFileSync(candidatePath, candidateBytes);
  writeFileSync(queuePath, queueBytes);
  const promote = (...args) => spawnSync(process.execPath, [join(sandbox, 'scripts/promote_market_sale.mjs'),
    '--id=phillips:231653', `--sale-date=${lot.sale_date}`, `--date-source=${lot.source_url}`, ...args], { encoding: 'utf8' });
  const rejected = promote('--decision=comparable');
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /already comparable on rolex-116520/);
  assert.equal(readFileSync(candidatePath, 'utf8'), candidateBytes);
  assert.equal(readFileSync(queuePath, 'utf8'), queueBytes);
  const context = promote('--decision=variant', '--note=Different reference, cited for context.', '--dry-run');
  assert.equal(context.status, 0, context.stderr);
  const rawDir = 'data/.harvest/phillips/2026-09-05';
  const rawPath = `${rawDir}/auction-NY080126-0123456789ab.html.gz`;
  mkdirSync(join(sandbox, rawDir), { recursive: true });
  writeFileSync(join(sandbox, rawPath), gzipSync('<html>modified snapshot</html>'));
  writeFileSync(join(sandbox, 'data/market/harvest-manifest.json'), JSON.stringify({
    schema_version: 1, requests: [{ url: 'https://www.phillips.com/auctions/auction/NY080126',
      path: rawPath, sha256: sha256('<html>original snapshot</html>') }],
  }));
  const replay = spawnSync(process.execPath, [join(sandbox, 'scripts/replay_phillips_archive.mjs')], { encoding: 'utf8' });
  assert.equal(replay.status, 1);
  assert.match(replay.stderr, /Snapshot checksum mismatch: NY080126/);
  assert.equal(readFileSync(queuePath, 'utf8'), queueBytes, 'replay must never rewrite the review queue');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}

const tile = ({ id, lot, brand, reference, model, sold }) => `
<a href="/detail/${brand.toLowerCase()}/${id}">
  <span class="seldon-object-tile__lot-number">${lot}</span>
  <span class="seldon-object-tile__maker"><span>${brand}</span></span>
  <span class="seldon-object-tile__reference-number">Ref. ${reference}</span>
  <span class="seldon-object-tile__model"><span>${model}</span></span>
  <div>${sold ? `Sold For <span>${sold}</span>` : 'Estimate <span>$4,000–8,000</span>'}</div>
</a>`;

const auctionHtml = `
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Event","name":"Test Watch Sale","startDate":"2026-06-13T14:00:00Z","endDate":"2026-06-14T16:00:00Z","location":{"name":"New York"}}</script>
${tile({ id: 101, lot: 1, brand: 'Rolex', reference: '5513', model: 'Submariner', sold: '$13,970' })}
${tile({ id: 102, lot: 2, brand: 'Rolex', reference: '5513', model: 'Submariner', sold: 'CHF22,860' })}
${tile({ id: 103, lot: 3, brand: 'Unknown', reference: 'ABC-1', model: 'Test', sold: null })}`;

assert.deepEqual(discoverPhillipsAuctionCodes('<a href="/auction/NY080126/overview"></a><a href="/auction/NY080126/overview"></a>'), ['NY080126']);
assert.equal(normalizeReference('5711/1A-010; inside caseback stamped 5711'), '57111A010');
assert.equal(normalizeReference(null), '', 'missing references degrade to quarantine input, not a crash');
assert.deepEqual(parseMoney('HK$3,429,000'), { currency: 'HKD', amount: 3429000, display: 'HK$3,429,000' });

const parsed = parsePhillipsAuctionPage(auctionHtml, 'https://www.phillips.com/auctions/auction/NY080126');
assert.equal(parsed.auction.start_date, '2026-06-13');
assert.equal(parsed.auction.location, 'New York');
assert.equal(parsed.lots.length, 3);
assert.equal(parsed.lots[0].realized, 13970);
assert.equal(parsed.lots[0].currency, 'USD');
assert.equal(parsed.lots[2].realized, null);
const aliasPage = auctionHtml + tile({ id: 'NY080126/1', lot: 1, brand: 'Rolex', reference: '5513', model: 'Submariner', sold: '$13,970' });
assert.equal(parsePhillipsAuctionPage(aliasPage, 'https://www.phillips.com/auction/NY080126').lots.length, 3);
const legacyTile = tile({ id: 'NY080126/1', lot: 1, brand: 'Rolex', reference: '5513', model: 'Submariner', sold: '$13,970' });
assert.equal(parsePhillipsAuctionPage(legacyTile, 'https://www.phillips.com/auction/NY080126').lots[0].source_id, 'phillips:lot:NY080126/1');
const multiDay = parsed.lots[0];
const session = { date: '2026-06-14', source: 'https://www.phillips.com/auction/NY080126/overview' };
assert.equal(multiDay.sale_date_basis, 'auction_start_unverified');
assert.throws(() => resolvePromotionDate(multiDay), /Lot date is unverified/);
assert.throws(() => resolvePromotionDate({ ...multiDay, sale_date_basis: undefined }), /Lot date is unverified/);
assert.throws(() => resolvePromotionDate(multiDay, { ...session, date: '2026-06-15' }), /outside/);
assert.throws(() => resolvePromotionDate(multiDay, { ...session, source: 'https://phillips.com.example.org/session' }), /unverified/);
assert.throws(() => resolvePromotionDate(multiDay, { ...session, source: 'https://www.phillips.com/' }), /identify this/);
assert.throws(() => resolvePromotionDate(multiDay, { ...session, source: 'https://www.phillips.com/auction/NY080125/overview' }), /identify this/);
assert.throws(() => resolvePromotionDate(multiDay, { ...session, source: 'https://www.phillips.com/detail/rolex/NY080126/2' }), /identify this/);
assert.deepEqual(resolvePromotionDate(multiDay, session), session);
const singleDay = parsePhillipsAuctionPage(auctionHtml.replace('2026-06-14T', '2026-06-13T'),
  'https://www.phillips.com/auction/NY080126').lots[0];
assert.equal(resolvePromotionDate(singleDay).date, '2026-06-13');

const detailHtml = `
<meta name="description" content="A standard stainless steel diver's watch">
<div><span>Reference No</span><div class="seldon-detail__value"><span>5513</span></div></div>
<div><span>Year</span><div class="seldon-detail__value"><span>Circa 1979</span></div></div>
<div><span>Material</span><div class="seldon-detail__value"><span>Stainless steel</span></div></div>
<div><span>Accessories</span><div class="seldon-detail__value"><span>Accompanied by Rolex guarantee and presentation box.</span></div></div>`;
const detail = parsePhillipsDetailPage(detailHtml);
assert.equal(detail.reference_key, '5513');
assert.equal(detail.material, 'Stainless steel');
assert.equal(detail.box_papers, 'full_set');
assert.deepEqual(detail.special_flags, []);

const card = { id: 'rolex-5513', brand: 'Rolex', brand_key: 'rolex', reference: '5513', reference_key: '5513', material: 'stainless steel', comps: [] };
const index = { cards: [card], byIdentity: new Map([['rolex|5513', [card]]]) };
const emptyKeys = existingCompKeys(index);
const ready = classifyLot(parsed.lots[0], index, emptyKeys, detail);
assert.equal(ready.status, 'ready_for_review');
assert.deepEqual(ready.reasons, []);
const scopedCard = { ...card, comparable_dial: 'Black' };
const scopedIndex = { cards: [scopedCard], byIdentity: new Map([['rolex|5513', [scopedCard]]]) };
const explicitDial = parsePhillipsDetailPage(detailHtml +
  '<div><span>Dial</span><div class="seldon-detail__value"><span>Black</span></div></div>');
assert.equal(explicitDial.dial, 'Black');
assert.equal(classifyLot(parsed.lots[0], scopedIndex, emptyKeys, explicitDial).status, 'ready_for_review');
assert.deepEqual(classifyLot(parsed.lots[0], scopedIndex, emptyKeys, { ...detail, dial: 'Blue' }).reasons, ['dial_mismatch']);
assert.deepEqual(classifyLot(parsed.lots[0], scopedIndex, emptyKeys, detail).reasons, ['dial_unverified']);

const nonUsd = classifyLot(parsed.lots[1], index, emptyKeys, detail);
assert.equal(nonUsd.status, 'quarantined');
assert(nonUsd.reasons.includes('non_usd_sale'));
assert.deepEqual(classifyLot(parsed.lots[1], index, emptyKeys, {
  ...detail, reference_key: '5512', material: 'Yellow gold',
}).reasons, ['non_usd_sale', 'detail_reference_mismatch', 'material_mismatch'],
  'foreign-currency detail can reveal identity issues but cannot lift the currency quarantine');

const unknown = classifyLot(parsed.lots[2], index, emptyKeys, null);
assert.equal(unknown.status, 'quarantined');
assert(unknown.reasons.includes('no_realized_price'));
assert(unknown.reasons.includes('no_exact_card'));

const duplicateKeys = { ...emptyKeys, urls: new Set([`rolex-5513|${parsed.lots[0].source_url}`]) };
assert.equal(classifyLot(parsed.lots[0], index, duplicateKeys, detail).status, 'duplicate');
const alternateUrlKeys = existingCompKeys({ cards: [{ ...card, comps: [{
  url: 'https://www.phillips.com/detail/rolex/NY080126/1', date: '2026-06-14', venue: 'phillips', price_usd: 13970,
}] }] });
assert.equal(classifyLot(multiDay, index, alternateUrlKeys, detail).status, 'duplicate',
  'a numeric detail URL and older auction/lot URL identify the same lot even if the dates differ');
assert.equal(classifyLot({ ...multiDay, lot_number: '12', sale_date: '2026-06-14', sale_date_basis: 'reviewed' }, index, alternateUrlKeys, detail).status, 'ready_for_review',
  'a distinct lot is not a duplicate solely because its realized price matches');

const summary = summarizeRecords([ready, nonUsd, unknown]);
assert.equal(summary.harvested, summary.ready_for_review + summary.quarantined + summary.duplicate + summary.failed,
  'every record lands in exactly one terminal intake state');
assert.equal(summary.ready_for_review, 1);
assert.equal(summary.quarantined, 2);

const publicQueue = publicMarketIntake({
  generated_at: '2026-09-06T00:00:00.000Z',
  source: 'Phillips public watch auction results',
  source_url: 'https://www.phillips.com/features/watches',
  limitation: 'Review queue only.',
  summary,
  records: [ready, nonUsd, unknown],
});
assert.equal(publicQueue.records.length, 2, 'public intake includes exact-card candidates, not the unmatched archive');
assert.equal(publicQueue.summary.exact_card_candidates, 2);
assert.equal(publicQueue.records[0].detail.description, undefined, 'raw marketing copy stays out of the public snapshot');
assert.equal(publicQueue.records[0].realized, 13970);
assert.equal(publicQueue.records[0].sale_date, null);
assert.equal(publicQueue.records[0].auction_date, '2026-06-13');
const fxLot = { currency: 'HKD', realized: 100000, sale_date: '2026-06-13' };
const fx = { original_currency: 'HKD', original_realized: 100000, realized: 12762, sale_date: '2026-06-13' };
assert.equal(matchingConvertedUsd(fxLot, fx), 12762);
assert.equal(matchingConvertedUsd(fxLot, { ...fx, original_realized: 110000 }), null);
assert.equal(matchingConvertedUsd(fxLot, { ...fx, sale_date: '2026-06-12' }), null);

console.log('✓ market harvest parser, trust boundary, dedupe, and conservation law');
