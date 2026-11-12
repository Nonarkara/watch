// Spotlight — the "one watch" pattern. A single, full-bleed, hairline-framed
// feature: a watch photo on the left, the four-axes verdict in the middle,
// the story excerpt + CTAs on the right. Used on the home page, on /screen,
// on /bible — anywhere one watch deserves a moment instead of a row.
//
// The verdict color-codes Rarity (coral), Demand (yellow), Story (navy),
// Resellability (teal) so the buyer reads the whole thing in 5 seconds.
// The story block quotes the dossier, never invents.

import { Link } from 'react-router-dom'
import type { Card } from '../lib/data.ts'
import type { MarketTrendRow } from '../lib/catalog.ts'

type Strength = 'strong' | 'neutral' | 'weak' | 'unknown'

function classify(v: number | null, strong: number, weak: number): Strength {
  if (v == null) return 'weak'
  if (v >= strong) return 'strong'
  if (v >= weak) return 'neutral'
  return 'weak'
}

const STRENGTH_LABEL: Record<Strength, string> = {
  strong: 'STRONG',
  neutral: 'NEUTRAL',
  weak: 'WEAK',
  unknown: 'UNKNOWN',
}

interface SpotlightProps {
  card: Card
  /** Section heading — e.g. "FEATURED DOSSIER" or "WATCH OF THE WEEK". */
  eyebrow: string
  /** Short callout for the featured reason. */
  reason: string
  /** Optional public-attention observation and its snapshot date. */
  trend?: (MarketTrendRow & { snapshotDate: string }) | null
}

export default function Spotlight({ card, eyebrow, reason, trend }: SpotlightProps) {
  const c = card
  const m = c.media.find(image => image.match === 'exact_reference') ?? c.media[0]
  const related = m?.match === 'reference_family'
  const { scarcity, collectibility, resellability } = c.computed
  const provCount = c.provenance_events.length

  const rarity = classify(scarcity.value, 70, 40)
  const demand = classify(collectibility.value, 70, 40)
  const story: Strength = provCount >= 5 ? 'strong' : provCount >= 1 ? 'neutral' : 'weak'
  const resell: Strength =
    resellability.tier === 'High' ? 'strong' :
    resellability.tier === 'Medium' ? 'neutral' :
    resellability.tier === 'Low' ? 'neutral' : 'unknown'

  // 5-second verdict: one line per axis with strength symbol + value + caption.
  const verdict = [
    { k: 'RARITY', v: scarcity.value != null ? String(scarcity.value) : '—', cap: scarcity.tier ?? '—', s: rarity, hue: 'coral' },
    { k: 'DEMAND', v: collectibility.value != null ? String(collectibility.value) : '—', cap: `${collectibility.k_of[0]}/${collectibility.k_of[1]}`, s: demand, hue: 'yellow' },
    { k: 'STORY', v: String(provCount), cap: provCount > 0 ? 'EVENTS' : '—', s: story, hue: 'navy' },
    { k: 'RESELL', v: resellability.value != null ? String(resellability.value) : '—', cap: resellability.tier === 'Unknown' ? '—' : `${resellability.sales_per_year}/YR`, s: resell, hue: 'teal' },
  ] as const

  return (
    <section className="spotlight" aria-label={`Spotlight: ${c.identity.name}`}>
      <div className="spotlight-eyebrow">
        <span className="eyebrow">{eyebrow}</span>
        <span className="spotlight-reason mono">— {reason}</span>
      </div>

      <div className="spotlight-grid">
        <a className="spotlight-photo" href={m?.source_url ?? `/w/${c.id}`} target={m?.source_url ? '_blank' : undefined} rel={m?.source_url ? 'noreferrer' : undefined}>
          {m
            ? <img src={m.url} alt={related ? `Related watch, not reference ${c.identity.reference}` : c.identity.name} loading="lazy" decoding="async" width={640} height={380} />
            : <span className="dim">NO CC PHOTO</span>}
          {m && (
            <span className="spotlight-photo-cap mono">
              {related ? 'RELATED WATCH · NOT THIS REFERENCE' : 'EXACT REFERENCE'}
              {m.configuration_reference ? ` · ${m.configuration_reference}` : ''}
              {' · '}PHOTO {m.credit?.toUpperCase() ?? m.rights_status?.toUpperCase()}{m.license ? ` · ${m.license.toUpperCase()}` : ''}
            </span>
          )}
        </a>

        <div className="spotlight-body">
          <p className="spotlight-id mono">
            {c.identity.brand.toUpperCase()} · {c.identity.reference}
            {c.identity.produced?.start_year ? ` · ${c.identity.produced.start_year}${c.identity.produced.discontinued ? '–' + (c.identity.produced.end_year ?? 'now') : '–'}` : ''}
          </p>
          <h2 className="spotlight-name">{c.identity.name}</h2>
          {c.identity.nickname && <p className="spotlight-nick">"{c.identity.nickname}"</p>}
          <p className="spotlight-oneliner">{c.identity.one_liner}</p>

          {trend && (
            <p className="spotlight-trend mono" title="Public attention (Wikipedia pageviews; Google Trends when connected), not price">
              <span className="spotlight-trend-pulse" aria-hidden="true">●</span>
              <strong>ATTENTION RANK {trend.rank} · {trend.snapshotDate}</strong>
              <span className="dim"> · not price</span>
              {trend.wikipedia.dod_pct != null && (
                <span className="dim"> · wiki {trend.wikipedia.dod_pct > 0 ? '+' : ''}{trend.wikipedia.dod_pct}%</span>
              )}
            </p>
          )}

          <div className="spotlight-verdict" aria-label="Five-second verdict">
            <span className="spotlight-verdict-eyebrow mono">FIVE-SECOND VERDICT</span>
            <ol className="spotlight-verdict-list">
              {verdict.map((a) => (
                <li key={a.k} className={`spotlight-verdict-row spotlight-verdict-row--${a.s} spotlight-verdict-row--${a.hue}`}>
                  <span className="spotlight-verdict-key mono">{a.k}</span>
                  <span className="spotlight-verdict-val mono">{a.v}</span>
                  <span className="spotlight-verdict-cap mono">{a.cap}</span>
                  <span className="spotlight-verdict-state mono">{STRENGTH_LABEL[a.s]}</span>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
      <div className="spotlight-reading">
          <p className="spotlight-story">
            {c.narrative.story.length > 280
              ? c.narrative.story.slice(0, 280).replace(/\s+\S*$/, '') + '…'
              : c.narrative.story}
          </p>

          <div className="spotlight-ctas mono">
            <Link to={`/w/${c.id}`} className="spotlight-cta spotlight-cta--primary">OPEN THE DOSSIER →</Link>
            <Link to="/compare" className="spotlight-cta spotlight-cta--ghost">COMPARE WITH ANOTHER</Link>
          </div>
      </div>
    </section>
  )
}
