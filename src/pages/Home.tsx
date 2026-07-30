import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'

const DOORS = [
  {
    n: '01',
    label: 'Pass it on',
    title: 'Find the next custodian',
    body: 'Build an honest handover brief around condition, history, and care — not sales theatre.',
    to: '/rehome',
    action: 'MAKE A REHOMING BRIEF',
  },
  {
    n: '02',
    label: 'Follow curiosity',
    title: 'Meet a watch you did not search for',
    body: 'Draw one reference and learn its object, its story, and the small detail worth remembering.',
    to: '/discover',
    action: 'SURPRISE ME',
  },
  {
    n: '03',
    label: 'Read the market',
    title: 'See scarcity without the hype',
    body: 'Separate limited supply, social demand, and thin evidence. Every score shows what is known.',
    to: '/register',
    action: 'OPEN THE REGISTER',
  },
  {
    n: '04',
    label: 'Bring a story',
    title: 'Take one good question to dinner',
    body: 'Use watches to talk about taste, technology, status, inheritance, and what makes an object matter.',
    to: '/discover#conversation',
    action: 'DRAW A CONVERSATION',
  },
]

export default function Home() {
  const data = useDataset()
  if (!data) return null

  const sourceLinks = data.cards.reduce((sum, c) => sum + c.meta.sources.length, 0)
  const reference = data.cards.find((c) => c.provenance_events.length > 0) ?? data.cards[0]

  return (
    <>
      <section className="home-hero">
        <p className="eyebrow">A cultural register for watches</p>
        <h1 className="home-title">Watches are more than prices.</h1>
        <p className="home-lede">
          Understand the object, the story, and the forces around it — whether you are caring for one,
          passing one on, learning for fun, or simply looking for something good to talk about.
        </p>
        <div className="home-proof mono" aria-label="Register coverage">
          <span><strong>{data.count}</strong> references</span>
          <span><strong>{sourceLinks}</strong> source links</span>
          <span><strong>0</strong> invented prices</span>
        </div>
      </section>

      <section className="purpose-section" aria-labelledby="choose-path">
        <div className="section-rule">
          <h2 id="choose-path">What brings you here?</h2>
          <span className="mono micro dim">CHOOSE A WAY IN</span>
        </div>
        <div className="purpose-grid">
          {DOORS.map((door) => (
            <Link to={door.to} className="purpose-card" key={door.n}>
              <span className="eyebrow">{door.label}</span>
              <h3>{door.title}</h3>
              <p>{door.body}</p>
              <span className="purpose-action mono">{door.action} →</span>
            </Link>
          ))}
        </div>
      </section>

      {reference && (
        <section className="home-feature" aria-labelledby="today-title">
          <div>
            <p className="eyebrow">One object, many readings</p>
            <h2 id="today-title">Start with the {reference.identity.name}</h2>
            <p className="dim">{reference.identity.one_liner}</p>
          </div>
          <div className="feature-readings">
            <div><span className="mono micro dim">AS AN OBJECT</span><p>{reference.identity.case.diameter_mm}mm {reference.identity.case.material.toLowerCase()} case, caliber {reference.identity.movement.caliber}.</p></div>
            <div><span className="mono micro dim">AS AN ECONOMY</span><p>Scarcity {reference.computed.scarcity.value}/100, based on {reference.computed.scarcity.k_of[0]} of {reference.computed.scarcity.k_of[1]} public signals.</p></div>
            <div><span className="mono micro dim">AS A STORY</span><p>{reference.provenance_events[0]?.person_or_event ?? firstSentence(reference.narrative.story)}</p></div>
          </div>
          <Link className="btn" to={`/w/${reference.id}`}>READ THE DOSSIER →</Link>
        </section>
      )}
    </>
  )
}

function firstSentence(text: string): string {
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]
  return sentence?.trim() ?? text
}
