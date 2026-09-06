// Labs — the wildest ideas Time Pop could build, grounded in data it
// already has. Visual language: the unused pop-art film collages live here
// as mood plates (not evidence), one still per concept, never reused as a
// Screen still. Honesty ladder still applies to every number claim.

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
interface Concept {
  id: string
  num: string
  status: 'speculative' | 'prototype-ready' | 'data-limited'
  name: string
  pitch: string
  art: { src: string; alt: string; caption: string }
  dataSource: string[]
  how: string
  honestLimit: string
  links: { to: string; label: string }[]
}

const CONCEPTS: Concept[] = [
  {
    id: 'federer-effect',
    num: '01',
    status: 'data-limited',
    name: 'The Federer Effect Engine',
    pitch: 'A famous wrist walks into frame. Does the attention stick after the credits roll?',
    art: {
      src: '/img/labs/entourage.jpg',
      alt: 'Pop-art collage: Audemars Piguet Royal Oak Offshore against an LA sunset and supercar',
      caption: 'ENTOURAGE ENERGY · CELEBRITY AS A PRESSURE EVENT',
    },
    dataSource: ['provenance_events', 'computed.attention', 'screen_events'],
    how: 'Group references by provenance type (athlete, actor, musician, royal). Compare attention-pressure before and after the event window. The inputs exist — the gap is enough parallel cases to call a result.',
    honestLimit: 'Most references have one or zero celebrity events. A real "effect" needs a dozen parallel cases with comps on both sides. The honesty ladder refuses a coefficient of one.',
    links: [{ to: '/economy', label: 'SEE THE PRESSURE MODEL' }, { to: '/screen', label: 'SCREEN EVIDENCE' }],
  },
  {
    id: 'attention-oracle',
    num: '02',
    status: 'speculative',
    name: 'The Attention Oracle',
    pitch: 'Which watches are overdue for a cameo — high scarcity, thick story, zero screen credits yet?',
    art: {
      src: '/img/labs/seiko-007.jpg',
      alt: 'Pop-art collage: Seiko diver beside a Bond gun-barrel motif',
      caption: 'FAN HOMAGE · PLAUSIBLE BEFORE IT IS CANON',
    },
    dataSource: ['scarcity_public', 'computed.collectibility', 'screen_events', 'brand_context'],
    how: 'Score every reference on scarcity and collectibility. High on both with zero screen history is the "overdue" set. This is a ranking, not a prediction.',
    honestLimit: 'A prop master picks for reasons a dataset cannot see — memory, wrist size, budget. The oracle names plausibility. It never claims causation.',
    links: [{ to: '/signals', label: 'SCARCITY DATA' }, { to: '/patterns', label: 'PATTERN SCREEN' }],
  },
  {
    id: 'wrist-dna',
    num: '03',
    status: 'prototype-ready',
    name: 'Wrist-DNA Matcher',
    pitch: 'You are what you wear. Cluster the register into tribes — tool purist, dress formalist, Japanese minimalist — and match you into one.',
    art: {
      src: '/img/labs/kingsman.jpg',
      alt: 'Pop-art collage: field watch with London skyline and radar rings',
      caption: 'TRIBE MARKERS · THE WATCH THAT PICKS A SIDE',
    },
    dataSource: ['identity.tier', 'identity.movement.type', 'identity.case', 'brand_context'],
    how: 'Cluster on structured identity (movement, metal, diameter, tier, region). Then: “your saved watches are 80% Tool Purist — here are three you have not seen.”',
    honestLimit: 'Archetypes are editorial frames, not mathematical truth. The matcher never claims to know your taste better than you do.',
    links: [{ to: '/discover', label: 'DISCOVER A WATCH' }, { to: '/register', label: 'BROWSE THE REGISTER' }],
  },
  {
    id: 'time-travel-portfolio',
    num: '04',
    status: 'data-limited',
    name: 'The Time-Travel Portfolio',
    pitch: 'Walk into a dealer in YEAR, buy REFERENCE, hold for N years. What happened — nominal, CPI-real, annualised?',
    art: {
      src: '/img/labs/gone-girl.jpg',
      alt: 'Pop-art collage: Rolex GMT Pepsi with Polaroids and a lit house at night',
      caption: 'POLAROIDS · A REAR-VIEW MIRROR, NOT A WINDSHIELD',
    },
    dataSource: ['retail.msrp_history', 'notable_sales', 'computed.change_5y', 'CPI snapshot'],
    how: 'Launch MSRP + CPI + verified resale already sit on the card. Simulator takes (reference, purchase year, hold years) and returns cited returns only.',
    honestLimit: 'A portfolio of one is not a portfolio. No forward forecast. Rear-view only.',
    links: [{ to: '/economy', label: 'THE ECONOMY LAB' }, { to: '/methodology', label: 'THE METHOD' }],
  },
  {
    id: 'heirloom-decay',
    num: '05',
    status: 'speculative',
    name: 'The Heirloom Decay Model',
    pitch: 'Which watches stay easy to pass on — not mechanically, but as something someone can still sell?',
    art: {
      src: '/img/labs/daylight-panerai.jpg',
      alt: 'Pop-art collage: Panerai submersible against a tunnel explosion',
      caption: 'SURVIVAL UNDER PRESSURE · LIQUIDITY, NOT RUST',
    },
    dataSource: ['computed.liquidity', 'computed.resellability', 'comp_summary.venues', 'brand_context'],
    how: 'Project resellability across a holding period. Deep venue coverage decays slowly; single-venue references decay fast.',
    honestLimit: '“Decay” means liquidity erosion, not physical rot. No reference is a “bad heirloom” — only more or less liquid.',
    links: [{ to: '/signals', label: 'LIQUIDITY DATA' }, { to: '/rehome', label: 'THE HANDOVER BRIEF' }],
  },
  {
    id: 'counterfeit-index',
    num: '06',
    status: 'speculative',
    name: 'The Counterfeit Risk Index',
    pitch: 'Where demand outruns honest supply, fakes follow. Map the incentive gap — never pretend we counted seizures.',
    art: {
      src: '/img/labs/focus.jpg',
      alt: 'Pop-art collage: tonneau chronograph against a New York night skyline',
      caption: 'THE CON MAN\'S WRIST · INCENTIVE, NOT ACCUSATION',
    },
    dataSource: ['brand_production_est', 'computed.collectibility', 'retail.current_msrp_usd', 'scarcity_public'],
    how: 'High collectibility + low brand volume = high pressure zone. Maps economic incentive for fakes, not seizure counts we do not have.',
    honestLimit: 'Incentive map, not a seizure log. Never calls a reference “commonly faked” without seizure data.',
    links: [{ to: '/about', label: 'THE HONESTY LADDER' }, { to: '/methodology', label: 'WHAT WE REFUSE' }],
  },
]

const STATUS_LABEL: Record<Concept['status'], string> = {
  'speculative': 'SPECULATIVE',
  'prototype-ready': 'PROTOTYPE-READY',
  'data-limited': 'BLOCKED ON DATA',
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
    }
  }, [data])

  return (
    <div className="labs-page">
      <section className="labs-hero" aria-label="Labs — the workshop">
        <img
          className="labs-hero-bg"
          src="/img/hero/time-pop-banner-alt.png"
          alt=""
          aria-hidden="true"
          width={1600}
          height={900}
           decoding="async"
           loading="eager"
           fetchPriority="high"
        />
        <div className="labs-hero-copy">
          <p className="labs-hero-eyebrow mono">LABS · WHERE THE COLLAGE GETS LOUD</p>
          <h1 className="labs-hero-title">Six ideas.<br />Zero fake numbers.</h1>
          <p className="labs-hero-lede">
            The workshop floor. Each concept below wears a pop-art mood plate —
            film energy as atmosphere, not as proof — then names the real data
            it would use and where honesty stops it.
          </p>
          <div className="labs-hero-actions">
            <a className="btn" href="#the-concepts">SEE THE SIX →</a>
            <Link className="btn secondary" to="/methodology">HONESTY LADDER</Link>
          </div>
        </div>
        {stats && (
          <aside className="labs-hero-ledger" aria-label="Raw materials on hand">
            <p className="labs-hero-ledger-head mono">RAW MATERIALS · LIVE BUILD</p>
            <dl className="labs-hero-stats">
              <div><dt>References</dt><dd>{stats.total}</dd></div>
              <div><dt>With story</dt><dd>{stats.withProvenance}</dd></div>
              <div><dt>With comps</dt><dd>{stats.withComps}</dd></div>
              <div><dt>On screen</dt><dd>{stats.withScreen}</dd></div>
            </dl>
          </aside>
        )}
      </section>

      <Link to="/" className="crumb">← HOME</Link>

      <section className="sect labs-intro" id="the-concepts">
        <div className="section-rule">
          <h2>Play first. Then refuse.</h2>
          <span className="sticker-inline mono">SPECULATION · GROUNDED IN REAL DATA</span>
        </div>
        <p className="lede">
          Labs is where Time Pop thinks out loud with the pictures turned up.
          The plates set the mood. The cards keep the rules: provenance, comps,
          screen, scarcity, liquidity — and a clear stop when the evidence runs out.
        </p>
        <p className="micro dim labs-art-note">
          ABOUT THE PICTURES · The plates on this page are original pop-art
          collages made for Time Pop. They are not film stills and not evidence:
          no frame here is a studio image, and nothing on this page is
          identifying a watch from one. Where the register does read a watch off
          a real screen appearance, it says so and credits the studio — see{' '}
          <Link className="src-a" to="/screen">on screen</Link>. Where a studio
          still is copyrighted, the register withholds it rather than
          substituting a picture that only looks like one.
        </p>
        <div className="labs-status-key mono">
          <span><strong className="labs-dot labs-dot--speculative">●</strong> SPECULATIVE — needs design + data work</span>
          <span><strong className="labs-dot labs-dot--prototype">●</strong> PROTOTYPE-READY — could be built now</span>
          <span><strong className="labs-dot labs-dot--data">●</strong> BLOCKED ON DATA — waiting on evidence</span>
        </div>
      </section>

      <div className="labs-concepts">
        {CONCEPTS.map((c) => (
          <article key={c.id} className="labs-card" id={c.id}>
            <figure className="labs-card-art">
              <img
                src={c.art.src}
                alt={c.art.alt}
                loading="lazy" decoding="async"
                width={1024}
                height={768}
              />
              <figcaption className="labs-card-art-cap mono">{c.art.caption}</figcaption>
            </figure>
            <header className="labs-card-head">
              <span className="labs-card-num mono">{c.num}</span>
              <span className={`labs-card-status mono labs-card-status--${c.status}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </header>
            <h3 className="labs-card-name">{c.name}</h3>
            <p className="labs-card-pitch">{c.pitch}</p>

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
          ask “is this overdue for attention?” or “would this have been a good
          hold?” is a research instrument with a pulse. Labs is the shelf where
          those questions live — loud pictures, quiet numbers — until the
          evidence catches up.
        </p>
        <p className="dim labs-closing-note">
          None of these concepts publishes a number the dataset does not back.
          That is the line between a lab and a casino.
        </p>
      </section>
    </div>
  )
}
