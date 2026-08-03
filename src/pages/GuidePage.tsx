// GuidePage.tsx -- the /guides and /guides/:slug routes.
//
// /guides          -> index of all 3 articles
// /guides/:slug    -> single article rendered inside the Guide shell
//
// We read the location directly so a bare /guides hits the index and
// only a real slug falls into the article resolver.

import { Link, useLocation } from 'react-router-dom'
import Guide from './Guide.tsx'
import { getArticle, ARTICLES } from './GuideArticles.tsx'

function slugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/guides\/([a-z0-9-]+)\/?$/i)
  return m ? m[1] : null
}

export default function GuidePage() {
  const { pathname } = useLocation()
  const slug = slugFromPath(pathname)
  const article = slug ? getArticle(slug) : null

  // No slug at all -> /guides index page.
  if (!slug) {
    return (
      <div className="guide">
        <Link to="/" className="crumb">&larr; HOME</Link>
        <h1 className="pagetitle">Read a guide.</h1>
        <p className="lede">
          Anti-marketing. We do not need you to spend money. We do need
          you to spend the time it takes to know what you actually want
          before someone hands you a catalogue and asks you to choose.
        </p>
        <ol className="guide-index">
          {ARTICLES.map((a, i) => (
            <li key={a.slug} className={`guide-index__item guide-index__item--${a.hue}`}>
              <Link to={`/guides/${a.slug}`} className="guide-index__link">
                <span className="guide-index__num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="guide-index__body">
                  <span className="guide-index__eyebrow mono">GUIDE {String(i + 1).padStart(2, '0')}</span>
                  <span className="guide-index__title">{a.title}</span>
                  <span className="guide-index__deck">{a.subtitle}</span>
                  <span className="guide-index__meta mono">{a.minutes} MIN READ</span>
                </span>
                <span className="guide-index__cta">&rarr; READ</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="footnote">
          Every recommendation in this guide is scored on the four axes
          the register uses for every dossier: Rarity, Demand,
          Provenance, Resellability. The scores are real, computed from
          cited comps and sourced provenance, not marketing.
        </p>
      </div>
    )
  }

  // Slug but no article -> 404.
  if (!article) {
    return (
      <div className="guide">
        <Link to="/" className="crumb">&larr; HOME</Link>
        <h1 className="pagetitle">Guide not found</h1>
        <p className="lede">No guide at this slug.</p>
        <p>
          {ARTICLES.map((a) => (
            <span key={a.slug}>
              <Link to={`/guides/${a.slug}`}>{a.title}</Link>{' · '}
            </span>
          ))}
        </p>
      </div>
    )
  }

  return <Guide article={article} />
}
