// Public sale observations; changing reference mix is not a price index.
import { useEffect, useRef, useState } from 'react'
import type { Card, Sale } from '../lib/data.ts'
import { usd } from '../lib/format.ts'

interface Props {
  cards: Card[]
  /** Brand name to filter to. 'All' shows every brand's sales as one stream. */
  brand?: string
  height?: number
}

const QUARTER = (iso: string) => {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
}

const MEDIAN = (xs: number[]) => {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// Pre-loaded real-world events from the working paper. Dates and labels are public record.
const EVENTS: { date: string; label: string; tone: 'milestone' | 'peak' | 'trough' }[] = [
  { date: '2021-01-25', label: 'Patek discontinues 5711', tone: 'milestone' },
  { date: '2021-12-11', label: 'Phillips 5711/1A-018 sells $6.5M', tone: 'peak' },
  { date: '2022-04-01', label: 'WatchCharts overall peaks', tone: 'peak' },
  { date: '2025-06-30', label: '13-quarter decline ends', tone: 'trough' },
]

export default function MarketChart({ cards, brand = 'Rolex', height = 340 }: Props) {
  const frame = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(880)
  const sales: (Sale & { reference: string })[] = []
  for (const c of cards) {
    if (brand !== 'All' && c.identity.brand !== brand) continue
    for (const s of c.notable_sales ?? []) {
      if (Number.isFinite(new Date(s.date).getTime()) && Number.isFinite(s.price_usd) && s.price_usd > 0) {
        sales.push({ ...s, reference: `${c.identity.brand} ${c.identity.reference}` })
      }
    }
  }
  const hasChart = sales.length >= 4
  useEffect(() => {
    const svg = frame.current
    if (!svg) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(180, Math.round(entry.contentRect.width))))
    observer.observe(svg)
    return () => observer.disconnect()
  }, [hasChart])
  if (sales.length < 4) {
    return (
      <div className="empty-photo compact">
        <strong>NOT ENOUGH SALES</strong>
        <span>Need at least 4 comparable sales in the register to draw this chart for {brand}.</span>
      </div>
    )
  }

  // Sort chronologically.
  const sortedSales = [...sales].sort((a, b) => a.date.localeCompare(b.date))

  // Keep extreme observations in the source list rather than clipping them
  // against the plot ceiling or assuming why they fetched a high price.
  const allPrices = sortedSales.map((s) => s.price_usd).sort((a, b) => a - b)
  const overallMedian = MEDIAN(allPrices) ?? 0
  const OUTLIER_MULTIPLE = 5
  const isOutlier = (p: number) => overallMedian > 0 && p > overallMedian * OUTLIER_MULTIPLE
  const inliers = sortedSales.filter((s) => !isOutlier(s.price_usd))
  const outliers = sortedSales.filter((s) => isOutlier(s.price_usd))

  // Only mark quarters with two or more observations. Position each marker
  // at the median observed date, not an invented date parsed from "2026-Q1".
  const buckets = new Map<string, Sale[]>()
  for (const s of inliers) {
    const q = QUARTER(s.date)
    if (!buckets.has(q)) buckets.set(q, [])
    buckets.get(q)!.push(s)
  }
  const quarterly = [...buckets.entries()]
    .filter(([, xs]) => xs.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([q, xs]) => ({ q, median: MEDIAN(xs.map((s) => s.price_usd))!,
      date: MEDIAN(xs.map((s) => new Date(s.date).getTime()))!, n: xs.length }))

  // Chart geometry
  const W = width
  const compact = W < 560
  const H = compact ? Math.min(height, 230) : height
  const PAD_L = compact ? 62 : 76
  const PAD_R = compact ? 20 : 28
  const PAD_T = 36
  const PAD_B = 40
  // x-range covers the full date range, not just the dense quarters — so individual sales outside
  // the dense buckets still sit where they belong.
  const t0 = new Date(sortedSales[0].date).getTime()
  const t1 = new Date(sortedSales[sortedSales.length - 1].date).getTime()
  // y-range covers inlier sales and quarterly medians only; outliers render above the frame.
  const allValues = [
    ...inliers.map((s) => s.price_usd),
    ...quarterly.map((q) => q.median),
  ]
  const vmax = Math.max(...allValues)
  const vmin = Math.min(...allValues)
  const ypad = (vmax - vmin) * 0.12 || vmax * 0.1
  const yLo = Math.max(0, vmin - ypad)
  const yHi = vmax + ypad
  const x = (t: number) => PAD_L + ((t - t0) / (t1 - t0 || 1)) * (W - PAD_L - PAD_R)
  const y = (v: number) => PAD_T + (1 - (v - yLo) / (yHi - yLo || 1)) * (H - PAD_T - PAD_B)

  // Convert events within the chart window into x positions
  const visibleEvents = EVENTS.filter((e) => {
    const t = new Date(e.date).getTime()
    return t >= t0 && t <= t1
  })

  // Evenly spaced ticks across the displayed price range.
  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yLo + ((yHi - yLo) * i) / ticks)
  const tickLabel = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
  // x-axis labels: show 6 evenly-spaced dates from the full range
  const xTickCount = t0 === t1 ? 1 : compact ? 3 : Math.min(6, sortedSales.length)
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / Math.max(1, xTickCount - 1)
    return new Date(t)
  })

  const lastSale = sortedSales[sortedSales.length - 1]

  return (
    <figure className="market-chart">
      <div className="market-chart-head">
        <div>
          <p className="eyebrow">{brand.toUpperCase()} · PUBLISHED SALE OBSERVATIONS</p>
          <h3>{sortedSales.length} sales · {sortedSales[0].date.slice(0, 7)} to {lastSale.date.slice(0, 7)}</h3>
          <p className="dim">
            Different references sold at different times. This is not a price index or a return.
          </p>
        </div>
        <div className="market-chart-legend">
          <span className="lg-dot">• <small>ONE SALE</small></span>
          {!!quarterly.length && <span className="lg-line">◇ <small>QUARTER MEDIAN</small></span>}
          {!!visibleEvents.length && <span className="lg-event">┃ <small>MARKET EVENT</small></span>}
        </div>
      </div>
      <svg ref={frame} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${brand} observed sale prices in US dollars by date`}>
        {/* grid lines */}
        {yTicks.map((v, i) => (
          <g key={`y-${i}`}>
            <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? '' : '2 4'} />
            <text x={PAD_L - 8} y={y(v) + 4} fontSize="11" fontFamily="var(--font-mono)" fill="var(--dim)" textAnchor="end">{tickLabel.format(v)}</text>
          </g>
        ))}
        {/* Event guides stay behind sale dots; the keyed text lives outside the plot. */}
        {visibleEvents.map((event, i) => {
          const cx = x(new Date(event.date).getTime())
          return (
            <g key={event.date}>
              <title>{event.date} · {event.label}</title>
              <line x1={cx} y1={PAD_T} x2={cx} y2={H - PAD_B} stroke="var(--dim)" strokeWidth="1" strokeDasharray="2 3" />
              <text x={cx} y={PAD_T - 8 - (i % 2) * 12} textAnchor="middle" fontSize="11" fill="var(--fg)">{i + 1}</text>
            </g>
          )
        })}
        {/* individual sale dots — the honest data layer */}
        {inliers.map((s, i) => {
          const t = new Date(s.date).getTime()
          return (
            <circle key={`s-${i}`} cx={x(t)} cy={y(s.price_usd)} r="3" fill="var(--amber)" stroke="var(--bg)" strokeWidth="1" fillOpacity="0.7">
              <title>{`${s.reference} · ${s.date} · ${usd(s.price_usd)}`}</title>
            </circle>
          )
        })}
        {/* Diamonds distinguish sample summaries from actual sale dots. */}
        {quarterly.map((q, i) => {
          const cx = x(q.date), cy = y(q.median)
          return (
            <rect key={`q-${i}`} x={cx - 4} y={cy - 4} width="8" height="8" transform={`rotate(45 ${cx} ${cy})`} fill="var(--bg)" stroke="var(--amber)" strokeWidth="1.5">
              <title>{`${q.q} · ${usd(q.median)} · n=${q.n} (quarterly median)`}</title>
            </rect>
          )
        })}
        {/* x-axis labels */}
        {xTicks.map((d, i) => (
          <text key={`x-${i}`} x={x(d.getTime())} y={H - PAD_B + 16} fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)" textAnchor="middle">
            {d.toISOString().slice(0, 7)}
          </text>
        ))}
      </svg>
      {outliers.length > 0 && (
        <details className="market-chart-sources market-chart-outliers">
          <summary>{outliers.length} {outliers.length === 1 ? 'sale' : 'sales'} not plotted · above 5× the sample median</summary>
          <ul>
            {outliers.map((s, i) => (
              <li key={i} className="mono">
                <a className="src-a" href={s.url} target="_blank" rel="noreferrer">{s.reference} · {s.date}</a>
                <span>{usd(s.price_usd)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <figcaption className="micro dim">
        USD on the vertical axis. Diamonds mark medians of two or more plotted sales in the same quarter.
        Event markers are context, not explanations.
      </figcaption>
      <details className="market-chart-sources">
        <summary>Sale records and event dates</summary>
        <ul>
          {sortedSales.map((s, i) => <li key={i}><a className="src-a" href={s.url} target="_blank" rel="noreferrer">
            {s.reference} · {s.date} · {usd(s.price_usd)}
          </a></li>)}
        </ul>
        {!!visibleEvents.length && <ol aria-label="Market events">
          {visibleEvents.map((event) => <li key={event.date}>{event.date} · {event.label}</li>)}
        </ol>}
      </details>
    </figure>
  )
}
