import { useCallback, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompare } from '../lib/compare-store.ts'
import { COMPARE_MAX } from '../lib/compare-config.ts'
import { useDataset } from '../lib/dataset-context.ts'

/** Drop target for dragging a reference down out of the register, and the shelf that
 *  holds the current comparison set. Hidden on the compare page itself. */
export default function CompareDock() {
  const { ids, add, remove, clear, full } = useCompare()
  const data = useDataset()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [over, setOver] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashBlocked = useCallback(() => {
    setBlocked(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setBlocked(false), 1500)
  }, [])

  if (pathname === '/compare') return null
  const byId = new Map((data?.cards ?? []).map((c) => [c.id, c]))
  const empty = ids.length === 0

  // The dock is `position: fixed; bottom: 0`, so anything in normal flow
  // above it gets covered. The spacer below is a sister element that
  // lives inside the document flow (it is mounted BEFORE <footer> in App.tsx)
  // and reserves the dock's height, so the page can always scroll past
  // the dock to reveal the last line of content. Without it the home page's
  // research-ledger / the footer's link row disappear under the dock.
  return (
    <>
      <div className="cdock-spacer" aria-hidden="true" />
    <div
      className={'cdock' + (over ? ' over' : '') + (empty ? ' idle' : '') + (blocked ? ' blocked' : '')}
      role="complementary"
      aria-label="Comparison shelf"
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false)
        const id = e.dataTransfer.getData('text/watch-id')
        if (!id) return
        if (full && !ids.includes(id)) { flashBlocked(); return }
        add(id)
      }}
    >
      <div className="shell cdock-in">
        <span className="cdock-lab mono">
          {empty ? 'DRAG A REFERENCE HERE TO COMPARE' : `COMPARING ${ids.length}/${COMPARE_MAX}`}
        </span>
        <div className="cdock-slots">
          {ids.map((id) => {
            const c = byId.get(id)
            return (
              <span className="cslot" key={id}>
                <span className="cslot-t">{c ? `${c.identity.brand} ${c.identity.reference}` : id}</span>
                 <button type="button" aria-label={`Remove ${c?.identity.reference ?? id}`} onClick={() => remove(id)} style={{ minWidth: 44, minHeight: 44 }}>×</button>
              </span>
            )
          })}
        </div>
        {!empty && (
          <span className="cdock-actions">
            <button type="button" className="cdock-clear mono" onClick={clear}>CLEAR</button>
            <button type="button" className="btn" disabled={ids.length < 2} onClick={() => nav('/compare')}>
              COMPARE {ids.length < 2 ? '— ADD ONE MORE' : `${ids.length} REFERENCES`}
            </button>
          </span>
        )}
      </div>
    </div>
    </>
  )
}
