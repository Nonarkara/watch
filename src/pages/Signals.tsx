import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { cardsInScarcityTier, scarcityReasons, scarcitySummary, SCARCITY_TIERS, type ScarcityTier } from '../lib/signals.ts'

export default function Signals() {
  const data = useDataset()
  const [tier, setTier] = useState<ScarcityTier>('Scarce')
  if (!data) return null

  const summary = scarcitySummary(data.cards)
  const cards = cardsInScarcityTier(data.cards, tier)

  return (
    <>
      <p className="eyebrow">Scarcity Economics</p>
      <h1 className="pagetitle">Scarcity is not one thing</h1>
      <p className="lede">
        Scarcity describes how hard a watch is to find, not what it’s worth. Each score shows how
        many public signals support it.
      </p>

      <details className="scarcity-guide">
        <summary>What goes into the scarcity score?</summary>
      <div className="metric-strip scarcity-summary">
        <SummaryCell label="References" value={summary.total} note="THE FULL REGISTER" />
        <SummaryCell label="Closed supply" value={summary.discontinued} note="PRODUCTION ENDED" />
        <SummaryCell label="Fixed editions" value={summary.limited} note="MAKER-STATED LIMITED" />
        <SummaryCell label="Waitlist evidence" value={summary.waitlisted} note="SOURCED PUBLIC CLAIMS" />
      </div>

        <dl className="spec-grid">
          <Signal label="Production status" text="Once a reference is discontinued, the supply can circulate but cannot grow through new production." />
          <Signal label="Edition size" text="A maker-stated limit closes supply from launch. A numbered edition is evidence; the word ‘rare’ is not." />
          <Signal label="Brand capacity" text="Annual brand output supplies context, but never pretends to be a secret per-reference production figure." />
          <Signal label="Observed availability" text="Recent listings indicate how often examples surface. Thin venue coverage is treated as a limitation." />
          <Signal label="Waitlist evidence" text="Sourced allocation or waitlist reports describe constrained access, which is demand pressure rather than physical rarity." />
        </dl>
      </details>

      <section className="sect scarcity-distribution">
        <h2 className="sect-h"><span>Read the distribution</span><span className="mono" role="status">{cards.length} {tier.toUpperCase()} REFERENCE{cards.length === 1 ? '' : 'S'}</span></h2>
        <div className="chips scarcity-chips" role="group" aria-label="Scarcity tier">
          {SCARCITY_TIERS.map((name) => (
            <button type="button" key={name} aria-pressed={tier === name} className={'chip' + (tier === name ? ' on' : '')} onClick={() => setTier(name)}>
              {name} · {summary.tierCounts[name]}
            </button>
          ))}
        </div>
        <div className="scarcity-list">
          {cards.map((card) => {
            const reasons = scarcityReasons(card)
            return (
              <Link to={`/w/${card.id}`} className="scarcity-row" key={card.id}>
                <span>
                  <span className="l-brand">{card.identity.brand}</span>{' '}
                  <span className="l-ref mono">{card.identity.reference}</span>
                  {card.identity.nickname && <span className="l-nick"> “{card.identity.nickname}”</span>}
                </span>
                <span className="scarcity-score mono">
                  <strong>{card.computed.scarcity.value}/100</strong>
                  <span className="micro dim">{card.computed.scarcity.k_of[0]}/{card.computed.scarcity.k_of[1]} signals</span>
                </span>
                {reasons.length > 0 && <span className="scarcity-reasons micro dim">{reasons.join(' · ')}</span>}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="sect prose">
        <h2 className="sect-h"><span>What the score cannot tell you</span></h2>
        <p>
          Scarcity is neither quality nor desirability. A common watch may be historically important;
          a limited watch may remain unwanted. The score is a transparent proxy built from public
          evidence, renormalized over the signals that exist. Open any dossier to see its limitations,
          or <Link className="src-a" to="/methodology">read the full methodology →</Link>
        </p>
      </section>
    </>
  )
}

function SummaryCell({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="mcell"><span className="lab">{label}</span><span className="val big">{value}</span><span className="note mono">{note}</span></div>
}

function Signal({ label, text }: { label: string; text: string }) {
  return <div className="spec-row"><dt>{label}</dt><dd>{text}</dd></div>
}
