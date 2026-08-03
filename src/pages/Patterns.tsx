import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { buildCohort, traitsOf, patternMatches } from '../lib/patterns.ts'
import { usd, pct, dash } from '../lib/format.ts'

const THRESHOLDS = [30, 60, 100]

export default function Patterns() {
  const data = useDataset()
  const [min, setMin] = useState(60)
  if (!data) return null

  const cohort = buildCohort(data.cards, min)
  const traits = traitsOf(cohort.cards)
  const matches = cohort.cards.length ? patternMatches(data.cards, cohort.cards, traits, min) : []
  const measured = cohort.mode === 'measured'

  return (
    <>
      <p className="eyebrow">Pattern Screen</p>
      <h1 className="pagetitle">What the outperformers share</h1>
      <p className="lede">
        Take the references the evidence marks as outperformers, describe what they have in common,
        then list the watches that share those traits while still selling near retail. This is a way
        of reading the register — a screen, not a tip sheet, and never a forecast.
      </p>

      <div className="chips" style={{ margin: 'var(--space-lg) 0' }} role="group" aria-label="Premium threshold">
        {THRESHOLDS.map((t) => (
          <button type="button" key={t} className={'chip' + (min === t ? ' on' : '')} onClick={() => setMin(t)}>
            +{t}% OVER RETAIL
          </button>
        ))}
      </div>

      <p className="honest">
        {measured ? (
          <>
            <strong>Measured cohort.</strong> These {traits.n} references have enough verified sales and a
            published retail price to compute a real premium of +{min}% or more. Premium is computable on{' '}
            {cohort.premiumEligible} of {data.count} references in this build.
          </>
        ) : (
          <>
            <strong>Evidence-marker cohort — not measured outperformance.</strong> Fewer than five references
            currently clear +{min}% with a computable premium ({cohort.premiumEligible} of {data.count} have
            enough verified sales and a published price at all), so the screen falls back to describing the
            references that carry the markers outperformers share: sales on record, constrained supply, and
            sourced provenance. Read the traits below as description of the evidence we hold, not as a
            measured return. More verified sales arrive with each data build.
          </>
        )}
      </p>

      <section className="sect">
        <h2 className="sect-h">
          <span>{measured ? 'The cohort' : 'The marker cohort'}</span>
          <span className="mono">{cohort.cards.length} REFERENCE{cohort.cards.length === 1 ? '' : 'S'}</span>
        </h2>
        {cohort.cards.map((c) => (
          <Link to={`/w/${c.id}`} className="ladder-row" key={c.id} style={{ borderBottom: 'var(--border)' }}>
            <span>
              <span className="l-brand">{c.identity.brand}</span>{' '}
              <span className="mono dim">{c.identity.reference}</span>
              {c.identity.nickname && <span className="l-nick"> “{c.identity.nickname}”</span>}
            </span>
            <span className="mono">
              {measured && c.computed.premium.value != null
                ? pct(c.computed.premium.value)
                : `${c.comp_summary?.n ?? 0} SALE${(c.comp_summary?.n ?? 0) === 1 ? '' : 'S'}`}
              <span className="micro dim"> · {c.computed.confidence.tier ?? dash}</span>
            </span>
          </Link>
        ))}
        {cohort.cards.length === 0 && <p className="boot mono">NO REFERENCE MEETS THE CRITERIA IN THIS BUILD.</p>}
      </section>

      {traits.n > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>What they have in common</span><span className="mono">N = {traits.n}</span></h2>
          <dl className="spec-grid">
            <div className="spec-row"><dt>Closed supply</dt><dd className="mono">{traits.discontinuedPct}% DISCONTINUED</dd></div>
            <div className="spec-row"><dt>Story on record</dt><dd className="mono">{traits.provenancePct}% HAVE SOURCED STORY</dd></div>
            <div className="spec-row"><dt>Fixed editions</dt><dd className="mono">{traits.limitedPct}% LIMITED</dd></div>
            <div className="spec-row"><dt>Waitlist evidence</dt><dd className="mono">{traits.waitlistPct}%</dd></div>
            <div className="spec-row"><dt>Median scarcity</dt><dd className="mono">{traits.medianScarcity} / 100</dd></div>
            <div className="spec-row"><dt>Tiers</dt><dd className="mono">{traits.tierMix.map(([t, k]) => `${t.toUpperCase()} ×${k}`).join(' · ')}</dd></div>
            <div className="spec-row"><dt>Brands</dt><dd className="mono">{traits.brands.map((b) => b.toUpperCase()).join(' · ')}</dd></div>
          </dl>
        </section>
      )}

      {matches.length > 0 && (
        <section className="sect">
          <h2 className="sect-h"><span>Sharing those traits, still near retail</span><span className="mono">TOP {matches.length} BY TRAITS SHARED</span></h2>
          <p className="micro dim" style={{ marginBottom: 'var(--space-md)' }}>
            Scored on the four traits a watch you can still buy is able to share — brand, tier,
            sourced provenance, constrained supply, sales on record. Being discontinued, the
            cohort’s defining trait, is unreachable for a current model and is not scored.
          </p>
          {matches.map(({ card: c, hits, score }) => (
            <Link to={`/w/${c.id}`} className="lrow" key={c.id}>
              <span className="l-model">
                <span className="l-brand">{c.identity.brand}</span>{' '}
                <span className="l-ref mono">{c.identity.reference}</span>
                {c.identity.nickname && <span className="l-nick"> “{c.identity.nickname}”</span>}
              </span>
              <span className="l-price">
                {c.retail.current_msrp_usd != null ? usd(c.retail.current_msrp_usd)
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
          Patterns describe the past. They do not predict returns, and sharing a trait with a past
          outperformer is a reason to open a dossier, not a reason to spend money. This screen carries
          every bias the working paper names: survivorship, since we only see watches that kept
          trading; venue coverage, since we track a handful of auction houses; and small samples. The
          register shows evidence and how much of it exists — it does not give investment advice.{' '}
          <Link className="src-a" to="/paper">The working paper sets out the limits in full →</Link>
        </p>
      </section>
    </>
  )
}
