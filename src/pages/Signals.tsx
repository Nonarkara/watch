import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../App.tsx'
import { cohortOf, traitsOf, patternMatches } from '../lib/signals.ts'
import { usd, pct, dash } from '../lib/format.ts'

const THRESHOLDS = [30, 60, 100]

export default function Signals() {
  const data = useDataset()
  const [min, setMin] = useState(60)
  if (!data) return null

  const cohort = cohortOf(data.cards, min)
  const traits = traitsOf(cohort)
  const matches = cohort.length ? patternMatches(data.cards, cohort, traits, min) : []
  const withPremium = data.cards.filter((c) => c.computed.premium.value != null).length

  return (
    <>
      <p className="eyebrow">Market Signals</p>
      <h1 className="pagetitle">What the outperformers share</h1>
      <p className="lede">
        Take every reference trading at least {min}% over its retail price, describe what those
        watches have in common, then list the references that share those traits while still selling
        near retail. This is a pattern screen — a way of reading the evidence, not a tip sheet.
      </p>

      <div className="chips" style={{ margin: 'var(--space-lg) 0' }} role="group" aria-label="Premium threshold">
        {THRESHOLDS.map((t) => (
          <button key={t} className={'chip' + (min === t ? ' on' : '')} onClick={() => setMin(t)}>
            +{t}% OVER RETAIL
          </button>
        ))}
      </div>

      {traits.n < 8 && (
        <p className="honest" style={{ marginBottom: 'var(--space-lg)' }}>
          Small cohort: only {traits.n} of the {withPremium} references with a computable premium clear
          the +{min}% bar in the current data build. Treat every pattern below as description of a small
          sample, not inference. More verified sales arrive with each data build.
        </p>
      )}

      <section className="sect">
        <h2 className="sect-h"><span>The cohort</span><span className="mono">{traits.n} REFERENCE{traits.n === 1 ? '' : 'S'} AT +{min}%+</span></h2>
        {cohort.map((c) => (
          <Link to={`/w/${c.id}`} className="ladder-row" key={c.id} style={{ borderBottom: 'var(--border)' }}>
            <span>
              <span className="l-brand">{c.identity.brand}</span>{' '}
              <span className="mono dim">{c.identity.reference}</span>
              {c.identity.nickname && <span className="l-nick"> “{c.identity.nickname}”</span>}
            </span>
            <span className="mono">{pct(c.computed.premium.value!)}<span className="micro dim"> · {c.computed.confidence.tier ?? dash}</span></span>
          </Link>
        ))}
        {cohort.length === 0 && <p className="boot mono">NO REFERENCE CLEARS +{min}% IN THIS BUILD.</p>}
      </section>

      {traits.n > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>What they have in common</span></h2>
          <dl className="spec-grid">
            <div className="spec-row"><dt>Closed supply</dt><dd className="mono">{traits.discontinuedPct}% DISCONTINUED</dd></div>
            <div className="spec-row"><dt>Story on record</dt><dd className="mono">{traits.provenancePct}% HAVE SOURCED PROVENANCE EVENTS</dd></div>
            <div className="spec-row"><dt>Limited editions</dt><dd className="mono">{traits.limitedPct}%</dd></div>
            <div className="spec-row"><dt>Median scarcity</dt><dd className="mono">{traits.medianScarcity} / 100</dd></div>
            <div className="spec-row"><dt>Tiers</dt><dd className="mono">{traits.tierMix.map(([t, k]) => `${t.toUpperCase()} ×${k}`).join(' · ')}</dd></div>
            <div className="spec-row"><dt>Brands</dt><dd className="mono">{traits.brands.map((b) => b.toUpperCase()).join(' · ')}</dd></div>
          </dl>
        </section>
      )}

      {matches.length > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>Sharing those traits, still near retail</span><span className="mono">{matches.length} PATTERN MATCHES</span></h2>
          {matches.map(({ card: c, hits, score }) => (
            <Link to={`/w/${c.id}`} className="lrow" key={c.id}>
              <span className="l-model">
                <span className="l-brand">{c.identity.brand}</span>{' '}
                <span className="l-ref mono">{c.identity.reference}</span>
                {c.identity.nickname && <span className="l-nick"> “{c.identity.nickname}”</span>}
              </span>
              <span className="l-price">
                {c.retail.current_msrp_usd != null ? `${usd(c.retail.current_msrp_usd)} RETAIL`
                  : c.computed.premium.value != null ? pct(c.computed.premium.value) : dash}
              </span>
              <span className="l-sub">
                <span className="mono">{score}/5 TRAITS</span>
                {hits.filter((h) => h.hit).map((h) => <span key={h.key}>{h.label}</span>)}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section className="sect prose">
        <h2 className="sect-h"><span>Read this before acting on any of it</span></h2>
        <p>
          Patterns describe the past; they do not predict returns. This screen carries every bias the
          working paper names: survivorship (we only see the watches that kept trading), venue
          coverage (a handful of auction houses), and small samples. A trait shared with past
          outperformers is a reason to read a dossier, not a reason to spend money. The register does
          not give investment advice — it shows evidence and how much of it exists.{' '}
          <Link className="src-a" to="/paper">The working paper covers the limits in full →</Link>
        </p>
      </section>
    </>
  )
}
