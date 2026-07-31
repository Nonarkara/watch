import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'

export default function Economy() {
  const data = useDataset()
  const [scarcity, setScarcity] = useState(60)
  const [sightings, setSightings] = useState(2)
  const attention = Math.min(100, sightings * 20)
  const pressure = Math.round(Math.sqrt(scarcity * attention))
  const exposed = useMemo(() => [...(data?.cards ?? [])].filter((card) => card.computed.attention.value != null).sort((a, b) => (b.computed.attention.pressure ?? 0) - (a.computed.attention.pressure ?? 0)), [data])

  return (
    <div className="economy-page">
      <Link to="/" className="crumb">← HOME</Link>
      <div className="masthead economy-masthead">
        <p className="eyebrow">ATTENTION × FIXED SUPPLY LAB</p>
        <h1 className="pagetitle">A spotlight is not a mint.</h1>
        <p className="lede">A screen appearance may increase attention to a watch. It does not reduce supply. This lab keeps those two ideas separate, then shows where demand pressure could deserve closer study.</p>
        <div className="sticker">NO FORECASTS<br />NO FAKE RETURNS</div>
      </div>

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
