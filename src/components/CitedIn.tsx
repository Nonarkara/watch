// src/components/CitedIn.tsx — a small panel that shows when a card is
// referenced in one of the books in src/lib/bible.ts. Mounted on the dossier
// page; renders nothing if the card has no cross-references.
import { Link } from 'react-router-dom'
import { booksCitingWatch } from '../lib/bible'

interface Props { watchId: string }

export default function CitedIn({ watchId }: Props) {
  const books = booksCitingWatch(watchId)
  if (books.length === 0) return null

  return (
    <section className="sect cited-in">
      <h2 className="sect-h">
        <span>Cited in the literature</span>
        <span className="mono">{books.length} {books.length === 1 ? 'BOOK' : 'BOOKS'}</span>
      </h2>
      <ul className="cited-in-list">
        {books.map((b) => (
          <li key={b.id} className="cited-in-item">
            <div className="cited-in-cover" aria-hidden="true">
              {b.cover
                ? <img src={b.cover} alt="" loading="lazy" />
                : <span className="cited-in-cover-fallback mono">{b.year}</span>
              }
            </div>
            <div className="cited-in-meta">
              <p className="cited-in-title">{b.title}</p>
              <p className="cited-in-author">{b.authors.join(', ')} · {b.publisher}, {b.year}</p>
              <p className="cited-in-summary">{b.summary}</p>
              <p className="cited-in-source">
                <a href={b.public_source.url} target="_blank" rel="noreferrer">{b.public_source.label} ↗</a>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="cited-in-foot mono">
        EACH CITATION IS A REAL PUBLISHED BOOK · NO SHADOW LIBRARIES ·
        <Link to="/bible"> THE FULL BIBLE →</Link>
      </p>
    </section>
  )
}
