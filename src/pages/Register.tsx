import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { useCompare } from '../lib/compare-store.ts'
import { TIER_LABEL, TIER_ORDER, BRAND_REGION, REGION_ORDER, REGION_LABEL, type Card } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel } from '../lib/format.ts'
import { loadMarketTrends } from '../lib/catalog.ts'
import TrendSpark from '../components/TrendSpark.tsx'
import HeroBanner from '../components/HeroBanner.tsx'

type SortKey = 'collectibility' | 'scarcity' | 'trending' | 'market_desc' | 'market_asc' | 'delta' | 'az' | 'newest'
const SORTS: { k: SortKey; label: string }[] = [
  { k: 'collectibility', label: 'COLLECTIBILITY' },
  { k: 'scarcity', label: 'SCARCITY' },
  { k: 'trending', label: 'WATCHING TODAY' },
  { k: 'market_desc', label: 'MARKET ↓' },
  { k: 'market_asc', label: 'MARKET ↑' },
  { k: 'delta', label: 'VS RETAIL' },
  { k: 'newest', label: 'NEWEST' },
  { k: 'az', label: 'A–Z' },
]

export default function Register() {
  const data = useDataset()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [tier, setTier] = useState<'all' | Card['identity']['tier']>('all')
  const [brand, setBrand] = useState(params.get('brand') ?? 'all')
  const [region, setRegion] = useState<'all' | 'asia' | 'europe' | 'americas'>(
    (params.get('region') as 'asia' | 'europe' | 'americas') ?? 'all'
  )
  const [sort, setSort] = useState<SortKey>('collectibility')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [watchingRank, setWatchingRank] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    loadMarketTrends().then((snap) => {
      if (!snap?.trending) return
      setWatchingRank(new Map(snap.trending.map((row) => [row.card_id, row.rank])))
    }).catch(() => {})
  }, [])

  // Keep the URL in sync with active filters so a back-link or a "see all asia" link survives reload.
  useEffect(() => {
    const next = new URLSearchParams()
    if (brand !== 'all') next.set('brand', brand)
    if (region !== 'all') next.set('region', region)
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [brand, region, params, setParams])

  const cards = useMemo(() => data?.cards ?? [], [data])

  const brands = useMemo(
    () => [...new Set(cards
      .filter((c) => region === 'all' || BRAND_REGION[c.identity.brand] === region)
      .map((c) => c.identity.brand))].sort(),
    [cards, region],
  )

  // Brand directory with tier + count, so the dropdown shows the depth of each
  // brand — e.g. "ROLEX · CROWN · 39" instead of just "Rolex". Tier comes from
  // brand_tiers.json; the count is the number of cards we have on file.
  const brandDirectory = useMemo(() => {
    const counts = new Map<string, number>()
    const tierByBrand = new Map<string, Card['identity']['tier']>()
    for (const c of cards) {
      counts.set(c.identity.brand, (counts.get(c.identity.brand) ?? 0) + 1)
      // First card wins — tier is consistent within a brand.
      if (!tierByBrand.has(c.identity.brand)) tierByBrand.set(c.identity.brand, c.identity.tier)
    }
    return brands.map((b) => ({ brand: b, count: counts.get(b) ?? 0, tier: tierByBrand.get(b) }))
  }, [brands, cards])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const f = cards.filter((c) => {
      if (tier !== 'all' && c.identity.tier !== tier) return false
      if (brand !== 'all' && c.identity.brand !== brand) return false
      if (region !== 'all' && BRAND_REGION[c.identity.brand] !== region) return false
      if (!needle) return true
      return [c.identity.brand, c.identity.reference, c.identity.name, c.identity.nickname, c.identity.collection]
        .filter(Boolean).join(' ').toLowerCase().includes(needle)
    })
    const est = (c: Card) => c.computed.estimate.value
    const startYear = (c: Card) => c.identity.produced?.start_year ?? 0
    const cmp: Record<SortKey, (a: Card, b: Card) => number> = {
      collectibility: (a, b) => b.computed.collectibility.value - a.computed.collectibility.value,
      scarcity: (a, b) => b.computed.scarcity.value - a.computed.scarcity.value,
      trending: (a, b) => {
        const ra = watchingRank.get(a.id) ?? 999
        const rb = watchingRank.get(b.id) ?? 999
        if (ra !== rb) return ra - rb
        return b.computed.collectibility.value - a.computed.collectibility.value
      },
      market_desc: (a, b) => (est(b) ?? -1) - (est(a) ?? -1),
      market_asc: (a, b) => (est(a) ?? Infinity) - (est(b) ?? Infinity),
      delta: (a, b) => (b.computed.premium.value ?? -Infinity) - (a.computed.premium.value ?? -Infinity),
      newest: (a, b) => startYear(b) - startYear(a),
      az: (a, b) => a.id.localeCompare(b.id),
    }
    return [...f].sort(cmp[sort])
  }, [cards, q, tier, brand, region, sort, watchingRank])

  return (
    <>
      <HeroBanner
        hue="navy"
        size="md"
        eyebrow="THE REGISTER"
        title={<>Every reference,<br />with its evidence.</>}
        subtitle={
          <>
            Market figures come from verified public sales; the indices are computed, sourced,
            and show their own limits. Where evidence is thin, the register says so instead of
            guessing.
          </>
        }
        primary={{ to: '#ledger', label: 'BROWSE THE REGISTER' }}
        secondary={{ to: '/methodology', label: 'READ THE METHODOLOGY' }}
        meta={
          <div className="pop-panel">
            <span className="bubble-kicker mono">THE HONEST PLOT</span>
            <strong>{data?.count ?? '—'} references</strong>
            <span>{data ? `${data.cards.filter((c) => c.comp_summary).length} with cited sales · ${data.cards.filter((c) => c.computed.estimate.value == null).length} without publishable estimates` : ''}</span>
          </div>
        }
      />

      <div className="controls">
        <div className="controls-row">
          <input className="inp" type="search" placeholder="Search brand, reference, nickname…"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the register" />
          <select className="sel" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Filter by brand">
            <option value="all">ALL BRANDS</option>
            {brandDirectory.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand.toUpperCase()} · {b.count} {b.count === 1 ? 'card' : 'cards'}
              </option>
            ))}
          </select>
          <select className="sel" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
            {SORTS.map((s) => <option key={s.k} value={s.k}>SORT · {s.label}</option>)}
          </select>

          <div className="register-view-toggle" role="group" aria-label="View mode">
            <button
              className={`chip ${viewMode === 'grid' ? 'on' : ''}`}
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              VISUAL CARDS
            </button>
            <button
              className={`chip ${viewMode === 'table' ? 'on' : ''}`}
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              LEDGER TABLE
            </button>
          </div>
        </div>

        <div className="chips" role="group" aria-label="Filter by region">
          <button className={'chip' + (region === 'all' ? ' on' : '')} aria-pressed={region === 'all'} onClick={() => { setRegion('all'); setBrand('all') }}>All regions</button>
          {REGION_ORDER.map((r) => {
            const n = cards.filter((c) => BRAND_REGION[c.identity.brand] === r).length
            return (
              <button
                key={r}
                className={'chip' + (region === r ? ' on' : '')}
                aria-pressed={region === r}
                onClick={() => { setRegion(r); setBrand('all') }}
                title={`${n} references from ${REGION_LABEL[r]}-headquartered brands`}
              >{REGION_LABEL[r].toUpperCase()} · {n}</button>
            )
          })}
        </div>
        <div className="chips" role="group" aria-label="Filter by tier">
          <button className={'chip' + (tier === 'all' ? ' on' : '')} aria-pressed={tier === 'all'} onClick={() => setTier('all')}>All</button>
          {TIER_ORDER.map((t) => (
            <button key={t} className={'chip' + (tier === t ? ' on' : '')} aria-pressed={tier === t} onClick={() => setTier(t)}>
              {TIER_LABEL[t]}
            </button>
          ))}
        </div>
        <p className="count-line mono" role="status" aria-live="polite" aria-atomic="true">{rows.length} OF {cards.length} REFERENCES</p>
      </div>

      {viewMode === 'grid' ? (
        <div className="card-grid-view">
          {rows.map((c) => (
            <VisualCard key={c.id} c={c} watchingRank={watchingRank} />
          ))}
        </div>
      ) : (
        <>
          <div className="lhead" aria-hidden="true">
            <span>Model</span><span>Market USD</span><span>Vs retail</span><span>Scarcity</span><span>Collect</span><span>Conf</span>
          </div>
          {rows.map((c) => <Row key={c.id} c={c} />)}
        </>
      )}

      {rows.length === 0 && <p className="boot mono">NO REFERENCES MATCH.</p>}
    </>
  )
}

function VisualCard({ c, watchingRank }: { c: Card; watchingRank: Map<string, number> }) {
  const { has, toggle } = useCompare()
  const inSet = has(c.id)
  const { estimate, premium, scarcity, collectibility, confidence } = c.computed
  const delta = premium.value
  const trendRank = watchingRank.get(c.id) ?? null
  return (
    <div
      className={'reg-card' + (inSet ? ' picked' : '') + (trendRank != null ? ' has-trend' : '')}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/watch-id', c.id); e.dataTransfer.effectAllowed = 'copy' }}
    >
      <Link to={`/w/${c.id}`} className="rc-media-link">
        <div className="rc-media">
          {c.media[0]
            ? <img src={c.media[0].url} alt={`${c.identity.brand} ${c.identity.reference} — ${c.identity.name}`} loading="lazy" decoding="async" className="photo-img" width={400} height={300} />
            : <span className="rc-media-empty mono">NO IMAGE</span>}
        </div>
      </Link>
      <div className="rc-id">
        <span className="rc-brand">{c.identity.brand}</span>
        {trendRank != null && (
          <span className="rc-trend-badge mono" title="In today's public-attention watchlist — Wikipedia pageviews; Google Trends when connected, not price">
            <span className="rc-trend-badge-dot" aria-hidden="true">●</span>
            TODAY #{trendRank}
          </span>
        )}
        <span className="rc-conf mono">{confidence.tier ?? dash}</span>
      </div>
      <button
        type="button"
        className={'rc-pick mono' + (inSet ? ' on' : '')}
        aria-pressed={inSet}
        aria-label={inSet ? `Remove ${c.identity.reference} from comparison` : `Add ${c.identity.reference} to comparison`}
        onClick={() => toggle(c.id)}
      >{inSet ? 'COMPARING' : 'COMPARE'}</button>
      <Link to={`/w/${c.id}`} className="rc-name-link">
        <div className="rc-name">{c.identity.name}</div>
        <div className="rc-sub mono">
          {c.identity.reference}{c.identity.nickname ? ` · ${c.identity.nickname}` : ''}
        </div>
      </Link>
      <TrendSpark sales={c.notable_sales ?? []} />
      <Link to={`/w/${c.id}`} className="rc-data-link">
        <dl className="rc-data">
          <div><dt>Market</dt><dd>{estimate.value != null ? usd(estimate.value) : dash}</dd></div>
          <div><dt>Vs retail</dt><dd className={delta != null && delta < 0 ? 'neg' : delta != null ? 'amber' : ''}>
            {delta != null ? pct(delta) : dash}</dd></div>
          <div><dt>Scarcity</dt><dd>{scarcity.value}<span className="dim">/100</span></dd></div>
          <div><dt>Collect</dt><dd>{collectibility.value}<span className="dim">/100</span></dd></div>
        </dl>
      </Link>
    </div>
  )
}

function Row({ c }: { c: Card }) {
  const { estimate, premium, scarcity, collectibility, confidence } = c.computed
  const delta = premium.value
  return (
    <Link to={`/w/${c.id}`} className="lrow">
      <span className="l-model">
        <span className="l-brand">{c.identity.brand}</span>{' '}
        <span className="l-ref mono">{c.identity.reference}</span>
        {c.identity.nickname && <span className="l-nick"> “{c.identity.nickname}”</span>}
      </span>
      <span className="l-price">{estimate.value != null ? usd(estimate.value) : <span className="dim">{dash}</span>}</span>
      <span className="l-num hide-m">{delta != null ? <span className={delta < 0 ? 'neg' : ''}>{pct(delta)}</span> : <span className="dim">{dash}</span>}</span>
      <span className="l-num hide-m">{scarcity.value} <span className="dim micro">{scarcity.tier?.toUpperCase()}</span></span>
      <span className="l-num hide-m">{collectibility.value}</span>
      <span className="l-num hide-m">{confidence.tier
        ? <span className={'badge' + (confidence.tier === 'A' ? ' a' : '')}>{confidence.tier}</span>
        : <span className="dim">{dash}</span>}</span>
      <span className="l-sub">
        <span>{TIER_LABEL[c.identity.tier]}</span>
        <span className="mono">{yearsLabel(c.identity.produced)}</span>
        <span className="show-m">SCAR {scarcity.value} · COL {collectibility.value}{delta != null ? ` · ${pct(delta)}` : ''}{confidence.tier ? ` · ${confidence.tier}` : ''}</span>
      </span>
    </Link>
  )
}
