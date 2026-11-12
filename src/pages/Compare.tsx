// Compare — a side-by-side matrix of up to 4 references. Each column has a
// 4-axes verdict at the top (Rarity / Demand / Story / Resell), so the
// buyer reads the whole column in 5 seconds before scrolling. Below, the
// rows answer the questions a buyer or seller actually asks, in the order
// they ask them.

import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { useCompare } from '../lib/compare-store.ts'
import { COMPARE_MAX } from '../lib/compare-config.ts'
import { TIER_LABEL, type Card } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel } from '../lib/format.ts'

type Strength = 'strong' | 'neutral' | 'weak'

function rarityClass(c: Card): Strength {
  const v = c.computed.scarcity.value
  if (v == null) return 'weak'
  if (v >= 70) return 'strong'
  if (v >= 40) return 'neutral'
  return 'weak'
}
function demandClass(c: Card): Strength {
  const v = c.computed.collectibility.value
  if (v == null) return 'weak'
  if (v >= 70) return 'strong'
  if (v >= 40) return 'neutral'
  return 'weak'
}
function storyClass(c: Card): Strength {
  const n = c.provenance_events.length
  if (n >= 5) return 'strong'
  if (n >= 1) return 'neutral'
  return 'weak'
}
function resellClass(c: Card): Strength {
  const t = c.computed.resellability.tier
  if (t === 'High') return 'strong'
  if (t === 'Medium' || t === 'Low') return 'neutral'
  return 'weak'
}

const STRENGTH_LABEL: Record<Strength, string> = {
  strong: 'STRONG',
  neutral: 'NEUTRAL',
  weak: 'WEAK',
}

/** Rows are the questions a buyer or seller actually asks, in the order they ask them.
 *  Every row is one line tall so the eye can run across the set without re-reading. */
const ROWS: { label: string; get: (c: Card) => React.ReactNode; group?: string }[] = [
  { group: 'Market', label: 'Sales on record', get: (c) => c.comp_summary ? `${c.comp_summary.n} sale${c.comp_summary.n === 1 ? '' : 's'}` : dash },
  { label: 'Confidence', get: (c) => c.computed.confidence.tier ?? dash },
  { label: 'Retail', get: (c) => c.retail.current_msrp_usd != null ? usd(c.retail.current_msrp_usd)
      : c.retail.msrp_history.at(-1) ? `${usd(c.retail.msrp_history.at(-1)!.price_usd)} (${c.retail.msrp_history.at(-1)!.effective_year})` : dash },
  { label: 'Vs retail', get: (c) => c.computed.premium.value != null ? pct(c.computed.premium.value) : dash },
  { label: 'Δ 5y real', get: (c) => c.computed.change_5y.real_pct != null ? pct(c.computed.change_5y.real_pct) : dash },
  { label: 'Liquidity', get: (c) => c.computed.liquidity.tier },

  { group: 'Standing', label: 'Scarcity', get: (c) => c.computed.scarcity.value == null ? dash : `${c.computed.scarcity.value} · ${c.computed.scarcity.tier}` },
  { label: 'Collectibility', get: (c) => c.computed.collectibility.value },
  { label: 'Story', get: (c) => c.provenance_events.length || dash },
  { label: 'Supply', get: (c) => c.identity.produced.discontinued ? 'Discontinued' : 'In production' },
  { label: 'Edition', get: (c) => c.scarcity_public.limited_edition.is_limited
      ? (c.scarcity_public.limited_edition.stated_size?.toLocaleString() ?? 'Limited') : 'Series' },

  { group: 'Object', label: 'Tier', get: (c) => TIER_LABEL[c.identity.tier] },
  { label: 'Produced', get: (c) => yearsLabel(c.identity.produced) },
  { label: 'Case', get: (c) => `${c.identity.case.diameter_mm}mm · ${c.identity.case.material}` },
  { label: 'Caliber', get: (c) => c.identity.movement.caliber },
]

function ColumnVerdict({ c }: { c: Card }) {
  const rows = [
    { k: 'RARITY', v: c.computed.scarcity.value != null ? String(c.computed.scarcity.value) : '—', cap: c.computed.scarcity.tier?.toUpperCase() ?? 'NO SIGNALS', s: rarityClass(c), hue: 'coral' },
    { k: 'DEMAND', v: c.computed.collectibility.value != null ? String(c.computed.collectibility.value) : '—', cap: `${c.computed.collectibility.k_of[0]}/${c.computed.collectibility.k_of[1]}`, s: demandClass(c), hue: 'yellow' },
    { k: 'STORY', v: String(c.provenance_events.length), cap: c.provenance_events.length === 0 ? '—' : c.provenance_events.length === 1 ? 'EVENT' : 'EVENTS', s: storyClass(c), hue: 'navy' },
    { k: 'RESELL', v: c.computed.resellability.value != null ? String(c.computed.resellability.value) : '—', cap: c.computed.resellability.tier === 'Unknown' ? '—' : c.computed.resellability.tier.toUpperCase(), s: resellClass(c), hue: 'teal' },
  ] as const
  return (
    <div className="cmp-verdict">
      {rows.map((r) => (
        <div key={r.k} className={`cmp-verdict-row cmp-verdict-row--${r.hue} cmp-verdict-row--${r.s}`}>
          <span className="cmp-verdict-key mono">{r.k}</span>
          <span className="cmp-verdict-val mono">{r.v}</span>
          <span className="cmp-verdict-state mono">{STRENGTH_LABEL[r.s]}</span>
        </div>
      ))}
    </div>
  )
}

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
          <h1 className="pagetitle">Compare watches</h1>
          <p className="lede">
            Compare up to {COMPARE_MAX} references. Price evidence comes first; objects and specifications follow.
          </p>
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
        <>
        <table className="sales-table cmp-price-receipt" aria-label="Comparable estimates and their evidence dates">
          <thead><tr><th scope="col">Reference</th><th scope="col" className="num">Estimate</th></tr></thead>
          <tbody>{picked.map(c => {
            const estimate = c.computed.estimate
            return <tr key={c.id}>
              <th scope="row"><Link className="src-a" to={`/w/${c.id}`}>{c.identity.brand} {c.identity.reference}</Link></th>
              <td className="num">
                {estimate.value == null ? 'No estimate' : <>
                  <strong>{usd(estimate.value)}</strong>
                  <span className="dossier-sale-detail micro dim">{estimate.stale ? 'Historical · ' : ''}{estimate.n} sales <span className="cmp-price-date">· {estimate.as_of ?? 'date unverified'}</span></span>
                </>}
              </td>
            </tr>
          })}</tbody>
        </table>
        <div className="cmp-wrap">
          <div className="cmp-vitrine" data-count={picked.length}>
            {picked.map((c) => {
              const portrait = c.media.find(image => image.match === 'exact_reference')
              return (
              <article key={c.id} className="cmp-col">
                <div className="cmp-col-head">
                  <span className="cmp-media">
                    {portrait
                      ? <img src={portrait.url} alt={`${c.identity.brand} ${c.identity.reference}`} loading="lazy" decoding="async" width={400} height={300} />
                      : <span className="rc-media-empty mono">PHOTO UNVERIFIED</span>}
                  </span>
                  <Link to={`/w/${c.id}`} className="cmp-brand">{c.identity.brand}</Link>
                  <span className="cmp-name">{c.identity.name}</span>
                  <span className="cmp-ref mono">{c.identity.reference}</span>
                  <ColumnVerdict c={c} />
                  <button type="button" className="cmp-drop mono" onClick={() => remove(c.id)}>REMOVE</button>
                </div>
                <dl className="cmp-col-rows">
                  {ROWS.map((r) => (
                    <div key={r.label} className={`cmp-row ${r.group ? 'cmp-row--group' : ''}`}>
                      {r.group && <span className="cmp-row-group mono">{r.group}</span>}
                      <div className="cmp-row-pair">
                        <dt className="cmp-row-label">{r.label}</dt>
                        <dd className="mono">{r.get(c)}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </article>
              )
            })}
          </div>
        </div>
        </>
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
