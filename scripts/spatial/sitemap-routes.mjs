const production = 'https://watch.nonarkara.org'
const pagesDeployment = /^https:\/\/(?:[0-9a-f]{8}\.)?watch-1de\.pages\.dev$/

// Cloudflare previews keep the production canonical URLs in the XML. Read
// their paths, but never send the measurement browser to those origins.
export function sitemapPaths(xml, base) {
  const origin = new URL(base).origin
  const allowed = new Set([origin])
  if (pagesDeployment.test(origin)) allowed.add(production)
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap(([, loc]) => {
    try {
      const url = new URL(loc.trim())
      return allowed.has(url.origin) ? [url.pathname] : []
    } catch {
      return []
    }
  })
}
