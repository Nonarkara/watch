#!/usr/bin/env node
// Generate public/sitemap.xml from the live route table + the published dataset.
//
// The sitemap used to be hand-written and silently listed 12 of 29 routes, so
// most of the register was invisible to search. Deriving it from src/main.tsx
// and public/data.json makes it impossible for a new page or a new dossier to
// be missing.
//
// Excluded on purpose:
//   /saved           browser-private, no server content
//   /venues          alias of /marketplaces (same content, one canonical URL)
//   /guides, /guides/:slug  client-side redirects onto /bible
//   /w/:id siblings are expanded from the dataset instead of the pattern
//
// Run: node scripts/build_sitemap.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://watch.nonarkara.org'

/** Routes that exist in the router but must never be advertised. */
const EXCLUDE = new Set(['/saved', '/venues', '/guides', '/guides/:slug'])

function discoverRoutes() {
  const main = readFileSync(join(ROOT, 'src/main.tsx'), 'utf8')
  const paths = [...main.matchAll(/<Route path="([^"]+)"/g)].map((m) => '/' + m[1])
  return [...new Set(['/', ...paths])]
    .filter((p) => !EXCLUDE.has(p) && !p.includes(':'))
}

function dossierRoutes() {
  const data = JSON.parse(readFileSync(join(ROOT, 'public/data.json'), 'utf8'))
  return data.cards.map((c) => `/w/${c.id}`)
}

function build() {
  const routes = [...discoverRoutes(), ...dossierRoutes()]
  const urls = routes.map((r) => `  <url><loc>${ORIGIN}${r === '/' ? '/' : r}</loc></url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/sitemap/0.9">
${urls}
</urlset>
`
  writeFileSync(join(ROOT, 'public/sitemap.xml'), xml)
  const pages = discoverRoutes().length
  const dossiers = dossierRoutes().length
  console.log(`✓ sitemap.xml → ${pages} pages + ${dossiers} dossiers (${routes.length} urls)`)
}

build()
