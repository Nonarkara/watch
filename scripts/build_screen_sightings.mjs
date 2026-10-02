#!/usr/bin/env node
/**
 * Builds public/data/screen_sightings.json from:
 *   1. Rolex Watch-ID harvest (data/shared/watch_id_rolex.json)
 *   2. Iconic film/TV stills curated for Time Pop (with studio + editorial credits)
 *
 * Honesty rules:
 *   - Promotional stills are labeled as such — never as free-reuse licences
 *   - Watch-ID remains the Rolex identification source
 *   - Teddy Baldassarre movie-watches roundup is the editorial cross-check URL
 *   - Shared card portraits are not silently reused as if they were distinct stills
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const TEDDY = 'https://teddybaldassarre.com/en-int/blogs/watches/movie-watches'
const PROMO_LICENSE =
  'Promotional / editorial still — rights remain with the film studio and rights holders. Shown for identification and education only; not a free-reuse licence.'

const longer = {
  'rolex-day-date-jason-isaacs-the-white-lotus':
    'In White Lotus Season 3, Jason Isaacs plays Timothy Ratliff with a gold Day-Date on the wrist — the classic “president” signal. Watch-ID flags the family, not a single reference, so we keep it family-only until a clearer dial/bezel read lands.',
  'rolex-milgauss-patrick-schwarzenegger-the-white-lotus-season-3':
    'Episode 1 of White Lotus Season 3 puts a green-crystal Milgauss on Patrick Schwarzenegger. That points at the modern 116400GV — the anti-magnetic Rolex with the green sapphire. Identification is still tentative: same object family as the Jeff Daniels sighting below, not proof of two different references.',
  'rolex-gmt-master-ii-sterling-k-brown-paradise':
    'Sterling K. Brown’s Paradise opener shows a GMT-Master II — the travel bezel Rolex. We map it to the Pepsi 126710BLRO while the read stays tentative; a frame-perfect bezel still would lock the reference.',
  'rolex-oyster-perpetual-milgauss-jeff-daniels-man-full':
    'In Netflix’s A Man in Full, Jeff Daniels wears a green-crystal Milgauss — again the 116400GV family. That is the same reference mapped on White Lotus, not a second model. We refuse to paste the same dossier portrait here as if it were a still from this series.',
  'rolex-submariner-titus-welliver-bosch':
    'Titus Welliver’s Bosch keeps a Submariner in the frame across Bosch and Bosch: Legacy — a working detective’s steel sports watch. Mapped to the ceramic 116610LN pending a tighter year/bezel confirmation.',
  'rolex-day-date-chris-evans-pain-hustlers':
    'Chris Evans in Pain Hustlers (2023) wears gold Day-Date energy — status jewellery for a pharmaceutical hustle story. Family-only until the case size and dial are pinned.',
  'rolex-submariner-date-two-tone-josh-lucas-black-demon':
    'Josh Lucas in The Black Demon (2023) wears a two-tone Submariner Date — steel and gold, the showier sibling of the full-steel diver.',
  'rolex-submariner-florence-pugh-good-person':
    'Florence Pugh’s Submariner in A Good Person puts a tool dive watch on a drama about guilt and recovery. Family-level until the exact reference is confirmed.',
  'rolex-explorer-1016-jennifer-connelly-top-gun-maverick':
    'Jennifer Connelly’s Penny in Top Gun: Maverick wears a vintage Explorer 1016 — the simple 3-6-9 explorer dial. A premiere still is credited below; the in-cockpit prop close-up stays with Paramount.',
  'rolex-submariner-jon-hamm-confess-fletch':
    'Jon Hamm’s Confess, Fletch Submariner is comedy-noir steel: a diver as costume shorthand for competent charm.',
  'rolex-day-date-jerrod-carmichael-rothaniel':
    'Jerrod Carmichael’s Rothaniel special puts a Day-Date in a stand-up room — gold as stage armour. Family-only.',
  'rolex-gmt-master-james-spader-blacklist':
    'James Spader’s Red Reddington on The Blacklist is long associated with a GMT-Master — a traveler’s bezel for a man who never stays put.',
  'rolex-oyster-perpetual-datejust-pedro-pascal-wonder-woman-1984':
    'Pedro Pascal in Wonder Woman 1984 wears Datejust energy — the everyday Rolex dress sports hybrid. Family-level mapping.',
  'rolex-day-date-adam-sandler-uncut-gems':
    'Adam Sandler’s Howard Ratner in Uncut Gems lives inside pressure; the gold Day-Date is part of that costume of winning and losing at once.',
  'rolex-oyster-perpetual-39-adam-driver-marriage-story':
    'Adam Driver’s Marriage Story Oyster Perpetual 39 is quiet steel — almost anti-flex — which fits a film about ordinary catastrophe.',
  'rolex-gmt-master-ii-rob-delaney-catastrophe':
    'Rob Delaney’s Catastrophe GMT-Master II is domestic life with a travel bezel still on the wrist.',
  'rolex-oyster-perpetual-day-date-john-travolta-speed-kills':
    'John Travolta in Speed Kills wears Day-Date flash for a boat-and-cocaine period piece. Family-only.',
  'rolex-gmt-master-ii-jay-hernandez-magnum-pi':
    'Jay Hernandez’s Magnum P.I. reboot keeps the GMT-Master II in the Hawaii-private-eye lane — a tip of the hat to the travel-watch myth.',
  'rolex-day-date-40-platinum-conor-mcgregor':
    'Conor McGregor’s platinum Day-Date 40 appearances blur sport, celebrity, and presidential-watch signalling. Treat as reported sightings, not market proof.',
  'rolex-day-date-40-gold-conor-mcgregor':
    'The gold Day-Date 40 on McGregor is the louder twin of the platinum read — same mythology, different metal.',
  'rolex-sea-dweller-dwayne-johnson-baywatch':
    'Dwayne Johnson’s Baywatch Sea-Dweller (?) stays marked uncertain — thick dive watch energy, reference not locked.',
  'rolex-sky-dweller-lil-wayne-brown-suger-ray-j':
    'Lil Wayne’s Sky-Dweller sighting in the Brown Sugar / Ray J orbit is music-video Rolex: annual calendar as flex.',
  'rolex-sky-dweller-trey-songz-touchin-lovin-featuring-nicki-minaj':
    'Trey Songz’s Touchin, Lovin video puts a Sky-Dweller in the frame — another annual-calendar flex in a pop clip.',
  'rolex-explorer-ii-prince-harry-wales':
    'Prince Harry’s Explorer II sightings sit at the edge of film/TV and public life. We keep the Watch-ID link and avoid over-claiming a single production.',
  'rolex-submariner-date-jeremy-renner-mission-impossible-ghost-protocol':
    'Jeremy Renner in Mission: Impossible — Ghost Protocol wears Submariner Date energy inside a franchise that usually sells Omega. Worth the contrast.',
  'rolex-daytona-daniel-day-kim-lost':
    'Daniel Dae Kim’s Lost-era Daytona is island-castaway Rolex mythology — chronograph as survivor jewellery.',
  'rolex-submariner-date-luke-wilson-middle-men':
    'Luke Wilson in Middle Men wears a Submariner Date through a film about the early internet porn business — steel sports watch as operator kit.',
  'rolex-submariner-date-kiefer-sutherland-24':
    'Kiefer Sutherland’s 24 Jack Bauer years put Submariner Date on the wrist of real-time television. Tool watch as ticking-clock costume.',
  'rolex-gmt-master-ii-jason-bateman-switch':
    'Jason Bateman in The Switch wears GMT-Master II — a soft comedy with a hard bezel.',
  'rolex-submariner-5512-steve-mcqueen':
    'Steve McQueen’s Submariner 5512 sits in the same cool-icon file as his Heuer Monaco. Crown and square chrono, both McQueen.',
  'rolex-oyster-perpetual-day-date-he-got-game':
    'Spike Lee’s He Got Game puts Day-Date language on basketball ambition — gold as the scoreboard off the court.',
}

/** Iconic non-Rolex (and a few Rolex) film entries with local promotional stills. */
const ICONS = [
  {
    id: 'heuer-monaco-steve-mcqueen-le-mans',
    brand: 'Heuer',
    watch: 'Monaco',
    title: 'Heuer Monaco — Steve McQueen — Le Mans',
    description:
      'Steve McQueen’s Michael Delaney in Le Mans (1971) wears the square Heuer Monaco — crown on the left, blue dial, racing strap. The film welded that shape to motorsport cool; TAG Heuer still lives on the echo. Still: McQueen in Gulf kit with the Monaco in frame.',
    media_type: 'film',
    release_year: 1971,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['tagheuer-monaco-caw211p'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/le-mans-heuer-monaco.png',
      source_url: TEDDY,
      credit: 'Le Mans (1971) / Cinema Center Films · editorial still via Teddy Baldassarre movie-watches roundup',
      license: PROMO_LICENSE,
      caption: 'Steve McQueen as Michael Delaney — Heuer Monaco on the wrist, Gulf racing suit.',
    },
  },
  {
    id: 'omega-seamaster-daniel-craig-no-time-to-die',
    brand: 'Omega',
    watch: 'Seamaster Diver 300M 007 Edition',
    title: 'Omega Seamaster — Daniel Craig — No Time to Die',
    description:
      'Craig’s final Bond film puts him in the titanium Seamaster Diver 300M 007 Edition — mesh bracelet, tropical dial, broad-arrow markers. Omega’s Bond deal is product placement with a plot function: the watch is part of how Bond reads as equipped.',
    media_type: 'film',
    release_year: 2021,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['omega-seamaster-300m'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/no-time-to-die-omega.png',
      source_url: TEDDY,
      credit: 'No Time to Die (2021) / EON · Metro-Goldwyn-Mayer · editorial composite via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Daniel Craig as Bond beside the Seamaster Diver 300M 007 Edition.',
    },
  },
  {
    id: 'casio-ca53w-michael-j-fox-back-to-the-future',
    brand: 'Casio',
    watch: 'CA-53W Calculator',
    title: 'Casio CA-53W — Michael J. Fox — Back to the Future',
    description:
      'Marty McFly’s calculator watch is 1985 in resin: keypad, tiny LCD, zero prestige — and more famous than most luxury placements. Scarcity here is cultural memory, not limited production.',
    media_type: 'film',
    release_year: 1985,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['casio-f91w'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/bttf-casio.png',
      source_url: TEDDY,
      credit: 'Back to the Future (1985) / Universal Pictures · Amblin · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Michael J. Fox as Marty McFly with the Casio calculator watch visible on the wrist.',
    },
  },
  {
    id: 'citizen-bullhead-brad-pitt-once-upon-a-time-in-hollywood',
    brand: 'Citizen',
    watch: 'Challenge Timer “Bullhead”',
    title: 'Citizen Bullhead — Brad Pitt — Once Upon a Time in Hollywood',
    description:
      'Cliff Booth’s gold Citizen Challenge Timer (the “Bullhead”) sits on a wide bund strap while Brad Pitt drives through 1969 Los Angeles. Tarantino turned a relatively obscure chronograph into a modern grail overnight — attention without factory scarcity.',
    media_type: 'film',
    release_year: 2019,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/ouatih-citizen-bullhead.png',
      source_url: TEDDY,
      credit: 'Once Upon a Time in Hollywood (2019) / Sony · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Brad Pitt as Cliff Booth — Citizen Bullhead chronograph on a bund strap.',
    },
  },
  {
    id: 'hamilton-ventura-elvis-blue-hawaii',
    brand: 'Hamilton',
    watch: 'Ventura',
    title: 'Hamilton Ventura — Elvis Presley — Blue Hawaii',
    description:
      'Elvis in Blue Hawaii (1961) wears the shield-shaped Hamilton Ventura — electric, asymmetrical, impossible to confuse with a round dress watch. The film fixed the Ventura in pop memory long before reissues.',
    media_type: 'film',
    release_year: 1961,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/blue-hawaii-hamilton-ventura.png',
      source_url: TEDDY,
      credit: 'Blue Hawaii (1961) / Paramount · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Elvis Presley with the triangular Hamilton Ventura on the left wrist.',
    },
  },
  {
    id: 'hamilton-khaki-interstellar',
    brand: 'Hamilton',
    watch: 'Khaki Field / Murph',
    title: 'Hamilton — Matthew McConaughey — Interstellar',
    description:
      'Nolan’s Interstellar makes a Hamilton the plot device: Cooper’s field watch and Murph’s heirloom become the film’s clock. Hamilton later sold the association hard. Screen attention here is literally the story.',
    media_type: 'film',
    release_year: 2014,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['hamilton-khaki-field-h69439931'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/interstellar-hamilton.png',
      source_url: TEDDY,
      credit: 'Interstellar (2014) / Paramount · Warner Bros. · promotional key art via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Interstellar promotional image — Hamilton’s on-screen partnership with the film is well documented.',
    },
  },
  {
    id: 'seiko-h558-schwarzenegger-predator',
    brand: 'Seiko',
    watch: 'H558-5009 “Arnie”',
    title: 'Seiko H558 — Arnold Schwarzenegger — Predator',
    description:
      'Dutch’s Seiko H558-5009 in Predator (1987) is the digital “Arnie” — chunky, utilitarian, and still chased by collectors who want the jungle chronograph that survived the hunt. Attention created the nickname.',
    media_type: 'film',
    release_year: 1987,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/predator-seiko.png',
      source_url: TEDDY,
      credit: 'Predator (1987) / 20th Century Fox · theatrical poster via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Predator theatrical poster — Schwarzenegger as Dutch; the Seiko H558 is the associated on-wrist watch.',
    },
  },
  {
    id: 'orfina-porsche-design-top-gun',
    brand: 'Orfina Porsche Design',
    watch: 'Chronograph 1',
    title: 'Orfina Porsche Design Chronograph 1 — Top Gun',
    description:
      'On the carrier deck in Top Gun (1986), the matte black Orfina Porsche Design Chronograph 1 reads as fighter-pilot kit. Iceman’s wrist is part of why the watch still trades as an ’80s aviation icon.',
    media_type: 'film',
    release_year: 1986,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/top-gun-orfina.png',
      source_url: TEDDY,
      credit: 'Top Gun (1986) / Paramount · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Val Kilmer (Iceman) and Tom Cruise (Maverick) — Orfina Porsche Design chronograph visible on Kilmer’s wrist.',
    },
  },
  {
    id: 'rolex-datejust-christian-bale-american-psycho',
    brand: 'Rolex',
    watch: 'Datejust',
    title: 'Rolex Datejust — Christian Bale — American Psycho',
    description:
      'Patrick Bateman’s gold Datejust on a Jubilee bracelet is 1980s Wall Street costume language — the watch as manners and menace. Mapped family-only; the still shows the bracelet and case clearly.',
    media_type: 'film',
    release_year: 2000,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/american-psycho-datejust.png',
      source_url: TEDDY,
      credit: 'American Psycho (2000) / Lionsgate · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Christian Bale as Patrick Bateman — gold Datejust on Jubilee bracelet.',
    },
  },
  {
    id: 'tag-carrera-ryan-gosling-gray-man',
    brand: 'TAG Heuer',
    watch: 'Carrera Three Hands',
    title: 'TAG Heuer Carrera — Ryan Gosling — The Gray Man',
    description:
      'Ryan Gosling’s Six in The Gray Man wears a clean Carrera three-hand — steel, silver dial, no chrono clutter. TAG’s placement is modern spy minimalism rather than Bond dive-watch theatre.',
    media_type: 'film',
    release_year: 2022,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['tagheuer-carrera-glassbox-cbs2210'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/gray-man-tag-carrera.png',
      source_url: TEDDY,
      credit: 'The Gray Man (2022) / Netflix · TAG Heuer promotional still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Ryan Gosling with TAG Heuer Carrera three-hand visible on the left wrist.',
    },
  },
  {
    id: 'bremont-tom-hardy-venom',
    brand: 'Bremont',
    watch: 'ALT1-C / Alt-series',
    title: 'Bremont — Tom Hardy — Venom',
    description:
      'Tom Hardy’s Eddie Brock wears Bremont in Venom — independent British chronograph energy on a Marvel anti-hero. Placement over pedigree; we keep the read at family level.',
    media_type: 'film',
    release_year: 2018,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/venom-bremont.png',
      source_url: TEDDY,
      credit: 'Venom (2018) / Sony · Columbia · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Tom Hardy as Eddie Brock — Bremont chronograph on the wrist.',
    },
  },
  {
    id: 'panerai-sylvester-stallone-daylight',
    brand: 'Panerai',
    watch: 'Luminor (Sly era)',
    title: 'Panerai — Sylvester Stallone — Daylight',
    description:
      'Stallone’s 1990s Panerai habit — including Daylight (1996) — dragged the oversized Luminor out of military obscurity into Hollywood. The brand’s modern fame is partly this casting history.',
    media_type: 'film',
    release_year: 1996,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['panerai-luminor-marina-pam01312'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/daylight-stallone-panerai.png',
      source_url: TEDDY,
      credit: 'Daylight (1996) / Universal Pictures · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Sylvester Stallone — Panerai-associated still from the Daylight era.',
    },
  },
  {
    id: 'rolex-submariner-dicaprio-blood-diamond',
    brand: 'Rolex',
    watch: 'Submariner',
    title: 'Rolex Submariner — Leonardo DiCaprio — Blood Diamond',
    description:
      'DiCaprio’s Danny Archer in Blood Diamond (2006) wears Submariner steel in a film about conflict minerals — a tool watch inside a story about extraction. Family-level Rolex sports mapping.',
    media_type: 'film',
    release_year: 2006,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: ['rolex-16610'],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/blood-diamond-submariner.png',
      source_url: TEDDY,
      credit: 'Blood Diamond (2006) / Warner Bros. · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Leonardo DiCaprio as Danny Archer — Submariner-associated promotional still.',
    },
  },
  {
    id: 'breguet-churchill-darkest-hour',
    brand: 'Breguet',
    watch: 'No. 765 “Turnip” (pocket)',
    title: 'Breguet pocket watch — Gary Oldman — Darkest Hour',
    description:
      'Gary Oldman’s Churchill in Darkest Hour carries the gold Albert chain toward the famous Breguet “Turnip” pocket watch — inheritance as character. Not a wristwatch dossier, but a screen lesson in how timekeeping signals power.',
    media_type: 'film',
    release_year: 2017,
    identification: 'reported',
    match_level: 'family_only',
    matched_card_ids: [],
    source_url: TEDDY,
    media: {
      type: 'image',
      url: '/img/film/darkest-hour-breguet.png',
      source_url: TEDDY,
      credit: 'Darkest Hour (2017) / Focus Features · Working Title · editorial still via Teddy Baldassarre',
      license: PROMO_LICENSE,
      caption: 'Gary Oldman as Winston Churchill — pocket-watch chain visible across the waistcoat.',
    },
  },
]

const rolex = JSON.parse(readFileSync(join(ROOT, 'data/shared/watch_id_rolex.json'), 'utf8'))

const enrichedRolex = rolex.sightings.map((s) => {
  const out = {
    ...s,
    description: longer[s.id] ?? s.description,
    editorial_url: TEDDY,
  }
  // Same Milgauss reference appears twice — only the White Lotus card may fall back to the dossier portrait.
  if (s.id === 'rolex-oyster-perpetual-milgauss-jeff-daniels-man-full') {
    out.suppress_portrait_fallback = true
    out.shared_with = 'rolex-milgauss-patrick-schwarzenegger-the-white-lotus-season-3'
  }
  return out
})

// Icons first (visual wow), then Rolex Watch-ID harvest.
const sightings = [...ICONS, ...enrichedRolex]
const screenTitles = new Set(sightings.map((s) => `${s.media_type}:${s.title}`))

const snapshot = {
  // Rebuilding committed sources does not refresh their evidence age.
  collected: rolex.collected,
  built_at: new Date().toISOString().slice(0, 10),
  source_url: 'https://www.watch-id.com/brands/rolex',
  editorial_url: TEDDY,
  count: sightings.length,
  screen_count: screenTitles.size,
  iconic_stills: ICONS.length,
  limitation:
    'Rolex identifications come from Watch-ID (family-only and tentative stay labeled). Iconic film stills are promotional/editorial images credited to the studio and cross-checked against the Teddy Baldassarre movie-watches roundup — not free-reuse licences. Screen exposure is demand-side attention, never physical scarcity.',
  sightings,
}

const outShared = join(ROOT, 'data/shared/screen_sightings.json')
const outPublic = join(ROOT, 'public/data/screen_sightings.json')
writeFileSync(outShared, JSON.stringify(snapshot, null, 2) + '\n')
writeFileSync(outPublic, JSON.stringify(snapshot, null, 2) + '\n')

console.log(
  `✓ ${snapshot.count} sightings (${ICONS.length} iconic stills + ${enrichedRolex.length} Rolex) → public/data/screen_sightings.json`,
)
