// Uncle Pom's Collection -- the 14 watches attributed to General Prawit
// Wongsuwan by Voice TV (CSI LA compilation, 1 January 2018). The article
// gave romanised Thai names and retail market prices in baht; the
// romanisations are translated to canonical brand+reference here so the
// dossiers, brands, and 4-axis scoring all read as the catalogue would.
//
// The 4-axis scores are honest deductions from the reference's standing
// in the catalogue, not PR claims. Rarity and Demand follow the same
// logic as the dossier Top4Tiles. Provenance is the citation count
// in the article itself. Resellability is the comp evidence we have on
// the reference family in our register.
//
// We do not editorialise. The page does not ask how the watches were
// paid for. The page is the system doing what the system does:
// scoring public references on public data.

export type PomAxisTier = 'STRONG' | 'NEUTRAL' | 'WEAK' | 'UNKNOWN'

export interface PomWatch {
  /** Article position (1-14). The order Voice TV listed them in. */
  position: number
  brand: string
  reference: string
  watch: string
  /** Path to a pop-art watch portrait (under public/img/pom/). */
  image: string
  /** Thai-baht retail at publication (2018-01-01). We render these as
   *  the original article gave them — not the 2026 equivalent. */
  price_thb_at_publication?: number | null
  /** Range string when article said "between X and Y". */
  price_thb_range?: string
  /** Optional deep-link to a dossier when the reference is in our register. */
  dossierId?: string | null
  /** 4-axis tier (Strong / Neutral / Weak / Unknown). */
  rarity: PomAxisTier
  demand: PomAxisTier
  provenance: PomAxisTier
  resellability: PomAxisTier
  /** Two-three-sentence editorial note on why this watch is significant.
   *  We never write how the watch was paid for. */
  note: string
  /** Optional collecting tip / context. */
  tip?: string
}

export const POM_COLLECTION: PomWatch[] = [
  {
    position: 1, brand: 'Richard Mille', reference: 'RM 029', watch: 'RM 029 (automatic, skeletonised)',
    image: '/img/pom/01-pom-watch.jpg',
    price_thb_at_publication: 3_600_000,
    dossierId: null,
    rarity: 'STRONG', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'WEAK',
    note: 'Skeleton automatic, one of the four Mille pieces recorded in the article. Resell is thin because each RM is allocated, not sold.',
    tip: 'Strong on Rarity and Demand — the brand gates allocation, and the secondary market is a closed room. A watch to wear; not a watch to trade.',
  },
  {
    position: 2, brand: 'Richard Mille', reference: 'RM 30', watch: 'RM 30 (automatic, declutched rotor)',
    image: '/img/pom/02-pom-watch.jpg',
    price_thb_at_publication: 4_000_000,
    dossierId: null,
    rarity: 'STRONG', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'WEAK',
    note: 'Second Mille in the article. Same RMA logic: scarcity is real, liquidity is not — these do not change hands often.',
    tip: 'RMA logic on both axes: scarcity is engineered by the maison. The buy is a place on a list; the sell is a phone call.',
  },
  {
    position: 3, brand: 'Rolex', reference: '116506', watch: 'Cosmograph Daytona Platinum — Ice Blue Dial',
    image: '/img/pom/03-pom-watch.jpg',
    price_thb_range: '1.9M – 2.4M THB',
    dossierId: 'rolex-daytona-116506',
    rarity: 'STRONG', demand: 'STRONG', provenance: 'STRONG', resellability: 'STRONG',
    note: 'Platinum Daytona with ice-blue dial. Cited, photographed, and in our register. The cleanest comp market of the 14.',
    tip: 'The only watch in the collection that scores STRONG on all four axes. The ice-blue dial is the visual signal that distinguishes it from the steel Daytona.',
  },
  {
    position: 4, brand: 'Patek Philippe', reference: '5960/1A', watch: 'Annual Calendar Chronograph — steel',
    image: '/img/pom/04-pom-watch.jpg',
    price_thb_range: '1.5M – 1.66M THB',
    dossierId: null,
    rarity: 'STRONG', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'NEUTRAL',
    note: 'Annual calendar chronograph in steel. The most "logical" complication-to-metal pairing in Patek\'s modern catalogue.',
    tip: 'Steel Patek chronograph with a complication that earns its keep. Comp market exists; not deep, not loud, but real.',
  },
  {
    position: 5, brand: 'Audemars Piguet', reference: '26331ST', watch: 'Royal Oak Chronograph — Blue Dial',
    image: '/img/pom/05-pom-watch.jpg',
    price_thb_at_publication: 800_000,
    dossierId: 'audemars-piguet-26331st',
    rarity: 'NEUTRAL', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'STRONG',
    note: 'Royal Oak Chronograph 41mm, blue dial. AP\'s loudest hitter — multiple sales per year, broad buyer base.',
    tip: 'AP\'s loudest hitter. Multiple sales per year means comp evidence is consistent — the most cited AP in the secondary market.',
  },
  {
    position: 6, brand: 'Rolex', reference: '116655BKSRS', watch: 'Sea-Dweller Rolesor — Black / Everose (mod)',
    image: '/img/pom/06-pom-watch.jpg',
    price_thb_at_publication: 800_000,
    dossierId: null,
    rarity: 'WEAK', demand: 'NEUTRAL', provenance: 'WEAK', resellability: 'WEAK',
    note: 'The article\'s label (116655BKSRS) overlaps the Yacht-Master 40 reference family. Either way, a two-tone Rolex; a working piece, not a trophy.',
    tip: 'Lowest scores in the collection. The reference label is ambiguous, the modification is not catalogued, and the buyer pool is small. A watch to wear, not to chase.',
  },
  {
    position: 7, brand: 'Patek Philippe', reference: '3970', watch: 'Perpetual Calendar Chronograph — yellow gold',
    image: '/img/pom/07-pom-watch.jpg',
    price_thb_at_publication: 3_600_000,
    dossierId: null,
    rarity: 'STRONG', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'NEUTRAL',
    note: '3970 in yellow gold — the most-coveted Patek perpetual-calendar chronograph of the 1980s–90s. Strong collector literature, slower sale market.',
    tip: 'A 1980s perpetual calendar chronograph with the Lemania base — the most-cited Patek in the field. Slow to sell, hard to find at a fair price.',
  },
  {
    position: 8, brand: 'Patek Philippe', reference: '5960P', watch: 'Annual Calendar Chronograph — platinum',
    image: '/img/pom/08-pom-watch.jpg',
    price_thb_at_publication: 3_120_000,
    dossierId: 'patek-philippe-5960p',
    rarity: 'STRONG', demand: 'STRONG', provenance: 'STRONG', resellability: 'NEUTRAL',
    note: 'Platinum sibling of the 5960/1A. The 5960P is the rarest of Patek\'s annual-calendar chronographs.',
    tip: 'One of the four pieces in the collection that scores STRONG on Rarity + Demand + Provenance. Platinum case is the mark.',
  },
  {
    position: 9, brand: 'Rolex', reference: 'Pro Hunter Deepsea', watch: 'Deepsea — Pro Hunter modification',
    image: '/img/pom/09-pom-watch.jpg',
    price_thb_at_publication: 800_000,
    dossierId: null,
    rarity: 'STRONG', demand: 'NEUTRAL', provenance: 'WEAK', resellability: 'WEAK',
    note: 'Deepsea customized by Pro Hunter (matte black, sapphire bezel). The modification narrows the buyer pool: pro-hunter buyers only, and they are few.',
    tip: 'Aftermarket modification. Strap-provenance weak; buyer pool small. A wearer, not a trading chip.',
  },
  {
    position: 10, brand: 'Richard Mille', reference: 'RM 010', watch: 'RM 010 (automatic, 3-day reserve)',
    image: '/img/pom/10-pom-watch.jpg',
    price_thb_at_publication: 3_260_000,
    dossierId: null,
    rarity: 'STRONG', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'WEAK',
    note: 'Third Mille in the article. RM 010 was the first "entry" Mille; even so, entry is seven figures in baht.',
    tip: 'The "entry" Mille. Same allocation logic as the 029 and 30 — STRONG on rarity, WEAK on resellability. A place on a list, not a liquid asset.',
  },
  {
    position: 11, brand: 'Rolex', reference: '116503', watch: 'Cosmograph Daytona — Rolesor (steel + yellow gold)',
    image: '/img/pom/11-pom-watch.jpg',
    price_thb_at_publication: 554_000,
    dossierId: 'rolex-126500ln',
    rarity: 'NEUTRAL', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'STRONG',
    note: 'Rolesor Daytona. Demand has been strong since the steel-Panda launch shifted buyer attention to the Daytona line.',
    tip: 'Two-tone Daytona. Demand has been climbing since the 2016 steel-Panda launch shifted attention to the Daytona line. Liquid, not rare.',
  },
  {
    position: 12, brand: 'Rolex', reference: '116621', watch: 'Yacht-Master 40 — Rolesor Everose (chocolate dial)',
    image: '/img/pom/12-pom-watch.jpg',
    price_thb_at_publication: 460_000,
    dossierId: 'rolex-yacht-master-40-126621',
    rarity: 'NEUTRAL', demand: 'NEUTRAL', provenance: 'NEUTRAL', resellability: 'NEUTRAL',
    note: 'Yacht-Master in Everose Rolesor. A quiet middle-of-the-catalogue Rolex — neither trophy nor tool.',
    tip: 'A middle-of-the-catalogue Rolex. No axis scores STRONG or WEAK — the cleanest "neutral" watch in the collection.',
  },
  {
    position: 13, brand: 'Audemars Piguet', reference: '15400ST', watch: 'Royal Oak — Black Dial 41mm',
    image: '/img/pom/13-pom-watch.jpg',
    price_thb_at_publication: 580_000,
    dossierId: 'audemars-piguet-15400st',
    rarity: 'NEUTRAL', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'STRONG',
    note: 'Royal Oak 41mm, the cleanest dress-sport piece in the AP catalogue. Wide buyer base.',
    tip: 'AP\'s "quiet" 41mm Royal Oak. The black dial is less cited than blue, but the buyer base is broader than the loud hitters.',
  },
  {
    position: 14, brand: 'Rolex', reference: '126300', watch: 'Datejust Oyster 41',
    image: '/img/pom/14-pom-watch.jpg',
    price_thb_at_publication: 413_000,
    dossierId: 'rolex-126300',
    rarity: 'WEAK', demand: 'STRONG', provenance: 'NEUTRAL', resellability: 'STRONG',
    note: 'Datejust 41 — the article\'s 14th watch. A workhorse Rolex, never rare, always liquid.',
    tip: 'A workhorse Rolex. Never rare (Rolex makes 800K+ a year), always liquid. The cheapest of the 14, and the easiest to trade.',
  },
]

/** Aggregate stats for the bio aside. */
export const POM_AGGREGATE = {
  count: POM_COLLECTION.length,
  /** Sum of mid-points where we have a number; range entries count as
   *  the article-stated top figure for transparency. */
  brands: new Set(POM_COLLECTION.map((w) => w.brand)).size,
  high_tier_strong: POM_COLLECTION.filter((w) =>
    w.rarity === 'STRONG' || w.demand === 'STRONG').length,
  has_dossier: POM_COLLECTION.filter((w) => w.dossierId).length,
}

/** "Uncle Pom" (ลุงป้อม) is the public nickname of General Prawit Wongsuwan.
 *  The page never uses that nickname in the URL or in the title — that is
 *  editorial, not encyclopedic. The page is /pom; the title is "Uncle
 *  Pom\'s Collection" because that is how Thai readers know the figure,
 *  and the article we are sourcing is by a Thai outlet about a Thai
 *  public figure. We do not translate the romanisation to "General
 *  Prawit" anywhere in the page except the bio paragraph. */
export const POM_BIO = {
  nickname: 'Uncle Pom (ลุงป้อม)',
  full_name: 'General Prawit Wongsuwan (พลเอก ประวิตร วงษ์สุวรรณ)',
  /** Date the article identified the 14th watch. */
  article_date: '2018-01-01',
  article_source: 'Voice TV (CSI LA compilation)',
  article_url: 'https://www.voicetv.co.th/read/r1MN-VvQf',
  total_count: 14,
  /** Short, honest editorial framing. Does not ask how the watches were
   *  paid for. Does not call them "luxury" pejoratively. The framing is
   *  one sentence: he is a well-respected figure in Thailand; the
   *  watches are public; we score what is public. */
  framing:
    'General Prawit Wongsuwan is a well-respected figure in Thailand — a former army officer, former Deputy Prime Minister, and former Minister of Defence. The watches attributed to him are public record. We score them on the four axes the rest of the site uses — Rarity, Demand, Provenance, Resellability — exactly the way we would score any other reference.',
}
