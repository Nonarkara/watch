// Card validator — the invariant gate. Importable + CLI: node scripts/validate_card.mjs data/cards/x.json
import { readFileSync } from "node:fs";

const TIERS = ["trinity", "crown", "haute", "core", "attainable"];
const VENUES = ["phillips", "christies", "sothebys", "antiquorum", "bonhams", "ebay", "other_auction"];
const BOX = ["full_set", "box_only", "papers_only", "watch_only", null];
const isUrl = (u) => typeof u === "string" && /^https?:\/\/.+\..+/.test(u);
// YYYY alone is legal for provenance/waitlist dates — honest when only the year is known.
const isDate = (d) => typeof d === "string" && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(d) && !isNaN(new Date(d));

export function validateCard(card, { id, buildDate = "2099-01-01" } = {}) {
  const errs = [];
  const req = (cond, msg) => { if (!cond) errs.push(msg); };

  req(card.schema_version === 1, "schema_version must be 1");
  if (id) req(card.id === id, `id "${card.id}" must equal filename "${id}"`);
  req(!("computed" in card), "cards must not contain a computed block — the build owns it");

  const idn = card.identity || {};
  req(typeof idn.brand === "string" && idn.brand, "identity.brand required");
  req(typeof idn.reference === "string" && idn.reference, "identity.reference required");
  req(TIERS.includes(idn.tier), `identity.tier must be one of ${TIERS.join("|")}`);
  req(idn.produced && Number.isInteger(idn.produced.start_year), "identity.produced.start_year required");
  req(typeof idn.produced?.discontinued === "boolean", "identity.produced.discontinued must be boolean");
  if (idn.produced?.discontinued) req(Number.isInteger(idn.produced.end_year), "discontinued needs end_year");
  else req(idn.produced?.end_year == null, "in-production card must have end_year null");

  const r = card.retail || {};
  req(Array.isArray(r.msrp_history), "retail.msrp_history must be an array");
  for (const [i, m] of (r.msrp_history || []).entries()) {
    req(Number.isInteger(m.effective_year), `msrp_history[${i}].effective_year`);
    req(m.price_usd > 0, `msrp_history[${i}].price_usd > 0`);
    req(isUrl(m.source_url), `msrp_history[${i}].source_url must be a URL`);
  }
  if (idn.produced?.discontinued) req(r.current_msrp_usd == null, "discontinued card must have current_msrp_usd null");

  const ev = card.market_evidence || {};
  req(Array.isArray(ev.comps), "market_evidence.comps must be an array");
  for (const [i, c] of (ev.comps || []).entries()) {
    req(isDate(c.date), `comps[${i}].date must be YYYY-MM-DD`);
    req(new Date(c.date) <= new Date(buildDate), `comps[${i}].date in the future`);
    req(typeof c.price_usd === "number" && c.price_usd > 0, `comps[${i}].price_usd > 0`);
    req(VENUES.includes(c.venue), `comps[${i}].venue invalid`);
    req(isUrl(c.url), `comps[${i}].url must be a URL — no unsourced sales`);
    req(BOX.includes(c.box_papers ?? null), `comps[${i}].box_papers invalid`);
  }

  const s = card.scarcity_inputs || {};
  req(s.limited_edition && typeof s.limited_edition.is_limited === "boolean", "scarcity_inputs.limited_edition.is_limited");
  if (s.limited_edition?.stated_size != null) req(isUrl(s.limited_edition.source_url), "limited_edition with stated_size needs source_url");
  for (const [i, w] of (s.waitlist_evidence || []).entries())
    req(isDate(w.date) && isUrl(w.source_url), `waitlist_evidence[${i}] needs date + source_url`);

  for (const [i, p] of (card.provenance_events || []).entries()) {
    req(isDate(p.date), `provenance_events[${i}].date`);
    req(isUrl(p.source_url), `provenance_events[${i}].source_url required — provenance without a source is rumor`);
    req(typeof p.description === "string" && p.description.length > 10, `provenance_events[${i}].description`);
  }

  req(card.narrative && typeof card.narrative.story === "string" && card.narrative.story.length > 20, "narrative.story required");
  req(card.meta && isDate(card.meta.curated_date), "meta.curated_date required");
  return errs;
}

if (process.argv[1].endsWith("validate_card.mjs")) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error("usage: node scripts/validate_card.mjs <card.json>..."); process.exit(2); }
  let bad = 0;
  for (const f of files) {
    const card = JSON.parse(readFileSync(f, "utf8"));
    const id = f.split("/").at(-1).replace(/\.json$/, "");
    const errs = validateCard(card, { id, buildDate: new Date().toISOString().slice(0, 10) });
    if (errs.length) { bad++; console.error(`✗ ${f}\n  - ${errs.join("\n  - ")}`); }
    else console.log(`✓ ${f}`);
  }
  process.exit(bad ? 1 : 0);
}
