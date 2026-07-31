import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { useCompare } from '../lib/compare-context.tsx'
import { TIER_LABEL, TIER_ORDER, type Card } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel } from '../lib/format.ts'
import TrendSpark from '../components/TrendSpark.tsx'

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

  const cards = useMemo(() => data?.cards ?? [], [data])

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
      <div className="page-head">
        <div>
          <p className="eyebrow">The Register</p>
          <h1 className="pagetitle">Every reference, with its evidence</h1>
        </div>
        <p className="lede">
          Market figures come from verified public sales; the indices are computed, sourced, and
          show their own limits. Where evidence is thin, the register says so instead of guessing.
        </p>
      </div>

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
            <VisualCard key={c.id} c={c} />
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

function VisualCard({ c }: { c: Card }) {
  const { has, toggle } = useCompare()
  const inSet = has(c.id)
  const { estimate, premium, scarcity, collectibility, confidence } = c.computed
  const delta = premium.value
  return (
    <Link
      to={`/w/${c.id}`}
      className={'reg-card' + (inSet ? ' picked' : '')}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/watch-id', c.id); e.dataTransfer.effectAllowed = 'copy' }}
    >
      <div className="rc-media">
        {c.media[0]
          ? <img src={c.media[0].url} alt={c.identity.name} loading="lazy" className="photo-img" />
          : <span className="rc-media-empty mono">NO IMAGE</span>}
      </div>
      <div className="rc-id">
        <span className="rc-brand">{c.identity.brand}</span>
        <span className="rc-conf mono">{confidence.tier ?? dash}</span>
      </div>
      <button
        type="button"
        className={'rc-pick mono' + (inSet ? ' on' : '')}
        aria-pressed={inSet}
        aria-label={inSet ? `Remove ${c.identity.reference} from comparison` : `Add ${c.identity.reference} to comparison`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(c.id) }}
      >{inSet ? 'COMPARING' : 'COMPARE'}</button>
      <div className="rc-name">{c.identity.name}</div>
      <div className="rc-sub mono">
        {c.identity.reference}{c.identity.nickname ? ` · ${c.identity.nickname}` : ''}
      </div>
      <TrendSpark sales={c.notable_sales ?? []} />
      <dl className="rc-data">
        <div><dt>Market</dt><dd>{estimate.value != null ? usd(estimate.value) : dash}</dd></div>
        <div><dt>Vs retail</dt><dd className={delta != null && delta < 0 ? 'neg' : delta != null ? 'amber' : ''}>
          {delta != null ? pct(delta) : dash}</dd></div>
        <div><dt>Scarcity</dt><dd>{scarcity.value}<span className="dim">/100</span></dd></div>
        <div><dt>Collect</dt><dd>{collectibility.value}<span className="dim">/100</span></dd></div>
      </dl>
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
