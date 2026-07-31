import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { TIER_LABEL, TIER_ORDER, type Card } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel } from '../lib/format.ts'

type SortKey = 'collectibility' | 'scarcity' | 'market_desc' | 'market_asc' | 'delta' | 'az'
const SORTS: { k: SortKey; label: string }[] = [
  { k: 'collectibility', label: 'COLLECTIBILITY' },
  { k: 'scarcity', label: 'SCARCITY' },
  { k: 'market_desc', label: 'MARKET ↓' },
  { k: 'market_asc', label: 'MARKET ↑' },
  { k: 'delta', label: 'VS RETAIL' },
  { k: 'az', label: 'A–Z' },
]

export default function Register() {
  const data = useDataset()
  const [q, setQ] = useState('')
  const [tier, setTier] = useState<'all' | Card['identity']['tier']>('all')
  const [brand, setBrand] = useState('all')
  const [sort, setSort] = useState<SortKey>('collectibility')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({})

  const cards = useMemo(() => data?.cards ?? [], [data])

  useEffect(() => {
    fetch('/data/watch_photos.json')
      .then((r) => r.json())
      .then((photosList: Array<{ card_id: string; image_url: string }>) => {
        const map: Record<string, string> = {}
        for (const p of photosList) {
          map[p.card_id] = p.image_url
        }
        setPhotosMap(map)
      })
      .catch(() => {})
  }, [])

  const brands = useMemo(
    () => [...new Set(cards.map((c) => c.identity.brand))].sort(),
    [cards],
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const f = cards.filter((c) => {
      if (tier !== 'all' && c.identity.tier !== tier) return false
      if (brand !== 'all' && c.identity.brand !== brand) return false
      if (!needle) return true
      return [c.identity.brand, c.identity.reference, c.identity.name, c.identity.nickname, c.identity.collection]
        .filter(Boolean).join(' ').toLowerCase().includes(needle)
    })
    const est = (c: Card) => c.computed.estimate.value
    const cmp: Record<SortKey, (a: Card, b: Card) => number> = {
      collectibility: (a, b) => b.computed.collectibility.value - a.computed.collectibility.value,
      scarcity: (a, b) => b.computed.scarcity.value - a.computed.scarcity.value,
      market_desc: (a, b) => (est(b) ?? -1) - (est(a) ?? -1),
      market_asc: (a, b) => (est(a) ?? Infinity) - (est(b) ?? Infinity),
      delta: (a, b) => (b.computed.premium.value ?? -Infinity) - (a.computed.premium.value ?? -Infinity),
      az: (a, b) => a.id.localeCompare(b.id),
    }
    return [...f].sort(cmp[sort])
  }, [cards, q, tier, brand, sort])

  return (
    <>
      <p className="eyebrow">The Register</p>
      <h1 className="pagetitle">Every reference, with its evidence</h1>
      <p className="lede">
        A curated register of collectible watch references. Market figures come from verified public
        sales; the indices are computed, sourced, and show their own limits. Where evidence is thin,
        the register says so instead of guessing.
      </p>

      <div className="controls">
        <div className="controls-row">
          <input className="inp" type="search" placeholder="Search brand, reference, nickname…"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the register" />
          <select className="sel" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Filter by brand">
            <option value="all">ALL BRANDS</option>
            {brands.map((b) => <option key={b} value={b}>{b.toUpperCase()}</option>)}
          </select>
          <select className="sel" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
            {SORTS.map((s) => <option key={s.k} value={s.k}>SORT · {s.label}</option>)}
          </select>

          <div className="register-view-toggle">
            <button
              className={`chip ${viewMode === 'grid' ? 'on' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              VISUAL CARDS
            </button>
            <button
              className={`chip ${viewMode === 'table' ? 'on' : ''}`}
              onClick={() => setViewMode('table')}
            >
              LEDGER TABLE
            </button>
          </div>
        </div>

        <div className="chips" role="group" aria-label="Filter by tier">
          <button className={'chip' + (tier === 'all' ? ' on' : '')} onClick={() => setTier('all')}>All</button>
          {TIER_ORDER.map((t) => (
            <button key={t} className={'chip' + (tier === t ? ' on' : '')} onClick={() => setTier(t)}>
              {TIER_LABEL[t]}
            </button>
          ))}
        </div>
        <p className="count-line mono">{rows.length} OF {cards.length} REFERENCES</p>
      </div>

      {viewMode === 'grid' ? (
        <div className="card-grid-view">
          {rows.map((c) => (
            <VisualCard key={c.id} c={c} imgUrl={photosMap[c.id]} />
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

function VisualCard({ c, imgUrl }: { c: Card; imgUrl?: string }) {
  const { estimate, premium, scarcity, collectibility, confidence } = c.computed
  const delta = premium.value
  return (
    <Link to={`/w/${c.id}`} className="reg-card">
      {imgUrl && (
        <div className="photo-thumb-wrap" style={{ height: '140px', marginBottom: '8px' }}>
          <img src={imgUrl} alt={c.identity.name} loading="lazy" className="photo-img" />
          <span className="tier-badge mono">{c.identity.tier.toUpperCase()}</span>
        </div>
      )}
      <div className="reg-card-head">
        <span className="reg-card-brand">{c.identity.brand}</span>
        {confidence.tier && <span className={'badge' + (confidence.tier === 'A' ? ' a' : '')}>{confidence.tier}</span>}
      </div>
      <div className="reg-card-title">
        {c.identity.name} <span className="mono dim" style={{ fontSize: '13px' }}>{c.identity.reference}</span>
      </div>
      {c.identity.nickname && <div className="l-nick micro">“{c.identity.nickname}”</div>}
      
      <div className="reg-card-metrics">
        <div>
          <span className="micro dim block">MARKET</span>
          <span className="reg-card-price">{estimate.value != null ? usd(estimate.value) : dash}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="micro dim block">VS RETAIL</span>
          <span className={`mono bold ${delta && delta < 0 ? 'neg' : 'amber'}`}>
            {delta != null ? pct(delta) : dash}
          </span>
        </div>
      </div>

      <div className="mini-specs" style={{ marginTop: '8px', paddingTop: '4px' }}>
        <div style={{ padding: '2px 0' }}>
          <dt>SCARCITY</dt>
          <dd>{scarcity.value}/100 ({scarcity.tier?.toUpperCase() || 'COMMON'})</dd>
        </div>
        <div style={{ padding: '2px 0' }}>
          <dt>COLLECT</dt>
          <dd>{collectibility.value}/100</dd>
        </div>
      </div>
    </Link>
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
