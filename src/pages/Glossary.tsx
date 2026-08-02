import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Term {
  term: string
  def: string
  example?: string
  category: 'mechanics' | 'market' | 'watchmaking' | 'value'
}

const TERMS: Term[] = [
  // Mechanics
  { term: 'Movement', category: 'mechanics',
    def: 'The engine of the watch — the mainspring, gear train, escapement, balance, and dial-side hands. Sometimes called a caliber or calibre.',
    example: 'The Rolex 4130 is an automatic chronograph movement.' },
  { term: 'Caliber / Calibre', category: 'mechanics',
    def: 'A specific movement design, usually a number the manufacturer uses. Two watches can share a case but different calibers.',
    example: 'Patek 240 PS IRM QA LU is a perpetual calendar caliber.' },
  { term: 'Escapement', category: 'mechanics',
    def: 'The mechanism that converts the energy stored in the mainspring into the discrete ticks of the watch. The lever escapement (invented 1754) is the most common.',
    example: 'Co-axial escapements, tourbillons, and constant-force escapements are alternatives.' },
  { term: 'Tourbillon', category: 'mechanics',
    def: 'A rotating cage that holds the escapement to average out gravity\'s effect on rate. Invented by Abraham-Louis Breguet in 1795. Aesthetically prized.',
    example: 'A modern tourbillon is mostly a horological statement, not a precision tool — wristwatches change orientation constantly.' },
  { term: 'Power reserve', category: 'mechanics',
    def: 'How long the watch runs from a fully-wound state. Mechanical watches range from ~38 hours to 10 days; longer reserves use multiple barrels or constant-force mechanisms.' },
  { term: 'Rotor', category: 'mechanics',
    def: 'A weighted disc that swings with the wearer\'s motion to wind an automatic movement. Most rotate in both directions; some are unidirectional.' },
  { term: 'Mainspring', category: 'mechanics',
    def: 'The coiled spring inside the barrel that stores energy. Manual watches are wound by turning the crown; automatics are wound by the rotor.' },
  { term: 'Jewels', category: 'mechanics',
    def: 'Synthetic ruby or sapphire bearings at high-friction pivots. Common counts: 17 (basic), 21 (date), 25-31 (chronograph), 36+ (complications). More jewels ≠ better.' },
  { term: 'Chronograph', category: 'mechanics',
    def: 'A watch with a stopwatch function. The chronograph pusher(s) start, stop, and reset the central seconds hand. Distinct from the chronometer certification.' },
  { term: 'Complication', category: 'mechanics',
    def: 'Any function beyond timekeeping. Date, GMT, chronograph, calendar, moon phase, equation of time, repeater, tourbillon are all complications. The fewer the complications, the "simpler" the watch — though simple is rarely easier to make well.' },

  // Watchmaking
  { term: 'Case material', category: 'watchmaking',
    def: 'Stainless steel (often "Oystersteel" at Rolex), titanium, gold (yellow, white, rose), platinum, ceramic, or bronze. Material affects weight, scratch behaviour, and patina.',
    example: 'Oystersteel is Rolex\'s 904L stainless; most other brands use 316L.' },
  { term: 'Bezel', category: 'watchmaking',
    def: 'The ring around the crystal. Functional bezels (dive, GMT, tachymeter) carry markings; decorative bezels are smooth or set with stones.' },
  { term: 'Lugs', category: 'watchmaking',
    def: 'The four protrusions where the strap or bracelet attaches. Lug width and lug-to-lug distance determine what straps fit a watch.' },
  { term: 'Crown', category: 'watchmaking',
    def: 'The button on the side used to wind the watch and set the time. Screw-down crowns improve water resistance.' },
  { term: 'Crystal', category: 'watchmaking',
    def: 'The transparent cover over the dial. Sapphire (most luxury), mineral (mid), acrylic (vintage, easily polished out).' },
  { term: 'Bracelet vs strap', category: 'watchmaking',
    def: 'Bracelet is metal, integrated or with end-links. Strap is leather, rubber, or fabric with a buckle. The same watch can take both.' },

  // Market
  { term: 'MSRP', category: 'market',
    def: 'Manufacturer\'s Suggested Retail Price. The price the brand sets; what an authorised dealer charges before any market premium. We list MSRP history, not asking prices.' },
  { term: 'Grey market', category: 'market',
    def: 'A watch sold by an authorised dealer (AD) at a premium above MSRP. Common for hot references (steel Daytona, Nautilus 5711). Grey-market pieces usually carry the brand warranty but not the AD relationship.' },
  { term: 'Comp / comparable sale', category: 'market',
    def: 'A real, sold transaction for the same reference — same metal, dial, and case. We log sold prices only, with the URL of the auction page or the deal record.',
    example: 'A Tiffany-blue 5711/1A-018 is a variant comp, not a comparable — same model, different dial. The variant sale is cited; it is not fed to the estimate.' },
  { term: 'Hype premium', category: 'market',
    def: 'The gap between MSRP and the actual market price, driven by demand exceeding authorised supply. Reflects attention, not always scarcity.' },
  { term: 'Liquidity', category: 'market',
    def: 'How fast a watch sells at market. High-liquidity references clear in days at retail-adjacent prices; low-liquidity references take months or longer.' },
  { term: 'Auction venue', category: 'market',
    def: 'Phillips, Christie\'s, Sotheby\'s, Bonhams, and Antiquorum handle the bulk of high-end watch auctions. Prices include buyer\'s premium, so the same lot number on the same day at the same venue is reproducible.' },

  // Value
  { term: 'Scarcity', category: 'value',
    def: 'A composite measure of how physically hard a reference is to obtain. Inputs: limited-edition status, production volume (where known), discontinuation, and waitlist evidence.',
    example: 'The Patek 5711/1A was "scarce" by every measure during 2016-2021 — limited production, multi-year AD waitlists, and discontinuation in 2022.' },
  { term: 'Attention', category: 'value',
    def: 'How culturally visible a reference is — screen placements, celebrity sightings, press coverage. Attention is not scarcity. A watch can be very famous and very available.' },
  { term: 'Provenance', category: 'value',
    def: 'A dated, sourced event that connects a reference to a moment — a launch, a celebrity sighting, a record sale, a discontinuation. The "Federer effect" layer.',
    example: 'Paul Newman\'s own 6239 Daytona selling for $17.75M in 2017 is a provenance event for the 6239 reference family.' },
  { term: 'Honesty ladder', category: 'value',
    def: 'Time Pop\'s ranking of how much confidence a number deserves: cited comp with URL > cited comp with caveat > estimator above 3 sales > estimator above 1 sale > refusal with reason. Every published number sits on one of these rungs.' },
  { term: 'Family vs reference', category: 'value',
    def: 'A "family" is the broader model line (Royal Oak, Daytona, Speedmaster). A "reference" is a specific generation within it (15202ST, 116500LN, 3861). Image and comp coverage usually differs at the reference level.' },
]

const CATEGORIES: { k: Term['category']; label: string; blurb: string }[] = [
  { k: 'mechanics', label: 'Mechanics', blurb: 'What moves the watch.' },
  { k: 'watchmaking', label: 'Watchmaking', blurb: 'The case, crystal, and how it sits on the wrist.' },
  { k: 'market', label: 'Market', blurb: 'How the price gets set, recorded, and cited.' },
  { k: 'value', label: 'Value', blurb: 'How we reason about scarcity, attention, and the gap between them.' },
]

export default function Glossary() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'all' | Term['category']>('all')

  const filtered = TERMS.filter((t) => {
    if (cat !== 'all' && t.category !== cat) return false
    if (!q) return true
    const needle = q.toLowerCase()
    return t.term.toLowerCase().includes(needle) || t.def.toLowerCase().includes(needle)
  })

  return (
    <>
      <Link to="/" className="crumb">← HOME</Link>
      <section className="page-head">
        <div>
          <p className="eyebrow">GLOSSARY · {TERMS.length} TERMS</p>
          <h1 className="pagetitle">Words a serious watch site should define.</h1>
          <p className="lede">
            Each term here is used somewhere on the site. If you find one that isn\'t,
            it is a bug. Definitions are plain-spoken, not encyclopedic.
          </p>
        </div>
      </section>

      <div className="glossary-controls">
        <input
          className="inp"
          type="search"
          placeholder="Search terms and definitions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search the glossary"
        />
        <div className="glossary-chips" role="group" aria-label="Filter by category">
          <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>All {TERMS.length}</button>
          {CATEGORIES.map((c) => {
            const n = TERMS.filter((t) => t.category === c.k).length
            return (
              <button key={c.k} className={'chip' + (cat === c.k ? ' on' : '')} onClick={() => setCat(c.k)}>
                {c.label} · {n}
              </button>
            )
          })}
        </div>
      </div>

      {CATEGORIES.map((c) => {
        const terms = filtered.filter((t) => t.category === c.k)
        if (!terms.length) return null
        return (
          <section key={c.k} className="glossary-section">
            <div className="section-rule">
              <h2>{c.label}</h2>
              <span className="sticker-inline mono">{c.blurb}</span>
            </div>
            <dl className="glossary-list">
              {terms.map((t) => (
                <div key={t.term} className="glossary-item">
                  <dt>{t.term}</dt>
                  <dd>
                    <p>{t.def}</p>
                    {t.example && <p className="glossary-example dim">e.g. {t.example}</p>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}

      {filtered.length === 0 && (
        <p className="boot mono">NO TERMS MATCH. TRY A DIFFERENT WORD, OR RESET.</p>
      )}
    </>
  )
}
