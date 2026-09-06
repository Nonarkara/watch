import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from './dataset-context.ts'
import { TIER_LABEL, type Card } from './data.ts'

/** Cmd-K / Ctrl-K style search palette. Searches across brand, reference, name,
 *  nickname, collection — case-insensitive substring match. The first 6 matches
 *  render; the rest get a "+N more" footer. Pressing Enter on a result navigates
 *  to the dossier. Esc or backdrop click closes. */

function score(card: Card, q: string): number {
  // higher = better. brand+reference exact-ish > name > nickname > collection
  const ql = q.toLowerCase()
  const b = card.identity.brand.toLowerCase()
  const r = card.identity.reference.toLowerCase()
  const n = card.identity.name.toLowerCase()
  const nick = (card.identity.nickname ?? '').toLowerCase()
  const col = (card.identity.collection ?? '').toLowerCase()
  if (b === ql || r === ql) return 1000
  if (b.startsWith(ql) || r.startsWith(ql)) return 500
  if (b.includes(ql) && r.includes(ql)) return 250
  if (b.includes(ql)) return 100
  if (r.includes(ql)) return 80
  if (n.startsWith(ql)) return 60
  if (n.includes(ql)) return 40
  if (nick.includes(ql)) return 30
  if (col.includes(ql)) return 20
  return 0
}

function matches(card: Card, q: string): boolean {
  if (!q) return false
  return score(card, q) > 0
}

export function SearchPalette() {
  const data = useDataset()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const nav = useNavigate()

  // Cmd/Ctrl-K to open, or the header search button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQ('')
        setHi(0)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    const onOpen = () => { setOpen(true); setQ(''); setHi(0) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('timepop:open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('timepop:open-search', onOpen)
    }
  }, [open])

  if (!data) return null

  const all = data.cards
  const results: { card: Card; s: number }[] = q
    ? all.map((c) => ({ card: c, s: score(c, q) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || a.card.identity.brand.localeCompare(b.card.identity.brand))
        .slice(0, 6)
    : []
  const more = (q ? all.filter((c) => matches(c, q)).length : 0) - results.length
  const visible = results

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, visible.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && visible[hi]) {
      e.preventDefault()
      nav(`/w/${visible[hi].card.id}`)
      setOpen(false); setQ('')
    }
  }

  const listboxId = 'srch-listbox'
  if (!open) return null
  return (
    <div className="srch-bk" onClick={() => setOpen(false)} role="presentation">
      <div className="srch" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search the register">
        <div className="srch-input-row">
          <span className="srch-kbd mono">⌘K</span>
          <input
            className="srch-input"
            placeholder="Search brand, reference, or name — Daytona, Patek 5711, Royal Oak…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0) }}
            onKeyDown={onKey}
            autoFocus
            aria-label="Search"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            aria-activedescendant={visible[hi] ? `srch-opt-${visible[hi].card.id}` : undefined}
            aria-autocomplete="list"
          />
          <button type="button" className="srch-close mono" onClick={() => setOpen(false)} aria-label="Close search">ESC</button>
        </div>
        <div className="srch-results" id={listboxId} role="listbox" aria-label="Search results">
          {!q && (
            <p className="srch-hint mono" role="status">START TYPING — {all.length} REFERENCES IN THE REGISTER</p>
          )}
          {q && visible.length === 0 && (
            <p className="srch-hint mono" role="status">NO MATCHES FOR "{q}" — TRY A BRAND OR REFERENCE</p>
          )}
          {visible.map((r, i) => {
            const c = r.card
            const m = c.media[0]
            return (
              <button
                type="button"
                key={c.id}
                id={`srch-opt-${c.id}`}
                role="option"
                aria-selected={i === hi}
                className={'srch-row' + (i === hi ? ' on' : '')}
                onMouseEnter={() => setHi(i)}
                onClick={() => { nav(`/w/${c.id}`); setOpen(false); setQ('') }}
              >
                <span className="srch-row-img">
                  {m
                    ? <img src={m.url} alt="" loading="lazy" decoding="async"  width={56} height={56} />
                    : <span className="srch-row-img-empty mono">—</span>}
                </span>
                <span className="srch-row-body">
                  <span className="srch-row-source mono">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                  <span className="srch-row-name">{c.identity.name}{c.identity.nickname ? <span className="srch-row-nick"> "{c.identity.nickname}"</span> : null}</span>
                  <span className="srch-row-tier mono">{TIER_LABEL[c.identity.tier]}</span>
                </span>
              </button>
            )
          })}
          {q && more > 0 && <p className="srch-more mono">+ {more} MORE — REFINE YOUR SEARCH</p>}
        </div>
        <div className="srch-foot mono">
          <span>↑↓ NAVIGATE</span><span>↵ OPEN</span><span>ESC CLOSE</span>
        </div>
      </div>
    </div>
  )
}
