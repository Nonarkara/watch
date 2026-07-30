import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../App.tsx'
import type { Card } from '../lib/data.ts'

export default function Discover() {
  const data = useDataset()
  const cards = useMemo(() => data?.cards.filter((c) => c.narrative.story) ?? [], [data])
  const [index, setIndex] = useState(() => Math.floor(Date.now() / 86_400_000))
  if (!data || cards.length === 0) return null

  const card = cards[index % cards.length]
  const signals = scarcitySignals(card)
  const next = () => setIndex((current) => {
    if (cards.length < 2) return current
    return current + 1 + Math.floor(Math.random() * (cards.length - 1))
  })

  return (
    <>
      <div className="discover-head">
        <div>
          <p className="eyebrow">Discovery</p>
          <h1 className="pagetitle">One watch. Three ways to see it.</h1>
          <p className="lede">No quiz, no expertise required. Keep the fact that interests you and leave the rest.</p>
        </div>
        <button type="button" className="btn" onClick={next}>SHOW ME ANOTHER →</button>
      </div>

      <article className="discovery-card">
        <header className="discovery-mast">
          <p className="eyebrow">{card.identity.brand} · {card.identity.collection}</p>
          <h2>{card.identity.name} <span className="mono">{card.identity.reference}</span></h2>
          {card.identity.nickname && <p className="mast-nick">“{card.identity.nickname}”</p>}
          <p>{card.identity.one_liner}</p>
        </header>

        <div className="discovery-grid">
          <section>
            <p className="discover-kicker mono">01 · THE OBJECT</p>
            <h3>What are you looking at?</h3>
            <p>{card.narrative.story}</p>
            <dl className="mini-specs">
              <div><dt>Case</dt><dd>{card.identity.case.diameter_mm}mm · {card.identity.case.material}</dd></div>
              <div><dt>Movement</dt><dd>{card.identity.movement.caliber} · {card.identity.movement.type}</dd></div>
              <div><dt>Production</dt><dd>{card.identity.produced.start_year}–{card.identity.produced.end_year ?? 'present'}</dd></div>
            </dl>
          </section>

          <section>
            <p className="discover-kicker mono">02 · THE ECONOMY</p>
            <h3>Where does scarcity come from?</h3>
            <p className="scarcity-number mono">{card.computed.scarcity.value}<span>/100</span></p>
            <p className="dim">A proxy built from {card.computed.scarcity.k_of[0]} of {card.computed.scarcity.k_of[1]} public signals — not a secret production number.</p>
            <ul className="signal-list">
              {signals.map((signal) => <li key={signal}>{signal}</li>)}
            </ul>
            <Link className="src-a" to="/methodology">How the score works →</Link>
          </section>

          <section id="conversation">
            <p className="discover-kicker mono">03 · THE CONVERSATION</p>
            <h3>A question worth stealing</h3>
            <blockquote>“{conversationPrompt(card)}”</blockquote>
            <p className="dim">The useful conversation is rarely “will it go up?” It is what this object reveals about value, taste, technology, or memory.</p>
            {card.provenance_events[0] && (
              <p className="conversation-fact"><span className="mono micro dim">A FACT TO BRING</span><br />{card.provenance_events[0].description}</p>
            )}
          </section>
        </div>

        <footer className="discovery-foot">
          <span className="mono micro dim">{card.meta.sources.length} SOURCES · {card.provenance_events.length} SOURCED EVENTS</span>
          <Link className="btn secondary" to={`/w/${card.id}`}>OPEN FULL DOSSIER →</Link>
        </footer>
      </article>
    </>
  )
}

function scarcitySignals(card: Card): string[] {
  const signals = [
    card.identity.produced.discontinued
      ? `Supply is closed: production ended in ${card.identity.produced.end_year}.`
      : 'Supply is still open: production continues.',
  ]
  if (card.scarcity_public.limited_edition.is_limited) {
    signals.push(card.scarcity_public.limited_edition.stated_size
      ? `The maker stated an edition of ${card.scarcity_public.limited_edition.stated_size.toLocaleString()} pieces.`
      : 'The maker calls it limited, but did not publish the edition size.')
  } else {
    signals.push('It was not sold as a numbered limited edition.')
  }
  signals.push(card.scarcity_public.waitlist_evidence_n > 0
    ? `${card.scarcity_public.waitlist_evidence_n} sourced waitlist signal${card.scarcity_public.waitlist_evidence_n === 1 ? '' : 's'} inform demand pressure.`
    : 'No sourced waitlist claim is being used.')
  return signals
}

function conversationPrompt(card: Card): string {
  if (card.scarcity_public.limited_edition.is_limited) {
    return 'Does numbering an object make it more meaningful, or only easier to market?'
  }
  if (card.identity.produced.discontinued) {
    return 'Why do we often want an object more once nobody can make another one?'
  }
  if (card.provenance_events.length > 0) {
    return 'Can a famous owner genuinely change an object’s meaning, or only its price?'
  }
  return 'What turns an excellent tool into something people choose to collect?'
}
