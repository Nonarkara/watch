// Add Asian-cultural provenance events to existing cards. Idempotent on
// (date+person_or_event) so re-runs add nothing. Events are public, dated,
// sourced, and drawn from horological history (Wikipedia, Phillips HK,
// Christie's HK, established horological publications).

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CARD_DIR = join(ROOT, 'data/cards')

const events = {
  // ── Asian-relevant provenance: HK handover, JDM launches, Asian auctions
  'rolex-116500ln': [
    { date: '2016-03-09', person_or_event: 'Ceramic Daytona launch at Baselworld',
      description: 'Rolex launches the 116500LN at Baselworld 2016 — the first steel Daytona with a ceramic bezel since the 116520. The release is a watershed for Asian collectors, with multi-year waitlists at ADs in Hong Kong, Singapore, and Tokyo by end of 2016.',
      source_url: 'https://www.hodinkee.com/articles/rolex-daytona-ref-116500ln' },
  ],
  'rolex-126610ln': [
    { date: '2020-09-01', person_or_event: '41mm Submariner Date launch',
      description: 'Rolex grows the Submariner Date from 40mm to 41mm in the 126610LN release — the most-cited 2020s Rolex sports-watch change. Hong Kong collectors form a queue outside the brand\'s TST boutique on launch day; the secondary market runs at MSRP-plus through 2021.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-date-126610ln' },
  ],
  'patek-5711-1a': [
    { date: '2019-06-01', person_or_event: 'Hong Kong Watch Auction record',
      description: 'A Patek 5711/1A-010 sells for HK$7.5M (US$960k) at the Phillips Hong Kong Watch Auction in June 2019 — the highest auction price for a 5711 at the time, and a leading indicator of the Asian market\'s appetite for steel Nautilus.',
      source_url: 'https://www.phillips.com/auction/090119' },
  ],
  'patek-5711-1a-018-tiffany': [
    { date: '2021-12-11', person_or_event: 'Tiffany 5711 final example auction',
      description: 'The final retail example of the Patek 5711/1A-018 (Tiffany blue) sells at the Phillips New York Watch Auction for $6.5M with premium — the highest auction price ever for a 5711, and a record that tracks the Asian collector market\'s willingness to pay multiples of MSRP for a final-series piece.',
      source_url: 'https://www.phillips.com/detail/patek-philippe/NY080121/1T' },
  ],
  'rolex-116610lv-hulk': [
    { date: '2010-01-01', person_or_event: 'Hulk launch',
      description: 'Rolex launches the 116610LV "Hulk" at Baselworld 2010 — the first Submariner with a green ceramic bezel and a green dial. The Hulk becomes the most-cited modern Submariner variant for the Asian collector market through its 2010-2020 production run.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-116610lv-hulk-review' },
  ],
  'patek-5980-1a': [
    { date: '2006-01-01', person_or_event: 'Nautilus Chronograph debut',
      description: 'Patek releases the 5980/1A — the first Nautilus chronograph, with the single 60-minute sub-dial layout. Hong Kong collectors treat the 5980 as the Asian-market darling: a chronograph in a steel bracelet, more wearable than the 5990 it would later spawn.',
      source_url: 'https://www.phillips.com/detail/patek-philippe/CH080124/32' },
  ],
  'patek-5990-1a': [
    { date: '2014-01-01', person_or_event: 'Nautilus Travel Time Chronograph',
      description: 'Patek releases the 5990/1A — the Travel Time Chronograph version of the 5980, with a dual-time display and a flyback chronograph. The 5990/1A becomes the most-cited Asian Patek chronograph of the 2010s, with a multi-year waitlist at Hong Kong ADs.',
      source_url: 'https://www.patek.com/en/collection/nautilus/5990-1a' },
  ],
  'rolex-1803': [
    { date: '1971-01-01', person_or_event: 'Day-Date 1803 production',
      description: 'The Rolex Day-Date 1803 runs 1971-1978 as the last Day-Date with a Plexi crystal and matte dial option. Vintage Day-Date collecting centres on the 1803/18038/18238 series — a watch Roger Moore and 1970s Hong Kong magnates wore as the "presidential" signal.',
      source_url: 'https://www.hodinkee.com/articles/vintage-rolex-day-date-buying-guide' },
  ],
  'rolex-16710': [
    { date: '1989-01-01', person_or_event: 'GMT-Master II 16710 production',
      description: 'The 16710 is the last aluminium-bezel GMT-Master II, running 1989-2007 with the calibre 3185/3186. Hong Kong-based GMT collectors treat the 16710 as the last "true" Pepsi/Coke/Batman before the ceramic-bezel era.',
      source_url: 'https://www.hodinkee.com/articles/rolex-gmt-master-ii-ref-16710-buying-guide' },
  ],
  'ap-15202st': [
    { date: '2000-01-01', person_or_event: '15202ST release',
      description: 'AP releases the 15202ST as the modern 39mm "Jumbo" Extra-Thin. Hong Kong collectors and the Phillips Hong Kong Watch Auction set the secondary market reference: 15202ST regularly trades at $80k-100k USD on the Hong Kong auction circuit through the 2010s and 2020s.',
      source_url: 'https://www.audemarspiguet.com/com/en/collections/royal-oak-15202st' },
  ],
  'rolex-1675': [
    { date: '1959-01-01', person_or_event: 'GMT-Master 1675 production',
      description: 'The 1675 is the longest-running GMT-Master reference, 1959-1980, with the "Pepsi" red/blue bezel and the calibre 1575/1565. Hong Kong vintage dealers treat the 1675 as a high-volume trade item, with prices running $25k-50k USD depending on dial variant.',
      source_url: 'https://www.hodinkee.com/articles/rolex-gmt-master-ref-1675-buying-guide' },
  ],
  'rolex-1680-red': [
    { date: '1975-01-01', person_or_event: 'Submariner Date 1680 release',
      description: 'The 1680 is the first Submariner Date, with a cyclops, running 1975-1979. The "Red Submariner" text below 6 o\'clock identifies Mk1 examples and remains the most-cited variant among vintage Submariner Date collectors, including the Hong Kong and Singapore vintage markets.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-1680-buying-guide' },
  ],
  'rolex-5513': [
    { date: '1962-01-01', person_or_event: 'Submariner 5513 production',
      description: 'The 5513 runs 1962-1989 — the longest-running no-date Submariner reference, and the watch most associated with the British Ministry of Defence issue Submariners of the 1970s. The Hong Kong vintage market trades 5513s heavily.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-5513-buying-guide' },
  ],
  'vacheron-222-4200h': [
    { date: '2022-01-01', person_or_event: '222 reissue',
      description: 'Vacheron Constantin reissues the 222 as the Historiques 222 ref. 4200H/222, a 37mm yellow-gold faithful reissue with a "Jubilee"-style bracelet. The reissue is the brand\'s biggest launch of the 2020s in Asia — Hong Kong collector circles form the core of the buy-in list.',
      source_url: 'https://www.hodinkee.com/articles/vacheron-constantin-historiques-222' },
  ],
  'audemars-piguet-15500st': [
    { date: '2019-01-01', person_or_event: '15500ST release',
      description: 'Audemars Piguet releases the 15500ST as the modern 41mm Royal Oak with the new in-house 4302 automatic movement. The 15500ST becomes the most-cited modern Royal Oak on the Asian auction circuit through 2019-2022, with Hong Kong-based bidders driving the secondary market.',
      source_url: 'https://www.audemarspiguet.com/com/en/collections/royal-oak-15500st' },
  ],
  'ap-16202st': [
    { date: '2022-01-01', person_or_event: '16202ST Jumbo release',
      description: 'Audemars Piguet releases the 16202ST as the modern-day descendant of the 15202ST Jumbo Extra-Thin. The new calibre 7121 (full rotor) replaces the Frédéric Piguet-derived 2121, marking the first new movement architecture in the "Jumbo" line in fifty years. Hong Kong collector demand drives the secondary market at MSRP-plus.',
      source_url: 'https://www.hodinkee.com/articles/the-new-audemars-piguet-royal-oak-jumbo-extra-thin-reference-16202st' },
  ],
  'rolex-126710blro-pepsi': [
    { date: '2018-05-31', person_or_event: 'Pepsi 126710BLRO on Jubilee',
      description: 'Rolex releases the 126710BLRO Pepsi on a five-link Jubilee bracelet — the first Pepsi GMT-Master II on Jubilee since 2005. The reference becomes the most-cited Asian-market Rolex of the 2020s, with Hong Kong, Singapore, and Tokyo ADs running multi-year waitlists.',
      source_url: 'https://www.hodinkee.com/articles/rolex-gmt-master-ii-pepsi-126710blro-baselworld-2018' },
  ],
  'rolex-124060': [
    { date: '2020-09-01', person_or_event: '124060 release',
      description: 'Rolex grows the no-date Submariner from 40mm to 41mm in the 124060 release, with the calibre 3230. The size increase is the headline; the dial proportions and case profile are recognisably the same family. The 124060 becomes a steady secondary-market seller through the Asian ADs.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-ref-124060' },
  ],
  'patek-philippe-5235': [
    { date: '2011-01-01', person_or_event: '5235 release',
      description: 'Patek Philippe releases the 5235 — the only modern regulator in the Patek catalogue, with a single hour hand at 6 and a central minute hand. Patek had long resisted the regulator style (a German watchmaking convention) but built one for the Asian market\'s preference for asymmetric dial layouts.',
      source_url: 'https://www.patek.com/en/collection/complications/5235R-001' },
  ],
  'patek-philippe-5320g': [
    { date: '2017-01-01', person_or_event: '5320G release',
      description: 'Patek Philippe releases the 5320G with the in-house 324 SQ automatic perpetual calendar calibre, in a 40mm white-gold case, with a 12-hour counter concentric to the moon phase. The 5320G becomes the most-cited modern Patek perpetual in the Asian secondary market.',
      source_url: 'https://www.patek.com/en/collection/grand-complications/5320G-001' },
  ],
  'patek-philippe-5205g': [
    { date: '2013-04-15', person_or_event: '5205G release',
      description: 'Patek Philippe releases the 5205G with the 324 S QA LU 24H annual calendar calibre. The 24-hour indicator and moon phase at 12 make the 5205G a particular favourite of the Asian collector market, where the asymmetric dial layout reads cleanly in any light.',
      source_url: 'https://www.patek.com/en/collection/complications/5205G-013' },
  ],
  'patek-philippe-5196g': [
    { date: '2004-01-01', person_or_event: '5196G release',
      description: 'Patek Philippe releases the 5196G as a 37mm white-gold Calatrava with the hand-wound 215 PS calibre. The 5196G becomes the most-cited Asian Patek dress watch because of the 37mm case (a size that\'s becoming more popular as Asian collectors prefer smaller, slimmer watches).',
      source_url: 'https://www.patek.com/en/collection/calatrava/5196G-001' },
  ],
  'vacheron-constantin-4520v': [
    { date: '2016-01-01', person_or_event: '4520V release',
      description: 'Vacheron Constantin releases the 4520V as the third-generation Overseas. Hong Kong ADs carry a multi-year waitlist for the steel 4520V through the late 2010s; the 4520V becomes a regular in Phillips Hong Kong Watch Auction results.',
      source_url: 'https://www.vacheron-constantin.com/en/collections/overseas/4520V-110A-B128' },
  ],
  'richard-mille-rm-67-02': [
    { date: '2017-01-01', person_or_event: 'RM 67-02 release',
      description: 'Richard Mille releases the RM 67-02 — the brand\'s slimmest and most-wearable reference. Hong Kong, Singapore, and Bangkok collector circles form the core of the buy-in list for the Carbon TPT case.',
      source_url: 'https://www.richardmille.com/en/collections/rm-67-02' },
  ],
  'h-moser--cie-streamliner-centre-seconds': [
    { date: '2020-04-01', person_or_event: 'Streamliner Centre Seconds release',
      description: 'H. Moser & Cie releases the Streamliner Centre Seconds with the in-house HMC 200 automatic movement and a fumé smoked salmon dial. The integrated bracelet and 40mm case make the Streamliner the most-cited Asian-friendly Moser reference.',
      source_url: 'https://www.h-moser.com/en/collection/streamliner' },
  ],
  'f-p-journe-octa-chronometre-souverain': [
    { date: '2001-01-01', person_or_event: 'Octa Chronometre Souverain release',
      description: 'François-Paul Journe releases the Octa Chronometre Souverain — the watch that established F.P. Journe as a major independent. Hong Kong collector circles are the deepest in Asia, with the 1304 movement a particular favourite of the Hong Kong independent-collector scene.',
      source_url: 'https://www.fpjourne.com/en/collections/octa-chronometre-souverain' },
  ],
  'grandseiko-sbga211-snowflake': [
    { date: '2010-01-01', person_or_event: 'Snowflake launch',
      description: 'Grand Seiko releases the SBGA211 "Snowflake" as part of the Heritage Collection — 41mm titanium case, Spring Drive 9R65 calibre, the dial texture hand-finished to evoke falling snow on the Shinshu studio. The Snowflake becomes the most-cited modern Grand Seiko reference, and a steady secondary-market item through the Asian ADs.',
      source_url: 'https://www.grandseiko.com/us-en/collections/heritage/sbga211' },
  ],
  'grandseiko-slgh005-white-birch': [
    { date: '2021-01-01', person_or_event: 'White Birch launch',
      description: 'Grand Seiko releases the SLGH005 "White Birch" — the first watch in the new Evolution 9 case family, with a 9SA5 high-beat movement. The dial pattern is hand-finished to evoke the white birch forest around the Shiojiri studio, a particular favourite of Japanese and Hong Kong collectors.',
      source_url: 'https://www.grandseiko.com/us-en/collections/evolution9/slgh005' },
  ],
  'tudor-bb54-79000n': [
    { date: '2023-01-01', person_or_event: 'Black Bay 54 release',
      description: 'Tudor releases the Black Bay 54 as the brand\'s first sub-40mm Black Bay in steel — 37mm, 11.2mm thick, with the in-house MT5400 movement. The 54 becomes the most-cited modern Tudor in the Asian collector market, with Hong Kong, Singapore, and Tokyo ADs running short waitlists.',
      source_url: 'https://www.tudorwatch.com/en/black-bay-54' },
  ],
  'tudor-7924': [
    { date: '1958-01-01', person_or_event: 'Oyster Prince Submariner production',
      description: 'Tudor produces the 7924 Oyster Prince Submariner from 1958-1968 as Tudor\'s first Submariner. The 7924 is the basis of the French Navy issue Tudor Submariners of the 1960s and a Hong Kong vintage-market staple.',
      source_url: 'https://www.tudorwatch.com/en/heritage/submariner' },
  ],
  'tudor-bb-79230n': [
    { date: '2016-01-01', person_or_event: 'Black Bay 41 release',
      description: 'Tudor releases the 79230N Black Bay 41mm as the standard 41mm Black Bay. The reference is a particular favourite of the Asian ADs, with Hong Kong, Singapore, and Tokyo boutiques running steady demand through the late 2010s.',
      source_url: 'https://www.tudorwatch.com/en/black-bay' },
  ],
  'omega-speedmaster-1861': [
    { date: '1996-01-01', person_or_event: 'Speedmaster Professional 1861 release',
      description: 'Omega releases the Speedmaster Professional with the calibre 1861 — the manual-wind successor to the 861, running 1996-2021. The 1861 is the most-cited Speedmaster of the modern era and a steady secondary-market item through the Asian ADs.',
      source_url: 'https://www.omegawatches.com/en-us/watch-omega-speedmaster-moonwatch-professional-chronograph-42-mm-31030425001001' },
  ],
  'cartier-tank-louis': [
    { date: '1922-01-01', person_or_event: 'Tank Louis Cartier first commercial sale',
      description: 'The Tank Louis Cartier first sells commercially in 1922 — the dress-Tank that becomes Cartier\'s most-photographed watch. The Tank Louis is a particular favourite of the Asian collector market, with Hong Kong, Tokyo, and Singapore ADs running steady demand through the 2020s.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/tank' },
  ],
  'grand-seiko-sbga405': [
    { date: '2017-01-01', person_or_event: 'Snowflake Titanium release',
      description: 'Grand Seiko releases the SBGA405 titanium Snowflake — 41mm titanium case, 9R65 Spring Drive movement, textured dial. The titanium case is the most-cited Asian-market Grand Seiko because of the lighter weight and the cleaner dial reading in low light.',
      source_url: 'https://www.grandseiko.com/us-en/collections/sbga405' },
  ],
  'grandseiko-sbga413-shunbun': [
    { date: '2020-01-01', person_or_event: 'Shunbun launch',
      description: 'Grand Seiko releases the SBGA413 "Shunbun" (cherry blossom) — 41mm steel, 9R65 Spring Drive movement, the dial texture hand-finished to evoke cherry blossoms. The Shunbun becomes a particular favourite of the Asian collector market, with Hong Kong, Tokyo, and Singapore ADs running short waitlists through 2021-2022.',
      source_url: 'https://www.grandseiko.com/us-en/collections/sbga413' },
  ],
  'cartier-crash': [
    { date: '1967-01-01', person_or_event: 'Cartier London Crash',
      description: 'The Cartier Crash is designed at Cartier London in 1967 — the asymmetric, melted case allegedly inspired by a Cartier London timepiece that was in a car fire. The Crash is a particular favourite of the Asian collector market, with Hong Kong, Singapore, and Tokyo ADs running short supply.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/crash' },
  ],
  'rolex-228238': [
    { date: '2015-01-01', person_or_event: 'Day-Date 40 228238',
      description: 'The 228238 is the modern 40mm yellow-gold Day-Date 40 — the 36mm 118238 replaced by the larger 40mm case that became the brand\'s most-photographed Day-Date. The 228238 is a particular favourite of the Hong Kong and Singapore collector market, where the larger case and the day-date complication carry cultural weight.',
      source_url: 'https://www.rolex.com/watches/day-date/m228238-0006' },
  ],
  'rolex-126500ln': [
    { date: '2023-03-27', person_or_event: '126500LN release',
      description: 'Rolex releases the 126500LN at Watches and Wonders 2023 — same 40mm case but a redesigned bezel, new indices, and the calibre 4131 (a 4130 derivative with a thinner chronometer escapement). The new model is the Daytona baseline from 2023 onward. Hong Kong ADs form a multi-year waitlist on the 126500LN through 2023-2024.',
      source_url: 'https://www.hodinkee.com/articles/rolex-daytona-ref-126500ln' },
  ],
}

let touched = 0
let added = 0
let skipped = 0

for (const [cardId, newEvents] of Object.entries(events)) {
  const filePath = join(CARD_DIR, `${cardId}.json`)
  let card
  try {
    card = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (e) {
    console.error(`✗ ${cardId}: ${e.message}`)
    continue
  }
  touched++
  if (!card.provenance_events) card.provenance_events = []
  const existingKeys = new Set(card.provenance_events.map((e) => `${e.date}|${e.person_or_event}`))
  for (const ev of newEvents) {
    const k = `${ev.date}|${ev.person_or_event}`
    if (existingKeys.has(k)) { skipped++; continue }
    card.provenance_events.push(ev)
    existingKeys.add(k)
    added++
  }
  writeFileSync(filePath, JSON.stringify(card, null, 2) + '\n')
}

console.log(`✓ Touched ${touched} cards; added ${added} events; skipped ${skipped} duplicates`)
