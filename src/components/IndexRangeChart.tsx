import type { ContextIndex } from '../lib/data.ts'

/** Horizontal range bars for third-party index performance. Each bar spans the
 *  low–high range the sources report — the width IS the disagreement between
 *  sources, drawn honestly instead of averaged away. */
export default function IndexRangeChart({ indices }: { indices: ContextIndex[] }) {
  if (!indices.length) return null
  const max = Math.max(...indices.map((i) => i.high_pct)) * 1.15
  const W = 720, ROW = 56, LAB = 240, PAD_R = 64
  const H = indices.length * ROW + 30
  const x = (v: number) => LAB + (v / max) * (W - LAB - PAD_R)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg" role="img"
      aria-label="Twelve-month index performance, reported ranges">
      {/* zero line + gridlines at 5% steps */}
      {Array.from({ length: Math.floor(max / 5) + 1 }, (_, i) => i * 5).map((v) => (
        <g key={v}>
          <line x1={x(v)} y1={0} x2={x(v)} y2={H - 22} stroke={v === 0 ? 'var(--rule)' : 'var(--line)'} strokeWidth="1" />
          <text x={x(v)} y={H - 8} fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--dim)">+{v}%</text>
        </g>
      ))}
      {indices.map((idx, i) => {
        const y = i * ROW + 14
        return (
          <g key={idx.id}>
            <text x="0" y={y + 14} fontSize="11" fontFamily="var(--font-mono)" fill="var(--fg)">
              {idx.label.toUpperCase()}
            </text>
            <text x="0" y={y + 28} fontSize="9" fontFamily="var(--font-mono)" fill="var(--dim)">
              {idx.window.toUpperCase()} · REPORTED RANGE
            </text>
            <rect x={x(idx.low_pct)} y={y + 4} width={Math.max(2, x(idx.high_pct) - x(idx.low_pct))} height="16"
              fill="var(--amber)" fillOpacity="0.9" />
            <line x1={x(idx.low_pct)} y1={y} x2={x(idx.low_pct)} y2={y + 24} stroke="var(--fg)" strokeWidth="1" />
            <line x1={x(idx.high_pct)} y1={y} x2={x(idx.high_pct)} y2={y + 24} stroke="var(--fg)" strokeWidth="1" />
            <text x={x(idx.high_pct) + 8} y={y + 16} fontSize="11" fontFamily="var(--font-mono)" fill="var(--fg)">
              +{idx.low_pct}–{idx.high_pct}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}
