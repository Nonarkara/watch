// RolexAxesBar — a compact 4-axes summary for each Rolex card on /photos.
// One-line + a horizontal bar per axis. Color is the strength; the number is
// the value. Same four signals as the dossier Top4Tiles (Rarity / Demand /
// Story / Resellability), recut to fit inside a 320px card without dominating it.

import type { Card } from '../lib/data.ts'

type Strength = 'strong' | 'neutral' | 'weak'

function classify(v: number | null, strong: number, weak: number): Strength {
  if (v == null) return 'weak'
  if (v >= strong) return 'strong'
  if (v >= weak) return 'neutral'
  return 'weak'
}

interface AxisRowProps {
  label: string
  /** Optional hover-tooltip title — used by Story to surface the old term. */
  title?: string
  display: string
  /** 0-100. Clamps the bar fill. Null = no bar. */
  bar: number | null
  caption: string
  strength: Strength
  hue: 'coral' | 'yellow' | 'navy' | 'teal'
}

function AxisRow({ label, title, display, bar, caption, strength, hue }: AxisRowProps) {
  const fillPct = bar != null ? Math.max(2, Math.min(100, bar)) : 0
  return (
    <div className={`rax rax--${strength} rax--${hue}`} title={title}>
      <div className="rax-head">
        <span className="rax-label mono">{label}</span>
        <span className="rax-value mono">{display}</span>
      </div>
      <div className="rax-bar" aria-hidden="true">
        <div className="rax-bar-fill" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="rax-caption mono">{caption}</div>
    </div>
  )
}

export default function RolexAxesBar({ card }: { card: Card }) {
  const { scarcity, collectibility, resellability } = card.computed
  const provCount = card.provenance_events.length

  const rarity = classify(scarcity.value, 70, 40)
  const demand = classify(collectibility.value, 70, 40)
  const story: Strength = provCount >= 5 ? 'strong' : provCount >= 1 ? 'neutral' : 'weak'
  const resell: Strength =
    resellability.tier === 'High' ? 'strong' :
    resellability.tier === 'Medium' ? 'neutral' :
    resellability.tier === 'Low' ? 'neutral' : 'weak'

  // Story bar uses the provenance event count, capped at 10 for a 0-100 scale.
  const storyBar = provCount > 0 ? Math.min(100, provCount * 10) : 0

  return (
    <div className="rax-grid" aria-label="Four-axes summary">
      <AxisRow
        label="RARITY"
        display={scarcity.value != null ? String(scarcity.value) : '—'}
        bar={scarcity.value}
        caption={scarcity.tier ? `${scarcity.tier.toUpperCase()} · ${scarcity.k_of[0]}/${scarcity.k_of[1]}` : 'NO SIGNALS'}
        strength={rarity}
        hue="coral"
      />
      <AxisRow
        label="DEMAND"
        display={collectibility.value != null ? String(collectibility.value) : '—'}
        bar={collectibility.value}
        caption={`${collectibility.k_of[0]}/${collectibility.k_of[1]} COMPONENTS`}
        strength={demand}
        hue="yellow"
      />
      <AxisRow
        label="STORY"
        title="Provenance — the dated, sourced history of the watch"
        display={String(provCount)}
        bar={storyBar}
        caption={provCount > 0
          ? `${provCount} SOURCED EVENT${provCount === 1 ? '' : 'S'}`
          : 'NO EVENTS ON FILE'}
        strength={story}
        hue="navy"
      />
      <AxisRow
        label="RESELL"
        display={resellability.value != null ? String(resellability.value) : '—'}
        bar={resellability.value}
        caption={resellability.tier === 'Unknown' ? 'NEVER TRADED' :
          `${resellability.tier.toUpperCase()} · ${resellability.sales_per_year}/YR`}
        strength={resell}
        hue="teal"
      />
    </div>
  )
}
