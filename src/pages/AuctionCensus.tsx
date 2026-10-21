import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Auction Census — the shape of three Phillips sale rooms, published as an
// aggregate. The per-lot intake queue stays private (raw page text, detail
// fields, every unmatched record); what is publishable is the shape of the
// market and, more importantly, how much of it this register actually covers.

interface CensusAuction {
  code: string
  name: string | null
  venue: string
  date: string | null
  lots: number
  priced_lots: number
  value_usd: number
  currencies: string[]
}

interface CensusBrand {
  brand: string
  brand_key: string
  lots: number
  priced_lots: number
  value_usd: number
  cards_in_register: number
}

interface Census {
  schema_version: number
  generated_at: string
  source: string
  source_url: string
  harvest_date: string
  method: string
  limitation: string
  totals: {
    auctions: number
    lots: number
    priced_lots: number
    value_usd: number
    lots_converted_from_other_currency: number
    unconverted_lots: number
    brands_seen: number
    brands_in_register: number
    lots_with_no_published_reference: number
    lots_publishing_neither_reference_nor_model: number
    value_with_no_published_reference_usd: number
    value_publishing_neither_reference_nor_model_usd: number
  }
  coverage: {
    lots_matching_a_card: number
    lots_matching_a_card_pct: number
    value_matching_a_card_usd: number
    value_matching_a_card_pct: number
    by_reference: {
      lots: number
      value_usd: number
      value_pct: number
      meaning: string
    }
    by_model_name: {
      lots: number
      value_usd: number
      value_pct: number
      cards_in_channel: number
      meaning: string
    }
    note: string
  }
  auctions: CensusAuction[]
  brands: CensusBrand[]
}

const usd = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${n.toFixed(0)}`

const usdFull = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export default function AuctionCensus() {
  const [census, setCensus] = useState<Census | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [sort, setSort] = useState<'value' | 'lots' | 'name'>('value')

  useEffect(() => {
    let cancelled = false
    fetch('/data/auction_census.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Census) => { if (!cancelled) setCensus(d) })
      .catch(() => { if (!cancelled) setErr('The auction census has not been built on this deployment yet.') })
    return () => { cancelled = true }
  }, [])

  if (err) return <p className="honest" role="alert">{err}</p>
  if (!census) return <p className="lede">Loading the census…</p>

  const { totals, coverage } = census
  const brands = [...census.brands].sort((a, b) => {
    if (sort === 'lots') return b.lots - a.lots
    if (sort === 'name') return a.brand.localeCompare(b.brand)
    return b.value_usd - a.value_usd
  })

  return (
    <>
      <p className="eyebrow">Auction Census</p>
      <h1 className="pagetitle">What actually sold, and how much of it we hold</h1>
      <p className="lede">
        {totals.auctions} auction rooms, {totals.lots} lots, {usdFull(totals.value_usd)} of hammer
        across three currencies. This page is the aggregate of the harvest that feeds the register's
        comparable sales — and it publishes its own incompleteness, because the number that matters
        is the coverage line, not the headline.
      </p>

      <div className="metric-strip">
        <Cell label="Lots harvested" value={totals.lots} note={`${totals.priced_lots} WITH A HAMMER PRICE`} />
        <Cell label="Hammer value" value={usd(totals.value_usd)} note="USD, ECB-CONVERTED WHERE NEEDED" />
        <Cell label="Our coverage" value={`${coverage.lots_matching_a_card_pct}%`} note={`${coverage.lots_matching_a_card} OF ${totals.lots} LOTS MATCH A CARD`} />
        <Cell label="Marques seen" value={totals.brands_seen} note={`${totals.brands_in_register} ARE IN THE REGISTER`} />
      </div>

      <section className="sect">
        <h2 className="sect-h">
          <span>What this page refuses to claim</span>
          <span className="mono">THE COVERAGE LINE IS THE HONEST ONE</span>
        </h2>
        <p className="honest">
          {coverage.lots_matching_a_card} of {totals.lots} lots price a reference this register holds
          exactly — {usdFull(coverage.value_matching_a_card_usd)}, or {coverage.value_matching_a_card_pct}%
          of the money. The register does not need the other {totals.lots - coverage.lots_matching_a_card}
          lots to be correct; it needs to know which objects it is pricing. A dossier with no comps says
          so rather than borrowing a neighbouring reference's hammer.
        </p>
        <p className="honest">
          A separate matcher finds real sales of <em>neighbouring</em> references — a Lange 1 101.035
          against our 101.025, a Nautilus 3700/11 against our 3700/1A. Those appear on the dossier as
          variant sales with the caveat attached, and they are deliberately not counted in the coverage
          figure above. {coverage.note}
        </p>

        <p className="honest">
          <strong>And here is the part that is the matcher&apos;s fault, not the market&apos;s.</strong>{' '}
          {totals.lots_with_no_published_reference} of these {totals.lots} lots publish
          no reference number at all — {usdFull(totals.value_with_no_published_reference_usd)}, or{' '}
          {((100 * totals.value_with_no_published_reference_usd) / totals.value_usd).toFixed(1)}% of the
          money here. That is not a gap in the market; it is a gap in the tier. Rolex, Patek, Audemars
          Piguet and Cartier publish a reference number. The independent haute-horlogerie makers do
          not: Voutilainen, F.P. Journe, Louis Richard and Akrivia identify a watch by its{' '}
          <em>name</em>. An earlier build of this page matched on reference only, so the whole
          independent tier was invisible to the coverage line — the number was measuring our matcher,
          not the market.
        </p>
      </section>

      <section className="sect">
        <div className="section-rule">
          <h2>How a lot counts as covered.</h2>
          <span className="sticker-inline mono">TWO EXACT-IDENTITY CHANNELS · NEITHER IS A NEAR-MISS</span>
        </div>
        <dl className="census-channels">
          <div>
            <dt>Brand + published reference number</dt>
            <dd>
              <strong>{coverage.by_reference.lots}</strong> lots ·{' '}
              {usdFull(coverage.by_reference.value_usd)} · {coverage.by_reference.value_pct}% of value
            </dd>
            <p>{coverage.by_reference.meaning}</p>
          </div>
          <div>
            <dt>Brand + published model name</dt>
            <dd>
              <strong>{coverage.by_model_name.lots}</strong> lots ·{' '}
              {usdFull(coverage.by_model_name.value_usd)} · {coverage.by_model_name.value_pct}% of
              value · {coverage.by_model_name.cards_in_channel} card opted in
            </dd>
            <p>{coverage.by_model_name.meaning}</p>
          </div>
        </dl>
        <p className="census-channels-foot mono micro">
          {totals.lots_publishing_neither_reference_nor_model} LOTS PUBLISH NEITHER A REFERENCE NOR A
          MODEL NAME — {usdFull(totals.value_publishing_neither_reference_nor_model_usd)} WITH NOTHING
          TO MATCH AGAINST. WE REFUSE TO GUESS THOSE.
        </p>
      </section>

      <section className="sect">
        <h2 className="sect-h"><span>The three sale rooms</span><span className="mono">HARD CURRENCY, NO CONVERSION HIDING</span></h2>
        <table className="sales-table">
          <thead>
            <tr><th>Date</th><th>Sale</th><th>City</th><th className="num">Lots</th><th className="num">Hammer (USD)</th><th>Struck in</th></tr>
          </thead>
          <tbody>
            {census.auctions.map((a) => (
              <tr key={a.code}>
                <td className="mono">{a.date ?? '—'}</td>
                <td>{a.name ?? a.code}</td>
                <td className="dim">
                  {a.code.startsWith('NY') ? 'New York' : a.code.startsWith('HK') ? 'Hong Kong' : a.code.startsWith('CH') ? 'Geneva' : '—'}
                </td>
                <td className="num mono">{a.lots}</td>
                <td className="num mono">{usdFull(a.value_usd)}</td>
                <td className="mono micro dim">
                  {a.currencies.join(' · ')}
                  {a.currencies.some((c) => c !== 'USD') && <span title="Converted at the European Central Bank reference rate for the last business day on or before the sale date"> →USD</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
          {totals.lots_converted_from_other_currency} of {totals.lots} lots were struck in a currency
          other than USD. Their USD figures use the European Central Bank reference rate for the last
          business day on or before the sale date — which is often the day before, because the sales fell
          on a weekend. {totals.unconverted_lots === 0 ? 'Every priced lot converted.' : 'Some lots could not be converted and are excluded from the USD total.'}
        </p>
      </section>

      <section className="sect">
        <h2 className="sect-h">
          <span>Which marques actually traded</span>
          <span className="mono">NOT THE SAME LIST AS MARKET CAP</span>
        </h2>
        <p className="honest" style={{ marginBottom: 'var(--space-md)' }}>
          The auction's own view of the market. Louis Richard took {usd(5_500_000)} on two lots and we
          hold no card for it; Rolex took {usd(17_400_000)} across 111 lots and we hold 46 cards. Lot count
          is consignment frequency, not popularity — a house with a strong buyer for one reference will
          show many lots of that reference and none of anything else.
        </p>
        <div className="pom-watch-scopes" role="group" aria-label="Sort the marques">
          <button type="button" aria-pressed={sort === 'value'} onClick={() => setSort('value')}>BY VALUE</button>
          <button type="button" aria-pressed={sort === 'lots'} onClick={() => setSort('lots')}>BY LOT COUNT</button>
          <button type="button" aria-pressed={sort === 'name'} onClick={() => setSort('name')}>A–Z</button>
        </div>
        <table className="sales-table" style={{ marginTop: 'var(--space-md)' }}>
          <thead>
            <tr><th>Marque</th><th className="num">Lots</th><th className="num">Hammer (USD)</th><th className="num">Our cards</th><th>Coverage</th></tr>
          </thead>
          <tbody>
            {brands.slice(0, 60).map((b) => (
              <tr key={b.brand_key}>
                <td>{b.cards_in_register > 0
                  ? <Link to={`/brands#${b.brand_key}`}>{b.brand}</Link>
                  : <span className="dim">{b.brand}</span>}</td>
                <td className="num mono">{b.lots}</td>
                <td className="num mono">{usdFull(b.value_usd)}</td>
                <td className="num mono">{b.cards_in_register || <span className="dim">0</span>}</td>
                <td>
                  <span className="rc-trend-badge mono" title={b.cards_in_register > 0 ? 'We hold cards for this marque' : 'This marque traded here and the register has no card for it'}>
                    {b.cards_in_register > 0 ? 'IN REGISTER' : 'NOT CATALOGUED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {brands.length > 60 && (
          <p className="micro dim" style={{ marginTop: 'var(--space-sm)' }}>
            Showing the top 60 of {brands.length} marques seen. {brands.filter((b) => b.cards_in_register === 0).length} of them
            are not catalogued.
          </p>
        )}
      </section>

      <section className="sect">
        <h2 className="sect-h"><span>How this was built</span><span className="mono">REPRODUCIBLE, NOT A SNAPSHOT</span></h2>
        <dl className="spec-grid">
          <Spec label="Source" text={`${census.source} public auction results pages, harvested ${census.harvest_date.slice(0, 10)}. ${census.source_url}`} />
          <Spec label="Method" text={census.method} />
          <Spec label="Limit" text={census.limitation} />
          <Spec label="Rebuild" text="npm run data:census re-derives this file from the harvest queue. It never invents a lot, a price, or a currency." />
        </dl>
        <p className="micro dim" style={{ marginTop: 'var(--space-md)' }}>
          Raw lot-by-lot intake stays private — it carries page text and every unmatched record, which
          is a reviewer's desk, not a reader's page. What a dossier needs is a cited, comparable sale.
          What a reader needs is this shape, with the gap stated. <Link to="/methodology">Methodology →</Link>
        </p>
      </section>
    </>
  )
}

function Cell({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="mcell">
      <span className="lab">{label}</span>
      <span className="val big">{value}</span>
      <span className="note">{note}</span>
    </div>
  )
}

function Spec({ label, text }: { label: string; text: string }) {
  return (
    <div className="spec-row">
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  )
}