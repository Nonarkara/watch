import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import MarketChart from '../components/MarketChart.tsx'
import IndexRangeChart from '../components/IndexRangeChart.tsx'
import HeroBanner from '../components/HeroBanner.tsx'

export default function Economy() {
  const data = useDataset()
  const [scarcity, setScarcity] = useState(60)
  const [sightings, setSightings] = useState(2)
  const attention = Math.min(100, sightings * 20)
  const pressure = Math.round(Math.sqrt(scarcity * attention))
  const exposed = useMemo(() => [...(data?.cards ?? [])].filter((card) => card.computed.attention.value != null).sort((a, b) => (b.computed.attention.pressure ?? 0) - (a.computed.attention.pressure ?? 0)), [data])

  return (
    <div className="economy-page">
      <HeroBanner
        bg="/heroes/art-modern.jpg"
        hue="navy"
        size="lg"
        alt="Pop-art collage of contemporary collectors and brand watches — the attention × fixed supply lab"
        eyebrow="ATTENTION × FIXED SUPPLY LAB"
        title={<>A spotlight is<br />not a mint.</>}
        subtitle={
          <>
            A screen appearance may increase attention to a watch. It does not reduce supply.
            This lab keeps those two ideas separate, then shows where demand pressure could
            deserve closer study.
          </>
        }
        primary={{ to: '#the-numbers', label: 'SEE THE NUMBERS' }}
        secondary={{ to: '/methodology', label: 'READ THE METHODOLOGY' }}
        credit="HERO ART · COLLECTORS + BRAND WATCHES — POP-ART COLLAGE"
        meta={
          <div className="pop-panel economy-meta">
            <span className="bubble-kicker mono">NO FORECASTS</span>
            <strong>NO FAKE RETURNS</strong>
            <span>The lab is a measurement instrument, not a tip sheet. The indices are computed from cited comps; the facts cite the source by name and link.</span>
          </div>
        }
      />

      <Link to="/" className="crumb">← HOME</Link>

      <section className="sect" id="the-numbers">
        <div className="section-rule">
          <h2>The market in numbers</h2>
          <span className="mono micro dim">{data?.market_context ? `COMPILED ${data.market_context.compiled} · AS OF ${data.market_context.as_of.toUpperCase()}` : ''}</span>
        </div>
        {data?.market_context && (
          <>
            <IndexRangeChart indices={data.market_context.indices} />
            <div className="fact-grid">
              {data.market_context.facts.map((f) => (
                <div className="fact-cell" key={f.id}>
                  <span className="lab mono">{f.label.toUpperCase()}</span>
                  <span className="val mono">{f.value}</span>
                  <span className="note dim">{f.detail}</span>
                  <span className="src mono dim">{f.sources.map((s, i) => s.url
                    ? <a key={i} className="src-a" href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
                    : <span key={i}>{s.name}</span>)}</span>
                </div>
              ))}
            </div>
            <p className="honest" style={{ marginTop: 'var(--space-md)' }}>
              {data.market_context.limitation}
            </p>
          </>
        )}
      </section>

      <section className="sect">
        <div className="section-rule">
          <h2>What our own evidence shows, by quarter</h2>
          <span className="mono micro dim">MEDIAN PRICE OF VERIFIED SALES</span>
        </div>
        <MarketChart cards={data?.cards ?? []} brand="Rolex" height={300} />
        <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
          Open the About page to see the same chart across brands and the public market events that explain the lines.{' '}
          <Link className="src-a" to="/about#the-market">All brands and the event overlay →</Link>
        </p>
      </section>

      <section className="pressure-lab">
        <div className="lab-controls">
          <label><span>Scarcity proxy</span><strong>{scarcity}/100</strong><input type="range" min="0" max="100" value={scarcity} onChange={(e) => setScarcity(Number(e.target.value))} /></label>
          <label><span>Exact film / TV sightings</span><strong>{sightings}</strong><input type="range" min="0" max="5" value={sightings} onChange={(e) => setSightings(Number(e.target.value))} /></label>
          <p className="micro dim">Attention = 20 points per documented exact-reference sighting, capped at 100. This is a transparent research heuristic—not audience reach.</p>
        </div>
        <div className="pressure-result">
          <div className="orbit"><span>{pressure}</span><small>PRESSURE</small></div>
          <p><strong>{attention}/100 attention</strong> meets <strong>{scarcity}/100 scarcity</strong>.</p>
          <code>round(√({scarcity} × {attention})) = {pressure}</code>
          <p className="micro">A prioritisation signal for research. Not a price target.</p>
        </div>
      </section>

      <section className="sect">
        <div className="section-rule"><h2>Rolex references under the light.</h2><span className="mono micro dim">EXACT MAPS ONLY</span></div>
        <div className="attention-list">
          {exposed.map((card) => <Link to={`/w/${card.id}`} key={card.id}><span><strong>{card.identity.name}</strong><small className="mono">{card.identity.reference} · {card.computed.attention.screen_count} SIGHTING{card.computed.attention.screen_count === 1 ? '' : 'S'}</small></span><span className="attention-score"><b>{card.computed.attention.pressure}</b><small>PRESSURE</small></span></Link>)}
        </div>
      </section>

      <section className="math-notes">
        <article><span className="note-number">1</span><h3>Scarcity stays scarcity.</h3><p>Discontinuation, limited-run evidence, availability, waitlist evidence, and brand-production proxies feed scarcity. A movie appearance never does.</p></article>
        <article><span className="note-number">2</span><h3>Tier stays context.</h3><p>WatchScanner places Rolex in Tier 2, among leading mainstream luxury houses. That editorial tier helps define a peer group; it never multiplies price, scarcity, or collectibility.</p><a href="https://www.thewatchscanner.com/blogs/news/luxury-watch-brands" target="_blank" rel="noreferrer" className="src-a">SOURCE ↗</a></article>
        <article><span className="note-number">3</span><h3>Price response waits.</h3><p>For each exposure event, we need an exact release date plus at least three comparable sales in both the prior and following twelve months. Until then, the answer is “not computable.”</p></article>
      </section>
    </div>
  )
}
