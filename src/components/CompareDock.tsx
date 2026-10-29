import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompare } from '../lib/compare-store.ts'
import { COMPARE_MAX } from '../lib/compare-config.ts'
import { useDataset } from '../lib/dataset-context.ts'

/** Drop target for dragging a reference down out of the register, and the shelf that
 *  holds the current comparison set. Hidden on the compare page itself.
 *
 *  The shelf is not on the page until it has something to hold.
 *
 *  It used to be pinned to the bottom of every screen on every page, empty,
 *  saying DRAG A REFERENCE HERE TO COMPARE. That cost 53px of a 844px phone
 *  screen — 6% of the first screen, on every route — and the last line of the
 *  page sat underneath it. The measurement said so: on /register/ at 390px the
 *  shelf covered 17px of the page's own eyebrow, and the gate called the
 *  overlap on 64 widths across 25 routes.
 *
 *  It was also a lie on the device it was sized for. HTML5 drag-and-drop does
 *  not fire on a touch screen, so on a phone the hint promised an interaction
 *  the phone cannot perform.
 *
 *  So the empty shelf is gone from the page. It appears the moment a
 *  reference is picked (the COMPARE button on every card) and it appears
 *  while a reference is actually being dragged — which is the only moment the
 *  hint is true. */
export default function CompareDock() {
  const { ids, add, remove, clear, full } = useCompare()
  const data = useDataset()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [over, setOver] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [dragging, setDragging] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashBlocked = useCallback(() => {
    setBlocked(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setBlocked(false), 1500)
  }, [])

  const empty = ids.length === 0

  // The drop target has to be on the page while a reference is in the air, or
  // there is nowhere to drop it. It is mounted for the duration of the drag
  // and taken down again the moment the drag ends.
  useEffect(() => {
    if (!empty) return
    const start = () => setDragging(true)
    const end = () => setDragging(false)
    document.addEventListener('dragstart', start)
    document.addEventListener('dragend', end)
    document.addEventListener('drop', end)
    return () => {
      document.removeEventListener('dragstart', start)
      document.removeEventListener('dragend', end)
      document.removeEventListener('drop', end)
    }
  }, [empty])

  if (pathname === '/compare') return null
  const byId = new Map((data?.cards ?? []).map((c) => [c.id, c]))

  // Nothing to hold, nothing being dragged: the shelf is not on the page.
  if (empty && !dragging) return null

  return (
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
  )
}
