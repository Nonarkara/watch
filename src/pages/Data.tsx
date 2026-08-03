import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { BIBLE_STATS } from '../lib/bible'
import HeroBanner from '../components/HeroBanner.tsx'

type DataState = {
  last_attempt: string
  last_status?: string
  count?: number
  months?: number
  [k: string]: unknown
}

type FetchState = Record<string, DataState>

/**
 * Public-facing view of the data pipeline. Shows when each upstream source was
 * last harvested, what the current data files contain, and which collector
 * scripts re-run to refresh the build. The same numbers feed the audit script;
 * the difference is this one is on the site, so a reader can see how fresh
 * the evidence actually is.
 *
 * Endpoint: /data.json (cards + screen), /data/screen_sightings.json (sightings).
 * Source mtime is read from fetch-state.json in the build artefact.
 */
export default function Data() {
  const data = useDataset()
  const [state, setState] = useState<FetchState | null>(null)

  useEffect(() => {
    fetch('/data/fetch-state.json')
      .then((r) => r.ok ? r.json() : {})
      .then((j) => setState(j ?? {}))
      .catch(() => setState({}))
  }, [])

  if (!data) return null

  const sources = [
    {
      key: 'watch-id-rolex',
      label: 'Watch-ID (Rolex sightings)',
      url: 'https://www.watch-id.com/brands/rolex',
      file: 'data/shared/watch_id_rolex.json',
      expected: '~31 sightings, varies ±2 between runs',
      cmd: 'npm run data:screen:harvest',
    },
    {
      key: 'fred-cpiau-csl',
      label: 'FRED CPIAUCSL (real-USD adjustment)',
      url: 'https://fred.stlouisfed.org/series/CPIAUCSL',
      file: 'data/shared/cpi_snapshot.json',
      expected: '~200 monthly observations, latest within 60 days of build',
      cmd: 'npm run data:cpi',
    },
    {
      key: 'rolex-catalog-tsv',
      label: 'Rolex catalog (TSV, user-supplied)',
      url: null,
      file: 'data/imports/rolex_watchpages_2026-07-31.tsv',
      expected: '80 rows, 5 tab-separated fields per row',
      cmd: 'npm run data:catalog',
    },
  ] as const

  const cardStats = {
    withImage: data.cards.filter((c) => c.media.length > 0).length,
    withComps: data.cards.filter((c) => c.comp_summary).length,
    withProvenance: data.cards.filter((c) => c.provenance_events.length > 0).length,
    totalEvents: data.cards.reduce((s, c) => s + c.provenance_events.length, 0),
    withExactScreen: data.cards.filter((c) => c.screen_events.length > 0).length,
    withMsrp: data.cards.filter((c) => c.retail.msrp_history.length > 0 || c.retail.current_msrp_usd != null).length,
  }

  return (
    <>
      <HeroBanner
        bg="/heroes/data.jpg"
        hue="navy"
        size="md"
        alt="Pop-art methodology: a 4-axes diagram (Rarity / Demand / Provenance / Resellability) with a desk of evidence cards and a magnifier over a 'denied' price note"
        eyebrow={`DATA · ${data.count} REFERENCES · BUILD ${data.built}`}
        title={<>How Time Pop<br />collects its evidence.</>}
        subtitle={
          <>
            Every published number traces to a cited public source or is computed from cited
            evidence. This page is the audit trail: what we collect, where it comes from, and
            how fresh the build you are reading is.
          </>
        }
        primary={{ to: '#how-we-work', label: 'READ THE METHODOLOGY' }}
        secondary={{ to: '/methodology', label: 'SEE THE RULEBOOK' }}
        credit="HERO ART · 4 AXES + EVIDENCE CARDS + MAGNIFIER — POP-ART METHODOLOGY"
        meta={
          <div className="pop-panel data-meta">
            <span className="bubble-kicker mono">THE RULE</span>
            <strong>No cited comps, no estimate.</strong>
            <span>The visible refusals are load-bearing. {data.count - cardStats.withComps} of {data.count} dossiers sit on the refusal rung today. That is the system working.</span>
          </div>
        }
      />

      <Link to="/" className="crumb">← HOME</Link>

      <section className="data-cards">
        <div className="data-card">
          <span className="eyebrow">IMAGE COVERAGE</span>
          <strong>{cardStats.withImage}/{data.count}</strong>
          <span className="dim">{Math.round((cardStats.withImage / data.count) * 100)}% of dossiers carry a verified CC-licensed photo</span>
        </div>
        <div className="data-card">
          <span className="eyebrow">SALE EVIDENCE</span>
          <strong>{cardStats.withComps}/{data.count}</strong>
          <span className="dim">dossiers with at least one comparable cited sale</span>
        </div>
        <div className="data-card">
          <span className="eyebrow">PROVENANCE</span>
          <strong>{cardStats.totalEvents}</strong>
          <span className="dim">dated, sourced events across {cardStats.withProvenance} cards</span>
        </div>
        <div className="data-card">
          <span className="eyebrow">SCREEN</span>
          <strong>{cardStats.withExactScreen}</strong>
          <span className="dim">dossiers carry at least one exact-reference film or TV sighting</span>
        </div>
        <div className="data-card">
          <span className="eyebrow">RETAIL HISTORY</span>
          <strong>{cardStats.withMsrp}</strong>
          <span className="dim">dossiers with at least one MSRP data point</span>
        </div>
        <div className="data-card">
          <span className="eyebrow">BUILD DATE</span>
          <strong className="mono">{data.built}</strong>
          <span className="dim">snapshotted at build time; pure functions of inputs</span>
        </div>
      </section>

      <section className="data-methodology" id="how-we-work" aria-label="How we work, in full">
        <h2>How we work, in full.</h2>
        <p className="data-methodology-lede">
          A watch enters the register the way a good answer enters a room: it carries its
          sources. Everything that follows is the work of being honest about that — a single
          loop that runs from <em>is this watch worth a dossier</em> to <em>what number can
          we publish</em> to <em>what will we refuse to invent</em>. We will walk through it
          once, end to end.
        </p>

        <h3>1. The first question: is this watch worth a dossier?</h3>
        <p>
          A reference makes the cut when it satisfies at least one of three conditions. The
          reference is in <strong>the cultural conversation</strong> — there is published
          journalism, an auction record, a film placement, or a brand-heritage story that the
          site can point to. The reference is in <strong>active production or active resale</strong> —
          the catalogue has it or the secondary market trades it, and a reader in 2026 can
          plausibly go out and buy one. Or the reference is in <strong>the field's standard
          bibliography</strong> — the watch literature we curate in the Bible tab treats it as
          a canonical example. Without one of those three, we skip the dossier. There are
          roughly {data.count} watches in the register today; there are roughly 20,000
          references that would qualify as "luxury watches" if you grep Wikipedia. The cut
          is real.
        </p>

        <h3>2. The dossier, in one sitting</h3>
        <p>
          A dossier begins as a JSON file under <code>data/cards/&lt;id&gt;.json</code>. The
          schema requires six blocks, in this order: <strong>identity</strong> (brand, reference,
          caliber, case, one-liner), <strong>retail</strong> (MSRP history with a cited source for
          every data point), <strong>market_evidence</strong> (comps: every comp has a date, a
          price, a venue, a URL, and a box-and-papers flag), <strong>scarcity_inputs</strong>
          (limited-edition metadata and the waitlist evidence if any),
          <strong>provenance_events</strong> (a timeline of dated, sourced events: releases,
          celebrity ownerships, auction records, museum placements), and
          <strong>narrative</strong> (a story of the watch in plain prose, with collector
          notes that say what the model is for). The card never invents a number. If the
          comps do not exist, the comps are not present, and the published number will be a
          <code>—</code>, not a guess.
        </p>

        <h3>3. The honest ladder, top to bottom</h3>
        <p>
          For each card we then build, top to bottom, a ladder of what we are willing to
          publish. The top rungs are <em>identity</em>, <em>retail at launch</em>, and
          <em>production timeline</em> — these are set by the brand and we treat them as
          citation-level. The next rung is <strong>sale evidence</strong> — comparable sales
          at the same configuration, with the same case material, the same dial variant. A
          single comp is an anecdote; three comps at a venue, in a window, are a market. The
          next rung is <strong>provenance</strong> — a sourced event that puts a number on the
          watch's cultural weight (Newman's own Daytona, the 5960P Phillips result, the
          Murph prop release). The next rung is <strong>screen and media</strong> — exact
          reference matches in film or TV, the Ted Talks the watch appeared on, the
          magazine covers. The last rungs are <em>liquidity</em> (how many comps per year)
          and <em>confidence</em> (tier of venue, recency of comp, number of venues). Below
          all of these: <strong>the refusal</strong>. The dossier publishes a
          <code> —</code> where the evidence is too thin. Today,{' '}
          <strong>{data.count - cardStats.withComps} of {data.count}</strong> dossiers sit on
          the refusal rung. That is the system working.
        </p>

        <h3>4. From card to wire</h3>
        <p>
          Every card passes through <code>scripts/validate_card.mjs</code> before the build
          sees it. The validator checks schema, dates, money shapes, license strings, and a
          hard <em>comparable-or-justify</em> rule on variant sales: a non-comparable sale
          cannot enter the estimator unless its condition is spelled out in plain text. One
          validation error, and the build refuses to publish — the broken card is rejected,
          the rest of the dataset ships. The estimate, premium, scarcity, collectibility,
          liquidity, attention, and confidence blocks are then computed by
          <code>scripts/lib/indices.mjs</code>. Each block carries a <code>limitation</code>
          string so the UI can say why a number is a <code>—</code> instead of inventing a
          value. The <code>build_indices.mjs</code> script then strips the full comps list
          from the wire and publishes at most 5 notable sales per card (largest by price, with
          the box-and-papers flags). The full comp list stays committed in
          <code>data/cards/</code> and is reproducible from any clone.
        </p>

        <h3>5. The four axes, by reference</h3>
        <p>
          Every dossier publishes the same four metrics, on the same scale. <strong>Rarity</strong>
          {' '}is the Scarcity Index: a five-signal composite of brand production, limited-edition
          status, waitlist evidence, auction appearances, and discontinued production. Disclosed
          as <em>k-of-5</em> so a reader can see the signal count. <strong>Demand</strong> is the
          Collectibility Index: comps per year, venue breadth, and the press pressure on the
          reference. <strong>Provenance</strong> is the count of sourced events on the timeline,
          plus a "provenance premium" reading for the iconic cases. <strong>Resellability</strong>
          is the comp velocity: a 0-100 score with a High / Medium / Low / Unknown tier. None
          of these are the catalog list price, none are the brand's MSRP, none are the
          "estimated retail replacement" that the second-tier guides publish. The system
          refuses to publish that number. It is opinion, not evidence, and the system is
          built on the opposite discipline.
        </p>

        <h3>6. Build, test, deploy</h3>
        <p>
          The build is one command: <code>npm run build</code>. It calls
          <code> build_rolex_catalog.mjs</code>, then <code>build_screen_sightings.mjs</code>,
          then <code>build_indices.mjs</code>, then the TypeScript compiler, then{' '}
          <code>vite build</code>. The output is a <code>dist/</code> folder. The deploy is
          one command: <code>wrangler pages deploy dist --branch main</code>. The build is
          deterministic — the same inputs produce the same wire output, which is why a
          dossier published in 2026 still has the same numbers a year later unless we
          deliberately refresh. The audit script is <code>npm run data:audit</code>; the
          self-check is <code>npm test</code>; the freshness check is{' '}
          <code>npm run data:status</code>. All three are idempotent, all three write to
          committed files only when the result changes.
        </p>

        <h3>7. The rule, restated</h3>
        <p>
          The system has one rule: <em>no cited comps, no estimate</em>. Every published
          number on the site traces to at least three comparable sales at cited venues on
          cited dates, or it does not publish. The visible refusals — the
          <code>—</code>s on the page — are load-bearing. They are what make the published
          numbers believable. A reader who sees <strong>262 / 35 / 35 / 169 / 122 / 14 / 122 / 0</strong>
          {' '}on the home hero can read those numbers and trust them precisely because the
          last one is a 0, not a guess.
        </p>
      </section>

      <section className="data-sources">
        <h2>Upstream sources</h2>
        <p className="dim">
          Every other number on the site derives from one of these. If a source moves, the
          next <code>npm run data:build</code> will pick it up; until then, the snapshot is
          committed for deterministic behaviour.
        </p>
        <table className="data-sources-table mono">
          <thead>
            <tr>
              <th>Source</th>
              <th>Last fetched</th>
              <th>Status</th>
              <th>File</th>
              <th>Re-run</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => {
              const rec = state?.[s.key]
              const lastFetched = rec?.last_attempt?.slice(0, 10) ?? '—'
              const status = rec?.last_status ?? '—'
              return (
                <tr key={s.key}>
                  <td>
                    {s.url
                      ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                      : s.label}
                  </td>
                  <td>{lastFetched}</td>
                  <td>{status}</td>
                  <td className="dim">{s.file}</td>
                  <td><code>{s.cmd}</code></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="data-sources-foot dim mono">
          THE BIBLE — a curated reading list of {BIBLE_STATS.count} published watch books — is also
          a data source. Every entry in <code>src/lib/bible.ts</code> carries its own public source
          (Open Library, publisher, Wikipedia) and its watch_ids cross-references feed the
          “Cited in” panel on dossier pages. See <Link to="/bible">/bible →</Link>.
        </p>
      </section>

      <section className="data-pipeline">
        <h2>What the pipeline does</h2>
        <ol className="data-pipeline-list">
          <li>
            <span className="step mono">01</span>
            <div>
              <strong>Identity</strong> — every reference starts as a JSON file under
              <code> data/cards/&lt;id&gt;.json</code> with name, caliber, case, MSRP history,
              cited comps, sourced provenance, narrative, and a single in-house <code>curated_by</code> marker.
              No number is invented: comps, retail, and provenance are all linked to a
              <code> source_url</code> field.
            </div>
          </li>
          <li>
            <span className="step mono">02</span>
            <div>
              <strong>Validation</strong> — every card passes through
              <code> scripts/validate_card.mjs</code> before build. Schema, dates, money
              shapes, license strings, and a hard <em>comparable-or-justify</em> rule on
              variant sales. The build refuses to publish on a single error.
            </div>
          </li>
          <li>
            <span className="step mono">03</span>
            <div>
              <strong>Computation</strong> — <code>scripts/lib/indices.mjs</code> takes the
              card plus the shared snapshots (CPI, brand production, screen) and produces the
              <em> estimate, premium, scarcity, collectibility, liquidity, attention, confidence
              </em> blocks. Every block carries a <code>limitation</code> string so the UI can
              say why a number is <code>—</code> instead of guessing.
            </div>
          </li>
          <li>
            <span className="step mono">04</span>
            <div>
              <strong>Masked publish</strong> — <code>scripts/build_indices.mjs</code> drops
              full comps from the wire and ships at most 5 notable sales per card (largest
              by price, with box-and-papers flags). The full comp list is committed in
              <code> data/cards/</code> and reproducible from any clone.
            </div>
          </li>
          <li>
            <span className="step mono">05</span>
            <div>
              <strong>Static deploy</strong> — <code>vite build</code> produces a
              <code> dist/</code> folder; <code>wrangler pages deploy dist --branch main
              </code> ships to Cloudflare Pages. The build is deterministic — same inputs
              mean same wire output.
            </div>
          </li>
        </ol>
      </section>

      <section className="data-commands">
        <h2>Run it yourself</h2>
        <p>All collectors and validators are <code>npm</code> scripts. Each one is
          idempotent and writes to committed files only when the result changes.</p>
        <ul className="data-commands-list mono">
          <li><code>npm run data:audit</code> · per-brand coverage + gap report</li>
          <li><code>npm run data:sightings:validate</code> · invariant gate for sightings JSON</li>
          <li><code>npm run data:status</code> · one-screen freshness + reachability check (use <code>--offline</code> to skip the HEAD probes)</li>
          <li><code>npm run data:screen:harvest</code> · re-pull the Watch-ID Rolex index, preserving curated fields</li>
          <li><code>npm run data:cpi</code> · refresh FRED CPIAUCSL snapshot</li>
          <li><code>npm run data:catalog</code> · rebuild <code>rolex_catalog.json</code> from the committed TSV</li>
          <li><code>npm test</code> · invariant self-check (runs the test suite offline, with <code>WATCH_TEST_NETWORK=1</code> for the network-touching fetch test)</li>
        </ul>
      </section>
    </>
  )
}
