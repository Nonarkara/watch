import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { useCompare, COMPARE_MAX } from '../lib/compare-context.tsx'
import { TIER_LABEL, type Card } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel } from '../lib/format.ts'

/** Rows are the questions a buyer or seller actually asks, in the order they ask them.
 *  Every row is one line tall so the eye can run across the set without re-reading. */
const ROWS: { label: string; get: (c: Card) => React.ReactNode; group?: string }[] = [
  { group: 'Market', label: 'Market estimate', get: (c) => c.computed.estimate.value != null ? usd(c.computed.estimate.value) : dash },
  { label: 'Evidence', get: (c) => c.comp_summary ? `${c.comp_summary.n} sale${c.comp_summary.n === 1 ? '' : 's'}` : dash },
  { label: 'Confidence', get: (c) => c.computed.confidence.tier ?? dash },
  { label: 'Retail', get: (c) => c.retail.current_msrp_usd != null ? usd(c.retail.current_msrp_usd)
      : c.retail.msrp_history.at(-1) ? `${usd(c.retail.msrp_history.at(-1)!.price_usd)} (${c.retail.msrp_history.at(-1)!.effective_year})` : dash },
  { label: 'Vs retail', get: (c) => c.computed.premium.value != null ? pct(c.computed.premium.value) : dash },
  { label: 'Δ 5y real', get: (c) => c.computed.change_5y.real_pct != null ? pct(c.computed.change_5y.real_pct) : dash },
  { label: 'Liquidity', get: (c) => c.computed.liquidity.tier },

  { group: 'Standing', label: 'Scarcity', get: (c) => `${c.computed.scarcity.value} · ${c.computed.scarcity.tier}` },
  { label: 'Collectibility', get: (c) => c.computed.collectibility.value },
  { label: 'Provenance', get: (c) => c.provenance_events.length || dash },
  { label: 'Supply', get: (c) => c.identity.produced.discontinued ? 'Discontinued' : 'In production' },
  { label: 'Edition', get: (c) => c.scarcity_public.limited_edition.is_limited
      ? (c.scarcity_public.limited_edition.stated_size?.toLocaleString() ?? 'Limited') : 'Series' },

  { group: 'Object', label: 'Tier', get: (c) => TIER_LABEL[c.identity.tier] },
  { label: 'Produced', get: (c) => yearsLabel(c.identity.produced) },
  { label: 'Case', get: (c) => `${c.identity.case.diameter_mm}mm · ${c.identity.case.material}` },
  { label: 'Caliber', get: (c) => c.identity.movement.caliber },
]

export default function Compare() {
  const data = useDataset()
  const { ids, add, remove, clear, full } = useCompare()
  if (!data) return null
  const byId = new Map(data.cards.map((c) => [c.id, c]))
  const picked = ids.map((i) => byId.get(i)).filter((c): c is Card => !!c)
  const options = [...data.cards].sort((a, b) => a.id.localeCompare(b.id)).filter((c) => !ids.includes(c.id))

  return (
    <>
      <div className="cmp-head">
        <div>
          <p className="eyebrow">Compare</p>
          <h1 className="pagetitle">Side by side, one line each</h1>
        </div>
        <div className="cmp-head-tools">
          <select className="sel" value="" aria-label="Add a reference"
            onChange={(e) => { if (e.target.value) add(e.target.value) }} disabled={full}>
            <option value="">{full ? `MAXIMUM ${COMPARE_MAX} REACHED` : '+ ADD A REFERENCE…'}</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identity.brand.toUpperCase()} {c.identity.reference}
                {c.identity.nickname ? ` · ${c.identity.nickname.toUpperCase()}` : ''}
              </option>
            ))}
          </select>
          {picked.length > 0 && <button type="button" className="cdock-clear mono" onClick={clear}>CLEAR ALL</button>}
        </div>
      </div>

      {picked.length < 2 ? (
        <p className="honest">
          Add at least two references — from the menu above, or by dragging any card in the{' '}
          <Link className="src-a" to="/register">register</Link> down onto the compare shelf.
        </p>
      ) : (
        <div className="cmp-wrap">
          <table className="cmp-matrix">
            <thead>
              <tr>
                <th className="cmp-corner" />
                {picked.map((c) => (
                  <th key={c.id}>
                    <span className="cmp-media">
                      {c.media?.[0]
                        ? <img src={c.media[0].url} alt={c.identity.name} loading="lazy" />
                        : <span className="rc-media-empty mono">NO IMAGE</span>}
                    </span>
                    <Link to={`/w/${c.id}`} className="cmp-brand">{c.identity.brand}</Link>
                    <span className="cmp-name">{c.identity.name}</span>
                    <span className="cmp-ref mono">{c.identity.reference}</span>
                    <button type="button" className="cmp-drop mono" onClick={() => remove(c.id)}>REMOVE</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <>
                  {r.group && (
                    <tr className="cmp-group" key={`g-${r.group}`}>
                      <th scope="rowgroup" className="mono">{r.group}</th>
                      {picked.map((c) => <td key={c.id} />)}
                    </tr>
                  )}
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    {picked.map((c) => <td key={c.id} className="mono">{r.get(c)}</td>)}
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picked.length >= 2 && (
        <p className="micro dim cmp-foot">
          Blank cells are missing evidence, never zero. Open a dossier for the sourced sales and the
          stated limits behind any figure.
        </p>
      )}
    </>
  )
}
