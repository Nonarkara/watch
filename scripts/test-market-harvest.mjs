import assert from 'node:assert/strict';
import {
  classifyLot, discoverPhillipsAuctionCodes, normalizeReference, parseMoney,
  parsePhillipsAuctionPage, parsePhillipsDetailPage, summarizeRecords,
} from './lib/market-harvest.mjs';
import { publicMarketIntake } from './lib/market-intake.mjs';

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
const emptyKeys = { urls: new Set(), values: new Set() };
const ready = classifyLot(parsed.lots[0], index, emptyKeys, detail);
assert.equal(ready.status, 'ready_for_review');
assert.deepEqual(ready.reasons, []);

const nonUsd = classifyLot(parsed.lots[1], index, emptyKeys, detail);
assert.equal(nonUsd.status, 'quarantined');
assert(nonUsd.reasons.includes('non_usd_sale'));

const unknown = classifyLot(parsed.lots[2], index, emptyKeys, null);
assert.equal(unknown.status, 'quarantined');
assert(unknown.reasons.includes('no_realized_price'));
assert(unknown.reasons.includes('no_exact_card'));

const duplicateKeys = { urls: new Set([`rolex-5513|${parsed.lots[0].source_url}`]), values: new Set() };
assert.equal(classifyLot(parsed.lots[0], index, duplicateKeys, detail).status, 'duplicate');

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

console.log('✓ market harvest parser, trust boundary, dedupe, and conservation law');
