import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'

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
      <Link to="/" className="crumb">← HOME</Link>
      <section className="page-head">
        <div>
          <p className="eyebrow">DATA · {data.count} REFERENCES · BUILD {data.built}</p>
          <h1 className="pagetitle">How Time Pop collects its evidence.</h1>
          <p className="lede">
            Every published number traces to a cited public source or is computed from cited evidence.
            This page is the audit trail: what we collect, where it comes from, and how fresh the
            build you are reading is.
          </p>
        </div>
      </section>

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
