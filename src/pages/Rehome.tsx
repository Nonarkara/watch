import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import type { Card } from '../lib/data.ts'
import { dash, usd } from '../lib/format.ts'

import TransactionGraphic from '../components/TransactionGraphic.tsx'

type Draft = Record<'story' | 'condition' | 'included' | 'service' | 'transfer', string>
const emptyDraft: Draft = { story: '', condition: '', included: '', service: '', transfer: 'Still deciding' }

export default function Rehome() {
  const data = useDataset()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('watch') ?? ''
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [copiedBrief, setCopiedBrief] = useState('')
  const [copyFailed, setCopyFailed] = useState(false)

  const cards = useMemo(
    () => [...(data?.cards ?? [])].sort((a, b) => `${a.identity.brand} ${a.identity.name}`.localeCompare(`${b.identity.brand} ${b.identity.name}`)),
    [data],
  )
  if (!data) return null
  const card = cards.find((c) => c.id === selectedId)
  const draft = drafts[selectedId] ?? emptyDraft
  const { story, condition, included, service, transfer } = draft
  const changeDraft = (field: keyof Draft, value: string) => {
    setDrafts(current => ({ ...current, [selectedId]: { ...(current[selectedId] ?? emptyDraft), [field]: value } }))
  }
  const brief = card ? buildBrief(card, draft) : ''

  const copyBrief = async () => {
    if (!brief) return
    try {
      await navigator.clipboard.writeText(brief)
      setCopiedBrief(brief)
      setCopyFailed(false)
    } catch {
      setCopiedBrief('')
      setCopyFailed(true)
    }
  }

  return (
    <>
      <p className="eyebrow">Responsible rehoming</p>
      <h1 className="pagetitle">Pass a watch on</h1>
      <p className="lede">Make a brief for the next owner. Drafts aren’t posted or saved.</p>

      <div className={'rehome-layout' + (card ? ' rehome-layout--selected' : '')}>
        <form className="rehome-form" onSubmit={(event) => event.preventDefault()}>
          <div className="section-rule"><h2>Build the brief</h2>{card && <a className="src-a rehome-preview-link" href="#handover-preview">Preview ↓</a>}</div>
          <label>
            <span className="field-label">Watch in the register</span>
            <select id="rehome-watch" className="sel field" value={card?.id ?? ''} onChange={(event) => {
              setParams(event.target.value ? { watch: event.target.value } : {}, { replace: true })
              setCopiedBrief('')
              setCopyFailed(false)
            }}>
              <option value="">CHOOSE A REFERENCE…</option>
              {cards.map((c) => <option value={c.id} key={c.id}>{c.identity.brand.toUpperCase()} · {c.identity.name.toUpperCase()} · {c.identity.reference}</option>)}
            </select>
          </label>
          {card && <>
          <label>
            <span className="field-label">Why are you passing it on?</span>
            <textarea className="inp field area" rows={2} value={story} onChange={(event) => changeDraft('story', event.target.value)} placeholder="What should the next owner know about its story?" />
          </label>
          <label>
            <span className="field-label">Condition and known issues</span>
            <textarea className="inp field area" rows={2} value={condition} onChange={(event) => changeDraft('condition', event.target.value)} placeholder="Wear, marks, accuracy, replaced parts." />
          </label>
          <label>
            <span className="field-label">What is included?</span>
            <input className="inp field" value={included} onChange={(event) => changeDraft('included', event.target.value)} placeholder="Watch, box, papers, links, receipts…" />
          </label>
          <label>
            <span className="field-label">Service and ownership history</span>
            <textarea className="inp field area" rows={2} value={service} onChange={(event) => changeDraft('service', event.target.value)} placeholder="Dates, work performed, documentation." />
          </label>
          <label>
            <span className="field-label">Preferred handover</span>
            <select className="sel field" value={transfer} onChange={(event) => changeDraft('transfer', event.target.value)}>
              <option>Still deciding</option>
              <option>Sale at a fair, evidence-informed price</option>
              <option>Trade for another watch</option>
              <option>Gift to the right person</option>
            </select>
          </label>
          </>}
        </form>

        {card && <aside className="brief-preview" id="handover-preview" tabIndex={-1}>
          <div className="section-rule"><h2>Your handover brief</h2><span className="mono micro dim">PREVIEW</span></div>
              <h3>{card.identity.brand} {card.identity.name} <span className="mono">{card.identity.reference}</span></h3>
              <p className="dim">{card.identity.one_liner}</p>
              <p className="rehome-market-context">{marketContext(card)}</p>
              <div className="rehome-actions">
                <button type="button" className="btn" onClick={copyBrief}>{copiedBrief === brief ? 'COPIED ✓' : 'COPY BRIEF'}</button>
                <Link className="brief-dossier src-a" to={`/w/${card.id}`}>Sourced dossier →</Link>
              </div>
              <p role="status" className="micro">{copyFailed ? 'Clipboard unavailable. Select the text below to copy it.' : copiedBrief === brief ? 'Brief copied.' : ''}</p>
              {copyFailed && <label className="rehome-copy-fallback">
                <span className="field-label">Brief text</span>
                <textarea className="inp field area" readOnly value={brief} onFocus={event => event.currentTarget.select()} />
              </label>}
              <dl className="brief-facts">
                <BriefFact label="Why it is moving on" value={story} />
                <BriefFact label="Condition & disclosure" value={condition} />
                <BriefFact label="Included" value={included} />
                <BriefFact label="Service & ownership" value={service} />
                <BriefFact label="Preferred handover" value={transfer} />
              </dl>
              {card.computed.estimate.value != null && <TransactionGraphic card={card} />}
        </aside>}
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
  return value.trim() ? <div><dt>{label}</dt><dd>{value.trim()}</dd></div> : null
}

function marketContext(card: Card): string {
  const estimate = card.computed.estimate
  if (estimate.value == null) return `No market estimate — ${estimate.limitation}`
  const age = estimate.as_of ? `; newest sale ${estimate.as_of}` : '; newest sale date unavailable'
  const window = estimate.window_months == null ? '' : ` over ${estimate.window_months} months`
  return `${estimate.stale ? 'Historical estimate' : 'Market estimate'}: ${usd(estimate.value)} from ${estimate.n} verified sales${window}${age}. Not an asking price or an appraisal of this watch.`
}

function buildBrief(card: Card, fields: Draft): string {
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
