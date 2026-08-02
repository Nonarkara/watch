// Link integrity — fails if any internal <Link to>/PATHS target has no matching route.
// A dead nav link renders a blank page, which on a reference site reads as broken data.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).pathname;
const routes = new Set(
  [...readFileSync(join(ROOT, "src/main.tsx"), "utf8").matchAll(/<Route path="([^"]+)"/g)]
    .map((m) => "/" + m[1]).concat(["/"]));
const dynamic = [...routes].filter((r) => r.includes(":")).map((r) => r.split("/:")[0]);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

const bad = [];
for (const file of walk(join(ROOT, "src"))) {
  const src = readFileSync(file, "utf8");
  const targets = [
    ...[...src.matchAll(/to=["'{]+(\/[a-z0-9\-/]*)/g)].map((m) => m[1]),
    ...[...src.matchAll(/to: '(\/[a-z0-9\-/]*)'/g)].map((m) => m[1]),
  ];
  for (const t of targets) {
    const clean = t.split("#")[0].replace(/\/$/, "") || "/";
    if (routes.has(clean)) continue;
    if (dynamic.some((d) => clean.startsWith(d) && clean !== d)) continue;
    bad.push(`${file.replace(ROOT, "")} → ${clean}`);
  }
}
assert.deepEqual(bad, [], `internal links with no matching route:\n  ${bad.join("\n  ")}`);
console.log(`✓ every internal link resolves (${routes.size} routes)`);
