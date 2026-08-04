// Labs — the wildest ideas Time Pop could build, grounded in data it
// already has. Every concept here is speculation clearly labelled as such.
// No invented numbers, no fake confidence. Each card names the real dataset
// it would draw on, and says plainly what it would and would not prove.
//
// House law: the honesty ladder still applies. Labs is the place where we
// think out loud about what the evidence could become — not a place to
// publish numbers the evidence does not yet support.

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import HeroBanner from '../components/HeroBanner.tsx'

interface Concept {
  id: string
  num: string
  hue: 'coral' | 'yellow' | 'navy' | 'teal'
  status: 'speculative' | 'prototype-ready' | 'data-limited'
  name: string
  pitch: string
  dataSource: string[]
  how: string
  honestLimit: string
  links: { to: string; label: string }[]
}

const CONCEPTS: Concept[] = [
  {
    id: 'federer-effect',
    num: '01',
    hue: 'coral',
    status: 'data-limited',
    name: 'The Federer Effect Engine',
    pitch: 'Quantify how a celebrity association moves the attention-pressure needle — and whether it sticks after the spotlight leaves.',
    dataSource: ['provenance_events', 'computed.attention', 'screen_events'],
    how: 'Group references by the type of provenance event (athlete, actor, musician, royal). Compare the attention-pressure score before and after the event window. The engine already has the inputs — the gap is the statistical cohort needed to call a result.',
    honestLimit: 'Most references have one or zero celebrity events. A real "effect" needs a dozen parallel cases, each with enough comps before and after. The honesty ladder refuses to publish a coefficient of one.',
    links: [{ to: '/economy', label: 'SEE THE PRESSURE MODEL' }, { to: '/screen', label: 'SCREEN EVIDENCE' }],
  },
  {
    id: 'attention-oracle',
    num: '02',
    hue: 'navy',
    status: 'speculative',
    name: 'The Attention Oracle',
    pitch: 'A watch-world version of "who is due for a feature." Which references have the scarcity and cultural footprint to be the next screen cameo — before it happens.',
    dataSource: ['scarcity_public', 'computed.collectibility', 'screen_events', 'brand_context'],
    how: 'Score every reference on two axes the register already computes: physical scarcity (closed supply, fixed editions) and collectibility (auction appearances, provenance density). References high on both but with zero screen history are the "overdue" set. This is a ranking, not a prediction.',
    honestLimit: 'A prop master chooses a watch for reasons a dataset cannot see — a director’s memory, an actor’s wrist size, a costume budget. The oracle identifies plausibility, not causation. It is a conversation starter, and says so.',
    links: [{ to: '/signals', label: 'SCARCITY DATA' }, { to: '/patterns', label: 'PATTERN SCREEN' }],
  },
  {
    id: 'wrist-dna',
    num: '03',
    hue: 'teal',
    status: 'prototype-ready',
    name: 'Wrist-DNA Matcher',
    pitch: '“You are what you wear.” Cluster the register into collector archetypes — the Tool Watch Purist, the Dress-Code Formalist, the Japanese-Minimalist — and show which references belong to each tribe.',
    dataSource: ['identity.tier', 'identity.movement.type', 'identity.case', 'brand_context'],
    how: 'Every reference already carries structured identity: movement type, case material, diameter, tier, brand region. A clustering pass (k-means on normalised specs) would group references by what they actually are, not how they are marketed. The matcher then says “your saved watches are 80% Tool Purist — here are three you have not seen.”',
    honestLimit: 'Archetypes are editorial, not mathematical truth. The clusters are a frame for discovery, and the page would label them as such. The matcher would never claim to know your taste better than you do.',
    links: [{ to: '/discover', label: 'DISCOVER A WATCH' }, { to: '/register', label: 'BROWSE THE REGISTER' }],
  },
  {
    id: 'time-travel-portfolio',
    num: '04',
    hue: 'yellow',
    status: 'data-limited',
    name: 'The Time-Travel Portfolio',
    pitch: '“If you had walked into a dealer in YEAR and bought REFERENCE, what would it be worth today?” — a CPI-adjusted holding-horizon simulator.',
    dataSource: ['retail.msrp_history', 'notable_sales', 'computed.change_5y', 'CPI snapshot'],
    how: 'The register already stores launch MSRP, CPI data back to 2008, and verified resale prices. A simulator could take (reference, purchase year, hold years) and return nominal return, real (CPI-adjusted) return, and annualised yield — all from cited evidence already on the card.',
    honestLimit: 'A portfolio of one is not a portfolio. The simulator would show what happened to a single object, never imply it generalises, and refuse to forecast forward. It is a rear-view mirror, not a windshield.',
    links: [{ to: '/economy', label: 'THE ECONOMY LAB' }, { to: '/methodology', label: 'THE METHOD' }],
  },
  {
    id: 'heirloom-decay',
    num: '05',
    hue: 'coral',
    status: 'speculative',
    name: 'The Heirloom Decay Model',
    pitch: 'Which watches survive being passed down — not mechanically, but economically? A multi-generational value-retention model built on liquidity, not price.',
    dataSource: ['computed.liquidity', 'computed.resellability', 'comp_summary.venues', 'brand_context'],
    how: 'The register computes a resellability score (sales per year, venue diversity, recency, confidence). The decay model would project that score across a holding period: how quickly does a reference lose its “easy to sell” quality if it stops appearing at auction? References with deep venue coverage decay slowly; single-venue references decay fast.',
    honestLimit: '“Decay” is a metaphor for liquidity erosion, not physical deterioration. A watch does not rot. The model describes market access, and would say so on the tin. No reference is called a “bad heirloom” — only a more or less liquid one.',
    links: [{ to: '/signals', label: 'LIQUIDITY DATA' }, { to: '/rehome', label: 'THE HANDOVER BRIEF' }],
  },
  {
    id: 'counterfeit-index',
    num: '06',
    hue: 'navy',
    status: 'speculative',
    name: 'The Counterfeit Risk Index',
    pitch: 'Where fakes concentrate tells you where demand outruns supply. A proxy index for counterfeiting pressure, built from the gap between market presence and legitimate production volume.',
    dataSource: ['brand_production_est', 'computed.collectibility', 'retail.current_msrp_usd', 'scarcity_public'],
    how: 'The register holds brand-level production estimates (Rolex ~1.1M/yr, Patek ~72k, AP ~53k) and per-reference collectibility scores. A reference that is highly collectible but from a low-volume brand sits in the high-pressure zone. The index does not count fakes (we have no counterfeit dataset) — it maps the economic incentive for them to exist.',
    honestLimit: 'This is an incentive map, not a seizure log. It identifies where the economic gap is widest, which is where grey-market and counterfeit activity tends to follow. It would never accuse a specific reference of being “commonly faked” without a seizure-data source we do not have.',
    links: [{ to: '/about', label: 'THE HONESTY LADDER' }, { to: '/methodology', label: 'WHAT WE REFUSE' }],
  },
]

const STATUS_LABEL: Record<Concept['status'], string> = {
  'speculative': 'SPECULATIVE',
  'prototype-ready': 'PROTOTYPE-READY',
  'data-limited': 'BLOCKED ON DATA',
}

function PlaceholderFigure({ hue, label }: { hue: Concept['hue']; label: string }) {
  return (
    <figure className={`labs-fig labs-fig--${hue}`} aria-label={`Illustration placeholder: ${label}`}>
      <div className="labs-fig-frame">
        <span className="labs-fig-mono mono">ILLUSTRATION TO COME</span>
        <span className="labs-fig-label">{label}</span>
      </div>
      <figcaption className="labs-fig-cap mono micro dim">
        FIGURE SLOT · POP-ART DIAGRAM
      </figcaption>
    </figure>
  )
}

export default function Labs() {
  const data = useDataset()

  const stats = useMemo(() => {
    if (!data) return null
    const cards = data.cards
    return {
      total: cards.length,
      withProvenance: cards.filter((c) => c.provenance_events.length > 0).length,
      withComps: cards.filter((c) => c.comp_summary).length,
      withScreen: cards.filter((c) => c.screen_events.length > 0).length,
      withResell: cards.filter((c) => c.computed.resellability.value != null).length,
    }
  }, [data])

  return (
    <div className="labs-page">
      <HeroBanner
        hue="coral"
        size="lg"
        eyebrow="LABS · SPECULATIVE INSTRUMENTS"
        title={<>The wildest ideas<br />we could build.</>}
        subtitle={
          <>
            Six concepts that push the register past what it can prove today.
            Each one is grounded in data Time Pop already holds — and each one
            says plainly where it would stop being honest. This is the workshop,
            not the showcase.
          </>
        }
        primary={{ to: '#the-concepts', label: 'SEE THE SIX CONCEPTS' }}
        secondary={{ to: '/methodology', label: 'THE HONESTY LADDER' }}
        meta={
          stats && (
            <aside className="labs-hero-meta pop-panel">
              <span className="bubble-kicker mono">WHAT WE HAVE</span>
              <dl className="labs-hero-stats">
                <div><dt>References</dt><dd>{stats.total}</dd></div>
                <div><dt>With story</dt><dd>{stats.withProvenance}</dd></div>
                <div><dt>With comps</dt><dd>{stats.withComps}</dd></div>
                <div><dt>On screen</dt><dd>{stats.withScreen}</dd></div>
              </dl>
              <span className="micro dim">These are the raw materials. Every concept below names exactly which of them it would use.</span>
            </aside>
          )
        }
      />

      <Link to="/" className="crumb">← HOME</Link>

      <section className="sect labs-intro" id="the-concepts">
        <div className="section-rule">
          <h2>What this page is — and is not.</h2>
          <span className="sticker-inline mono">SPECULATION · GROUNDED IN REAL DATA</span>
        </div>
        <p className="lede">
          Labs is where Time Pop thinks out loud. Every concept here is built from
          data the system already collects — provenance, comps, screen sightings,
          scarcity, liquidity. None of them is a finished feature. All of them
          respect the honesty ladder: if the evidence is not there, the concept
          says so, and stays a concept.
        </p>
        <div className="labs-status-key mono">
          <span><strong className="labs-dot labs-dot--speculative">●</strong> SPECULATIVE — needs design + data work</span>
          <span><strong className="labs-dot labs-dot--prototype">●</strong> PROTOTYPE-READY — could be built now</span>
          <span><strong className="labs-dot labs-dot--data">●</strong> BLOCKED ON DATA — waiting on evidence</span>
        </div>
      </section>

      <div className="labs-concepts">
        {CONCEPTS.map((c) => (
          <article key={c.id} className={`labs-card labs-card--${c.hue}`} id={c.id}>
            <header className="labs-card-head">
              <span className="labs-card-num mono">{c.num}</span>
              <span className={`labs-card-status mono labs-card-status--${c.status}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </header>
            <h3 className="labs-card-name">{c.name}</h3>
            <p className="labs-card-pitch">{c.pitch}</p>

            <PlaceholderFigure hue={c.hue} label={c.name} />

            <div className="labs-card-body">
              <div className="labs-card-section">
                <span className="labs-card-label mono">DATA IT WOULD USE</span>
                <ul className="labs-card-sources">
                  {c.dataSource.map((s) => <li key={s} className="mono">{s}</li>)}
                </ul>
              </div>
              <div className="labs-card-section">
                <span className="labs-card-label mono">HOW IT WOULD WORK</span>
                <p className="dim">{c.how}</p>
              </div>
              <div className="labs-card-section labs-card-limit">
                <span className="labs-card-label mono">WHERE IT STOPS BEING HONEST</span>
                <p>{c.honestLimit}</p>
              </div>
            </div>

            <footer className="labs-card-foot">
              {c.links.map((l) => (
                <Link key={l.to} to={l.to} className="labs-card-link mono">{l.label} →</Link>
              ))}
            </footer>
          </article>
        ))}
      </div>

      <section className="sect labs-closing">
        <div className="section-rule">
          <h2>Why build any of this?</h2>
          <span className="sticker-inline mono">THE POINT OF A LAB</span>
        </div>
        <p className="dim">
          A register that only looks backward is a museum. A register that can
          frame a question — “is this reference overdue for attention?”, “would
          this have been a good hold?”, “does this tribe exist?” — is a research
          instrument. Labs is the shelf where those questions live until the
          evidence catches up. When it does, the concept becomes a page. When it
          does not, the concept stays here, and says why.
        </p>
        <p className="dim labs-closing-note">
          None of these concepts publishes a number the dataset does not back.
          That is the line between a lab and a casino.
        </p>
      </section>
    </div>
  )
}