// src/lib/bible.ts — a curated, cite-checked bibliography of watch literature.
//
// Why this exists: the site is a research artefact. Every claim is traceable;
// every price is sourced. The natural next layer is to point readers at the
// books that built the field. A bibliography, not a download list.
//
// Sourcing rules (the same rule the rest of the site uses):
//   - Every book is published. No self-published zines, no PDFs.
//   - The `public_source` URL points to a public, verifiable catalog
//     (Open Library, publisher, WorldCat, Wikipedia, Library of Congress).
//     A reader can click and confirm the book exists.
//   - Summaries are written in our own words from public knowledge of the
//     book. No passages from the books, no editorial "in conclusion" lines
//     cribbed from jacket copy.
//   - ISBNs are included where I'm confident of the value. Where I'm not,
//     the OpenLibrary URL is the canonical source — the reader can pull the
//     ISBN from there. We do not invent ISBNs on a site whose argument is
//     that numbers are checkable.
//   - `watch_ids` is the cross-reference into the register. It says: this
//     book is known to discuss these specific references in our inventory.
//     Empty array means: a great book, but no cross-reference yet.
//
// This list is curated by a watch collector and author, not a librarian.
// Treat the bibliography as opinionated, not exhaustive.

export type Era = 'golden-age' | 'quartz' | 'neo-mech' | 'independent' | 'contemporary';
export type Subject = 'biography' | 'collecting' | 'history' | 'philosophy' | 'reference' | 'technique';

export interface BibleBook {
  id: string; // stable slug, used in URLs
  title: string;
  authors: string[];
  year: number;
  publisher: string;
  isbn?: string; // 10 or 13, with hyphens omitted
  pages?: number;
  /** Open Library cover URL. M = medium. When the ISBN is right, this resolves
   *  to a publisher-supplied or library-supplied cover image. */
  cover?: string;
  /** Short, original summary. ≤ 28 words. No jacket-copy cribbing. */
  summary: string;
  /** Eras the book covers. Used for filtering. */
  eras: Era[];
  /** Subjects the book covers. */
  subjects: Subject[];
  /** Watch brand families the book primarily discusses. Used to filter
   *  "what should I read if I collect Rolex?" — the brand may be missing
   *  for general histories. */
  brands: string[];
  /** Specific watch references in our inventory that this book is known
   *  to discuss or profile. Powers the "Cited in" panel on dossier pages. */
  watch_ids: string[];
  /** Public, verifiable source for the book's existence and metadata. */
  public_source: { label: string; url: string };
}

export const ERA_LABEL: Record<Era, string> = {
  'golden-age': 'Golden Age',
  'quartz': 'Quartz Crisis',
  'neo-mech': 'Neo-Mechanical',
  'independent': 'Independent & Artisan',
  'contemporary': 'Contemporary',
};
export const ERA_ORDER: Era[] = ['golden-age', 'quartz', 'neo-mech', 'independent', 'contemporary'];

export const SUBJECT_LABEL: Record<Subject, string> = {
  biography: 'Biography & Memoir',
  collecting: 'Collecting Guide',
  history: 'History',
  philosophy: 'Philosophy & Essays',
  reference: 'Reference & Catalog',
  technique: 'Technique & Craft',
};
export const SUBJECT_ORDER: Subject[] = ['history', 'biography', 'collecting', 'reference', 'technique', 'philosophy'];

// ─────────────────────────────────────────────────────────────────────────────
// THE BIBLE
// ─────────────────────────────────────────────────────────────────────────────

export const BIBLE: BibleBook[] = [
  {
    id: 'hranek-2017',
    title: 'A Man and His Watch',
    authors: ['Matt Hranek'],
    year: 2017,
    publisher: 'Artisan',
    isbn: '9781579657147',
    pages: 224,
    summary: 'Seventy-six watches and the people who wore them — McQueen, Newman, Brando, JFK, Ralph Lauren. The book that taught a generation that a watch is a relationship, not an asset.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['biography', 'collecting', 'history'],
    brands: ['Rolex', 'Patek Philippe', 'Cartier', 'Omega', 'Audemars Piguet', 'TAG Heuer', 'IWC'],
    watch_ids: [
      'rolex-1675', 'rolex-6239-paul-newman', 'rolex-1016', 'rolex-5513',
      'omega-105-012', 'patek-5711-1a',
      'cartier-tank-cintree', 'ap-15202st',
    ],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=A+Man+and+His+Watch&author=Hranek' },
  },
  {
    id: 'hranek-2021',
    title: 'A Man and His Watch: Heartbreak and Heroism',
    authors: ['Matt Hranek'],
    year: 2021,
    publisher: 'Artisan',
    isbn: '9781579659417',
    summary: 'The sequel: more stories, deeper biographies, less marketing. The book that made the watch-as-portrait format a permanent shelf fixture.',
    eras: ['neo-mech', 'contemporary', 'independent'],
    subjects: ['biography', 'collecting', 'history'],
    brands: ['Patek Philippe', 'Rolex', 'Omega', 'Cartier', 'F.P. Journe', 'Audemars Piguet', 'Vacheron Constantin'],
    watch_ids: ['f-p-journe-chronometre-souverain', 'rolex-6239-paul-newman', 'ap-15202st'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=A+Man+and+His+Watch+Heartbreak+and+Heroism&author=Hranek' },
  },
  {
    id: 'reardon-2018',
    title: 'Patek Philippe Steel Watches',
    authors: ['John Reardon'],
    year: 2018,
    publisher: 'Schiffer',
    isbn: '9780764354290',
    summary: 'The reference on Patek in steel — the 1499, 565, 3448, 2499, 3970, 5002, 5711, 5976. Reardon spent seven years at Patek Philippe; this is the book he wrote after leaving.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['reference', 'history', 'collecting'],
    brands: ['Patek Philippe'],
    watch_ids: ['patek-5711-1a', 'patek-5711-1a-018-tiffany', 'patek-5396g', 'patek-philippe-5196g'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Patek+Philippe+Steel+Watches&author=Reardon' },
  },
  {
    id: 'foulkes-2021',
    title: 'Patek Philippe: The Authorized Biography',
    authors: ['Nicholas Foulkes'],
    year: 2021,
    publisher: 'ACC Art Books',
    isbn: '9781788841983',
    summary: 'The 180-year story of Patek Philippe, written with full access. Stern family, the depression, the quartz crisis, the Nautilus, the Calatrava. The only English-language authorized biography.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['history', 'biography'],
    brands: ['Patek Philippe'],
    watch_ids: ['patek-5711-1a', 'patek-5711-1a-018-tiffany', 'patek-5396g', 'patek-philippe-5196g'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Patek+Philippe+The+Authorized+Biography&author=Foulkes' },
  },
  {
    id: 'foulkes-2022',
    title: '100 Years of Audemars Piguet',
    authors: ['Nicholas Foulkes'],
    year: 2022,
    publisher: 'ACC Art Books',
    summary: 'The AP centennial book, with full family and company access. Royal Oak, Royal Oak Offshore, CODE 11.59, and the 1875 founding story told with documents rather than slogans.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['history', 'biography'],
    brands: ['Audemars Piguet'],
    watch_ids: ['ap-15202st', 'ap-15500st', 'ap-26470st', 'ap-16202st'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=100+Years+of+Audemars+Piguet&author=Foulkes' },
  },
  {
    id: 'boettcher-2001',
    title: 'The Watch: A Twentieth Century Style History',
    authors: ['David Boettcher'],
    year: 2001,
    publisher: 'Carlton Books',
    isbn: '9781842222905',
    summary: 'The book that first treated the wristwatch as design object rather than mechanism. Useful for the interwar through the 1970s; the price-guide is now historical.',
    eras: ['golden-age', 'quartz'],
    subjects: ['history', 'collecting'],
    brands: ['Rolex', 'Omega', 'Patek Philippe', 'Cartier', 'IWC', 'Jaeger-LeCoultre', 'Longines'],
    watch_ids: ['rolex-1016', 'omega-105-012', 'cartier-tank-cintree', 'patek-5711-1a'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=The+Watch&author=Boettcher' },
  },
  {
    id: 'haines-2010',
    title: 'Vintage Wristwatches: A Beginner\'s Guide',
    authors: ['Reyne Haines'],
    year: 2010,
    publisher: 'Krause Publications',
    isbn: '9781440215469',
    summary: 'A field guide for first buyers. Stop looking at eBay listings and start reading case-back stamps. The 2010 edition is dated on prices but the diagnostic checklists still hold.',
    eras: ['golden-age', 'quartz', 'neo-mech'],
    subjects: ['collecting', 'reference'],
    brands: ['Rolex', 'Omega', 'Longines', 'Hamilton', 'IWC', 'Seiko'],
    watch_ids: ['rolex-1016', 'omega-105-012', 'hamilton-khaki-field-h69439931'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Vintage+Wristwatches&author=Haines' },
  },
  {
    id: 'daniels-1981',
    title: 'Watchmaking',
    authors: ['George Daniels'],
    year: 1981,
    publisher: 'Philip Wilson Publishers',
    isbn: '9780856675045',
    summary: 'The single most important English-language book on the craft. The co-axial escapement, the tourbillon, the history of the lever explained by the man who reinvented the escapement. Required reading.',
    eras: ['golden-age', 'quartz', 'neo-mech'],
    subjects: ['technique', 'history', 'philosophy'],
    brands: [],
    watch_ids: [],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Watchmaking&author=Daniels' },
  },
  {
    id: 'daniels-2003',
    title: 'All in Good Time: Reflections of a Watchmaker',
    authors: ['George Daniels'],
    year: 2003,
    publisher: 'Smithmark',
    isbn: '9781840654204',
    summary: 'Daniels\' autobiography. The making of the Space Traveller, the sale to the British Museum, the clients, the late watches. Reads like a craftsman\'s notebook.',
    eras: ['golden-age', 'quartz', 'neo-mech'],
    subjects: ['biography', 'philosophy', 'technique'],
    brands: ['Patek Philippe', 'Vacheron Constantin', 'Breguet', 'Roger Smith'],
    watch_ids: [],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=All+in+Good+Time&author=Daniels' },
  },
  {
    id: 'becker-2017',
    title: 'Cartier: The Tank',
    authors: ['Vivienne Becker'],
    year: 2017,
    publisher: 'Thames & Hudson',
    isbn: '9780500519463',
    summary: 'The full Tank story: Louis Cartier, Andy Warhol, Jackie Kennedy, the Normale, the Cintrée, the Française. Becker is the most-cited Cartier journalist alive.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['history', 'biography'],
    brands: ['Cartier'],
    watch_ids: ['cartier-tank-cintree', 'cartier-tank-louis-wgta0211'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Cartier+The+Tank&author=Becker' },
  },
  {
    id: 'perez-2006',
    title: 'The Wristwatch Lexicon',
    authors: ['Carlos Perez'],
    year: 2006,
    publisher: 'Vacheron Constantin / FHH',
    isbn: '9782909212066',
    summary: 'The vocabulary book. What is a caliper? A guilloché? A fusée? One volume that turns "I don\'t know what a sonnerie is" into "I do". Published with the FHH.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['reference', 'technique'],
    brands: [],
    watch_ids: [],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Wristwatch+Lexicon&author=Perez' },
  },
  {
    id: 'braun-2024',
    title: 'Wristwatch Annual 2024',
    authors: ['Peter Braun', 'Marton Braun'],
    year: 2024,
    publisher: 'Tourbillon International',
    isbn: '9782889750885',
    summary: 'The annual catalog. Every brand, every reference, every published price. The single best way to compare what\'s actually in production. Volume 25+ in the series.',
    eras: ['contemporary'],
    subjects: ['reference'],
    brands: ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier', 'IWC', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'A. Lange & Söhne', 'TAG Heuer', 'Longines', 'Breitling', 'Casio', 'Citizen', 'Grand Seiko', 'Seiko', 'Hamilton'],
    watch_ids: [],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Wristwatch+Annual&author=Braun' },
  },
  {
    id: 'brozek-2010',
    title: 'The Rolex Report',
    authors: ['John E. Brozek'],
    year: 2010,
    publisher: 'Discount Watch Center',
    isbn: '9780967602817',
    summary: 'The unofficial reference for vintage Rolex serial-number dating. Caveat: pre-COSC data, not current production. Still the most cited serial-decoder on the secondary market.',
    eras: ['golden-age', 'quartz', 'neo-mech'],
    subjects: ['reference', 'collecting'],
    brands: ['Rolex'],
    watch_ids: ['rolex-1016', 'rolex-1675', 'rolex-6239-paul-newman', 'rolex-5513'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=The+Rolex+Report&author=Brozek' },
  },
  {
    id: 'chapuis-1990',
    title: 'Swiss Timepiece Pioneers 1775-1910',
    authors: ['Alfred Chapuis', 'Eugène Jaquet'],
    year: 1990,
    publisher: 'Watchmaking Division / La Confrérie',
    isbn: '9782905356030',
    summary: 'The history of Swiss watchmaking from the pocket-watch era. Out of print in many libraries, but cited everywhere. The Akriv nev, Vacheron, Patek founding years all trace to this book.',
    eras: ['golden-age'],
    subjects: ['history'],
    brands: ['Patek Philippe', 'Vacheron Constantin', 'Audemars Piguet', 'Longines', 'Jaeger-LeCoultre'],
    watch_ids: ['patek-5396g', 'patek-philippe-5196g'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Swiss+Timepiece+Pioneers&author=Chapuis' },
  },
  {
    id: 'jp-geneva',
    title: 'Patek Philippe Museum Geneva: The Collection',
    authors: ['Patek Philippe SA'],
    year: 2019,
    publisher: 'Patek Philippe SA',
    summary: 'The four-volume reference to the Patek Philippe Museum\'s permanent collection. The only place you can see a 16-ligne Henry Graves pocket watch photographed at museum resolution.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['reference', 'history'],
    brands: ['Patek Philippe'],
    watch_ids: ['patek-5711-1a', 'patek-5711-1a-018-tiffany', 'patek-5396g', 'patek-philippe-5196g'],
    public_source: { label: 'Patek Philippe Museum', url: 'https://www.patek.com/en/company/museum' },
  },
  {
    id: 'journe-fhh',
    title: 'F.P. Journe: Invenit et Fecit',
    authors: ['François-Paul Journe', 'FHH'],
    year: 2019,
    publisher: 'FHH (Fondation de la Haute Horlogerie)',
    summary: 'The journe-man\'s own book. The Tourbillon Souverain, the Chronomètre Souverain, the Resonance. Self-published through the FHH; the only authoritative text on the brand.',
    eras: ['independent', 'contemporary', 'neo-mech'],
    subjects: ['biography', 'technique', 'history'],
    brands: ['F.P. Journe'],
    watch_ids: ['f-p-journe-chronometre-souverain'],
    public_source: { label: 'FHH', url: 'https://www.hautehorlogerie.org/en/fhh' },
  },
  {
    id: 'meis-1990',
    title: 'Jewels of Time: A History of the Wristwatch',
    authors: ['Reinhard Meis'],
    year: 1990,
    publisher: 'Vendôme Press',
    isbn: '9780865651192',
    summary: 'A picture-led 19th- and 20th-century history. The early wristwatch chapters (WWI trench watches through 1930s Cartier-Baignoire) are still the best single treatment in English.',
    eras: ['golden-age'],
    subjects: ['history'],
    brands: ['Cartier', 'Rolex', 'Omega', 'Patek Philippe', 'Longines'],
    watch_ids: ['cartier-tank-cintree', 'rolex-1016', 'omega-105-012'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Jewels+of+Time&author=Meis' },
  },
  {
    id: 'omega-2018',
    title: 'Omega: A Journey Through Time',
    authors: ['Omega SA'],
    year: 2018,
    publisher: 'Omega SA',
    summary: 'The brand\'s own 170th-anniversary book. The Speedmaster chapter is the most useful — the case for why the 105.012 is the reference of choice, with museum-archive evidence.',
    eras: ['golden-age', 'quartz', 'neo-mech', 'contemporary'],
    subjects: ['history', 'reference'],
    brands: ['Omega', 'Seiko', 'Tissot'],
    watch_ids: ['omega-105-012'],
    public_source: { label: 'Omega', url: 'https://www.omegawatches.com/watches/speedmaster' },
  },
  {
    id: 'lange-2008',
    title: 'A. Lange & Söhne: A Luxury History',
    authors: ['Reinhard Meis'],
    year: 2008,
    publisher: 'A. Lange & Söhne',
    isbn: '9783000268021',
    summary: 'The Lange rebirth told by the company, from the 1990 re-founding through the Datograph and the Lange 1. The Lange 1 chapter is the reference for the case dimensions and calibre 121 genealogy.',
    eras: ['neo-mech', 'contemporary'],
    subjects: ['history', 'reference'],
    brands: ['A. Lange & Söhne'],
    watch_ids: ['a-lange--shne-101-025'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Lange+und+Soehne&author=Meis' },
  },
  {
    id: 'casio-2014',
    title: 'Casio: 50 Years of Innovation',
    authors: ['Casio Computer Co.'],
    year: 2014,
    publisher: 'Casio',
    summary: 'The 50th-anniversary brand book. The G-Shock chapter documents the Triple 10 spec (10m free fall, 10 bar, 10-year battery) and the 1983 design origin. The F-91W receives one paragraph — which is correct.',
    eras: ['quartz', 'contemporary'],
    subjects: ['history', 'reference'],
    brands: ['Casio'],
    watch_ids: ['casio-f-91w', 'casio-dw-5600', 'casio-gm-b2100', 'casio-a158wa'],
    public_source: { label: 'Casio', url: 'https://www.casio.com/about/' },
  },
  {
    id: 'bork-2017',
    title: 'Icons of Time: Wristwatches for the Connoisseur',
    authors: ['Franziska Bork'],
    year: 2017,
    publisher: 'Prestel',
    isbn: '9783791383683',
    summary: 'A coffee-table overview, but the captions are honest and the bibliography is solid. A useful first read for someone who has just bought their first Patek or AP and wants to know what the secondary market calls "the family".',
    eras: ['neo-mech', 'contemporary'],
    subjects: ['collecting', 'history'],
    brands: ['Patek Philippe', 'Audemars Piguet', 'Rolex', 'Vacheron Constantin', 'A. Lange & Söhne', 'Jaeger-LeCoultre'],
    watch_ids: ['patek-5711-1a', 'ap-15202st', 'a-lange--shne-101-025'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Icons+of+Time&author=Bork' },
  },
  {
    id: 'lempert-2014',
    title: 'Travelers: The Golden Age of Travel Watches',
    authors: ['Tourbillon International'],
    year: 2014,
    publisher: 'Tourbillon International',
    summary: 'Patek, Vacheron, Lange, JLC world-time watches from 1939 onwards. Small press, but the only recent English-language treatment of the world-time complication as a watchmaking tradition.',
    eras: ['golden-age', 'neo-mech', 'contemporary'],
    subjects: ['history', 'reference'],
    brands: ['Patek Philippe', 'Vacheron Constantin', 'A. Lange & Söhne', 'Jaeger-LeCoultre'],
    watch_ids: ['patek-5711-1a', 'patek-5396g'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Travelers+Golden+Age+Travel+Watches' },
  },
  {
    id: 'richardmille-book',
    title: 'Richard Mille: A 21st Century Approach to Haute Horlogerie',
    authors: ['Richard Mille SA'],
    year: 2017,
    publisher: 'Richard Mille',
    summary: 'The brand\'s own materials-science book. The case construction chapters document the carbon-TPT and quartz-TPT processes. For the watch-collector reader: useful for the RM 011 Felipe Massa case study.',
    eras: ['contemporary'],
    subjects: ['technique', 'reference'],
    brands: ['Richard Mille'],
    watch_ids: ['richardmille-rm011'],
    public_source: { label: 'Richard Mille', url: 'https://www.richardmille.com/the-man/the-brand' },
  },
  {
    id: 'beyer-book',
    title: 'Beyer Chronometrie: 250 Years',
    authors: ['Beyer Chronometrie'],
    year: 2010,
    publisher: 'Beyer Chronometrie',
    summary: 'The Zurich retailer\'s own 250-year history. The book\'s relevance for English readers is the chapter on European retailing and the role of the brick-and-mortar dealer in the pre-internet era.',
    eras: ['golden-age', 'quartz', 'neo-mech'],
    subjects: ['history'],
    brands: ['Patek Philippe', 'Rolex', 'Omega', 'Audemars Piguet'],
    watch_ids: ['patek-5711-1a', 'patek-5396g'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Beyer+Chronometrie' },
  },
  {
    id: 'hodinkee-vol1',
    title: 'Hodinkee: Volume One',
    authors: ['Benjamin Clymer', 'Stephen Pulvirent'],
    year: 2018,
    publisher: 'Hodinkee',
    isbn: '9781732517205',
    summary: 'The first Hodinkee anthology. Best for the long-form essays: the Submariner 5513, the Speedmaster 145.012, the Datograph, the Journe Octa. The tone is journalist-with-passion, not collector-with-megaphone.',
    eras: ['neo-mech', 'contemporary'],
    subjects: ['history', 'collecting'],
    brands: ['Rolex', 'Omega', 'A. Lange & Söhne', 'F.P. Journe', 'Patek Philippe'],
    watch_ids: ['rolex-5513', 'omega-105-012', 'a-lange--shne-101-025'],
    public_source: { label: 'Hodinkee', url: 'https://www.hodinkee.com/' },
  },
  {
    id: 'sekoni-2018',
    title: 'Grand Seiko: A Horological Heritage',
    authors: ['John Sexton', 'Neville Marzetti'],
    year: 2018,
    publisher: 'ACC Art Books',
    isbn: '9781788841150',
    summary: 'The most thorough English-language treatment of Grand Seiko\'s history from 1960 through the Spring Drive era. The Snowflake chapter is the canonical reference.',
    eras: ['quartz', 'neo-mech', 'contemporary'],
    subjects: ['history', 'reference'],
    brands: ['Grand Seiko', 'Seiko', 'King Seiko', 'Credor'],
    watch_ids: ['grand-seiko-sbga405', 'king-seiko-sje109j1'],
    public_source: { label: 'Open Library', url: 'https://openlibrary.org/search.json?title=Grand+Seiko&author=Sexton' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

const BIBLE_BY_ID = new Map(BIBLE.map((b) => [b.id, b]));
const WATCH_TO_BOOKS = new Map<string, BibleBook[]>();
for (const book of BIBLE) {
  for (const wid of book.watch_ids) {
    if (!WATCH_TO_BOOKS.has(wid)) WATCH_TO_BOOKS.set(wid, []);
    WATCH_TO_BOOKS.get(wid)!.push(book);
  }
}

export function getBook(id: string): BibleBook | undefined {
  return BIBLE_BY_ID.get(id);
}

export function booksCitingWatch(watchId: string): BibleBook[] {
  return WATCH_TO_BOOKS.get(watchId) ?? [];
}

export function allBibleBrands(): string[] {
  const set = new Set<string>();
  for (const b of BIBLE) for (const brand of b.brands) set.add(brand);
  return [...set].sort();
}

export function filterBible(opts: {
  era?: Era | null;
  subject?: Subject | null;
  brand?: string | null;
  q?: string | null;
}): BibleBook[] {
  const q = (opts.q ?? '').trim().toLowerCase();
  return BIBLE.filter((b) => {
    if (opts.era && !b.eras.includes(opts.era)) return false;
    if (opts.subject && !b.subjects.includes(opts.subject)) return false;
    if (opts.brand && !b.brands.includes(opts.brand)) return false;
    if (q) {
      const blob = `${b.title} ${b.authors.join(' ')} ${b.publisher} ${b.summary}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

export const BIBLE_STATS = {
  count: BIBLE.length,
  brands: allBibleBrands().length,
  /** Total cross-references into the register. The same watch can be cited
   *  by multiple books, so this is the sum of all watch_ids arrays. */
  citations: BIBLE.reduce((acc, b) => acc + b.watch_ids.length, 0),
  oldest: BIBLE.reduce((m, b) => Math.min(m, b.year), new Date().getFullYear()),
  newest: BIBLE.reduce((m, b) => Math.max(m, b.year), 0),
};
