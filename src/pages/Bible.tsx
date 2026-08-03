// src/pages/Bible.tsx — the central knowledge section of Time Pop.
//
// What this page is:
//   - A 25+ book reading list, each entry linked to a public catalog (Open
//     Library, publisher, Wikipedia) so a reader can verify the book exists.
//   - A "THE READER" sub-section with 3 anti-marketing articles folded in from
//     the old /guides section. Each is a collapsed card by default; expand to
//     read the full MITF article. No separate page navigation.
//   - A "WHY THIS LIST EXISTS" methodology footer.
//   - Sub-tab nav (BOOKS · READER · WHY) lets a reader jump between sections
//     without leaving the page.
//
// What this page is NOT:
//   - A download list. Every book is published. No PDFs, no shadow libraries.
//   - A marketing channel. The summaries are our own writing from public
//     knowledge of the books. We do not crib jacket copy.
//   - Exhaustive. This is a curator's first shelf, not a librarian's last
//     catalog.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner'
import {
  BIBLE, BIBLE_STATS, ERA_LABEL, ERA_ORDER, SUBJECT_LABEL, SUBJECT_ORDER,
  filterBible, type BibleBook, type Era, type Subject,
} from '../lib/bible'
import { ARTICLES } from './GuideArticles'

interface FilterState {
  era: Era | null
  subject: Subject | null
  brand: string | null
  q: string
}

type Tab = 'books' | 'reader' | 'why'

const ALL_BRANDS = (() => {
  const set = new Set<string>()
  for (const b of BIBLE) for (const brand of b.brands) set.add(brand)
  return [...set].sort()
})()

/** Compact book card. The cover (if available) is a 64x92 thumb on the left;
 *  on the right is the title, author, year, publisher, and a one-line summary.
 *  Books WITHOUT a cover skip the thumb entirely — no empty placeholder square.
 *  The full metadata (era + subject chips, ISBN, dossier citations, public
 *  source link) lives in a collapsible details block below — out of the way
 *  unless the reader wants it. */
function BookCard({ book }: { book: BibleBook }) {
  const hasCover = Boolean(book.cover)
  return (
    <article className={'bible-card' + (hasCover ? '' : ' bible-card--no-cover')}>
      <div className="bible-card-row">
        {hasCover && <img src={book.cover} alt="" loading="lazy" className="bible-card-cover" />}
        <div className="bible-card-meta">
          <h3 className="bible-card-title">{book.title}</h3>
          <p className="bible-card-author">{book.authors.join(', ')} <span className="dim mono">· {book.year} · {book.publisher}</span></p>
          <p className="bible-card-summary">{book.summary}</p>
        </div>
      </div>
      <details className="bible-card-expand">
        <summary className="mono">SHOW {book.watch_ids.length} CITATION{book.watch_ids.length === 1 ? '' : 'S'} &amp; DETAILS</summary>
        <div className="bible-card-details">
          <div className="bible-card-tags">
            {book.eras.map((era) => (
              <span key={era} className="chip chip-era">{ERA_LABEL[era]}</span>
            ))}
            {book.subjects.map((subj) => (
              <span key={subj} className="chip chip-subject">{SUBJECT_LABEL[subj]}</span>
            ))}
          </div>
          {book.pages && <p className="bible-card-line mono">{book.pages} PP</p>}
          {book.isbn && <p className="bible-card-line mono">ISBN {book.isbn}</p>}
          <p className="bible-card-line">
            PUBLIC SOURCE:{' '}
            <a href={book.public_source.url} target="_blank" rel="noreferrer">{book.public_source.label} ↗</a>
          </p>
          {book.watch_ids.length > 0 && (
            <div className="bible-card-cites">
              <p className="bible-cites-n mono">{book.watch_ids.length} CITED IN THE REGISTER:</p>
              <ul className="bible-dossier-list">
                {book.watch_ids.map((id) => (
                  <li key={id}><Link to={`/w/${id}`}>{id}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </article>
  )
}

/** Reader article — collapsed by default. The summary line gives the reader
 *  the thesis; expand to read the full MITF body. The pop-art hue (coral,
 *  yellow, navy) matches the article's editorial mood. */
function ReaderCard({ article, idx }: { article: typeof ARTICLES[number]; idx: number }) {
  return (
    <article id={`reader-${article.slug}`} className={`reader-card reader-card--${article.hue}`}>
      <details>
        <summary className="reader-card-head">
          <span className="reader-card-num mono">ARTICLE {article.number}</span>
          <h3 className="reader-card-title">{article.title}</h3>
          <p className="reader-card-subtitle">{article.subtitle}</p>
          <p className="reader-card-lede">{article.lede}</p>
          <p className="reader-card-cta mono">↓ EXPAND TO READ · {article.minutes} MIN</p>
        </summary>
        <div className="reader-card-body">
          {article.body}
        </div>
        <p className="reader-card-foot mono">
          END OF ARTICLE {article.number} · {article.minutes} MIN
          {idx < ARTICLES.length - 1 && (
            <> · <a href={`#reader-${ARTICLES[idx + 1].slug}`}>NEXT ARTICLE →</a></>
          )}
        </p>
      </details>
    </article>
  )
}

export default function Bible() {
  const [filter, setFilter] = useState<FilterState>({ era: null, subject: null, brand: null, q: '' })
  const [tab, setTab] = useState<Tab>('books')

  const filtered = useMemo(
    () => filterBible({ era: filter.era, subject: filter.subject, brand: filter.brand, q: filter.q }),
    [filter],
  )

  const update = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    setFilter((f) => ({ ...f, [k]: v }))

  // Honor a #reader hash on load (for /guides/:slug redirects)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#reader')) {
      setTab('reader')
      // wait for paint, then expand the matching article
      const slug = hash.replace('#reader-', '').replace('#reader', '')
      if (slug) {
        setTimeout(() => {
          const el = document.getElementById(`reader-${slug}`)
          if (el) (el as HTMLDetailsElement).open = true
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 80)
      } else {
        document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (hash === '#why') {
      setTab('why')
      document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return (
    <>
      <HeroBanner
        bg="/heroes/bible.jpg"
        hue="navy"
        size="lg"
        alt="A pop-art fantasy collage of watch portraits, astronauts, and explorers across eras of time"
        eyebrow="THE BIBLE · CURATED KNOWLEDGE"
        title={<>The library<br />of watch knowledge.</>}
        subtitle={
          <>
            {BIBLE_STATS.count} books · {BIBLE_STATS.brands} brands covered · {BIBLE_STATS.citations} cross-references
            into the register. Three anti-marketing essays. One open methodology. Every entry is published, every
            summary is ours, every source is a public catalog you can click. We do not link to shadow libraries.
          </>
        }
        credit="HERO ART · POP-ART FANTASY SERIES · ASTRONAUTS, DIVERS, AND EXPLORERS OF TIME"
        meta={
          <aside className="bible-stats">
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.count}</span>
              <span className="bible-stats-label">BOOKS</span>
            </p>
            <p className="bible-stats-row">
              <span className="bible-stats-num">3</span>
              <span className="bible-stats-label">ESSAYS</span>
            </p>
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.brands}</span>
              <span className="bible-stats-label">BRANDS</span>
            </p>
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.citations}</span>
              <span className="bible-stats-label">CITATIONS</span>
            </p>
          </aside>
        }
      />

      <nav className="bible-tabs" aria-label="Bible sections">
        <a href="#books" className={'bible-tab mono' + (tab === 'books' ? ' on' : '')} onClick={() => setTab('books')}>
          <span className="bible-tab-num">01</span> THE BOOKS · {BIBLE_STATS.count}
        </a>
        <a href="#reader" className={'bible-tab mono' + (tab === 'reader' ? ' on' : '')} onClick={() => setTab('reader')}>
          <span className="bible-tab-num">02</span> THE READER · 3 ESSAYS
        </a>
        <a href="#why" className={'bible-tab mono' + (tab === 'why' ? ' on' : '')} onClick={() => setTab('why')}>
          <span className="bible-tab-num">03</span> WHY · METHODOLOGY
        </a>
      </nav>

      <section id="books" className="bible-filters" aria-label="Filter the books">
        <div className="bible-filters-row">
          <label className="bible-filter-field">
            <span className="bible-filter-label mono">SEARCH</span>
            <input
              type="search"
              className="bible-input"
              placeholder="title, author, publisher, summary…"
              value={filter.q}
              onChange={(e) => update('q', e.target.value)}
            />
          </label>
          <label className="bible-filter-field">
            <span className="bible-filter-label mono">ERA</span>
            <select
              className="bible-input"
              value={filter.era ?? ''}
              onChange={(e) => update('era', (e.target.value || null) as Era | null)}
            >
              <option value="">Any era</option>
              {ERA_ORDER.map((era) => <option key={era} value={era}>{ERA_LABEL[era]}</option>)}
            </select>
          </label>
          <label className="bible-filter-field">
            <span className="bible-filter-label mono">SUBJECT</span>
            <select
              className="bible-input"
              value={filter.subject ?? ''}
              onChange={(e) => update('subject', (e.target.value || null) as Subject | null)}
            >
              <option value="">Any subject</option>
              {SUBJECT_ORDER.map((subj) => <option key={subj} value={subj}>{SUBJECT_LABEL[subj]}</option>)}
            </select>
          </label>
          <label className="bible-filter-field">
            <span className="bible-filter-label mono">BRAND</span>
            <select
              className="bible-input"
              value={filter.brand ?? ''}
              onChange={(e) => update('brand', e.target.value || null)}
            >
              <option value="">Any brand</option>
              {ALL_BRANDS.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </label>
        </div>
        <p className="bible-filter-count mono">
          SHOWING {filtered.length} OF {BIBLE.length} BOOKS
        </p>
      </section>

      <section className="bible-list" aria-label="Books">
        {filtered.length === 0
          ? <p className="bible-empty mono">NO MATCHES · LOOSEN A FILTER</p>
          : filtered.map((b) => <BookCard key={b.id} book={b} />)
        }
      </section>

      <section id="reader" className="bible-reader" aria-label="The reader">
        <div className="section-rule">
          <h2>The reader.</h2>
          <span className="sticker-inline mono">3 ANTI-MARKETING ESSAYS · COLLAPSED BY DEFAULT</span>
        </div>
        <p className="bible-reader-deck">
          Three short essays folded in from the old <span className="mono">/guides</span> section. Each is a
          different way of saying the same thing: <em>we do not have to buy expensive watches</em>. The
          expensive ones are expensive for a reason. There are good reasons and bad reasons. Buy for the good ones.
        </p>
        <div className="bible-reader-list">
          {ARTICLES.map((a, i) => <ReaderCard key={a.slug} article={a} idx={i} />)}
        </div>
      </section>

      <section id="why" className="bible-meth">
        <div className="section-rule">
          <h2>Why this list exists.</h2>
          <span className="sticker-inline mono">METHODOLOGY · CURATION STANDARD</span>
        </div>
        <p className="bible-meth-body">
          The register is a research artefact. Every claim is traceable; every price is sourced. The natural
          next layer is to point readers at the books that built the field. The bibliography is opinionated,
          not exhaustive. It is curated by a watch collector and author, not a librarian. Where I am confident
          in an ISBN, I include it. Where I am not, the public catalog URL is the canonical source — the reader
          can pull the ISBN from there. We do not invent ISBNs on a site whose argument is that numbers are
          checkable.
        </p>
        <p className="bible-meth-body">
          Cross-references into the register are conservative: a book is cited only if a specific watch in
          our inventory is known to be discussed in that book. The Hranek, Reardon, Foulkes, and FHH
          publications are the most-cited. Books with no cross-references are still on the shelf because
          they shaped the field, even if they do not name a specific reference in our 261 records.
        </p>
        <p className="bible-meth-foot mono">
          ALL BOOKS PUBLISHED · NO SHADOW LIBRARIES · NO SELF-PUBLISHED ZINES
        </p>
      </section>
    </>
  )
}
