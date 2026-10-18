#!/usr/bin/env node
// fx_convert_market.mjs — convert the quarantined HKD/CHF Phillips lots to USD
// at the ECB reference rate published on the last business day before the sale,
// then hand the USD-normalised records to the same fuzzy matcher that promotes
// the native-USD ones.
//
// Why this exists: the Sep 2026 Phillips harvest pulled 675 lots from three
// auctions — New York (USD), Geneva (CHF), Hong Kong (HKD). 517 of them were
// quarantined for one reason: `non_usd_sale`. That was correct at the time —
// the estimator refuses to average across currencies without a stated basis.
// But the basis is obtainable: the ECB publishes a reference rate every business
// day, and the sale dates collapse to two, so the whole conversion is four HTTP
// calls.
//
// Honesty rules this script keeps:
//   1. The rate is the ECB reference rate for the last business day ON OR BEFORE
//      the sale date. Frankfurter returns exactly that, and we store the date it
//      actually used (`rate_date`), never the requested date.
//   2. The converted price is recorded with `currency: "USD"` plus a
//      `fx_conversion` block naming the source currency, the rate, the rate date,
//      and the provider. The estimator never sees the block — it sees a USD comp.
//   3. Converted lots stay `comparable: false`. They are shown, cited, and
//      excluded from the estimate, for the same two reasons the native-USD fuzzy
//      matches are excluded (different reference) plus a third (the hammer was
//      struck in a different currency on a different continent).
//
// What it writes:
//   data/market/fx-rates.json        the four rates, so the build is auditable
//   data/market/fx-converted.json    the converted records, for the matcher
//
// Run: node scripts/fx_convert_market.mjs
//      node scripts/fx_convert_market.mjs --write

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const QUEUE = JSON.parse(readFileSync(join(ROOT, 'data/market/review-queue.json'), 'utf8'));
const WRITE = process.argv.includes('--write');

const FRANKFURTER = 'https://api.frankfurter.app';
const PROVIDER = 'European Central Bank reference rate via Frankfurter (frankfurter.app)';
const SUPPORTED = new Set(['HKD', 'CHF', 'EUR', 'GBP', 'SGD']);

async function fetchRate(date, from) {
  const url = `${FRANKFURTER}/${date}?from=${from}&to=USD`;
  const res = await fetch(url, { headers: { 'user-agent': 'TimePopBot/1.0 (https://watch.nonarkara.org; market research)' } });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    requested_date: date,
    rate_date: data.date,          // the business day ECB actually published
    rate: data.rates?.USD ?? null,
    provider: PROVIDER,
  };
}

const need = new Map();
for (const r of QUEUE.records) {
  if (!r.realized || !r.currency || r.currency === 'USD') continue;
  if (!SUPPORTED.has(r.currency)) continue;
  if (!r.sale_date) continue;
  const key = `${r.sale_date}|${r.currency}`;
  if (!need.has(key)) need.set(key, { date: r.sale_date, from: r.currency, lots: 0 });
  need.get(key).lots++;
}

console.log(`FX lookups needed: ${need.size}`);
const rates = new Map();
for (const [, req] of need) {
  const r = await fetchRate(req.date, req.from);
  if (!r?.rate) {
    console.error(`  ! no rate for ${req.from} on ${req.date}`);
    continue;
  }
  rates.set(`${req.date}|${req.from}`, r);
  console.log(`  ${req.from}→USD ${r.rate} (ECB ${r.rate_date}) for ${req.lots} lots sold ${req.date}`);
}

const converted = [];
const failed = [];
for (const r of QUEUE.records) {
  if (!r.realized || !r.currency || r.currency === 'USD') continue;
  const key = `${r.sale_date}|${r.currency}`;
  const rate = rates.get(key);
  if (!rate) { failed.push({ source_id: r.source_id, reason: 'no_rate' }); continue; }
  const usd = Math.round(r.realized * rate.rate);
  converted.push({
    ...r,
    realized: usd,
    original_realized: r.realized,
    original_currency: r.currency,
    original_display: r.realized_display,
    currency: 'USD',
    realized_display: `$${usd.toLocaleString('en-US')}`,
    fx_conversion: {
      from: r.currency,
      rate: rate.rate,
      rate_date: rate.rate_date,
      provider: rate.provider,
      note: 'Hammer struck in the sale currency; converted at the ECB reference rate for the last business day on or before the sale date.',
    },
  });
}

console.log();
console.log('=== SUMMARY ===');
console.log(`converted to USD: ${converted.length}`);
console.log(`skipped (no rate): ${failed.length}`);
const totalNative = converted.reduce((a, c) => a + (c.original_realized || 0) / (c.fx_conversion?.rate || 1), 0);
const totalUsd = converted.reduce((a, c) => a + c.realized, 0);
console.log(`converted value: $${(totalUsd / 1e6).toFixed(1)}M (from ${(totalNative / 1e6).toFixed(1)}M native)`);

if (WRITE) {
  writeFileSync(join(ROOT, 'data/market/fx-rates.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    provider: PROVIDER,
    method: 'ECB reference rate for the last business day on or before the sale date. Frankfurter returns the last published business day, which is recorded verbatim as rate_date.',
    rates: [...rates.values()],
  }, null, 2) + '\n');

  writeFileSync(join(ROOT, 'data/market/fx-converted.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: {
      converted: converted.length,
      skipped: failed.length,
      total_usd: totalUsd,
    },
    records: converted,
  }, null, 2) + '\n');

  console.log();
  console.log('wrote data/market/fx-rates.json');
  console.log('wrote data/market/fx-converted.json');
}