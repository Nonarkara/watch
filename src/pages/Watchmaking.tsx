// Watchmaking — the question of time itself, then the craft, then the eras,
// then the next reads. Four sub-tabs. The MITF voice stays. Every generalisation
// is one a watchmaker would sign off on. Every figure is Wikimedia Commons
// (CC0 / PD / CC BY / CC BY-SA), credited on the page.
//
// Tab map (each tab is a coherent read in itself):
//   01 TIME     — Why are we measuring time now? Hume's watchmaker as metaphor.
//                 Einstein's space-time. First watch. First pocket watch. Quartz
//                 revolution. Smartphone/watch era. The spine of the page.
//   02 CRAFT    — The socialist joke. The abstraction. Anatomy. Why it matters.
//                 Complications. The inside of a watch, why the parts matter.
//   03 ERAS     — Periods through history. How to look at one. Five key
//                 movements. The history is the spine of the catalogue.
//   04 LEARN    — Glossary, methodology, register, paper. Where to go next.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadWatchmakingArtifacts, type WatchmakingArtifact } from '../lib/catalog.ts'
import HeroBanner from '../components/HeroBanner.tsx'

type TabId = 'time' | 'craft' | 'eras' | 'learn'

const TABS: { id: TabId; num: string; label: string; sub: string }[] = [
  { id: 'time', num: '01', label: 'TIME', sub: 'Why are we measuring time now?' },
  { id: 'craft', num: '02', label: 'CRAFT', sub: 'The socialist joke. The anatomy.' },
  { id: 'eras', num: '03', label: 'ERAS', sub: 'Periods. Key movements. How to look.' },
  { id: 'learn', num: '04', label: 'LEARN', sub: 'Glossary, methodology, register, paper.' },
]

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
          <a href={a.source_url} target="_blank" rel="noreferrer">Commons</a>
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

// ── 01 TIME — the question of time itself ───────────────────────────────────

function TimeOpening() {
  return (
    <article className="wmp-frame wmp-time-lead">
      <span className="eyebrow">A QUESTION BEFORE THE CRAFT</span>
      <h2 className="wmp-h2">Why are we measuring time now?</h2>
      <p>
        A watch sits on a wrist. The wrist is in a city. The city is on a planet.
        The planet is in a solar system. None of these things have a watch in them.
        The number on the dial is a human agreement — and it took most of human
        history to agree.
      </p>
      <p>
        <strong>For 200,000 years humans did not need a watch.</strong> They needed
        the sun, the season, the bell, the rooster. Mechanical time is younger
        than the printing press. Quartz is younger than the transistor. The
        smartphone is younger than most people reading this page. The instrument
        is new; the question is old.
      </p>
      <p>
        The four sub-essays below — Hume, Einstein, the first watch, the first
        pocket watch, quartz, the smartphone — are the spine of the question.
        They explain why the rest of this catalogue exists at all, and why a
        page about watchmaking is, in the end, a page about time.
      </p>
    </article>
  )
}

function HumeCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">01.1 · A METAPHOR DAVID HUME TURNED OVER</span>
      <h3 className="wmp-h3">Hume's watchmaker, and the inference he refused.</h3>
      <p>
        In 1779, fifty years after the first reliable marine chronometer had
        crossed the Atlantic, David Hume — by then a quarter-century dead — was
        posthumously asked whether the argument from design was sound. The
        argument went like this: walk into a field, find a watch, examine it,
        infer a watchmaker. Walk into a world, examine it, infer — by analogy —
        a world-maker. The reasoning felt obvious. The feeling was Hume's whole
        point.
      </p>
      <p>
        Hume's <em>Dialogues Concerning Natural Religion</em> (1779) does not
        publish a clean refutation; it stages one. The character Philo walks
        Cleanthes (the design-inferer) through every analogy the design argument
        can borrow from a watch — a watch, a watch found on a desert island, a
        vegetable, an animal, a universe — and asks, at each step, where the
        analogy stops being apt. The watch has a maker because we have seen
        watches being made. The universe has been seen being made exactly once
        (and even that is contested). The argument's strength, Hume suggests, is
        not in the analogy; it is in the listener's prior.
      </p>
      <p>
        What Hume hands the watch world is not an answer. He hands us the
        <strong> discipline of refusing the easy inference</strong>. When a buyer
        is shown a watch and told it must be valuable because it looks
        <em> designed</em> — because the dial is balanced, the case is finished,
        the brand is on it — Hume is the footnote that says: the look of design
        is the weakest evidence. The evidence is the chain of making. Time Pop
        runs the same test. A card that shows only the finished object — the
        dial, the case, the brand — is showing what Hume called the
        <em> appearance</em>. A card that shows the maker, the receipt, the
        service history, the auction, is showing the chain. The first kind of
        card is the watch on the heath. The second kind is the watch with the
        receipt. The system prefers the second.
      </p>
      <p className="dim">
        <em>Public knowledge:</em> the watch-as-cosmos metaphor predates Hume by
        at least a century — it is in Bernard Fontenelle's 1686{' '}
        <em>Conversations on the Plurality of Worlds</em>, in William Derham's
        1713 <em>Physico-Theology</em>, and in William Paley's 1802{' '}
        <em>Natural Theology</em>. Hume was not the first to use the metaphor.
        He was the first to take it seriously enough to break.
      </p>
    </article>
  )
}

function EinsteinCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">01.2 · THE FOUR-DIMENSIONAL CRACK</span>
      <h3 className="wmp-h3">Einstein's space-time, and why a watch is no longer a metaphor.</h3>
      <p>
        Newton had space, time, and matter as three separate things. Space held
        matter; time flowed through space at the same rate for everyone. A watch,
        in Newton's universe, was a passive recorder of a universal time — a
        meter for an axis that ran identically wherever you measured it. Two
        watches, synchronised in London, would agree to the second in
        Singapore.
      </p>
      <p>
        Einstein's 1905 special relativity and 1915 general relativity dissolved
        the deal. <strong>Time is local.</strong> A watch at the top of a tower
        runs faster than a watch at the bottom (the gravitational dilation
        Einstein computed in 1907, confirmed by Pound–Rebka in 1959, and now
        routine in GPS). A watch on a plane runs slower than a watch on the
        ground (Hafele–Keating, 1971, four cesium clocks flown around the world,
        agreement with theory to within the experimental error). A watch on
        the GPS satellite is corrected for both effects daily; without the
        correction, the GPS position would drift by ten kilometres a day.
      </p>
      <p>
        The watch is no longer a passive recorder. <strong>The watch is a
        probe.</strong> The dial is reading something that depends on where it
        is and how it is moving. Time Pop's interest in this is practical: a
        dossier that quotes a 1970s service interval without acknowledging that
        the watch was probably running slow at the bottom of a salt-mine
        window is missing the point. The new physics is the new ground; the
        catalogue sits on it.
      </p>
      <p className="dim">
        <em>Public knowledge:</em> the cheapest commercial atomic clock, the
        Microsemi SA.45s, fits in a matchbox and loses less than a second per
        thousand years. A 1980s quartz watch loses about one second per day.
        Einstein's math is what made the atomic clock possible; the atomic
        clock is what made the smartphone's "exact time" a non-event.
      </p>
    </article>
  )
}

function FirstWatchCard({ hero }: { hero?: WatchmakingArtifact }) {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">01.3 · THE INSTRUMENT</span>
      <h3 className="wmp-h3">The first watch, and the slow birth of the mechanical hour.</h3>
      {hero && <ArtifactFigure a={hero} />}
      <p>
        For most of human history, "the hour" did not exist. Sundials, water
        clocks, candle clocks, and hourglasses measured intervals — but the
        intervals were local, approximate, and (for the sundial) wiped out
        every time the sky was. The word <em>watch</em> originally meant
        <em> a period of being awake</em> — the watch on a ship, the watch
        in a guard-house, the night-watch. The mechanical <em>time</em>-watch
        is younger than the word.
      </p>
      <p>
        The first mechanical clocks appeared in European bell towers around
        1280 — no one knows exactly where, and the candidates (Dunstable,
        Milan, Padua) are still argued over. They had no dials and no hands.
        They struck the hour on a bell. The hour, until that moment, had
        been twelve divisions of the day, varying in length with the season.
        The mechanical clock made the hour <strong>equal</strong>. It did
        not measure time better. It made time <em>uniform</em>, and that
        turned out to be the bigger change.
      </p>
      <p>
        The clock moved from the bell tower to the domestic mantel in the
        1400s, and from the mantel to the pocket in the 1500s. Each move
        shrank the timepiece and grew the dependency. The Prague Orloj, on
        the wall of the Old Town Hall, is the public face of the change: the
        first place the citizen was told, by mechanism, what the hour was.
        That the city built the clock and not the other way around is the
        political reading. That it is still working, in 2026, is the
        engineering one.
      </p>
      <p className="dim">
        <em>Public knowledge:</em> the verge-and-foliot escapement, the
        first reliable way to make a wheel release a gear-train in equal
        ticks, was described in writing around 1325; the diagram survives
        in the <em>De Horologiorum Descriptione</em> (early 14th century).
        It is the ancestor of every escapement in every watch you have
        ever held.
      </p>
    </article>
  )
}

function FirstPocketWatchCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">01.4 · THE POCKET</span>
      <h3 className="wmp-h3">The first pocket watch — Peter Henlein, Nuremberg, c. 1510.</h3>
      <p>
        Around 1510, a locksmith named Peter Henlein in Nuremberg made the
        first portable timepiece that could be carried in a pocket and that
        ran for more than a few hours between windings. The mainspring — a
        coiled steel ribbon that stores energy as it is wound and releases
        it as it unwinds — had been known for centuries, but Henlein is
        the first name attached to <em> putting it inside a watch-shaped
        case</em>. The watch was about five centimetres across, weighed
        around 100 grams, and was probably worn on a chain around the
        neck rather than in a pocket (pockets being a 17th-century
        invention).
      </p>
      <p>
        The accuracy of a Henlein is, by modern standards, awful: a
        half-hour a day was a fine result. The point was not accuracy. The
        point was that the hour <strong>belonged to a person</strong>. The
        bell tower had made the hour civic; Henlein made the hour private.
        From 1510 onward, you could be on time without the city's bell
        being the reason.
      </p>
      <p>
        What followed was 350 years of craft — verge escapements
        (1500s), balance springs (Huygens, 1675), lever escapements
        (Thomas Mudge, 1769), detent escapements (John Arnold, 1778),
        ruby jewels (Nicole, 1704), anti-shock systems (Rolex, 1932) —
        each one buying an order of magnitude of accuracy. The Henlein
        lost half an hour a day; the 1970s quartz loses half a second a
        month. The arithmetic is the entire history of the craft in two
        numbers.
      </p>
      <p className="dim">
        <em>Public knowledge:</em> only four signed Henlein watches
        survive. The oldest, the <em>Pomander</em> in the Germanisches
        Nationalmuseum, dates to 1520 and is no longer running — the
        spring has been removed for preservation.
      </p>
    </article>
  )
}

function QuartzCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">01.5 · THE CRACK</span>
      <h3 className="wmp-h3">The quartz revolution — Seiko Astron, 25 December 1969.</h3>
      <p>
        On Christmas Day 1969, Seiko shipped the Astron 35A, the world's
        first quartz wristwatch. It weighed about as much as a small apple,
        cost the same as a small car (¥450,000, then about $1,250), and
        lost or gained less than a second a month. Mechanical watches of
        the same year lost or gained about ten seconds a day. The
        arithmetic was a one-line obituary for the mechanical era —
        except it was not.
      </p>
      <p>
        The Swiss industry lost roughly two-thirds of its jobs in the
        1970s and 1980s. Cheap, more accurate, battery-powered, with no
        artisan to pay: quartz should have ended watchmaking. It did not.
        It <strong> changed what watchmaking was selling</strong>. The
        mechanical watch stopped competing on accuracy and started
        competing on what the quartz could not offer: a hand-finished
        movement, a 300-year lineage, a thing that can be inherited. The
        1970s, which should have been the end, are now considered the
        decade the luxury watch was invented.
      </p>
      <p>
        Time Pop sits squarely in the after-quartz world. The
        collectible-watch market is, almost by definition, the market
        for the objects that survived quartz. A mechanical movement on
        a dossier is, in part, a citation of the post-1969 decision:
        a watch was chosen, in a world that had a better alternative,
        for reasons that have nothing to do with the time. The catalogue
        is the long version of that sentence.
      </p>
      <p className="dim">
        <em>Public knowledge:</em> the quartz crystal oscillator was
        invented by Walter Cady in 1921, miniaturised for the wrist by
        Seiko engineers between 1957 and 1969, and the patent has
        long since expired. The Seiko Astron was limited to 100 pieces
        and is, today, one of the most-cited modern collectibles.
      </p>
    </article>
  )
}

function SmartphoneCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">01.6 · THE SECOND CRACK</span>
      <h3 className="wmp-h3">The smartphone/watch era — the question is asked again.</h3>
      <p>
        The same logic that ended Swiss watchmaking in 1970 should have
        ended it again in 2015. Every smartphone has an accurate clock
        that synchronises to an atomic reference, costs nothing, and is
        always in your hand. The mechanical wristwatch is, in pure
        functional terms, redundant. It is also, in 2026, in the middle
        of a multi-year price recovery after a thirteen-quarter
        correction, and the Apple Watch outsells the entire Swiss
        industry ten times over.
      </p>
      <p>
        The post-2015 story is the post-1969 story with a different
        antagonist. Quartz was better and cheaper than mechanical, and
        mechanical survived by becoming a craft object. The smartphone
        is better and free than mechanical, and mechanical — so far —
        has survived by becoming a <strong>collection</strong> object.
        The decision to wear a mechanical watch in 2026 is, like the
        decision to wear one in 1980, a citation of intent: the wearer
        is opting into the lineage, the craft, and the second-hand
        market, against a tool that is, on the merits, technically
        superior.
      </p>
      <p>
        Time Pop's role in this is the same as the role of the
        post-quartz catalogues: to make the choice legible. A dossier
        on a 1972 Royal Oak 5402 is not just a watch — it is a sentence
        about what the buyer believes the watch will still mean in
        2056. The catalog's job is to make the data behind that belief
        findable, citable, and not made up.
      </p>
      <p className="dim">
        <em>Public knowledge:</em> the Apple Watch shipped 9 April 2015.
        In its first decade, Apple sold more watches than the entire
        Swiss watch industry had made in its first century. The
        mechanical watch survived the first disruption; the second is
        still being written.
      </p>
    </article>
  )
}

// ── 02 CRAFT — the existing articles, unchanged in voice, retitled ─────────

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
        The second made a watch, suddenly, a piece of equipment. The labour
        movement, the industrial timetable, the 40-hour week, the global trade
        market — every one of these assumes the second, and the second assumes the
        clock.
      </p>
    </article>
  )
}

function AnatomyCard({ shots }: { shots: WatchmakingArtifact[] }) {
  const [mainspring, barrel, lever, pallet, balance, jewels] = shots
  return (
    <article className="wmp-frame">
      <span className="eyebrow">WHAT IS ACTUALLY INSIDE</span>
      <h2 className="wmp-h2">Six parts that any watchmaker can name, and what they do.</h2>
      <p>
        A mechanical movement is a closed-loop system with one job: turn stored
        energy into a counting of equal ticks. The parts below are the standard
        vocabulary. A watchmaker reading this list will not learn anything new,
        and that is the test.
      </p>
      <div className="wmp-parts">
        {mainspring && <figure className="wmp-part">
          <img src={mainspring.local} alt={mainspring.caption} loading="lazy" />
          <figcaption>
            <strong className="mono">MAINSPRING</strong>
            <p>{mainspring.caption}</p>
            <p className="mono micro dim">{mainspring.license} · Commons</p>
          </figcaption>
        </figure>}
        {barrel && <figure className="wmp-part">
          <img src={barrel.local} alt={barrel.caption} loading="lazy" />
          <figcaption>
            <strong className="mono">GOING BARREL</strong>
            <p>{barrel.caption}</p>
            <p className="mono micro dim">{barrel.license} · Commons</p>
          </figcaption>
        </figure>}
        {lever && <figure className="wmp-part">
          <img src={lever.local} alt={lever.caption} loading="lazy" />
          <figcaption>
            <strong className="mono">LEVER ESCAPEMENT</strong>
            <p>{lever.caption}</p>
            <p className="mono micro dim">{lever.license} · Commons</p>
          </figcaption>
        </figure>}
        {pallet && <figure className="wmp-part">
          <img src={pallet.local} alt={pallet.caption} loading="lazy" />
          <figcaption>
            <strong className="mono">PALLET FORK</strong>
            <p>{pallet.caption}</p>
            <p className="mono micro dim">{pallet.license} · Commons</p>
          </figcaption>
        </figure>}
        {balance && <figure className="wmp-part">
          <img src={balance.local} alt={balance.caption} loading="lazy" />
          <figcaption>
            <strong className="mono">BALANCE WHEEL</strong>
            <p>{balance.caption}</p>
            <p className="mono micro dim">{balance.license} · Commons</p>
          </figcaption>
        </figure>}
        {jewels && <figure className="wmp-part">
          <img src={jewels.local} alt={jewels.caption} loading="lazy" />
          <figcaption>
            <strong className="mono">JEWELS</strong>
            <p>{jewels.caption}</p>
            <p className="mono micro dim">{jewels.license} · Commons</p>
          </figcaption>
        </figure>}
      </div>
    </article>
  )
}

function WhyItMattersCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">WHY THE PARTS MATTER</span>
      <h2 className="wmp-h2">The parts matter because the craft survives them.</h2>
      <p>
        Most luxury purchases are sold on the basis of what they look like from
        the outside. A watch is the rare object where the inside is the
        argument. The case hides the movement; the movement is the watch. The
        finish on a bridge, the polish on a bevel, the chaton of a ruby
        jewel — these are things the buyer pays for, and most buyers never
        see. The system that delivers them is a 250-year-old guild tradition,
        and the system is what is being collected.
      </p>
      <p>
        A watch that breaks and is repaired with the wrong part is no longer
        the same watch. The audit trail of a service history is, in this
        sense, not a footnote — it is the watch. Time Pop's dossier keeps the
        trail where the trail is documented, and the absence where it is not.
      </p>
    </article>
  )
}

function ComplicationsCard({ shots }: { shots: WatchmakingArtifact[] }) {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">COMPLICATIONS</span>
      <h2 className="wmp-h2">A complication is a movement that does more than count seconds.</h2>
      <p>
        In horological vocabulary, anything beyond the hours, minutes, and
        seconds is a "complication" — a tongue-in-cheek term for the fact
        that a calendar is technically a second machine bolted on to the
        first. A chronograph adds a stopwatch. A tourbillon (literally
        "whirlwind") rotates the escapement to cancel out positional errors
        caused by gravity. A minute repeater chimes the time on demand.
      </p>
      <Gallery items={shots} />
      <p>
        A complication is the easiest part of a watch to fake. A printed
        subdial looks like a chronograph; a quartz watch with a decorated
        rotor looks like an automatic. The dossier splits these honestly:
        the watch is what the maker signed, and the rest is a sentence the
        catalogue will not write for you.
      </p>
    </article>
  )
}

// ── 03 ERAS — periods, learn to look, key movements ────────────────────────

function PeriodsCard({ shots }: { shots: WatchmakingArtifact[] }) {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">PERIODS</span>
      <h2 className="wmp-h2">Five periods that explain why the catalogue looks the way it does.</h2>
      <ol className="wmp-periods">
        <li>
          <span className="mono wmp-period-year">1770–1820</span>
          <div>
            <strong>The pocket watch as a status object.</strong> The British chronometer
            era (Harrison H4, 1761) made portable time precise enough for longitude at
            sea. Pocket watches for the gentleman followed. Cases were enamel, movements
            were lever or verge.
          </div>
        </li>
        <li>
          <span className="mono wmp-period-year">1820–1914</span>
          <div>
            <strong>The Swiss industrial era.</strong> Interchangeable parts, the
            American System of Watch Manufacturing, and the Swiss réponse. The
            movements become industrially accurate; the cases become jewellery.
          </div>
        </li>
        <li>
          <span className="mono wmp-period-year">1914–1969</span>
          <div>
            <strong>The wristwatch.</strong> World War I makes the wristwatch a
            soldier's tool. Patek, Rolex, and Omega become the household names
            of the 1950s. The Speedmaster earns the Moonwatch designation in
            1969 (Apollo 11).
          </div>
        </li>
        <li>
          <span className="mono wmp-period-year">1969–2007</span>
          <div>
            <strong>The quartz crisis and the luxury reinvention.</strong> The
            Seiko Astron ships in 1969. The Swiss industry loses two-thirds of
            its jobs. The luxury mechanical watch is invented: Patek Philippe
            perpetuates the calendar; Audemars Piguet launches the Royal Oak
            (1972); the steel sports watch becomes a piece of jewellery.
          </div>
        </li>
        <li>
          <span className="mono wmp-period-year">2007–</span>
          <div>
            <strong>The smartphone era.</strong> The iPhone ships in 2007. The
            Apple Watch follows in 2015. The mechanical wristwatch survives as
            a collection object, the same way it survived quartz — by being
            the thing the cheaper alternative is not.
          </div>
        </li>
      </ol>
      <Gallery items={shots} />
    </article>
  )
}

function LearnToLookCard({ shot }: { shot?: WatchmakingArtifact }) {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">HOW TO LOOK AT ONE</span>
      <h2 className="wmp-h2">Five things you can check in sixty seconds.</h2>
      <p>
        You do not need a loupe to read a watch. You need five things to
        look for, in this order, and about a minute.
      </p>
      <ol className="wmp-look">
        <li>
          <strong>1. The dial.</strong> Print, not stamp. The hour markers
          should be the same height and the same finish. A loupe helps;
          a phone camera zoomed in will do.
        </li>
        <li>
          <strong>2. The hands.</strong> They should be the same finish,
          the same height at the centre, and they should not catch each
          other when they overlap at 10:10. If they catch, the movement
          has been re-assembled by a careless hand.
        </li>
        <li>
          <strong>3. The case.</strong> Edges, lugs, and crown guards
          should be sharp. Over-polishing is the most common way a
          genuine watch is repriced downward.
        </li>
        <li>
          <strong>4. The serial.</strong> Between the lugs, on the case,
          and on the movement. Three serials, ideally all matching the
          same production year.
        </li>
        <li>
          <strong>5. The crown.</strong> The crown should sit in the
          crown tube without wobble. A worn crown tube is the first sign
          the watch has spent years in a drawer without a service.
        </li>
      </ol>
      {shot && <ArtifactFigure a={shot} />}
    </article>
  )
}

function KeyMovementsCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">FIVE KEY MOVEMENTS</span>
      <h2 className="wmp-h2">The five movements every collector should be able to point to.</h2>
      <ol className="wmp-movements">
        <li>
          <strong>The verge escapement</strong> (c. 1325). The first way to
          make a wheel release a gear train in equal ticks. Pre-Huygens,
          pre-balance-spring, pre-pendulum. Every escapement descends from
          it.
        </li>
        <li>
          <strong>The pendulum clock</strong> (Huygens, 1656). Accuracy
          jumps by roughly sixty times overnight. The clock is no longer
          a curiosity; it is a scientific instrument.
        </li>
        <li>
          <strong>The lever escapement</strong> (Thomas Mudge, 1769). The
          ancestor of the modern Swiss lever, which still ticks in roughly
          95% of mechanical wristwatches.
        </li>
        <li>
          <strong>The tourbillon</strong> (Breguet, 1801). The escapement
          is mounted in a rotating cage to cancel the gravitational error
          that comes from a watch sitting in one position for hours. A
          tourbillon is, mathematically, no longer needed in a wristwatch
          (your wrist moves enough to cancel the error) — but the craft
          persists for the same reason the answer does.
        </li>
        <li>
          <strong>The quartz oscillator</strong> (Cady, 1921; miniaturised
          for the wrist by Seiko, 1969). The watch is no longer a
          mechanical object. The clock has moved inside the crystal.
        </li>
      </ol>
    </article>
  )
}

// ── 04 LEARN — glossary, methodology, register, paper ──────────────────────

function NextReadsCard() {
  return (
    <article className="wmp-frame">
      <span className="eyebrow">WHERE TO GO NEXT</span>
      <h2 className="wmp-h2">Four doors, each one opens onto a different way to use the catalogue.</h2>
      <div className="wmp-next-grid">
        <Link to="/glossary" className="wmp-next-card">
          <span className="mono wmp-next-kicker">01 · VOCABULARY</span>
          <h3>Glossary</h3>
          <p>The terms a watchmaker uses without thinking — and the ones a buyer needs to be able to spot in a description.</p>
          <span className="mono wmp-next-cta">READ THE GLOSSARY →</span>
        </Link>
        <Link to="/methodology" className="wmp-next-card">
          <span className="mono wmp-next-kicker">02 · METHODOLOGY</span>
          <h3>Methodology</h3>
          <p>How a dossier is built, what the honesty ladder is, and what the system refuses to publish.</p>
          <span className="mono wmp-next-cta">READ THE METHOD →</span>
        </Link>
        <Link to="/register" className="wmp-next-card">
          <span className="mono wmp-next-kicker">03 · CATALOGUE</span>
          <h3>Register</h3>
          <p>{`Every reference in the catalogue, with its dossier, comps, and provenance timeline. The thing this page is about.`}</p>
          <span className="mono wmp-next-cta">BROWSE THE REGISTER →</span>
        </Link>
        <Link to="/paper" className="wmp-next-card">
          <span className="mono wmp-next-kicker">04 · WORKING PAPER</span>
          <h3>Working Paper</h3>
          <p>The long-form version of the argument, with the math and the sources. The thing the catalogue is built on.</p>
          <span className="mono wmp-next-cta">READ THE PAPER →</span>
        </Link>
      </div>
    </article>
  )
}

// ── the page ───────────────────────────────────────────────────────────────

export default function Watchmaking() {
  const data = useDataset()
  const [artifacts, setArtifacts] = useState<WatchmakingArtifact[]>([])
  const [policy, setPolicy] = useState('')
  const [tab, setTab] = useState<TabId>('time')

  // If the URL has a hash, treat it as a tab selector so deep links work
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '')
    if (hash === 'craft' || hash === 'eras' || hash === 'learn' || hash === 'time') {
      setTab(hash as TabId)
    }
  }, [])

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
      <HeroBanner
        bg="/heroes/watchmaking.jpg"
        hue="teal"
        size="lg"
        alt="Pop-art sepia collage of vintage watches, classic characters, and the history of horology"
        eyebrow="WATCHMAKING · A PAGE ABOUT THE CRAFT, AND THE TIME IT IS ABOUT"
        title={<>A watch is a philosophy instrument that happens to be worn on the wrist.</>}
        subtitle={
          <>
            Four sub-tabs. The first is the question of time itself — Hume, Einstein,
            the first watch, the first pocket watch, quartz, the smartphone. The
            second is what is inside a mechanical watch, why the parts matter, and
            how the craft survives. The third is the eras. The fourth is where to
            go next. Nothing is invented. Every figure is Wikimedia Commons.
          </>
        }
        primary={{ to: '#time', label: '01 · START WITH THE QUESTION OF TIME ↓' }}
        secondary={{ to: '/register', label: `BROWSE ALL ${data?.count ?? 0} REFERENCES →` }}
        credit="HERO ART · SEPIA COLLAGE — VINTAGE WATCHES, CLASSIC CHARACTERS, HISTORY"
      />
      <p className="crumb"><Link to="/">← HOME</Link></p>

      <nav className="wmp-tabs" aria-label="Watchmaking sub-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`wmp-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => {
              setTab(t.id)
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `#${t.id}`)
              }
            }}
            aria-pressed={tab === t.id}
          >
            <span className="wmp-tab-num mono">{t.num}</span>
            <span className="wmp-tab-label">{t.label}</span>
            <span className="wmp-tab-sub">{t.sub}</span>
          </button>
        ))}
      </nav>

      <div className="wmp-panels">
        {tab === 'time' && (
          <section className="wmp-panel" data-panel="time" id="time">
            <TimeOpening />
            <HumeCard />
            <EinsteinCard />
            <FirstWatchCard hero={bySlot.frame?.[0]} />
            <FirstPocketWatchCard />
            <QuartzCard />
            <SmartphoneCard />
          </section>
        )}

        {tab === 'craft' && (
          <section className="wmp-panel" data-panel="craft" id="craft">
            <FrameCard hero={bySlot.frame?.[0]} />
            <AbstractionCard />
            <AnatomyCard shots={bySlot.anatomy ?? []} />
            <WhyItMattersCard />
            <ComplicationsCard shots={bySlot.complications ?? []} />
          </section>
        )}

        {tab === 'eras' && (
          <section className="wmp-panel" data-panel="eras" id="eras">
            <PeriodsCard shots={bySlot.periods ?? []} />
            <LearnToLookCard shot={bySlot.look?.[0]} />
            <KeyMovementsCard />
          </section>
        )}

        {tab === 'learn' && (
          <section className="wmp-panel" data-panel="learn" id="learn">
            <NextReadsCard />
          </section>
        )}
      </div>

      {policy && (
        <p className="mono micro dim wmp-rights">
          IMAGE RIGHTS · {policy} Every figure links to its Commons file.
        </p>
      )}
    </div>
  )
}
