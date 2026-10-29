import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { TIER_LABEL, BRAND_REGION, REGION_LABEL, type Card } from '../lib/data.ts'
import HeroBanner from '../components/HeroBanner.tsx'

type BrandGroup = {
  brand: string
  cards: Card[]
  withImage: number
  withComps: number
  withProvenance: number
  totalEvents: number
  withExactScreen: number
  tiers: Record<Card['identity']['tier'], number>
  /** The model with the most data behind it: comps first, provenance second,
   *  media third, first-by-id fallback. This is the "most popular" pick the
   *  brand row shows alongside the wordmark — same as a magazine cover would
   *  put its lead piece next to the masthead. */
  mostPopular: Card | null
  /** A second, contrasting pick for the "see also" tile: a different tier or
   *  a different reference family from the most-popular pick. Falls back to
   *  the second card alphabetically if no contrast is meaningful. */
  contrast: Card | null
}

function groupByBrand(cards: Card[]): BrandGroup[] {
  const byBrand = new Map<string, Card[]>()
  for (const c of cards) {
    const list = byBrand.get(c.identity.brand) ?? []
    list.push(c)
    byBrand.set(c.identity.brand, list)
  }
  return [...byBrand.entries()].map(([brand, cards]) => {
    let withImage = 0, withComps = 0, withProvenance = 0, totalEvents = 0, withExactScreen = 0
    const tiers: BrandGroup['tiers'] = { trinity: 0, crown: 0, haute: 0, core: 0, attainable: 0 }
    for (const c of cards) {
      if (c.media.length > 0) withImage++
      if (c.comp_summary) withComps++
      if (c.provenance_events.length > 0) withProvenance++
      totalEvents += c.provenance_events.length
      if (c.screen_events.length > 0) withExactScreen++
      tiers[c.identity.tier]++
    }
    // Most popular = the model with the most comps, then the most provenance,
    // then the most-photographed, then the first alphabetically. We sort on
    // (comps, provenance_events.length, media.length, -id) so ties break
    // deterministically.
    const sorted = [...cards].sort((a, b) => {
      const ca = a.comp_summary?.n ?? 0
      const cb = b.comp_summary?.n ?? 0
      if (cb !== ca) return cb - ca
      if (b.provenance_events.length !== a.provenance_events.length) return b.provenance_events.length - a.provenance_events.length
      if (b.media.length !== a.media.length) return b.media.length - a.media.length
      return a.id.localeCompare(b.id)
    })
    const mostPopular = sorted[0] ?? null
    // Contrast = the next card that's a different reference family, or just
    // the second one if not. We pick by tier difference first, then id.
    const contrast = sorted.find((c) => c !== mostPopular && c.identity.tier !== mostPopular?.identity.tier) ?? sorted[1] ?? null
    return { brand, cards, withImage, withComps, withProvenance, totalEvents, withExactScreen, tiers, mostPopular, contrast }
  })
}

const TIER_BLURB: Record<Card['identity']['tier'], string> = {
  trinity: 'The Holy Trinity — Patek Philippe, Audemars Piguet, Vacheron Constantin. Steel-sports grails and the dress-watch apex.',
  crown: 'Crown & Court — Rolex, Tudor. The most-cited luxury-steel range and the tool-watch canon.',
  haute: 'Haute & Independent — A. Lange & Söhne, F.P. Journe, JLC, MB&F, Zenith, Moser, Richard Mille, De Bethune, Rexhep Rexhepi, Philippe Dufour, H. Moser, Panerai.',
  core: 'Core Luxury — Omega, Cartier, IWC, Breitling, TAG Heuer, Grand Seiko. The mainstream luxury and watchmaking benchmarks.',
  attainable: 'Attainable — Tissot, Longines, Hamilton, Seiko, Grand Seiko (sub-tier), Casio, vintage Casio. The honest entry points.',
}

// Wordmark styling: each brand gets a deterministic accent color from a
// 5-hue palette, so the directory reads as a 35-color grid, not 35 same-look
// rows. The brand name is set in a display font, no images, so we never need
// to source a brand logo from anywhere — we generate the wordmark from the
// brand name itself, which is honest.
const WORDMARK_HUES = ['coral', 'yellow', 'navy', 'teal', 'sky'] as const
function hueForBrand(brand: string): typeof WORDMARK_HUES[number] {
  let h = 0
  for (let i = 0; i < brand.length; i++) h = (h * 31 + brand.charCodeAt(i)) >>> 0
  return WORDMARK_HUES[h % WORDMARK_HUES.length]
}

// Tier order for the tier pill (we use only the dominant tier for the badge).
const TIER_PILL: Record<string, string> = {
  trinity: 'TRINITY',
  crown: 'CROWN',
  haute: 'HAUTE',
  core: 'CORE',
  attainable: 'ATTAINABLE',
}

export default function Brands() {
  const data = useDataset()
  const [tierFilter, setTierFilter] = useState<'all' | Card['identity']['tier']>('all')

  const groups = useMemo(() => {
    if (!data) return []
    return groupByBrand(data.cards)
  }, [data])

  const filtered = useMemo(() => {
    if (tierFilter === 'all') return groups
    return groups.filter((g) => g.tiers[tierFilter] > 0)
  }, [groups, tierFilter])

  if (!data) return null

  return (
    <>
      <HeroBanner
        hue="navy"
        size="lg"
        eyebrow={`DIRECTORY · ${groups.length} BRANDS · ${data.count} REFERENCES`}
        title={<>A directory of<br />brands we cover.</>}
        subtitle={
          <>
            Every dossier on Time Pop belongs to a brand. Each row pairs a brand wordmark
            with the brand's most-cited reference, the dossier's evidence coverage, and the
            tier breakdown. Click a wordmark to open the brand-filtered register; click
            a model to open the dossier.
          </>
        }
        primary={{ to: '#ledger', label: 'SEE THE BRANDS' }}
        secondary={{ to: '/register', label: `BROWSE ALL ${data.count} OBJECTS` }}
        meta={
          <div className="pop-panel brand-stat-panel">
            <span className="bubble-kicker mono">READ THIS LIKE A LEDGER</span>
            <strong>{groups.length} brands, {data.count} references</strong>
            <span>
              {groups.filter((g) => g.withImage === g.cards.length).length} fully photographed ·
              {' '}{groups.filter((g) => g.withComps > 0).length} with sale evidence ·
              {' '}{groups.filter((g) => g.withProvenance > 0).length} with story
            </span>
          </div>
        }
      />

      <Link to="/" className="crumb">← HOME</Link>

      {/* "Most-covered brands" — a 3-up row of the brands with the most
          references, each anchored by its most-collected piece. This is the
          visual directory before the alphabetical list — like the front
          display window of a museum before the long gallery. */}
      <section className="brand-spotlight-row" aria-label="Most-covered brands">
        <div className="section-rule">
          <h2>The most-covered brands.</h2>
          <span className="sticker-inline mono">BY REFERENCE COUNT · TOP 3</span>
        </div>
        <div className="brand-spotlight-grid">
          {groups
            .slice()
            .sort((a, b) => b.cards.length - a.cards.length)
            .slice(0, 3)
            .map((g) => (
              <Link key={g.brand} to={`/register?brand=${encodeURIComponent(g.brand)}`} className={`brand-spotlight brand-spotlight--${hueForBrand(g.brand)}`}>
                <span className="brand-spotlight-media">
                  {g.mostPopular?.media?.[0]
                    ? <img src={g.mostPopular.media[0].url} alt={g.mostPopular.identity.name} loading="lazy" decoding="async"  width={400} height={200} />
                    : <span className="dim">NO PHOTO YET</span>}
                </span>
                <span className="brand-spotlight-id">
                  <span className="brand-spotlight-name">{g.brand}</span>
                  <span className="brand-spotlight-count mono">
                    {g.cards.length} reference{g.cards.length === 1 ? '' : 's'} · {g.withComps} WITH COMPS · {g.withProvenance} WITH STORY
                  </span>
                </span>
                {g.mostPopular && (
                  <span className="brand-spotlight-most">
                    <span className="brand-spotlight-most-eyebrow mono">MOST COLLECTED</span>
                    <span className="brand-spotlight-most-name">{g.mostPopular.identity.name}</span>
                    <span className="brand-spotlight-most-ref mono">{g.mostPopular.identity.reference}</span>
                  </span>
                )}
              </Link>
            ))}
        </div>
      </section>

      <div className="brand-tier-chips" role="group" aria-label="Filter brands by tier">
        <button className={'chip' + (tierFilter === 'all' ? ' on' : '')} aria-pressed={tierFilter === 'all'} onClick={() => setTierFilter('all')}>All {groups.length}</button>
        {(Object.keys(TIER_BLURB) as Card['identity']['tier'][]).map((t) => (
          <button key={t} className={'chip' + (tierFilter === t ? ' on' : '')} aria-pressed={tierFilter === t} onClick={() => setTierFilter(t)}>
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="brand-list">
        {filtered.map((g) => {
          const coverage = g.cards.length === 0 ? 0 : Math.round((g.withImage / g.cards.length) * 100)
          const hue = hueForBrand(g.brand)
          const dominantTier = (Object.keys(g.tiers) as Card['identity']['tier'][])
            .reduce((a, b) => (g.tiers[b] > g.tiers[a] ? b : a), 'core' as Card['identity']['tier'])
          return (
            <article key={g.brand} className={`brand-row brand-row--${hue}`}>
              {/* Column 1: brand wordmark */}
              <Link to={`/register?brand=${encodeURIComponent(g.brand)}`} className={`brand-wm brand-wm--${hue}`}>
                <span className="brand-wm-name">{g.brand}</span>
                <span className="brand-wm-count mono">
                  {g.cards.length} reference{g.cards.length === 1 ? '' : 's'}
                  {BRAND_REGION[g.brand] && (
                    <span className="brand-wm-region">· {REGION_LABEL[BRAND_REGION[g.brand]]}</span>
                  )}
                </span>
                <span className="brand-wm-tier mono">{TIER_PILL[dominantTier]}</span>
              </Link>

              {/* Column 2: most popular model + contrast */}
              <div className="brand-picks">
                {g.mostPopular && (
                  <Link to={`/w/${g.mostPopular.id}`} className="brand-pick">
                    <span className="brand-pick-thumb">
                      {/* alt is empty on purpose: the model's name is the
                          line under the thumbnail, and the browser laying the
                          alt text out inside a 72x72 frame is how the name
                          used to be sliced. */}
                      {g.mostPopular.media[0]
                        ? <img src={g.mostPopular.media[0].url} alt="" loading="lazy" decoding="async"  width={72} height={72} />
                        : <span className="dim">—</span>}
                    </span>
                    <span className="brand-pick-body">
                      <span className="brand-pick-eyebrow mono">MOST POPULAR</span>
                      <span className="brand-pick-name">{g.mostPopular.identity.name}</span>
                      <span className="brand-pick-ref mono">
                        {g.mostPopular.identity.reference}
                        {g.mostPopular.identity.nickname && <span className="dim"> · “{g.mostPopular.identity.nickname}”</span>}
                      </span>
                    </span>
                  </Link>
                )}
                {g.contrast && g.contrast.id !== g.mostPopular?.id && (
                  <Link to={`/w/${g.contrast.id}`} className="brand-pick brand-pick--alt">
                    <span className="brand-pick-thumb">
                      {g.contrast.media[0]
                        ? <img src={g.contrast.media[0].url} alt="" loading="lazy" decoding="async"  width={72} height={72} />
                        : <span className="dim">—</span>}
                    </span>
                    <span className="brand-pick-body">
                      <span className="brand-pick-eyebrow mono">SEE ALSO · {TIER_PILL[g.contrast.identity.tier]}</span>
                      <span className="brand-pick-name">{g.contrast.identity.name}</span>
                      <span className="brand-pick-ref mono">{g.contrast.identity.reference}</span>
                    </span>
                  </Link>
                )}
              </div>

              {/* Column 3: evidence + tier breakdown */}
              <div className="brand-stats-block">
                <div className="brand-tier-breakdown mono">
                  {(['trinity', 'crown', 'haute', 'core', 'attainable'] as Card['identity']['tier'][]).map((t) => {
                    const n = g.tiers[t]
                    if (n === 0) return null
                    return (
                      <span key={t} className="brand-tier-pill">
                        <span className={`tier-dot tier-${t}`} />{TIER_LABEL[t]} · {n}
                      </span>
                    )
                  })}
                </div>
                <div className="brand-stats mono">
                  <div><span>Image</span><strong>{g.withImage}/{g.cards.length}</strong><span className="dim micro">({coverage}%)</span></div>
                  <div><span>Comps</span><strong>{g.withComps}/{g.cards.length}</strong></div>
                  <div><span>Story</span><strong>{g.withProvenance}/{g.cards.length}</strong><span className="dim micro">({g.totalEvents} events)</span></div>
                  <div><span>Screen</span><strong>{g.withExactScreen}</strong><span className="dim micro">exact refs</span></div>
                </div>
                <div className="brand-coverage-bar" aria-hidden="true">
                  <div className="brand-coverage-fill" style={{ width: `${coverage}%` }} />
                </div>
                <div className="brand-references">
                  {g.cards.slice(0, 6).map((c) => (
                    <Link key={c.id} to={`/w/${c.id}`} className="brand-ref-pill">
                      {c.identity.reference}
                      <span className="dim">{c.identity.nickname ?? c.identity.name}</span>
                    </Link>
                  ))}
                  {g.cards.length > 6 && (
                    <Link to={`/register?brand=${encodeURIComponent(g.brand)}`} className="brand-ref-pill brand-ref-more">
                      +{g.cards.length - 6} more
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {tierFilter !== 'all' && (
        <section className="tier-glossary">
          <h2>About {TIER_LABEL[tierFilter]}</h2>
          <p>{TIER_BLURB[tierFilter]}</p>
        </section>
      )}

      {tierFilter === 'all' && (
        <section className="tier-glossary">
          <h2>About the tiers</h2>
          <p>
            The tier label is editorial, not a price tier. We assign it from the brand's standing in
            horological culture, not from the MSRP or the auction record. A Seiko Prospex at
            <strong> Attainable</strong> is no less of a watch than a Vacheron at <strong>Trinity</strong>;
            they answer different collector questions.
          </p>
        </section>
      )}
    </>
  )
}
