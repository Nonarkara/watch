import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

interface Source { name: string; url: string; type: string; brands: string; era: string; watch_types: string; rating: number }
interface Catalog { compiled: string; note: string; sources: Source[] }

const GROUPS: { key: string; label: string; blurb: string }[] = [
  { key: 'Technical Reference', label: 'Technical references', blurb: 'Serial tables, reference decoders, movement databases, and catalog archives — where you verify what a watch is.' },
  { key: 'Forum', label: 'Forums & communities', blurb: 'Decades of collector discussion and peer authentication. Post photos before money moves.' },
  { key: 'Stolen Registry', label: 'Stolen-watch registries', blurb: 'Check a serial before any purchase. A clean registry search is basic diligence, not paranoia.' },
  { key: 'Auction Data', label: 'Auction records', blurb: 'Realized prices from the major houses — the raw material behind every honest market estimate.' },
  { key: 'Editorial', label: 'Editorial & reference guides', blurb: 'Expert-written reference series and market commentary from named authors.' },
  { key: 'Repair', label: 'Repair & restoration', blurb: 'Service manuals, movement specifications, and parts interchangeability.' },
  { key: 'Educational', label: 'Education', blurb: 'Horological training material and glossaries.' },
]

const RATING_LABEL: Record<number, string> = { 5: 'Authoritative', 4: 'Highly trusted', 3: 'Trusted', 2: 'Situational', 1: 'Caution' }

/** Reports and datasets Time Pop itself relies on, cited from the pages that use them. */
const OUR_SOURCES = [
  { name: 'Phillips auction results', url: 'https://www.phillips.com/auctions', use: 'Verified USD sold prices; the largest share of the register\'s comparable sales.' },
  { name: 'Bonhams auction results', url: 'https://www.bonhams.com/', use: 'Verified USD sold prices from US online sales.' },
  { name: 'FRED — Consumer Price Index (CPIAUCSL)', url: 'https://fred.stlouisfed.org/series/CPIAUCSL', use: 'Inflation adjustment for real price change. Snapshot committed with every data build.' },
  { name: 'Morgan Stanley × LuxeConsult annual Swiss watch reports', url: 'https://monochrome-watches.com/industry-new-morgan-stanley-top-50-watch-brands-for-2025-rolex-still-leading-the-pack-strong-polarization-of-the-market/', use: 'Brand-level production estimates behind the Scarcity Index\'s brand-capacity signal.' },
  { name: 'Knight Frank — The Wealth Report', url: 'https://www.knightfrank.com/wealthreport', use: 'Luxury Investment Index context on the Economy page.' },
  { name: 'Wikimedia Commons & Unsplash', url: 'https://commons.wikimedia.org/', use: 'Licensed photography, each image credited with author, licence, and source on its dossier.' },
]

export default function Resources() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    fetch('/resources.json').then((r) => r.json()).then(setCatalog, () => setErr(true))
  }, [])

  const grouped = useMemo(() => {
    if (!catalog) return []
    return GROUPS.map((g) => ({
      ...g,
      items: catalog.sources
        .filter((s) => s.type.startsWith(g.key))
        .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length)
  }, [catalog])

  return (
    <div>
      <Link to="/" className="crumb">← HOME</Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">Resources</p>
          <h1 className="pagetitle">The reference shelf</h1>
        </div>
        <p className="lede">
          Fifty-eight vetted places to verify a watch before money moves: serial tables, movement
          databases, collector forums, stolen-watch registries, and auction archives. Ratings reflect
          long-term collector consensus, compiled August 2026. Time Pop links these freely — none pay
          to be here.
        </p>
      </div>

      {err && <p className="boot mono">RESOURCE CATALOG FAILED TO LOAD.</p>}
      {!catalog && !err && <p className="boot mono">LOADING…</p>}

      {grouped.map((g) => (
        <section className="sect" key={g.key}>
          <div className="section-rule">
            <h2>{g.label}</h2>
            <span className="mono micro dim">{g.items.length} SOURCE{g.items.length === 1 ? '' : 'S'}</span>
          </div>
          <p className="lede" style={{ marginBottom: 'var(--space-md)' }}>{g.blurb}</p>
          <div className="res-list">
            {g.items.map((s) => (
              <a className="res-row" key={s.url + s.name} href={s.url} target="_blank" rel="noreferrer">
                <span className="res-main">
                  <span className="res-name">{s.name}</span>
                  <span className="res-meta mono dim">{s.brands} · {s.era}</span>
                </span>
                <span className={'res-rating mono' + (s.rating === 5 ? ' top' : '')}>
                  {s.rating}/5 · {RATING_LABEL[s.rating].toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}

      <section className="sect" id="our-sources">
        <div className="section-rule">
          <h2>What Time Pop itself is built on</h2>
          <span className="mono micro dim">CITED THROUGHOUT THE SITE</span>
        </div>
        <div className="res-list">
          {OUR_SOURCES.map((s) => (
            <a className="res-row" key={s.url} href={s.url} target="_blank" rel="noreferrer">
              <span className="res-main">
                <span className="res-name">{s.name}</span>
                <span className="res-meta dim">{s.use}</span>
              </span>
              <span className="res-rating mono">SOURCE ↗</span>
            </a>
          ))}
        </div>
        <p className="honest" style={{ marginTop: 'var(--space-md)' }}>
          One naming note, in the interest of the same transparency we ask of others: Time Pop is not
          affiliated with The Watch Register (thewatchregister.com), the London stolen-watch database
          listed above — and if you are checking a serial number, theirs is the right place to do it.
        </p>
      </section>

      <p className="micro dim mono">
        RATINGS COMPILED {catalog?.compiled ?? '2026-08-02'} · SEE ALSO{' '}
        <Link to="/methodology" className="src-a">METHODOLOGY</Link> ·{' '}
        <Link to="/paper" className="src-a">WORKING PAPER</Link> ·{' '}
        <Link to="/legal" className="src-a">FINE PRINT</Link>
      </p>
    </div>
  )
}
