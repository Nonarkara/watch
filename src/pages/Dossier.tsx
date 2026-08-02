import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { TIER_LABEL, type Change } from '../lib/data.ts'
import { usd, pct, dash, yearsLabel, VENUE_LABEL, reasonText } from '../lib/format.ts'
import Meter from '../components/Meter.tsx'
import Sparkline from '../components/Sparkline.tsx'

export default function Dossier() {
  const { id } = useParams()
  const data = useDataset()
  const c = data?.cards.find((x) => x.id === id)
  // Must sit above the early returns: a conditional hook changes hook order when
  // navigating from a found card to a missing one, and React throws.
  const [view, setView] = useState<'evidence' | 'story'>('evidence')

  useEffect(() => {
    if (c) document.title = `${c.identity.brand} ${c.identity.reference} — Time Pop`
    return () => { document.title = 'Time Pop — Watches, Stories & Screen' }
  }, [c])

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
  const { estimate, premium, change_1y, change_5y, scarcity, collectibility, liquidity, confidence } = c.computed
  const msrpNow = c.retail.current_msrp_usd ?? c.retail.msrp_history.at(-1)?.price_usd

  return (
    <>
      <Link to="/register" className="crumb">← REGISTER</Link>

      <div className="dsr-top">
      {c.media[0] ? (
        <figure className="dossier-object">
          <a href={c.media[0].source_url} target="_blank" rel="noreferrer"><img src={c.media[0].url} alt={c.identity.name} /></a>
          <figcaption className="mono micro">
            {c.media[0].match === 'exact_reference' ? 'THIS REFERENCE' : 'RELATED CONFIGURATION'}
            {c.media[0].configuration_reference ? ` · ${c.media[0].configuration_reference}` : ''}
            {c.media[0].caption && <><br /><span>{c.media[0].caption}</span></>}
            <br />
            {c.media[0].credit ? `PHOTO: ${c.media[0].credit.toUpperCase()}` : c.media[0].rights_status}
            {c.media[0].license ? ` · ${c.media[0].license.toUpperCase()}` : ''} · SOURCE ↗
          </figcaption>
        </figure>
      ) : <div className="empty-photo dossier-empty"><strong>IMAGE FRAME</strong><span>This reference has no verified media attachment yet.</span><small className="mono">AWAITING A SOURCE + RIGHTS PATH</small></div>}

      <div className="masthead">
        <p className="eyebrow">{c.identity.brand} · {c.identity.collection} · {TIER_LABEL[c.identity.tier]}</p>
        <h1 className="pagetitle">{c.identity.name} <span className="mono">{c.identity.reference}</span></h1>
        {c.identity.nickname && <p className="mast-nick">“{c.identity.nickname}”</p>}
        <p className="mast-line">{c.identity.one_liner}</p>

        <dl className="spec-grid mast-spec">
          {c.computed.market_band.band && (
            <div className="spec-row"><dt>Price band</dt>
              <dd className="mono">{c.computed.market_band.band.toUpperCase()} · ON {c.computed.market_band.basis?.toUpperCase()}</dd></div>
          )}
          <div className="spec-row"><dt>Produced</dt><dd className="mono">{yearsLabel(c.identity.produced)}{c.identity.produced.discontinued ? ' · DISCONTINUED' : ' · IN PRODUCTION'}</dd></div>
          <div className="spec-row"><dt>Caliber</dt><dd className="mono">{c.identity.movement.caliber} · {c.identity.movement.type}</dd></div>
          <div className="spec-row"><dt>Case</dt><dd className="mono">{c.identity.case.diameter_mm}MM · {c.identity.case.material.toUpperCase()}</dd></div>
          <div className="spec-row"><dt>Bezel</dt><dd className="mono">{c.identity.case.bezel.toUpperCase()}</dd></div>
          {msrpNow != null && <div className="spec-row"><dt>{c.retail.current_msrp_usd != null ? 'Retail' : 'Final retail'}</dt>
            <dd className="mono">{usd(msrpNow)}{c.retail.msrp_history[0] && c.retail.msrp_history[0].price_usd !== msrpNow ? ` · LAUNCH ${usd(c.retail.msrp_history[0].price_usd)} (${c.retail.msrp_history[0].effective_year})` : ''}</dd></div>}
          {c.scarcity_public.limited_edition.is_limited && <div className="spec-row"><dt>Edition</dt>
            <dd className="mono">{c.scarcity_public.limited_edition.stated_size ? `LIMITED · ${c.scarcity_public.limited_edition.stated_size.toLocaleString()} PIECES` : 'LIMITED · SIZE NOT STATED'}</dd></div>}
        </dl>
        
      </div>
      </div>

      <div className="dsr-tabs" role="tablist" aria-label="Dossier view">
        <button type="button" role="tab" aria-selected={view === 'evidence'}
          className={'dsr-tab' + (view === 'evidence' ? ' on' : '')} onClick={() => setView('evidence')}>
          EVIDENCE
        </button>
        <button type="button" role="tab" aria-selected={view === 'story'}
          className={'dsr-tab' + (view === 'story' ? ' on' : '')} onClick={() => setView('story')}>
          STORY & PROVENANCE
        </button>
      </div>

      {view === 'evidence' && <>
      <div className="metric-strip">
        <div className="mcell">
          <span className="lab">Market estimate</span>
          {estimate.value != null ? (
            <>
              <span className="val big">{usd(estimate.value)}</span>
              <span className="note mono">
                {estimate.band && `${usd(estimate.band[0])}–${usd(estimate.band[1])} · `}
                n={estimate.n} · {estimate.window_months}mo{estimate.stale ? ` · HISTORICAL, AS OF ${estimate.as_of?.slice(0, 7)}` : ''}
              </span>
            </>
          ) : (
            <><span className="val dim">{dash}</span><span className="note">{reasonText(estimate.reason)}</span></>
          )}
          <Why text={estimate.limitation} />
        </div>
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
        <ChangeCell label="1 year" ch={change_1y} />
        <ChangeCell label="5 years" ch={change_5y} />
        <div className="mcell">
          <span className="lab">Scarcity {scarcity.value >= 75 ? '· GRAIL' : ''}</span>
          <span className="val big">{scarcity.value}</span>
          <span className="note mono">{scarcity.tier?.toUpperCase()} · {scarcity.k_of[0]}/{scarcity.k_of[1]} SIGNALS</span>
          <Meter value={scarcity.value} />
          <Why text={scarcity.limitation} />
        </div>
        <div className="mcell">
          <span className="lab">Collectibility</span>
          <span className="val big">{collectibility.value}</span>
          <span className="note mono">{collectibility.k_of[0]}/{collectibility.k_of[1]} COMPONENTS</span>
          <Meter value={collectibility.value} />
          <Why text={collectibility.limitation} />
        </div>
        <div className="mcell">
          <span className="lab">Liquidity</span>
          <span className="val big">{liquidity.tier !== 'Unknown' ? liquidity.tier.toUpperCase() : dash}</span>
          <span className="note mono">{liquidity.sales_per_year} TRACKED SALES / YR</span>
          <Why text={liquidity.limitation} />
        </div>
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
        <div className="mcell attention-cell">
          <span className="lab">Screen attention</span>
          <span className={'val big' + (c.computed.attention.value == null ? ' dim' : '')}>{c.computed.attention.value ?? dash}</span>
          <span className="note mono">{c.computed.attention.value == null ? reasonText(c.computed.attention.reason) : `${c.computed.attention.screen_count} EXACT FILM/TV SIGHTING${c.computed.attention.screen_count === 1 ? '' : 'S'}`}</span>
          <Why text={c.computed.attention.limitation} />
        </div>
        <div className="mcell pressure-cell">
          <span className="lab">Supply × attention</span>
          <span className={'val big' + (c.computed.attention.pressure == null ? ' dim' : '')}>{c.computed.attention.pressure ?? dash}</span>
          <span className="note mono">RESEARCH PRESSURE · NOT PRICE</span>
          <Why text={c.computed.attention.price_response.limitation} />
        </div>
      </div>

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
          <div><p className="eyebrow">ATTENTION IS NOT SCARCITY</p><p>This exact-reference match adds to the documented screen-attention signal. It does not change the scarcity score. Price response remains {c.computed.attention.price_response.value == null ? 'not computable' : `${c.computed.attention.price_response.value}%`} because the required before-and-after sales cohort is absent.</p>{c.screen_events.length > 1 && <p className="micro dim">Plus {c.screen_events.length - 1} more exact-reference sighting{c.screen_events.length === 2 ? '' : 's'}.</p>}<Link to="/screen" className="text-link mono">EXPLORE ROLEX ON SCREEN →</Link></div>
        </section>
      )}

      </>}

      {view === 'evidence' && <>
      {(c.retail.msrp_history.length > 0 || c.notable_sales.length > 0) && (
        <section className="sect">
          <h2 className="sect-h"><span>Price evidence</span>
            {c.comp_summary && <span className="mono">{c.comp_summary.n} VERIFIED SALE{c.comp_summary.n === 1 ? '' : 'S'} · {c.comp_summary.date_range[0].slice(0, 4) === c.comp_summary.date_range[1].slice(0, 4) ? c.comp_summary.date_range[0].slice(0, 4) : `${c.comp_summary.date_range[0].slice(0, 4)}–${c.comp_summary.date_range[1].slice(0, 4)}`}</span>}
          </h2>
          <Sparkline msrp={c.retail.msrp_history} sales={c.notable_sales} buildDate={c.computed.as_of_build} />
          {c.notable_sales.length > 0 && (
            <table className="sales-table">
              <thead><tr><th>Date</th><th>Venue</th><th className="num">Price</th><th>Set</th><th>Source</th></tr></thead>
              <tbody>
                {c.notable_sales.map((s, i) => (
                  <tr key={i}>
                    <td className="mono">{s.date}</td>
                    <td>{VENUE_LABEL[s.venue] ?? s.venue}</td>
                    <td className="num">{usd(s.price_usd)}</td>
                    <td className="mono micro dim">{s.box_papers?.replace('_', ' ').toUpperCase() ?? dash}</td>
                    <td><a className="src-a" href={s.url} target="_blank" rel="noopener noreferrer">record ↗</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {c.comp_summary && c.comp_summary.n > c.notable_sales.length && (
            <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
              Showing the {c.notable_sales.length} most notable of {c.comp_summary.n} verified sales
              ({c.comp_summary.venues.map((v) => VENUE_LABEL[v] ?? v).join(', ')}). The full evidence set stays
              internal and drives the estimate above.
            </p>
          )}
          {c.notable_sales.length === 0 && (
            <p className="honest">No verified sales collected yet for this reference. The register shows retail
              history only — it does not estimate without evidence.</p>
          )}
        </section>
      )}

      {c.variant_sales.length > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>Variant sales — not used in the estimate</span><span className="mono">{c.variant_sales.length} EXCLUDED</span></h2>
          <p className="honest" style={{ marginBottom: 'var(--space-md)' }}>
            These are real, cited sales of a different configuration — a special-signed dial, a
            celebrity-owned example, a charity lot. They price a different object than this
            reference, so the register shows them as evidence and keeps them out of the market
            estimate. Averaging them in would inflate the number for every ordinary example.
          </p>
          <table className="sales-table">
            <thead><tr><th>Date</th><th>Venue</th><th className="num">Price</th><th>Why excluded</th><th>Source</th></tr></thead>
            <tbody>
              {c.variant_sales.map((s, i) => (
                <tr key={i}>
                  <td className="mono">{s.date}</td>
                  <td>{VENUE_LABEL[s.venue] ?? s.venue}</td>
                  <td className="num">{usd(s.price_usd)}</td>
                  <td className="dim">{s.condition}</td>
                  <td><a className="src-a" href={s.url} target="_blank" rel="noopener noreferrer">record ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      </>}

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

      {view === 'evidence' && <>

      </>}

      {view === 'story' && <>
      <section className="sect prose">
        <h2 className="sect-h"><span>Why it matters</span></h2>
        <p>{c.narrative.story}</p>
        {c.narrative.collector_notes && <p className="dim">{c.narrative.collector_notes}</p>}
      </section>

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

      <p className="micro dim mono">
        CURATED {c.meta.curated_date} · DATA BUILD {c.meta.build_date} · {c.meta.sources.length} SOURCES ·{' '}
        <Link to="/methodology" className="src-a">METHODOLOGY</Link>
      </p>
    </>
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
