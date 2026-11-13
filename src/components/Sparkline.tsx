import type { MsrpEntry, Sale } from '../lib/data.ts'
import { usd } from '../lib/format.ts'

export default function Sparkline({ msrp, sales }: { msrp: MsrpEntry[]; sales: Sale[] }) {
  const retail = msrp.map(entry => ({
    t: Date.UTC(entry.effective_year, 0, 1), v: entry.price_usd, entry,
  }))
  const transactions = sales.map(sale => ({ t: Date.parse(sale.date), v: sale.price_usd, sale }))
  const points = [...retail, ...transactions]
  if (points.length === 0) return null

  const W = 600, H = 150, PAD = 10
  const start = Math.min(...points.map(point => point.t))
  const end = Math.max(...points.map(point => point.t))
  const high = Math.max(...points.map(point => point.v))
  const x = (t: number) => start === end ? W / 2 : PAD + (t - start) / (end - start) * (W - 2 * PAD)
  const y = (v: number) => H - PAD - v / (high || 1) * (H - 2 * PAD)
  const year = (t: number) => new Date(t).getUTCFullYear()

  return (
    <figure className="dossier-price-chart">
      {points.length > 1 && <>
        <figcaption className="dossier-chart-key micro">
          {sales.length > 0 && <span><i className="sale-symbol" aria-hidden="true" />Verified sale</span>}
          {msrp.length > 0 && <span><i className="retail-symbol" aria-hidden="true" />List price by year</span>}
        </figcaption>
        <div className="dossier-chart-scale">
          <div className="dossier-chart-ticks mono micro" aria-hidden="true"><span>{usd(high)}</span><span>$0</span></div>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Price evidence chart"
            aria-description={`Recorded observations only, ${year(start)} to ${year(end)}, on a scale of zero to ${usd(high)}. Values and sources are listed beside or below the chart.`}>
            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" strokeWidth="1" />
            {retail.map(({ t, v, entry }, i) => (
              <circle key={i} cx={x(t)} cy={y(v)} r="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke">
                <title>{`${entry.effective_year} list price · ${usd(v)}`}</title>
              </circle>
            ))}
            {transactions.map(({ t, v, sale }, i) => (
              <rect key={i} x={x(t) - 5} y={y(v) - 5} width="10" height="10" fill="var(--amber)">
                <title>{`${sale.date} verified sale · ${usd(v)}`}</title>
              </rect>
            ))}
          </svg>
          <div className="dossier-chart-dates mono micro" aria-hidden="true">
            <span>{year(start)}</span>{year(start) !== year(end) && <span>{year(end)}</span>}
          </div>
        </div>
      </>}
      {retail.length > 0 && (
        <details className="dossier-retail-records" open={points.length === 1}>
          <summary>List-price records · {retail.length}</summary>
          {points.length > 1 && <p className="micro dim">List-price marks sit at the start of the recorded year; the day is unknown.</p>}
          <ul>
            {retail.map(({ entry }, i) => <li key={i}><a className="src-a" href={entry.source_url} target="_blank" rel="noopener noreferrer">
              {entry.effective_year} · {usd(entry.price_usd)} <span aria-hidden="true">↗</span>
            </a></li>)}
          </ul>
        </details>
      )}
    </figure>
  )
}
