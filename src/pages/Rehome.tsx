import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import type { Card } from '../lib/data.ts'
import { dash, usd } from '../lib/format.ts'

import TransactionGraphic from '../components/TransactionGraphic.tsx'

export default function Rehome() {
  const data = useDataset()
  const [selectedId, setSelectedId] = useState('')
  const [story, setStory] = useState('')
  const [condition, setCondition] = useState('')
  const [included, setIncluded] = useState('')
  const [service, setService] = useState('')
  const [transfer, setTransfer] = useState('Sale at a fair, evidence-informed price')
  const [copied, setCopied] = useState(false)

  const cards = useMemo(
    () => [...(data?.cards ?? [])].sort((a, b) => `${a.identity.brand} ${a.identity.name}`.localeCompare(`${b.identity.brand} ${b.identity.name}`)),
    [data],
  )
  if (!data) return null
  const card = cards.find((c) => c.id === selectedId)
  const brief = card ? buildBrief(card, { story, condition, included, service, transfer }) : ''

  const copyBrief = async () => {
    if (!brief) return
    await navigator.clipboard.writeText(brief)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <p className="eyebrow">Responsible rehoming</p>
      <h1 className="pagetitle">Find the next custodian, not just a buyer</h1>
      <p className="lede">
        A thoughtful handover begins with the truth of the object: what it is, how it has lived,
        what comes with it, and what the next person should know. This tool turns those facts into a shareable brief.
      </p>

      <div className="rehome-layout">
        <form className="rehome-form" onSubmit={(event) => event.preventDefault()}>
          <div className="section-rule"><h2>Build the brief</h2><span className="mono micro dim">NOT A LISTING FORM</span></div>
          <label>
            <span className="field-label">Watch in the register</span>
            <select className="sel field" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setCopied(false) }}>
              <option value="">CHOOSE A REFERENCE…</option>
              {cards.map((c) => <option value={c.id} key={c.id}>{c.identity.brand.toUpperCase()} · {c.identity.name.toUpperCase()} · {c.identity.reference}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Why are you passing it on?</span>
            <textarea className="inp field area" value={story} onChange={(event) => setStory(event.target.value)} placeholder="The honest, human part of the story…" />
          </label>
          <label>
            <span className="field-label">Condition and known issues</span>
            <textarea className="inp field area" value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="Wear, marks, accuracy, replaced parts — disclose what you know." />
          </label>
          <label>
            <span className="field-label">What is included?</span>
            <input className="inp field" value={included} onChange={(event) => setIncluded(event.target.value)} placeholder="Watch, box, papers, links, receipts…" />
          </label>
          <label>
            <span className="field-label">Service and ownership history</span>
            <textarea className="inp field area" value={service} onChange={(event) => setService(event.target.value)} placeholder="Dates, work performed, documentation, previous owners…" />
          </label>
          <label>
            <span className="field-label">Preferred handover</span>
            <select className="sel field" value={transfer} onChange={(event) => setTransfer(event.target.value)}>
              <option>Sale at a fair, evidence-informed price</option>
              <option>Trade for another watch</option>
              <option>Gift to the right person</option>
              <option>Still deciding</option>
            </select>
          </label>
        </form>

        <aside className="brief-preview" aria-live="polite">
          <div className="section-rule"><h2>Your handover brief</h2><span className="mono micro dim">PREVIEW</span></div>
          {card ? (
            <>
              <p className="eyebrow">Looking for the next custodian of</p>
              <h3>{card.identity.brand} {card.identity.name} <span className="mono">{card.identity.reference}</span></h3>
              <p className="dim">{card.identity.one_liner}</p>
              <dl className="brief-facts">
                <BriefFact label="Why it is moving on" value={story} />
                <BriefFact label="Condition & disclosure" value={condition} />
                <BriefFact label="Included" value={included} />
                <BriefFact label="Service & ownership" value={service} />
                <BriefFact label="Preferred handover" value={transfer} />
                <BriefFact label="Register context" value={marketContext(card)} />
              </dl>
              <TransactionGraphic card={card} />
              <button type="button" className="btn" onClick={copyBrief}>{copied ? 'COPIED ✓' : 'COPY BRIEF'}</button>
              <Link className="brief-dossier src-a" to={`/w/${card.id}`}>Open the sourced dossier →</Link>
            </>
          ) : (
            <p className="empty-state">Choose a reference to begin. The register will supply identity and market context; you supply the object’s actual life.</p>
          )}
        </aside>
      </div>

      <section className="handover-checklist">
        <div className="section-rule"><h2>A good handover</h2><span className="mono micro dim">BEFORE YOU SHARE</span></div>
        <ol>
          <li><span className="mono">01</span><p><strong>Photograph the actual watch.</strong><br />Show every side, wear, included item, and identifying marks without publishing a full serial number.</p></li>
          <li><span className="mono">02</span><p><strong>Separate fact from memory.</strong><br />Keep receipts and service records with claims; label family stories as stories.</p></li>
          <li><span className="mono">03</span><p><strong>Disclose interventions.</strong><br />State polishing, replaced parts, aftermarket components, water damage, and known accuracy issues.</p></li>
          <li><span className="mono">04</span><p><strong>Protect both people.</strong><br />Use authentication, written terms, insured delivery, and a payment method appropriate to the value and jurisdiction.</p></li>
        </ol>
        <p className="micro dim">Time Pop does not broker transactions, hold funds, authenticate watches, or endorse counterparties.</p>
      </section>
    </>
  )
}

function BriefFact({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value.trim() || 'Not added yet.'}</dd></div>
}

function marketContext(card: Card): string {
  const estimate = card.computed.estimate
  if (estimate.value == null) return `No market estimate — ${estimate.limitation}`
  return `${usd(estimate.value)} evidence-based estimate from ${estimate.n} verified sales over ${estimate.window_months} months. This is context, not an asking-price recommendation.`
}

function buildBrief(card: Card, fields: Record<'story' | 'condition' | 'included' | 'service' | 'transfer', string>): string {
  return [
    `LOOKING FOR THE NEXT CUSTODIAN OF`,
    `${card.identity.brand} ${card.identity.name} · ${card.identity.reference}`,
    card.identity.one_liner,
    '',
    `WHY IT IS MOVING ON\n${fields.story.trim() || dash}`,
    `CONDITION & DISCLOSURE\n${fields.condition.trim() || dash}`,
    `INCLUDED\n${fields.included.trim() || dash}`,
    `SERVICE & OWNERSHIP\n${fields.service.trim() || dash}`,
    `PREFERRED HANDOVER\n${fields.transfer}`,
    `REGISTER CONTEXT\n${marketContext(card)}`,
    '',
    `Sourced dossier: ${window.location.origin}/w/${card.id}`,
  ].join('\n\n')
}
