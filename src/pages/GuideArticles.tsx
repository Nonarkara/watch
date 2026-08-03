// GuideArticles.tsx -- the three article bodies. Each is a discrete piece
// with its own hero color, lead, and body. The voice is Time Pop MITF:
// no "leverage", no "journey", no "ultimately", no "in conclusion". Every claim
// is specific. Every recommendation has a reason that is not "because it is
// nice".

import { Link } from 'react-router-dom'
import { ArticleCallout, type ArticleMeta } from './Guide'

// ─── Article 01: A Watch Is a Feeling, Not a Trophy ──────────────────────────
const ARTICLE_01: ArticleMeta = {
  slug: 'feeling',
  number: '01',
  title: 'A Watch Is a Feeling, Not a Trophy',
  subtitle: 'Why the watch on your wrist should represent you, not the person you want strangers to think you are.',
  minutes: 5,
  hue: 'coral',
  lede: 'We do not have to buy expensive watches. The expensive ones are expensive for a reason. There are good reasons, and there are bad reasons. Here are the bad reasons we do not want you to follow. At the end of the day, what you want is the one that matters, and what is in your heart is the one that is real.',
  body: (
    <>
      <p>
        A watch is a piece of metal, a spring, a gear train, a hands-set, a strap. It is
        also a sentence you repeat to yourself every time you look at the time. The
        sentence can be true or it can be a lie. Most watches sold at the high end of
        the market are sentences someone else wrote for you. You did not choose the
        words. You bought the words.
      </p>

      <h2>The bad reasons to buy an expensive watch</h2>

      <p>
        There are four bad reasons people spend $40,000 on a watch. They all end the same
        way: the watch sits in a safe.
      </p>

      <ol>
        <li>
          <strong>To impress a stranger.</strong> The stranger is not looking at your
          wrist. They are looking at their phone. If they are looking at your wrist,
          they are not the right stranger to impress.
        </li>
        <li>
          <strong>To impress another watch person.</strong> They will admire it for ten
          minutes and then return to the watch on their own wrist. There is no
          permanent win in this.
        </li>
        <li>
          <strong>To invest.</strong> Watches are not investments. They are objects.
          Some objects hold their value. Some go up. Most go down. A watch bought as
          an investment is a watch you should not have bought.
        </li>
        <li>
          <strong>Because the brand told you to.</strong> The brand has a marketing
          budget the size of a small country. The marketing budget is the reason you
          want the watch. The watch is the invoice.
        </li>
      </ol>

      <ArticleCallout kind="good">
        <strong>The good reason to buy an expensive watch:</strong> because the
        specific object, on your wrist, in your life, will be more useful to you
        than the money you spent on it. A $40,000 watch that makes you 1 percent
        more punctual and 2 percent more deliberate for ten years is a better
        return than the same $40,000 in a savings account. A $40,000 watch that
        sits in a safe is a $40,000 lesson in something you do not need.
      </ArticleCallout>

      <h2>The good reasons to buy any watch</h2>

      <p>
        Three good reasons to wear a watch. Pick whichever one fits.
      </p>

      <ol>
        <li>
          <strong>It changes how you act.</strong> Wearing a watch makes you act more
          professional, more rigorous, more cosy, more fun. A watch is a piece of
          theatre you wear. The role changes the actor. A pilot&rsquo;s watch makes
          you sit straighter. A dive watch makes you walk slower. A dress watch makes
          you listen better.
        </li>
        <li>
          <strong>It gives you a constant nudge.</strong> If you are wearing it, it
          gives you a constant and immediate urge to feel different about yourself
          from who you were ten minutes ago. Some objects can do that. Anthropologically,
          that is what objects with meanings are made for: humans give them some of
          the meanings they carry, and that is what makes the objects valuable.
        </li>
        <li>
          <strong>It marks time you can remember.</strong> A watch worn for ten years
          on a specific wrist is a record of those ten years. The scratches are
          dates. The patina is the season. The watch is the diary you did not know
          you were keeping.
        </li>
      </ol>

      <h2>What the watch should represent</h2>

      <p>
        Choose the watch that represents the person you actually are, not the
        person you want strangers to think you are. If those two people are the same,
        congratulations. Most of us are not the same. Most of us are a working
        professional who also runs on weekends. We are a parent who also keeps a
        shelf of unread books. We are a person who likes to be in a room on time and
        also likes to forget the time entirely. The watch for that person is rarely
        the watch that the catalogue describes.
      </p>

      <p>
        The catalogue describes what the watch is. The wrist decides what the watch
        means. The two are different. The catalogue is for the marketing team. The
        wrist is for you.
      </p>

      <ArticleCallout kind="note">
        <strong>The first question, before any price:</strong> what kind of person
        are you, in a room, at the end of a long day, when nobody is watching. The
        watch you want is the one that fits that person. The watch the catalogue
        wants you to want is the one that fits the person the marketing team wishes
        you were.
      </ArticleCallout>

      <h2>The happiness that is in your heart</h2>

      <p>
        The happiness you can get from a watch is the one that is in your heart.
        A $200 watch that you wear every day for ten years is a more valuable watch
        than a $40,000 watch that you wear twice and then store. This is not a
        moral argument. It is a math argument. The first watch produced 3,650
        days of wear. The second produced 2.
      </p>

      <p>
        The watch you wear is the watch you chose. Choosing well is not the same
        as choosing expensively. The most expensive choice is the one that costs
        you the most nights of not wearing it. The least expensive choice is the
        one that becomes part of you, that you forget you are wearing, that
        reminds you of itself only when you want to be reminded.
      </p>

      <p>
        Read the next two guides for the specific watches. They are not
        recommendations. They are starting points. The watch that fits you is the
        one you wear.
      </p>

      <p className="guide-nextup">
        <Link to="/guides/1k">Starting with $1,000 &rarr;</Link>{' '}
        <span className="dim">Article 02, ~7 min</span>
      </p>
    </>
  ),
}

// ─── Article 02: Starting with US$1,000 ─────────────────────────────────────
const ARTICLE_02: ArticleMeta = {
  slug: '1k',
  number: '02',
  title: 'Starting with US$1,000',
  subtitle: 'A hitchhiker\'s guide to the galaxy of watches, with five good places to land.',
  minutes: 7,
  hue: 'yellow',
  lede: 'You do not need $20,000 to wear a good watch. You need a clear sense of what you want a watch to do for you, and a willingness to let a $1,000 watch teach you what a $20,000 watch cannot. Below $1,000 there are honest timepieces, made well, that will guide you toward a better understanding of why a good watch on the wrist is worth more than a $40,000 watch in the safe.',
  body: (
    <>
      <p>
        Below $1,000 you can buy a watch that will outlive the next ten years of
        your life and still keep time within a second a day. You can also buy a
        watch that will fall apart. The $1,000 tier is the place where the
        difference between the two stops being subtle. The 1970s Seiko 5 will
        outlive the 2024 fashion-brand special edition. The 2010s Hamilton Khaki
        will outlive the 2010s microbrand with the better story. The watch is the
        work. The story is the marketing.
      </p>

      <h2>What you are actually buying at $1,000</h2>

      <p>
        The honest answer: you are buying a manufactured movement and a metal case.
        At $1,000 you do not get a hand-finished chronometer. You do not get a
        70-hour reserve. You do not get 18k gold. You get a watch that ticks,
        keeps time, and looks like a watch. That is what a $1,000 watch is for.
      </p>

      <p>
        That is also the entire point. A $1,000 watch teaches you the value of
        timekeeping without teaching you the value of being impressed. It teaches
        you whether you want a dive watch or a dress watch or a field watch. It
        teaches you whether 38mm or 42mm fits your wrist. It teaches you whether
        you actually want a watch at all.
      </p>

      <ArticleCallout kind="good">
        <strong>What a $1,000 watch improves for you:</strong>
        <ul>
          <li><strong>Your dressing.</strong> A watch makes the rest of the outfit
            finish.</li>
          <li><strong>Your dress style.</strong> A watch teaches you which colours
            you wear. A black-dial watch teaches you about black. A white-dial
            watch teaches you about white. A blue-dial watch teaches you about
            blue.</li>
          <li><strong>Your characteristics.</strong> A tool watch teaches you about
            use. A dress watch teaches you about restraint. A pilot watch teaches
            you about legibility.</li>
          <li><strong>Your impression on people.</strong> A watch is the one piece
            of jewellery that, in a business meeting, a stranger is allowed to
            ask about. It is the one piece of you that other people see first.</li>
        </ul>
      </ArticleCallout>

      <h2>Five good places to land at $1,000</h2>

      <p>
        These are five watches under $1,000 that, in 2026, do what a $1,000 watch
        is supposed to do. None of them are investment pieces. None of them will
        be on a Hodinkee cover. They are honest, well-made, comfortable, and
        durable. Each has a specific reason it is on the list.
      </p>

      <h3>1. The Tissot PRX ($425-$700)</h3>
      <p>
        A 1978 Tissot reissue with a Swiss-made automatic movement and an
        integrated bracelet. The design is a deliberate echo of the late-1970s
        Royal Oak, the kind of watch you cannot afford but can wear. At $425 in
        quartz and $700 in automatic, the PRX is the only watch on this list
        that you can put on at 8 AM, walk into any room, and never think about
        again. The integrated bracelet does not catch on shirt cuffs. The dial
        is legible from across a table. The movement is not exotic. It does not
        need to be. The PRX is the daily watch for the person who does not want
        to think about watches.
      </p>

      <h3>2. The Seiko SRPD55 "5KX" ($425)</h3>
      <p>
        The 2019 reissue of the legendary SKX007, with the 4R36 hand-wind-and-hack
        automatic and a 42.5mm case. The SKX was the watch that taught a generation
        of buyers what a real dive watch was supposed to be. The 5KX is the same
        lesson with better lume, better water resistance, and the option to
        hand-wind. It is a tool. It will outlast the next three presidents. The
        5KX is the watch for the person who wants a watch they can drop, scratch,
        swim with, and never think about.
      </p>

      <h3>3. The Hamilton Khaki Field 38mm ($595)</h3>
      <p>
        A 38mm field watch with the H-10 movement (80-hour reserve) and a bead-blasted
        matte case. The Khaki Field is the cheapest watch on this list and the
        one most people will tell you is "the one to start with." That advice is
        correct, not because the Khaki is the best watch you can buy, but because
        it is the most honest. There is nothing extra on a Khaki. The dial tells
        time. The case holds the dial. The strap holds the case. That is all.
        The Khaki is the watch for the person who is suspicious of decoration.
      </p>

      <h3>4. The Casio G-Shock GA-2100 "Casioak" ($100)</h3>
      <p>
        A 2019 G-Shock with a 45.4mm carbon-core case, an octagonal bezel that
        collectors nicknamed the "Casioak," and a 100-meter water resistance.
        The Casioak is the cheapest watch on this list and the most durable. It
        is the watch a doctor wears on a 36-hour shift. It is the watch a
        paramedic wears to a call. It is the watch a parent wears to a kid&rsquo;s
        soccer game. It does not look like a Royal Oak. It looks like a Casioak,
        which is a better thing to look like. The Casioak is the watch for the
        person who needs a watch, not a piece of jewellery.
      </p>

      <h3>5. The Timex M41 (under $250)</h3>
      <p>
        A 40mm automatic dress watch with a 1970s design, a domed acrylic crystal,
        and a 21-jewel mechanical movement. The M41 is the cheapest mechanical
        watch on this list. It does not have a date window. It does not have
        applied indices. It has a printed dial, a steel case, and a Sellita
        automatic that runs at 28,800 vph. The M41 is the watch for the person
        who wants a watch that costs less than a weekend trip but reads like
        something a grandparent would have worn to the office in 1972. The
        aesthetic is honest. The price is honest. The watch will outlive you.
      </p>

      <h2>The trade-off</h2>

      <p>
        The trade-off at $1,000 is between <strong>investment</strong> and{' '}
        <strong>companion</strong>. A $1,000 watch is not an investment. It will
        not go up in value. A Tudor Black Bay 58 will. A Rolex Submariner will.
        But the Black Bay 58 is $4,000 and the Submariner is $10,000. If you
        have $1,000, you do not have an investment. You have a companion. The
        companion is the watch you wear every day for five years and then pass to
        a sibling. The investment is the watch you keep in a safe and explain to
        guests. The companion is the watch that does the work. The investment is
        the watch that does the work of being admired.
      </p>

      <ArticleCallout kind="bad">
        <strong>The trap at $1,000:</strong> buying a $1,000 watch that you have
        been told is &ldquo;the next Rolex.&rdquo; There is no next Rolex. The
        Rolex is the Rolex. The $1,000 watch is the $1,000 watch. If you want
        the $1,000 watch to be the Rolex, you will be disappointed. If you want
        the $1,000 watch to be the $1,000 watch, you will be the kind of person
        who wears a watch and never has to explain it.
      </ArticleCallout>

      <p className="guide-nextup">
        <Link to="/guides/upgrade">The $2,000 / $5,000 / $10,000 upgrade path &rarr;</Link>{' '}
        <span className="dim">Article 03, ~8 min</span>
      </p>
    </>
  ),
}

// ─── Article 03: The $2,000 / $5,000 / $10,000 Upgrade Path ──────────────────
const ARTICLE_03: ArticleMeta = {
  slug: 'upgrade',
  number: '03',
  title: 'The $2,000, $5,000, and $10,000 Upgrade Path',
  subtitle: 'You wore a $1,000 watch for two years and now you want more. Here is the honest next step at each price.',
  minutes: 8,
  hue: 'navy',
  lede: 'The upgrade is not &ldquo;spend more.&rdquo; The upgrade is &ldquo;spend more on the right thing, and only on the right thing.&rdquo; Below is a $2,000, a $5,000, and a $10,000 watch at each price. Each one is scored on the same four axes the register uses for every dossier -- Rarity, Demand, Provenance, Resellability. The numbers are real, the comps are real, the design trade-offs are real.',
  body: (
    <>
      <p>
        You have worn a $1,000 watch for two years. You know what a watch does
        for you. You know you want a watch on your wrist. The question is: which
        $5,000 watch do you buy, and which $10,000 watch, and which $2,000 watch.
        The answer depends on which direction your $1,000 watch taught you to
        want.
      </p>

      <p>
        If the $1,000 watch was a dive watch, the upgrade is a dive watch. If the
        $1,000 watch was a dress watch, the upgrade is a dress watch. The upgrade
        is not a search for a different category. The upgrade is a search for a
        better version of the same category. The person who learned from a
        Tissot PRX does not want a Submariner. The person who learned from a
        Tissot PRX wants a better integrated-bracelet sport watch, and the
        answer at $5,000 is the Grand Seiko SBGA413, and the answer at $10,000
        is the Rolex Datejust. The categories are the same. The execution is
        finer.
      </p>

      <h2>At $2,000: the dive watch upgrade</h2>

      <p>
        You wore a Seiko 5KX. The dive watch taught you about bezel rotation,
        water resistance, the way a tool watch wears on the wrist. The upgrade
        at $2,000 is the <strong>Longines Spirit Zulu Time ($2,150)</strong>.
        The Spirit is a GMT with a 39mm case, a 72-hour reserve, a bidirectional
        bezel, and the L844.4 caliber (a chronometer-grade automatic). The
        Spirit is the watch a Patek Philippe engineer wears to the office. The
        Spirit is the watch a Tudor collector borrows when they want a watch that
        does not look like a Tudor.
      </p>

      <h2>At $5,000: the integrated-bracelet upgrade</h2>

      <p>
        You wore a Tissot PRX. The integrated bracelet taught you about the
        Royal Oak shape. The upgrade at $5,000 is the <strong>Grand Seiko
        SBGA413G ($5,600)</strong>. The SBGA413G is a 40mm Spring Drive with a
        72-hour reserve, a 62GS-style bezel-less case, and the famous &ldquo;sakura
        pink&rdquo; dial. The Spring Drive is the only movement in the world that
        combines quartz accuracy with mechanical elegance. The seconds hand
        sweeps perfectly, with no tick. The dial is a painting. The case is
        brushed and polished by hand in the Shiojiri studio. The SBGA413G is
        the watch that makes the Royal Oak look obvious. It is the same
        integrated-bracelet idea executed with more restraint, more craft, and
        more silence.
      </p>

      <h2>At $10,000: the daily-watch upgrade</h2>

      <p>
        You wore a Hamilton Khaki Field. The honest dial taught you that you do
        not need decoration. The upgrade at $10,000 is the <strong>Rolex
        Datejust 41 ($9,500)</strong>. The Datejust is the most-cited watch in
        the world, the most-photographed watch in the world, and the most
        copied watch in the world. The Datejust 41 is also the watch you can
        wear with a suit, with a sweater, with a t-shirt, with a wetsuit, and
        never think about. The Datejust 41 is the daily watch. The Datejust
        41 is the watch that says: I have a watch, and the watch is fine.
      </p>

      <h2>Three watches, three directions</h2>

      <p>
        The $2,000 Longines, the $5,000 Grand Seiko, and the $10,000 Rolex are
        three different answers to the same question. The question is not
        &ldquo;which is the best watch.&rdquo; The question is &ldquo;which direction
        are you walking.&rdquo;
      </p>

      <table className="pick-table">
        <thead>
          <tr><th>Watch</th><th>Price</th><th>What it teaches</th><th>Rarity</th><th>Demand</th><th>Provenance</th><th>Resellability</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Longines Spirit Zulu Time</strong><br /><span className="dim mono">L3.821.1.53.2 &middot; 39mm GMT</span></td>
            <td className="mono">$2,150</td>
            <td>GMT is the complication that teaches you about time zones. The Spirit is the cleanest GMT under $3,000.</td>
            <td><span className="score-chip score-chip--neutral">N &middot; NEUTRAL</span></td>
            <td><span className="score-chip score-chip--neutral">D &middot; NEUTRAL</span></td>
            <td><span className="score-chip score-chip--neutral">P &middot; NEUTRAL</span></td>
            <td><span className="score-chip score-chip--strong">R &middot; STRONG</span></td>
          </tr>
          <tr>
            <td><strong>Grand Seiko SBGA413G</strong><br /><span className="dim mono">Spring Drive &middot; 40mm dress</span></td>
            <td className="mono">$5,600</td>
            <td>Spring Drive is the only movement in the world. The dial is hand-painted in Shiojiri. It is the watch that makes every other dress watch feel hurried.</td>
            <td><span className="score-chip score-chip--neutral">N &middot; NEUTRAL</span></td>
            <td><span className="score-chip score-chip--strong">D &middot; STRONG</span></td>
            <td><span className="score-chip score-chip--neutral">P &middot; NEUTRAL</span></td>
            <td><span className="score-chip score-chip--neutral">R &middot; NEUTRAL</span></td>
          </tr>
          <tr>
            <td><strong>Rolex Datejust 41</strong><br /><span className="dim mono">126334 &middot; 41mm three-hand</span></td>
            <td className="mono">$9,500</td>
            <td>The most-cited watch in the world. The most-flipped watch in the world. The watch that says "I have a watch" and does not say anything else.</td>
            <td><span className="score-chip score-chip--strong">N &middot; STRONG</span></td>
            <td><span className="score-chip score-chip--strong">D &middot; STRONG</span></td>
            <td><span className="score-chip score-chip--strong">P &middot; STRONG</span></td>
            <td><span className="score-chip score-chip--strong">R &middot; STRONG</span></td>
          </tr>
        </tbody>
      </table>

      <p className="dim micro">Scores derived from the dossier pages for each watch: Time Pop computes Rarity from a 5-signal index, Demand from a 5-component index, Provenance from sourced events, Resellability from a 4-signal index (liquidity, venue diversity, sale recency, confidence). See the methodology page for the formulas.</p>

      <ArticleCallout kind="note">
        <strong>The honest truth about the upgrade:</strong> at $2,000 you are
        buying a better tool. At $5,000 you are buying better craft. At $10,000
        you are buying a name. None of the three is the wrong answer. The
        Longines will outlive the Grand Seiko. The Grand Seiko will look better
        than the Rolex. The Rolex will hold its value better than the Longines.
        Pick the one that fits the person you are, not the person the catalogue
        wants you to be.
      </ArticleCallout>

      <h2>When to stop upgrading</h2>

      <p>
        Stop at the watch you wear every day. Stop at the watch you forget you
        are wearing. Stop at the watch that you would not lend to a friend,
        not because you do not trust the friend, but because the watch is part
        of you. The upgrade is not a number. The upgrade is a feeling. The
        feeling is the one that the first guide described: the watch on your
        wrist, in your life, doing the work it was bought to do.
      </p>

      <p>
        The register at <Link to="/register">/register</Link> has 260 references
        scored on the same four axes. Start there if you want to look past these
        three. The recommendation here is not the only answer. It is the answer
        that fits the most people. Your answer is the one that fits you.
      </p>

      <p className="guide-nextup">
        <Link to="/">&larr; Back to the home page</Link>{' '}
        <span className="dim">and start browsing the 260 dossiers</span>
      </p>
    </>
  ),
}

export const ARTICLES: ArticleMeta[] = [ARTICLE_01, ARTICLE_02, ARTICLE_03]

export function getArticle(slug: string): ArticleMeta | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null
}
