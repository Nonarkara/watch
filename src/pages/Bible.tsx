// src/pages/Bible.tsx — a curated, cite-checked bibliography of watch literature.
//
// What this page is:
//   - A 25+ book reading list, each entry linked to a public catalog (Open
//     Library, publisher, Wikipedia) so a reader can verify the book exists.
//   - A filterable, searchable view: by era, by subject, by brand.
//   - A cross-reference layer: each book lists the watch_ids in our
//     inventory that the book is known to discuss. Click a card → the
//     dossier shows a "Cited in" panel.
//
// What this page is NOT:
//   - A download list. Every book is published. No PDFs, no shadow libraries.
//   - A marketing channel. The summaries are our own writing from public
//     knowledge of the books. We do not crib jacket copy.
//   - Exhaustive. This is a curator's first shelf, not a librarian's last
//     catalog.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner'
import {
  BIBLE, BIBLE_STATS, ERA_LABEL, ERA_ORDER, SUBJECT_LABEL, SUBJECT_ORDER,
  filterBible, type BibleBook, type Era, type Subject,
} from '../lib/bible'

interface FilterState {
  era: Era | null
  subject: Subject | null
  brand: string | null
  q: string
}

const ALL_BRANDS = (() => {
  const set = new Set<string>()
  for (const b of BIBLE) for (const brand of b.brands) set.add(brand)
  return [...set].sort()
})()

function BookCard({ book }: { book: BibleBook }) {
  return (
    <article className="bible-card">
      <header className="bible-card-head">
        <div className="bible-card-cover" aria-hidden="true">
          {book.cover
            ? <img src={book.cover} alt="" loading="lazy" />
            : <div className="bible-card-cover-fallback">
                <span className="bible-card-fallback-title">{book.title}</span>
                <span className="bible-card-fallback-author mono">{book.authors.join(', ')}</span>
              </div>
          }
        </div>
        <div className="bible-card-meta">
          <h3 className="bible-card-title">{book.title}</h3>
          <p className="bible-card-author">{book.authors.join(', ')}</p>
          <p className="bible-card-publisher mono">
            {book.publisher.toUpperCase()} · {book.year}{book.pages ? ` · ${book.pages} PP` : ''}
            {book.isbn ? ` · ISBN ${book.isbn}` : ''}
          </p>
          <p className="bible-card-summary">{book.summary}</p>
        </div>
      </header>
      <footer className="bible-card-foot">
        <div className="bible-card-tags">
          {book.eras.map((era) => (
            <span key={era} className="chip chip-era">{ERA_LABEL[era]}</span>
          ))}
          {book.subjects.map((subj) => (
            <span key={subj} className="chip chip-subject">{SUBJECT_LABEL[subj]}</span>
          ))}
        </div>
        <div className="bible-card-footer-row">
          <div className="bible-card-cites">
            {book.watch_ids.length > 0
              ? <span className="bible-cites-n">{book.watch_ids.length} DOSSIER CITATIONS</span>
              : <span className="bible-cites-n bible-cites-none">NO DOSSIER CITATIONS YET</span>
            }
            <span className="bible-source">
              PUBLIC SOURCE: <a href={book.public_source.url} target="_blank" rel="noreferrer">{book.public_source.label} ↗</a>
            </span>
          </div>
          {book.watch_ids.length > 0 && (
            <details className="bible-card-dossier-list">
              <summary className="mono">VIEW CITED DOSSIERS →</summary>
              <ul className="bible-dossier-list">
                {book.watch_ids.map((id) => (
                  <li key={id}><Link to={`/w/${id}`} className="mono">{id}</Link></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </footer>
    </article>
  )
}

export default function Bible() {
  const [filter, setFilter] = useState<FilterState>({ era: null, subject: null, brand: null, q: '' })

  const filtered = useMemo(
    () => filterBible({ era: filter.era, subject: filter.subject, brand: filter.brand, q: filter.q }),
    [filter],
  )

  const update = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    setFilter((f) => ({ ...f, [k]: v }))

  return (
    <>
      <HeroBanner
        bg="/heroes/bible.jpg"
        hue="navy"
        size="lg"
        alt="A stack of watch books on a wooden desk — the curator's first shelf"
        eyebrow="THE BIBLE · CURATED READING LIST"
        title={<>The books<br />that built the field.</>}
        subtitle={
          <>
            {BIBLE_STATS.count} books · {BIBLE_STATS.brands} brands covered · {BIBLE_STATS.citations} cross-references
            into the register. Every entry is published, every summary is ours, every source is a public catalog
            you can click. We do not link to shadow libraries; the provenance of the bibliography is the same
            as the provenance of the register.
          </>
        }
        credit="CURATED BIBLIOGRAPHY · PUBLISHED BOOKS · OPEN LIBRARY + WIKIPEDIA + PUBLISHER SOURCES"
        meta={
          <aside className="bible-stats">
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.count}</span>
              <span className="bible-stats-label">BOOKS</span>
            </p>
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.brands}</span>
              <span className="bible-stats-label">BRANDS</span>
            </p>
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.citations}</span>
              <span className="bible-stats-label">CITATIONS</span>
            </p>
            <p className="bible-stats-row">
              <span className="bible-stats-num">{BIBLE_STATS.newest - BIBLE_STATS.oldest}</span>
              <span className="bible-stats-label">YEAR SPAN</span>
            </p>
          </aside>
        }
      />

      <section className="bible-filters" aria-label="Filter the bible">
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

      <section className="bible-meth">
        <h2 className="bible-meth-h2">WHY THIS LIST EXISTS</h2>
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
          they shaped the field, even if they do not name a specific reference in our 287 records.
        </p>
        <p className="bible-meth-foot mono">
          ALL BOOKS PUBLISHED · NO SHADOW LIBRARIES · NO SELF-PUBLISHED ZINES
        </p>
      </section>
    </>
  )
}
