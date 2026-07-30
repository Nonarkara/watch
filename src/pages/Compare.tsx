import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { TIER_LABEL, type Card } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel } from '../lib/format.ts'

export default function Compare() {
  const data = useDataset()
  const [params] = useSearchParams()
  const [ids, setIds] = useState<string[]>(() => {
    const q = params.get('ids')?.split(',').filter(Boolean) ?? []
    return [q[0] ?? '', q[1] ?? '', q[2] ?? '']
  })
  if (!data) return null
  const byId = new Map(data.cards.map((c) => [c.id, c]))
  const picked = ids.map((i) => byId.get(i)).filter((c): c is Card => !!c)
  const options = [...data.cards].sort((a, b) => a.id.localeCompare(b.id))

  const rows: { label: string; get: (c: Card) => React.ReactNode }[] = [
    { label: 'Tier', get: (c) => TIER_LABEL[c.identity.tier] },
    { label: 'Produced', get: (c) => <span className="mono">{yearsLabel(c.identity.produced)}</span> },
    { label: 'Market', get: (c) => c.computed.estimate.value != null ? usd(c.computed.estimate.value) : dash },
    { label: 'Vs retail', get: (c) => c.computed.premium.value != null ? pct(c.computed.premium.value) : dash },
    { label: 'Δ 5y real', get: (c) => c.computed.change_5y.real_pct != null ? pct(c.computed.change_5y.real_pct) : dash },
    { label: 'Scarcity', get: (c) => `${c.computed.scarcity.value} · ${c.computed.scarcity.tier}` },
    { label: 'Collectibility', get: (c) => c.computed.collectibility.value },
    { label: 'Liquidity', get: (c) => c.computed.liquidity.tier },
    { label: 'Confidence', get: (c) => c.computed.confidence.tier ?? dash },
    { label: 'Provenance', get: (c) => `${c.provenance_events.length} events` },
    { label: 'Caliber', get: (c) => <span className="mono">{c.identity.movement.caliber}</span> },
    { label: 'Case', get: (c) => <span className="mono">{c.identity.case.diameter_mm}mm</span> },
  ]

  return (
    <>
      <p className="eyebrow">Compare</p>
      <h1 className="pagetitle">Same money, different answers</h1>
      <p className="lede">Put two or three references side by side. The numbers carry their own caveats —
        open any dossier for the full evidence.</p>

      <div className="cmp-pickers">
        {[0, 1, 2].map((i) => (
          <select key={i} className="sel" style={{ minHeight: 'var(--tap-min)' }} value={ids[i]}
            aria-label={`Watch ${i + 1}`}
            onChange={(e) => setIds(ids.map((v, j) => (j === i ? e.target.value : v)))}>
            <option value="">{i < 2 ? `WATCH ${i + 1}…` : 'WATCH 3 (OPTIONAL)…'}</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identity.brand.toUpperCase()} {c.identity.reference}{c.identity.nickname ? ` · ${c.identity.nickname.toUpperCase()}` : ''}
              </option>
            ))}
          </select>
        ))}
      </div>

      {picked.length >= 2 ? (
        <div className="cmp-scroll">
          <table className="cmp-table">
            <thead>
              <tr>
                <th />
                {picked.map((c) => (
                  <th key={c.id}>
                    <Link to={`/w/${c.id}`} className="src-a" style={{ color: 'var(--fg)' }}>
                      {c.identity.brand} {c.identity.reference}
                    </Link>
                    {c.identity.nickname && <><br /><span className="amber mono">“{c.identity.nickname}”</span></>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  {picked.map((c) => <td key={c.id} className="num">{r.get(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="boot mono">PICK AT LEAST TWO REFERENCES.</p>
      )}
    </>
  )
}
