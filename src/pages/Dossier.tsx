import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadMarketTrends, type MarketTrendRow } from '../lib/catalog.ts'
import { TIER_LABEL, type Card, type Change } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel, saleWindowLabel, VENUE_LABEL, reasonText } from '../lib/format.ts'
import { useCompare } from '../lib/compare-store.ts'
import { useSaved } from '../lib/saved-store.ts'
import Sparkline from '../components/Sparkline.tsx'
import TransactionGraphic from '../components/TransactionGraphic.tsx'
import CitedIn from '../components/CitedIn.tsx'
import Cite from '../components/Cite.tsx'

import { feeRuleLabel, getVenueScenarios } from '../lib/venues.ts'

export default function Dossier() {
  const { id } = useParams()
  const data = useDataset()
  const c = data?.cards.find((x) => x.id === id)
  // Must sit above the early returns: a conditional hook changes hook order when
  // navigating from a found card to a missing one, and React throws.
  const [view, setView] = useState<'evidence' | 'venues' | 'story'>('evidence')
  // Compare and Saved don't depend on data — they read from localStorage-backed
  // contexts mounted in App.tsx. Calling them before the !data guard is safe
  // and keeps the hook order stable.
  const compare = useCompare()
  const saved = useSaved()
  const [copied, setCopied] = useState(false)
  const [trendHit, setTrendHit] = useState<(MarketTrendRow & { snapshotDate: string }) | null>(null)

  useEffect(() => {
    if (c) document.title = `${c.identity.brand} ${c.identity.reference} — Time Pop`
    return () => { document.title = 'Time Pop — Watches, Stories & Screen' }
  }, [c])

  useEffect(() => {
    let cancelled = false
    setTrendHit(null)
    loadMarketTrends().then((snap) => {
      if (cancelled || !id || !snap?.trending) return
      const row = snap.trending.find((item) => item.card_id === id)
      setTrendHit(row ? { ...row, snapshotDate: snap.as_of } : null)
    }).catch(() => { if (!cancelled) setTrendHit(null) })
    return () => { cancelled = true }
  }, [id])

  if (!data) return null
  if (!c) {
    return (
      <>
        <Link to="/register" className="crumb">← REGISTER</Link>
        <h1 className="pagetitle">Not in the register</h1>
        <p className="lede">No reference with id “{id}”. It may arrive in a future data build.</p>
      </>
    )
  }
  const starter = c.narrative.starter_alternative
    ? data.cards.find((x) => x.id === c.narrative.starter_alternative) : undefined
  const { estimate, premium, change_1y, change_5y, liquidity, confidence } = c.computed
  const msrpNow = c.retail.current_msrp_usd ?? c.retail.msrp_history.at(-1)?.price_usd
  const inCompare = compare.has(c.id)
  const isSaved = saved.has(c.id)
  const venueScenarios = getVenueScenarios(c)
  const verifiedVenueScenarios = venueScenarios.filter((scenario) => scenario.fee_rule)
  const pendingVenueScenarios = venueScenarios.filter((scenario) => !scenario.fee_rule)

  return (
    <>
      <Link to="/register" className="crumb">← REGISTER</Link>

      <div className={c.media[0] ? 'dsr-top' : 'dsr-top dsr-top--no-portrait'}>
      {c.media[0] ? (
        <figure className="dossier-object">
          <img src={c.media[0].url} alt={`${c.media[0].match === 'exact_reference' ? '' : 'Related configuration for '}${c.identity.brand} ${c.identity.reference} — ${c.identity.name}`} decoding="async" fetchPriority="high" width={600} height={450} />
          <figcaption className="mono micro">
            {c.media[0].match === 'exact_reference' ? 'THIS REFERENCE' : 'RELATED CONFIGURATION'}
            {c.media[0].configuration_reference ? ` · ${c.media[0].configuration_reference}` : ''}
            <br />
            {c.media[0].credit ? `PHOTO: ${c.media[0].credit.toUpperCase()}` : c.media[0].rights_status}
            {c.media[0].license ? ` · ${c.media[0].license.toUpperCase()}` : ''} · <a href={c.media[0].source_url} target="_blank" rel="noreferrer" aria-label="Photo source">SOURCE ↗</a>
            {c.media[0].caption && <details className="dossier-photo-note"><summary>Photo notes</summary><span>{c.media[0].caption}</span></details>}
          </figcaption>
        </figure>
      ) : null}

      <div className="masthead">
        <div className="dsr-identity">
        <p className="eyebrow">{c.identity.brand} · {c.identity.collection} · {TIER_LABEL[c.identity.tier]}</p>
        <h1 className="pagetitle">{c.identity.name} <span className="mono">{c.identity.reference}</span></h1>
        {c.identity.nickname && <p className="mast-nick">“{c.identity.nickname}”</p>}
        <p className="mast-line">{c.identity.one_liner}</p>
        {!c.media[0] && (
          <p className="dsr-photo-status mono micro">
            <strong>PHOTO UNVERIFIED</strong> · Awaiting a source and reuse rights.
          </p>
        )}

      {trendHit && (
        <p className="dsr-trending mono" title="Public attention (Wikipedia pageviews; Google Trends when connected), not price">
          <span className="dsr-trending-pulse" aria-hidden="true">●</span>
          <strong>RANK {trendHit.rank} · {trendHit.snapshotDate}</strong>
          <span className="dim"> · in public attention, not price</span>
          {trendHit.wikipedia.dod_pct != null && (
            <span className="dim"> · wiki {trendHit.wikipedia.dod_pct > 0 ? '+' : ''}{trendHit.wikipedia.dod_pct}%</span>
          )}
        </p>
      )}
        <div className="dsr-actions">
          <div className="dsr-action-group" role="group" aria-label="Collection actions">
          <button
            type="button"
            className={'dsr-action mono' + (inCompare ? ' on' : '')}
            onClick={() => compare.toggle(c.id)}
            aria-pressed={inCompare}
            disabled={!inCompare && compare.full}
            title={inCompare ? 'Remove from compare set' : compare.full ? 'Compare set is full (4 max)' : 'Add to compare set'}
          >
            {inCompare ? '✓ COMPARING' : compare.full ? 'COMPARE FULL' : '+ ADD TO COMPARE'}
          </button>
          <button
            type="button"
            className={'dsr-action dsr-action-save mono' + (isSaved ? ' on' : '')}
            onClick={() => saved.toggle(c.id)}
            aria-pressed={isSaved}
            title={isSaved ? 'Remove from your saved set' : 'Save to your watchlist'}
          >
            {isSaved ? '★ SAVED' : '☆ SAVE'}
          </button>
          <button
            type="button"
            className="dsr-action dsr-action-ghost mono"
            aria-live="polite"
            onClick={() => {
              const url = `${window.location.origin}/w/${c.id}`
              navigator.clipboard?.writeText(url).then(
                () => { setCopied(true); setTimeout(() => setCopied(false), 2000) },
                () => { setCopied(false) }
              )
            }}
            title="Copy link to this dossier"
          >
            {copied ? '✓ COPIED' : '⎘ COPY LINK'}
          </button>
          <span role="status" aria-live="polite" className="mono" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap' }}>{copied ? 'Link copied to clipboard' : ''}</span>
          </div>
          <div className="dsr-action-group dsr-action-group--models" role="group" aria-label="Modeling tools">
            {!!c.lot_observations?.length && estimate.value == null
              ? <button type="button" className="dsr-action mono" onClick={() => {
                  setView('evidence')
                  requestAnimationFrame(() => document.getElementById('observed-lots-heading')?.focus())
                }}>SEE {c.lot_observations.length} AUCTION RESULTS{'\u00a0'}↓</button>
              : <Link to={`/pom?watch=${encodeURIComponent(c.id)}#value-lab`} className="dsr-action mono">MODEL HOLDING PERIODS{'\u00a0'}→</Link>}
            <Link to={`/marketplaces?watch=${encodeURIComponent(c.id)}`} className="dsr-action mono">MODEL SELLING COSTS{'\u00a0'}→</Link>
          </div>
        </div>
        </div>

      <div className="dsr-verdict" aria-label="Five-second verdict">
        <span className="dsr-verdict-eyebrow mono">FIVE-SECOND VERDICT</span>
        <ol className="dsr-verdict-list">
          <li className={`dsr-verdict-row dsr-verdict-row--coral dsr-verdict-row--${rarityClass(c)}`}>
            <span className="dsr-verdict-key mono">RARITY</span>
            <Cite
              source="5-signal Scarcity Index"
              detail={`${c.computed.scarcity.k_of[0]} of 5 signals available: production status, edition size, brand capacity, listings, waitlist.`}
              href="/methodology#scarcity"
            >
              <span className="dsr-verdict-val mono">{c.computed.scarcity.value != null ? String(c.computed.scarcity.value) : '—'}</span>
            </Cite>
            <span className="dsr-verdict-cap mono">{c.computed.scarcity.tier?.toUpperCase() ?? 'NO SIGNALS'}</span>
            <span className="dsr-verdict-state mono">{rarityClass(c).toUpperCase()}</span>
          </li>
          <li className={`dsr-verdict-row dsr-verdict-row--yellow dsr-verdict-row--${demandClass(c)}`}>
            <span className="dsr-verdict-key mono">DEMAND</span>
            <Cite
              source="5-component Collectibility Index"
              detail={`${c.computed.collectibility.k_of[0]} of 5 components available: premium, scarcity, provenance density, auction presence, 5y real price durability.`}
              href="/methodology#collectibility"
            >
              <span className="dsr-verdict-val mono">{c.computed.collectibility.value != null ? String(c.computed.collectibility.value) : '—'}</span>
            </Cite>
            <span className="dsr-verdict-cap mono">{c.computed.collectibility.k_of[0]}/{c.computed.collectibility.k_of[1]} COMPONENTS</span>
            <span className="dsr-verdict-state mono">{demandClass(c).toUpperCase()}</span>
          </li>
          <li className={`dsr-verdict-row dsr-verdict-row--navy dsr-verdict-row--${storyClass(c)}`}>
            <span className="dsr-verdict-key mono">STORY</span>
            <Cite
              source="Sourced event timeline"
              detail={`${c.provenance_events.length} dated event${c.provenance_events.length === 1 ? '' : 's'} on the dossier timeline — each with a cited URL.`}
              href="/methodology#story"
            >
              <span className="dsr-verdict-val mono">{c.provenance_events.length}</span>
            </Cite>
            <span className="dsr-verdict-cap mono">{c.provenance_events.length === 0 ? 'NO EVENTS' : c.provenance_events.length === 1 ? 'SOURCED EVENT' : 'SOURCED EVENTS'}</span>
            <span className="dsr-verdict-state mono">{storyClass(c).toUpperCase()}</span>
          </li>
          <li className={`dsr-verdict-row dsr-verdict-row--teal dsr-verdict-row--${resellClass(c)}`}>
            <span className="dsr-verdict-key mono">RESELL</span>
            <Cite
              source="4-signal Resellability Index"
              detail={`${c.computed.resellability.k_of[0]} of 4 signals available: sales per year, venue diversity, recency, confidence.`}
              href="/methodology#resellability"
            >
              <span className="dsr-verdict-val mono">{c.computed.resellability.value != null ? String(c.computed.resellability.value) : '—'}</span>
            </Cite>
            <span className="dsr-verdict-cap mono">{c.computed.resellability.tier === 'Unknown' ? 'NO COMPS' : `${c.computed.resellability.tier.toUpperCase()} · ${c.computed.resellability.sales_per_year}/YR`}</span>
            <span className="dsr-verdict-state mono">{resellClass(c).toUpperCase()}</span>
          </li>
        </ol>
      </div>

        <dl className="spec-grid mast-spec">
          {c.computed.market_band.band && (
            <div className="spec-row"><dt>Price band</dt>
              <dd className="mono">{c.computed.market_band.band.toUpperCase()} · ON {c.computed.market_band.basis?.toUpperCase()}</dd></div>
          )}
          <div className="spec-row"><dt>Produced</dt><dd className="mono">{yearsLabel(c.identity.produced)}{c.identity.produced.discontinued ? ' · DISCONTINUED' : ' · IN PRODUCTION'}</dd></div>
          <div className="spec-row"><dt>Caliber</dt><dd className="mono">{c.identity.movement.caliber} · {c.identity.movement.type}</dd></div>
          <div className="spec-row"><dt>Case</dt><dd className="mono">{c.identity.case.diameter_mm != null && `${c.identity.case.diameter_mm}MM · `}{c.identity.case.material.toUpperCase()}</dd></div>
          <div className="spec-row"><dt>Bezel</dt><dd className="mono">{c.identity.case.bezel.toUpperCase()}</dd></div>
          {msrpNow != null && <div className="spec-row"><dt>{c.retail.current_msrp_usd != null ? 'Retail' : 'Final retail'}</dt>
            <dd className="mono">{usd(msrpNow)}{c.retail.msrp_history[0] && c.retail.msrp_history[0].price_usd !== msrpNow ? ` · LAUNCH ${usd(c.retail.msrp_history[0].price_usd)} (${c.retail.msrp_history[0].effective_year})` : ''}</dd></div>}
          {c.scarcity_public.limited_edition.is_limited && <div className="spec-row"><dt>Edition</dt>
            <dd className="mono">{c.scarcity_public.limited_edition.stated_size ? `LIMITED · ${c.scarcity_public.limited_edition.stated_size.toLocaleString()} PIECES` : 'LIMITED · SIZE NOT STATED'}</dd></div>}
        </dl>
        
      </div>
      </div>

      <div className="dsr-tabs" role="tablist" aria-label="Dossier view" onKeyDown={(e) => {
        const tabs = ['evidence', 'venues', 'story'] as const
        const idx = tabs.indexOf(view)
        let next: typeof view | null = null
        if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length]
        else if (e.key === 'ArrowLeft') next = tabs[(idx + tabs.length - 1) % tabs.length]
        else if (e.key === 'Home') next = tabs[0]
        else if (e.key === 'End') next = tabs[tabs.length - 1]
        if (next) {
          e.preventDefault()
          setView(next)
          // focus moves with selection — tablist pattern
          requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus())
        }
      }}>
        <button type="button" role="tab" id="tab-evidence" aria-selected={view === 'evidence'}
          aria-controls="panel-evidence" tabIndex={view === 'evidence' ? 0 : -1}
          className={'dsr-tab' + (view === 'evidence' ? ' on' : '')} onClick={() => setView('evidence')}>
          EVIDENCE
        </button>
        <button type="button" role="tab" id="tab-venues" aria-selected={view === 'venues'}
          aria-controls="panel-venues" tabIndex={view === 'venues' ? 0 : -1}
          className={'dsr-tab' + (view === 'venues' ? ' on' : '')} onClick={() => setView('venues')}>
          WHERE TO BUY & SELL
        </button>
        <button type="button" role="tab" id="tab-story" aria-selected={view === 'story'}
          aria-controls="panel-story" tabIndex={view === 'story' ? 0 : -1}
          className={'dsr-tab' + (view === 'story' ? ' on' : '')} onClick={() => setView('story')}>
          STORY & PROVENANCE
        </button>
      </div>

      <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
      {view === 'evidence' && <>
      {!!c.lot_observations?.length && (
        <section className="sect" aria-labelledby="observed-lots-heading">
          <h2 id="observed-lots-heading" tabIndex={-1} className="sect-h">Auction results</h2>
          <p className="dossier-variant-note dim">Reported prices in their original currencies. These lots do not set a market estimate.</p>
          <table className="sales-table dossier-sales dossier-observed-lots" aria-labelledby="observed-lots-heading">
            <thead><tr><th scope="col">Configuration</th><th scope="col" className="num">Sold for</th><th scope="col">Lot</th></tr></thead>
            <tbody>{c.lot_observations.map((lot) => {
              const venue = VENUE_LABEL[lot.venue] ?? lot.venue
              const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(lot.amount)
              return (
                <tr key={lot.url}>
                  <td>
                    {lot.configuration}{' '}
                    <a className="src-a dossier-sale-detail mono micro" href={lot.date_source_url} target="_blank" rel="noreferrer"
                      aria-label={`Session schedule for ${venue}, ${lot.date}`}><time dateTime={lot.date}>{lot.date}</time></a>
                  </td>
                  <td className="num">{lot.currency} {amount}</td>
                  <td><a className="src-a" href={lot.url} target="_blank" rel="noreferrer"
                    aria-label={`Lot record at ${venue}: ${lot.configuration} ${lot.currency} ${amount}`}>Record <span aria-hidden="true">↗</span></a></td>
                </tr>
              )
            })}</tbody>
          </table>
        </section>
      )}
      <EvidenceLedger refusal={estimate.value == null ? reasonText(estimate.reason) : null} measures={[
        { id: 'estimate', available: estimate.value != null, content: (
          <div className="mcell">
            <span className="lab">Market estimate</span>
            {estimate.value != null ? (
              <>
                <span className="val big">{usd(estimate.value)}</span>
                <span className="note mono">
                  {estimate.band && `${usd(estimate.band[0])}–${usd(estimate.band[1])} · `}
                  {estimate.n} sales · {saleWindowLabel(estimate.window_months)}
                  {estimate.stale && estimate.as_of && <> · HISTORICAL, AS OF <time dateTime={estimate.as_of} style={{ whiteSpace: 'nowrap' }}>{estimate.as_of.slice(0, 7)}</time></>}
                </span>
              </>
            ) : (
              <><span className="val dim">{dash}</span><span className="note">{reasonText(estimate.reason)}</span></>
            )}
            <Why text={estimate.limitation} />
          </div>
        ) },
        { id: 'retail', available: premium.value != null, content: (
          <div className="mcell">
            <span className="lab">Vs retail</span>
            {premium.value != null ? (
              <>
                <span className={'val big' + (premium.value < 0 ? ' neg' : '')}>{pct(premium.value)}</span>
                <span className="note mono">{premium.vs?.toUpperCase()} · {usd(premium.msrp_usd!)}</span>
                {premium.stale_baseline && (
                  <span className="note amber">Still in production — current list price not on record, so the real premium is smaller.</span>
                )}
              </>
            ) : (
              <><span className="val dim">{dash}</span><span className="note">{reasonText(premium.reason)}</span></>
            )}
            <Why text={premium.limitation} />
          </div>
        ) },
        { id: 'year', available: change_1y.nominal_pct != null, content: (
          <ChangeCell label="1 year" ch={change_1y} />
        ) },
        { id: 'five-year', available: change_5y.nominal_pct != null, content: (
          <ChangeCell label="5 years" ch={change_5y} />
        ) },
        { id: 'liquidity', available: liquidity.tier !== 'Unknown', content: (
          <div className="mcell">
            <span className="lab">Liquidity</span>
            <span className="val big">{liquidity.tier !== 'Unknown' ? liquidity.tier.toUpperCase() : dash}</span>
            <span className="note mono">{liquidity.sales_per_year} TRACKED SALES / YR</span>
            <Why text={liquidity.limitation} />
          </div>
        ) },
        { id: 'resell', available: c.computed.resellability.value != null, content: (
          <div className="mcell">
            <span className="lab">Resellability</span>
            <span className="val big">{c.computed.resellability.value != null ? c.computed.resellability.value : dash}</span>
            <span className="note mono">{c.computed.resellability.tier.toUpperCase()} · {c.computed.resellability.sales_per_year} SALE{c.computed.resellability.sales_per_year === 1 ? '' : 'S'}/YR</span>
            <Why text={c.computed.resellability.limitation} />
          </div>
        ) },
        { id: 'confidence', available: confidence.tier != null, content: (
          <div className="mcell">
            <span className="lab">Data confidence</span>
            <span className={'val big' + (confidence.tier ? '' : ' dim')}>{confidence.tier ?? dash}</span>
            <span className="note mono">
              {confidence.tier
                ? `${confidence.n} SALE${confidence.n === 1 ? '' : 'S'} · ${confidence.venues} VENUE${confidence.venues === 1 ? '' : 'S'} · NEWEST ${confidence.newest}`
                : reasonText(confidence.reason).toUpperCase()}
            </span>
            <Why text="A: ≥10 sales/24mo, ≥3 venues, ≤90 days fresh. B: ≥4 sales, ≥2 venues, ≤1yr. C: ≥1 verified sale." />
          </div>
        ) },
        { id: 'attention', available: c.computed.attention.value != null, content: (
          <div className="mcell attention-cell">
            <span className="lab">Screen attention</span>
            <span className={'val big' + (c.computed.attention.value == null ? ' dim' : '')}>{c.computed.attention.value ?? dash}</span>
            <span className="note mono">{c.computed.attention.value == null ? reasonText(c.computed.attention.reason) : `${c.computed.attention.screen_count} EXACT FILM/TV SIGHTING${c.computed.attention.screen_count === 1 ? '' : 'S'}`}</span>
            <Why text={c.computed.attention.limitation} />
          </div>
        ) },
      ]} />

      {estimate.value != null && <TransactionGraphic card={c} />}

      </>}

      {view === 'story' && <>
      {c.screen_events.length > 0 && (
        <section className="sect dossier-screen">
          <div className="fact-bubble fact-bubble-yellow">
            <span className="bubble-kicker mono">DID YOU KNOW?</span>
            <strong>{c.screen_events[0].watch} went on screen.</strong>
            <span>{c.screen_events[0].description}</span>
            <a href={c.screen_events[0].source_url} target="_blank" rel="noreferrer">WATCH-ID SOURCE ↗</a>
          </div>
          <div><p className="eyebrow">ATTENTION IS NOT SCARCITY</p><p>This exact-reference match adds to the documented screen-attention signal. It does not change the scarcity score. Price response remains {c.computed.attention.price_response.value == null ? 'not computable' : `${c.computed.attention.price_response.value}%`} because the required before-and-after sales cohort is absent.</p>{c.screen_events.length > 1 && <p className="micro dim">Plus {c.screen_events.length - 1} more exact-reference sighting{c.screen_events.length === 2 ? '' : 's'}.</p>}<Link to="/screen" className="text-link mono">EXPLORE ON SCREEN →</Link></div>
        </section>
      )}

      </>}

      {view === 'evidence' && <>
      {(c.retail.msrp_history.length > 0 || c.notable_sales.length > 0) && (
        <section className="sect">
          <h2 className="sect-h"><span>Price evidence</span>
            {c.comp_summary && <span className="mono">{c.comp_summary.n} VERIFIED SALE{c.comp_summary.n === 1 ? '' : 'S'} · {c.comp_summary.date_range[0].slice(0, 4) === c.comp_summary.date_range[1].slice(0, 4) ? c.comp_summary.date_range[0].slice(0, 4) : `${c.comp_summary.date_range[0].slice(0, 4)}–${c.comp_summary.date_range[1].slice(0, 4)}`}</span>}
          </h2>
          <div className={c.notable_sales.length > 0 && c.notable_sales.length + c.retail.msrp_history.length > 1 ? 'dossier-price-pair' : undefined}>
          <Sparkline msrp={c.retail.msrp_history} sales={c.notable_sales} />
          {c.notable_sales.length > 0 && (
            <table className="sales-table dossier-sales" aria-label="Verified sales">
              <thead><tr><th scope="col">Sale</th><th scope="col" className="num">Price</th><th scope="col">Source</th></tr></thead>
              <tbody>
                {c.notable_sales.map((s, i) => (
                  <tr key={i}>
                    <td>{VENUE_LABEL[s.venue] ?? s.venue}<time className="dossier-sale-detail mono micro dim" dateTime={s.date}>{s.date}</time></td>
                    <td className="num">{usd(s.price_usd)}<span className="dossier-sale-detail mono micro dim">{s.box_papers?.replace('_', ' ') ?? 'Set unknown'}</span></td>
                    <td><a className="src-a" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Record: ${VENUE_LABEL[s.venue] ?? s.venue}, ${s.date}, ${usd(s.price_usd)}`}>Record <span aria-hidden="true">↗</span></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
          {c.comp_summary && c.comp_summary.n > c.notable_sales.length && (
            <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
              Showing the {c.notable_sales.length} most notable of {c.comp_summary.n} verified sales
              ({c.comp_summary.venues.map((v) => VENUE_LABEL[v] ?? v).join(', ')}). The full evidence set stays
              internal and drives the estimate above.
            </p>
          )}
          {c.notable_sales.length === 0 && (
            <p className="honest">No comparable sales on file. Retail prices are not resale evidence.</p>
          )}
        </section>
      )}

      {c.variant_sales.length > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>Variant sales</span><span className="mono">{c.variant_sales.length} EXCLUDED</span></h2>
          <p className="dossier-variant-note dim">
            Different references, configurations, or provenance. These sales do not enter the estimate.
            {c.variant_sales.some((s) => s.fx_conversion) && <> Converted rows show the published currency first; USD is approximate.</>}
          </p>
          <table className="sales-table dossier-sales" aria-label="Variant sales excluded from the estimate">
            <thead><tr><th scope="col">Sale and exclusion</th><th scope="col" className="num">Price</th><th scope="col">Source</th></tr></thead>
            <tbody>
              {c.variant_sales.map((s, i) => {
                const fx = s.fx_conversion
                const result = fx?.original_display ?? usd(s.price_usd)
                const dateLabel = s.date_basis === 'auction_start' ? 'Auction opened' : s.date_basis === 'lot_date' ? 'Sold' : 'Recorded date'
                return (
                <tr key={i}>
                  <td>
                    {VENUE_LABEL[s.venue] ?? s.venue}
                    <span className="dossier-sale-detail mono micro dim">{dateLabel} <time dateTime={s.date}>{s.date}</time></span>
                    <span className="dossier-sale-detail dim">{s.condition}</span>
                  </td>
                  <td className="num">
                    <span className="dossier-variant-native">{result}</span>
                    {fx && (
                      <span
                        className="dossier-sale-detail dossier-variant-fx micro dim mono"
                        title={`${fx.note} 1 ${fx.from} = ${fx.rate} USD. ${fx.provider}`}
                      >
                        ≈ {usd(s.price_usd)} USD<br />
                        ECB {fx.rate_date}<br />
                        {fx.date_basis === 'auction_start' ? 'Opening-date FX' : fx.date_basis === 'verified_sale_date' ? 'Sale-date FX' : 'FX basis unverified'}
                      </span>
                    )}
                  </td>
                  <td><a className="src-a" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Record: excluded sale at ${VENUE_LABEL[s.venue] ?? s.venue}, ${dateLabel.toLowerCase()} ${s.date}, ${result}`}>Record <span aria-hidden="true">↗</span></a></td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      </>}

      {view === 'venues' && (
        <section className="sect dossier-venues-section">
          <div className="section-rule">
            <h2>Venue fee scenarios</h2>
            <span className="mono micro dim">ONE BASELINE · VERIFIED FEES ONLY</span>
          </div>
          <p className="lede dim" style={{ marginBottom: 'var(--space-md)' }}>
            These are not live venue quotes. Time Pop applies a checked public fee schedule to this
            dossier’s market estimate. If either the estimate or the fee source is missing, the math
            stays off.
          </p>
          <Link className="src-a" to={`/rehome?watch=${encodeURIComponent(c.id)}`}>Make a handover brief →</Link>

          <div className="dossier-venue-grid">
            {verifiedVenueScenarios.map((scenario) => (
              <div key={scenario.venue.id} className="dossier-venue-card">
                <div className="dvc-head">
                  <div>
                    <span className="eyebrow">{scenario.venue.region.toUpperCase()} · {scenario.venue.country.toUpperCase()}</span>
                    <h4>{scenario.venue.name}</h4>
                  </div>
                  <span className="vc-type-tag mono micro">{scenario.venue.type.toUpperCase()}</span>
                </div>
                {scenario.fee_rule ? <>
                  <div className="dvc-price-row">
                    <span className="lab mono micro">DOSSIER BASELINE · NOT A QUOTE</span>
                    <span className="val mono">{scenario.baseline_value != null ? usd(scenario.baseline_value) : '—'}</span>
                  </div>
                  <div className="dvc-details mono micro">
                    <span>Modeled seller proceeds: <strong>{scenario.seller_proceeds != null ? usd(scenario.seller_proceeds) : 'NOT MODELED'}</strong></span>
                    <span>Modeled buyer total: <strong>{scenario.buyer_total != null ? usd(scenario.buyer_total) : 'NOT MODELED'}</strong></span>
                  </div>
                  <span className="dvc-bias mono micro amber">{feeRuleLabel(scenario.fee_rule)}</span>
                  <span className="mono micro dim">{scenario.fee_rule.scope}</span>
                  <span className="mono micro dim">
                    BASE: {scenario.baseline_n} COMPS · TIER {scenario.baseline_confidence ?? '—'} · AS OF {scenario.baseline_as_of ?? '—'}
                  </span>
                  <span className="mono micro dim">
                    FEE SOURCE: OFFICIAL · TIER VERIFIED · CHECKED {scenario.fee_rule.checked_date} ·{' '}
                    {scenario.fee_rule.sources.map((source, index) => <span key={source.url}>
                      {index > 0 ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
                    </span>)}
                  </span>
                  <span className="micro dim">{scenario.limitation}</span>
                </> : null}
                <div className="dvc-footer">
                  <span className="mono micro dim">VERIFIED FEE SCHEDULE</span>
                  <a href={`${scenario.venue.website_url}?q=${encodeURIComponent(`${c.identity.brand} ${c.identity.reference}`)}`} target="_blank" rel="noreferrer" className="src-a mono micro">
                    SEARCH {scenario.venue.name.toUpperCase()} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="dossier-pending-venues">
            <div className="section-rule">
              <h3>Search the wider directory</h3>
              <span className="mono micro dim">{pendingVenueScenarios.length} VENUES · FEE MATH OFF</span>
            </div>
            <p className="micro dim">These venues remain useful places to look. Their public fee schedules have not cleared the source check, so Time Pop shows no proceeds or buyer-cost number.</p>
            <div className="dossier-pending-links">
              {pendingVenueScenarios.map((scenario) => (
                <a key={scenario.venue.id}
                  href={`${scenario.venue.website_url}?q=${encodeURIComponent(`${c.identity.brand} ${c.identity.reference}`)}`}
                  target="_blank" rel="noreferrer">
                  <span>{scenario.venue.name}</span>
                  <small className="mono">{scenario.venue.region.toUpperCase()} · SEARCH ↗</small>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === 'story' && <>
      {c.provenance_events.length > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>Provenance & influence</span><span className="mono">{c.provenance_events.length} SOURCED EVENTS</span></h2>
          <div className="timeline">
            {[...c.provenance_events].sort((a, b) => a.date.localeCompare(b.date)).map((e, i) => (
              <div className="tl-item" key={i}>
                <p className="tl-date">{e.date}</p>
                <p className="tl-what">{e.person_or_event}</p>
                <p className="tl-desc">{e.description} <a className="src-a" href={e.source_url} target="_blank" rel="noopener noreferrer">source ↗</a></p>
              </div>
            ))}
          </div>
        </section>
      )}

      </>}

      {view === 'evidence' && (starter) && <>
      {trendHit && (
        <section className="sect">
          <h2 className="sect-h"><span>In public attention</span><span className="mono">RANK {trendHit.rank} · {trendHit.snapshotDate}</span></h2>
          <p>This snapshot ranks Wikipedia pageviews and Google Trends when connected. It does not measure resale prices.</p>
          <p className="micro dim">
            {trendHit.wikipedia.dod_pct != null
              ? `Wikipedia ${trendHit.wikipedia.dod_pct > 0 ? '+' : ''}${trendHit.wikipedia.dod_pct}% day-over-day`
              : 'Wikipedia quiet'}
            {trendHit.trends.interest != null ? ` · Trends interest ${trendHit.trends.interest} (relative, 0–100)` : ''}
            .
          </p>
          <Link to="/" className="text-link mono">SEE THE HOME BAND →</Link>
        </section>
      )}
      {starter && (
        <section className="sect">
          <h2 className="sect-h"><span>If this is the destination</span></h2>
          <Link to={`/w/${starter.id}`} className="ladder-row" style={{ border: 'var(--border)' }}>
            <span><span className="l-brand">{starter.identity.brand}</span> <span className="mono dim">{starter.identity.reference}</span>
              {starter.identity.nickname && <span className="l-nick"> “{starter.identity.nickname}”</span>}</span>
            <span className="mono">{starter.computed.estimate.value != null ? usd(starter.computed.estimate.value)
              : starter.retail.current_msrp_usd != null ? `${usd(starter.retail.current_msrp_usd)} RETAIL` : dash}</span>
          </Link>
          <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
            Same design DNA, a fraction of the price. The full ladder lives on the Story tab.
          </p>
        </section>
      )}
      </>}

      {view === 'story' && <>
      <section className="sect prose">
        <h2 className="sect-h"><span>Why it matters</span></h2>
        <p>{c.narrative.story}</p>
        {c.narrative.collector_notes && <p className="dim">{c.narrative.collector_notes}</p>}
      </section>

      <CitedIn watchId={c.id} />

      {starter && (
        <section className="sect">
          <h2 className="sect-h"><span>The honest starting point</span></h2>
          <Link to={`/w/${starter.id}`} className="ladder-row" style={{ border: 'var(--border)' }}>
            <span><span className="l-brand">{starter.identity.brand}</span> <span className="mono dim">{starter.identity.reference}</span>
              {starter.identity.nickname && <span className="l-nick"> “{starter.identity.nickname}”</span>}</span>
            <span className="mono">{starter.computed.estimate.value != null ? usd(starter.computed.estimate.value)
              : starter.retail.current_msrp_usd != null ? `${usd(starter.retail.current_msrp_usd)} RETAIL` : dash}</span>
          </Link>
          <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
            Same design DNA, a fraction of the price. Grails reward patience; taste can start today.
          </p>
        </section>
      )}

      {c.brand_context.tier && (
        <p className="brand-context mono micro">
          EDITORIAL TIER {c.brand_context.tier} · {c.brand_context.label?.toUpperCase()} ·{' '}
          <a href={c.brand_context.source_url} target="_blank" rel="noreferrer">SOURCE ↗</a>
          <br /><span>{c.brand_context.limitation}</span>
        </p>
      )}
      </>}
      </div>

      {!c.comp_summary && (
        <section className="sect">
          <div className="fact-bubble fact-bubble-coral">
            <span className="bubble-kicker mono">WHY NO MARKET ESTIMATE?</span>
            <strong>The register refuses to estimate this one.</strong>
            <span>{c.lot_observations?.length
              ? 'The recorded lots are individual auction results, not a comparable price series.'
              : c.variant_sales.length > 0
              ? 'The variant sales above price different watches or configurations, not this one.'
              : 'No comparable sales are on file for this watch.'}</span>
            <Link to="/methodology" className="src-a">HOW THE ESTIMATOR DECIDES →</Link>
          </div>
        </section>
      )}

      <RelatedWatches current={c} all={data.cards} />

      <p className="micro dim mono">
        CURATED {c.meta.curated_date} · DATA BUILD {c.meta.build_date} · {c.meta.sources.length} SOURCES ·{' '}
        <Link to="/methodology" className="src-a">METHODOLOGY</Link>
      </p>
    </>
  )
}

// The four "classify" helpers used by the 5-second verdict on the Dossier.
// Thresholds: STRONG / NEUTRAL / WEAK.
function rarityClass(c: Card): 'strong' | 'neutral' | 'weak' {
  const v = c.computed.scarcity.value
  if (v == null) return 'weak'
  if (v >= 70) return 'strong'
  if (v >= 40) return 'neutral'
  return 'weak'
}
function demandClass(c: Card): 'strong' | 'neutral' | 'weak' {
  const v = c.computed.collectibility.value
  if (v == null) return 'weak'
  if (v >= 70) return 'strong'
  if (v >= 40) return 'neutral'
  return 'weak'
}
function storyClass(c: Card): 'strong' | 'neutral' | 'weak' {
  const n = c.provenance_events.length
  if (n >= 5) return 'strong'
  if (n >= 1) return 'neutral'
  return 'weak'
}
function resellClass(c: Card): 'strong' | 'neutral' | 'unknown' {
  const t = c.computed.resellability.tier
  if (t === 'High') return 'strong'
  if (t === 'Medium' || t === 'Low') return 'neutral'
  return 'unknown'
}

type EvidenceMeasure = { id: string; available: boolean; content: ReactNode }

function EvidenceLedger({ refusal, measures }: { refusal: string | null; measures: EvidenceMeasure[] }) {
  const published = measures.filter(measure => measure.available)
  const unavailable = measures.filter(measure => !measure.available)
  return (
    <section className="dsr-evidence-ledger" aria-label="Evidence measures">
      {refusal && <p className="dsr-estimate-refusal"><strong>Market estimate</strong> <span aria-hidden="true">—</span> {refusal}</p>}
      {published.map(measure => <Fragment key={measure.id}>{measure.content}</Fragment>)}
      {unavailable.length > 0 && (
        <details className="dsr-unavailable">
          <summary>{unavailable.length} unavailable {unavailable.length === 1 ? 'measure' : 'measures'} · reasons and limits</summary>
          {unavailable.map(measure => <Fragment key={measure.id}>{measure.content}</Fragment>)}
        </details>
      )}
    </section>
  )
}

function ChangeCell({ label, ch }: { label: string; ch: Change }) {
  return (
    <div className="mcell">
      <span className="lab">Δ {label}</span>
      {ch.nominal_pct != null ? (
        <>
          <span className={'val big' + (ch.nominal_pct < 0 ? ' neg' : '')}>{pct(ch.nominal_pct)}</span>
          <span className="note mono">{ch.real_pct != null ? `${pct(ch.real_pct)} REAL (CPI-ADJ)` : 'CPI N/A'}</span>
        </>
      ) : (
        <><span className="val dim">{dash}</span><span className="note">{reasonText(ch.reason)}</span></>
      )}
      <Why text={ch.limitation} />
    </div>
  )
}

function Why({ text }: { text: string }) {
  return (
    <details className="why">
      <summary>limits</summary>
      <p>{text}</p>
    </details>
  )
}

/** Find 3 references that belong to the same conversation as `current`.
 *  Priority: same brand + same tier (closest), then same tier, then within a 10-year
 *  production window. Backfill with anything if the tiers are sparse. Excludes the
 *  current card. The result is what the reader is most likely to compare against. */
function findRelated(current: Card, all: Card[]): Card[] {
  const others = all.filter((x) => x.id !== current.id)
  const out: Card[] = []
  const seen = new Set<string>()
  const tryAdd = (card: Card) => {
    if (out.length >= 3) return
    if (seen.has(card.id)) return
    seen.add(card.id)
    out.push(card)
  }
  const byEvidence = (a: Card, b: Card) => {
    const photo = Number(b.media.length > 0) - Number(a.media.length > 0)
    if (photo) return photo
    return (b.comp_summary?.n ?? 0) - (a.comp_summary?.n ?? 0)
  }
  // Same brand + same tier — closest neighbours
  others.filter((x) => x.identity.brand === current.identity.brand && x.identity.tier === current.identity.tier)
    .sort(byEvidence)
    .forEach(tryAdd)
  // Same tier, different brand
  if (out.length < 3) {
    others.filter((x) => x.identity.tier === current.identity.tier)
      .sort(byEvidence)
      .forEach(tryAdd)
  }
  // Within 10 years of production start
  if (out.length < 3) {
    const cs = current.identity.produced.start_year
    others.filter((x) => Math.abs(x.identity.produced.start_year - cs) < 10)
      .sort(byEvidence)
      .forEach(tryAdd)
  }
  return out
}

function RelatedWatches({ current, all }: { current: Card; all: Card[] }) {
  const related = findRelated(current, all)
  if (related.length === 0) return null
  return (
    <section className="sect related-watches">
      <h2 className="sect-h"><span>Read next in the same conversation</span><span className="mono">{related.length} NEIGHBOURS</span></h2>
      <div className="related-watches-grid">
        {related.map((r) => {
          const m = r.media[0]
          const est = r.computed.estimate.value
          const msrp = r.retail.current_msrp_usd ?? r.retail.msrp_history.at(-1)?.price_usd
          return (
            <Link key={r.id} to={`/w/${r.id}`} className="related-watch">
              <span className="related-watch-img">
                {m ? <img src={m.url} alt={r.identity.name} loading="lazy" decoding="async"  width={400} height={300} />
                  : <span className="related-watch-img-empty mono">NO PHOTO</span>}
              </span>
              <span className="related-watch-body">
                <span className="related-watch-source mono">{r.identity.brand.toUpperCase()} · {r.identity.reference}</span>
                <span className="related-watch-name">{r.identity.name}</span>
                {r.identity.nickname && <span className="related-watch-nick">“{r.identity.nickname}”</span>}
                <span className="related-watch-price mono">
                  {est != null ? usd(est)
                    : msrp != null ? `${usd(msrp)} RETAIL`
                    : 'NO ESTIMATE'}
                </span>
                <span className="related-watch-cta">OPEN →</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
