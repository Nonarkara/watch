// TrendSpark — a tiny inline price trend for register cards.
// Renders only when the card has at least 2 published sale points, otherwise null.
import type { Sale } from '../lib/data.ts'

export default function TrendSpark({ sales }: { sales: Sale[] }) {
  if (!sales || sales.length < 2) return null
  // Sort by date and render as a polyline + last-point dot
  const sorted = [...sales].sort((a, b) => a.date.localeCompare(b.date))
  const W = 100, H = 22, PAD = 2
  const t0 = new Date(sorted[0].date).getTime()
  const t1 = new Date(sorted[sorted.length - 1].date).getTime()
  const vmax = Math.max(...sorted.map((s) => s.price_usd))
  const vmin = Math.min(...sorted.map((s) => s.price_usd))
  const x = (t: number) => PAD + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * PAD)
  const y = (v: number) => PAD + (1 - (v - vmin) / (vmax - vmin || 1)) * (H - 2 * PAD)
  const path = sorted.map((s, i) => {
    const t = new Date(s.date).getTime()
    return `${i === 0 ? 'M' : 'L'} ${x(t)} ${y(s.price_usd)}`
  }).join(' ')
  const last = sorted[sorted.length - 1]
  const first = sorted[0]
  const trend = last.price_usd > first.price_usd ? 'up' : last.price_usd < first.price_usd ? 'down' : 'flat'
  const changePct = ((last.price_usd - first.price_usd) / first.price_usd) * 100
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  return (
    <div className="rc-trend" aria-label={`${trend} ${Math.abs(changePct).toFixed(0)}% across ${sales.length} sales`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="rc-trend-svg" aria-hidden="true">
        <path d={path} fill="none" stroke="var(--amber)" strokeWidth="1.2" />
        <circle cx={x(new Date(last.date).getTime())} cy={y(last.price_usd)} r="1.5" fill="var(--amber)" />
      </svg>
      <span className={`rc-trend-tag rc-trend-${trend} mono`}>{arrow} {Math.abs(changePct).toFixed(0)}%</span>
    </div>
  )
}
