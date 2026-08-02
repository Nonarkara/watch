// Watchmaking — a tab about the craft, told in Time Pop's voice: witty, sharp,
// MITF, no marketing fluff. Visuals are Wikimedia Commons only (CC0 / PD /
// CC BY / CC BY-SA, no NC/ND), each credited on the page. Three movements:
//   1. The joke (the socialist one) and the frame it sets up
//   2. Time as an abstraction that mechanical time made countable
//   3. What is actually inside a watch, why the parts matter, why the craft survives
// The page never claims expertise it does not have. Every generalisation is one
// a watchmaker would sign off on. References to Time Pop dossiers are the breadcrumb
// back to the catalogue; nothing is invented to pad the page.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadWatchmakingArtifacts, type WatchmakingArtifact } from '../lib/catalog.ts'

function ArtifactFigure({ a, tall }: { a: WatchmakingArtifact; tall?: boolean }) {
  return (
    <figure className={`wmp-figure${tall ? ' tall' : ''}`}>
      <a href={a.source_url} target="_blank" rel="noreferrer" className="wmp-figure-media">
        <img src={a.local} alt={a.caption} loading="lazy" />
      </a>
      <figcaption>
        <span className="wmp-figure-cap">{a.caption}</span>
        <span className="mono micro dim wmp-figure-credit">
          {a.artist} · {a.license} ·{' '}
          <a href={a.source_url} target="_blank" rel="noreferrer">Wikimedia Commons</a>
        </span>
      </figcaption>
    </figure>
  )
}

function Gallery({ items }: { items: WatchmakingArtifact[] }) {
  if (!items.length) return null
  return (
    <div className={`wmp-gallery cols-${Math.min(items.length, 3)}`}>
      {items.map((a) => <ArtifactFigure key={a.id} a={a} />)}
    </div>
  )
}

// ── The joke and the framing ────────────────────────────────────────────────
function FrameCard({ hero }: { hero?: WatchmakingArtifact }) {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">A JOKE TO START</span>
      <p className="wmp-quote">
        A socialist believes that capitalists invented the notion of time so everyone
        would have to buy a watch.
      </p>
      {hero && <ArtifactFigure a={hero} />}
      <p className="dim">
        It is a good joke because the second half is almost true. Before mechanical
        clocks — before the bell tower in 13th-century Europe, before the spring-driven
        pocket watch, before the wristwatch — life did run on time, but it ran on
        <em> local</em> time, sun time, the time the town crier felt like ringing.
        Nobody had to know the hour to the minute because nothing in the village
        required it.
      </p>
      <p className="dim">
        Then a series of craftsmen, most of them forgotten by name, made time
        <strong> countable</strong>. The escapement turned a coiled spring into a
        sequence of equal ticks. A dial turned those ticks into something a person
        could read across a room. The first portable timekeepers were a quarter-inch
        thick, drifted by half an hour a day, and cost what a house cost — and they
        changed the world before they became cheap.
      </p>
      <p className="dim">
        The capitalist did not invent time. The watchmaker gave time a name that
        fit in your hand.
      </p>
    </article>
  )
}

// ── The abstraction that almost wasn't ──────────────────────────────────────
function AbstractionCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">TIME BECAME A NUMBER</span>
      <h2 className="wmp-h2">An abstraction that is now countable — and that is the weird part.</h2>
      <p>
        Imagine a morning without a watch. Not in the romantic sense — not an
        analogue film where you are detached from the day. Imagine it
        <em> literally</em>: no number on a screen, no ticking on a wrist, no tower
        bell at the hour. The sun rises. You feel hungry, you eat. You feel tired,
        you sleep. Nobody knows their age in years; they know themselves in seasons
        and in what their hands can still lift.
      </p>
      <p>
        That world was the world for the entire history of the human species.
        <strong> It ended slowly, between roughly 1280 and 1680,</strong> as the
        mechanical clock moved from cathedral to town square to drawing room to
        pocket to wrist. The change was not the invention of time. It was the
        invention of a name for time that fit in your pocket.
      </p>
      <p>
        Once time had a name you could lose, two new things became possible: you
        could be late, and you could be paid by the hour. The first required a watch.
        The second required a watch and a job. The third, less often noticed, was
        that you could now <em>measure your own life</em>: a forty-year-old is
        no longer a person whose hands are tired; they are a number on a chart,
        and a chart can compare them to other forty-year-olds. We did not invent
        aging. We invented a unit for it.
      </p>
      <p className="dim wmp-italic">
        This is why a watch is not a tool the way a screwdriver is a tool. A
        screwdriver does not change what a screw is. A watch changes what an hour
        is. A watch is a philosophy instrument that happens to be worn on the wrist.
      </p>
    </article>
  )
}

// ── The anatomy of a mechanical watch (the part you can learn to appreciate) ─
function AnatomyCard({ shots }: { shots: WatchmakingArtifact[] }) {
  const parts = [
    {
      name: 'Mainspring',
      job: 'Stores the energy. A coiled ribbon of special steel, about 30 cm long when uncoiled, packed into a barrel the size of a shirt button. The whole watch runs on this. Wind it and the spring is your power reserve for the next 38 to 70 hours.',
    },
    {
      name: 'Gear train',
      job: 'Slows the spring down. The mainspring releases energy fast enough to spin a wheel; the gear train divides that rotation by hundreds of thousands of times so the second hand moves at one revolution per minute instead of one per second.',
    },
    {
      name: 'Escapement',
      job: 'The heart. Invented around 1275 (verge escapement), refined in 1754 (lever, by Thomas Mudge). It releases the gear train in equal ticks, one per swing of the balance. Without the escapement, the spring would unwind in a quarter-second blur.',
    },
    {
      name: 'Balance wheel + hairspring',
      job: 'The orchestra conductor. A small flywheel that oscillates at a fixed rate (modern watches: 4 Hz = 8 ticks per second; vintage: 2.5 Hz = 5 ticks per second). The hairspring pulls it back each direction. Together with the escapement, this is what "keeps time".',
    },
    {
      name: 'Dial train',
      job: 'The translation layer. Reduces the gear train output again to drive the hour, minute, and second hands at the right ratios. A minute hand turns once per hour; an hour hand turns once per twelve hours; a second hand turns once per minute.',
    },
    {
      name: 'Jewels',
      job: 'Ruby or synthetic sapphire bearings at every high-friction pivot. A 17-jewel watch covers the essentials; 25-31 is normal for a chronograph; 36+ is a complication. Jewels do not make a watch "better"; they make it last longer by reducing wear.',
    },
    {
      name: 'Rotor (automatic only)',
      job: 'A half-moon of heavy metal that swings with your wrist motion to wind the mainspring. Invented in 1923 by John Harwood. The rotor is the reason you can put an automatic watch down for a day and pick it up still running.',
    },
  ]
  return (
    <article className="wmp-frame">
      <span className="eyebrow">WHAT IS ACTUALLY INSIDE</span>
      <h2 className="wmp-h2">A tour of the parts, in plain English.</h2>
      <p>
        A modern mechanical watch has roughly 100 to 400 parts, depending on the
        complications. Most of them are tiny, made of brass or steel, polished by
        hand where they touch something visible, and invisible from the case back
        if you do not unscrew it. Here is what each part does, and why the work
        is not ceremonial.
      </p>
      <Gallery items={shots} />
      <ol className="wmp-parts">
        {parts.map((p, i) => (
          <li key={p.name}>
            <span className="wmp-part-num mono">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <strong>{p.name}</strong>
              <p className="dim">{p.job}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="dim wmp-italic">
        The honest summary: a mechanical watch is a system of reduction gears and
        an escapement, with a fancy user interface on top. Everything else —
        the case material, the dial texture, the lume plot — is a decision made
        by people who care about how the object sits on a wrist.
      </p>
    </article>
  )
}

// ── Why it still matters ────────────────────────────────────────────────────
function WhyItMattersCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">WHY THE CRAFT STILL EXISTS</span>
      <h2 className="wmp-h2">Your phone already tells the time. So what does a watch do?</h2>
      <p>
        The straight answer: a mechanical watch tells time worse than a quartz
        watch, which tells time worse than your phone. A $20 Casio F-91W keeps
        better time than a $40,000 Patek. By any honest measure of "is this an
        accurate instrument", a smartphone wins by a thousand to one.
      </p>
      <p>
        The interesting answer: that is exactly the point. A mechanical watch is
        a deliberate <em>refusal</em> of the most efficient solution. It says:
        the time is not the point. The relationship to the time is the point.
        You wind it. You service it. You hand it down. It ticks. The ticking
        is a choice that humans make in a world where ticking is optional.
      </p>
      <p>
        In a culture that has decided the time itself is a number on a screen,
        a watch is one of the few objects that says: <em>this number, the one
        I read off my wrist, took 400 years of human craft to be readable at
        all.</em> The watch does not compete with the phone. The watch reminds
        you that the phone's number used to be a person.
      </p>
      <p className="dim wmp-italic">
        A watch is a small protest against the assumption that everything
        measurable should be measured. It is a protest with a price tag. The
        price tag is the joke's punchline.
      </p>
    </article>
  )
}

// ── The five complications, briefly ─────────────────────────────────────────
function ComplicationsCard({ shots }: { shots: WatchmakingArtifact[] }) {
  const items = [
    { name: 'Chronograph', blurb: 'A built-in stopwatch. Start, stop, reset with side pushers. Common from 1960s onward. Rolex Daytona, Omega Speedmaster, TAG Monaco are the textbook cases.' },
    { name: 'Date', blurb: 'A window that flips at midnight. A simple gear train, but the date change is the most-copied complication in horology because it makes a watch feel "alive" once a day.' },
    { name: 'GMT / dual time', blurb: 'A 24-hour hand that lets you read a second time zone. Rolex GMT-Master (1954) for pilots; the modern Pepsi, Batman, and Rootbeer references are still the most-cited design.' },
    { name: 'Tourbillon', blurb: 'A rotating cage that holds the escapement to average out gravity. Invented by Breguet in 1795 to make pocket watches more accurate in vertical positions. On a wrist, the original problem no longer exists. It is a horological statement.' },
    { name: 'Perpetual calendar', blurb: 'A mechanism that "knows" the length of every month including leap years until 2100. The mechanical brain behind Patek Grand Complications and the Lange Datograph Perpetual.' },
  ]
  return (
    <article className="wmp-frame">
      <span className="eyebrow">FIVE COMPLICATIONS, IN PLAIN ENGLISH</span>
      <h2 className="wmp-h2">The features that turn a watch into a small mechanical computer.</h2>
      <p>
        In watchmaking, a "complication" is anything the watch does beyond
        tell the time. The word is a hundred-year-old joke: a watchmaker is
        paid per complication, and the customer sees them as
        <em> complicating</em> the simple job of reading the hour. The joke stuck.
      </p>
      <Gallery items={shots} />
      <ul className="wmp-comps">
        {items.map((c) => (
          <li key={c.name}>
            <strong>{c.name}</strong>
            <p className="dim">{c.blurb}</p>
          </li>
        ))}
      </ul>
    </article>
  )
}

// ── The six key periods (no-nonsense history) ───────────────────────────────
function PeriodsCard({ shots }: { shots: WatchmakingArtifact[] }) {
  const periods = [
    { span: '1275–1500', title: 'The first escapements',
      body: 'Mechanical clocks appear in cathedral towers. The verge escapement turns a falling weight into equal ticks. They are huge, inaccurate to half an hour a day, and the only place to see one is the bell tower of a wealthy town.' },
    { span: '1500–1675', title: 'The spring replaces the weight',
      body: 'Peter Henlein in Nuremberg makes the first portable watch around 1510 — a drum-shaped clock small enough to wear on a chain, but still an ornament of the very rich. Galileo discovers the pendulum isochronism in 1583; Christiaan Huygens builds the first pendulum clock in 1656. Accuracy improves by a factor of sixty.' },
    { span: '1675–1800', title: 'The balance spring and the pocket watch',
      body: 'Huygens applies the spring to the balance wheel in 1675. Pocket watches become practical. Abraham-Louis Breguet invents the automatic (perpetuelle) in 1770, the tourbillon in 1795, and the first wristwatch for the Queen of Naples in 1810. Breguet is the founder of modern watchmaking — most of what you see in a modern mechanical watch descends from his workshop.' },
    { span: '1800–1920', title: 'Industrialisation and the Swiss',
      body: 'Watchmaking moves from the jeweller\'s bench to the factory. Switzerland consolidates around the Jura valley. American system watches (Waltham, Elgin) industrialise further with interchangeable parts. Patek and Cartier are founded (1839, 1847). Wristwatches exist but are a women\'s fashion item — men carry pocket watches.' },
    { span: '1920–1970', title: 'The wristwatch wins',
      body: 'World War I proves the wristwatch on the field. Rolex founds (1905) and patents the Oyster (1926) — the first waterproof wristwatch case. World War II makes tool watches the masculine default. The first automatic chronograph (Rolex Daytona 4130 precursor movements) and the first dive watches (Rolex Submariner 1953, Blancpain Fifty Fathoms 1953) appear. This is the era the catalogue mostly documents.' },
    { span: '1970–present', title: 'Quartz, then the recovery',
      body: 'The Seiko Astron (1969) and the Swiss quartz crisis of 1970–1983 destroy a third of Swiss watchmaking jobs. Mechanical watches become a luxury and a hobby rather than the default. Independent watchmaking (F.P. Journe, Philippe Dufour, Rexhep Rexhepi) rises in the 1990s; haute horlogerie is its own market now. Mechanical watches are slower, less accurate, more expensive, and more loved than at any time in the last fifty years.' },
  ]
  return (
    <article className="wmp-frame">
      <span className="eyebrow">NO-NONSENSE HISTORY</span>
      <h2 className="wmp-h2">Six periods that explain why your watch works the way it does.</h2>
      <p>
        Watchmaking history is usually told as a list of kings. It is more useful
        as a list of <em>what got solved and when</em>. Here is the six-period
        version. Read the spans; the rest is a footnote.
      </p>
      <div className="wmp-history-shots">
        {shots.map((a) => <ArtifactFigure key={a.id} a={a} tall />)}
      </div>
      <ol className="wmp-periods">
        {periods.map((p) => (
          <li key={p.span}>
            <span className="wmp-period-span mono">{p.span}</span>
            <div>
              <strong>{p.title}</strong>
              <p className="dim">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  )
}

// ── Learn to appreciate: how to actually look at a watch ────────────────────
function LearnToLookCard({ shot }: { shot?: WatchmakingArtifact }) {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">LEARN TO LOOK</span>
      <h2 className="wmp-h2">Six things to notice on any watch, in any order.</h2>
      <p>
        You do not need to know the catalogue to appreciate a watch. You need
        to know where to put your eyes. Six places, in any order:
      </p>
      {shot && <ArtifactFigure a={shot} />}
      <ol className="wmp-look">
        <li>
          <strong>The dial finish.</strong>
          <p className="dim">Sunray brushing (radiating from the centre), grené (grain), flinqué (engraved and lacquered), stone (meteorite, aventurine). The finish is the personality of the dial. Hold the watch and tilt it; the finish is the thing that should change as the light moves.</p>
        </li>
        <li>
          <strong>The hands.</strong>
          <p className="dim">Dauphine, baton, syringe, leaf, Breguet, cathedral. The hands are the part you see most often. Polished hands catch light; blued hands oxidise at the edges over decades; luminous hands glow at night. The hands do more work than the dial.</p>
        </li>
        <li>
          <strong>The case finishing.</strong>
          <p className="dim">Polished, brushed, or a mix. The most-cited trick is a polished bezel and brushed sides, because the bezel catches the eye and the sides sit on the wrist without reflecting the room back at it.</p>
        </li>
        <li>
          <strong>The crystal.</strong>
          <p className="dim">Sapphire is standard on modern luxury; mineral on mid-tier; acrylic on vintage. Sapphire resists scratches but can shatter on impact; acrylic is the opposite. Box-shaped crystals (vintage) dome upward; flat crystals (modern) sit lower. The crystal is a design decision, not just a window.</p>
        </li>
        <li>
          <strong>The movement, if you can see it.</strong>
          <p className="dim">An exhibition case back shows the rotor, the bridges, the jewels. Côtes de Genève (parallel waves), perlage (small overlapping circles), anglage (beveled edges polished by hand). Each finish takes hours per plate. The movement is the part the watchmaker cared about most.</p>
        </li>
        <li>
          <strong>The second hand at work.</strong>
          <p className="dim">A quartz watch sweeps in one direction with a tiny stutter; a mechanical watch ticks in 4, 6, or 8 discrete beats per second depending on the frequency (28,800 vph = 4 Hz = 8 beats). A high-beat watch (Rolex 4130, Zenith El Primero at 36,000 vph) looks like it is sweeping; a low-beat vintage (18,000 vph) visibly ticks. The beat rate is the part you can hear.</p>
        </li>
      </ol>
    </article>
  )
}

// ── The five movements that are worth knowing by name ───────────────────────
function KeyMovementsCard() {
  const items = [
    { name: 'Rolex 3135', years: '1988–2020', what: 'The workhorse automatic that ran most of the Rolex catalogue for thirty years. Datejust, Submariner (pre-2020), GMT-Master II, Day-Date. 28,800 vph, 48-hour reserve, free-sprung balance. The reference for "reliable automatic".' },
    { name: 'Rolex 4130', years: '2000–present', what: 'Rolex\'s first in-house chronograph. Vertical clutch (so the seconds hand doesn\'t jump when you start the chronograph), 72-hour reserve, column wheel. Found in the Daytona. One of the best production chronograph movements ever made.' },
    { name: 'Patek 240 PS IRM QA LU', years: '1989–present', what: 'Patek\'s micro-rotor perpetual calendar. Recessed automatic winding so the case stays thin; a perpetual calendar that "knows" leap years. The calibre that made the annual calendar possible (Patek 5035, 1996).' },
    { name: 'Lange 951', years: '1999–present', what: 'A. Lange & Söhne\'s in-house chronograph. The Datograph. The reason a column-wheel chronograph with a precise minute counter and a jumping minute register became the modern benchmark.' },
    { name: 'Seiko 9R65 / 9R5', years: '2004–present', what: 'Spring Drive. A quartz-regulated mechanical movement: the mainspring drives the gear train, but the timekeeping is governed by a quartz crystal through electromagnetic braking. The second hand sweeps perfectly, with no tick. A Japanese answer to the Swiss problem.' },
  ]
  return (
    <article className="wmp-frame">
      <span className="eyebrow">FIVE MOVEMENTS WORTH KNOWING</span>
      <h2 className="wmp-h2">The calibres that show up in dossier after dossier.</h2>
      <p>
        You do not need to memorise 300 reference numbers. You need to know the
        five movements below. The rest are descendants of one of these.
      </p>
      <ul className="wmp-movements">
        {items.map((m) => (
          <li key={m.name}>
            <div className="wmp-movements-head">
              <strong>{m.name}</strong>
              <span className="dim mono">{m.years}</span>
            </div>
            <p className="dim">{m.what}</p>
          </li>
        ))}
      </ul>
    </article>
  )
}

// ── Back to the register — what to read next ────────────────────────────────
function NextReadsCard() {
  const links = [
    { to: '/register', label: 'The Register', body: 'Every reference we cover, with comps, scarcity, and the dossier.' },
    { to: '/brands', label: 'Brand Directory', body: '27 brands, per-tier card counts, image and comp coverage.' },
    { to: '/glossary', label: 'Glossary', body: 'Movements, calibres, parts, market — every term used on the site.' },
    { to: '/methodology', label: 'Methodology', body: 'The honesty ladder, the estimator, what we refuse to invent.' },
  ]
  return (
    <article className="wmp-frame wmp-next">
      <span className="eyebrow">FROM THE PAGE TO THE REGISTER</span>
      <h2 className="wmp-h2">If this changed how you look at a watch, start here.</h2>
      <div className="wmp-next-grid">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="wmp-next-card">
            <strong>{l.label}</strong>
            <p className="dim">{l.body}</p>
            <span className="mono micro">OPEN →</span>
          </Link>
        ))}
      </div>
    </article>
  )
}

// ── The main page composition ──────────────────────────────────────────────
export default function Watchmaking() {
  const data = useDataset()
  const [artifacts, setArtifacts] = useState<WatchmakingArtifact[]>([])
  const [policy, setPolicy] = useState('')

  useEffect(() => {
    loadWatchmakingArtifacts().then((snap) => {
      setArtifacts(snap.artifacts)
      setPolicy(snap.policy)
    }).catch(() => { /* page still reads without images */ })
  }, [])

  const bySlot = useMemo(() => {
    const m: Record<string, WatchmakingArtifact[]> = {}
    for (const a of artifacts) {
      ;(m[a.slot] ??= []).push(a)
    }
    return m
  }, [artifacts])

  return (
    <div className="wmp-page">
      <Link to="/" className="crumb">← HOME</Link>

      <section className="wmp-hero">
        <div>
          <p className="eyebrow">WATCHMAKING · A PAGE ABOUT THE CRAFT</p>
          <h1 className="pagetitle">A watch is a philosophy instrument that happens to be worn on the wrist.</h1>
          <p className="lede">
            The first half of this page is a joke and a frame. The second half
            is what is actually inside a mechanical watch, why the parts matter,
            and how to look at one without feeling like you need a degree. The
            third half is the no-nonsense history and the five movements that
            explain why the catalogue looks the way it does.
          </p>
          <p className="mono micro dim">
            {data?.count ?? '—'} REFERENCES · {artifacts.length || '—'} FREE-LICENCE ARTIFACTS · {data?.cards.filter((c) => c.comp_summary).length ?? '—'} DOSSIERS WITH SALE EVIDENCE
          </p>
        </div>
      </section>

      <FrameCard hero={bySlot.frame?.[0]} />
      <AbstractionCard />
      <AnatomyCard shots={bySlot.anatomy ?? []} />
      <WhyItMattersCard />
      <ComplicationsCard shots={bySlot.complications ?? []} />
      <PeriodsCard shots={bySlot.periods ?? []} />
      <LearnToLookCard shot={bySlot.look?.[0]} />
      <KeyMovementsCard />
      <NextReadsCard />

      {policy && (
        <p className="mono micro dim wmp-rights">
          IMAGE RIGHTS · {policy} Every figure links to its Commons file.
        </p>
      )}
    </div>
  )
}
