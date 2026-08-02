export default function Methodology() {
  return (
    <>
      <p className="eyebrow">Methodology</p>
      <h1 className="pagetitle">How every number is made</h1>
      <div className="prose">
        <p>
          The register works on one rule: every published number is a pure function of cited public
          evidence. Each card stores its raw facts — verified sales with URLs, retail prices with
          sources, dated provenance events with sources — and a build script computes everything else.
          Nothing in the computed layer is typed in by hand. Run the build twice on the same evidence
          and you get byte-identical numbers.
        </p>

        <h2>The pipeline, in four steps</h2>
        <p>
          <strong>Collect.</strong> Sold prices from auction results pages. Retail prices from brands
          and dated press coverage. Provenance events from the public record. Every fact keeps its URL.<br />
          <strong>Verify.</strong> A validator rejects any card with an unsourced number, a future
          date, or a sale marked non-comparable without a written reason. A failing card blocks the
          whole build.<br />
          <strong>Compute.</strong> Deterministic scripts turn the evidence into the metrics below.
          Same evidence in, same numbers out — to the byte.<br />
          <strong>Publish or refuse.</strong> Enough evidence produces a number with its sample size,
          window, and stated limit attached. Not enough produces a visible refusal with the reason.
          There is no third option.
        </p>

        <h2>How to read a card in thirty seconds</h2>
        <p>
          Look at the confidence grade first — A, B, or C tells you how much sale evidence stands
          behind the card. Then the market estimate and its <em>n</em>: the number of sales it rests
          on. Then the price band, which names the market segment. Then check "k of 5" on the two
          indices — a score built from five signals beats the same score built from two. Everything
          else is depth. A dash is never a zero; it is the register telling you the evidence is not
          there.
        </p>

        <h2>The register scores references. You must judge the example.</h2>
        <p>
          This is the sharpest limit of the whole system, so it comes early. A card describes a
          <em> reference</em> — every Daytona 116500LN as a class. The watch in front of you is an
          <em> example</em>, and collector research is blunt about what decides an example's value:
          condition and originality first, documentation second. An over-polished case or swapped
          parts can cut a price by 30–50%. A full set — original box, papers, service records —
          typically adds 10–25%, sometimes far more. None of that is visible from public sales data,
          so the register does not score it. Use the card to understand the market; use your eyes, a
          loupe, and a qualified watchmaker to judge the watch.
        </p>

        <h2>What we refuse to do</h2>
        <p>
          Most watch price guides fail by pretending to know more than they do. The register encodes
          the opposite: below three verified sales, there is no market estimate — you see the
          individual sales, cited, and nothing more. No published retail price means no
          premium-to-retail figure. When evidence goes stale, the estimate says so on its face. Empty
          fields render as an em dash with the reason, never as a zero and never as a guess.
        </p>

        <h2>Market estimate</h2>
        <p>
          Verified sold prices (auction results, documented sales) within a trailing 12-month window,
          widening to 24 then 36 months when thin. Eight or more sales: a 20%-trimmed mean with the
          interquartile band. Three to seven: the median with the min–max range. Fewer than three:
          no estimate. Asking prices are never sales and never enter the estimate.
        </p>

        <h2>What counts as comparable</h2>
        <p>
          A sale only enters the estimate if it is the same object the card describes. A
          Tiffany-signed dial, a watch owned by someone famous, a charity lot bid far above the
          market, a different case metal — each of these prices a different thing, however similar
          the reference number looks. Those sales stay on the card, cited, under "variant sales",
          and are excluded from the average. This matters more than it sounds: three special lots,
          averaged in, once produced a 729% premium on an otherwise ordinary steel Nautilus.
        </p>

        <h2>Vs retail, and the inflation adjustment</h2>
        <p>
          Premium is the estimate against the brand's published US retail price — current price for
          watches in production, final price (labeled with its year) for discontinued references.
          Price change over one and five years compares windowed medians, then deflates by the US
          Consumer Price Index (FRED, CPIAUCSL) so a "gain" that merely tracked inflation shows up as
          roughly zero real change.
        </p>

        <h2>Scarcity Index, 0–100</h2>
        <p>
          No brand publishes per-reference production numbers, so the index is honest about being a
          proxy. Five signals: discontinued status, stated limited-edition size, brand-level annual
          production (from Morgan Stanley's published estimates), observed market availability, and
          sourced waitlist evidence. Missing signals aren't faked — the score renormalizes over what
          exists and the card discloses "k of 5 signals". Tiers: Common, Limited, Scarce, Grail.
        </p>

        <h2>Collectibility Index, 0–100</h2>
        <p>
          A weighted composite: sustained premium over retail (30), scarcity (25), sourced provenance
          events (15), presence at the major auction houses (15), and five-year real price durability
          (15). Same renormalization discipline — the card always states how many components it
          actually had.
        </p>

        <h2>Liquidity and confidence</h2>
        <p>
          Liquidity counts tracked sales per year — a floor, not the true market volume, and the card
          says so. Every card carries a data-confidence grade: A needs ten sales across three venues
          within 90 days; B needs four sales across two venues within a year; C is at least one
          verified sale. No sales, no grade — the card presents identity and history only.
        </p>

        <h2>Provenance, not gossip</h2>
        <p>
          The influence timeline records dated, sourced events: a discontinuation announcement, a
          record auction, a documented celebrity association. Each entry links its source. Events
          without a citation don't exist here, whatever the forums say.
        </p>

        <h2>Screen attention, not screen scarcity</h2>
        <p>
          The Rolex screen layer records public identifications from Watch-ID. Family-only matches
          remain useful “did you know?” facts but are not assigned to a reference. Exact-reference
          film and television matches receive 20 attention points each, capped at 100. The
          supply-attention pressure signal is the rounded geometric mean of that attention score and
          the existing scarcity score. It ranks questions worth researching; it is not a valuation.
          Screen exposure never changes scarcity.
        </p>

        <h2>When price response is allowed</h2>
        <p>
          A screen appearance does not prove a price move. A price-response estimate needs an exact
          release date and at least three comparable sales in both the twelve months before and the
          twelve months after the event. The current cohort does not meet that threshold, so every
          price-response field is null with a reason. Catalog prices from the Rolex object atlas are
          not sold prices and never enter this calculation.
        </p>

        <h2>Brand tiers are labels, not coefficients</h2>
        <p>
          The WatchScanner hierarchy is a subjective editorial map of craft, heritage, recognition,
          and demand. It places Rolex in Tier 2. The register publishes that as peer-group context
          only. It is not an official industry standard and never changes price, scarcity, or
          collectibility.
        </p>

        <h2>Price bands</h2>
        <p>
          Each card is shelved into a market segment — Trophy, Blue chip, Accessible, Entry, or
          Everyday — following the tiered classification in the compiled 2026 collector research.
          The band is placed on the best price the card has: the market estimate when one exists,
          otherwise the retail price, and the card says which. A band names the market a reference
          trades in. It is not a valuation and carries no score.
        </p>

        <h2>Market context is a separate layer</h2>
        <p>
          The Economy page shows industry figures — the WatchCharts, Rolex, and Patek Philippe index
          ranges, auction volumes, market size. These come from named third-party reports and are
          republished with attribution as context. They are a different kind of number from the
          register's own: we compile them, we do not verify them, and they never touch the
          register's computations. Where sources disagree, the chart draws the disagreement as a
          range instead of averaging it away.
        </p>

        <h2>What stays internal</h2>
        <p>
          The full comparable-sales set stays in the internal dataset; public cards carry the summary
          statistics and up to five notable sales with citations. You always see how many sales stand
          behind a number, over what period, from which venues — enough to judge the number without
          us republishing every transaction.
        </p>

        <h2>Limits, stated plainly</h2>
        <p>
          Venue coverage is partial, small samples are noisy, condition varies between sales, and
          none of this is financial advice. Each metric on each card carries its own one-line
          limitation — open the "limits" toggle anywhere. If you spot an error in a cited fact, the
          register wants to know.
        </p>
      </div>
    </>
  )
}
