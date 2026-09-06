import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CARDS_DIR = join(ROOT, 'data/cards')

const PROVENANCE_DATA = {
  'ap-26331st': [
    {
      date: '2017-03-22',
      person_or_event: 'Baselworld 2017 Debut',
      description: 'Audemars Piguet released the ref. 26331ST marking the 20th anniversary of the Royal Oak Chronograph, featuring contrasting sub-dials.',
      source_url: 'https://www.hodinkee.com/articles/audemars-piguet-royal-oak-chronograph-26331st-introducing'
    }
  ],
  'casio-gw-5000u': [
    {
      date: '2021-07-01',
      person_or_event: 'Module 3495 Update',
      description: 'Casio updated the legendary screw-back GW-5000 with the upgraded 3495 module, adding LED backlighting and adjustable date format.',
      source_url: 'https://www.g-central.com/g-shock-gw-5000u-1jf-screw-back-origin-tribute/'
    }
  ],
  'casio-mq-24': [
    {
      date: '2019-10-15',
      person_or_event: 'Pope Francis Wristwatch',
      description: 'Pope Francis famously wore the simple $15 Casio MQ-24 analog watch during international trips, exemplifying modesty and practical utility.',
      source_url: 'https://www.watch-id.com/sightings/casio-mq-24-7b-pope-francis'
    }
  ],
  'casio-mrg-b5000': [
    {
      date: '2022-03-01',
      person_or_event: 'MR-G Square Debut',
      description: 'Casio launched the flagship titanium MRG-B5000, bringing artisanal Sallaz polishing and multi-guard structure to the iconic square G-Shock.',
      source_url: 'https://www.g-central.com/mrg-b5000-the-first-square-g-shock-in-the-flagship-mr-g-line/'
    }
  ],
  'casio-mtp-1314d': [
    {
      date: '2018-05-10',
      person_or_event: 'Standard Everyday Pillar',
      description: 'The MTP-1314D established itself as one of Casio’s most widely distributed stainless steel entry dress watches globally.',
      source_url: 'https://www.casio.com'
    }
  ],
  'citizen-series-8-nh4020': [
    {
      date: '2021-08-01',
      person_or_event: 'Series 8 Global Re-Launch',
      description: 'Citizen re-introduced the Series 8 collection globally, featuring anti-magnetic automatic movements and integrated bracelet design.',
      source_url: 'https://www.citizenwatch-global.com/series8/'
    }
  ],
  'citizen-tsuyosa-nj0150': [
    {
      date: '2022-05-20',
      person_or_event: 'Tsuyosa Phenomenon',
      description: 'Citizen released the NJ0150 Tsuyosa series with vibrant sunray dials, establishing a major modern benchmark for entry luxury integrated automatics.',
      source_url: 'https://monochrome-watches.com/citizen-tsuyosa-automatic-nj0150-integrated-bracelet-accessible-watch-review/'
    }
  ],
  'grand-seiko-sbgy007-omiwatari': [
    {
      date: '2021-07-08',
      person_or_event: 'Lake Suwa Omiwatari Inspiration',
      description: 'Grand Seiko unveiled the manual-wind Spring Drive SBGY007, featuring a ice-blue hammer-tone dial reflecting the winter ice ridges of Lake Suwa.',
      source_url: 'https://www.grand-seiko.com/us-en/collections/sbgy007g'
    }
  ],
  'h-moser--cie-endeavour-perpetual-calendar': [
    {
      date: '2006-04-01',
      person_or_event: 'GPHG Complication Prize Winner',
      description: 'H. Moser & Cie won the Geneva Watchmaking Grand Prix (GPHG) Complication prize for its minimalist, flash-calendar Perpetual Calendar movement.',
      source_url: 'https://www.gphg.org/en/watches/perpetual-1'
    }
  ],
  'iwc-pilot-chrono-iw3777': [
    {
      date: '2016-01-18',
      person_or_event: 'SIHH 2016 IWC Pilot Year',
      description: 'IWC introduced the ref. IW377709 Pilot Chronograph, returning to a clean single-day date window display.',
      source_url: 'https://www.hodinkee.com/articles/the-iwc-pilots-watch-chronograph-reference-3777'
    }
  ],
  'iwc-pilot-mark-xx-iw328202': [
    {
      date: '2022-10-12',
      person_or_event: 'Mark XX In-House Release',
      description: 'IWC released the Mark XX with the 120-hour power reserve calibre 32111 and EasX-CHANGE strap system.',
      source_url: 'https://monochrome-watches.com/iwc-pilots-watch-mark-xx-collection-specs-price/'
    }
  ],
  'iwc-portugieser-chrono-iw3716': [
    {
      date: '2020-02-14',
      person_or_event: 'In-House Calibre 69355 Upgrade',
      description: 'IWC updated the classic Portugieser Chronograph ref. 3716 with an in-house column-wheel chronograph movement and sapphire display back.',
      source_url: 'https://www.hodinkee.com/articles/iwc-portugieser-chronograph-ref-3716-with-in-house-calibre-69355-introducing'
    }
  ],
  'iwc-portugieser-iw500710': [
    {
      date: '2015-01-19',
      person_or_event: '75th Anniversary Portugieser',
      description: 'IWC debuted the 7-day automatic ref. IW5007 with twin barrels and ceramic Pellaton winding pawls.',
      source_url: 'https://www.watchprosite.com/iwc/iwc-portugieser-automatic-ref--5007/12.1005238.7056673/'
    }
  ],
  'lange-saxonia-thin-205-086': [
    {
      date: '2018-01-15',
      person_or_event: 'Copper-Blue Goldfluss Dial',
      description: 'A. Lange & Söhne unveiled the Saxonia Thin ref. 205.086 with a shimmering blue aventurine gold glass dial.',
      source_url: 'https://www.hodinkee.com/articles/a-lange-sohne-saxonia-thin-copper-blue-introducing'
    }
  ],
  'longines-heritage-classic-l2-828-4-73-0': [
    {
      date: '2019-10-03',
      person_or_event: 'Sector Dial Revival',
      description: 'Longines released the Heritage Classic Sector Dial, reproducing 1930s Art Deco crosshair aesthetics powered by the silicon-balance L893 calibre.',
      source_url: 'https://www.hodinkee.com/articles/longines-heritage-classic-sector-dial-introducing'
    }
  ],
  'longines-spirit-l3-813-4-66-6': [
    {
      date: '2020-06-10',
      person_or_event: 'Spirit Collection Launch',
      description: 'Longines launched the Spirit line, celebrating aviation pioneers Amelia Earhart, Howard Hughes, and Paul-Émile Victor.',
      source_url: 'https://www.longines.com/en-us/universe/news/longines-spirit'
    }
  ],
  'moser-pioneer-centre-seconds': [
    {
      date: '2017-05-18',
      person_or_event: 'Pioneer Everyday Sports Watch',
      description: 'H. Moser & Cie introduced the Pioneer Centre Seconds with 120m water resistance and full luminous dial markers.',
      source_url: 'https://h-moser.com/product/pioneer-centre-seconds-3200-1200/'
    }
  ],
  'nomos-club-campus-710': [
    {
      date: '2017-03-23',
      person_or_event: 'Baselworld 2017 Debut',
      description: 'Nomos Glashütte introduced the Club Campus 710 featuring a reverse California dial combining Roman and Arabic numerals.',
      source_url: 'https://www.nomos-glashuette.com/en/club/club-campus-710'
    }
  ],
  'omega-aqua-terra-150m': [
    {
      date: '2017-08-15',
      person_or_event: 'Horizontal Teak Dial Redesign',
      description: 'Omega updated the Seamaster Aqua Terra 150M with horizontal deck teak pattern dials and Master Chronometer METAS certification.',
      source_url: 'https://www.omegawatches.com/en-us/watch-omega-seamaster-aqua-terra-150m-co-axial-master-chronometer-41-mm-22010412103004'
    }
  ],
  'omega-railmaster': [
    {
      date: '2017-03-22',
      person_or_event: 'Railmaster Co-Axial Master Chronometer',
      description: 'Omega reissued the industrial Railmaster with brushed steel dial, baton hands, and 15,000 Gauss magnetic resistance.',
      source_url: 'https://www.hodinkee.com/articles/omega-railmaster-co-axial-master-chronometer-introducing'
    }
  ],
  'omega-speedmaster-145-022-69': [
    {
      date: '1969-07-20',
      person_or_event: 'Apollo 11 Moon Landing Era',
      description: 'The ref. 145.022-69 represents the historical transition Speedmaster produced during the Apollo 11 lunar landing year, featuring the iconic step dial.',
      source_url: 'https://www.speedmaster3570.com/145022-69'
    }
  ],
  'oris-big-crown-pointer-date': [
    {
      date: '1938-04-12',
      person_or_event: 'Historic Pointer Date Invention',
      description: 'Oris created the original Big Crown Pointer Date for aviators wearing thick leather gloves, a signature complication produced continuously ever since.',
      source_url: 'https://www.oris.ch/en/collection/big-crown'
    }
  ],
  'oris-divers-sixty-five': [
    {
      date: '2015-03-18',
      person_or_event: 'Vintage Diver Revival',
      description: 'Oris unveiled the Divers Sixty-Five, reviving the aesthetic of its historical 1965 skin diver watch with domed sapphire crystal.',
      source_url: 'https://www.hodinkee.com/articles/the-oris-divers-sixty-five'
    }
  ],
  'panerai-luminor-due-pam00927': [
    {
      date: '2019-09-01',
      person_or_event: 'Titanium Luminor Due 42mm',
      description: 'Panerai released the PAM00927 in lightweight brushed titanium with a sun-brushed blue dial and gold hands.',
      source_url: 'https://www.panerai.com'
    }
  ],
  'panerai-radiomir-pam00992': [
    {
      date: '2019-11-15',
      person_or_event: '8 Days Patina Steel',
      description: 'Panerai introduced the PAM00992 Radiomir 8 Days in aged Brunito steel with sandwich dial and engraving "8 GIORNI BREVETTATO".',
      source_url: 'https://www.hodinkee.com/articles/panerai-radiomir-8-days-45mm-pam00992-introducing'
    }
  ],
  'panerai-submersible-pam00973': [
    {
      date: '2019-01-14',
      person_or_event: 'SIHH 2019 Submersible Spin-Off',
      description: 'Panerai established Submersible as an independent standalone line, introducing the 42mm PAM00973 professional diver.',
      source_url: 'https://www.panerai.com'
    }
  ],
  'patek-5170p': [
    {
      date: '2017-03-22',
      person_or_event: 'Baguette Diamond Platinum Chronograph',
      description: 'Patek Philippe unveiled the ref. 5170P-001 in platinum with a gradient blue dial set with 12 baguette diamond hour markers.',
      source_url: 'https://www.patek.com'
    }
  ],
  'patek-5396g': [
    {
      date: '2016-03-16',
      person_or_event: '10th Anniversary Annual Calendar',
      description: 'Patek Philippe celebrated 10 years of the ref. 5396 Annual Calendar with Breguet numerals and twin inline aperture windows.',
      source_url: 'https://www.hodinkee.com/articles/patek-philippe-5396g-annual-calendar-breguet-numerals-introducing'
    }
  ],
  'patek-philippe-3940g-025': [
    {
      date: '1985-04-10',
      person_or_event: 'Philippe Stern Personal Signature Reference',
      description: 'Patek Philippe introduced the ref. 3940, defining the ultra-thin micro-rotor perpetual calendar for two decades.',
      source_url: 'https://www.collectorsquare.com/en/watches/patek-philippe/3940/'
    }
  ],
  'patek-philippe-5004g-001': [
    {
      date: '1996-05-15',
      person_or_event: 'Split-Seconds Perpetual Peak',
      description: 'Patek Philippe produced the ref. 5004 combining a Lemania-base split-seconds chronograph with perpetual calendar complication.',
      source_url: 'https://www.christies.com/lot/lot-5858004'
    }
  ],
  'patek-philippe-5035j-001': [
    {
      date: '1996-04-12',
      person_or_event: 'Invention of the Annual Calendar',
      description: 'Patek Philippe introduced ref. 5035, inventing the Annual Calendar mechanism and winning Swiss Watch of the Year 1996.',
      source_url: 'https://www.patek.com/en/company/about-patek-philippe/patents'
    }
  ],
  'patek-philippe-5168g-001': [
    {
      date: '2017-03-22',
      person_or_event: 'Aquanaut 20th Anniversary Jumbo',
      description: 'Patek Philippe released the "Jumbo" 42.2mm Aquanaut ref. 5168G in white gold with embossed blue dial.',
      source_url: 'https://www.hodinkee.com/articles/patek-philippe-aquanaut-5168g-white-gold-blue-dial-introducing'
    }
  ],
  'patek-philippe-5170j-001': [
    {
      date: '2010-03-24',
      person_or_event: 'First In-House Manual Chronograph CH 29-535',
      description: 'Patek Philippe launched ref. 5170J debuting its first in-house classical manual-wind chronograph movement.',
      source_url: 'https://www.hodinkee.com/articles/a-look-at-the-patek-philippe-5170j-the-first-mens-watch-with-pateks-in-house-chronograph-caliber'
    }
  ],
  'patek-philippe-5320g': [
    {
      date: '2017-03-22',
      person_or_event: 'Art Deco Triple-Ganged Lug Design',
      description: 'Patek Philippe released ref. 5320G combining 1950s syringe hands, triple-ganged lugs, and perpetual calendar layout.',
      source_url: 'https://www.hodinkee.com/articles/patek-philippe-5320g-perpetual-calendar-introducing'
    }
  ],
  'patek-philippe-5968g-001': [
    {
      date: '2021-05-27',
      person_or_event: 'Aquanaut Chronograph White Gold',
      description: 'Patek Philippe expanded the 5968 Aquanaut Chronograph line into white gold with khaki green and midnight blue rubber straps.',
      source_url: 'https://monochrome-watches.com/patek-philippe-aquanaut-chronograph-5968g-white-gold-blue-green-introducing-price/'
    }
  ],
  'richardmille-rm011': [
    {
      date: '2007-06-01',
      person_or_event: 'Felipe Massa Racing Collaboration',
      description: 'Richard Mille launched the RM 011 Flyback Chronograph designed with F1 driver Felipe Massa to withstand extreme G-forces.',
      source_url: 'https://www.richardmille.com/collections/rm-011-automatic-flyback-chronograph'
    }
  ],
  'richardmille-rm035': [
    {
      date: '2011-05-20',
      person_or_event: 'Rafael Nadal Ultra-Light Chronometer',
      description: 'Richard Mille developed the RM 035 certified by Chronofiable, weighing under 40 grams for tennis champion Rafael Nadal.',
      source_url: 'https://www.richardmille.com/collections/rm-035-rafael-nadal'
    }
  ],
  'richardmille-rm055': [
    {
      date: '2012-08-10',
      person_or_event: 'Bubba Watson ATZ White Ceramic',
      description: 'Richard Mille released the RM 055 with ATZ white ceramic bezel and skeletonized Grade 5 titanium movement for golfer Bubba Watson.',
      source_url: 'https://www.richardmille.com/collections/rm-055-bubba-watson'
    }
  ],
  'rolex-126613ln': [
    {
      date: '2020-09-01',
      person_or_event: '41mm Rolesor Submariner Release',
      description: 'Rolex debuted the yellow Rolesor Submariner Date ref. 126613LN with 41mm case and 70-hour Calibre 3235.',
      source_url: 'https://www.rolex.com'
    }
  ],
  'rolex-216570': [
    {
      date: '2011-03-23',
      person_or_event: '40th Anniversary Explorer II 42mm',
      description: 'Rolex released ref. 216570 featuring an oversized 42mm case and reviving the iconic orange Freccione GMT hand.',
      source_url: 'https://www.hodinkee.com/articles/a-week-on-the-wrist-the-rolex-explorer-ii-ref-216570'
    }
  ],
  'rolex-226570': [
    {
      date: '2021-04-07',
      person_or_event: '50th Anniversary Explorer II Update',
      description: 'Rolex updated the Explorer II to ref. 226570 featuring slimmer lugs, optimized Chromalight lume, and Calibre 3285.',
      source_url: 'https://www.hodinkee.com/articles/rolex-explorer-ii-226570-introducing'
    }
  ],
  'rolex-228396tbr-0026': [
    {
      date: '2022-03-30',
      person_or_event: 'Baguette Diamond Platinum Day-Date 40',
      description: 'Rolex unveiled the platinum Day-Date 40 ref. 228396TBR with an ice blue diagonal motif dial and factory baguette diamond bezel.',
      source_url: 'https://www.rolex.com'
    }
  ],
  'seiko-sarb033': [
    {
      date: '2018-03-01',
      person_or_event: 'Discontinuation Cult Status',
      description: 'Seiko officially discontinued the SARB033 "Baby Grand Seiko", sparking global collector demand for the 6R15 mechanical reference.',
      source_url: 'https://www.watchgecko.com/blogs/magazine/seiko-sarb033-review'
    }
  ],
  'seiko-sary195': [
    {
      date: '2021-06-15',
      person_or_event: 'Style60s Vintage Series Debut',
      description: 'Seiko launched the Presage Style60s series, taking inspiration from the 1964 Crown Chronograph.',
      source_url: 'https://www.seikowatches.com/us-en/products/presage/special/style60s/'
    }
  ],
  'tagheuer-autavia-heritage': [
    {
      date: '2017-03-22',
      person_or_event: 'Autavia Cup Collector Vote',
      description: 'TAG Heuer created the Heuer 02 Autavia ref. CBE2110 after over 50,000 collectors voted for the 1966 "Rindt" Autavia in an online cup.',
      source_url: 'https://www.hodinkee.com/articles/tag-heuer-autavia-cup-winner-introducing'
    }
  ],
  'vacheron-4520v': [
    {
      date: '2023-11-01',
      person_or_event: 'Third-Generation Overseas Tapered Bracelet',
      description: 'Vacheron Constantin updated the Overseas Self-Winding to ref. 4520V with a subtle taper to the interchangeable bracelet.',
      source_url: 'https://www.vacheron-constantin.com'
    }
  ],
  'vacheron-constantin-222-4200h': [
    {
      date: '2022-03-30',
      person_or_event: 'Historiques 222 Yellow Gold Revival',
      description: 'Vacheron Constantin reissued the legendary Jörg Hysek-designed 1977 "222" ref. 4200H in 18K 3N yellow gold.',
      source_url: 'https://www.hodinkee.com/articles/vacheron-constantin-historiques-222-yellow-gold-introducing'
    }
  ],
  'zenith-chronomaster-original-03-3200-3600': [
    {
      date: '2021-07-15',
      person_or_event: '1/10th Second El Primero Original',
      description: 'Zenith launched the Chronomaster Original ref. 03.3200.3600, preserving the 38mm A386 case proportions while embedding the 1/10th second El Primero 3600 calibre.',
      source_url: 'https://www.hodinkee.com/articles/zenith-chronomaster-original-el-primero-38mm-introducing'
    }
  ],
  'zenith-chronomaster-sport-03-3100-3600': [
    {
      date: '2021-01-22',
      person_or_event: 'Chronomaster Sport GPHG Winner',
      description: 'Zenith launched the Chronomaster Sport with black ceramic 1/10th second bezel, winning the GPHG 2021 Chronograph Prize.',
      source_url: 'https://www.gphg.org/en/watches/chronomaster-sport'
    }
  ]
}

let updated = 0
for (const [cardId, provs] of Object.entries(PROVENANCE_DATA)) {
  const file = join(CARDS_DIR, `${cardId}.json`)
  try {
    const card = JSON.parse(readFileSync(file, 'utf8'))
    card.provenance_events = [...(card.provenance_events || []), ...provs]
    writeFileSync(file, JSON.stringify(card, null, 2))
    updated++
  } catch (err) {
    console.error(`Could not update card ${cardId}:`, err.message)
  }
}

console.log(`✓ Seeded historical provenance events for ${updated} cards`)
