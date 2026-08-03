// GuidePage.tsx -- the /guides/:slug route. Resolves the slug to an article
// from GuideArticles and renders it inside the Guide shell.

import { useParams, Link } from 'react-router-dom'
import Guide from './Guide.tsx'
import { getArticle, ARTICLES } from './GuideArticles.tsx'

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticle(slug) : null

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
