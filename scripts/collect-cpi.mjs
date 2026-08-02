// FRED CPIAUCSL → data/shared/cpi_snapshot.json (committed for deterministic builds).
// Keyless CSV endpoint — no API key needed. Run: node scripts/collect-cpi.mjs
//
// Refactored to use the shared fetch utility (retry + backoff + mtime tracking)
// and to honour --dry-run so a stale CPI snapshot can be inspected without
// overwriting the committed file.
import { writeFileSync } from "node:fs";
import { fetchText, recordFetch, isDryRun } from "./lib/fetch.mjs";

const SOURCE_KEY = "fred-cpiau-csl";
const SOURCE_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL&cosd=2010-01-01";
const SNAPSHOT_URL = "https://fred.stlouisfed.org/series/CPIAUCSL";

console.log("Fetching FRED CPIAUCSL…");
const { text, error } = await fetchText(SOURCE_URL, { maxRetries: 3, baseDelayMs: 2000 });
if (error) {
  console.error("FRED fetch failed:", error.message);
  recordFetch(SOURCE_KEY, { last_status: "fetch_failed", error: error.message });
  process.exit(1);
}
const observations = {};
for (const line of text.trim().split("\n").slice(1)) {
  const [date, value] = line.split(",");
  if (value && value !== ".") observations[date.slice(0, 7)] = Number(value);
}
if (Object.keys(observations).length < 100) {
  console.error(`CPI response looks wrong (${Object.keys(observations).length} months) — refusing to overwrite`);
  recordFetch(SOURCE_KEY, { last_status: "shape_drift" });
  process.exit(1);
}

const out = {
  series: "CPIAUCSL",
  source_url: SNAPSHOT_URL,
  retrieved: new Date().toISOString().slice(0, 10),
  observations,
};

const snapshotFile = new URL("../data/shared/cpi_snapshot.json", import.meta.url);
if (isDryRun()) {
  console.log(`[dry-run] would write ${Object.keys(observations).length} months, latest ${Object.keys(observations).sort().at(-1)}`);
  recordFetch(SOURCE_KEY, { last_status: "dry_run" });
  process.exit(0);
}

writeFileSync(snapshotFile, JSON.stringify(out, null, 2));
recordFetch(SOURCE_KEY, { last_status: "ok", months: Object.keys(observations).length });
console.log(`✓ CPI snapshot: ${Object.keys(observations).length} months, latest ${Object.keys(observations).sort().at(-1)}`);
