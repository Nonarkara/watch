import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'

export default function Legal() {
  const data = useDataset()
  return (
    <div>
      <Link to="/" className="crumb">← HOME</Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">Fine print</p>
          <h1 className="pagetitle">What this site is, and is not</h1>
        </div>
        <p className="lede">
          Time Pop is an independent reference work. The plain-language version of every disclaimer
          is written into the pages themselves; this page is the complete statement in one place.
        </p>
      </div>

      <div className="prose legal-prose">
        <h2>Not financial advice</h2>
        <p>
          Nothing on this site is investment, financial, legal, or tax advice. The register describes
          markets; it does not recommend purchases, sales, or timing. Historical prices do not predict
          future prices. Industry research suggests only a small minority of watches appreciate at
          all — most depreciate. If you are making a decision with real money, verify current sold
          prices at the venues listed under <Link className="src-a" to="/resources">Resources</Link> and,
          where the sums warrant it, take professional advice.
        </p>

        <h2>Not an authentication service</h2>
        <p>
          Time Pop does not authenticate watches, broker transactions, hold funds, or vouch for any
          seller or buyer. Counterfeits — including so-called superclones — are a real and growing
          risk. Authentication belongs with qualified watchmakers, the brands themselves, and the
          registries and communities on the Resources page. Before buying, check the serial against a
          stolen-watch registry. Note that Rolex offers no online serial verification; anything
          claiming to be one is itself a warning sign.
        </p>

        <h2>How the numbers are made</h2>
        <p>
          Every figure the register computes traces to cited public evidence: verified sales carry
          the URL of the page recording them, retail prices carry their source, and each metric
          publishes its sample size, time window, and a stated limitation. Where evidence is
          insufficient, the register refuses to publish a number. The{' '}
          <Link className="src-a" to="/methodology">Methodology</Link> page documents every formula.
          Third-party industry figures on the <Link className="src-a" to="/economy">Economy</Link> page
          are republished with attribution as market context; Time Pop does not independently verify
          them, and they never enter the register's own computations.
        </p>

        <h2>Accuracy and corrections</h2>
        <p>
          The data build is deterministic and dated ({data ? `current build ${data.built}` : 'each build is stamped'}),
          but sources can err and markets move daily. Figures may be outdated the day after a build.
          If you find an error in a cited fact, we want to know — write to{' '}
          <a className="src-a" href="mailto:nonsmartcity@gmail.com">nonsmartcity@gmail.com</a> and
          include the reference and the source. Corrections ship in the next data build.
        </p>

        <h2>Trademarks and independence</h2>
        <p>
          Rolex, Patek Philippe, Audemars Piguet, Omega, and every other brand name, model name, and
          logo referenced on this site are trademarks of their respective owners. Time Pop is not
          affiliated with, endorsed by, or sponsored by any watch manufacturer, retailer, auction
          house, or the London-based stolen-watch database The Watch Register. Brand and model names
          appear solely to identify the objects being described, which is their nominative use.
        </p>

        <h2>Photography and quoted material</h2>
        <p>
          Photographs are used under their stated licences — each image carries its author, licence,
          and source link where it appears. Film stills appear as promotional/editorial material with
          attribution. Auction results and press facts are cited to the pages that published them. If
          you are a rights holder and believe something is misused, contact us and it will be
          reviewed promptly.
        </p>

        <h2>Analytics and privacy</h2>
        <p>
          The site keeps no accounts and collects no personal profiles. A single anonymous visit ping
          (page, referrer, browser locale, and approximate location by IP) is recorded once per
          session to count readership. Comparison selections are stored in your own browser and never
          leave it.
        </p>

        <h2>No warranty</h2>
        <p>
          This site is provided as-is, free of charge, for information and education. To the fullest
          extent permitted by law, Time Pop and its operator disclaim all warranties and accept no
          liability for decisions made in reliance on the site. The evidence is cited precisely so
          that you can check it yourself — please do.
        </p>

        <p className="micro dim mono" style={{ marginTop: 'var(--space-lg)' }}>
          TIME POP · AN AXIOM X CO., LTD. PROJECT · WATCH.NONARKARA.ORG ·{' '}
          {data ? `DATA BUILD ${data.built} · METHODOLOGY V${data.methodology_version}` : ''}
        </p>
      </div>
    </div>
  )
}
