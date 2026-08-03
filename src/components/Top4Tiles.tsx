// Top4Tiles -- the four research-justified axes that answer what a collector
// first wants to know about a reference: Rarity, Demand, Story, Resellability.
// The internal data field is still `provenance_events` for backwards
// compatibility — the user-facing label is "STORY" because "provenance" was
// a word buyers had to look up. The evidence (dated, sourced events) is
// exactly the same.
// Each tile is a 3-state color block (Strong / Neutral / Weak) using the
// Time Pop pop-art palette. Color is never the only signal: each tile carries
// a symbol (▲ / ◐ / ▽) and a label, so a color-blind user reads the same
// information a sighted user does.

import type { Card } from '../lib/data.ts'

type Strength = 'strong' | 'neutral' | 'weak'

interface TileProps {
  label: string
  /** Optional native title for a hover tooltip — used by the Story tile to
   *  cross-reference the old "Provenance" term. */
  title?: string
  number: string
  caption: string
  strength: Strength
  /** Tinted accent color; defaults to amber. */
  hue?: 'coral' | 'yellow' | 'navy' | 'teal'
}

const STRENGTH_SYMBOL: Record<Strength, string> = {
  strong: '\u25B2',  // ▲
  neutral: '\u25D0', // ◐
  weak: '\u25BD',    // ▽
}
const STRENGTH_LABEL: Record<Strength, string> = {
  strong: 'STRONG',
  neutral: 'NEUTRAL',
  weak: 'WEAK',
}

function Tile({ label, title, number, caption, strength, hue = 'coral' }: TileProps) {
  return (
    <div className={`top4-tile top4-tile--${strength} top4-hue--${hue}`} data-state={strength} title={title}>
      <div className="top4-tile-symbol" aria-hidden="true">{STRENGTH_SYMBOL[strength]}</div>
      <div className="top4-tile-label mono">{label}</div>
      <div className="top4-tile-num">{number}</div>
      <div className="top4-tile-caption mono">{STRENGTH_LABEL[strength]} &middot; {caption}</div>
    </div>
  )
}

function classify(v: number | null, strong: number, weak: number): Strength {
  if (v == null) return 'weak'
  if (v >= strong) return 'strong'
  if (v >= weak) return 'neutral'
  return 'weak'
}

export default function Top4Tiles({ card }: { card: Card }) {
  const { scarcity, collectibility } = card.computed
  const provCount = card.provenance_events.length

  // Rarity: scarcity index 0-100, Strong >= 70 (a touch above the "Grail" 75 floor
  // of the existing tier, so "Strong" demands demonstrable rarity, not just the
  // top label).
  const rarity = classify(scarcity.value, 70, 40)
  // Demand: collectibility index 0-100, same threshold. The 30pt cap on the
  // premium sub-signal means a 60% premium alone never crosses 70.
  const demand = classify(collectibility.value, 70, 40)
  // Story (was "Provenance"): count of dated, sourced events. Strong >= 5;
  // Neutral 1-4; Weak 0. The events field is still called provenance_events
  // in the data — only the user-facing label changed.
  const provenance: Strength = provCount >= 5 ? 'strong' : provCount >= 1 ? 'neutral' : 'weak'
  // Resellability: 0-100 composite. Strong >= 70; Neutral 40-69; Weak < 40.
  // Uses the engine's tier rather than the numeric value so the colors match
  // the engine's published bands ("High / Medium / Low").
  const resell = card.computed.resellability
  const resellability: Strength =
    resell.tier === 'High' ? 'strong' :
    resell.tier === 'Medium' ? 'neutral' :
    resell.tier === 'Low' ? 'neutral' : 'weak'

  return (
    <section className="top4" aria-label="The four axes collectors first want to know">
      <div className="top4-head">
        <p className="eyebrow">THE 4 AXES A COLLECTOR FIRST WANTS TO KNOW</p>
        <p className="top4-rule">RARITY &middot; DEMAND &middot; STORY &middot; RESELLABILITY</p>
      </div>
      <div className="top4-grid">
        <Tile
          label="Rarity"
          number={scarcity.value != null ? String(scarcity.value) : '—'}
          caption={scarcity.tier ? `${scarcity.tier.toUpperCase()} &middot; ${scarcity.k_of[0]}/${scarcity.k_of[1]} SIGNALS` : 'NO SIGNALS'}
          strength={rarity}
          hue="coral"
        />
        <Tile
          label="Demand"
          number={collectibility.value != null ? String(collectibility.value) : '—'}
          caption={`${collectibility.k_of[0]}/${collectibility.k_of[1]} COMPONENTS`}
          strength={demand}
          hue="yellow"
        />
        <Tile
          label="Story"
          title="Provenance — the dated, sourced history of the watch"
          number={String(provCount)}
          caption={provCount > 0
            ? `${provCount} SOURCED EVENT${provCount === 1 ? '' : 'S'}`
            : 'NO EVENTS ON FILE'}
          strength={provenance}
          hue="navy"
        />
        <Tile
          label="Resellability"
          number={resell.value != null ? String(resell.value) : '—'}
          caption={resell.tier === 'Unknown' ? 'NEVER TRADED' :
            `${resell.tier.toUpperCase()} &middot; ${resell.sales_per_year} SALE${resell.sales_per_year === 1 ? '' : 'S'}/YR`}
          strength={resellability}
          hue="teal"
        />
      </div>
      <p className="top4-meta mono">
        These four are the auction-trinity reduced to a reference-level dossier.
        The full evidence is below in the metric strip and provenance timeline.{' '}
        <a href="/methodology" className="src-a">HOW THESE ARE COMPUTED &rarr;</a>
      </p>
    </section>
  )
}
