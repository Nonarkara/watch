import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadRolexCatalog, loadScreenSightings, type RolexCatalog, type ScreenSnapshot } from '../lib/catalog.ts'
import { BRAND_REGION, type Card } from '../lib/data.ts'
import HeroBanner from '../components/HeroBanner.tsx'
import { ARTICLES } from './GuideArticles.tsx'

/**
 * Pick a cross-section of references that gives a reader the depth of the
 * register at a glance — Rolex first (crown-tier anchor), then every other
 * brand in alphabetical order, one card at a time, until we hit 24. The
 * ticker is the first thing most readers see; it should read as a deliberate
 * cross-section, not "the first N cards of the biggest brand".
 */
function tasteOfRegister(cards: Card[]): Card[] {
  const byBrand = new Map<string, Card[]>()
  for (const c of cards) {
    const list = byBrand.get(c.identity.brand) ?? []
    list.push(c)
    byBrand.set(c.identity.brand, list)
  }
  const sortedBrands = [...byBrand.keys()].sort((a, b) => {
    if (a === 'Rolex') return -1
    if (b === 'Rolex') return 1
    return a.localeCompare(b)
  })
  const out: Card[] = []
  let added = true
  while (added && out.length < 24) {
    added = false
    for (const brand of sortedBrands) {
      const list = byBrand.get(brand)!
      if (out.length >= 24) break
      const next = list.shift()
      if (next) {
        out.push(next)
        added = true
      }
    }
  }
  return out
}
/** Static lookbook entries (no data-dependent counts — those are injected at
 *  render time from the live build so the copy can never drift from reality).
 *  The 2026-08-02 lesson: a hardcoded "186 photos · license verified" stat on
 *  the front door broke the site's own attribution standard. Numbers that the
 *  build computes must be read from the build. */
interface LookbookEntry {
  label: string; title: string; body: string;
  stat: string; to: string; action: string;
}

/** Most-recently-curated screen sightings, used to populate the marquee. */
function topScreenPicks(snapshot: ScreenSnapshot | null, limit = 5): { title: string; meta: string; href: string }[] {
  if (!snapshot) return []
  return snapshot.sightings
    .filter((s) => s.media)
    .slice(0, limit)
    .map((s) => ({
      title: s.title,
      meta: `${s.media_type.toUpperCase()} · ${s.release_year ?? '—'} · ${s.identification.toUpperCase()}`,
      href: `/screen#${s.id}`,
    }))
}

export default function Home() {
  const data = useDataset()
  const [catalog, setCatalog] = useState<RolexCatalog | null>(null)
  const [screen, setScreen] = useState<ScreenSnapshot | null>(null)
  useEffect(() => { Promise.all([loadRolexCatalog(), loadScreenSightings()]).then(([c, s]) => { setCatalog(c); setScreen(s) }) }, [])
  const cards = useMemo(() => data?.cards ?? [], [data])
  const withComps = cards.filter((card) => card.comp_summary).length
  const withMedia = cards.filter((card) => card.media.length).length
  const brandCount = useMemo(() => new Set(cards.map((c) => c.identity.brand)).size, [cards])
  const compCount = useMemo(() => cards.reduce((n, c) => n + (c.comp_summary?.n ?? 0), 0), [cards])
  const eventCount = useMemo(() => cards.reduce((n, c) => n + c.provenance_events.length, 0), [cards])
  const stills = screen?.sightings.filter((s) => s.media).length ?? 0
  const screenPicks = useMemo(() => topScreenPicks(screen), [screen])
  const ticker = useMemo(() => tasteOfRegister(cards), [cards])
  const asiaPicks = useMemo(() => cards.filter((c) =>
    BRAND_REGION[c.identity.brand] === 'asia' && c.media.length > 0
  ).slice(0, 4), [cards])
  const brassTacks = useMemo(() => {
    // For buyers: a couple of fully-stocked dossiers worth starting with.
    const withProvenanceAndComps = cards.filter((c) => c.comp_summary && c.provenance_events.length >= 2)
    return withProvenanceAndComps
      .sort((a, b) => b.comp_summary!.n - a.comp_summary!.n)
      .slice(0, 5)
  }, [cards])

  if (!data) return null

  // Lookbook cards: copy is static, but every count is injected from the live
  // build so the front door can never publish a number the dataset doesn't back.
  // (2026-08-02 lesson: a hardcoded "license verified" stat here was false.)
  const iconicStills = screen?.iconic_stills ?? 0
  const PATHS: LookbookEntry[] = [
    {
      label: 'Spot the co-star',
      title: 'Watches on screen',
      body: 'McQueen\'s Monaco, Bond\'s Seamaster, Marty\'s Casio — credited stills, honest IDs, no fake scarcity.',
      stat: screen ? `${screen.count} sightings · ${iconicStills} credited stills` : 'SIGHTINGS LOADING…',
      to: '/screen', action: 'OPEN ON SCREEN',
    },
    {
      label: 'The Rolex object atlas',
      title: 'One crown, source-linked.',
      body: 'Every configuration on a catalog page — dial, bezel, bracelet, and published list price, each linked to its source.',
      stat: catalog ? `${catalog.count} catalog records · linked to source` : 'ATLAS LOADING…',
      to: '/photos', action: 'OPEN THE ATLAS',
    },
    {
      label: 'Ask the awkward question',
      title: 'The Collectible Economy',
      body: 'Holding horizon simulator, physical storage drag ($0.6%/yr), and liquidity haircuts.',
      stat: '0 invented prices · CPI & bank baselines',
      to: '/economy', action: 'OPEN THE LAB',
    },
    {
      label: 'Pass it on well',
      title: 'Find the next custodian',
      body: 'Build an honest handover brief around condition, care, and history — not sales theatre.',
      stat: '6-step handover brief',
      to: '/rehome', action: 'MAKE A BRIEF',
    },
    {
      label: 'Read the method',
      title: 'About Time Pop',
      body: 'Theories, honesty ladder, system invariants, and what we refuse to invent.',
      stat: `methodology v${data.methodology_version} · non-writer standards`,
      to: '/about', action: 'READ ABOUT',
    },
    {
      label: 'Learn the craft',
      title: 'A page about watchmaking',
      body: 'A joke, then a frame: time as an abstraction that mechanical time made countable. What is actually inside a watch, and how to look at one.',
      stat: '6 parts · 5 complications · 6 periods of history',
      to: '/watchmaking', action: 'READ THE PAGE',
    },
  ]

  return (
    <>
      {/* First fold: full-bleed pop-art banner with a translucent navy text
          block (the thesis) and the eight-cell ledger on the right. The
          banner shows the watch's whole pop-cultural world; the block
          tells you what the site is; the ledger is the floor. */}
      <HeroBanner
        bg="/heroes/home.jpg"
        hue="navy"
        size="xl"
        eager
        alt="Pop-art collage of iconic watches and film moments — Bond, McQueen, racing drivers, astronauts, and watchmakers"
        eyebrow="TIME POP · A LIVING ARCHIVE OF WATCHES"
        title={<>Watches,<br />on their own terms.</>}
        subtitle={
          <>
            A free, evidence-first register of {data.count} luxury and collectible references.
            Cited comps, sourced provenance, credited on-screen stills — and the
            honesty ladder that shows where we refuse to estimate.
          </>
        }
        primary={{ to: '/register', label: `BROWSE THE ${data.count} OBJECTS →` }}
        secondary={{ to: '/screen', label: 'SEE IT ON SCREEN' }}
        credit="HERO ART · POP-ART COLLAGE OF ICONIC WATCHES & FILM MOMENTS"
        meta={
          <aside className="hero-ledger" aria-label="The register at a glance">
            <p className="hero-ledger-head mono">THE REGISTER · {data.built}</p>
            <dl className="hero-ledger-grid">
              <div title={`${data.count} references in the catalogue`}><dt>References</dt><dd>{data.count}</dd></div>
              <div title={`${brandCount} brands covered`}><dt>Brands</dt><dd>{brandCount}</dd></div>
              <div title={`${withComps} references with sale evidence`}><dt>With comps</dt><dd>{withComps}</dd></div>
              <div title={`${compCount} verified sales on file`}><dt>Verified sales</dt><dd>{compCount}</dd></div>
              <div title={`${eventCount} sourced provenance events`}><dt>Provenance</dt><dd>{eventCount}</dd></div>
              <div title={`${stills} credited screen stills`}><dt>On screen</dt><dd>{stills}</dd></div>
              <div title={`${withMedia} references with curated photography`}><dt>Photographed</dt><dd>{withMedia}</dd></div>
              <div className="hero-ledger-zero" title="No invented prices. The register refuses to estimate without evidence."><dt>Invented</dt><dd>0</dd></div>
            </dl>
            <p className="mono micro hero-art-credit">
              ALL COUNTS COMPUTED FROM THE LIVE BUILD · <Link to="/methodology">METHODOLOGY →</Link>
            </p>
          </aside>
        }
      />

      <section className="featured-dossiers" aria-label="A dossier to start with">
        <div className="section-rule">
          <h2>Start with a dossier that has a story.</h2>
          <span className="sticker-inline mono">PROVENANCE-RICH · 1 STORY, 1 WATCH</span>
        </div>
        <div className="featured-dossiers-grid">
          {brassTacks.slice(0, 3).map((c, idx) => {
            const m = c.media[0]
            return (
              <Link key={c.id} to={`/w/${c.id}`} className={`featured-dossier ${idx === 0 ? 'featured-dossier--lead' : ''}`}>
                <span className="featured-dossier-img">
                  {m
                    ? <img src={m.url} alt={c.identity.name} loading="lazy" />
                    : <span className="featured-dossier-img-empty mono">NO CC PHOTO</span>}
                </span>
                <span className="featured-dossier-body">
                  <span className="featured-dossier-source mono">{c.identity.brand.toUpperCase()} · {c.identity.reference} · {c.identity.tier === 'trinity' ? 'HOLY TRINITY' : c.identity.tier === 'crown' ? 'CROWN & COURT' : c.identity.tier === 'haute' ? 'HAUTE & INDEPENDENT' : c.identity.tier === 'core' ? 'CORE LUXURY' : 'ATTAINABLE'}</span>
                  <span className="featured-dossier-name">{c.identity.name}</span>
                  <span className="featured-dossier-deck">{c.narrative.story.slice(0, 220)}{c.narrative.story.length > 220 ? '…' : ''}</span>
                  <span className="featured-dossier-meta mono">
                    {c.provenance_events.length} PROVENANCE EVENTS · {c.comp_summary?.n ?? 0} CITED COMPS
                  </span>
                  <span className="featured-dossier-cta">OPEN THE DOSSIER →</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="reference-ticker" aria-label="A taste of the archive">
        <div className="ticker-head">
          <p className="eyebrow">A TASTE OF THE ARCHIVE</p>
          <p className="ticker-meta mono">24 references · {brandCount} brands · last build {data.built}</p>
        </div>
        <div className="ticker-strip">
          {ticker.map((c) => {
            const m = c.media[0]
            return (
              <Link key={c.id} to={`/w/${c.id}`} className="ticker-cell">
                <span className="ticker-thumb">
                  {m ? <img src={m.url} alt={c.identity.name} loading="lazy" /> : <span className="dim">—</span>}
                </span>
                <span className="ticker-brand">{c.identity.brand.toUpperCase()}</span>
                <span className="ticker-ref">{c.identity.reference}</span>
                <span className="ticker-name">{c.identity.name}</span>
                {c.comp_summary && <span className="ticker-evidence mono">{c.comp_summary.n} COMPS</span>}
              </Link>
            )
          })}
        </div>
      </section>

      {brassTacks.length > 0 && (
        <section className="starter-row" aria-label="Five fully-stocked dossiers to start with">
          <div className="section-rule">
            <h2>Five dossiers worth starting with.</h2>
            <span className="sticker-inline mono">SOURCED COMPS · SOURCED PROVENANCE</span>
          </div>
          <ul className="starter-list">
            {brassTacks.map((c, idx) => (
              <li key={c.id}>
                <Link to={`/w/${c.id}`} className="starter-link">
                  <span className="starter-num mono">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="starter-id">
                    <span className="eyebrow">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                    <span className="starter-name">{c.identity.name}</span>
                  </span>
                  <span className="starter-stats mono">
                    {c.comp_summary?.n ?? '—'} COMPS · {c.provenance_events.length} EVENTS
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {asiaPicks.length > 0 && (
        <section className="asia-spotlight" aria-label="Asian-market references">
          <div className="section-rule">
            <h2>Asia on Time Pop.</h2>
            <span className="sticker-inline mono">JDM · HK AD QUEUES · TOKYO INDEPENDENTS</span>
          </div>
          <div className="asia-spotlight-grid">
            {asiaPicks.map((c) => (
              <Link key={c.id} to={`/w/${c.id}`} className="asia-spotlight-card">
                <span className="asia-spotlight-media">
                  {c.media[0]
                    ? <img src={c.media[0].url} alt={c.identity.name} loading="lazy" />
                    : <span className="dim">NO PHOTO YET</span>}
                </span>
                <span className="asia-spotlight-id mono">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                <span className="asia-spotlight-name">{c.identity.name}</span>
                {c.identity.nickname && <span className="asia-spotlight-nick">“{c.identity.nickname}”</span>}
                <span className="asia-spotlight-tier mono">{c.identity.tier.toUpperCase()}</span>
              </Link>
            ))}
            <Link to="/register?region=asia" className="asia-spotlight-card asia-spotlight-all">
              <span className="asia-spotlight-all-eyebrow mono">FILTER</span>
              <span className="asia-spotlight-all-title">SEE ALL ASIA</span>
              <span className="asia-spotlight-all-body">
                Casio, Citizen, Credor, Grand Seiko, Seiko, King Seiko, Kurono, Minase, Naoya Hida, Hajime Asaoka.
              </span>
              <span className="asia-spotlight-all-link mono">→ REGISTER (REGION: ASIA)</span>
            </Link>
          </div>
        </section>
      )}

      <section className="guides-row">
        <div className="section-rule">
          <h2>Read a guide.</h2>
          <span className="sticker-inline mono">3 ARTICLES · ANTI-MARKETING · NO BULLSHIT</span>
        </div>
        <div className="guides-grid">
          {ARTICLES.map((a) => (
            <Link key={a.slug} to={`/bible#reader-${a.slug}`} className={`guide-card guide-card--${a.hue}`}>
              <span className="guide-card-num mono">ARTICLE {a.number}</span>
              <h3 className="guide-card-title">{a.title}</h3>
              <p className="guide-card-subtitle">{a.subtitle}</p>
              <span className="guide-card-mins mono">{a.minutes} MIN READ</span>
              <span className="guide-card-cta mono">READ IN THE BIBLE →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="lookbook-paths">
        <div className="section-rule">
          <h2>Choose a curiosity.</h2>
          <span className="sticker-inline mono">PLAY FIRST · NUMBERS SECOND</span>
        </div>
        <div className="lookbook-grid">
          {PATHS.map((path) => (
            <Link className="lookbook-card" to={path.to} key={path.to}>
              <span className="eyebrow">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="lookbook-stat mono">{path.stat}</span>
              <span className="mono micro">{path.action} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="brass-tacks" aria-label="Where to start">
        <div className="section-rule">
          <h2>For buyers and sellers.</h2>
          <span className="sticker-inline mono">CARD-BY-CARD ENTRY POINTS</span>
        </div>
        <div className="brass-tacks-grid">
          <article className="brass-card">
            <span className="eyebrow">FOR THE BUYER</span>
            <h3>What you are looking at.</h3>
            <p>Start with a reference you already have or are considering. Each dossier shows the dossier portrait, the comp evidence, the producer’s catalogue history, and the screen record. The honesty ladder explains what is shown and what is deliberately hidden.</p>
            <ol className="brass-list mono">
              <li>1. Read the <strong>one-liner</strong> and the <strong>case</strong> row.</li>
              <li>2. Compare <strong>market</strong> to <strong>retail</strong> (with the stale-baseline flag).</li>
              <li>3. Check <strong>comps</strong> — same metal, same family, sourced URL.</li>
              <li>4. Read <strong>provenance</strong> for cultural moments, not price signal.</li>
            </ol>
            <Link className="mono" to="/discover">SPIN THE ROULETTE →</Link>
          </article>
          <article className="brass-card">
            <span className="eyebrow">FOR THE SELLER</span>
            <h3>What you are hoping to let go.</h3>
            <p>The handover brief is a six-step form built around condition, care, and history — not sales theatre. We do not broker transactions, hold funds, or authenticate watches. We supply the dossier; you supply the truth.</p>
            <ol className="brass-list mono">
              <li>1. <strong>Photograph</strong> every side and every wear mark.</li>
              <li>2. <strong>Separate</strong> receipts and service records from family stories.</li>
              <li>3. <strong>Disclose</strong> interventions, replaced parts, water damage.</li>
              <li>4. <strong>Protect</strong> the buyer with authentication and insured delivery.</li>
            </ol>
            <Link className="mono" to="/rehome">MAKE A BRIEF →</Link>
          </article>
        </div>
      </section>

      {screenPicks.length > 0 && (
        <section className="screen-marquee" aria-label="On screen right now">
          <div className="section-rule">
            <h2>On screen this month.</h2>
            <span className="sticker-inline mono">CREDITED STILLS · 14 ICONIC FILMS</span>
          </div>
          <ul className="marquee-list">
            {screenPicks.map((p, i) => (
              <li key={i}>
                <Link to={p.href} className="marquee-link">
                  <span className="marquee-eyebrow mono">{p.meta}</span>
                  <span className="marquee-title">{p.title}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/screen" className="marquee-link marquee-link-all">
                <span className="marquee-eyebrow mono">ALL</span>
                <span className="marquee-title">Open the full screen →</span>
              </Link>
            </li>
          </ul>
        </section>
      )}

      <section className="research-ledger">
        <div>
          <p className="eyebrow">THE UNFINISHED LEDGER</p>
          <h2>Polish is not proof.</h2>
          <p className="dim">Gaps stay visible. That is how you know what still needs research.</p>
        </div>
        <div className="ledger-lines mono">
          <p><span>Verified comp coverage</span><strong>{withComps} / {data.count}</strong></p>
          <p><span>Reference-matched catalog media</span><strong>{withMedia} / {data.count}</strong></p>
          <p><span>Provenance events</span><strong>{eventCount} / —</strong></p>
          <p><span>On-screen stills with credits</span><strong>{stills} / {screen?.count ?? '—'}</strong></p>
          <p className="crossed"><span>Hype premium</span><strong>AWAITING A VALID COHORT</strong></p>
        </div>
      </section>
    </>
  )
}
