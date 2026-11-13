import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import type { Card } from '../lib/data.ts'
import { usd, dash } from '../lib/format.ts'

export default function Starter() {
  const data = useDataset()
  if (!data) return null

  // Ladders: every reference that names an attainable starting point, grouped by that starter.
  const ladders = new Map<string, Card[]>()
  for (const c of data.cards) {
    const s = c.narrative.starter_alternative
    if (s && data.cards.some((x) => x.id === s)) ladders.set(s, [...(ladders.get(s) ?? []), c])
  }
  const attainable = data.cards
    .filter((c) => c.identity.tier === 'attainable')
    .sort((a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity))

  return (
    <>
      <p className="eyebrow">Starter Paths</p>
      <h1 className="pagetitle">You don’t have to start at the Crown</h1>
      <div className="prose">
        <p>
          Most collecting stories start the same way: a watch you can’t afford yet. That’s fine — the
          waitlist isn’t going anywhere. What matters early is learning what you actually like: case
          size, dial discipline, a movement you enjoy winding. Every ladder below pairs grail
          references with an attainable watch that shares real design DNA, so the learning starts now
          and the money waits until you know yourself.
        </p>
      </div>

      {[...ladders.entries()]
        .map(([sid, grails]) => ({ starter: data.cards.find((c) => c.id === sid)!, grails }))
        .sort((a, b) => (priceOf(a.starter) ?? 0) - (priceOf(b.starter) ?? 0))
        .map(({ starter, grails }) => (
          <div className="ladder" key={starter.id}>
            <div className="ladder-h">
              <span>
                <span className="eyebrow">START HERE</span><br />
                <Link to={`/w/${starter.id}`} className="src-a">
                  <span className="l-brand">{starter.identity.brand}</span>{' '}
                  <span className="mono">{starter.identity.reference}</span>
                  {starter.identity.nickname && <span className="l-nick"> “{starter.identity.nickname}”</span>}
                </Link>
              </span>
              <span className="mono">{fmtPrice(starter)}</span>
            </div>
            <div className="ladder-rows">
              {grails
                .sort((a, b) => (priceOf(a) ?? 0) - (priceOf(b) ?? 0))
                .map((g) => (
                  <Link to={`/w/${g.id}`} className="ladder-row" key={g.id}>
                    <span>
                      <span className="dim mono micro">THE GRAIL → </span>
                      <span className="l-brand">{g.identity.brand}</span>{' '}
                      <span className="mono dim">{g.identity.reference}</span>
                      {g.identity.nickname && <span className="l-nick"> “{g.identity.nickname}”</span>}
                    </span>
                    <span className="mono">{fmtPrice(g)}</span>
                  </Link>
                ))}
            </div>
          </div>
        ))}

      <section className="sect">
        <h2 className="sect-h"><span>The full attainable grid</span><span className="mono">{attainable.length} REFERENCES</span></h2>
        {attainable.map((c) => (
          <Link to={`/w/${c.id}`} className="ladder-row" key={c.id} style={{ borderBottom: 'var(--border)' }}>
            <span>
              <span className="l-brand">{c.identity.brand}</span>{' '}
              <span className="mono dim">{c.identity.reference}</span>
              {c.identity.nickname && <span className="l-nick"> “{c.identity.nickname}”</span>}
            </span>
            <span className="mono">{fmtPrice(c)}</span>
          </Link>
        ))}
      </section>
    </>
  )
}

function priceOf(c: Card): number | null {
  return c.computed.estimate.value ?? c.retail.current_msrp_usd ?? c.retail.msrp_history.at(-1)?.price_usd ?? null
}
function fmtPrice(c: Card) {
  const estimate = c.computed.estimate
  if (estimate.value != null) return <>
    <span style={{ whiteSpace: 'nowrap' }}>{usd(estimate.value)}</span>{' '}
    <span className="micro dim">{estimate.stale ? 'Historical estimate' : 'Market estimate'}{estimate.as_of && <> · <time dateTime={estimate.as_of}>{estimate.as_of}</time></>}</span>
  </>
  if (c.retail.current_msrp_usd != null) return `${usd(c.retail.current_msrp_usd)} RETAIL`
  const last = c.retail.msrp_history.at(-1)
  return last ? `${usd(last.price_usd)} RETAIL (${last.effective_year})` : dash
}
