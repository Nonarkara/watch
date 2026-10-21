import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENTITY = {
  amp: '&', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
  '#39': "'", '#x27': "'", '#8217': '’', '#x2019': '’',
};

export function decodeHtml(value = '') {
  return String(value ?? '').replace(/&([^;]+);/g, (whole, key) => {
    if (ENTITY[key] != null) return ENTITY[key];
    if (key.startsWith('#x')) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return whole;
  });
}

export function cleanText(value = '') {
  return decodeHtml(String(value ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeBrand(value = '') {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
}

export function normalizeReference(value = '') {
  return decodeHtml(value).toUpperCase().split(/;|\binside\b/i)[0].replace(/[^A-Z0-9]/g, '');
}

/**
 * Normalise a published *model name* to the same key space as a reference.
 *
 * The haute-horlogerie tier does not publish reference numbers. Phillips prints
 * "Vingt-8 ISO" on the Voutilainen lot, "Chronometre Souverain" on the F.P. Journe
 * lots, "Observatoire" on the Louis Richard — none of them carry a ref. Those lots
 * are exactly identifiable too: the maker publishes the model name instead of a
 * number, so brand + model name is an *exact identity*, not a near-miss.
 *
 * Same discipline as normalizeReference: strip punctuation, uppercase, drop the
 * quote and parenthesis decorations the catalogue adds around editions
 * ("Masterpiece Chronograph II “Number 1 of 10”"). Kept in the same A-Z0-9 key
 * space so the two channels cannot be confused with one another.
 */
export function normalizeModelName(value = '') {
  return decodeHtml(value)
    .replace(/[“”„‟]/g, '"')   // curly quotes → straight
    .replace(/["'«»‘’]/g, ' ')  // edition/quote marks become a space
    .replace(/[()\[\]{}]/g, ' ') // parentheticals are decoration, drop the brackets
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function classText(block, fragment) {
  const pattern = new RegExp(`<[^>]+class="[^"]*${fragment}[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  return cleanText(block.match(pattern)?.[1] ?? '');
}

function parseJsonLd(html) {
  const out = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(match[1])); } catch { /* a broken optional block is not the lot data */ }
  }
  return out;
}

function eventFrom(html) {
  for (const block of parseJsonLd(html)) {
    if (block?.['@type'] === 'Event') return block;
    const event = block?.['@graph']?.find((item) => item?.['@type'] === 'Event');
    if (event) return event;
  }
  return null;
}

export function discoverPhillipsAuctionCodes(html) {
  return [...new Set([...html.matchAll(/href="\/auction\/([A-Z0-9]+)\/overview"/g)].map((m) => m[1]))];
}

export function parseMoney(value = '') {
  const clean = decodeHtml(value).replace(/\s+/g, ' ').trim();
  const match = clean.match(/^(HK\$|S\$|US\$|\$|CHF|£|€)\s*([0-9][0-9,.’]*)/i);
  if (!match) return { currency: null, amount: null, display: clean || null };
  const currency = ({ 'HK$': 'HKD', 'S$': 'SGD', 'US$': 'USD', '$': 'USD', CHF: 'CHF', '£': 'GBP', '€': 'EUR' })[match[1].toUpperCase()] ?? null;
  const amount = Number(match[2].replace(/[^0-9]/g, ''));
  return { currency, amount: Number.isFinite(amount) && amount > 0 ? amount : null, display: clean };
}

export function parsePhillipsAuctionPage(html, sourceUrl) {
  const event = eventFrom(html);
  const auctionCode = sourceUrl.match(/\/([A-Z]{2}\d{6})(?:\/|$)/)?.[1] ?? null;
  const saleDate = event?.startDate?.slice(0, 10) ?? null;
  const auctionName = event?.name ?? cleanText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const lots = [];
  const seen = new Set();
  const anchors = /<a[^>]+href="(\/detail\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(anchors)) {
    const path = decodeHtml(match[1]);
    if (seen.has(path)) continue;
    seen.add(path);
    const block = match[2];
    const text = cleanText(block);
    const soldDisplay = text.match(/Sold For\s*((?:HK\$|S\$|US\$|\$|CHF|£|€)\s*[0-9][0-9,.’]*)/i)?.[1] ?? '';
    const sold = parseMoney(soldDisplay);
    const reference = classText(block, 'seldon-object-tile__reference-number').replace(/^Ref\.\s*/i, '').trim() || null;
    const sourceId = `phillips:${path.split('/').filter(Boolean).at(-1)}`;
    lots.push({
      source_id: sourceId,
      source: 'Phillips',
      venue: 'phillips',
      auction_code: auctionCode,
      auction_name: auctionName || null,
      sale_date: saleDate,
      lot_number: classText(block, 'seldon-object-tile__lot-number') || null,
      brand: classText(block, 'seldon-object-tile__maker') || null,
      reference,
      reference_key: normalizeReference(reference),
      model: classText(block, 'seldon-object-tile__model') || null,
      realized: sold.amount,
      currency: sold.currency,
      realized_display: sold.display,
      source_url: `https://www.phillips.com${path}`,
    });
  }

  return {
    auction: {
      code: auctionCode,
      name: auctionName || null,
      start_date: saleDate,
      end_date: event?.endDate?.slice(0, 10) ?? null,
      location: event?.location?.name ?? null,
      source_url: sourceUrl,
      source_sha256: sha256(html),
    },
    lots,
  };
}

function detailValue(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`>${escaped}<[\\s\\S]{0,900}?seldon-detail__value[^>]*>[\\s\\S]*?<[^>]+>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  return cleanText(html.match(pattern)?.[1] ?? '') || null;
}

function metaContent(html, key, attr = 'name') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const first = new RegExp(`<meta[^>]+${attr}="${escaped}"[^>]+content="([^"]*)"`, 'i');
  const second = new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${attr}="${escaped}"`, 'i');
  return decodeHtml(html.match(first)?.[1] ?? html.match(second)?.[1] ?? '').trim() || null;
}

function inferBoxPapers(accessories = '') {
  const lower = accessories.toLowerCase();
  const box = /box|presentation case/.test(lower);
  const papers = /certificate|guarantee|papers|archive|documentation/.test(lower);
  if (box && papers) return 'full_set';
  if (box) return 'box_only';
  if (papers) return 'papers_only';
  return accessories ? 'watch_only' : null;
}

const SPECIAL_PATTERNS = [
  ['celebrity_or_named_provenance', /owned by|collection of|property of|gifted to|worn by/i],
  ['charity_sale', /charity|benefit of|proceeds.*foundation/i],
  ['unique_or_prototype', /\bunique\b|prototype|one[- ]of[- ]a[- ]kind/i],
  ['special_signature', /tiffany\s*&\s*co\.?[- ]signed|khanjar|serpico\s*&\s*laino/i],
  ['military_issue', /military[- ]issued|made for the british|ministry of defen[cs]e|milsub/i],
];

export function parsePhillipsDetailPage(html) {
  const reference = detailValue(html, 'Reference No');
  const material = detailValue(html, 'Material');
  const year = detailValue(html, 'Year');
  const accessories = detailValue(html, 'Accessories');
  const description = metaContent(html, 'description') ?? metaContent(html, 'og:description', 'property');
  const title = metaContent(html, 'og:title', 'property') ?? cleanText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const riskText = [title, description, accessories].filter(Boolean).join(' ');
  return {
    reference,
    reference_key: normalizeReference(reference),
    material,
    year,
    accessories,
    box_papers: inferBoxPapers(accessories ?? ''),
    description,
    title,
    special_flags: SPECIAL_PATTERNS.filter(([, pattern]) => pattern.test(riskText)).map(([key]) => key),
    source_sha256: sha256(html),
  };
}

export function loadCardIndex(root) {
  const cards = [];
  for (const file of readdirSync(join(root, 'data/cards')).filter((name) => name.endsWith('.json'))) {
    const card = JSON.parse(readFileSync(join(root, 'data/cards', file), 'utf8'));
    cards.push({
      id: card.id,
      brand: card.identity.brand,
      brand_key: normalizeBrand(card.identity.brand),
      reference: card.identity.reference,
      reference_key: normalizeReference(card.identity.reference),
      material: card.identity.case?.material ?? null,
      comps: card.market_evidence?.comps ?? [],
    });
  }
  const byIdentity = new Map();
  for (const card of cards) {
    const key = `${card.brand_key}|${card.reference_key}`;
    const bucket = byIdentity.get(key) ?? [];
    bucket.push(card);
    byIdentity.set(key, bucket);
  }
  return { cards, byIdentity };
}

function materialFamily(value = '') {
  const lower = value.toLowerCase();
  if (/platinum/.test(lower)) return 'platinum';
  if (/titanium/.test(lower)) return 'titanium';
  if (/white gold/.test(lower)) return 'white_gold';
  if (/pink gold|rose gold|everose/.test(lower)) return 'rose_gold';
  if (/yellow gold|18k gold|18 ct gold/.test(lower)) return 'yellow_gold';
  if (/steel|oystersteel/.test(lower)) return 'steel';
  if (/ceramic/.test(lower)) return 'ceramic';
  return null;
}

export function classifyLot(lot, cardIndex, existingKeys, detail = null) {
  const identityKey = `${normalizeBrand(lot.brand)}|${lot.reference_key}`;
  const matches = cardIndex.byIdentity.get(identityKey) ?? [];
  const reasons = [];
  let status = 'quarantined';

  if (!lot.realized || !lot.currency) reasons.push('no_realized_price');
  if (lot.realized && lot.currency !== 'USD') reasons.push('non_usd_sale');
  if (!lot.reference_key) reasons.push('missing_reference');
  if (!matches.length) reasons.push('no_exact_card');
  if (matches.length > 1) reasons.push('ambiguous_card_match');

  const card = matches.length === 1 ? matches[0] : null;
  if (card && lot.sale_date && lot.realized) {
    const valueKey = `${card.id}|${lot.sale_date}|${lot.venue}|${lot.realized}`;
    if (existingKeys.urls.has(`${card.id}|${lot.source_url}`) || existingKeys.values.has(valueKey)) {
      return { ...lot, card_id: card.id, status: 'duplicate', reasons: ['already_on_card'], detail };
    }
  }

  if (card && lot.currency === 'USD' && lot.realized) {
    if (!detail) reasons.push('detail_not_fetched');
    if (detail?.reference_key && detail.reference_key !== card.reference_key) reasons.push('detail_reference_mismatch');
    const cardMaterial = materialFamily(card.material ?? '');
    const lotMaterial = materialFamily(detail?.material ?? '');
    if (cardMaterial && lotMaterial && cardMaterial !== lotMaterial) reasons.push('material_mismatch');
    if (detail?.special_flags?.length) reasons.push(...detail.special_flags);
  }

  if (card && lot.currency === 'USD' && lot.realized && detail && reasons.length === 0) status = 'ready_for_review';
  return { ...lot, card_id: card?.id ?? null, status, reasons: [...new Set(reasons)], detail };
}

export function existingCompKeys(cardIndex) {
  const urls = new Set();
  const values = new Set();
  for (const card of cardIndex.cards) {
    for (const comp of card.comps) {
      if (comp.url) urls.add(`${card.id}|${comp.url}`);
      if (comp.date && comp.venue && comp.price_usd) values.add(`${card.id}|${comp.date}|${comp.venue}|${comp.price_usd}`);
    }
  }
  return { urls, values };
}

export function summarizeRecords(records) {
  const counts = { harvested: records.length, ready_for_review: 0, quarantined: 0, duplicate: 0, failed: 0 };
  const reasons = {};
  for (const record of records) {
    if (record.status in counts) counts[record.status]++;
    else counts.failed++;
    for (const reason of record.reasons ?? []) reasons[reason] = (reasons[reason] ?? 0) + 1;
  }
  return { ...counts, reasons: Object.fromEntries(Object.entries(reasons).sort((a, b) => b[1] - a[1])) };
}
