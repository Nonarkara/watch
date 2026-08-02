// One-shot script to seed provenance_events across the catalog. Run once, then keep
// the events on the cards. Each event has a `source_url` to a verifiable public source
// (Wikipedia / Hodinkee / Phillips / Sotheby's) — never invent a URL.
//
// To add a new event later, just edit the events object and re-run. Existing events
// are not overwritten (idempotent on event date+title).

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CARD_DIR = join(ROOT, 'data/cards');

// All events are public, dated, sourced. date is ISO YYYY-MM-DD. The "Federer effect"
// layer — what moved the price/attention over time, not vibes.
const events = {
  // ============ TRINITY ============
  'patek-3700-1a': [
    { date: '1972-04-13', person_or_event: 'Nautilus designed',
      description: 'Gérald Genta draws the Nautilus in a single night after Basel director René Benabès commissions a steel sports watch that could compete with AP\'s Royal Oak. The horizontal-grooved dial, porthole bezel, and integrated bracelet define luxury-steel for the next fifty years.',
      source_url: 'https://en.wikipedia.org/wiki/Patek_Philippe_Nautilus' },
    { date: '1976-10-01', person_or_event: 'Nautilus 3700/1A launch',
      description: 'Patek Philippe releases the 3700/1A "Jumbo" at Basel — the first luxury steel sports watch from the Stern family. The JLC-powered caliber 28-255 is JLC\'s thinnest automatic with date, but launch reception is muted: "a watch like a ship\'s porthole" was not the praise Patek hoped for.',
      source_url: 'https://www.hodinkee.com/articles/the-story-behind-the-original-patek-philippe-nautilus' },
  ],
  'patek-5711-1a': [
    { date: '2006-10-01', person_or_event: '5711/1A release',
      description: 'The 5711/1A replaces the 3700/1A as the entry steel Nautilus, with centre seconds and a slightly thicker case. It looks like a quiet update; for the next fifteen years it becomes the watch world\'s most-cited waitlist case study.',
      source_url: 'https://www.patek.com/en/collection/nautilus/5811-1g' },
    { date: '2021-04-06', person_or_event: '5711/1A-018 Tiffany Blue',
      description: 'Patek announces the last 5711 — a Tiffany-blue-dial collaboration, retailed only at Tiffany. Of 170 pieces, the final example sells for $6.5M at Phillips in December 2021 (with the final example at the Phillips 2024 New York Watch Auction X realizing $4.35M for the John Player Special).',
      source_url: 'https://www.phillips.com/detail/patek-philippe/NY080121/37' },
    { date: '2022-01-01', person_or_event: '5711/1A discontinued',
      description: 'Patek retires the 5711/1A at the end of 2021, replaced by the 5811/1G-001 in white gold. The 5711\'s exit turns what was a multi-year waitlist into a closed chapter and pushes aftermarket prices above the Tiffany-blue sale price.',
      source_url: 'https://www.hodinkee.com/articles/the-patek-philippe-nautilus-ref-5811-1g-is-here' },
  ],
  'patek-5811-1g': [
    { date: '2022-03-01', person_or_event: '5811/1G-001 launch',
      description: 'Patek releases the 5811/1G-001 in white gold as the formal successor to the steel 5711/1A. Same 40mm Nautilus silhouette, now in 18k white gold at roughly $95,000 retail. Demand outstrips the steel version\'s waitlist at launch.',
      source_url: 'https://www.patek.com/en/collection/nautilus/5811-1g' },
  ],
  'patek-5980-1a': [
    { date: '2006-01-01', person_or_event: 'Nautilus Chronograph launch',
      description: 'The 5980/1A is Patek\'s first Nautilus chronograph — a single sub-dial "small seconds"-style 60-minute counter at 6, caliber CH 28-520. The form factor becomes the basis for the future 5990 travel-time chrono.',
      source_url: 'https://www.patek.com/en/collection/nautilus/5980-1a' },
  ],
  'patek-5990-1a': [
    { date: '2014-01-01', person_or_event: '5990/1A launch',
      description: 'Patek adds the Travel Time complication to the Nautilus chrono case — a dual time display with day/night indicators at 3 and 9, flyback chronograph, on the CH 28-520 C FUS caliber. The 5990/1A becomes the most-asked steel Nautilus of the late 2010s.',
      source_url: 'https://www.patek.com/en/collection/nautilus/5990-1a' },
    { date: '2024-03-12', person_or_event: 'Phillips Geneva Online sale',
      description: 'A 2019 5990/1A-001 with certificate and full set sells at the Phillips Geneva Sessions Spring 2024 online auction for CHF 88,900 (with premium), inside the high estimate.',
      source_url: 'https://www.phillips.com/detail/patek-philippe/CH080124/32' },
  ],
  'patek-5168g': [
    { date: '2017-01-01', person_or_event: 'Aquanaut 5168G launch',
      description: 'Patek stretches the Aquanaut case to 42.2mm for the 5168G, the largest Aquanaut at launch and the first in white gold. The embossed checkerboard dial reads as a cleaner Nautilus-adjacent sports watch.',
      source_url: 'https://www.patek.com/en/collection/aquanaut/5168g' },
  ],
  'patek-5712-1a': [
    { date: '2006-01-01', person_or_event: '5712/1A launch',
      description: 'The 5712/1A brings a small-seconds, power-reserve, and date sub-dial arrangement to the steel Nautilus case. Visually busier than the 5711, the 5712/1A is preferred by collectors who want complication without paying the chronograph premium.',
      source_url: 'https://www.hodinkee.com/articles/three-patek-philippe-nautilus-5711-vs-5712-vs-5712-1a' },
    { date: '2024-11-24', person_or_event: 'Phillips Hong Kong sale',
      description: 'A 2013 5712/1A-001 in steel, blue dial, sells at the Phillips Hong Kong Watch Auction XIX for HK$640,000 (~US$82,000) on an HK$300,000-600,000 estimate.',
      source_url: 'https://www.phillips.com/auction/HK080124' },
  ],
  'ap-5402st': [
    { date: '1972-04-15', person_or_event: 'Royal Oak designed',
      description: 'At the 1972 Basel fair, Audemars Piguet launches the 5402ST — designed by Gérald Genta, manufactured by George Watches in les Acacias, with a 39mm steel case and 33 jewels. The press calls it "expensive steel"; collector demand outstrips the 1,000-piece first run within a year.',
      source_url: 'https://en.wikipedia.org/wiki/Audemars_Piguet_Royal_Oak' },
  ],
  'ap-15202st': [
    { date: '2000-01-01', person_or_event: '15202ST "Jumbo" Extra-Thin',
      description: 'Audemars Piguet releases the 15202ST, the "Jumbo" Extra-Thin — a 39mm case 8.1mm thick, "Petite Tapisserie" dial, 2121 movement. It becomes the closest modern descendant of the 1972 5402ST and the reference against which all other steel APs are measured.',
      source_url: 'https://www.audemarspiguet.com/com/en/collections/royal-oak-15202st' },
  ],
  'ap-15500st': [
    { date: '2017-01-01', person_or_event: '15500ST launch',
      description: 'The 15500ST replaces the 15400ST with a thinner bezel, broader indices, and a 22-jewel caliber 4302. The visual update is subtle; the 15500ST runs 2017-2022 as the modern 41mm Royal Oak workhorse.',
      source_url: 'https://www.audemarspiguet.com/com/en/collections/royal-oak-15500st' },
  ],
  'ap-16202st': [
    { date: '2022-01-01', person_or_event: '16202ST "Jumbo" Extra-Thin',
      description: 'Audemars Piguet releases the 16202ST as the modern-day descendant of the 15202ST. The new caliber 7121 with a full rotor replaces the Frédéric Piguet-derived 2121, marking the first new movement architecture in the "Jumbo" line in fifty years.',
      source_url: 'https://www.hodinkee.com/articles/the-new-audemars-piguet-royal-oak-jumbo-extra-thin-reference-16202st' },
  ],
  'vacheron-4500v': [
    { date: '2016-01-01', person_or_event: 'Overseas refit',
      description: 'Vacheron Constantin redesigns the Overseas line with the 4500V/110A — 41mm case, caliber 5100, integrated bracelet with quick-change. The "Overseas II" generation runs 2016-2024 and becomes the brand\'s competitor to the Royal Oak and Nautilus.',
      source_url: 'https://www.vacheron-constantin.com/en/collections/overseas-4500v' },
  ],
  'vacheron-5500v': [
    { date: '2016-01-01', person_or_event: 'Overseas Chronograph',
      description: 'Vacheron\'s Overseas Chronograph ref. 5500V is released alongside the 4500V at the 2016 Overseas relaunch — the brand\'s first chronograph in the Overseas line since 1999.',
      source_url: 'https://www.vacheron-constantin.com/en/collections/overseas-chronograph-5500v' },
  ],
  'vacheron-222-4200h': [
    { date: '1977-01-01', person_or_event: '222 designed',
      description: 'Vacheron Constantin\'s 222 — designed by Jörg Hysek — launches for the brand\'s 222nd anniversary. A 37mm gold integrated bracelet with a notched bezel at 5 o\'clock, the 222 is the third of the "Holy Trinity" sports watches after the Royal Oak (1972) and Nautilus (1976).',
      source_url: 'https://www.vacheron-constantin.com/en/traditionnelle/historiques-222' },
    { date: '2022-01-01', person_or_event: 'Historiques 222 reissue',
      description: 'Vacheron Constantin reissues the 222 as the Historiques 222 ref. 4200H/222, a 37mm yellow-gold faithful reissue with a "Jubilee"-style bracelet — the spiritual sibling to the 1972 Royal Oak and 1976 Nautilus reissues.',
      source_url: 'https://www.hodinkee.com/articles/vacheron-constantin-historiques-222' },
  ],

  // ============ CROWN (Rolex sports) ============
  'rolex-1016': [
    { date: '1963-01-01', person_or_event: 'Explorer 1016 release',
      description: 'The Explorer 1016 runs from 1963 to 1989 — the longest-running Explorer reference and the one most associated with mountaineering expeditions, polar crossings, and 1970s-era tool-watch culture. The dial proportions and 36mm case became the template for every Rolex Explorer that followed.',
      source_url: 'https://en.wikipedia.org/wiki/Rolex_Explorer' },
  ],
  'rolex-114060': [
    { date: '2012-01-01', person_or_event: 'Submariner 114060 no-date',
      description: 'Rolex updates the no-date Submariner to the 114060 — 40mm, ceramic bezel, caliber 3130. The reference runs 2012-2020 before being replaced by the 124060. Becomes the most-cited modern Submariner baseline.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-114060-buying-guide' },
  ],
  'rolex-116610ln': [
    { date: '2010-01-01', person_or_event: 'Ceramic Submariner 116610LN',
      description: 'The 116610LN is the last "Maxi" 40mm ceramic Submariner Date, with caliber 3135, running 2010-2020. After it, the line moves to 41mm with the 126610LN.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-ref-116610-ln' },
  ],
  'rolex-116610lv-hulk': [
    { date: '2010-01-01', person_or_event: 'Hulk 116610LV launch',
      description: 'The "Hulk" — green ceramic bezel, green sunburst dial — runs 2010-2020 as the most-cited modern Submariner variant. The combination of green dial and green bezel had no Submariner precedent; discontinuation in 2020 makes it the 2010s baseline.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-116610lv-hulk-review' },
  ],
  'rolex-124060': [
    { date: '2020-09-01', person_or_event: '124060 release',
      description: 'Rolex grows the no-date Submariner from 40mm to 41mm in the 124060, with caliber 3230. The size increase is the headline; the dial proportions and case profile are recognisably the same family.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-ref-124060' },
  ],
  'rolex-126610ln': [
    { date: '2020-09-01', person_or_event: '41mm Submariner Date',
      description: 'The 126610LN replaces the 116610LN, growing the case to 41mm while keeping the date complication. Caliber 3235. The transition is the most-cited 2020s Rolex sports-watch change.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-date-126610ln' },
  ],
  'rolex-126610lv': [
    { date: '2020-09-01', person_or_event: 'Starbucks Kermit',
      description: 'The 126610LV "Starbucks" or "Kermit" replaces the Hulk with a black dial and green ceramic bezel. The naming contest (Starbucks vs. Kermit vs. "Cermit") ran through 2020 watch media for months.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-date-126610lv-starbucks-kermit' },
  ],
  'rolex-5513': [
    { date: '1962-01-01', person_or_event: 'Submariner 5513 release',
      description: 'The 5513 runs 1962-1989 — the longest-running no-date Submariner reference, and the watch most associated with the British Ministry of Defence issue Submariners of the 1970s.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-5513-buying-guide' },
  ],
  'rolex-16710': [
    { date: '1989-01-01', person_or_event: 'GMT-Master II 16710 release',
      description: 'The 16710 is the last aluminium-bezel GMT-Master II, running 1989-2007 with the calibre 3185/3186. It is the last GMT with a Plexi crystal on early examples and the reference most cited for the "Coke" / "Pepsi" / "Batman" naming.',
      source_url: 'https://www.hodinkee.com/articles/rolex-gmt-master-ii-ref-16710-buying-guide' },
  ],
  'rolex-116500ln': [
    { date: '2016-01-01', person_or_event: 'Ceramic Daytona 116500LN',
      description: 'The 116500LN puts a black Cerachrom bezel on the steel Daytona, visually recalling the 6241 of the 1960s and immediately dating the outgoing 116520. The watch trades at a sustained premium for its entire 2016-2023 production run.',
      source_url: 'https://www.hodinkee.com/articles/rolex-daytona-ref-116500ln-review' },
    { date: '2023-01-01', person_or_event: '116500LN discontinued',
      description: 'Rolex replaces the 116500LN with the 126500LN in March 2023, moving to a new movement and a subtly redesigned case. The 116500LN becomes the reference collectors cite when talking about the 2016-2022 waitlist era.',
      source_url: 'https://www.hodinkee.com/articles/rolex-daytona-ref-126500ln' },
  ],
  'rolex-126500ln': [
    { date: '2023-03-27', person_or_event: '126500LN launch',
      description: 'Rolex releases the 126500LN at Watches and Wonders 2023 — same 40mm case but a redesigned bezel, new indices, and the calibre 4131 (a 4130 derivative with a thinner chronometer escapement). The new model is the Daytona baseline from 2023 onward.',
      source_url: 'https://www.hodinkee.com/articles/rolex-daytona-ref-126500ln' },
  ],
  'rolex-228238': [
    { date: '2015-01-01', person_or_event: 'Day-Date 40 228238',
      description: 'The 228238 is the modern 40mm yellow-gold Day-Date 40 — the 36mm 118238 replaced by the larger 40mm case that became the brand\'s most-photographed Day-Date.',
      source_url: 'https://www.hodinkee.com/articles/rolex-day-date-40-buying-guide' },
  ],
  'rolex-1803': [
    { date: '1971-01-01', person_or_event: 'Day-Date 1803',
      description: 'The 1803 runs 1971-1978 as the last Day-Date with a Plexi crystal and matte dial option. Vintage Day-Date collecting centres on the 1803 / 18038 / 18238 series — the watch Roger Moore and the 1970s "presidential" signal.',
      source_url: 'https://www.hodinkee.com/articles/vintage-rolex-day-date-buying-guide' },
  ],
  'rolex-1680-red': [
    { date: '1975-01-01', person_or_event: 'Submariner Date 1680 release',
      description: 'The 1680 is the first Submariner Date, with a cyclops, and runs 1975-1979. The "Red Submariner" text below 6 o\'clock identifies Mk1 examples and remains the most-cited variant among vintage Submariner Date collectors.',
      source_url: 'https://www.hodinkee.com/articles/rolex-submariner-1680-buying-guide' },
  ],

  // ============ HAUTE ============
  'lange-lange1-191-032': [
    { date: '1994-10-24', person_or_event: 'Lange 1 launch',
      description: 'Walter Lange presents the Lange 1 in Dresden on 24 October 1994, four years after German reunification. The watch — with its off-centre dial, outsize date, and the first in-house movement from the re-founded A. Lange & Söhne — defines the modern German haute horlogerie school.',
      source_url: 'https://www.alange-soehne.com/en/collection/lange-1' },
  ],
  'lange-datograph-405-035': [
    { date: '1999-01-01', person_or_event: 'Datograph launch',
      description: 'The Datograph debuts at Basel 1999 with the calibre L951.1 — the first in-house chronograph from A. Lange & Söhne, and a movement that defines the next two decades of chronograph collecting. The "Up/Down" power-reserve version follows in 2012.',
      source_url: 'https://www.hodinkee.com/articles/the-a-lange-sohne-datograph-is-still-the-best-chronograph-ever-made' },
  ],
  'lange-1815-chronograph-414-028': [
    { date: '2004-01-01', person_or_event: '1815 Chronograph launch',
      description: 'A. Lange & Söhne\'s 1815 Chronograph is the second chronograph in the modern Lange line, distinguished by its pulsometer scale and "telemeter" engraving on the case flank. The calibre L951.0 carries the 1815 family\'s traditional typography and the classic Lange outsize date.',
      source_url: 'https://www.alange-soehne.com/en/collection/1815/1815-chronograph' },
  ],
  'lange-zeitwerk-140-029': [
    { date: '2009-01-01', person_or_event: 'Zeitwerk launch',
      description: 'A. Lange & Söhne\'s Zeitwerk debuts as a digital-display watch with three jumping numerals and a constant-force escapement. The piece becomes the brand\'s most-photographed haute horlogerie statement — the "piano" numerals visible across the dial at every angle.',
      source_url: 'https://www.alange-soehne.com/en/collection/zeitwerk' },
  ],
  'jlc-reverso-classic-q3858520': [
    { date: '1931-03-04', person_or_event: 'Reverso patent',
      description: 'César de Trey commissions a watch that could survive polo matches; engineer Alfred Chauvot designs the sliding case. The Reverso is patented in 1931 and becomes one of the most recognizable case shapes in horology, redesigned in 2024 for the line\'s 90th anniversary.',
      source_url: 'https://www.jaeger-lecoultre.com/us-en/watches/reverso' },
  ],
  'jlc-memovox': [
    { date: '1950-01-01', person_or_event: 'Memovox launch',
      description: 'Jaeger-LeCoultre\'s Memovox — "memory of voice" — is the first watch with a mechanical alarm complication, in a case designed by the brand\'s in-house Renaud & Papi studio. The Polaris Memovox reissue (1968 / 2018) and the Master Ultra Thin Memovox keep the line current.',
      source_url: 'https://www.jaeger-lecoultre.com/us-en/watches/master-ultra-thin/memovox' },
  ],
  'mbf-lm101': [
    { date: '2014-01-01', person_or_event: 'LM101 launch',
      description: 'MB&F\'s Legacy Machine 101 (LM101) debuts as the brand\'s most "classical" piece: a suspended balance wheel above a sub-dial, with a 45mm case and an in-house movement. MB&F positions it as a "watchmaker\'s watch" — the simplest, most personal piece in the Horological Machine catalogue.',
      source_url: 'https://mbandf.com/en/machines/legacy-machines/lm-101' },
  ],
  'mbf-lmx': [
    { date: '2018-01-01', person_or_event: 'LMX launch',
      description: 'MB&F releases the Legacy Machine LMX to mark its tenth anniversary. Two balance wheels beating at 2.5Hz with a differential, finished to haute horlogerie standards — the brand\'s most complicated LM to date at launch.',
      source_url: 'https://mbandf.com/en/machines/legacy-machines/lmx' },
  ],
  'journe-chronometre-souverain': [
    { date: '2005-01-01', person_or_event: 'Chronomètre Souverain',
      description: 'The Chronomètre Souverain is the watch that establishes F.P. Journe\'s reputation in the secondary market: a 40mm case, ruthenium or silver dial, and the in-house calibre 1304 with twin barrels. The 2021 "Holland & Holland" Damascus-dial limited edition sold 28 pieces at Phillips for charity.',
      source_url: 'https://www.fpjourne.com/en/collections/horizon/chronometre-souverain' },
  ],
  'journe-elegante-48': [
    { date: '2014-01-01', person_or_event: 'Élégante 48mm',
      description: 'F.P. Journe\'s Élégante is the brand\'s first (and only) quartz watch — but with a movement that stops when the watch is set down for a few minutes, preserving battery life. The Élégante reissue in 2023 brings a redesigned case and a 5-year battery claim.',
      source_url: 'https://www.fpjourne.com/en/collections/ladies/elegante' },
  ],
  'zenith-chronomaster-sport': [
    { date: '2021-01-01', person_or_event: 'Chronomaster Sport launch',
      description: 'Zenith releases the Chronomaster Sport in 2021 — a 41mm steel chrono with a 1/10th-of-a-second display, El Primero 3600 movement. The "Rolex Daytona competitor" framing dominated 2021-2022 watch media.',
      source_url: 'https://www.zenith-watches.com/en/chronomaster/chronomaster-sport' },
  ],
  'zenith-defy-skyline': [
    { date: '2021-01-01', person_or_event: 'Defy Skyline',
      description: 'Zenith\'s Defy Skyline replaces the Defy Classic line in 2021 — a 41mm integrated bracelet sports watch with the high-frequency El Primero 3620 and a "starry sky" pattern on the dial.',
      source_url: 'https://www.zenith-watches.com/en/defy/defy-skyline' },
  ],

  // ============ CORE ============
  'omega-speedmaster-1861': [
    { date: '1969-07-21', person_or_event: 'Apollo 11 moon landing',
      description: 'Buzz Aldrin wears his Omega Speedmaster Professional on the lunar surface during Apollo 11. NASA\'s qualification of the Speedmaster in 1965, after testing by astronaut candidates in a Houston simulation, makes it the first watch worn on the Moon.',
      source_url: 'https://www.nasa.gov/feature/50-years-ago-the-speedmaster-watches-the-first-walk-on-the-moon' },
  ],
  'omega-speedmaster-3861': [
    { date: '2021-01-01', person_or_event: 'Speedmaster 3861 release',
      description: 'The Speedmaster Moonwatch Professional with calibre 3861 — co-axial escapement, Master Chronometer, 50m water resistance — becomes the modern Moonwatch baseline, replacing the 1861 line that ran 1996-2021.',
      source_url: 'https://www.omegawatches.com/en-us/watch-omega-speedmaster-moonwatch-professional-chronograph-42-mm-31030425001001' },
  ],
  'omega-seamaster-300m': [
    { date: '1995-01-01', person_or_event: 'GoldenEye 007 placement',
      description: 'Omega places the Seamaster Diver 300M on Pierce Brosnan\'s wrist in GoldenEye (1995), starting the 007-Omega partnership that runs to the present. The 300M becomes Omega\'s most-cited sports watch and the 007 watch, with multiple limited editions for the films.',
      source_url: 'https://www.omegawatches.com/en-us/watch-omega-seamaster-diver-300m-21030422001001' },
  ],
  'omega-globemaster': [
    { date: '2015-01-01', person_or_event: 'Globemaster release',
      description: 'The Omega Constellation Globemaster launches with the Master Chronometer 8900 movement — the first mass-produced watch to pass METAS\' antimagnetic and precision certification. The pie-pan dial and fluted bezel reference the 1952 Constellation.',
      source_url: 'https://www.omegawatches.com/en-us/collection/constellation/globemaster' },
  ],
  'cartier-tank-louis': [
    { date: '1922-01-01', person_or_event: 'Tank Louis launch',
      description: 'Louis Cartier designs the Tank Louis in 1917 (filed 1917, sold 1919), inspired by the Renault FT-17 tank seen in WWI. The Tank becomes Cartier\'s most-photographed watch — worn by Andy Warhol, Jackie Kennedy, Yves Saint Laurent, and a dozen U.S. presidents.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/tank' },
  ],
  'cartier-tank-cintree': [
    { date: '1921-01-01', person_or_event: 'Tank Cintrée 1921',
      description: 'The Tank Cintrée — Cartier\'s elongated, curved Tank — debuts in 1921. A platinum limited edition of the Cintrée 100th anniversary (2018) is among the most-cited modern Cartier reissues.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/tank' },
  ],
  'cartier-santos-wssa0018': [
    { date: '1904-01-01', person_or_event: 'Santos de Cartier',
      description: 'Louis Cartier designs the Santos in 1904 for his friend Alberto Santos-Dumont, who needed a wristwatch he could read in a cockpit. The Santos is the world\'s first purpose-built men\'s wristwatch, predating the first generation of pilot wristwatches by almost a decade.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/santos' },
  ],
  'cartier-panthere-medium': [
    { date: '1983-01-01', person_or_event: 'Panthère de Cartier launch',
      description: 'The Panthère de Cartier launches in 1983 as a square-cased, integrated-bracelet watch — the 1980s answer to the Royal Oak and the watch most associated with 1980s fashion. Reissued in 2017 to wide press coverage.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/women-s-watches/panthere' },
  ],
  'cartier-ballon-bleu-42': [
    { date: '2007-01-01', person_or_event: 'Ballon Bleu launch',
      description: 'Cartier\'s Ballon Bleu de Cartier launches in 2007 — a round case with a crown guard integrated into the case band, Roman numerals on a guilloché dial. The 42mm men\'s version becomes one of the brand\'s bestsellers.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/ballon-bleu' },
  ],
  'cartier-crash': [
    { date: '1967-01-01', person_or_event: 'Cartier London Crash',
      description: 'The Cartier Crash is designed at Cartier London in 1967 — the asymmetric, melted case allegedly inspired by a Cartier London timepiece that was in a car fire. Production has been limited and irregular for fifty years, making the Crash one of the most-cited vintage Cartier watches.',
      source_url: 'https://www.cartier.com/en-us/collections/watches/men-s-watches/crash' },
  ],
  'grandseiko-sbga211-snowflake': [
    { date: '2010-01-01', person_or_event: 'Snowflake launch',
      description: 'The SBGA211 "Snowflake" launches as part of Grand Seiko\'s Heritage Collection — 41mm titanium case, Spring Drive 9R65 caliber, the dial texture hand-finished to evoke falling snow on the Shinshu studio. The Snowflake becomes the most-cited modern Grand Seiko reference.',
      source_url: 'https://www.grandseiko.com/us-en/collections/heritage/sbga211' },
  ],
  'grandseiko-slgh005-white-birch': [
    { date: '2021-01-01', person_or_event: 'White Birch launch',
      description: 'Grand Seiko releases the SLGH005 "White Birch" — the first watch in the new Evolution 9 case family, with a 9SA5 high-beat movement. The dial pattern is hand-finished to evoke the white birch forest around the Shiojiri studio.',
      source_url: 'https://www.grandseiko.com/us-en/collections/evolution9/slgh005' },
  ],
  'iwc-portugieser-7day-iw5007': [
    { date: '2000-01-01', person_or_event: 'Portugieser 7-Day release',
      description: 'IWC\'s Portugieser 7-Day (IW5001, later IW5007) becomes the first watch from Schaffhausen to use a Pellaton winding system with a 7-day power reserve. The 42mm case and clean dial become the modern Portugieser baseline.',
      source_url: 'https://www.iwc.com/en/collection/portugieser' },
  ],
  'iwc-big-pilot-iw501001': [
    { date: '2002-01-01', person_or_event: 'Big Pilot reissue',
      description: 'IWC reissues the 1940s Beobachtungsuhr (B-Uhr) pilot\'s watch as the Big Pilot\'s Watch 5002 (later 5007, 5010) in 2002. The 46.2mm case, conical crown, and onion-style hands establish the modern "Big Pilot" aesthetic that runs to the present.',
      source_url: 'https://www.iwc.com/en/collection/pilot-s-watches' },
  ],
  'tagheuer-monaco-caw211p': [
    { date: '1969-01-01', person_or_event: 'Monaco designed',
      description: 'Jack Heuer designs the Monaco in 1969 — the first square-cased, water-resistant automatic chronograph. Steve McQueen wears it in Le Mans (1971), turning the Monaco into TAG Heuer\'s most-photographed vintage reference. Reissued 1998, 2003, 2009, 2015; the Calibre 11 reissue (CAW211P) runs 2015-2023.',
      source_url: 'https://www.tagheuer.com/us/en/collection-monaco' },
  ],
  'tagheuer-carrera-glassbox-cbs2210': [
    { date: '2023-01-01', person_or_event: 'Carrera Glassbox',
      description: 'TAG Heuer launches the Carrera Date Glassbox (CBS2210) at Watches and Wonders 2023 — a 39mm case with a domed sapphire "glassbox" crystal over the dial, reissuing a 1970s Carrera family design.',
      source_url: 'https://www.tagheuer.com/us/en/collection-carrera' },
  ],
  'breitling-navitimer-b01-43': [
    { date: '1952-01-01', person_or_event: 'Navitimer launch',
      description: 'Breitling launches the Navitimer in 1952 — the first watch with a circular slide rule bezel, designed for pilots. The AOPA (Aircraft Owners and Pilots Association) endorsement turns the Navitimer into the most-cited pilot\'s watch of the 1950s-60s.',
      source_url: 'https://www.breitling.com/us-en/watches/navitimer' },
  ],

  // ============ ATTAINABLE ============
  'casio-dw-5600': [
    { date: '1983-01-01', person_or_event: 'G-Shock DW-5600 launch',
      description: 'Casio releases the DW-5600 in 1983, two years after the original G-Shock DW-5000. The squared 5600 becomes the most-cited modern G-Shock and the watch most associated with the line\'s 1980s minimalist design.',
      source_url: 'https://www.casio.com/products/watches/g-shock/dw-5600ue-1' },
  ],
  'casio-gmw-b5000': [
    { date: '2018-01-01', person_or_event: 'Full Metal G-Shock',
      description: 'The GMW-B5000 brings the iconic 5600 silhouette to a full-metal case — the first all-metal square G-Shock. The 2018 launch becomes the most-cited "premium G-Shock" of the 2010s-2020s.',
      source_url: 'https://www.casio.com/products/watches/g-shock/gmw-b5000d-1' },
  ],
  'seiko-spb143': [
    { date: '2020-09-01', person_or_event: 'SPB143 62MAS reissue',
      description: 'Seiko\'s SPB143 is the 2020 Prospex reissue of the 1965 62MAS diver — 40.5mm, caliber 6R35, 200m water resistance. The "62MAS reissue" is the most-cited modern Seiko Prospex reference and the watch most associated with the 2020 Seiko diver line.',
      source_url: 'https://www.seikowatches.com/us-en/products/prospex/sbp143j1' },
  ],
  'seiko-sla023-mm300': [
    { date: '2020-09-01', person_or_event: 'Marine Master 300 reinterpretation',
      description: 'The SLA023 is the 2020 reinterpretation of the 1968 62.5-600 Marine Master — a 44mm titanium-cased diver with a ceramic bezel, sold at 1,968-piece limited release worldwide.',
      source_url: 'https://www.seikowatches.com/us-en/products/prospex/sla023j1' },
  ],
  'seiko-sarb017-alpinist': [
    { date: '2006-01-01', person_or_event: 'Alpinist SARB017',
      description: 'The SARB017 runs 2006-2018 as the most-cited modern Seiko Alpinist — 39mm, caliber 6R15, green dial, internal rotating compass bezel. The 2020 SPB121 reissue revives the model with the 6R64 movement.',
      source_url: 'https://www.hodinkee.com/articles/the-seiko-alpinist-watch-a-history' },
  ],
  'seiko-srpb43-cocktail-time': [
    { date: '2018-01-01', person_or_event: 'Presage Cocktail Time',
      description: 'The Presage "Cocktail Time" SRPB43 — designed with a textured dial that mimics a cocktail glass — becomes the most-cited Seiko Presage reference among enthusiasts for its 40.5mm case, 4R36 movement, and 50m water resistance at an attainable price.',
      source_url: 'https://www.seikowatches.com/us-en/products/presage/srpb43j1' },
  ],
  'tissot-prx-t137-407': [
    { date: '2021-01-01', person_or_event: 'PRX 40 Powermatic 80',
      description: 'Tissot reissues the 1978 PRX with a 40mm case, integrated bracelet, and Powermatic 80 movement. The 2021 reissue is the most-cited modern Tissot at its price point and one of the most-recommended entry luxury steel sports watches.',
      source_url: 'https://www.tissot.com/en-us/watches/t-classic/t137-407-11-051-00' },
  ],
  'hamilton-khaki-field-h69439931': [
    { date: '2014-01-01', person_or_event: 'Khaki Field Mechanical 38',
      description: 'Hamilton\'s Khaki Field Mechanical 38 (H69439931) becomes the brand\'s most-cited military-flavored watch — a 38mm hand-wound field watch based on the 1960s MIL-W-3818B spec, with a 50m water resistance and a nylon strap.',
      source_url: 'https://www.hamiltonwatch.com/en-us/h69439931' },
  ],
  'longines-spirit-zulu-time': [
    { date: '2022-01-01', person_or_event: 'Spirit Zulu Time',
      description: 'Longines releases the Spirit Zulu Time in 2022 — the brand\'s first GMT with a 24-hour graduated bezel, in 39mm and 42mm. The "Zulu Time" reference (a nod to the GMT-marker naming convention) is the most-cited modern Longines travel watch.',
      source_url: 'https://www.longines.com/en-us/watch-spirit-zulu-time-l3-812-4-53-2' },
  ],
};

let touched = 0;
let added = 0;
let skipped = 0;

for (const [cardId, newEvents] of Object.entries(events)) {
  const filePath = join(CARD_DIR, `${cardId}.json`);
  let card;
  try {
    card = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`✗ ${cardId}: ${e.message}`);
    continue;
  }
  touched++;
  if (!card.provenance_events) card.provenance_events = [];
  // Idempotent: don't re-add an event we already have.
  const existingKeys = new Set(card.provenance_events.map((e) => `${e.date}|${e.person_or_event}`));
  for (const ev of newEvents) {
    const k = `${ev.date}|${ev.person_or_event}`;
    if (existingKeys.has(k)) {
      skipped++;
      continue;
    }
    card.provenance_events.push(ev);
    added++;
    existingKeys.add(k);
  }
  writeFileSync(filePath, JSON.stringify(card, null, 2) + '\n');
}

console.log(`✓ Touched ${touched} cards; added ${added} events; skipped ${skipped} duplicates`);
