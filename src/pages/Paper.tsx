export default function Paper() {
  return (
    <>
      <p className="eyebrow">Working Paper</p>
      <h1 className="pagetitle">Epistemic humility as market infrastructure</h1>
      <div className="prose">
        <p className="dim">
          A design-science working paper accompanying the register. Draft v1, July 2026.
        </p>
        <h2>The hypothesis</h2>
        <p>
          Collector decisions in the secondhand watch market degrade under three compounding
          conditions: choice overload across thousands of near-identical listings, information
          asymmetry between seller and buyer — Akerlof's market for lemons, running live — and fraud
          risk from superfakes and assembled "franken" watches. We hypothesize that a transparent,
          provenance-linked intelligence layer measurably restores decision confidence, and that
          publicly observable influence events (a discontinuation, a record auction, a documented
          celebrity association) produce dateable price effects — which makes an event timeline a
          legitimate pricing input rather than gossip.
        </p>
        <h2>The artifact</h2>
        <p>
          The register itself is the designed intervention: seven metrics computed deterministically
          from cited evidence, a refusal rule that withholds estimates below three verified sales,
          and per-metric disclosure of sample size, window, and limitation. The design bet is that a
          system that visibly refuses to guess earns more trust — and produces better decisions —
          than one that always has an answer.
        </p>
        <h2>Read it</h2>
        <p>
          <a className="src-a" href="/paper.md" download="WATCH_working-paper.md">
            Download the full working paper (Markdown) ↗
          </a>
        </p>
        <p className="dim">
          The paper reviews the evidence base: the collectibles-return literature, the 2018–2026
          secondary-market price cycle, and documented event-price couplings from the Paul Newman
          Daytona to the Nautilus discontinuation. Comments welcome.
        </p>
      </div>
    </>
  )
}
