import { useEffect, useRef } from 'react';

/**
 * THE NIGHT CITY — the page's background, drawn from the city's own blocks.
 *
 * The model is the city's: every wall is an OpenStreetMap building
 * footprint, every street is an OpenStreetMap way, and the camera's last
 * frame stands on a real pavement looking down a real road. The technique
 * is Location Scout's (どこでもロケハン): a place is built from the map's
 * own data and then looked at from a distance, at street level, or
 * anywhere between.
 *
 * What is drawn is a night. Greyscale, because the site's colours have to
 * stand out on it: coral, yellow and teal are loud against a grey city,
 * and they are the only colour on the page. The lights are white dots —
 * one per lit window, decided by a hash of the building, so the same
 * windows are lit on every visit.
 *
 * The camera is the scroll. At the top of the page it is above the city,
 * looking down at the skyline. As the reader scrolls it tilts further
 * down and descends, and by the foot of the page it is on the street.
 *
 * No canvas is drawn for a reader who asked for less motion: with
 * `prefers-reduced-motion` the layer paints one still frame and stops. It
 * is a background; it is never in the way of the work.
 */

export type CityModel = {
  slug: string;
  name: string;
  where: string;
  origin: [number, number];
  radius: number;
  camera: {
    from: { eye: [number, number, number]; look: [number, number, number] };
    to: { eye: [number, number, number]; look: [number, number, number] };
  };
  buildings: { r: [number, number][]; h: number; l: number; s: number }[];
  roads: { k: string; w: number; r: [number, number][] }[];
};

type Vec3 = [number, number, number];
/** A point in camera space: x right, y up, z into the screen. */
type Cam = [number, number, number];

const NEAR = 0.4;

/* ── camera ─────────────────────────────────────────────────────────────── */

function sub(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a: Vec3, b: Vec3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function smooth(t: number): number { return t * t * (3 - 2 * t); }

/**
 * Three keys: the city seen from off, the same city from directly above the
 * street it ends on, and the pavement itself. The camera does not fly
 * through the buildings — it descends from above them and lands.
 */
function cameraAt(model: CityModel, t: number): { eye: Vec3; look: Vec3 } {
  const far = model.camera.from;
  const street = model.camera.to;
  // The middle of the descent: high above the street the camera ends on,
  // looking straight down at the place it will land. So the tilt DEEPENS as
  // the camera falls, and then levels out when a person is standing on the
  // pavement looking along the road.
  const midEye: Vec3 = [street.eye[0] + 90, street.eye[1] + 90, 165];
  const midLook: Vec3 = [street.eye[0], street.eye[1], 0];
  if (t < 0.58) {
    const k = smooth(t / 0.58);
    return { eye: mix(far.eye, midEye, k), look: mix(far.look, midLook, k) };
  }
  const k = smooth((t - 0.58) / 0.42);
  return { eye: mix(midEye, street.eye, k), look: mix(midLook, street.look, k) };
}

/* ── the hash that decides which windows are lit ────────────────────────── */

function hash32(n: number): number {
  let h = n | 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/* ── the night ──────────────────────────────────────────────────────────── */

const SKY_TOP = '#05060a';
const SKY_HORIZON = '#141821';
const GROUND = '#08090c';
const EDGE = 'rgba(186,198,214,0.22)';
const WINDOW = 'rgba(255,255,255,0.95)';
const ROAD = '#1b1f27';
const LAMP = 'rgba(255,255,255,0.42)';

export default function CityLayer({
  city,
  className,
  opacity = 1,
}: {
  city: string;
  className?: string;
  opacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<CityModel | null>(null);
  const progressRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    fetch(`/data/city/${city}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: CityModel | null) => {
        if (!alive || !m) return;
        modelRef.current = m;
        draw();
      })
      .catch(() => { /* the page is fine without the city */ });

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function progress(): number {
      // ?cityt= pins the camera at one point of the journey, so a single
      // frame of the descent can be looked at without scrolling a whole page.
      const pin = new URLSearchParams(window.location.search).get('cityt');
      if (pin !== null) {
        const n = parseFloat(pin);
        if (Number.isFinite(n)) return Math.min(1, Math.max(0, n));
      }
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return 0;
      return Math.min(1, Math.max(0, window.scrollY / max));
    }

    function draw() {
      const model = modelRef.current;
      if (!model) return;
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      if (!w || !h) return;
      paint(ctx!, model, reduced ? 0 : progressRef.current, w, h);
    }

    function onScroll() {
      progressRef.current = progress();
      if (reduced) return;
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        draw();
      });
    }

    size();
    progressRef.current = progress();
    draw();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { size(); draw(); });
    return () => {
      alive = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('scroll', onScroll);
    };
  }, [city, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ opacity, position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ── the painting ───────────────────────────────────────────────────────── */

/**
 * Clip a polygon in camera space to the near plane.
 *
 * A building the reader is standing next to has its corners BEHIND the
 * camera. Dropping the whole building for that reason loses the walls that
 * are the point of standing on a street at night, so the polygon is cut at
 * the near plane instead of thrown away.
 */
function clipNear(poly: Cam[]): Cam[] {
  const out: Cam[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const aIn = a[2] >= NEAR;
    const bIn = b[2] >= NEAR;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = (NEAR - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
    }
  }
  return out;
}

function paint(ctx: CanvasRenderingContext2D, model: CityModel, t: number, W: number, H: number) {
  const t0 = performance.now();
  const { eye, look } = cameraAt(model, t);
  const fwd = norm(sub(look, eye));
  const right = norm(cross(fwd, [0, 0, 1]));
  const up = cross(right, fwd);
  const cx = W / 2;
  const cy = H / 2;
  const f = H / 2 / Math.tan((55 * Math.PI) / 180 / 2);

  /** World point to camera space. */
  const toCam = (p: Vec3): Cam => {
    const d = sub(p, eye);
    return [dot(d, right), dot(d, up), dot(d, fwd)];
  };
  /** Camera space to the screen. */
  const toScreen = (v: Cam): [number, number] => [cx + (v[0] / v[2]) * f, cy - (v[1] / v[2]) * f];

  ctx.clearRect(0, 0, W, H);

  // The horizon: the ground plane at infinity. Everything above it is sky.
  const groundDir = norm([fwd[0], fwd[1], 0]);
  const hz = toCam([eye[0] + groundDir[0] * 1e7, eye[1] + groundDir[1] * 1e7, eye[2]]);
  const horizonY = hz[2] >= NEAR ? cy - (hz[1] / hz[2]) * f : -1e5;

  const skyTop = Math.max(0, Math.min(H, horizonY));
  if (skyTop > 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, skyTop);
    sky.addColorStop(0, SKY_TOP);
    sky.addColorStop(1, SKY_HORIZON);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, skyTop);
  }
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, skyTop, W, H - skyTop);

  // The streets, widest first, so a motorway is never hidden by a footpath.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const road of model.roads) {
    if (road.w < 6) continue;
    drawRoad(ctx, road, toCam, toScreen, f);
  }

  // The buildings, painted back to front: the far block first, the near
  // block over it.
  const draws: { d: number; b: (typeof model.buildings)[number] }[] = [];
  for (const b of model.buildings) {
    const c = centroid(b.r);
    const d = Math.hypot(c[0] - eye[0], c[1] - eye[1]);
    if (d > model.radius * 1.7) continue;
    // Cull by the WHOLE footprint, not by its centre. A building the reader
    // is standing beside has its centre at the camera's own depth — behind
    // the near plane — and testing the centre alone throws away every wall
    // on either side of the street, which is the whole of a street view.
    let maxZ = -Infinity;
    for (const p of b.r) {
      const v = toCam([p[0], p[1], 0]);
      if (v[2] > maxZ) maxZ = v[2];
    }
    if (maxZ < NEAR) continue;
    const r = footprintRadius(b.r);
    const px = (r / maxZ) * f;
    if (px < 0.45 && maxZ > 40) continue;
    draws.push({ d, b });
  }
  draws.sort((a, z) => z.d - a.d);

  const MAX = 2600;
  const step = draws.length > MAX ? draws.length / MAX : 1;
  const limit = Math.ceil(draws.length / step);

  ctx.lineWidth = 1;
  for (let i = 0; i < limit; i++) {
    drawBuilding(ctx, draws[Math.floor(i * step)].b, toCam, toScreen, eye);
  }
  if (typeof window !== 'undefined') {
    (window as unknown as { __cityPaintMs?: number }).__cityPaintMs = Math.round(performance.now() - t0);
  }
  if (typeof window !== 'undefined' && window.location.search.includes('citydebug')) {
    console.info('[city] paint', Math.round(performance.now() - t0), 'ms', draws.length, 'buildings');
  }
}

/** The sign of the shoelace: which way round the ring is wound. */
function signedArea(ring: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function centroid(ring: [number, number][]): [number, number] {
  let x = 0, y = 0;
  for (const p of ring) { x += p[0]; y += p[1]; }
  return [x / ring.length, y / ring.length];
}
function footprintRadius(ring: [number, number][]): number {
  const c = centroid(ring);
  let r = 0;
  for (const p of ring) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1]));
  return r || 1;
}

function drawRoad(
  ctx: CanvasRenderingContext2D,
  road: { k: string; w: number; r: [number, number][] },
  toCam: (p: Vec3) => Cam,
  toScreen: (v: Cam) => [number, number],
  f: number,
) {
  const pts: Cam[] = road.r.map((p) => toCam([p[0], p[1], 0]));
  ctx.beginPath();
  let started = false;
  let depth = 1;
  for (let i = 0; i < pts.length; i++) {
    const v = pts[i];
    if (v[2] < NEAR) { started = false; continue; }
    const [sx, sy] = toScreen(v);
    depth = v[2];
    if (!started) { ctx.moveTo(sx, sy); started = true; }
    else ctx.lineTo(sx, sy);
  }
  if (!started) return;
  ctx.strokeStyle = ROAD;
  ctx.lineWidth = Math.max(1, (road.w / depth) * f);
  ctx.stroke();

  // The line of street lamps down the middle of the road.
  ctx.strokeStyle = LAMP;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  b: { r: [number, number][]; h: number; l: number; s: number },
  toCam: (p: Vec3) => Cam,
  toScreen: (v: Cam) => [number, number],
  eye: Vec3,
) {
  const ring = b.r;
  const n = ring.length;
  if (n < 3) return;

  const ringIsCCW = signedArea(ring) > 0;
  const baseCam = ring.map((p) => toCam([p[0], p[1], 0]));
  const topCam = ring.map((p) => toCam([p[0], p[1], b.h]));

  // The walls that face the camera. A wall that is cut by the near plane is
  // still a wall the reader is looking at.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = ring[i];
    const c = ring[j];
    const dx = c[0] - a[0];
    const dy = c[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    // The outward normal of an edge. OpenStreetMap ways are wound either
    // way round, and a wall whose normal points INWARD is culled — which
    // loses every wall the reader is standing next to.
    const out = ringIsCCW ? 1 : -1;
    const nx = (dy / len) * out;
    const ny = (-dx / len) * out;
    if (nx * (eye[0] - a[0]) + ny * (eye[1] - a[1]) <= 0) continue;

    const quad = clipNear([baseCam[i], baseCam[j], topCam[j], topCam[i]]);
    if (quad.length < 3) continue;
    ctx.beginPath();
    const s0 = toScreen(quad[0]);
    ctx.moveTo(s0[0], s0[1]);
    for (let k = 1; k < quad.length; k++) {
      const s = toScreen(quad[k]);
      ctx.lineTo(s[0], s[1]);
    }
    ctx.closePath();
    const lit = Math.max(0, -(nx * 0.35 + ny * 0.35));
    // A street is lit from the pavement, so the wall nearest the reader is
    // the brightest thing in the frame.
    const near = Math.max(0, 1 - Math.hypot(a[0] - eye[0], a[1] - eye[1]) / 140);
    const grey = Math.round(
      24 + lit * 26 + (1 - Math.min(1, b.h / 60)) * 10 + near * near * 34,
    );
    ctx.fillStyle = `rgb(${grey},${grey + 2},${grey + 6})`;
    ctx.fill();
    ctx.strokeStyle = EDGE;
    ctx.stroke();

    // The lights on this wall: one dot per window, decided by the
    // building's own hash, so the same windows are lit on every visit.
    const cols = Math.max(1, Math.floor(len / 3.4));
    const rows = Math.max(1, Math.floor(b.h / 3.6));
    if (cols < 2 || rows < 2) continue;
    const pLit = 0.16 + b.l * 0.42;
    for (let ci = 0; ci < cols; ci++) {
      const u = (ci + 0.5) / cols;
      const bx = baseCam[i][0] + (baseCam[j][0] - baseCam[i][0]) * u;
      const by = baseCam[i][1] + (baseCam[j][1] - baseCam[i][1]) * u;
      const bz = baseCam[i][2] + (baseCam[j][2] - baseCam[i][2]) * u;
      const tx = topCam[i][0] + (topCam[j][0] - topCam[i][0]) * u;
      const ty = topCam[i][1] + (topCam[j][1] - topCam[i][1]) * u;
      const tz = topCam[i][2] + (topCam[j][2] - topCam[i][2]) * u;
      for (let ri = 0; ri < rows; ri++) {
        const v = (ri + 0.5) / rows;
        const seed = hash32(b.s ^ (ci * 73856093) ^ (ri * 19349663));
        if (seed / 4294967296 > pLit) continue;
        // The window is placed in camera space and projected, so a window on
        // a wall the reader is standing beside is drawn rather than skipped.
        const z = bz + (tz - bz) * v;
        if (z < NEAR) continue;
        const xx = toScreen([bx + (tx - bx) * v, by + (ty - by) * v, z])[0];
        const yy = toScreen([bx + (tx - bx) * v, by + (ty - by) * v, z])[1];
        if (xx < -3 || xx > ctx.canvas.width + 3) continue;
        if (yy < -3 || yy > ctx.canvas.height + 3) continue;
        ctx.fillStyle = WINDOW;
        const size = z < 60 ? 2.4 : z < 200 ? 1.8 : 1.4;
        ctx.fillRect(xx - size / 2, yy - size / 2, size, size);
      }
    }
  }

  // The roof.
  const roof = clipNear(topCam);
  if (roof.length < 3) return;
  ctx.beginPath();
  const r0 = toScreen(roof[0]);
  ctx.moveTo(r0[0], r0[1]);
  for (let k = 1; k < roof.length; k++) {
    const s = toScreen(roof[k]);
    ctx.lineTo(s[0], s[1]);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgb(33,36,43)';
  ctx.fill();
  ctx.strokeStyle = EDGE;
  ctx.stroke();
}
