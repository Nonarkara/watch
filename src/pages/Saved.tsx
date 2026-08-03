import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { useSaved } from '../lib/saved-store.ts'
import { usd } from '../lib/format.ts'
import { TIER_LABEL } from '../lib/data.ts'

/** Personal watchlist — localStorage-backed, no auth. Shows the saved set
 *  as the same ticker cells the home page uses, plus a clear-all. Empty
 *  state explains what a watchlist is for and links to the register. */
export default function Saved() {
  const data = useDataset()
  const { ids, clear, count } = useSaved()
  if (!data) return null

  const byId = new Map(data.cards.map((c) => [c.id, c]))
  const cards = ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c))

  return (
    <>
      <Link to="/" className="crumb">← HOME</Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">YOUR SAVED SET · {count} WATCH{count === 1 ? '' : 'ES'}</p>
          <h1 className="pagetitle">The ones you want to come back to.</h1>
          <p className="lede">
            A watchlist stored in your browser, not on our servers. The list lives in localStorage
            under <span className="mono">watch.saved</span> — clear it from your browser settings
            any time. No account, no email, no tracking.
          </p>
        </div>
        {count > 0 && (
          <button type="button" className="btn btn-ghost mono" onClick={clear}>CLEAR ALL</button>
        )}
      </div>

      {count === 0 ? (
        <section className="sect">
          <div className="fact-bubble fact-bubble-coral">
            <span className="bubble-kicker mono">NOTHING SAVED YET</span>
            <strong>Your watchlist lives on this device.</strong>
            <span>Open any dossier and tap <span className="mono">☆ SAVE</span> at the top. The list appears here.
              It is private to your browser — we don’t see it, we don’t send it anywhere.</span>
            <Link to="/register" className="src-a">BROWSE THE 261 OBJECTS →</Link>
          </div>
        </section>
      ) : (
        <section className="sect">
          <div className="saved-grid">
            {cards.map((c) => {
              const m = c.media[0]
              const est = c.computed.estimate.value
              const msrp = c.retail.current_msrp_usd ?? c.retail.msrp_history.at(-1)?.price_usd
              return (
                <Link key={c.id} to={`/w/${c.id}`} className="saved-cell">
                  <span className="saved-cell-img">
                    {m
                      ? <img src={m.url} alt={c.identity.name} loading="lazy" />
                      : <span className="saved-cell-img-empty mono">NO PHOTO</span>}
                  </span>
                  <span className="saved-cell-body">
                    <span className="saved-cell-source mono">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                    <span className="saved-cell-name">{c.identity.name}</span>
                    {c.identity.nickname && <span className="saved-cell-nick">“{c.identity.nickname}”</span>}
                    <span className="saved-cell-tier mono">{TIER_LABEL[c.identity.tier]}</span>
                    <span className="saved-cell-price mono">
                      {est != null ? usd(est)
                        : msrp != null ? `${usd(msrp)} RETAIL`
                        : 'NO ESTIMATE'}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
