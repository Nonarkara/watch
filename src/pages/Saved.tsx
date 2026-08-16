import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { useSaved } from '../lib/saved-store.ts'
import { getRecentlyViewed } from '../lib/recently-viewed.ts'
import { usd } from '../lib/format.ts'
import { TIER_LABEL } from '../lib/data.ts'
import { loadMarketTrends, type MarketTrendRow, type MarketTrendsSnapshot } from '../lib/catalog.ts'
import {
  advanceAttentionHistory,
  attentionAgeDays,
  compareSavedAttention,
  parseAttentionHistory,
  snapshotFromRows,
  type AttentionHistory,
  type SavedAttentionPulse,
} from '../lib/attention-pulse.ts'

const ATTENTION_HISTORY_KEY = 'watch.attention.history.v1'

function movementLabel(pulse: SavedAttentionPulse): string {
  if (pulse.movement === 'current') return `TODAY #${pulse.current_rank}`
  if (pulse.movement === 'new') return `NEW · #${pulse.current_rank}`
  if (pulse.movement === 'up') return `UP ${pulse.places} · #${pulse.current_rank}`
  if (pulse.movement === 'down') return `DOWN ${pulse.places} · #${pulse.current_rank}`
  if (pulse.movement === 'steady') return `STEADY · #${pulse.current_rank}`
  if (pulse.movement === 'out') return 'OUT OF TOP 20'
  return 'QUIET'
}

function trendSignal(trend: MarketTrendRow | undefined): string | null {
  if (!trend) return null
  const parts: string[] = []
  if (trend.wikipedia.last_views != null) parts.push(`${trend.wikipedia.last_views.toLocaleString()} WIKI VIEWS`)
  if (trend.wikipedia.dod_pct != null) {
    const sign = trend.wikipedia.dod_pct > 0 ? '+' : ''
    parts.push(`${sign}${trend.wikipedia.dod_pct.toFixed(0)}% DAY/DAY`)
  }
  if (trend.trends.interest != null) parts.push(`GOOGLE ${trend.trends.interest}/100`)
  return parts.length ? parts.join(' · ') : null
}

/** Personal watchlist — localStorage-backed, no auth. Shows the saved set
 *  as the same ticker cells the home page uses, plus a clear-all. Empty
 *  state explains what a watchlist is for and links to the register. */
export default function Saved() {
  const data = useDataset()
  const { ids, clear, count } = useSaved()
  const [trends, setTrends] = useState<MarketTrendsSnapshot | null>(null)
  const [attentionHistory, setAttentionHistory] = useState<AttentionHistory | null>(null)

  useEffect(() => {
    let cancelled = false
    loadMarketTrends().then((snapshot) => {
      if (cancelled || !snapshot?.trending) return
      let prior: AttentionHistory | null = null
      try {
        prior = parseAttentionHistory(JSON.parse(localStorage.getItem(ATTENTION_HISTORY_KEY) ?? 'null'))
      } catch {
        prior = null
      }
      const incoming = snapshotFromRows(snapshot.as_of, snapshot.trending)
      const next = advanceAttentionHistory(prior, incoming)
      setTrends(snapshot)
      setAttentionHistory(next)
      try {
        localStorage.setItem(ATTENTION_HISTORY_KEY, JSON.stringify(next))
      } catch {
        // Private browsing and storage policies can refuse writes; the current pulse still works.
      }
    })
    return () => { cancelled = true }
  }, [])

  const trendByCard = useMemo(
    () => new Map((trends?.trending ?? []).map((row) => [row.card_id, row])),
    [trends],
  )

  if (!data) return null

  const byId = new Map(data.cards.map((c) => [c.id, c]))
  const cards = ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c))
  const recentIds = getRecentlyViewed().filter((rid) => !ids.includes(rid)) // exclude already-saved
  const recentCards = recentIds.map((rid) => byId.get(rid)).filter((c): c is NonNullable<typeof c> => Boolean(c)).slice(0, 6)
  const cardIds = cards.map((card) => card.id)
  const pulse = attentionHistory
    ? compareSavedAttention(cardIds, attentionHistory.current, attentionHistory.previous)
    : []
  const pulseRows = pulse.filter((row) => row.movement !== 'quiet').slice(0, 6)
  const currentAttentionCount = pulse.filter((row) => row.current_rank != null).length
  const trendAge = trends ? attentionAgeDays(trends.as_of) : null

  return (
    <>
      <Link to="/" className="crumb">← HOME</Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">YOUR SAVED SET · {count} WATCH{count === 1 ? '' : 'ES'}</p>
          <h1 className="pagetitle">The ones you want to come back to.</h1>
          <p className="lede">
            A watchlist and one-day attention memory stored in your browser, not on our servers.
            Your watches never leave this device; the public signal changes around them. No account,
            no email, no tracking.
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
            <Link to="/register" className="src-a">BROWSE THE {data.count} OBJECTS →</Link>
          </div>
        </section>
      ) : (
        <>
          {trends && attentionHistory && (
            <section className="sect saved-pulse" aria-labelledby="saved-pulse-title">
              <div className="saved-pulse-head">
                <div>
                  <p className="eyebrow" id="saved-pulse-title">YOUR DAILY PULSE</p>
                  <strong className="saved-pulse-number">{currentAttentionCount}/{cards.length}</strong>
                  <p className="saved-pulse-deck">saved references are in today&apos;s public-attention watchlist.</p>
                </div>
                <div className="saved-pulse-note">
                  <span className="saved-pulse-live mono">● PUBLIC SIGNAL</span>
                  <p>Search and reading attention can precede demand, or mean nothing at all. It is context—not a price forecast.</p>
                </div>
              </div>

              <div className="saved-pulse-meta mono">
                <span>AS OF {trends.as_of}</span>
                <span>{trendAge == null ? 'AGE UNKNOWN' : `${trendAge} DAY${trendAge === 1 ? '' : 'S'} OLD`}</span>
                <span>GOOGLE TRENDS + WIKIPEDIA</span>
                <strong>ATTENTION ≠ PRICE</strong>
              </div>

              {pulseRows.length > 0 ? (
                <div className="saved-pulse-list">
                  {pulseRows.map((row) => {
                    const card = byId.get(row.card_id)
                    if (!card) return null
                    const media = card.media[0]
                    const trend = trendByCard.get(row.card_id)
                    return (
                      <Link key={row.card_id} to={`/w/${row.card_id}`} className="saved-pulse-row">
                        <span className="saved-pulse-rank mono">{row.current_rank ?? '—'}</span>
                        <span className="saved-pulse-image">
                          {media
                            ? <img src={media.url} alt="" loading="lazy" />
                            : <span className="mono">NO PHOTO</span>}
                        </span>
                        <span className="saved-pulse-object">
                          <span className="saved-pulse-source mono">{card.identity.brand.toUpperCase()} · {card.identity.reference}</span>
                          <strong>{card.identity.name}</strong>
                          {trendSignal(trend) && <span className="saved-pulse-signal mono">{trendSignal(trend)}</span>}
                        </span>
                        <span className="saved-pulse-move mono" data-movement={row.movement}>{movementLabel(row)}</span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="saved-pulse-quiet">Quiet today. None of your saved references appears in the current top 20.</p>
              )}

              <p className="saved-pulse-foot mono">
                RANK HISTORY STAYS ON THIS DEVICE · {attentionHistory.previous
                  ? `COMPARED WITH ${attentionHistory.previous.as_of}`
                  : 'COME BACK AFTER THE NEXT DAILY SNAPSHOT TO SEE MOVEMENT'}
              </p>
            </section>
          )}

          <section className="sect">
            <div className="saved-grid">
            {cards.map((c) => {
              const m = c.media[0]
              const est = c.computed.estimate.value
              const msrp = c.retail.current_msrp_usd ?? c.retail.msrp_history.at(-1)?.price_usd
              const trend = trendByCard.get(c.id)
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
                    {trend && <span className="saved-cell-pulse mono">TODAY #{trend.rank} · {trendSignal(trend)}</span>}
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
        </>
      )}

      {recentCards.length > 0 && (
        <section className="sect">
          <div className="section-rule">
            <h2>Recently viewed.</h2>
            <span className="sticker-inline mono">LAST 6 · LOCAL HISTORY</span>
          </div>
          <p className="dim what-changed-deck">
            Dossiers you opened on this device. Same browser-local rules as your saved set —
            we don’t see it, you can clear it any time.
          </p>
          <div className="saved-grid">
            {recentCards.map((c) => {
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
