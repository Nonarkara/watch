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
