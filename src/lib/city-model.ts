export type CityBuilding = {
  r: [number, number][]; h: number; l: number; s: number;
  osm_id?: number; height_source?: { tag: string; value: string } | null;
}
export type CityModel = {
  slug: string; name: string; where: string; origin: [number, number]; radius: number;
  camera: { from: { eye: [number, number, number]; look: [number, number, number] };
    to: { eye: [number, number, number]; look: [number, number, number] } };
  buildings: CityBuilding[];
  roads: { k: string; w: number; r: [number, number][] }[];
}

/** OSM heights are metres unless an explicit unit says otherwise. Levels and
 * building types do not establish a height. A missing height remains null. */
export function explicitHeight(tags: Record<string, unknown>): { height: number | null; source: CityBuilding['height_source'] } {
  for (const tag of ['height', 'building:height']) {
    if (tags[tag] == null) continue;
    const value = String(tags[tag]).trim();
    const metres = /^(\d+(?:\.\d+)?)\s*(?:m)?$/.exec(value);
    const feet = /^(\d+(?:\.\d+)?)\s*(?:ft|')(?:(\d+(?:\.\d+)?)")?$/.exec(value);
    const height = metres ? Number(metres[1]) : feet ? Number(feet[1]) * 0.3048 + Number(feet[2] ?? 0) * 0.0254 : null;
    if (height != null && height > 0 && height < 1000) return { height, source: { tag, value } };
  }
  return { height: null, source: null };
}

export function isBuildingWay(element: { type?: string; tags?: Record<string, unknown>; geometry?: { lat: number; lon: number }[] }): boolean {
  const g = element.geometry;
  const tags = element.tags;
  return element.type === 'way' && Boolean(tags?.building && tags.building !== 'no')
    && tags?.location !== 'underground' && Array.isArray(g) && g.length >= 4
    && g.every((p) => Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lon) && Math.abs(p.lon) <= 180)
    && g[0].lat === g.at(-1)!.lat && g[0].lon === g.at(-1)!.lon;
}

const vector = (v: unknown, length: number): v is number[] => Array.isArray(v) && v.length === length && v.every((n) => typeof n === 'number' && Number.isFinite(n));
const ring = (r: unknown, min: number) => Array.isArray(r) && r.length >= min && r.length <= 2000 && r.every((p) => vector(p, 2));

/** Reject malformed geometry at the fetch boundary. Legacy heights have no
 * evidence metadata and must stay flat until a source-backed rebuild. */
export function readCityModel(value: unknown, slug: string): CityModel | null {
  if (!value || typeof value !== 'object') return null;
  const m = value as CityModel;
  if (m.slug !== slug || !/^[a-z0-9-]+$/.test(m.slug) || !vector(m.origin, 2)
    || !Number.isFinite(m.radius) || m.radius <= 0 || m.radius > 10000
    || !vector(m.camera?.from?.eye, 3) || !vector(m.camera?.from?.look, 3)
    || !vector(m.camera?.to?.eye, 3) || !vector(m.camera?.to?.look, 3)
    || !Array.isArray(m.buildings) || m.buildings.length > 50000
    || !Array.isArray(m.roads) || m.roads.length > 50000) return null;
  if (m.buildings.some((b) => !b || !ring(b.r, 3) || !Number.isFinite(b.h) || b.h < 0 || b.h >= 1000
    || !Number.isFinite(b.l) || !Number.isFinite(b.s))
    || m.roads.some((r) => !r || !ring(r.r, 2) || !Number.isFinite(r.w) || r.w <= 0 || r.w > 100)) return null;
  return { ...m, buildings: m.buildings.map((b) => {
    const evidence = b.height_source;
    const parsed = evidence && ['height', 'building:height'].includes(evidence.tag)
      ? explicitHeight({ [evidence.tag]: evidence.value }).height : null;
    const trusted = parsed != null && Number.isInteger(b.osm_id) && Math.abs(parsed - b.h) <= 0.051;
    return { ...b, h: trusted ? b.h : 0 };
  }) };
}
