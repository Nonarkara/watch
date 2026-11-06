/**
 * Bake a city's real blocks into a compact night model.
 *
 * The technique comes from Location Scout (どこでもロケハン): a place is
 * turned into a 3D model from OpenStreetMap's own building footprints, and
 * then drawn as it would be seen at night. The data is the city's, not an
 * artist's: the outline of a real block is the outline of that block.
 *
 * Overpass is the source. It needs an identifying User-Agent — a
 * browser-shaped one is refused with 406, which is Overpass refusing to be
 * scraped by a page rather than refusing to answer.
 *
 *   node scripts/build_city_model.mjs                  # every city
 *   node scripts/build_city_model.mjs bangkok tokyo    # just these
 *   node scripts/build_city_model.mjs --radius 1600    # a wider city
 *
 * Output: public/data/city/<slug>.json, plus index.json listing the cities.
 *
 * The model is deliberately small. The camera flies from an aerial view
 * down to the street, so what matters is the block you are standing in and
 * the silhouette of the city around it — not every rooftop in the
 * municipality. Rings are simplified to metres, missing heights remain flat,
 * and the result is one file per city that
 * the page fetches when the layer asks for it.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { explicitHeight, isBuildingWay } from '../src/lib/city-model.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'public', 'data', 'city');

const UA =
  'TimePopCityModel/1.0 (https://watch.nonarkara.org; OpenStreetMap building model for the site background)';

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf('--' + n);
  if (i === -1) return d;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const radiusM = Number(arg('radius', 1500));
if (!Number.isFinite(radiusM) || radiusM < 100 || radiusM > 3000) throw new Error('--radius must be between 100 and 3000 metres');
const only = argv.filter((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--radius');

/**
 * The cities. Bangkok is the default because the site is Thai; the rest are
 * the majors a reader would want to compare it with.
 *
 * The centre is chosen for what stands around it: a dense, legible skyline
 * with towers close enough to read from the pavement.
 */
const CITIES = [
  { slug: 'bangkok', name: 'Bangkok', country: 'Thailand', lat: 13.7337, lon: 100.5610, where: 'Sukhumvit' },
  { slug: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6595, lon: 139.7005, where: 'Shibuya Crossing' },
  { slug: 'new-york', name: 'New York', country: 'United States', lat: 40.7549, lon: -73.9840, where: 'Midtown Manhattan' },
  { slug: 'london', name: 'London', country: 'United Kingdom', lat: 51.5136, lon: -0.0984, where: 'The City' },
];

/* ── geometry ───────────────────────────────────────────────────────────── */

/** Degrees to metres, around a reference point. Good enough for a city block. */
function project(lat, lon, lat0, lon0) {
  const M = 111320;
  const mPerDegLon = M * Math.cos((lat0 * Math.PI) / 180);
  return [(lon - lon0) * mPerDegLon, (lat - lat0) * M];
}

/**
 * Drop points that do not change the shape. A footprint with 40 nodes
 * usually has 6 that matter; at a metre's tolerance the rest are noise.
 */
function simplify(points, tol = 1.6) {
  if (points.length < 4) return points;
  const keep = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [px, py] = keep[keep.length - 1];
    const [nx, ny] = points[i + 1];
    const cross = (x - px) * (ny - py) - (y - py) * (nx - px);
    if (Math.abs(cross) > tol * Math.hypot(nx - px, ny - py) || Math.hypot(x - px, y - py) > tol * 3) {
      keep.push([x, y]);
    }
  }
  keep.push(points[points.length - 1]);
  return keep;
}

/** Shoelace area — used to drop the slivers and to sort the faces. */
function area(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/**
 * Wind every ring the same way round, so a wall's outward normal is the
 * same for every building in the city. OpenStreetMap ways are wound
 * either way; a wall whose normal points inward is a wall the renderer
 * thinks is facing away, and the reader standing beside it sees through it.
 */
function orient(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a > 0 ? ring : ring.slice().reverse();
}

/* ── heights ────────────────────────────────────────────────────────────── */

// No floor-count or building-type fallback: only explicit source heights.

/* ── the fetch ──────────────────────────────────────────────────────────── */

async function overpass(city) {
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((city.lat * Math.PI) / 180));
  const bbox = [
    (city.lat - dLat).toFixed(5), (city.lon - dLon).toFixed(5),
    (city.lat + dLat).toFixed(5), (city.lon + dLon).toFixed(5),
  ].join(',');
  const query = `[out:json][timeout:180];(way["building"](${bbox});way["highway"](${bbox}););out geom;`;
  const endpoints = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = `${endpoints[(attempt - 1) % endpoints.length]}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.elements) || json.remark) throw new Error('incomplete Overpass response');
      const archive = join(ROOT, 'data/.harvest/city');
      mkdirSync(archive, { recursive: true });
      writeFileSync(join(archive, `${city.slug}.json.gz`), gzipSync(JSON.stringify(json)));
      return { elements: json.elements || [], ways: json.ways || [] };
    } catch (err) {
      if (attempt === 3) throw err;
      const wait = 4000 * attempt;
      console.log(`  · retry ${attempt} in ${wait / 1000}s (${err.message})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return null;
}

/* ── the model ──────────────────────────────────────────────────────────── */

/**
 * The roads. The camera has to end its descent standing on a street and
 * looking along it, so the streets are part of the model and not a
 * suggestion: the line the camera looks down is a real road with real
 * buildings on both sides of it.
 */
function roads(city, raw) {
  const out = [];
  const seen = new Set();
  const WIDTH = {
    motorway: 22, trunk: 18, primary: 15, secondary: 13, tertiary: 11,
    residential: 8, unclassified: 7, service: 5, pedestrian: 6, footway: 3,
  };
  for (const el of raw.elements || []) {
    const t = el.tags || {};
    const kind = t.highway;
    if (!kind || !el.geometry || el.geometry.length < 2) continue;
    if (t.area === 'yes' || t.tunnel === 'yes' || t.layer) continue;
    const width = WIDTH[kind] ?? 7;
    // A footpath is not a street the camera stands in, and there are five
    // times as many of them as there are roads. They cost the same bytes as
    // a motorway and are never seen.
    if (width < 6) continue;
    const pts = el.geometry.map((g) => project(g.lat, g.lon, city.lat, city.lon));
    const line = simplify(pts, 2.2).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
    if (line.length < 2) continue;
    const key = kind + ':' + line.map((p) => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ k: kind, w: width, r: line });
  }
  // The widest roads first, so a motorway is never hidden by a footpath.
  out.sort((a, b) => b.w - a.w);
  return out;
}

/**
 * A deterministic hash, so the lit windows are the same windows on every
 * visit and on every machine. A city that rearranged its lights each reload
 * would be a picture, not a place.
 */
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function build(city, raw) {
  const out = [];
  const seen = new Set();
  for (const el of raw.elements || []) {
    if (!isBuildingWay(el)) continue;
    const geom = el.geometry;
    if (!Array.isArray(geom) || geom.length < 3) continue;
    const tags = el.tags || {};
    if (tags.building === 'no' || tags.location === 'underground') continue;

    let ring = geom.map((g) => project(g.lat, g.lon, city.lat, city.lon));
    // OSM way geometry repeats the first point at the end; the renderer closes
    // the ring itself.
    if (ring.length > 2) {
      const a = ring[0], b = ring[ring.length - 1];
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.4) ring = ring.slice(0, -1);
    }
    ring = simplify(ring);
    if (ring.length < 3) continue;
    const a = area(ring);
    if (a < 12 || a > 90000) continue; // a sliver or a stadium-sized footprint

    const key = ring.map((p) => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(' ');
    if (seen.has(key)) continue;
    seen.add(key);

    const height = explicitHeight(tags);
    const seed = hash32(city.slug + ':' + key);
    out.push({
      r: orient(ring).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]),
      h: Math.round((height.height ?? 0) * 10) / 10,
      osm_id: el.id,
      height_source: height.source,
      // How lit this building is: 0 is a dark shell, 1 is every window on.
      l: ((seed % 1000) / 1000),
      s: seed,
    });
  }
  // Painter's algorithm: the camera looks down at the city, so the far
  // buildings are drawn first and the near ones over them.
  out.sort((p, q) => {
    const pa = p.r.reduce((s, [x, y]) => s + x + y, 0) / p.r.length;
    const qa = q.r.reduce((s, [x, y]) => s + x + y, 0) / q.r.length;
    return pa - qa;
  });
  return out;
}

/**
 * Where the camera ends up: on the widest street near the centre, looking
 * along it. The descent is not a flight to an arbitrary point; it ends on a
 * real pavement with a real street in front of it.
 */
function streetEnd(city, roadList) {
  if (!roadList.length) {
    return { eye: [0, 120, 1.7], look: [0, -600, 2.6] };
  }
  let best = null;
  for (const road of roadList) {
    if (road.w < 8) continue;
    for (let i = 0; i < road.r.length; i++) {
      const p = road.r[i];
      const d = Math.hypot(p[0], p[1]);
      if (!best || d < best.d) {
        // The direction of travel along the road at this point.
        const a = road.r[Math.max(0, i - 1)];
        const b = road.r[Math.min(road.r.length - 1, i + 1)];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        best = { d, p, dir: [(b[0] - a[0]) / len, (b[1] - a[1]) / len], w: road.w };
      }
    }
  }
  if (!best) return { eye: [0, 120, 1.7], look: [0, -600, 2.6] };
  const [dx, dy] = best.dir;
  // Stand in the middle of the carriageway and look along it.
  const eye = [best.p[0] - dx * 6, best.p[1] - dy * 6, 1.7];
  const look = [best.p[0] + dx * 600, best.p[1] + dy * 600, 2.4];
  return { eye, look };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const wanted = CITIES.filter((c) => !only.length || only.includes(c.slug));
  if (!wanted.length) {
    console.error(`no city matched. known: ${CITIES.map((c) => c.slug).join(', ')}`);
    process.exit(1);
  }
  const index = [];
  let failures = 0;
  for (const city of wanted) {
    process.stdout.write(`· ${city.name} (${city.where}) … `);
    const t0 = Date.now();
    let raw;
    try {
      raw = await overpass(city);
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failures++;
      continue;
    }
    const buildings = build(city, raw);
    const roadList = roads(city, raw);
    const end = streetEnd(city, roadList);
    const payload = {
      slug: city.slug,
      name: city.name,
      country: city.country,
      where: city.where,
      origin: [city.lat, city.lon],
      radius: radiusM,
      // The camera path, in the model's own metres. The first frame is a
      // distant look down at the city; the last is a person on the street
      // looking along it. The renderer interpolates between them.
      camera: {
        // The opening frame: a drone's height above the blocks, tilted far
        // enough down to read the skyline but not so far that the sky goes.
        from: { eye: [-520, 380, 330], look: [60, -140, 90] },
        to: end,
      },
      built_at: new Date().toISOString(),
      source: `OpenStreetMap via Overpass · ${city.name} ${city.where} · r=${radiusM}m`,
      buildings,
      roads: roadList,
    };
    const file = join(OUT, `${city.slug}.json`);
    writeFileSync(file, JSON.stringify(payload));
    const bytes = Buffer.byteLength(JSON.stringify(payload));
    console.log(`${buildings.length} buildings, ${(bytes / 1024).toFixed(0)}KB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    index.push({
      slug: city.slug, name: city.name, country: city.country, where: city.where,
      origin: payload.origin, radius: radiusM, buildings: buildings.length,
      bytes, source: payload.source,
    });
  }
  if (index.length) {
    const indexFile = join(OUT, 'index.json');
    let prev = [];
    if (existsSync(indexFile)) {
      try {
        const raw = JSON.parse(readFileSync(indexFile, 'utf8'));
        prev = Array.isArray(raw) ? raw : (raw.cities || []);
      } catch { prev = []; }
    }
    const merged = [...prev.filter((p) => !index.some((n) => n.slug === p.slug)), ...index];
    writeFileSync(indexFile, JSON.stringify({ built_at: new Date().toISOString(), cities: merged }, null, 1));
    console.log(`\n✓ ${index.length} city model(s) → public/data/city/`);
  }
  if (failures) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
