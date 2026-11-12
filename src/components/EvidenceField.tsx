import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Card } from '../lib/data.ts'
import {
  EVIDENCE_CHANNELS,
  evidenceChannels,
  evidenceColumnOffset,
  evidenceDepth,
  metricValue,
  type EvidenceMetric,
} from '../lib/evidence-field.ts'

const W = 900
const H = 480
const PAD = { top: 36, right: 36, bottom: 70, left: 88 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const Y_TICKS = [0, 25, 50, 75, 100]

function x(depth: number) {
  return PAD.left + (depth / 5) * PLOT_W
}

function y(value: number) {
  return PAD.top + ((100 - value) / 100) * PLOT_H
}

function metricLabel(metric: EvidenceMetric) {
  return metric === 'scarcity' ? 'Scarcity' : 'Collectibility'
}

export default function EvidenceField({ cards, built }: { cards: Card[]; built: string }) {
  const [metric, setMetric] = useState<EvidenceMetric>('scarcity')
  const [brand, setBrand] = useState('all')
  const brands = useMemo(() => [...new Set(cards.map((card) => card.identity.brand))].sort(), [cards])
  const filtered = useMemo(
    () => cards.filter((card) => brand === 'all' || card.identity.brand === brand),
    [brand, cards],
  )
  const initial = useMemo(
    () => [...filtered].sort((a, b) => Number(metricValue(b, metric) !== null) - Number(metricValue(a, metric) !== null)
      || evidenceDepth(b) - evidenceDepth(a)
      || (metricValue(b, metric) ?? -1) - (metricValue(a, metric) ?? -1)
      || a.id.localeCompare(b.id))[0],
    [filtered, metric],
  )
  const [selectedId, setSelectedId] = useState(initial?.id ?? '')

  const selected = filtered.find((card) => card.id === selectedId) ?? initial
  const selectedChannels = selected ? evidenceChannels(selected) : null
  const selectedMetric = selected?.computed[metric]
  const plotted = filtered.flatMap(card => {
    const value = metricValue(card, metric)
    return value === null ? [] : [{ card, value, depth: evidenceDepth(card) }]
  })
  const depthCounts = Array.from({ length: 6 }, (_, depth) => plotted.filter(point => point.depth === depth).length)
  const omitted = filtered.length - plotted.length

  return (
    <section className="evidence-field" aria-labelledby="evidence-field-title">
      <div className="section-rule">
        <h2 id="evidence-field-title" tabIndex={-1}>The evidence field</h2>
        <span className="sticker-inline mono">{plotted.length} PLOTTED{omitted > 0 && ` · ${omitted} WITHOUT A SCORE`}</span>
      </div>
      <div className="evidence-field-intro">
        <p>
          Height is the published score. Columns count five kinds of evidence: exact photo,
          comparable sales, provenance, retail history, and exact screen ID.
        </p>
        <p className="micro dim">
          Dots spread within a column for legibility. Zero is a published score; missing scores stay off the plot.
        </p>
      </div>

      <div className="evidence-controls">
        <div className="evidence-toggle" role="group" aria-label="Vertical metric">
          {(['scarcity', 'collectibility'] as const).map((name) => (
            <button key={name} type="button" className={metric === name ? 'on' : ''}
              onClick={() => setMetric(name)} aria-pressed={metric === name}>
              {metricLabel(name).toUpperCase()}
            </button>
          ))}
        </div>
        <label>
          <span className="mono">BRAND</span>
          <select value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option value="all">All {brands.length} brands</option>
            {brands.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          <span className="mono">READ A REFERENCE</span>
          <select value={selected?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)}>
            {filtered.map((card) => (
              <option key={card.id} value={card.id}>{card.identity.brand} · {card.identity.reference}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="evidence-stage">
        <div className="evidence-plot-wrap">
          <p className="evidence-phone-axis mono">{metricLabel(metric)} · 0–100</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="evidence-plot" role="img"
            aria-label={`${plotted.length} dossiers plotted by evidence depth and ${metricLabel(metric).toLowerCase()}; ${omitted} without a score`}>
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} y1={y(tick)} x2={W - PAD.right} y2={y(tick)} className="evidence-gridline" />
                <text x={PAD.left - 34} y={y(tick) + 4} textAnchor="end" className="evidence-axis-text">{tick}</text>
              </g>
            ))}
            {depthCounts.map((count, depth) => (
              <g key={depth}>
                <line x1={x(depth)} y1={PAD.top} x2={x(depth)} y2={H - PAD.bottom} className="evidence-column" />
                <text x={x(depth)} y={H - PAD.bottom + 25} textAnchor="middle" className="evidence-axis-number">{depth}</text>
                <text x={x(depth)} y={H - PAD.bottom + 50} textAnchor="middle" className="evidence-axis-text">{count}</text>
              </g>
            ))}
            <text x={18} y={PAD.top + PLOT_H / 2} textAnchor="middle" className="evidence-axis-label"
              transform={`rotate(-90 18 ${PAD.top + PLOT_H / 2})`}>
              {metricLabel(metric).toUpperCase()} · 0–100
            </text>
            <text x={PAD.left + PLOT_W / 2} y={H - 4} textAnchor="middle" className="evidence-axis-label">
              EVIDENCE CHANNELS · WATCH COUNT BENEATH EACH
            </text>
            {plotted.map(({ card, value, depth }) => {
              const active = card.id === selected?.id
              const px = x(depth) + evidenceColumnOffset(card.id)
              const py = y(value)
              return (
                <g key={card.id} className={`evidence-point${active ? ' on' : ''}`}
                  style={{ transform: `translate(${px}px, ${py}px)` }}
                  onPointerEnter={() => setSelectedId(card.id)} onClick={() => setSelectedId(card.id)}>
                  <circle r={active ? 7 : 3.5}>
                    <title>{card.identity.brand} {card.identity.reference} · {metricLabel(metric)} {value} · {depth}/5 channels</title>
                  </circle>
                </g>
              )
            })}
          </svg>
          <p className="evidence-phone-axis evidence-phone-axis--bottom mono">Evidence channels · watch count beneath each</p>
        </div>

        {selected && selectedChannels && selectedMetric && (
          <aside className="evidence-readout" aria-live="polite">
            <p className="eyebrow">{selected.identity.brand.toUpperCase()} · {selected.identity.reference}</p>
            <h3>{selected.identity.name}</h3>
            <div className="evidence-readout-score">
              <strong>{metricValue(selected, metric) ?? '—'}</strong>
              <span className="mono">{metricValue(selected, metric) === null ? 'NO PUBLISHED SCORE' : `/100 ${metricLabel(metric).toUpperCase()}`}<br />{selectedMetric.tier?.toUpperCase() ?? 'NO TIER'} · {selectedMetric.k_of[0]}/{selectedMetric.k_of[1]} SIGNALS</span>
            </div>
            <p className="evidence-depth-line mono">{evidenceDepth(selected)}/5 PUBLIC EVIDENCE CHANNELS</p>
            <dl className="evidence-channel-list">
              {EVIDENCE_CHANNELS.map((channel) => (
                <div key={channel.key} className={selectedChannels[channel.key] ? 'has' : ''}>
                  <dt>{channel.label}</dt>
                  <dd className="mono">{selectedChannels[channel.key] ? 'ON FILE' : 'MISSING'}</dd>
                </div>
              ))}
            </dl>
            <p className="micro dim evidence-limitation">{selectedMetric.limitation}</p>
            <p className="micro mono dim">
              PUBLIC BUILD {built} · METHOD V2
              {selected.comp_summary ? ` · ${selected.comp_summary.n} COMPS · ${selected.comp_summary.venues.length} VENUES` : ' · NO COMPS'}
            </p>
            <Link to={`/w/${selected.id}`} className="evidence-open mono">OPEN DOSSIER →</Link>
          </aside>
        )}
      </div>
    </section>
  )
}
