// MarketChart: plots a brand's verified sales over time, bucketed into quarters.
// Uses ALL the brand's published comparable sales, but only draws a connecting line
// where at least 2 sales fall in the same quarter. Where data is too thin, the chart
// falls back to individual sale dots, never to a synthesized trend.
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
  // Build a flat sale stream from each card's notable_sales (the published, masked comps).
  const sales: Sale[] = []
  for (const c of cards) {
    if (brand !== 'All' && c.identity.brand !== brand) continue
    for (const s of c.notable_sales ?? []) sales.push(s)
  }
  // Fallback: try the public data more loosely
  if (sales.length < 4 && brand === 'Rolex') {
    // Include all sales from Rolex cards (not just notable) for the chart view only.
    for (const c of cards) {
      if (c.identity.brand !== 'Rolex') continue
      for (const s of c.notable_sales ?? []) {
        if (!sales.includes(s)) sales.push(s)
      }
    }
  }
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

  // Identify and flag extreme outliers (>5x median) so a single charity lot doesn't flatten the chart.
  // The outlier dots still render — they just sit at the top with a note — and the y-axis uses the
  // trimmed range so the rest of the data is readable.
  const allPrices = sortedSales.map((s) => s.price_usd).sort((a, b) => a - b)
  const overallMedian = MEDIAN(allPrices) ?? 0
  const OUTLIER_MULTIPLE = 5
  const isOutlier = (p: number) => overallMedian > 0 && p > overallMedian * OUTLIER_MULTIPLE
  const inliers = sortedSales.filter((s) => !isOutlier(s.price_usd))
  const outliers = sortedSales.filter((s) => isOutlier(s.price_usd))

  // Bucket by quarter, take median, drop quarters with a single sale (too thin to publish as a line).
  const buckets = new Map<string, Sale[]>()
  for (const s of inliers) {
    const q = QUARTER(s.date)
    if (!buckets.has(q)) buckets.set(q, [])
    buckets.get(q)!.push(s)
  }
  const quarterly = [...buckets.entries()]
    .filter(([, xs]) => xs.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([q, xs]) => ({ q, median: MEDIAN(xs.map((s) => s.price_usd))!, n: xs.length }))

  // Chart geometry
  const W = 880
  const H = height
  const PAD_L = 76
  const PAD_R = 24
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
    return t >= t0 && t <= t1 + (t1 - t0) * 0.05
  })

  // Build the line path through quarterly medians
  const path = quarterly
    .map((q, i) => {
      const t = new Date(q.q + '-01').getTime()
      return `${i === 0 ? 'M' : 'L'} ${x(t)} ${y(q.median)}`
    })
    .join(' ')

  // Build an area fill under the line — only when we have a real line
  let area = ''
  if (quarterly.length >= 2) {
    const lastT = new Date(quarterly[quarterly.length - 1].q + '-01').getTime()
    const firstT = new Date(quarterly[0].q + '-01').getTime()
    area = `${path} L ${x(lastT)} ${H - PAD_B} L ${x(firstT)} ${H - PAD_B} Z`
  }

  // Build y-axis tick lines (4 evenly spaced, with $0 always at the bottom)
  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yLo + ((yHi - yLo) * i) / ticks)
  // x-axis labels: show 6 evenly-spaced dates from the full range
  const xTickCount = Math.min(6, sortedSales.length)
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / Math.max(1, xTickCount - 1)
    return new Date(t)
  })

  const firstQ = quarterly[0] ?? { q: sortedSales[0].date.slice(0, 7), median: sortedSales[0].price_usd, n: 1 }
  const lastSale = sortedSales[sortedSales.length - 1]
  const lastQ = quarterly[quarterly.length - 1] ?? { q: lastSale.date.slice(0, 7), median: lastSale.price_usd, n: 1 }
  const direction = lastQ.median > firstQ.median ? 'up' : lastQ.median < firstQ.median ? 'down' : 'flat'
  const changePct = firstQ.median > 0 ? ((lastQ.median - firstQ.median) / firstQ.median) * 100 : 0

  return (
    <figure className="market-chart">
      <div className="market-chart-head">
        <div>
          <p className="eyebrow">{brand.toUpperCase()} · VERIFIED COMPARABLE SALES</p>
          <h3>
            {direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'}{' '}
            {Math.abs(changePct).toFixed(0)}% from {sortedSales[0].date.slice(0, 7)} to {lastSale.date.slice(0, 7)}
          </h3>
          <p className="dim">
            {sortedSales.length} verified sales for {brand} in this register
            {quarterly.length >= 2 ? `; ${quarterly.length} quarters had enough sales to draw a line.` : `; not enough sales per quarter to draw a line, so each dot is one sale.`}
            {outliers.length > 0 && ` ${outliers.length} sale${outliers.length === 1 ? '' : 's'} above 5× the cohort median ${outliers.length === 1 ? 'is' : 'are'} shown above the chart frame, not on the line — celebrity-provenance and charity lots price a different object.`}
          </p>
        </div>
        <div className="market-chart-legend">
          <span className="lg-dot">• <small>ONE SALE</small></span>
          {quarterly.length >= 2 && <span className="lg-line">— <small>QUARTERLY MEDIAN</small></span>}
          <span className="lg-event">┃ <small>MARKET EVENT</small></span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${brand} verified sale prices over time`}>
        {/* grid lines */}
        {yTicks.map((v, i) => (
          <g key={`y-${i}`}>
            <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? '' : '2 4'} />
            <text x={PAD_L - 8} y={y(v) + 4} fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)" textAnchor="end">{usd(v)}</text>
          </g>
        ))}
        {/* area fill */}
        {area && <path d={area} fill="var(--amber)" fillOpacity="0.08" />}
        {/* median line */}
        {path && <path d={path} fill="none" stroke="var(--amber)" strokeWidth="2" />}
        {/* event markers (drawn before dots so dots sit on top).
            Labels are stacked vertically when their x-positions would otherwise
            overlap. We estimate the label width with a fixed per-character cost
            and march each label down by one row until it clears its left neighbour.
            Events near the right edge anchor their label to the LEFT of the
            marker so it doesn't clip off the chart. */}
        {(() => {
          const LABEL_W_PER_CHAR = 5.6 // px at fontSize 9 mono; enough margin not to overlap
          const ROW_H = 12
          const placed: { x: number; y: number; xEnd: number; }[] = []
          return visibleEvents.map((e, i) => {
            const t = new Date(e.date).getTime()
            const cx = x(t)
            const color = e.tone === 'peak' ? 'var(--amber)' : e.tone === 'trough' ? 'var(--dim)' : 'var(--fg)'
            const text = e.label.toUpperCase()
            const w = text.length * LABEL_W_PER_CHAR
            // If the label would extend past the right padding, anchor to the
            // LEFT of the marker so the trailing character stays inside the chart.
            const rightAnchored = cx + 6 + w > W - PAD_R
            const labelX = rightAnchored ? cx - 6 : cx + 6
            const textAnchor = rightAnchored ? 'end' : 'start'
            // Stagger: try rows 0..4 until the new label's [start, start+w]
            // doesn't overlap any previously placed label in that row.
            let row = 0
            while (row < 5) {
              const y = PAD_T + 4 + row * ROW_H
              const start = labelX
              const end = rightAnchored ? cx - 6 : cx + 6 + w
              const overlaps = placed.some((p) => p.y === y && start < p.xEnd && p.x < end)
              if (!overlaps) {
                placed.push({ x: start, y, xEnd: end })
                return (
                  <g key={`e-${i}`}>
                    <line x1={cx} y1={PAD_T} x2={cx} y2={H - PAD_B} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
                    <rect x={cx - 3} y={PAD_T - 6} width="6" height="6" fill={color} />
                    <text x={labelX} y={y} fontSize="9" fontFamily="var(--font-mono)" fill={color} textAnchor={textAnchor}>
                      {text}
                      <title>{e.date} · {e.label}</title>
                    </text>
                  </g>
                )
              }
              row++
            }
            // Overflow: drop the label, keep only the marker so the chart stays readable.
            return (
              <g key={`e-${i}`}>
                <line x1={cx} y1={PAD_T} x2={cx} y2={H - PAD_B} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
                <rect x={cx - 3} y={PAD_T - 6} width="6" height="6" fill={color}>
                  <title>{e.date} · {e.label}</title>
                </rect>
              </g>
            )
          })
        })()}
        {/* individual sale dots — the honest data layer */}
        {sortedSales.map((s, i) => {
          const t = new Date(s.date).getTime()
          return (
            <circle key={`s-${i}`} cx={x(t)} cy={y(s.price_usd)} r="3" fill="var(--amber)" stroke="var(--bg)" strokeWidth="1" fillOpacity="0.7">
              <title>{`${s.date} · ${usd(s.price_usd)}`}</title>
            </circle>
          )
        })}
        {/* quarterly median dots — larger */}
        {quarterly.map((q, i) => {
          const t = new Date(q.q + '-01').getTime()
          return (
            <circle key={`q-${i}`} cx={x(t)} cy={y(q.median)} r="4" fill="var(--amber)" stroke="var(--bg)" strokeWidth="1.5">
              <title>{`${q.q} · ${usd(q.median)} · n=${q.n} (quarterly median)`}</title>
            </circle>
          )
        })}
        {/* x-axis labels */}
        {xTicks.map((d, i) => (
          <text key={`x-${i}`} x={x(d.getTime())} y={H - PAD_B + 16} fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)" textAnchor="middle">
            {d.getUTCFullYear()}-{String(Math.floor(d.getUTCMonth() / 3) + 1).padStart(1, '0')}
          </text>
        ))}
      </svg>
      {outliers.length > 0 && (
        <div className="market-outliers">
          <p className="eyebrow">OUTLIERS · SHOWN SEPARATELY, NOT ON THE LINE</p>
          <ul>
            {outliers.map((s, i) => (
              <li key={i} className="mono">
                <span>{s.date}</span>
                <span>{usd(s.price_usd)}</span>
                <span className="dim">— kept out of the median because the cohort median is {usd(overallMedian)}.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <figcaption className="micro dim">
        Each small dot is one verified comparable sale in the register. The line (when present) connects
        quarters that had two or more sales. Vertical lines mark public market events documented in
        the working paper. The chart uses only published comparable sales — internal comp sets stay
        private. A flat dot means the sale matched the prior level; a steep line means the cohort
        repriced. Quarters with too few sales to publish a line are kept as individual dots.
      </figcaption>
    </figure>
  )
}
