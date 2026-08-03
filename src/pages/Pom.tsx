// Pom.tsx -- Uncle Pom's Collection. A 14-watch ledger, each scored on
// the four axes (Rarity, Demand, Provenance, Resellability) the rest of
// the site uses. The page does not editorialize. It does not ask how
// the watches were paid for. It lists what is in the public record and
// shows the system's 4-axis scoring on each.
//
// Source: Voice TV, "Khut Nakhiru Prawit Reuan Thi 14" (CSI LA compilation),
// 1 January 2018. Prices are the article-stated baht values, not 2026
// equivalents. We do not adjust for inflation because the article is
// the source and the prices are part of the source.
//
// Section 1: bio paragraph (2 short paragraphs). Says who Prawit is
// without making a value claim about the watches.
// Section 2: aside with 4 stat cells (count, brands, strong axes, dossiers
// linked). Data-derived, never hardcoded.
// Section 3: the 14-watch ledger in article order. Each row shows
// brand+reference, the editorial note, and the 4-axis chips. Chips reuse
// the .score-chip CSS from the dossier Top4Tiles for consistency.

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

function AxisChip({ axis, value }: { axis: string; value: PomAxisTier }) {
  return (
    <span className={`score-axis score-axis--${axis.toLowerCase()}`}>
      {axis} <strong className={axisClass(value)}>{value}</strong>
    </span>
  )
}

function formatPrice(w: PomWatch): string {
  if (w.price_thb_range) return w.price_thb_range
  if (w.price_thb_at_publication == null) return '—'
  return `${(w.price_thb_at_publication / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M THB`
}

export default function Pom() {
  return (
    <div className="pom-page-wrapper">
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

      <div className="pom-page">
        <p className="crumb"><Link to="/">← HOME</Link></p>

        <section className="pom-bio">
          <div className="pom-bio-text">
            <h2>A well-respected figure in Thailand. The watches are public record.</h2>
            <p>
              {POM_BIO.full_name} is a Thai public figure: a former army officer, former
              Deputy Prime Minister of Thailand, and former Minister of Defence. The
              collection below is the {POM_AGGREGATE.count} watches attributed to him by the
              CSI LA Facebook page and reported by Voice TV on {POM_BIO.article_date}.
              It is public record. The system\'s job is to score what is public.
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
              <dd>{POM_AGGREGATE.high_tier_strong} of {POM_AGGREGATE.count} × 4 axes</dd>
              <dt>Dossiers linked</dt>
              <dd>{POM_AGGREGATE.has_dossier} in our register</dd>
            </dl>
          </aside>
        </section>

        <section className="pom-ledger" id="ledger">
          <div className="pom-ledger-head">
            <h2>The 14 watches.</h2>
            <span className="sticker-inline mono">SCORED ON RARITY · DEMAND · PROVENANCE · RESELLABILITY</span>
          </div>
          <ol className="pom-watch-list">
            {POM_COLLECTION.map((w) => (
              <li key={`${w.position}-${w.brand}-${w.reference}`} className="pom-watch">
                <div className="pom-watch-num">{String(w.position).padStart(2, '0')}</div>
                <div className="pom-watch-body">
                  <div>
                    <div className="pom-watch-id">
                      <span className="pom-watch-brand">{w.brand.toUpperCase()}</span>
                      <span className="pom-watch-ref">{w.reference}</span>
                      <span className="pom-watch-price mono">{formatPrice(w)} · at publication</span>
                    </div>
                    <h3 className="pom-watch-name">{w.watch}</h3>
                    <p style={{ fontFamily: 'var(--font-essay)', fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: '64ch' }}>{w.note}</p>
                  </div>
                  <div className="pom-watch-scores">
                    <AxisChip axis="rarity" value={w.rarity} />
                    <AxisChip axis="demand" value={w.demand} />
                    <AxisChip axis="provenance" value={w.provenance} />
                    <AxisChip axis="resellability" value={w.resellability} />
                  </div>
                  <div className="pom-watch-actions">
                    {w.dossierId ? (
                      <Link to={`/w/${w.dossierId}`}>DOSSIER →</Link>
                    ) : (
                      <Link to={`/register?brand=${encodeURIComponent(w.brand)}`}>SEE IN REGISTER →</Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mono micro" style={{ marginTop: 18, color: 'var(--dim)', maxWidth: '64ch' }}>
            SCORES DERIVED FROM THE 4-AXIS FRAMEWORK ON /GUIDES AND /METHODOLOGY.
            PRICES ARE THE ARTICLE-STATED BAHT VALUES, NOT 2026 EQUIVALENTS.
            ANY WRIST THIS WATCH IS ON CAN BE WORN; WE SCORE THE REFERENCE, NOT THE WRIST.
          </p>
        </section>
      </div>
    </div>
  )
}
