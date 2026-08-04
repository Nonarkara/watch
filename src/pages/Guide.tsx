// Guide.tsx -- the three "killer articles" Time Pop publishes alongside the
// register. Anti-marketing, MITF voice, no fluff. Each article is a separate
// slug under /guides/:slug. The page hero is a pop-art color block that
// carries the article number, title, and reading time; the body is a single
// column of type with article-specific artifacts (tables, callouts, watch
// recommendations).
//
// The shared layout keeps the dossier top-4 metric pattern but applied to the
// whole archive: each recommendation in the article is scored on Rarity /
// Demand / Provenance / Resellability so the reader can compare on the same
// four axes the dossier uses.

import { Link } from 'react-router-dom'

export interface ArticleMeta {
  slug: string
  number: string                  // '01', '02', '03'
  title: string
  subtitle: string
  minutes: number                 // read time
  hue: 'coral' | 'yellow' | 'navy' | 'teal'  // pop-art block color
  lede: string                    // 2-3 line summary
  body: React.ReactNode            // article body (JSX)
}

// Three articles, each in the same shell. The shell enforces the visual system.
export default function Guide({ article }: { article: ArticleMeta }) {
  return (
    <div className="guide">
      <Link to="/" className="crumb">&larr; HOME</Link>

      <header className={`guide-hero guide-hero--${article.hue}`}>
        <div className="guide-hero-stripe" aria-hidden="true">
          <span>GUIDE</span>
          <span className="guide-hero-num">{article.number}</span>
          <span className="guide-hero-mins">{article.minutes} MIN READ</span>
        </div>
        <h1 className="guide-hero-title">{article.title}</h1>
        <p className="guide-hero-subtitle">{article.subtitle}</p>
        <p className="guide-hero-lede">{article.lede}</p>
      </header>

      <article className="guide-body prose">
        {article.body}
      </article>

      <nav className="guide-foot">
        <Link to="/" className="guide-foot-link">&larr; All guides and the register</Link>
        <p className="guide-foot-meta mono">
          Every recommendation in this guide is scored on the four axes the
          register uses for every dossier: Rarity, Demand, Provenance,
          Resellability. The scores are real, computed from cited comps and
          sourced provenance, not marketing.
        </p>
      </nav>
    </div>
  )
}

// ── shared building blocks for the article bodies ───────────────────────────

export function ArticleCallout({ kind, children }: { kind: 'good' | 'bad' | 'note'; children: React.ReactNode }) {
  return <aside className={`callout callout--${kind}`}>{children}</aside>
}

// A four-axis score chip -- same data as the dossier Top4Tiles, but compact.
// Used inline in article recommendation tables.
export function ScoreChip({ axis, tier }: { axis: 'rarity' | 'demand' | 'provenance' | 'resellability'; tier: 'STRONG' | 'NEUTRAL' | 'WEAK' | 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const cls = ['STRONG', 'HIGH'].includes(tier) ? 'strong' : ['WEAK', 'LOW'].includes(tier) ? 'weak' : 'neutral'
  return <span className={`score-chip score-chip--${cls} score-axis--${axis}`}>{axis[0].toUpperCase()} · {tier}</span>
}

// A recommendation row in a comparison table.
export interface Pick {
  name: string
  ref?: string
  brand: string
  priceUsd: number
  blurb: string
  rarity: 'STRONG' | 'NEUTRAL' | 'WEAK' | 'HIGH' | 'MEDIUM' | 'LOW'
  demand: 'STRONG' | 'NEUTRAL' | 'WEAK' | 'HIGH' | 'MEDIUM' | 'LOW'
  provenance: 'STRONG' | 'NEUTRAL' | 'WEAK' | 'HIGH' | 'MEDIUM' | 'LOW'
  resellability: 'STRONG' | 'NEUTRAL' | 'WEAK' | 'HIGH' | 'MEDIUM' | 'LOW'
  slug?: string
}

export function PickRow({ p }: { p: Pick }) {
  return (
    <tr className="pick-row">
      <td className="pick-id">
        <strong>{p.brand}</strong>
        {p.ref && <span className="mono dim"> {p.ref}</span>}
        <div className="pick-name">{p.name}</div>
      </td>
      <td className="pick-price mono">${p.priceUsd.toLocaleString()}</td>
      <td className="pick-blurb">{p.blurb}</td>
      <td className="pick-scores">
        <ScoreChip axis="rarity" tier={p.rarity} />
        <ScoreChip axis="demand" tier={p.demand} />
        <ScoreChip axis="provenance" tier={p.provenance} />
        <ScoreChip axis="resellability" tier={p.resellability} />
      </td>
      {p.slug && (
        <td className="pick-link">
          <Link to={`/w/${p.slug}`}>DOSSIER &rarr;</Link>
        </td>
      )}
    </tr>
  )
}
