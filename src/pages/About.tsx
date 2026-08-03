// About — the project's story, the four theories, the heuristics, and the watchmaking context
// Dr Non asked for. Sits between Methodology (the rulebook) and Paper (the academic version).
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import HeroBanner from '../components/HeroBanner.tsx'
import MarketChart from '../components/MarketChart.tsx'

// A compact sketch of the four theories, hand-drawn in SVG so it always renders.
function TheoriesDiagram() {
  return (
    <svg viewBox="0 0 720 280" className="diagram-svg" role="img" aria-label="The four theories in one diagram">
      {/* central node */}
      <rect x="300" y="120" width="120" height="40" fill="var(--bg)" stroke="var(--fg)" strokeWidth="1.5" />
      <text x="360" y="146" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--fg)">A WATCH'S PRICE</text>
      {/* spokes */}
      {[
        { x: 80, y: 60, label: 'SCARCITY', sub: 'how few' },
        { x: 640, y: 60, label: 'COLLECTIBILITY', sub: 'how wanted' },
        { x: 80, y: 220, label: 'PROVENANCE', sub: 'what story' },
        { x: 640, y: 220, label: 'ATTENTION', sub: 'who is watching' },
      ].map((n, i) => (
        <g key={i}>
          <line x1="360" y1="140" x2={n.x} y2={n.y} stroke="var(--line)" strokeWidth="1" />
          <rect x={n.x - 70} y={n.y - 22} width="140" height="44" fill="var(--bg)" stroke="var(--amber)" strokeWidth="1.5" />
          <text x={n.x} y={n.y - 4} fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--amber)" letterSpacing="1">{n.label}</text>
          <text x={n.x} y={n.y + 12} fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--dim)">{n.sub.toUpperCase()}</text>
        </g>
      ))}
      <text x="360" y="22" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--dim)" letterSpacing="2">
        THE FOUR THEORIES
      </text>
      <text x="360" y="272" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--dim)">
        The register computes each as a separate, citable signal. Never the same number.
      </text>
    </svg>
  )
}

// A scarcity signal sketch — five different "kinds" of scarcity, separately scored
function ScarcityDiagram() {
  const rows = [
    { label: 'PRODUCTION ENDED', weight: 25, sample: 'Patek 5711, Rolex 116500LN' },
    { label: 'EDITION STATED', weight: 25, sample: 'Patek 5711/1A-018 (170 pcs), 100-piece APs' },
    { label: 'BRAND CAPACITY', weight: 15, sample: 'Rolex ~1.1M/yr, F.P. Journe ~900/yr' },
    { label: 'AVAILABILITY', weight: 20, sample: 'listings observed in last 6 months' },
    { label: 'WAITLIST', weight: 15, sample: 'documented allocation claims' },
  ]
  return (
    <svg viewBox="0 0 600 220" className="diagram-svg" role="img" aria-label="Scarcity Index components">
      {rows.map((r, i) => {
        const y = 24 + i * 36
        const w = (r.weight / 25) * 240
        return (
          <g key={i}>
            <text x="0" y={y + 13} fontSize="10" fontFamily="var(--font-mono)" fill="var(--fg)" letterSpacing="1">{r.label}</text>
            <rect x="180" y={y} width="240" height="20" fill="var(--paper-2)" stroke="var(--line)" />
            <rect x="180" y={y} width={w} height="20" fill="var(--amber)" fillOpacity="0.85" />
            <text x="430" y={y + 13} fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)">+{r.weight} MAX</text>
            <text x="500" y={y + 13} fontSize="9" fontFamily="var(--font-mono)" fill="var(--dim)">{r.sample}</text>
          </g>
        )
      })}
      <line x1="0" y1="210" x2="600" y2="210" stroke="var(--rule)" />
      <text x="0" y="220" fontSize="9" fontFamily="var(--font-mono)" fill="var(--dim)">FIVE SIGNALS, RENORMALIZED OVER WHATEVER EXISTS · SCARCITY ≠ SCARCENESS OF A SINGLE VENDOR</text>
    </svg>
  )
}

// The price waterfall — what happens between the catalog and the secondary
function PriceWaterfallDiagram() {
  return (
    <svg viewBox="0 0 720 240" className="diagram-svg" role="img" aria-label="Where the secondary price actually comes from">
      {[
        { x: 0, label: 'BRAND MSRP', sub: 'the published list', tone: 'in' },
        { x: 150, label: 'SUPPLY', sub: 'allocation / waitlist', tone: 'in' },
        { x: 300, label: 'DEMAND', sub: 'brand heat + scene use', tone: 'in' },
        { x: 450, label: 'PROVENANCE', sub: 'event timeline', tone: 'in' },
        { x: 600, label: 'MARKET', sub: 'last hand-to-hand sale', tone: 'out' },
      ].map((step, i) => (
        <g key={i}>
          <rect x={step.x} y="40" width="120" height="60" fill={step.tone === 'in' ? 'var(--paper-2)' : 'var(--amber)'} stroke="var(--fg)" strokeWidth="1" />
          <text x={step.x + 60} y="68" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--fg)" letterSpacing="1">{step.label}</text>
          <text x={step.x + 60} y="84" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--dim)">{step.sub.toUpperCase()}</text>
          {i < 4 && (
            <g>
              <line x1={step.x + 120} y1="70" x2={step.x + 150} y2="70" stroke="var(--amber)" strokeWidth="2" markerEnd="url(#arrow)" />
            </g>
          )}
        </g>
      ))}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--amber)" />
        </marker>
      </defs>
      <text x="0" y="30" fontSize="9" fontFamily="var(--font-mono)" fill="var(--dim)" letterSpacing="2">SECONDARY PRICE WATERFALL · NOT A PIPELINE — EACH STEP IS A SEPARATE EVIDENCE TEST</text>
      <text x="0" y="150" fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)">The register asks: do we have cited evidence for each of these?</text>
      <text x="0" y="170" fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)">Where the answer is "no" — refusal. Where "yes" — a number with a source.</text>
      <text x="0" y="200" fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)">The same 43 comparable sales, read with this lens, are not a single</text>
      <text x="0" y="218" fontSize="10" fontFamily="var(--font-mono)" fill="var(--dim)">number — they are five separate claims about five separate things.</text>
    </svg>
  )
}

// The four honesty rungs — refusal as architecture
function HonestyLadderDiagram() {
  return (
    <svg viewBox="0 0 720 220" className="diagram-svg" role="img" aria-label="The honesty ladder">
      {[
        { y: 20, label: 'FULL EVIDENCE', sub: 'value, band, n, window, venues', tone: 'a' },
        { y: 60, label: 'THIN EVIDENCE', sub: 'small-sample median + named band', tone: 'b' },
        { y: 100, label: 'INSUFFICIENT', sub: '"—" + reason code', tone: 'c' },
        { y: 140, label: 'NO EVIDENCE', sub: 'card shows identity, no price', tone: 'd' },
      ].map((rung, i) => (
        <g key={i}>
          <rect x="0" y={rung.y} width="720" height="32" fill={rung.tone === 'a' ? 'var(--amber)' : 'var(--bg)'} stroke={rung.tone === 'a' ? 'var(--amber)' : 'var(--rule)'} strokeWidth="1" />
          <text x="14" y={rung.y + 20} fontSize="11" fontFamily="var(--font-mono)" fill={rung.tone === 'a' ? 'var(--bg)' : 'var(--fg)'} letterSpacing="2">{rung.label}</text>
          <text x="220" y={rung.y + 20} fontSize="10" fontFamily="var(--font-mono)" fill={rung.tone === 'a' ? 'var(--bg)' : 'var(--dim)'}>{rung.sub}</text>
        </g>
      ))}
      <text x="0" y="200" fontSize="9" fontFamily="var(--font-mono)" fill="var(--dim)" letterSpacing="2">ADD EVIDENCE → CLIMB THE LADDER · WITHHOLD EVIDENCE → STAY ON THE LOWER RUNG · THE CARD DISPLACES THE RUNG, NOT THE NUMBER</text>
    </svg>
  )
}

// A horology timeline with public-record events (1953-2026) and the most-frequently-cited
// provenance events in the register
function HorologyTimeline() {
  const events: { year: number; label: string; detail: string }[] = [
    { year: 1953, label: 'Rolex Submariner ref. 6204', detail: 'first purpose-built dive watch, water resistant to 100m' },
    { year: 1956, label: 'Rolex Day-Date "President"', detail: 'first wristwatch to display the day of the week in full' },
    { year: 1962, label: 'Wally Schirra wears CK2998', detail: 'first American in space with a Speedmaster on the wrist' },
    { year: 1969, label: 'Apollo 11 lands', detail: 'the Speedmaster becomes the only watch certified for EVA by NASA' },
    { year: 1972, label: 'Audemars Piguet Royal Oak 5402', detail: 'Gerald Genta draws the porthole; Genta invents the luxury steel sports watch' },
    { year: 1976, label: 'Patek Philippe Nautilus 3700/1A', detail: 'Genta draws the second porthole; "one of the world\'s most expensive steels"' },
    { year: 1992, label: 'Swatch Group acquires Breguet', detail: 'a wave of consolidation begins; the haute horlogerie tier gets a new owner' },
    { year: 2005, label: 'Rolex 16610LN era', detail: 'submariner production peaks just as the secondary market starts recording prices' },
    { year: 2017, label: 'Paul Newman Daytona sells $17.75M', detail: 'Phillips New York; the provenance premium gets its first data point' },
    { year: 2021, label: 'Patek 5711 discontinued', detail: 'the steel Nautilus goes out of production at peak demand' },
    { year: 2021, label: 'Phillips 5711/1A-018 sells $6.5M', detail: '170-piece farewell; the new ceiling for a single modern watch' },
    { year: 2022, label: 'Rolex launches Certified Pre-Owned', detail: 'the brand enters its own secondary market; trust becomes a product' },
    { year: 2025, label: 'Morgan Stanley report: 13 quarters of decline', detail: 'secondary market finds a floor' },
    { year: 2026, label: 'Recovery takes hold', detail: 'broad index +5–8% on the year; auction lots double; 70% of brands positive' },
  ]
  const startY = 1953
  const endY = 2026
  return (
    <div className="horology-timeline">
      <div className="htl-rail">
        <div className="htl-line" />
        {events.map((e, i) => {
          const pct = ((e.year - startY) / (endY - startY)) * 100
          const isLeft = i % 2 === 0
          return (
            <div key={i} className="htl-event" style={{ left: `${pct}%` }}>
              <div className={`htl-dot ${isLeft ? 'htl-dot-l' : 'htl-dot-r'}`} />
              <div className={`htl-card ${isLeft ? 'htl-card-l' : 'htl-card-r'}`}>
                <p className="htl-year mono">{e.year}</p>
                <p className="htl-label">{e.label}</p>
                <p className="htl-detail dim">{e.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const HISTORY_PIECES = [
  {
    title: 'A 1970s Speedmaster 145.022',
    sub: 'caliber 861, stepped dial, applied logo',
    body: 'The 145.022 is the Speedmaster most collectors picture when someone says "pre-Moon." It was the first 105-prefix derivative with the caliber 861 movement and a step-dial, running for 17 years. A honest 145.022 with original dial, hands, and bracelet is one of the few watches that lets a beginner see what a tool watch looked like before quartz, before ceramic, before the brand decided it was art.',
  },
  {
    title: 'A first-series Royal Oak 5402ST',
    sub: '"Jumbo", 1972–1976',
    body: 'Audemars Piguet sold 1,000 of the first steel 5402 in 1972. The first series had the AP monogram absent from the dial, and the words "Swiss" at 6 o\'clock instead of "Swiss Made." These details are how a vintage 5402 prices — at multiples of the modern 16202, often 4–6x. The watch in the photo is the 15202ST, the 2000–2022 keeper of the format; the 5402 is what it was keeping.',
  },
  {
    title: 'A Heuer Carrera 1153S',
    sub: 'automatic, 1969',
    body: 'Jack Heuer drew the Carrera in 1963 for racing drivers who needed to read a stopwatch at speed. The 1153S — "S" for silver dial, automatic, caliber 11 — is the watch that became the inspiration for the TAG Heuer Carrera Glassbox of 2023. Vintage Carreras are among the few mechanical objects where the design language is so legible across 60 years that you can hold one and instantly read the lineage.',
  },
  {
    title: 'A Universal Genève Polerouter',
    sub: 'microtor caliber 215, 1954',
    body: 'Genta again — a 24-year-old, this time drawing a dress watch for Universal Genève. The Polerouter introduced the microtor movement, an automatic winding solution that kept the case thin. It is the most-cited counter-example to the "you need a Patek" collecting thesis: a watch that costs a tenth of a Calatrava, made by the same designer, with a movement invention that the Swiss industry still uses.',
  },
]

export default function About() {
  const data = useDataset()
  const [brand, setBrand] = useState<'Rolex' | 'Patek Philippe' | 'All'>('Rolex')

  const totalEvents = useMemo(() => {
    if (!data) return 0
    return data.cards.reduce((sum, c) => sum + (c.provenance_events?.length ?? 0), 0)
  }, [data])

  if (!data) return null

  return (
    <div className="about-page">
      <HeroBanner
        bg="/heroes/art-mixed-bond.jpg"
        hue="navy"
        size="md"
        alt="Pop-art collage of collectors with watches — the curator and the register"
        eyebrow="ABOUT · TIME POP"
        title={<>A register that refuses to lie,<br />a system that refuses to guess.</>}
        subtitle={
          <>
            Time Pop is a free, evidence-first catalog of around 300 luxury and collectible
            watches. This page is the story of how it was built, what its theories are,
            and how to read it as a buyer, a seller, a curious observer, or a person
            whose hobby just produced a $30,000 question.
          </>
        }
        primary={{ to: '#theories', label: 'READ THE FOUR THEORIES ↓' }}
        secondary={{ to: '/methodology', label: 'FULL METHODOLOGY' }}
        credit="HERO ART · COLLECTORS + BRAND WATCHES — POP-ART COLLAGE"
        meta={
          <div className="pop-panel about-meta">
            <span className="bubble-kicker mono">THE FOUNDER</span>
            <strong>One watch on my wrist. 261 in the register.</strong>
            <span>The system refuses the same answer the founder would refuse if he were the buyer. That is the proof of the system.</span>
          </div>
        }
      />

      <Link to="/" className="crumb">← HOME</Link>

      <section className="about-statement" aria-label="Project at a glance">
        <div className="ast-row">
          <div className="ast-num">
            <span className="ast-figure">{data.count}</span>
            <span className="ast-cap mono">REFERENCE<br />DOSSIERS</span>
          </div>
          <div className="ast-num">
            <span className="ast-figure">{data.cards.filter((c) => c.comp_summary).length}</span>
            <span className="ast-cap mono">WITH SALE<br />EVIDENCE</span>
          </div>
          <div className="ast-num">
            <span className="ast-figure">{totalEvents}</span>
            <span className="ast-cap mono">PROVENANCE<br />EVENTS</span>
          </div>
          <div className="ast-num">
            <span className="ast-figure">7</span>
            <span className="ast-cap mono">PURE-FUNCTION<br />METRICS</span>
          </div>
        </div>
      </section>

      <section className="founder" id="founder" aria-label="From the founder">
        <div className="founder-grid">
          <div className="founder-photo-col">
            <img
              src="/about/founder-2005.jpg"
              alt="The founder, 30 July 2005, in front of Taywin mall in Bangkok. A TAG Heuer Aquaracer 300M is on the wrist."
              className="founder-photo"
              loading="lazy"
            />
            <p className="founder-photo-caption">
              BANGKOK · 30 JULY 2005 · THE DAY THE MIT ADMISSION LETTER ARRIVED
            </p>
            <div className="founder-meta">
              <span>WRIST</span>
              <Link to="/w/tagheuer-aquaracer-way111a" className="founder-watch">TAG HEUER AQUARACER 300M · WAY111A</Link>
            </div>
            <img
              src="/about/founder-watch-closeup.jpg"
              alt="Close-up of the TAG Heuer Aquaracer 300M dial — black sunray brushed with horizontal grooves, applied luminous indices, date at 3 o'clock with cyclops, polished steel bezel."
              className="founder-photo-closeup"
              loading="lazy"
            />
            <p className="founder-photo-caption founder-photo-caption--two">
              THE SAME WATCH · 20 YEARS ON · STILL RUNNING ON THE ORIGINAL QUARTZ
            </p>
            <aside className="founder-specs" aria-label="Watch specifications">
              <h3 className="founder-specs-h mono">SPEC SHEET</h3>
              <dl className="founder-specs-list">
                <div><dt>Reference</dt><dd>WAY111A</dd></div>
                <div><dt>Diameter</dt><dd>41 mm</dd></div>
                <div><dt>Case</dt><dd>stainless steel</dd></div>
                <div><dt>Bezel</dt><dd>unidirectional, 12-sided, polished steel dive bezel</dd></div>
                <div><dt>Crystal</dt><dd>sapphire, AR-coated</dd></div>
                <div><dt>Water resistance</dt><dd>300 m</dd></div>
                <div><dt>Movement</dt><dd>quartz, ETA-based</dd></div>
                <div><dt>Dial</dt><dd>black sunray, horizontal grooves, applied luminous indices</dd></div>
                <div><dt>Date</dt><dd>3 o'clock, cyclops magnifier</dd></div>
                <div><dt>Production</dt><dd>2005 – 2021</dd></div>
                <div><dt>Service history</dt><dd>battery ×2, gaskets, all done locally in Bangkok</dd></div>
              </dl>
              <Link to="/w/tagheuer-aquaracer-way111a" className="founder-specs-link mono">
                READ THE FULL DOSSIER →
              </Link>
            </aside>
          </div>
          <div className="founder-body">
            <p className="eyebrow">FROM THE FOUNDER · A 2005 ANCHOR</p>
            <h2>I am not a watch guy. I built this system because I am curious about why people are.</h2>
            <p>
              I have one watch. It is a <strong>TAG Heuer Aquaracer 300M, reference WAY111A</strong>,
              bought for me in Bangkok by my father in July 2005, on the day I received my MIT admission
              letter. My father was a technical engineer, the kind of man who taught his son to read a
              movement by holding it up to the light. He introduced me to a lot of mechanical things
              even though I never got into them the way he did. I still remember the first watches on my
              wrist: a Casio, an Alba, and then this one.
            </p>
            <p>
              I have fixed it three times — battery, gaskets, that's all. The quartz movement is
              twenty years old and still running. The 20-year battery life of a quartz watch is not an
              accident; it is the design.
            </p>
            <p>
              I am not a Rolex kind of guy. I travel a lot, and a lot of the time I have to be in places
              where I need to be very tough. Showing off an expensive watch is not that useful to me.
              I do not collect. I am not in this for the money. But I am interested.
            </p>
            <p className="founder-quote">
              It is really curious to me to understand the economy of collectible markets. A lot of
              people collect things, and many of them feel emotionally attached to the objects
              they collect. Some of them are just doing it for economic gain, but whatever it is,
              I am interested in the behavioral economics of this — and that is why the system
              was created.
            </p>
            <p>
              Time Pop is my attempt to write the <em>honest</em> version of a thing that usually gets
              written as marketing. The collectors' economy is the testing ground: prices, scarcity,
              attention, provenance — every claim is either evidence or it is not. The system
              refuses the second kind. That is what I would want if I were the buyer, so it is
              what the system does.
            </p>
            <p>
              The watch in the photo above is in the register. It is a single personal reference,
              the only one whose owner is the system's author. The dossier rates it
              <strong> attainable tier</strong>. The story is rated priceless; the register does
              not have a tier for that.
            </p>
            <a className="founder-link" href="https://axiom.nonarkara.org" target="_blank" rel="noreferrer">
              AXIOM.NONARKARA.ORG — CITY INTELLIGENCE SIBLING →
            </a>
          </div>
        </div>
      </section>

      <section className="sect" id="why">
        <div className="section-rule"><h2>Why this exists</h2><span className="sticker-inline">THE PROBLEM</span></div>
        <div className="why-split">
          <div className="prose">
            <p>
              The secondhand market for collectible watches ran a full boom-bust cycle between 2018 and
              2026. {data.count} reference cards later, the question every buyer actually asks —
              <em> "is this price real, and is this watch going to keep its value?" </em> — still has
              no honest public answer.
            </p>
            <p>
              Standard price guides fail the same way: they publish a number for every reference, even when
              they have no comps behind it. The number looks like evidence. It is an opinion. The Register
              is built on the opposite discipline: it refuses to publish a number unless at least three
              comparable sales, cited and dated, can support it. The visible refusals are load-bearing —
              they are what make the published numbers believable.
            </p>
            <p>
              You can browse the Register as a buyer, a seller, a collector, or a curious person at a dinner
              party. You should be able to read it without a finance background. You should never have to
              take a number on faith.
            </p>
          </div>
          <aside className="why-aside">
            <h3 className="why-aside-h">THE RULE IN ONE LINE</h3>
            <p className="why-rule">No cited comps, no estimate.</p>
            <p className="dim micro">
              Every estimate on the site traces to at least three comparable sales on cited dates
              with cited venues. When the data is thin, the site refuses to publish a number and
              says so. The visible refusals are load-bearing.
            </p>
            <div className="why-stat-row">
              <div>
                <p className="why-stat-num mono">{data.count}</p>
                <p className="why-stat-label mono">CARDS</p>
              </div>
              <div>
                <p className="why-stat-num mono">{data.cards.filter((c) => c.comp_summary).length}</p>
                <p className="why-stat-label mono">WITH COMPS</p>
              </div>
              <div>
                <p className="why-stat-num mono">{data.count - data.cards.filter((c) => c.comp_summary).length}</p>
                <p className="why-stat-label mono">REFUSED</p>
              </div>
            </div>
            <p className="dim micro">
              The right column is empty if a watch is on the site; the rule is the same for every
              reference. The middle number is the count of dossiers where the estimator is enabled
              — the right number is the count of dossiers where the system refused.
            </p>
          </aside>
        </div>
      </section>

      <section className="sect" id="market-history">
        <div className="section-rule"><h2>How collecting became a market</h2><span className="sticker-inline">A SHORT HISTORY</span></div>
        <div className="history-split">
          <div className="prose">
            <p>
              Wristwatches started as jewelry for women. Breguet built one for Caroline Murat,
              Napoleon's sister, around 1810–1812; for the next century men kept their watches in
              their pockets and considered the wrist version a novelty. The First World War ended
              that. Soldiers needed the time without letting go of anything, strapped watches to
              their wrists, and came home still wearing them.
            </p>
            <p>
              Quartz nearly closed the story. From 1969, cheap and more accurate Japanese quartz
              movements gutted the Swiss industry — the "quartz crisis" that erased two-thirds of its
              jobs. Mechanical watchmaking survived by changing what it was selling: not the time,
              but the craft. That reinvention is why a hand-finished movement means something today.
            </p>
            <p>
              Collecting itself has a birthday. In 1974 Osvaldo Patrizzi founded what became
              Antiquorum in Geneva and ran the first auctions built around wristwatches — thematic
              sales, serious catalogs, real scholarship. Until then collectors chased pocket watches;
              wristwatches were just used goods. By 2002 a Patek Philippe 1415 world timer brought
              CHF 6.6 million. In 2017 Paul Newman's own Daytona brought $17.75 million and the
              provenance premium became front-page news.
            </p>
            <p>
              Then came the platforms, and with them the cycle this register was built inside.
              Online marketplaces made prices visible; visible prices invited money; between 2018 and
              early 2022 top steel references roughly doubled, and the icons tripled. The peak
              coincided with the crypto wealth surge in March 2022, and what followed was thirteen
              straight quarters of decline. Rolex answered the trust problem directly, launching
              Certified Pre-Owned in December 2022 — an admission that the secondhand market had
              become too big to leave unverified. By 2026 the correction had run its course: the
              broad index is up 5–8% on the year, auction volumes have doubled, and more than 70%
              of tracked brands are positive again. The numbers live on the{' '}
              <Link className="src-a" to="/economy">Economy page</Link>, with their sources.
            </p>
            <p>
              The point of the history is a warning and an invitation at once. This market is
              younger than most of the watches in it — and its information infrastructure is younger
              still. That gap, between beautiful objects and thin public data, is exactly where Time
              Pop works.
            </p>
          </div>
          <aside className="history-timeline" aria-label="A short timeline of watch collecting">
            <h3 className="history-timeline-h">A TIMELINE</h3>
            <ol className="history-timeline-list">
              <li>
                <span className="history-year mono">1810</span>
                <div>
                  <p className="history-event">Breguet builds the first wristwatch for Caroline Murat.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">1914</span>
                <div>
                  <p className="history-event">World War I makes the wristwatch a soldier's tool.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">1969</span>
                <div>
                  <p className="history-event">Seiko Quartz Astron. The quartz crisis begins.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">1974</span>
                <div>
                  <p className="history-event">Osvaldo Patrizzi founds Antiquorum. Wristwatch collecting has an auction home.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">2002</span>
                <div>
                  <p className="history-event">Patek 1415 world timer brings CHF 6.6M. Provenance enters the seven-figure conversation.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">2017</span>
                <div>
                  <p className="history-event">Paul Newman's Daytona brings $17.75M. The provenance premium becomes front-page news.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">2022</span>
                <div>
                  <p className="history-event">Crypto-wealth peak, then thirteen straight quarters of decline. Rolex launches CPO.</p>
                </div>
              </li>
              <li>
                <span className="history-year mono">2026</span>
                <div>
                  <p className="history-event">Broad index up 5–8%. Auction volumes doubled. The correction has run its course.</p>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section className="sect" id="pop-culture">
        <div className="section-rule">
          <h2>Watches in popular culture</h2>
          <span className="sticker-inline">A SMALL SECTION</span>
        </div>
        <p className="prose" style={{ maxWidth: '68ch' }}>
          The history of the wristwatch is the history of people using it to tell a story
          about themselves. Long before the auction record became the metric, the
          popular image became the metric. Manga panel, anime opening, comic strip,
          album cover — a watch on a wrist is a sentence a character is saying
          about who they are. This is a small section. Five moments, five
          watches, and the comics that put them in the cultural conversation.
        </p>

        <div className="pop-culture-grid">
          <article className="pop-culture-card">
            <div className="pop-culture-img">
              <img src="/img/pop-culture/death-note-speedmaster.jpg"
                   alt="Pop-art manga panel: a Speedmaster with the words 'This watch is the Moonwatch' in a manga speech bubble" loading="lazy" />
            </div>
            <div className="pop-culture-meta">
              <p className="pop-culture-source mono">DEATH NOTE · 2003-2006 · TSUGUMI OHBA × TAKESHI OBATA</p>
              <h3 className="pop-culture-title">Omega Speedmaster, "the Moonwatch"</h3>
              <p className="pop-culture-body">
                Light Yagami wears an Omega Speedmaster Professional throughout Death
                Note, and the manga devotes a panel to naming it. The reference is
                small in the story (a watch, not a weapon), but it is the moment
                Japanese readers under 30 first heard "moonwatch" used in earnest. The
                Speedy sells in Tokyo on the strength of that page, not the catalogue
                copy. <em>Public knowledge:</em> the panel is on Chapter 7 of volume 1,
                with Light's monologue and the watch held at centre.
              </p>
            </div>
          </article>

          <article className="pop-culture-card">
            <div className="pop-culture-img">
              <img src="/img/pop-culture/lupin-iii-seiko-6139.jpg"
                   alt="Pop-art: Lupin III silhouette in tuxedo and top hat with a Seiko 6139 chronograph — Cagliostro" loading="lazy" />
            </div>
            <div className="pop-culture-meta">
              <p className="pop-culture-source mono">LUPIN THE THIRD: CASTLE OF CAGLIASTRO · 1979 · DIR. HAYAO MIYAZAKI</p>
              <h3 className="pop-culture-title">Seiko 6139-7002, the Lupin Chronograph</h3>
              <p className="pop-culture-body">
                Arsène Lupin III wears a Seiko 6139-7002 throughout Castle of
                Cagliostro, Miyazaki's first feature. The watch is yellow on a steel
                bracelet, with the crown on the left wrist so it doesn't catch the
                sleeve of a tuxedo. Seiko issued a 2018 limited edition commemorating
                the film, 39 years after the original release, in the same colour
                scheme. <em>Public knowledge:</em> the 6139-7002 is the first
                automatic chronograph Seiko ever made; the Lupin wearing it is the
                reason a generation of Japanese watch fans know what an automatic
                chrono is.
              </p>
            </div>
          </article>

          <article className="pop-culture-card">
            <div className="pop-culture-img">
              <img src="/img/pop-culture/city-hunter-seiko-6309.jpg"
                   alt="Pop-art: Ryo Saeba silhouette on a Hong Kong rooftop with a Seiko 6309 diver" loading="lazy" />
            </div>
            <div className="pop-culture-meta">
              <p className="pop-culture-source mono">CITY HUNTER · 1985-1991 · TSUKASA HOJO</p>
              <h3 className="pop-culture-title">Seiko 6309 Diver, the "Saeba Special"</h3>
              <p className="pop-culture-body">
                Ryo Saeba, the long-suffering "sweeper" of Shinjuku, wears a Seiko
                6309 on his left wrist and carries a Colt Python on his back. The
                6309 is the cheapest serious dive watch Seiko ever made, with the
                famous cushion case and 150m water resistance. The manga ran for
                seven years and 336 chapters; the watch appeared in almost every
                cover. The 6309 is the most-cited Japanese diver in collector
                conversations today, and the City Hunter association is the
                proximate cause.
              </p>
            </div>
          </article>

          <article className="pop-culture-card">
            <div className="pop-culture-img">
              <img src="/img/pop-culture/initial-d-synchronize.jpg"
                   alt="Pop-art: a large analog chronograph with a tarmac strip and the words 'Let's synchronize watches'" loading="lazy" />
            </div>
            <div className="pop-culture-meta">
              <p className="pop-culture-source mono">INITIAL D · 1995-2013 · SHIGENO SHUICHI</p>
              <h3 className="pop-culture-title">"Let's synchronize watches" — the togue ritual</h3>
              <p className="pop-culture-body">
                Initial D is about cars, not watches. But the manga and anime
                repeatedly stage the moment before a mountain pass run — a
                character reaches to the wrist, taps the crystal, and says
                "let's synchronize watches, 3... 2... 1." It is a ritual borrowed
                from motorsport timing, and it became a cult gesture in Japanese
                youth culture in the late 1990s. The watch on the wrist in those
                frames is usually a Seiko or Casio, but the reference is to the
                <em> gesture</em>: a watch as a piece of equipment, not a piece of
                jewellery. That framing is rare in comics.
              </p>
            </div>
          </article>

          <article className="pop-culture-card">
            <div className="pop-culture-img">
              <img src="/img/pop-culture/snoopy-speedmaster.jpg"
                   alt="Pop-art: Snoopy on his doghouse with an Omega Speedmaster, the Silver Snoopy Award" loading="lazy" />
            </div>
            <div className="pop-culture-meta">
              <p className="pop-culture-source mono">PEANUTS · 1969 · CHARLES M. SCHULZ · OMEGA × NASA, 1970-</p>
              <h3 className="pop-culture-title">Snoopy and the Speedmaster, since 1969</h3>
              <p className="pop-culture-body">
                The Peanuts comic strip published "Snoopy on the Moon" on the day
                of the Apollo 11 landing, 21 July 1969. NASA had been issuing the
                Silver Snoopy Award to flight crews since 1967; Omega picked up
                the visual in 1970 when it made a silver Snoopy pin for the
                Apollo 13 recovery. In 2003, 2015, 2018, and 2020, Omega issued a
                Snoopy Speedmaster limited edition. The Peanuts-Speedmaster tie
                is the longest-running licensed watch-collaboration in the field.
                <em>Public knowledge:</em> the comic strip ran for 50 years
                (1950-2000); Snoopy appeared in 17,897 strips.
              </p>
            </div>
          </article>
        </div>

        <p className="prose" style={{ maxWidth: '68ch', marginTop: 32 }}>
          The five panels above are a small selection. The wider list includes
          Maison Ikkoku (Rumiko Takahashi, 1980-1987) and the Citizen watch
          Godai keeps on his desk, Ah! My Goddess and Skuld's clockwork tools, the
          Cartiers in Cowboy Bebop, the timepiece obsession in Death Parade, and
          the 6139 in nearly every Lupin III special since 1971. Each is a
          chapter in the same book: a watch is a sentence a character is
          saying. The register keeps the receipts; the comics keep the
          cultural memory.
        </p>
      </section>

      <section className="sect" id="framework">
        <div className="section-rule"><h2>The collector's framework</h2><span className="sticker-inline">TEN FACTORS, TWO KINDS</span></div>
        <div className="prose">
          <p>
            Collector research keeps converging on the same ten factors: brand strength, rarity,
            condition, originality, documentation, provenance, cultural iconicity, complications,
            material, and timing. The register's honest contribution is to split them into two
            kinds — because only one kind can be scored from public data.
          </p>
        </div>
        <div className="fw-split">
          <div className="fw-col">
            <h3 className="mono">SCORED ON EVERY CARD</h3>
            <ul>
              <li><strong>Brand strength</strong> — tier context on each dossier, production volumes behind the Scarcity Index.</li>
              <li><strong>Rarity</strong> — the five-signal Scarcity Index, with its k-of-5 disclosure.</li>
              <li><strong>Provenance</strong> — dated, sourced event timelines; the premium made measurable.</li>
              <li><strong>Iconicity & liquidity</strong> — Collectibility, tracked sales per year, screen attention.</li>
              <li><strong>Timing</strong> — CPI-real price change, plus the industry indices on the Economy page.</li>
            </ul>
          </div>
          <div className="fw-col">
            <h3 className="mono">ONLY THE EXAMPLE CAN TELL YOU</h3>
            <ul>
              <li><strong>Condition</strong> — over-polishing or damage can cut value 30–50%. Invisible in public data.</li>
              <li><strong>Originality</strong> — swapped dials, hands, or bezels reprice the watch entirely.</li>
              <li><strong>Documentation</strong> — a full set typically adds 10–25%; archives extracts more for rare pieces.</li>
              <li><strong>Service history</strong> — who opened it, when, with what parts.</li>
            </ul>
            <p className="dim micro">
              The register scores references. The watch in front of you is an example — judge it
              with your eyes, a loupe, and a qualified watchmaker.
            </p>
          </div>
        </div>
      </section>

      <section className="sect" id="theories">
        <div className="section-rule"><h2>The four theories</h2><span className="sticker-inline">HOW TO READ A CARD</span></div>
        <TheoriesDiagram />
        <div className="prose" style={{ marginTop: 'var(--space-lg)' }}>
          <p>
            A watch's price is not one thing. It is the consequence of four different inputs that the
            register measures separately, scores separately, and never averages into a single "value." This
            is the central design choice of the project. If you remember nothing else, remember this:
          </p>
        </div>
      </section>

      <section className="sect theories-grid">
        <article className="theory-card">
          <span className="theory-num mono">01</span>
          <h3>Scarcity <span className="dim">— how few?</span></h3>
          <p>
            A watch is scarce when production ended, an edition was fixed, the brand makes few of them,
            few appear for sale, or the maker keeps a waitlist. The register scores all five signals,
            discloses how many it actually had, and never pretends the absent signal was zero.
          </p>
          <ScarcityDiagram />
          <p className="dim micro">K-of-5 renormalization. A card that scores 3 of 5 is renormalized over 60 points, not 100, and the card tells you which.</p>
        </article>

        <article className="theory-card">
          <span className="theory-num mono">02</span>
          <h3>Collectibility <span className="dim">— how wanted?</span></h3>
          <p>
            Scarcity alone does not make a collectible. A composite of premium over retail, scarcity,
            provenance depth, auction presence, and 5-year real price durability — same renormalization
            discipline. Designed to summarize the present footprint of past demand, not forecast future
            returns.
          </p>
          <p className="dim micro">Read this as description, not prescription. Two cards with different k values are not strictly comparable.</p>
        </article>

        <article className="theory-card">
          <span className="theory-num mono">03</span>
          <h3>Provenance <span className="dim">— what story?</span></h3>
          <p>
            Three documented events in the register show that provenance is a priced input with
            magnitude: a single watch (Paul Newman's Daytona, $17.75M in 2017), a single reference
            (Patek 5711, +49% in January 2021 alone after discontinuation), and a whole market (the
            2018–2022 boom and 13-quarter decline). The card carries a dated, sourced event
            timeline, and the timeline is part of the data.
          </p>
          <p className="dim micro">
            A reference's timeline lives in the working paper; a single card's events live on the
            dossier. Where the data is honest, the events are honest.
          </p>
        </article>

        <article className="theory-card">
          <span className="theory-num mono">04</span>
          <h3>Attention <span className="dim">— who is watching?</span></h3>
          <p>
            A screen appearance, a celebrity association, a documentary mention — these can move
            attention to a watch, but cannot change the number of physical examples. The register
            records 31 Rolex film/TV sightings (25 of them film/TV), splits exact-reference matches
            from family-level identifications, and caps the attention score at 100. It is a research
            signal, not a price.
          </p>
          <p className="dim micro">
            Price response to a screen event needs 3+ comps in the 12 months before and after. Until
            that cohort exists, the answer is "not computable."
          </p>
        </article>
      </section>

      <section className="sect" id="waterfall">
        <div className="section-rule"><h2>Where the price actually comes from</h2><span className="sticker-inline">PRICE WATERFALL</span></div>
        <PriceWaterfallDiagram />
      </section>

      <section className="sect" id="ladder">
        <div className="section-rule"><h2>Refusal as architecture</h2><span className="sticker-inline">THE HONESTY LADDER</span></div>
        <HonestyLadderDiagram />
        <div className="prose" style={{ marginTop: 'var(--space-lg)' }}>
          <p>
            Every metric on every card sits on one of these four rungs. Adding evidence moves a card
            up the ladder. Withholding evidence leaves it where it is. No one — including the
            system — can shortcut a card to the top.
          </p>
          <p>
            This is why a card with a refusal is not a failure. A card that says
            <em> "— , fewer than 3 verified sales in any 36-month window" </em>
            is more useful than a card that publishes a number built on nothing.
          </p>
        </div>
      </section>

      <section className="sect" id="what-to-buy">
        <div className="section-rule"><h2>The code for what to buy</h2><span className="sticker-inline">A BUYER'S CHEAT SHEET</span></div>
        <div className="prose">
          <p>
            You came here to read this part. The honest answer: the register does not tell you what to
            buy. It tells you what is known, what is not, and at what price. The heuristics below
            emerged from the data. They are not predictions. They are what a careful buyer would ask
            before spending real money.
          </p>
        </div>
        <ol className="buy-code">
          <li>
            <span className="code-num mono">01</span>
            <div>
              <h4>Start with the ladder, not the grail</h4>
              <p>Every dossier names a starter alternative that shares design DNA at a fraction of the price. The Tissot PRX carries the integrated-bracelet language of the Nautilus for $700 instead of $70,000. The Tudor Black Bay 58 carries the Submariner case for $4,000 instead of $14,000. You learn what you actually like before the money arrives.</p>
            </div>
          </li>
          <li>
            <span className="code-num mono">02</span>
            <div>
              <h4>Check the k-of-5 before the score</h4>
              <p>A Scarcity Index of 90 from 5 signals beats a Scarcity Index of 90 from 2 signals. The card tells you which one you're looking at. Read it. The headline number is the second thing; the components are the first.</p>
            </div>
          </li>
          <li>
            <span className="code-num mono">03</span>
            <div>
              <h4>Read the events, not the price</h4>
              <p>The 5711's price chart looks like a stock split. The 5711's event timeline — 2021 discontinuation, 2021 Tiffany farewell, 2022 peak, 2024 retracement — is what made the price chart. The data will keep you honest about the difference between an outlier and a trend.</p>
            </div>
          </li>
          <li>
            <span className="code-num mono">04</span>
            <div>
              <h4>Discount a refusal</h4>
              <p>A card with no estimate is a card whose market is too thin to quote. That is information. It means if you decide to buy, your pricing has to come from a venue, not from a model. The card tells you to be patient or be careful.</p>
            </div>
          </li>
          <li>
            <span className="code-num mono">05</span>
            <div>
              <h4>Trust the audit trail, not the headline</h4>
              <p>Every number is built from a deterministic script. The build is reproducible. If a published figure is wrong, it is wrong because the evidence underneath is wrong — and you can inspect the evidence. That is what the working paper means by "epistemic humility as market infrastructure."</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="sect" id="the-market">
        <div className="section-rule">
          <h2>What prices are doing right now</h2>
          <div className="market-toggle">
            {(['Rolex', 'Patek Philippe', 'All'] as const).map((b) => (
              <button key={b} type="button" className={'chip' + (brand === b ? ' on' : '')} onClick={() => setBrand(b)}>
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <MarketChart cards={data.cards} brand={brand} />
      </section>

      <section className="sect" id="horology">
        <div className="section-rule">
          <h2>What the watchmakers did, in order</h2>
          <span className="sticker-inline">HOROLOGY · 1953–2026</span>
        </div>
        <p className="prose dim" style={{ maxWidth: '64ch' }}>
          Twelve public-record events that explain what a 2026 collector is looking at. The order matters:
          each one is what made the next one possible. The 5402 (1972) made the Royal Oak a luxury
          category. The 3700/1A (1976) made Genta's second porthole a competitor. The 5711
          (2006–2021) inherited both. The 5711's death in 2021 is what made the 2022 peak possible, and
          the 2025 trough is what makes the next reference family think carefully.
        </p>
        <HorologyTimeline />
      </section>

      <section className="sect" id="history">
        <div className="section-rule">
          <h2>Four watches to put on a desk</h2>
          <span className="sticker-inline">THE READING LIST</span>
        </div>
        <div className="history-grid">
          {HISTORY_PIECES.map((piece, i) => (
            <article className="history-card" key={i}>
              <div className="history-frame">
                <img src={`/img/illustration-${['vintage-1960', '1972-royaloak', '1969-chrono', '1950-tank'][i]}.png`} alt={piece.title} loading="lazy" className="history-img" />
                <span className="frame-id mono">{['1962', '1972', '1969', '1954'][i]}</span>
              </div>
              <h3>{piece.title}</h3>
              <p className="mono dim micro">{piece.sub.toUpperCase()}</p>
              <p>{piece.body}</p>
            </article>
          ))}
        </div>
        <p className="prose dim" style={{ marginTop: 'var(--space-lg)' }}>
          These are real, cataloged watches whose full dossiers live in the Register. The line
          drawings above are hand-set museum-catalog illustrations made for this page —
          they show the form-language of each era, not a specific watch. Open any reference
          and you find its evidence; open the working paper and you find the literature
          behind the theory.
        </p>
      </section>

      <section className="sect" id="how">
        <div className="section-rule">
          <h2>How the project got put together</h2>
          <span className="sticker-inline">THE BUILD</span>
        </div>
        <div className="prose">
          <p>
            The Register was built in two passes. The first pass collected the raw evidence — every
            card was researched, sourced, and structured against a single schema by an AI agent
            reading the public record on the user's behalf. The second pass built the code that turns
            the raw evidence into published numbers, and the test that gates the build on invariants.
            Nothing in the computed layer is hand-entered. The build is deterministic. Run the same
            evidence twice and you get byte-identical output.
          </p>
          <p>
            What this means in practice: a card you disagree with is a card whose evidence you can
            inspect. A number you suspect is wrong is a number whose source you can click. The
            architecture's central bet is that a register that visibly refuses to guess earns more
            trust than a guide that always has an answer.
          </p>
          <p>
            The system was built lean. One laptop, no capex. The 80-record Rolex object atlas, the
            31-sighting screen register, the 43-sale price-evidence set, and the seven-metric
            engine were all built in days, not months. The constraint that forced quality was the
            evidence gate — every number has to trace to a cited public source, full stop. That
            constraint is what made the work readable.
          </p>
          <p>
            The full version of this story is the <Link className="src-a" to="/paper">working paper</Link>,
            a 6,000-word design-science study. The methodology, in the form of a code-gate, lives
            at <Link className="src-a" to="/methodology">/methodology</Link>. Every card shows its
            sources; the build script is auditable; the dataset is published.
          </p>
        </div>
        <div className="how-grid">
          <div className="how-block">
            <span className="how-num mono">01</span>
            <h4>Schema first</h4>
            <p>One JSON shape per card. Identity, retail, comps, provenance, scarcity inputs, narrative. The build is the contract.</p>
          </div>
          <div className="how-block">
            <span className="how-num mono">02</span>
            <h4>Two snapshots</h4>
            <p>FRED CPI and Morgan Stanley brand production. Both are committed to the repo, versioned, and dated. No silent updates.</p>
          </div>
          <div className="how-block">
            <span className="how-num mono">03</span>
            <h4>Seven pure functions</h4>
            <p>Estimate, premium, change, scarcity, collectibility, liquidity, confidence. Each is a pure function of card + snapshots. No globals, no Date.now(), no randomness.</p>
          </div>
          <div className="how-block">
            <span className="how-num mono">04</span>
            <h4>Masked publish</h4>
            <p>Full comp sets stay internal. The public gets aggregates plus up to five cited notable sales per reference. The card carries the evidence; the dataset does not.</p>
          </div>
          <div className="how-block">
            <span className="how-num mono">05</span>
            <h4>Refusal as product</h4>
            <p>The absence of a number is a number's reason. Cards say "—, fewer than 3 verified sales" rather than invent a guess. The visible gaps are the design.</p>
          </div>
          <div className="how-block">
            <span className="how-num mono">06</span>
            <h4>Open methodology</h4>
            <p>The build is reproducible. The validator is asserted-based. The paper is on the site. Anyone can audit, anyone can fork, anyone can challenge a card.</p>
          </div>
        </div>
      </section>

      <section className="sect" id="next">
        <div className="section-rule"><h2>What's next</h2><span className="sticker-inline">PHASE TWO</span></div>
        <div className="prose">
          <p>
            The second phase is the marketplace — a matchmaking layer that connects a registered
            reference to a verified transaction. The marketplace is a natural experiment: the
            decision-confidence claim of the working paper becomes measurable. The refusers become
            useful — they show whether honest uncertainty produces slower but more durable
            transactions. The Register was built so that the next phase's answer is legible either way.
          </p>
          <p>
            Until then, this site is a reading room. Bring it up at dinner. Cross-check what the
            salesperson told you. Open the working paper on a long flight. The first job of the
            register is to make you a slightly harder person to fool.
          </p>
          <p>
            <Link className="btn" to="/register">OPEN THE {data.count} DOSSIERS →</Link>
            {' '}
            <Link className="text-link mono" to="/starter">STARTER PATHS</Link>
            {' '}
            <Link className="text-link mono" to="/discover">WATCH ROULETTE</Link>
          </p>
        </div>
      </section>

      <section className="contact" id="contact" aria-label="Contact and sister projects">
        <div className="contact-grid">
          <div className="contact-card">
            <h3>Axiom — city intelligence for operators.</h3>
            <p>
              The sibling product. Axiom is built for city operators — district chiefs, public-health
              teams, transit agencies, election monitors — who need evidence-grade intelligence in
              a way their own analysts can audit. The methodology is the same: cited evidence,
              refusal as architecture, deterministic builds. The domains are different.
            </p>
            <p>
              <a href="https://axiom.nonarkara.org" target="_blank" rel="noreferrer">axiom.nonarkara.org →</a>
            </p>
          </div>
          <div className="contact-card">
            <h3>Time Pop — the watch register you are on.</h3>
            <p>
              The hobby version. Time Pop is what happens when the Axiom methodology meets a
              market full of beautiful objects and thin public data. The behavioural economics of
              collectors is the test case. The honest refusal is the proof of method.
            </p>
            <p>
              <a href="https://watch.nonarkara.org" target="_blank" rel="noreferrer">watch.nonarkara.org →</a>
              {' · '}
              <Link to="/methodology">methodology</Link>
              {' · '}
              <Link to="/paper">working paper</Link>
            </p>
          </div>
        </div>
        <p className="prose dim" style={{ maxWidth: '1240px', margin: '24px auto 0', padding: '0 28px' }}>
          Both sites are built lean, on one laptop, with the same constraint: every number is a pure
          function of cited public evidence. Same operating principle, different operating
          question. Same refusal discipline, different data. Same Dr Non system.
        </p>
      </section>
    </div>
  )
}
