# STYLE.md — Time Pop

What this site looks like, and why. A reviewer's job is to find the defaults
nobody chose. This file is the list of choices somebody DID choose, so a
reviewer does not mistake them for defaults.

Read it before changing anything. The rules that are not in here are the
rules.

---

## What this site is

A register. 307 watches, each with a dossier: what it is, what was sold for,
what it cost, where the story came from, and — on every number — the public
source it came from. The reader is a collector or a researcher. The job is to
find a fact, check it, and move on.

That job sets everything below.

---

## The voice

- **Uppercase mono micro-labels.** `REFERENCES`, `WITH COMPS`, `AS OF`. This
  is a wayfinding system: the machine-readable layer of the page says what
  each number is. It is not decoration and it is not a greeting.
- **S sentence case for prose.** Headlines and body copy are sentences. The
  caps stop where the labels start.
- **No filler.** No *unlock*, *seamless*, *revolutionize*. If a sentence
  could sit on any site, it does not go on this one.
- **The copy is Dr Non's.** Do not rewrite it to pass a scanner. If a
  scanner flags a sentence, quote it and ask.

---

## The grid

**The grid is MODULAR.** The ledger is cut into modules; a module is as big as
the evidence in it, and the rules between modules are the grid. It is never
floating, never off-grid, and never a card grid of peers pretending to be a
composition.

- **One ruled ledger.** Hairline black rules on paper white. The rules are
  the grid: a row of figures, a column of dossiers, a table of references.
  Nothing floats in a shadow and nothing sits in a rounded card.
- **Black rules are 1px.** The heavier 2–3px rules are structure: the
  masthead's floor and the footer. They are not a border around a box.
- **Content-sized cells.** A cell is as tall as the text in it. When a cell
  has more room than its text, the space is the cell's air, not a void to
  be filled with a badge.
- **Prose stops at 65 characters.** Wide screens get columns, not longer
  lines.
- **Spacing is on a 4px scale.** No `13px` and no `11px`. A spacing value
  that is not on the scale is a tell.

---

## Colour

The palette is Palette's — coral, yellow, navy, teal, sky on paper white with
ink black — not Mondrian's primaries and not a rainbow. Each hue has ONE job:

| colour | job |
|---|---|
| **coral** `#EF6A5B` | the signal: the one number that would embarrass us (0 invented) and the refusals |
| **yellow** `#F0B83A` | the live section in the masthead; the warm state |
| **navy** `#11364B` | structure: the ledger plate, the counter-field |
| **teal** `#55B8B1` | information: the four axes, the sourced figures |
| **sky** `#7FC8DD` | the quiet one: credits, links on dark |

Two saturated accents at a time. A third colour on a screen is a decision
that has to be written down.

---

## The four axes

Rarity, Demand, Story, Resell. Each axis carries its hue — coral, yellow,
navy, teal — and the axis is always named in words beside the colour, so the
colour is never the only signal. This is a real status colour system, and it
is the site's main visual shorthand: a reader learns the four hues once.

---

## The hard offset shadow

`4px 4px 0 0` in ink, on hover, on the things that are cards and links you
can push. It is the site's one shadow, it has no blur, and it is never on a
resting surface. Pop-art, not glass: nothing here is blurred, nothing here
is translucent, nothing here has a radius.

---

## The night city

The page stands in a real city at night, drawn from that city's own
OpenStreetMap buildings and streets, in greyscale with white window lights,
and the scroll is the camera: from above the skyline down to the pavement.
It is a backdrop, never in the way of the work, and the colour it leaves for
the site's own text is the whole point.

---

## What is NOT ours to change

- The rules, the ledger, the mono labels, the four axis hues, the hard
  offset shadow, the night city.
- The copy.

---

## Allow

Machine-readable. A reviewer and the scanner both read this list; anything
named here is a choice, and stripping it makes the site generic, which is
worse than the thing it flags.

- rule eyebrow-caps src/index.css: the caps are the wayfinding layer. Every figure says what it is, in the same voice, above it.
- rule type-scale src/index.css: the sizes are a token scale on the 4px steps. The count is high because the machine layer and the display face are separate voices, not because the scale is random.
- rule accent-border-card src/index.css: the four axes are a real status colour system. Each hue IS an axis, and the axis is named in words beside it.
- rule shadow-everything src/index.css: one shadow, the hard offset, on hover. It is the pop-art signature and it never blurs.
- rule card-grid-3 src/index.css: the reading rows and the discovery columns are genuinely parallel: three readings of equal weight, three ways into the archive. The first track carries the extra width, so one still leads.
- rule default-font: the faces are Archivo for display and body, Spectral for the essay, IBM Plex Mono for the machine layer. None is on the banned list and each has a named job.
- colour #EF6A5B: coral is the signal. The refused number and the refusals.
- colour #F0B83A: yellow is the live section in the masthead and the warm state.
- colour #11364B: navy is structure. The ledger plate and the counter-field.
- colour #55B8B1: teal is information. The four axes and the sourced figures.
- colour #7FC8DD: sky is the quiet one. Credits and links on dark.
- colour #f5f5f0: the house paper. Dr Non's warm off-white, shared across the estate's design tokens; it is the ground the site stands on.
- colour #f59e0b: the house accent. One amber, in the shared tokens; this site's own accent is coral, and the amber is what the estate's other products use.
- colour #b85c28: the same house amber darkened for legibility on the light theme. It is the estate's token, not this site's choice, and it is named here so a reviewer does not take the estate's paper for a default.

## Protected voice

- marker "THE REGISTER": the register's own name, on its own plate.
- marker "NO INVENTED PRICES": the sentence the whole site is an argument for.
- marker "CATALOG PRICE": a catalogue price is not a sale price, and the difference is the point.
- marker "PHOTO UNVERIFIED": the site says when a picture is not proof of anything.
