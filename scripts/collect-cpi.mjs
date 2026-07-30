// FRED CPIAUCSL → data/shared/cpi_snapshot.json (committed for deterministic builds).
// Keyless CSV endpoint — no API key needed. Run: node scripts/collect-cpi.mjs
import { writeFileSync } from "node:fs";

const url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL&cosd=2010-01-01";
const res = await fetch(url);
if (!res.ok) { console.error(`FRED ${res.status}`); process.exit(1); }
const csv = await res.text();
const observations = {};
for (const line of csv.trim().split("\n").slice(1)) {
  const [date, value] = line.split(",");
  if (value && value !== ".") observations[date.slice(0, 7)] = Number(value);
}
if (Object.keys(observations).length < 100) { console.error("CPI response looks wrong — refusing to overwrite"); process.exit(1); }

const out = {
  series: "CPIAUCSL",
  source_url: "https://fred.stlouisfed.org/series/CPIAUCSL",
  retrieved: new Date().toISOString().slice(0, 10),
  observations,
};
writeFileSync(new URL("../data/shared/cpi_snapshot.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(`✓ CPI snapshot: ${Object.keys(observations).length} months, latest ${Object.keys(observations).sort().at(-1)}`);
