// Pom.tsx — Uncle Pom's Collection. 14 watches attributed to General
// Prawit Wongsuwan by Voice TV (CSI LA compilation, 2018-01-01). Each
// watch gets a card with: image, name, brand, ref, price, the 4-axis
// tier chips, an editorial note, and a collecting tip.
//
// A 4-axis bar chart at the top of the page shows the collection as a
// whole — how many watches score STRONG / NEUTRAL / WEAK on each axis.
// Below the chart, the 14 watch cards run in a 2-col grid (1-col on
// phones) so the page uses the width instead of leaving half of it
// blank.
//
// The page never asks how the watches were paid for. It scores what is
// public, the same way the rest of the site does.

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner.tsx'
import { POM_AGGREGATE, POM_BIO, POM_COLLECTION, type PomAxisTier, type PomWatch } from '../lib/pom.ts'

function axisClass(t: PomAxisTier): string {
  switch (t) {
    case 'STRONG': return 'score-chip score-chip--strong'
    case 'NEUTRAL': return 'score-chip score-chip--neutral'
    case 'WEAK': return 'score-chip score-chip--weak'
    default: return 'score-chip score-chip--weak'
  }
}

function formatPrice(w: PomWatch): string {
  if (w.price_thb_range) return w.price_thb_range
  if (w.price_thb_at_publication == null) return '—'
  return `${(w.price_thb_at_publication / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M THB`
}

function AxisChip({ axis, value }: { axis: string; value: PomAxisTier }) {
  return (
    <span className={`score-axis score-axis--${axis.toLowerCase()}`}>
      <span className="score-axis-label">{axis.toUpperCase()}</span>
      <span className={axisClass(value)}>{value}</span>
    </span>
  )
}

function DistributionChart() {
  // Count watches per (axis, tier).
  const axes: Array<{ key: 'rarity' | 'demand' | 'provenance' | 'resellability'; label: string; hue: string }> = [
    { key: 'rarity', label: 'RARITY', hue: 'var(--coral)' },
    { key: 'demand', label: 'DEMAND', hue: 'var(--yellow)' },
    { key: 'provenance', label: 'PROVENANCE', hue: 'var(--navy)' },
    { key: 'resellability', label: 'RESELLABILITY', hue: 'var(--teal)' },
  ]
  const tiers: PomAxisTier[] = ['STRONG', 'NEUTRAL', 'WEAK', 'UNKNOWN']

  return (
    <div className="pom-chart" role="img" aria-label="Distribution of the 14 watches across the four axes">
      <p className="pom-chart-title">
        <span>COLLECTION DISTRIBUTION</span>
        <span className="mono">14 WATCHES × 4 AXES = 56 DATA POINTS</span>
      </p>
      <div className="pom-chart-bars">
        {axes.map((axis) => {
          const counts: Record<PomAxisTier, number> = { STRONG: 0, NEUTRAL: 0, WEAK: 0, UNKNOWN: 0 }
          for (const w of POM_COLLECTION) {
            counts[w[axis.key]]++
          }
          return (
            <div className="pom-chart-bar" key={axis.key}>
              <p className="pom-chart-axis mono" style={{ color: axis.hue }}>{axis.label}</p>
              <div className="pom-chart-track">
                {tiers.map((t) => {
                  const n = counts[t]
                  if (n === 0) return null
                  const pct = (n / 14) * 100
                  const cls = t === 'STRONG' ? 'pom-bar-strong' : t === 'NEUTRAL' ? 'pom-bar-neutral' : t === 'WEAK' ? 'pom-bar-weak' : 'pom-bar-unknown'
                  return (
                    <div key={t} className={`pom-bar ${cls}`} style={{ width: `${pct}%` }} title={`${t}: ${n} watches`}>
                      <span className="pom-bar-n">{n}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="pom-chart-legend mono">
        <span><span className="pom-legend-swatch pom-bar-strong" /> STRONG</span>
        <span><span className="pom-legend-swatch pom-bar-neutral" /> NEUTRAL</span>
        <span><span className="pom-legend-swatch pom-bar-weak" /> WEAK</span>
      </div>
    </div>
  )
}

function WatchCard({ watch }: { watch: PomWatch }) {
  return (
    <article className="pom-card" id={`pom-${watch.position}`}>
      <div className="pom-card-image">
        <img src={watch.image} alt={`${watch.brand} ${watch.reference} — pop-art portrait`} loading="lazy" />
        <span className="pom-card-pos">{String(watch.position).padStart(2, '0')}</span>
      </div>
      <div className="pom-card-body">
        <p className="pom-card-meta mono">
          <span className="pom-card-brand">{watch.brand.toUpperCase()}</span>
          <span className="pom-card-ref">{watch.reference}</span>
        </p>
        <h3 className="pom-card-name">{watch.watch}</h3>
        <p className="pom-card-price mono">{formatPrice(watch)} · at publication</p>
        <p className="pom-card-note">{watch.note}</p>
        {watch.tip && (
          <p className="pom-card-tip">
            <span className="pom-tip-kicker">COLLECTING TIP</span>
            {watch.tip}
          </p>
        )}
        <div className="pom-card-axes">
          <AxisChip axis="rarity" value={watch.rarity} />
          <AxisChip axis="demand" value={watch.demand} />
          <AxisChip axis="provenance" value={watch.provenance} />
          <AxisChip axis="resellability" value={watch.resellability} />
        </div>
        <div className="pom-card-actions">
          {watch.dossierId
            ? <Link to={`/w/${watch.dossierId}`}>SEE THE DOSSIER →</Link>
            : <Link to={`/register?brand=${encodeURIComponent(watch.brand)}`}>SEE IN REGISTER →</Link>}
        </div>
      </div>
    </article>
  )
}

export default function Pom() {
  const strongCount = useMemo(
    () => POM_COLLECTION.filter((w) => w.rarity === 'STRONG' || w.demand === 'STRONG').length,
    [],
  )
  return (
    <div className="pom-page">
      <HeroBanner
        bg="/heroes/pom-1.jpg"
        hue="navy"
        size="lg"
        position="center 30%"
        alt="Pop-art illustration: a Thai general in white military uniform with a fleet of luxury watches behind him"
        eyebrow={`UNCLE POM\'S COLLECTION · ${POM_AGGREGATE.count} WATCHES FROM A ${POM_BIO.article_date.slice(0, 4)} VOICE TV CSI-LA COMPILATION`}
        title={<>Uncle Pom's Collection.</>}
        subtitle={
          <>
            {POM_AGGREGATE.count} watches attributed to {POM_BIO.full_name}, scored on the same four axes
            every other reference on this site is scored on. We do not ask how the watches were
            paid for. We score what is in the public record.
          </>
        }
        primary={{ to: '#ledger', label: `SEE THE ${POM_AGGREGATE.count} WATCHES` }}
        secondary={{ to: '/methodology', label: 'READ THE METHODOLOGY' }}
        credit="HERO ART · UNCLE POM PORTRAIT WITH WATCH COLLECTION"
      />

      <p className="crumb"><Link to="/">← HOME</Link></p>

      <section className="pom-bio">
        <div className="pom-bio-text">
          <h2>A well-respected figure in Thailand. The watches are public record.</h2>
          <p>
            {POM_BIO.full_name} is a Thai public figure: a former army officer, former
            Deputy Prime Minister of Thailand, and former Minister of Defence. The
            collection below is the {POM_AGGREGATE.count} watches attributed to him by the
            CSI LA Facebook page and reported by Voice TV on {POM_BIO.article_date}.
            It is public record. The system's job is to score what is public.
          </p>
          <p>
            The happiness that you can get is the one that is in your heart. Choosing
            the right watch that represents your character is more important than
            wearing an expensive watch that people think is not you. We extend that
            to the dossier as well: a watch is a feeling, not a trophy. Whatever
            these {POM_AGGREGATE.count} watches mean to their owner, the four axes below
            tell a reader what the watch on the wrist can do — and what it cannot.
          </p>
        </div>
        <aside className="pom-bio-aside" aria-label="The collection at a glance">
          <h3>The collection, at a glance</h3>
          <dl>
            <dt>Source</dt>
            <dd>
              <a href={POM_BIO.article_url} target="_blank" rel="noreferrer">Voice TV / CSI LA</a>
              {' · '}
              {POM_BIO.article_date}
            </dd>
            <dt>Watches</dt>
            <dd>{POM_AGGREGATE.count}</dd>
            <dt>Brands</dt>
            <dd>{POM_AGGREGATE.brands}</dd>
            <dt>Strong axes</dt>
            <dd>{strongCount} of {POM_AGGREGATE.count} watches score STRONG on Rarity or Demand</dd>
            <dt>Dossiers linked</dt>
            <dd>{POM_AGGREGATE.has_dossier} in our register</dd>
          </dl>
        </aside>
      </section>

      <DistributionChart />

      <section className="pom-ledger" id="ledger">
        <div className="pom-ledger-head">
          <h2>The 14 watches.</h2>
          <span className="sticker-inline mono">SCORED ON RARITY · DEMAND · PROVENANCE · RESELLABILITY</span>
        </div>
        <div className="pom-grid">
          {POM_COLLECTION.map((w) => <WatchCard key={`${w.position}-${w.brand}-${w.reference}`} watch={w} />)}
        </div>
        <p className="pom-meth-foot mono">
          SCORES DERIVED FROM THE 4-AXIS FRAMEWORK ON <Link to="/methodology">/METHODOLOGY</Link>.
          PRICES ARE THE ARTICLE-STATED BAHT VALUES, NOT 2026 EQUIVALENTS.
          ANY WRIST THIS WATCH IS ON CAN BE WORN; WE SCORE THE REFERENCE, NOT THE WRIST.
        </p>
      </section>
    </div>
  )
}
