import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompare } from '../lib/compare-store.ts'
import { COMPARE_MAX } from '../lib/compare-config.ts'
import { useDataset } from '../lib/dataset-context.ts'

/** Drop target for dragging a reference down out of the register, and the shelf that
 *  holds the current comparison set. Hidden on the compare page itself. */
export default function CompareDock() {
  const { ids, add, remove, clear } = useCompare()
  const data = useDataset()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [over, setOver] = useState(false)

  if (pathname === '/compare') return null
  const byId = new Map((data?.cards ?? []).map((c) => [c.id, c]))
  const empty = ids.length === 0

  return (
    <div
      className={'cdock' + (over ? ' over' : '') + (empty ? ' idle' : '')}
      role="complementary"
      aria-label="Comparison shelf"
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false)
        const id = e.dataTransfer.getData('text/watch-id')
        if (id) add(id)
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
