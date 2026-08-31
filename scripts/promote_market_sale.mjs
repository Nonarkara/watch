#!/usr/bin/env node
// Promote one reviewed intake record into one card. This command is intentionally
// single-record: scraping scales discovery; judgment stays explicit and auditable.

import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDryRun } from './lib/fetch.mjs';
import { validateCard } from './validate_card.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_FILE = join(ROOT, 'data/market/review-queue.json');
const TODAY = new Date().toISOString().slice(0, 10);

function arg(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

const id = arg('id');
const decision = arg('decision');
const note = arg('note');
const reviewer = arg('reviewer') ?? 'local-review';
const dryRun = isDryRun();

if (!id || !['comparable', 'variant'].includes(decision)) {
  console.error('usage: npm run data:market:promote -- --id=phillips:<lot> --decision=comparable|variant [--note="..."] [--dry-run]');
  process.exit(2);
}
if (decision === 'variant' && (!note || note.trim().length < 12)) {
  throw new Error('variant promotion requires --note with at least 12 characters explaining why the sale is not comparable');
}

const queue = JSON.parse(readFileSync(QUEUE_FILE, 'utf8'));
const record = queue.records.find((item) => item.source_id === id);
if (!record) throw new Error(`${id} is not in the current review queue`);
if (!record.card_id) throw new Error(`${id} has no exact card match`);
if (!record.realized || record.currency !== 'USD') throw new Error(`${id} is not a realized USD sale`);
if (!record.detail) throw new Error(`${id} has no detail snapshot; re-harvest with a larger --max-details`);
if (record.status === 'duplicate' || record.status === 'promoted') throw new Error(`${id} is already represented on a card`);
if (decision === 'comparable' && record.status !== 'ready_for_review') {
  throw new Error(`${id} is quarantined (${record.reasons.join(', ')}); it cannot be promoted as comparable`);
}
const fatalVariantReasons = new Set(['no_exact_card', 'ambiguous_card_match', 'detail_not_fetched', 'detail_reference_mismatch', 'non_usd_sale', 'no_realized_price']);
if (decision === 'variant' && record.reasons.some((reason) => fatalVariantReasons.has(reason))) {
  throw new Error(`${id} has unresolved evidence errors: ${record.reasons.join(', ')}`);
}

const cardFile = join(ROOT, 'data/cards', `${record.card_id}.json`);
const card = JSON.parse(readFileSync(cardFile, 'utf8'));
const duplicate = card.market_evidence.comps.some((comp) => comp.url === record.source_url ||
  (comp.date === record.sale_date && comp.venue === 'phillips' && comp.price_usd === record.realized));
if (duplicate) throw new Error(`${id} duplicates a comp already on ${record.card_id}`);

const conditionParts = [record.detail.year, record.detail.material, record.detail.accessories, note]
  .filter(Boolean).map((value) => value.trim());
const comp = {
  date: record.sale_date,
  price_usd: record.realized,
  venue: 'phillips',
  url: record.source_url,
  condition: conditionParts.join('; ').slice(0, 800) || null,
  box_papers: record.detail.box_papers ?? null,
};
if (decision === 'variant') comp.comparable = false;

card.market_evidence.comps.push(comp);
const errors = validateCard(card, { id: record.card_id, buildDate: TODAY });
if (errors.length) throw new Error(`promotion would invalidate ${record.card_id}: ${errors.join('; ')}`);

record.status = 'promoted';
record.review = {
  decision,
  note: note?.trim() ?? null,
  reviewer,
  reviewed_at: new Date().toISOString(),
  card_id: record.card_id,
};
queue.generated_at = new Date().toISOString();
queue.summary = {
  ...queue.summary,
  ready_for_review: queue.records.filter((item) => item.status === 'ready_for_review').length,
  quarantined: queue.records.filter((item) => item.status === 'quarantined').length,
  duplicate: queue.records.filter((item) => item.status === 'duplicate').length,
  promoted: queue.records.filter((item) => item.status === 'promoted').length,
};

console.log(`${dryRun ? '[dry-run] ' : ''}${id} → ${record.card_id}: $${record.realized.toLocaleString('en-US')} (${decision})`);
if (dryRun) process.exit(0);

const cardTmp = `${cardFile}.tmp`;
const queueTmp = `${QUEUE_FILE}.tmp`;
writeFileSync(cardTmp, JSON.stringify(card, null, 2) + '\n');
writeFileSync(queueTmp, JSON.stringify(queue, null, 2) + '\n');
renameSync(cardTmp, cardFile);
renameSync(queueTmp, QUEUE_FILE);
console.log(`✓ promoted one reviewed sale; run npm run data:build to recompute the masked dataset`);
