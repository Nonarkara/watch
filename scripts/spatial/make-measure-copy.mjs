/**
 * Build a MEASUREMENT copy of the site.
 *
 * The spatial-law checker serves a built directory with a plain static server:
 * it tries <root><url>, <root><url>/index.html and <root><url>.html, and
 * answers 404 for anything else. This app is a single-page app, so every
 * route but "/" 404s under that server and the probe measures a 404 page
 * instead of the site. (That is how a sweep of 33 routes came back with 32 of
 * them measuring nothing, while the live site renders in 2.2 seconds.)
 *
 * So the measurement copy gets a real index.html in each route directory.
 *
 * It ALSO mirrors the built stylesheet into _next/static/css/. The checker
 * reads the project's breakpoints out of its own CSS, and it looks for them
 * at <root>/_next/static/css — a Next.js convention. This app is built by
 * Vite, which writes dist/assets/index-<hash>.css. Without the mirror the
 * sweep silently falls back to the project's own six widths and every CSS
 * breakpoint goes unswept, which is the exact blindness the breakpoint
 * scanner exists to remove. The bytes are copied, not rewritten: the
 * instrument stays byte-identical, and the layout it measures is the layout
 * the built site actually serves.
 *
 * It is written to .spatial-dist/ and is NEVER deployed. Publishing those
 * directories to Cloudflare Pages would make "/register" resolve to
 * "/register/" and change the canonical URLs of the live site, so the copy
 * stays out of dist/ entirely.
 *
 *   node scripts/spatial/make-measure-copy.mjs
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const SRC = join(ROOT, 'dist');
const OUT = join(ROOT, '.spatial-dist');

if (!existsSync(join(SRC, 'index.html'))) {
  console.error('dist/index.html is missing — run `npm run build` first.');
  process.exit(1);
}

// The routes the site publishes, read from the sitemap that the build wrote.
const sitemap = join(SRC, 'sitemap.xml');
const routes = ['/'];
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const p = new URL(m[1]).pathname;
      // /w/<slug> is one row of the route /w/:id, not a layout of its own.
      // The live gate collapses the same rows (spatial-check.mjs, isDossierRow).
      // A receipt that keyed every dossier would measure a few hundred copies
      // of one template; that is the sweep that took 49 minutes.
      if (p && p !== '/' && !p.startsWith('/w/')) routes.push(p);
    } catch { /* not a url — skip */ }
  }
}

rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

const index = readFileSync(join(OUT, 'index.html'));
let written = 0;
for (const r of routes) {
  const dir = join(OUT, r);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), index);
  written++;
}

// Mirror the stylesheet where the checker looks for it. Copied byte for byte.
const cssOut = join(OUT, '_next', 'static', 'css');
mkdirSync(cssOut, { recursive: true });
let cssFiles = 0;
let cssPath = null;
for (const f of readdirSync(join(OUT, 'assets'))) {
  if (!f.endsWith('.css')) continue;
  cpSync(join(OUT, 'assets', f), join(cssOut, f));
  cssFiles++;
  cssPath = join(OUT, 'assets', f);
}

/**
 * THE BREAKPOINT MANIFEST.
 *
 * The checker reads the project's cliffs out of its own CSS, and it looks for
 * them at <root>/_next/static/css — a Next.js convention. This app is built
 * by Vite, so the stylesheet is mirrored there (above) and the checker can
 * read it. But the CSS MINIFIER rewrites every media query into the modern
 * range syntax — `@media (min-width: 880px)` becomes `@media (width>=880px)`
 * — and the checker's scanner only reads the classic form. So the checker
 * would find no cliffs in a Vite build and would sweep six widths, which is
 * exactly the blindness the breakpoint scan exists to remove: the fixes
 * would be written at 520, 560, 720, 900 and 1100 while the gate swept 360,
 * 480, 768, 1024, 1440 and 1920, and not one of those widths was on either
 * side of a single breakpoint.
 *
 * So the copy carries a manifest: every width the DEPLOYED stylesheet
 * declares, written in the form the scanner reads. It is derived from the
 * built stylesheet, not from the source, so it cannot drift from what the
 * site actually ships. The manifest is never loaded by a page — it exists
 * only for the scanner — so it cannot change a single pixel of what is
 * measured.
 */
let breakpointCount = 0;
if (cssPath) {
  const css = readFileSync(cssPath, 'utf8');
  const widths = new Map();
  const add = (n, unit) => {
    const px = Math.round(Number(n) * (unit === 'px' ? 1 : unit === 'rem' ? 16 : 16));
    if (Number.isFinite(px) && px > 0) widths.set(px, px);
  };
  for (const q of css.matchAll(/@(media|container)([^{]*)\{/g)) {
    const prelude = q[2];
    for (const m of prelude.matchAll(/\((?:min|max)-width:\s*([\d.]+)(px|rem|em)\)/g)) add(m[1], m[2]);
    for (const m of prelude.matchAll(/\(\s*width\s*(?:>=|<=)\s*([\d.]+)(px|rem|em)\s*\)/g)) add(m[1], m[2]);
  }
  const manifest = [
    '/* spatial-law breakpoint manifest — derived from the built stylesheet.',
    '   Never loaded by a page. It exists so the shared scanner can read the',
    '   cliffs of a minified stylesheet. */',
    ...[...widths.keys()].sort((a, b) => a - b).map((px) => `@media (min-width: ${px}px) {}`),
    '',
  ].join('\n');
  writeFileSync(join(cssOut, 'breakpoints.css'), manifest);
  breakpointCount = widths.size;
}

console.log(`✓ measurement copy → .spatial-dist/ (${written} routes get an index.html, ${cssFiles} stylesheet(s) mirrored, ${breakpointCount} breakpoint(s) in the manifest)`);
console.log('  never deployed; dist/ is untouched.');
