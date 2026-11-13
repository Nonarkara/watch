import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { BIBLE_STATS } from '../lib/bible'
import EvidenceField from '../components/EvidenceField.tsx'

type DataState = {
  last_attempt: string
  last_status?: string
  count?: number
  months?: number
  [k: string]: unknown
}

type FetchState = Record<string, DataState>

type MarketIntakeRecord = {
  source_id: string
  card_id: string
  brand: string
  reference: string | null
  model: string | null
  realized: number | null
  currency: string | null
  sale_date: string | null
  auction_date?: string | null
  source_url: string
  status: string
  reasons: string[]
  observed_this_run: boolean | null
  detail: { year: string | null; material: string | null; box_papers: string | null } | null
}

type MarketIntake = {
  generated_at: string
  source: string
  source_url: string
  limitation: string
  summary: {
    harvested: number
    ready_for_review: number
    quarantined: number
    duplicate: number
    exact_card_candidates: number
    observed_this_run?: number
    retained_history?: number
  }
  records: MarketIntakeRecord[]
}

const INTAKE_REASON: Record<string, string> = {
  detail_not_fetched: 'needs detail page',
  material_mismatch: 'material mismatch',
  detail_reference_mismatch: 'reference mismatch',
  non_usd_sale: 'non-USD result',
  already_on_card: 'already published',
  celebrity_or_named_provenance: 'special provenance',
  charity_sale: 'charity result',
  unique_or_prototype: 'unique or prototype',
  special_signature: 'special signature',
  military_issue: 'military issue',
}

function intakeMoney(value: number | null, currency: string | null): string {
  if (value == null || !currency) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

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
  const [marketIntake, setMarketIntake] = useState<MarketIntake | null>(null)

  useEffect(() => {
    fetch('/data/fetch-state.json')
      .then((r) => r.ok ? r.json() : {})
      .then((j) => setState(j ?? {}))
      .catch(() => setState({}))
    fetch('/data/market-intake.json')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => setMarketIntake(j))
      .catch(() => setMarketIntake(null))
  }, [])

  useEffect(() => {
    if (!data) return
    const id = window.location.hash.slice(1)
    if (!/^(how-we-work|method-[1-7]|evidence-field-title)$/.test(id)) return
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [data])

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
      key: 'phillips-watch-results',
      label: 'Phillips watch auction results',
      url: 'https://www.phillips.com/features/watches',
      file: 'data/market/review-queue.json',
      expected: 'realized lots; exact-reference USD matches enter human review only',
      cmd: 'npm run data:market:harvest',
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
    withImage: data.cards.filter(c => c.media.some(photo => photo.match === 'exact_reference')).length,
    withComps: data.cards.filter((c) => c.comp_summary).length,
    withEstimate: data.cards.filter((c) => c.computed.estimate.value != null).length,
    withProvenance: data.cards.filter((c) => c.provenance_events.length > 0).length,
    totalEvents: data.cards.reduce((s, c) => s + c.provenance_events.length, 0),
    withExactScreen: data.cards.filter((c) => c.screen_events.length > 0).length,
    withMsrp: data.cards.filter((c) => c.retail.msrp_history.length > 0 || c.retail.current_msrp_usd != null).length,
  }
  const methodCoverage = [
    ['Exact-reference photo', cardStats.withImage],
    ['Sale evidence', cardStats.withComps],
    ['Publishable estimate', cardStats.withEstimate],
    ['Sourced provenance', cardStats.withProvenance],
    ['Retail history', cardStats.withMsrp],
  ] as const
  const salesWithoutEstimate = data.cards.filter(c => c.computed.estimate.value == null && c.comp_summary).length
  const historicalEstimates = data.cards.filter(c => c.computed.estimate.value != null && c.computed.estimate.stale).length
  const recentEstimates = cardStats.withEstimate - historicalEstimates
  const priceCoverage = [
    { key: 'sales', label: 'Sales, no estimate', count: salesWithoutEstimate },
    { key: 'missing', label: 'No comparable sales', count: data.count - cardStats.withEstimate - salesWithoutEstimate },
  ]
  const visibleIntake = marketIntake?.records
    .filter((record) => record.status === 'ready_for_review' || record.status === 'quarantined')
    .sort((a, b) => Number(b.status === 'ready_for_review') - Number(a.status === 'ready_for_review'))
    .slice(0, 8) ?? []

  return (
    <>
      <div className="data-coverage">
        <div className="data-coverage-primary">
        <p className="eyebrow">Data · build {data.built}</p>
        <h1 className="pagetitle">What can we price?</h1>
        <p className="lede">{data.count} references. An estimate needs at least three comparable sales.</p>
        <div className="data-coverage-bar" aria-hidden="true">
          <span data-basis="estimated" style={{ flexGrow: recentEstimates }} />
          <span data-basis="historical" style={{ flexGrow: historicalEstimates }} />
          {priceCoverage.map(({ key, count }) => <span key={key} data-basis={key} style={{ flexGrow: count }} />)}
        </div>
        <dl className="data-coverage-rows" aria-label="Price evidence coverage">
          <div>
            <dt>Estimates</dt>
            <dd className="data-estimate-split mono">
              <span data-basis="estimated"><i aria-hidden="true" />{recentEstimates} recent</span>
              <span data-basis="historical"><i aria-hidden="true" />{historicalEstimates} historical</span>
            </dd>
          </div>
          {priceCoverage.map(({ key, label, count }) => <div key={key} data-basis={key}>
            <dt><i aria-hidden="true" />{label}</dt><dd className="mono">{count} / {data.count}</dd>
          </div>)}
        </dl>
        <div className="data-coverage-links">
          <a href="#evidence-field-title" className="src-a">Chart ↓</a>
          <a href="#how-we-work" className="src-a">Method ↓</a>
          <Link to="/methodology" className="src-a">Rulebook →</Link>
        </div>
        </div>
        <EvidenceField cards={data.cards} built={data.built} />
        <dl className="data-coverage-secondary" aria-label="Other evidence in the archive">
          <div><dt>Exact photos</dt><dd>{cardStats.withImage} references</dd></div>
          <div><dt>Story</dt><dd>{cardStats.totalEvents} events across {cardStats.withProvenance} references</dd></div>
          <div><dt>On screen</dt><dd>{cardStats.withExactScreen} references with exact sightings</dd></div>
          <div><dt>Retail</dt><dd>{cardStats.withMsrp} references with a price on record</dd></div>
        </dl>
      </div>

      {marketIntake && (
        <section className="data-intake" aria-labelledby="data-intake-title">
          <div className="data-intake-head">
            <div>
              <span className="eyebrow">EVIDENCE WAITING ROOM · HUMAN GATE</span>
              <h2 id="data-intake-title">The scraper found it. We have not called it a comp.</h2>
            </div>
            <p>Exact reference is only the first test. A sale waits here until a person checks material, dial, condition, provenance and whether the lot is an ordinary example. “Ready” means ready to inspect—not ready to move a valuation.</p>
          </div>
          <div className="data-intake-stats" aria-label="Phillips market evidence intake status">
            <div><strong>{marketIntake.summary.harvested}</strong><span className="mono">ARCHIVED RESULTS</span></div>
            <div><strong>{marketIntake.summary.exact_card_candidates}</strong><span className="mono">EXACT-CARD CANDIDATES</span></div>
            <div><strong>{marketIntake.summary.ready_for_review}</strong><span className="mono">READY TO INSPECT</span></div>
            <div><strong>{marketIntake.summary.quarantined}</strong><span className="mono">HELD WITH A REASON</span></div>
          </div>
          <div className="data-intake-ledger">
            {visibleIntake.map((record) => (
              <article key={record.source_id} className="data-intake-row" data-status={record.status}>
                <div className="data-intake-object">
                  <span className="mono">{record.brand} · REF. {record.reference ?? '—'}</span>
                  <strong>{record.model ?? 'Untitled auction lot'}</strong>
                  <small>{[record.detail?.year, record.detail?.material, record.detail?.box_papers?.replace('_', ' ')].filter(Boolean).join(' · ') || 'DETAIL CHECK PENDING'}</small>
                </div>
                <div className="data-intake-price">
                  <strong>{intakeMoney(record.realized, record.currency)}</strong>
                  <small className="mono">{record.sale_date ? `SOLD ${record.sale_date}` : record.auction_date ? `AUCTION START ${record.auction_date}` : 'DATE UNVERIFIED'}</small>
                </div>
                <div className="data-intake-state">
                  <span className="mono">{record.status === 'ready_for_review' ? 'READY · NOT YET A COMP' : 'HELD'}</span>
                  <small>{record.reasons.length ? record.reasons.map((reason) => INTAKE_REASON[reason] ?? reason.replaceAll('_', ' ')).join(' · ') : 'Exact reference and automated risk checks passed.'}</small>
                </div>
                <div className="data-intake-links mono">
                  <Link to={`/w/${record.card_id}`}>DOSSIER →</Link>
                  <a href={record.source_url} target="_blank" rel="noreferrer">SOURCE ↗</a>
                </div>
              </article>
            ))}
          </div>
          <p className="data-intake-foot mono">SOURCE: <a href={marketIntake.source_url} target="_blank" rel="noreferrer">PHILLIPS PUBLIC AUCTION RESULTS ↗</a> · EVIDENCE TIER: PRIMARY SALE RECORD · QUEUE GENERATED {marketIntake.generated_at.slice(0, 10)} · SHOWING {visibleIntake.length} OF {marketIntake.summary.exact_card_candidates} EXACT-CARD CANDIDATES · {marketIntake.summary.retained_history ?? 0} RECORDS RETAINED FROM EARLIER RUNS</p>
        </section>
      )}

      <section className="what-changed" aria-label="What changed in this build">
        <div className="section-rule">
          <h2>What changed in this build.</h2>
          <span className="sticker-inline mono">LAST 10 CURATED · {data.built}</span>
        </div>
        <p className="dim what-changed-deck">
          The ten most recently curated or updated dossiers in this build. A dossier is curated
          when an editor sits with the card, walks the evidence, and signs off on every number
          shown. The build date is the date the dataset was last rendered — not the same as
          the curated date.
        </p>
        <ol className="what-changed-list">
          {data.cards
            .filter((c) => c.meta.curated_date)
            .slice()
            .sort((a, b) => (b.meta.curated_date ?? '').localeCompare(a.meta.curated_date ?? ''))
            .slice(0, 10)
            .map((c) => (
              <li key={c.id} className="what-changed-item">
                <span className="what-changed-date mono">{c.meta.curated_date}</span>
                <span className="what-changed-source mono">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                <Link to={`/w/${c.id}`} className="what-changed-name">{c.identity.name}</Link>
                <span className="what-changed-meta mono">
                  {c.comp_summary ? `${c.comp_summary.n} COMPS` : 'NO COMPS'} · {c.provenance_events.length} EVENTS
                </span>
                <Link to={`/w/${c.id}`} className="what-changed-open">OPEN →</Link>
              </li>
            ))}
        </ol>
      </section>

      <section className="data-methodology" id="how-we-work" aria-label="How we work, in full">
        <h2>How we work, in full.</h2>
        <p className="data-methodology-lede">
          What gets a dossier, what counts as a comparable sale, and when we leave the price blank.
          Start with the evidence ledger or jump to a step.
        </p>

        <aside className="data-methodology-rail" aria-label="Live methodology ledger">
          <p className="eyebrow">LIVE METHOD LEDGER</p>
          <nav className="method-map" aria-label="Method sections">
            <p className="method-rail-title mono">THE SEVEN CHECKPOINTS</p>
            {[
              ['01', 'Admission', '#method-1'],
              ['02', 'The dossier', '#method-2'],
              ['03', 'Honesty ladder', '#method-3'],
              ['04', 'Card to wire', '#method-4'],
              ['05', 'Four axes', '#method-5'],
              ['06', 'Build and test', '#method-6'],
              ['07', 'The rule', '#method-7'],
            ].map(([number, label, href]) => (
              <a href={href} key={href}><span className="mono">{number}</span><strong>{label}</strong><span>↓</span></a>
            ))}
          </nav>
          <div className="method-refusal">
            <strong>{data.count - cardStats.withEstimate}</strong>
            <span className="mono">OF {data.count} DOSSIERS DO NOT PUBLISH A MARKET ESTIMATE</span>
            <p>{cardStats.withEstimate} references clear the current comparable-sale gate. A blank price is a result, not unfinished UI.</p>
          </div>

          <div className="method-coverage" aria-label="Evidence coverage">
            <p className="method-rail-title mono">EVIDENCE ON FILE</p>
            {methodCoverage.map(([label, count]) => (
              <div className="method-coverage-row" key={label}>
                <div><span>{label}</span><strong className="mono">{count}/{data.count}</strong></div>
                <span className="method-coverage-track" role="img" aria-label={`${label}: ${count} of ${data.count}`}>
                  <span style={{ width: `${Math.round((count / data.count) * 100)}%` }} />
                </span>
              </div>
            ))}
          </div>

          <p className="method-build mono">PUBLIC BUILD {data.built} · METHOD V{data.methodology_version}</p>
        </aside>

        <div className="data-methodology-copy">

        <h3 id="method-1">1. The first question: is this watch worth a dossier?</h3>
        <p>
          A reference makes the cut when it satisfies at least one of three conditions. The
          reference is in <strong>the cultural conversation</strong> — there is published
          journalism, an auction record, a film placement, or a brand-heritage story that the
          site can point to. The reference is in <strong>active production or active resale</strong> —
          the catalogue has it or the secondary market trades it, and a reader in 2026 can
          plausibly go out and buy one. Or the reference is in <strong>the field's standard
          bibliography</strong> — the watch literature we curate in the Bible tab treats it as
          a canonical example. Without one of those three, we skip the dossier. This build
          covers {data.count} references; it is a selection, not a census of watchmaking.
        </p>

        <h3 id="method-2">2. The dossier, in one sitting</h3>
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

        <h3 id="method-3">3. The honest ladder, top to bottom</h3>
        <p>
          For each card we then build, top to bottom, a ladder of what we are willing to
          publish. The top rungs are <em>identity</em>, <em>retail at launch</em>, and
          <em>production timeline</em> — these are set by the brand and we treat them as
          citation-level. The next rung is <strong>sale evidence</strong> — comparable sales
          at the same configuration, with the same case material, the same dial variant. A
          single sale is evidence, but it cannot support a market estimate on its own. The
          next rung is <strong>provenance</strong> — a sourced event that helps explain the
          watch's cultural history (Newman's own Daytona, the 5960P Phillips result, the
          Murph prop release). The next rung is <strong>screen and media</strong> — exact
          reference matches in film or TV, the Ted Talks the watch appeared on, the
          magazine covers. The last rungs are <em>liquidity</em> (how many comps per year)
          and <em>confidence</em> (tier of venue, recency of comp, number of venues). Below
          all of these: <strong>the refusal</strong>. The dossier publishes a
          <code> —</code> where the evidence is too thin. Today,{' '}
          <strong>{data.count - cardStats.withEstimate} of {data.count}</strong> dossiers sit on
          the refusal rung. That is the system working.
        </p>

        <h3 id="method-4">4. From card to wire</h3>
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

        <h3 id="method-5">5. The four axes, by reference</h3>
        <p>
          Every dossier publishes the same four metrics, on the same scale. <strong>Rarity</strong>
          {' '}is the Scarcity Index: a five-signal composite of brand production, limited-edition
          status, waitlist evidence, auction appearances, and discontinued production. Disclosed
          as <em>k-of-5</em> so a reader can see the signal count. <strong>Demand</strong> is the
          Collectibility Index: comps per year, venue breadth, and the press pressure on the
          reference. <strong>Story</strong> (we used to call this Provenance — see the
          <Link className="src-a" to="/glossary#provenance"> glossary</Link>) is the count of
          sourced events on the timeline,
          plus a "provenance premium" reading for the iconic cases. <strong>Resellability</strong>
          is the comp velocity: a 0-100 score with a High / Medium / Low / Unknown tier. None
          of these are the catalog list price, none are the brand's MSRP, none are the
          "estimated retail replacement" that the second-tier guides publish. The system
          refuses to publish that number. It is opinion, not evidence, and the system is
          built on the opposite discipline.
        </p>

        <h3 id="method-6">6. Build, test, deploy</h3>
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

        <h3 id="method-7">7. The rule, restated</h3>
        <p>
          A <strong>market estimate</strong> requires at least three eligible comparable sales.
          Retail prices, individual sale results, and model scores are different figures, with
          different sources and limits. Of {data.count} references in this build, {cardStats.withComps}{' '}
          have comparable sales on file and {cardStats.withEstimate} qualify for an estimate.
          Where the estimate is missing, the dossier says why.
        </p>
        </div>

      </section>

      <section className="data-sources">
        <h2>Upstream sources</h2>
        <p className="dim">
          Every other number on the site derives from one of these. If a source moves, the
          next <code>npm run data:build</code> will pick it up; until then, the snapshot is
          committed for deterministic behaviour.
        </p>
        <div className="data-sources-table-wrap" role="region" aria-label="Upstream source table" tabIndex={0}>
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
              const statusDetail = s.key === 'phillips-watch-results' && rec
                ? `${status} · ${rec.ready_for_review ?? 0} REVIEW / ${rec.quarantined ?? 0} HELD`
                : status
              return (
                <tr key={s.key}>
                  <td>
                    {s.url
                      ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                      : s.label}
                  </td>
                  <td>{lastFetched}</td>
                  <td>{statusDetail}</td>
                  <td className="dim">{s.file}</td>
                  <td><code>{s.cmd}</code></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
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
          <li><code>npm run data:market:harvest</code> · discover Phillips results, snapshot raw pages, and rebuild the human review queue</li>
          <li><code>npm run data:market:promote -- --id=phillips:&lt;lot&gt; --decision=comparable --dry-run</code> · preview one reviewed sale before it can enter a dossier</li>
          <li><code>npm run data:cpi</code> · refresh FRED CPIAUCSL snapshot</li>
          <li><code>npm run data:catalog</code> · rebuild <code>rolex_catalog.json</code> from the committed TSV</li>
          <li><code>npm test</code> · invariant self-check (runs the test suite offline, with <code>WATCH_TEST_NETWORK=1</code> for the network-touching fetch test)</li>
        </ul>
      </section>
    </>
  )
}
