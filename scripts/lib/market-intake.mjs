import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function matchingConvertedUsd(lot, conversion) {
  if (!conversion || !lot.currency || !lot.sale_date || !(lot.realized > 0)) return null;
  return conversion.original_currency === lot.currency && conversion.original_realized === lot.realized &&
    (conversion.fx_conversion?.reference_date ?? conversion.sale_date) === lot.sale_date &&
    Number.isFinite(conversion.realized) && conversion.realized > 0 ? conversion.realized : null;
}

/**
 * Publish the smallest useful view of the private intake queue. The public file
 * carries exact-card candidates only; it deliberately omits raw page text and
 * the hundreds of unmatched lots that are useful to researchers but noisy to
 * readers.
 */
export function publicMarketIntake(queue) {
  const records = (queue.records ?? [])
    .filter((record) => record.card_id && record.status !== 'failed')
    .map((record) => ({
      source_id: record.source_id,
      card_id: record.card_id,
      brand: record.brand,
      reference: record.reference,
      model: record.model,
      realized: record.realized,
      currency: record.currency,
      sale_date: record.review?.sale_date ?? (record.sale_date_basis === 'single_day_auction' ? record.sale_date : null),
      auction_date: record.sale_date ?? null,
      source_url: record.source_url,
      status: record.status,
      reasons: record.reasons ?? [],
      observed_this_run: record.observed_this_run ?? null,
      detail: record.detail ? {
        year: record.detail.year ?? null,
        material: record.detail.material ?? null,
        box_papers: record.detail.box_papers ?? null,
        special_flags: record.detail.special_flags ?? [],
      } : null,
      review: record.review ? {
        decision: record.review.decision,
        note: record.review.note ?? null,
        reviewed_at: record.review.reviewed_at ?? null,
      } : null,
    }));

  return {
    schema_version: 1,
    generated_at: queue.generated_at,
    source: queue.source,
    source_url: queue.source_url,
    limitation: queue.limitation,
    summary: {
      ...queue.summary,
      exact_card_candidates: records.length,
    },
    records,
  };
}

export function writePublicMarketIntake(queue, outputFile) {
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify(publicMarketIntake(queue), null, 2) + '\n');
}
