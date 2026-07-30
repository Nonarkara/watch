import type { MsrpEntry, Sale } from '../lib/data.ts'
import { usd } from '../lib/format.ts'

// Price evidence chart: MSRP history as a dim step line, verified sales as amber squares.
// Renders only what exists — no interpolation, no trend-line invention.
export default function Sparkline({ msrp, sales, buildDate }: { msrp: MsrpEntry[]; sales: Sale[]; buildDate: string }) {
  const points = [
    ...msrp.map((m) => ({ t: Date.UTC(m.effective_year, 0, 1), v: m.price_usd })),
    ...sales.map((s) => ({ t: new Date(s.date).getTime(), v: s.price_usd })),
  ]
  if (points.length < 2) return null

  const W = 600, H = 150, PAD = 8, LBL = 18
  const t0 = Math.min(...points.map((p) => p.t))
  const t1 = Math.max(new Date(buildDate).getTime(), ...points.map((p) => p.t))
  const v1 = Math.max(...points.map((p) => p.v)) * 1.08
  const x = (t: number) => PAD + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * PAD)
  const y = (v: number) => PAD + (1 - v / v1) * (H - 2 * PAD - LBL)

  // MSRP as a step line carried forward to the build date
  const steps: string[] = []
  const sortedMsrp = [...msrp].sort((a, b) => a.effective_year - b.effective_year)
  sortedMsrp.forEach((m, i) => {
    const tx = Date.UTC(m.effective_year, 0, 1)
    const next = sortedMsrp[i + 1] ? Date.UTC(sortedMsrp[i + 1].effective_year, 0, 1) : t1
    steps.push(`${i === 0 ? 'M' : 'L'} ${x(tx)} ${y(m.price_usd)} L ${x(next)} ${y(m.price_usd)}`)
  })

  const yr = (t: number) => new Date(t).getUTCFullYear()
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} aria-label="Price evidence chart">
      <line x1={PAD} y1={H - PAD - LBL} x2={W - PAD} y2={H - PAD - LBL} stroke="var(--line)" strokeWidth="1" />
      {steps.length > 0 && (
        <path d={steps.join(' ')} fill="none" stroke="var(--dim)" strokeWidth="1.5" strokeDasharray="1 3" />
      )}
      {sales.map((s, i) => (
        <rect key={i} x={x(new Date(s.date).getTime()) - 3} y={y(s.price_usd) - 3} width="6" height="6" fill="var(--amber)">
          <title>{`${s.date} · ${usd(s.price_usd)}`}</title>
        </rect>
      ))}
      <text x={PAD} y={H - 4} fill="var(--dim)" fontSize="11" fontFamily="var(--font-mono)">{yr(t0)}</text>
      <text x={W - PAD} y={H - 4} fill="var(--dim)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="end">{yr(t1)}</text>
      <text x={W - PAD} y={PAD + 10} fill="var(--dim)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="end">{usd(v1 / 1.08)}</text>
    </svg>
  )
}
