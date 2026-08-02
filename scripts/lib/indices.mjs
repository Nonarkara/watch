// WATCH index engine — every published number is a pure function of card + shared inputs.
// Deterministic: same (card, shared, buildDate) → byte-identical output. No Date.now(), no randomness.

const MS_DAY = 86400000;

// A comp counts toward the estimate only if it is the same object the card describes.
// Special-dial variants (a Tiffany-signed 5711), celebrity-provenance lots, and charity
// sales are real, cited evidence — but they price a different thing, so they are carried
// on the card as variant sales and never fed to the estimator.
export const isComparable = (c) => c.comparable !== false;

const daysBetween = (a, b) => Math.round((new Date(a) - new Date(b)) / MS_DAY);
const monthKey = (iso) => iso.slice(0, 7);
const round1 = (x) => Math.round(x * 10) / 10;

function compsInWindow(comps, buildDate, months, endOffsetMonths = 0) {
  const end = new Date(buildDate);
  end.setMonth(end.getMonth() - endOffsetMonths);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return comps.filter((c) => {
    const d = new Date(c.date);
    return d > start && d <= end;
  });
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function trimmedMean(xs, frac) {
  const s = [...xs].sort((a, b) => a - b);
  const k = Math.floor(s.length * frac);
  const kept = s.slice(k, s.length - k);
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}

const percentile = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  return s[lo] + (s[lo + 1] !== undefined ? (s[lo + 1] - s[lo]) * (i - lo) : 0);
};

// (a) Market price estimate — widening windows 12→24→36→60→120mo→all-time;
// refuses below n=3. Older windows degrade honestly in the limitation string
// so a card with comps spread over years still gets a number, not a refusal.
export function marketEstimate(comps, buildDate) {
  const windows = [12, 24, 36, 60, 120, 1200];  // 1200mo = "all time on file"
  for (const months of windows) {
    const w = compsInWindow(comps, buildDate, months);
    if (w.length < 3) continue;
    const prices = w.map((c) => c.price_usd);
    const venues = new Set(w.map((c) => c.venue)).size;
    const newest = w.map((c) => c.date).sort().at(-1);
    const oldest = w.map((c) => c.date).sort()[0];
    const base = { n: w.length, window_months: months, venues, as_of: newest, reason: null };
    const windowLabel = months === 1200 ? "all time on file" : months === 120 ? "10 years" : months === 60 ? "5 years" : `${months} months`;
    if (w.length >= 8) {
      return { ...base,
        value: Math.round(trimmedMean(prices, 0.2)),
        band: [Math.round(percentile(prices, 0.25)), Math.round(percentile(prices, 0.75))],
        method: "trimmed_mean_20",
        limitation: `From ${w.length} sales over ${windowLabel} (oldest ${oldest}, newest ${newest}) across ${venues} venue(s); condition varies.` };
    }
    return { ...base,
      value: Math.round(median(prices)),
      band: [Math.min(...prices), Math.max(...prices)],
      method: "median",
      limitation: `Only ${w.length} sales over ${windowLabel} (oldest ${oldest}, newest ${newest}); small-sample median — single-condition comps dominate.` };
  }
  return { value: null, n: comps.length, window_months: null, as_of: null, method: null,
    reason: comps.length === 0 ? "no_comps" : "insufficient_comps",
    limitation: comps.length < 3
      ? `Only ${comps.length} verified sale${comps.length === 1 ? '' : 's'} on file. Add at least ${3 - comps.length} more comp (Phillips, Christie's, Sotheby's, Bonhams) for an estimate.`
      : `Sales exist but none of the 3-, 5-, or 10-year windows from the build date contain 3 sales; refusing to estimate.` };
}

// (b) Premium to retail %
// The baseline must describe itself honestly. Three cases, never conflated:
//   current price on record            -> "current retail"
//   discontinued, last price on record -> "final retail (YEAR)"
//   still in production, only an old price on record -> "YEAR retail", and the limitation
//     says the current list price is missing, because a premium measured against a stale
//     baseline overstates the gap for any watch whose retail price has since risen.
export function premiumToRetail(estimate, retail, discontinued) {
  const last = retail.msrp_history.at(-1);
  const msrpEntry = retail.current_msrp_usd != null
    ? { price: retail.current_msrp_usd, vs: "current retail", stale: false }
    : last
      ? { price: last.price_usd,
          vs: discontinued ? `final retail (${last.effective_year})` : `${last.effective_year} retail`,
          stale: !discontinued, year: last.effective_year }
      : null;
  if (!msrpEntry) return { value: null, reason: "no_msrp", limitation: "No published MSRP on record." };
  if (estimate.value == null) return { value: null, reason: estimate.reason, limitation: "No market estimate to compare." };
  return {
    value: round1(((estimate.value - msrpEntry.price) / msrpEntry.price) * 100),
    vs: msrpEntry.vs,
    msrp_usd: msrpEntry.price, stale_baseline: msrpEntry.stale, reason: null,
    limitation: msrpEntry.stale
      ? `Measured against the ${msrpEntry.year} list price — this reference is still in production and its current list price is not on record, so the real premium is smaller.`
      : "MSRP as published by brand; excludes taxes and dealer discounts.",
  };
}

// (c) Price change over `years`, nominal + CPI-real
export function priceChange(comps, buildDate, years, cpi) {
  // We compare the most-recent window with the window `years` ago. For
  // thin markets (older cards, niche references) the strict 12-month
  // window never has 3 sales; we widen each side progressively.
  const nowWindows = [12, 24, 36, 60];
  const thenOffset = years * 12;
  let now = [], then = [], nowMonths = 0, thenMonths = 0;
  for (const m of nowWindows) {
    now = compsInWindow(comps, buildDate, m);
    if (now.length >= 3) { nowMonths = m; break; }
  }
  // The "then" window is `years` ago, but we widen if needed.
  for (const m of nowWindows) {
    then = compsInWindow(comps, buildDate, m, thenOffset);
    if (then.length >= 3) { thenMonths = m; break; }
  }
  if (now.length < 3 || then.length < 3) {
    return { nominal_pct: null, real_pct: null,
      reason: "insufficient_comps_in_period", n_now: now.length, n_then: then.length,
      limitation: `Needs ≥3 sales in both the current and the ${years}-years-ago window — only ${now.length} recent, ${then.length} from ${years} years ago.` };
  }
  const mNow = median(now.map((c) => c.price_usd));
  const mThen = median(then.map((c) => c.price_usd));
  const nominal = round1((mNow / mThen - 1) * 100);
  const end = new Date(buildDate); const past = new Date(buildDate);
  past.setMonth(past.getMonth() - years * 12);
  const cNow = cpiAt(cpi, monthKey(end.toISOString()));
  const cThen = cpiAt(cpi, monthKey(past.toISOString()));
  const real = cNow && cThen ? round1(((mNow / mThen) * (cThen / cNow) - 1) * 100) : null;
  return { nominal_pct: nominal, real_pct: real,
    n_now: now.length, n_then: then.length, window_now: nowMonths, window_then: thenMonths,
    reason: real == null ? "no_cpi" : null,
    limitation: `Windowed medians over ${nowMonths}-mo and ${thenMonths}-mo; not like-for-like condition pairs.` };
}

function cpiAt(cpi, ym) {
  if (!cpi?.observations) return null;
  // exact month, else walk back up to 6 months (CPI publishes with lag)
  for (let i = 0; i < 7; i++) {
    const d = new Date(ym + "-15"); d.setMonth(d.getMonth() - i);
    const k = d.toISOString().slice(0, 7);
    if (cpi.observations[k] != null) return cpi.observations[k];
  }
  return null;
}

// (d) Scarcity Index 0–100 — proxy composite; renormalizes over present signals.
export function scarcityIndex(card, brandProduction, buildDate) {
  const s = card.scarcity_inputs;
  const signals = [];
  signals.push({ key: "discontinued", max: 25, value: card.identity.produced.discontinued ? 25 : 0 });
  const le = s.limited_edition;
  if (le.is_limited) {
    signals.push({ key: "limited_edition", max: 25,
      value: le.stated_size ? Math.min(25, 25 * (1 - Math.log10(le.stated_size) / 5)) : 12 });
  } else {
    signals.push({ key: "limited_edition", max: 25, value: 0 });
  }
  const prod = brandProduction[card.identity.brand.toLowerCase()];
  if (prod?.annual_units) {
    // log-linear: 50k/yr → 15pts, 1.15M/yr → 2pts
    const lo = Math.log10(50000), hi = Math.log10(1150000);
    const t = Math.min(1, Math.max(0, (Math.log10(prod.annual_units) - lo) / (hi - lo)));
    signals.push({ key: "brand_tightness", max: 15, value: 15 - t * 13 });
  }
  const obs = (card.market_evidence.listing_observations || []).filter(
    (o) => daysBetween(buildDate, o.date) <= 183);
  if (obs.length) {
    const med = median(obs.map((o) => o.active_count));
    signals.push({ key: "availability", max: 20, value: Math.max(0, 20 - Math.log2(1 + med) * 3) });
  }
  if (s.waitlist_evidence?.length) signals.push({ key: "waitlist", max: 15, value: 15 });
  const maxSum = signals.reduce((a, x) => a + x.max, 0);
  const valSum = signals.reduce((a, x) => a + x.value, 0);
  const value = Math.round(Math.min(100, Math.max(0, (valSum / maxSum) * 100)));
  const tier = value >= 75 ? "Grail" : value >= 50 ? "Scarce" : value >= 25 ? "Limited" : "Common";
  return { value, tier, k_of: [signals.length, 5], reason: null,
    limitation: "Proxy index — no brand publishes per-reference production figures." };
}

// (e) Collectibility Index 0–100 — composite; renormalizes; degrades to k/5 disclosure.
export function collectibilityIndex(card, premium, scarcity, change5y) {
  const parts = [];
  if (premium.value != null) parts.push({ key: "premium", max: 30, value: Math.min(30, Math.max(0, premium.value / 2)) });
  parts.push({ key: "scarcity", max: 25, value: scarcity.value * 0.25 });
  const events = card.provenance_events.length;
  parts.push({ key: "provenance", max: 15, value: Math.min(15, Math.log2(1 + events) * 5) });
  const app = card.scarcity_inputs.auction_appearances_5y;
  if (app != null) parts.push({ key: "auction_presence", max: 15, value: Math.min(15, Math.log2(1 + app) * 4) });
  if (change5y.real_pct != null) parts.push({ key: "durability", max: 15, value: Math.min(15, Math.max(0, change5y.real_pct / 4)) });
  const maxSum = parts.reduce((a, x) => a + x.max, 0);
  const valSum = parts.reduce((a, x) => a + x.value, 0);
  return { value: Math.round(Math.min(100, Math.max(0, (valSum / maxSum) * 100))),
    k_of: [parts.length, 5], reason: null,
    limitation: "Composite of tracked public signals only; " +
      (parts.length < 5 ? `based on ${parts.length}/5 components.` : "all 5 components present.") };
}

// (f) Liquidity signal — sold-price count per year, averaged over the available
// window. Strict 12-month is too punishing for thin markets; we widen up to
// 36 months and present the rate honestly.
export function liquiditySignal(comps, buildDate) {
  let rate = 0, windowMonths = 0, window = 12;
  for (const m of [12, 24, 36]) {
    const w = compsInWindow(comps, buildDate, m);
    if (w.length > 0) { rate = w.length / (m / 12); window = m; windowMonths = m; break; }
  }
  const rateYr = Math.round(rate * 10) / 10;
  const tier = rateYr >= 12 ? "High" : rateYr >= 4 ? "Medium" : rateYr >= 1 ? "Low" : "Unknown";
  return {
    sales_per_year: rateYr, window_months: windowMonths, tier,
    reason: comps.length === 0 ? "no_comps" : null,
    limitation: `Counted from ${window}-month window of tracked venue sales; private sales and dealer trades are not in scope.` };
}

// (g) Data confidence tier
export function confidenceTier(comps, buildDate) {
  if (!comps.length) return { tier: null, reason: "no_comps", n: 0, venues: 0, newest: null };
  const w24 = compsInWindow(comps, buildDate, 24);
  const venues24 = new Set(w24.map((c) => c.venue)).size;
  const venuesAll = new Set(comps.map((c) => c.venue)).size;
  const newest = comps.map((c) => c.date).sort().at(-1);
  const age = daysBetween(buildDate, newest);
  const tier = (w24.length >= 10 && venues24 >= 3 && age <= 90) ? "A"
    : (comps.length >= 4 && venuesAll >= 2 && age <= 365) ? "B" : "C";
  return { tier, n: comps.length, venues: venuesAll, newest, reason: null };
}

// (h) Screen attention is a demand-side observation, never a scarcity input.
// Each exact-reference film/TV sighting contributes 20 transparent heuristic points,
// capped at five sightings. Pressure is the geometric mean of attention and scarcity:
// it is high only when both observed attention and constrained supply are high.
export function screenAttention(card, scarcity, screenSnapshot) {
  const events = (screenSnapshot?.sightings || []).filter((event) =>
    event.media_type !== "other" &&
    event.match_level === "exact_reference" &&
    event.matched_card_ids?.includes(card.id));
  if (!events.length) return {
    value: null, screen_count: 0, pressure: null, reason: "no_reference_level_screen_evidence",
    limitation: "No exact-reference film or television identification is on record. Family-level sightings are not scored.",
    price_response: { value: null, reason: "no_screen_event", n_before: 0, n_after: 0,
      limitation: "A price-response estimate needs a dated screen event and at least 3 comparable sales in both the 12 months before and after it." },
  };
  const value = Math.min(100, events.length * 20);
  return {
    value, screen_count: events.length,
    pressure: Math.round(Math.sqrt(scarcity.value * value)),
    reason: null,
    limitation: "Heuristic attention signal: 20 points per exact-reference film/TV sighting, capped at 100. It measures documented exposure, not audience size or causation.",
    price_response: { value: null, reason: "insufficient_event_window", n_before: 0, n_after: 0,
      limitation: "No causal price claim: this cohort lacks an exact release date plus at least 3 comparable sales in both the 12 months before and after exposure." },
  };
}

// (i) Price band — the tiered classification from the compiled 2026 collector research,
// applied to the card's best-available price. Descriptive shelving, not a valuation:
// the band names which market a reference trades in, and states which price it used.
export function marketBand(card, estimate, bandFramework) {
  const basis = estimate.value != null
    ? { value: estimate.value, from: "market estimate" }
    : card.retail.current_msrp_usd != null
      ? { value: card.retail.current_msrp_usd, from: "current retail" }
      : card.retail.msrp_history.length
        ? { value: card.retail.msrp_history.at(-1).price_usd, from: `${card.retail.msrp_history.at(-1).effective_year} retail` }
        : null;
  if (!basis) return { band: null, reason: "no_price_basis", limitation: "No price on record to place this reference in a band." };
  const bands = bandFramework?.bands ?? [];
  const hit = bands.find((b) => basis.value >= b.min_usd);
  if (!hit) return { band: null, reason: "no_price_basis", limitation: "No matching band in the framework." };
  return { band: hit.band, basis_usd: basis.value, basis: basis.from, note: hit.note, reason: null,
    limitation: `Band placed on ${basis.from}; it names a market segment, not a valuation.` };
}

export function computeAll(card, shared, buildDate) {
  const comps = card.market_evidence.comps.filter(isComparable);
  const estimate = marketEstimate(comps, buildDate);
  const premium = premiumToRetail(estimate, card.retail, card.identity.produced.discontinued);
  const change_1y = priceChange(comps, buildDate, 1, shared.cpi);
  const change_5y = priceChange(comps, buildDate, 5, shared.cpi);
  const scarcity = scarcityIndex(card, shared.brand_production, buildDate);
  const collectibility = collectibilityIndex(card, premium, scarcity, change_5y);
  const liquidity = liquiditySignal(comps, buildDate);
  const confidence = confidenceTier(comps, buildDate);
  const attention = screenAttention(card, scarcity, shared.screen_sightings);
  const stale = estimate.value != null && daysBetween(buildDate, estimate.as_of) > 365;
  const market_band = marketBand(card, estimate, shared.market_context?.band_framework);
  return { estimate: { ...estimate, stale }, premium, change_1y, change_5y,
    scarcity, collectibility, liquidity, confidence, attention, market_band, as_of_build: buildDate };
}
