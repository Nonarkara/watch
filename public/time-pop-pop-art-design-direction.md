# Time Pop — Pop-Art Design Direction

## Purpose

This document redirects the existing Time Pop interface toward the visual language established by the new watch banners.

The goal is **not** to rebuild the product from scratch. Keep the current information architecture, flows, data model, and working components. Apply a coherent pop-art layer over the system so that the marketplace feels distinctive, collectible, optimistic, and premium.

Time Pop serves two equally important groups:

- collectors looking for their next watch
- sellers looking for the right new home for a watch

The interface should therefore feel less like a generic e-commerce store and more like a **curated living archive of watches**.

---

## 1. Core Design Idea

Time Pop should feel like:

> A contemporary collector’s marketplace presented through refined pop art.

The design should combine:

- editorial watch photography
- modernist grid discipline
- screen-print textures
- halftone patterns
- cut-paper geometry
- warm off-white space
- selective bursts of coral, yellow, cyan, teal, and navy
- crisp product information
- restrained motion
- strong light and dark modes

The interface must remain easy to scan, easy to trust, and easy to transact through.

Pop art is the **tonality**, not an excuse for visual noise.

---

## 2. Strategic Principles

### 2.1 Product first

The watches remain the most important visual objects.

Do not let decorative graphics compete with:

- watch photography
- model names
- price
- condition
- seller credibility
- provenance
- authentication status
- transaction actions

### 2.2 Editorial, not cartoonish

Use pop-art techniques with restraint:

- halftone
- offset color
- paper grain
- geometric blocks
- poster-like crops
- limited color fields

Avoid:

- comic speech bubbles
- exaggerated novelty typography
- random stickers
- fake vintage clutter
- loud gradients
- decorative noise behind every component

### 2.3 Marketplace clarity

The system must still feel dependable.

Every important transaction state should remain plain:

- available
- reserved
- sold
- under review
- authenticated
- seller verified
- offer received
- payment pending
- shipped
- delivered

Do not encode essential status through color alone.

### 2.4 Character through composition

Most of the personality should come from:

- asymmetrical layouts
- deliberate negative space
- varied image scale
- overlapping color fields
- strong cropping
- poster-like framing
- alternating quiet and energetic sections

### 2.5 One visual accent at a time

Within any viewport, choose one dominant pop-art gesture:

- a coral block
- a halftone field
- a teal circle
- a yellow paper strip
- a large watch crop

Do not use all of them at once.

---

## 3. Visual Identity

## 3.1 Mood

The visual mood should be:

- optimistic
- cultured
- collectible
- tactile
- slightly nostalgic
- modern
- intelligent
- playful without becoming childish
- premium without becoming cold

## 3.2 Reference balance

Target this balance:

- 50% editorial marketplace
- 25% modernist exhibition catalogue
- 15% pop-art screen print
- 10% vintage watch ephemera

The product must still feel current.

---

## 4. Color System

The palette should work across both light and dark modes.

### 4.1 Core palette

| Token | Light mode | Dark mode | Use |
|---|---:|---:|---|
| `--canvas` | `#F6F0E5` | `#11161A` | Main page background |
| `--surface` | `#FFFDF8` | `#182026` | Cards, panels, sheets |
| `--surface-raised` | `#FFFFFF` | `#202A31` | Modals, hover panels |
| `--ink` | `#132A3A` | `#F5F0E8` | Primary text |
| `--ink-muted` | `#61717A` | `#AAB5BA` | Secondary text |
| `--line` | `#D8CFC1` | `#344048` | Borders and dividers |
| `--navy` | `#11364B` | `#6BB7D0` | Structural accent |
| `--coral` | `#EF6A5B` | `#F17B6E` | Primary expressive accent |
| `--yellow` | `#F0B83A` | `#E9B94A` | Highlight and emphasis |
| `--teal` | `#55B8B1` | `#64C7BE` | Secondary accent |
| `--sky` | `#7FC8DD` | `#78BED3` | Soft accent |
| `--peach` | `#F1B08E` | `#D99477` | Warm surface accent |
| `--green` | `#708F76` | `#86A990` | Positive state |
| `--danger` | `#B9473F` | `#E16B61` | Error and destructive state |

### 4.2 Color rules

- Use warm off-white instead of pure white for large areas.
- Use deep navy instead of pure black in light mode.
- In dark mode, use charcoal-blue surfaces rather than neutral black.
- Coral is the main expressive accent.
- Yellow should appear sparingly.
- Teal and sky blue balance warmth.
- Product photography should retain natural color.
- Never tint every watch image.

### 4.3 Dark-mode translation

Dark mode should not simply invert the light theme.

Instead:

- retain paper-like texture at low opacity
- use charcoal-blue backgrounds
- soften halftone patterns
- preserve warm highlights
- use cream text instead of pure white
- reduce saturated color area by roughly 20%
- increase border visibility
- keep watch photography bright and neutral

---

## 5. Typography

## 5.1 Direction

Use a clean grotesk or neo-grotesk family for the product UI.

Recommended structure:

- primary sans: `Inter`, `Suisse Int’l`, `Neue Haas Grotesk`, or `Helvetica Now`
- optional display accent: a condensed grotesk or bold geometric sans
- numeric treatment: tabular figures for price, dimensions, year, and reference numbers

### 5.2 Type hierarchy

| Role | Treatment |
|---|---|
| Hero headline | 48–80 px, 700–800 weight, compact line-height |
| Section headline | 28–44 px, 700 weight |
| Card title | 16–20 px, 600–700 weight |
| Product metadata | 13–15 px, 450–550 weight |
| Labels | 11–13 px, uppercase, tracked |
| Price | 18–28 px, 650–750 weight, tabular numerals |

### 5.3 Typography rules

- Keep headlines short.
- Avoid ornamental fonts.
- Avoid fake hand-lettering.
- Use uppercase only for compact labels.
- Use sentence case for actions.
- Use strong typographic contrast instead of decorative outlines.
- Never apply halftone texture to body text.
- Never use more than two font families.

---

## 6. Texture and Graphic Language

## 6.1 Allowed textures

Use:

- subtle paper grain
- halftone dots
- screen-print misregistration
- dry-brush edges
- torn-paper blocks
- muted ink splatter
- offset rectangles
- circles and semicircles
- archival catalogue marks
- large cropped watch details

## 6.2 Texture limits

- Texture should remain below 8% opacity on standard surfaces.
- Halftone should sit behind content, not through it.
- Avoid texture directly beneath small text.
- Use one dominant texture treatment per section.
- Keep forms crisp even when backgrounds are tactile.

## 6.3 Graphic motifs

Preferred motifs:

- offset rectangular panels
- circular dial forms
- radial index marks
- horizontal paper strips
- large cropped bezels
- bracelet-link patterns
- subtle serial-number grids
- auction-tag geometry
- watch-box compartment grids

Avoid:

- random starbursts
- meme stickers
- comic sound effects
- speech bubbles
- fake newspaper clippings
- overly distressed type
- neon cyberpunk effects

---

## 7. Layout System

## 7.1 Grid

Use a 12-column desktop grid.

Suggested values:

```css
--page-max: 1440px;
--gutter-desktop: 32px;
--gutter-tablet: 24px;
--gutter-mobile: 16px;
--section-space-desktop: 112px;
--section-space-mobile: 64px;
```

### 7.2 Composition

Alternate between:

- quiet sections with generous negative space
- dense product mosaics
- large editorial image moments
- clean transactional modules

The system should breathe.

### 7.3 Asymmetry

Use asymmetry mainly in:

- hero sections
- editorial collections
- promotional panels
- seller stories
- featured lots

Keep transactional layouts stable and predictable:

- checkout
- offer flow
- listing form
- authentication
- account settings
- order tracking

---

## 8. Hero System

The hero should carry the strongest pop-art treatment.

### 8.1 Structure

Recommended desktop composition:

- 40–50% copy area
- 50–60% artwork
- 16:9 or wider image
- artwork anchored to one side
- clear contrast behind copy
- one primary CTA
- one secondary CTA

### 8.2 Hero copy behavior

Keep hero text outside the image whenever possible.

Suggested content pattern:

```text
Headline
One short explanatory line
[Browse watches] [Sell a watch]
Trust or supply signal
```

### 8.3 Hero image treatment

The banner may contain:

- 8–14 watch archetypes
- one or two dominant watches
- smaller supporting pieces
- editorial color blocks
- halftone and paper textures
- a clean copy zone
- no embedded interface text
- no fake brand names
- no essential information baked into the image

### 8.4 Responsive handling

On mobile:

- move text above the image
- crop around the strongest 2–4 watches
- do not shrink the entire desktop banner into illegibility
- preserve one graphic accent
- remove secondary decorative details

---

## 9. Watch Listing Cards

## 9.1 Card anatomy

Each card should support:

- main image
- brand
- model
- reference
- year
- condition
- price
- location
- authentication status
- seller status
- favorite action
- offer or inquiry state

### 9.2 Card styling

Default card:

- quiet surface
- 1 px border
- 16–20 px radius
- image area with a pale tonal field
- little or no shadow
- strong information hierarchy

On hover:

- slight lift
- border darkens
- one color block appears behind part of the image
- image scales no more than 1.02
- optional halftone patch appears at low opacity

### 9.3 Pop-art card variants

Use special treatment only for selected cards:

- featured
- editor’s pick
- newly listed
- rare reference
- staff collection
- auction ending soon

Do not decorate every card.

### 9.4 Product image rules

- Use clean, neutral product imagery.
- Preserve accurate case and dial color.
- Avoid aggressive color filters.
- Background removal is acceptable for curated features.
- Standard marketplace cards should retain seller-uploaded context where useful.
- Always provide an uncropped full-watch view in the gallery.

---

## 10. Product Detail Page

The product page should feel like a collector dossier.

### 10.1 Upper section

Use:

- large image gallery
- sticky purchase panel
- price and offer actions
- authentication badge
- seller identity
- condition summary
- shipping and return summary

### 10.2 Editorial layer

Add controlled pop-art touches:

- a color strip behind the title block
- halftone near the image edge
- large reference number in pale type
- circular dial motif behind specs
- one contrasting accent panel for provenance

### 10.3 Information sections

Recommended order:

1. Overview
2. Condition
3. Authentication
4. Specifications
5. Provenance
6. Seller notes
7. Delivery and returns
8. Similar watches

### 10.4 Provenance presentation

Treat provenance like an exhibition caption:

- concise
- factual
- dated
- clearly sourced
- visually separate from seller description

---

## 11. Search and Discovery

Search should feel fast and serious.

### 11.1 Filters

Keep filters plain and functional.

Use:

- structured chips
- checkboxes
- segmented controls
- range sliders
- searchable selectors

Avoid overly decorative filter panels.

### 11.2 Results pages

Add character through:

- section headers
- editorial collection cards
- occasional full-width feature rows
- large watch close-ups
- color blocks behind category labels

### 11.3 Category landing pages

Each category may have one visual signature:

- dive: navy + sky
- dress: champagne + peach
- chronograph: coral + black
- field: sage + cream
- digital: silver + cyan
- vintage: ochre + warm paper
- independent: teal + yellow

These are accents, not strict brand colors.

---

## 12. Seller Experience

The seller workflow should feel reassuring and efficient.

### 12.1 Listing form

Use a calm two-column layout:

- main form
- live listing preview

### 12.2 Progress

Present the listing process as a clear sequence:

1. Identity
2. Watch details
3. Photos
4. Condition
5. Price
6. Authentication
7. Shipping
8. Review

Use restrained color and one strong progress indicator.

### 12.3 Live preview

The preview may use pop-art framing so the seller sees how the listing could appear in the marketplace.

Do not decorate the form fields themselves heavily.

### 12.4 Seller dashboard

Use:

- neutral analytics surfaces
- strong tabular data
- clear offer states
- subtle pop-art headers
- color-coded but text-labeled statuses

---

## 13. Trust and Authentication

Trust is central.

### 13.1 Visual language

Authentication should feel like archival verification, not crypto or banking.

Use:

- seal-like circular marks
- clean certificates
- serial-number typography
- neutral navy and cream
- one accent color
- precise line work

Avoid:

- shields everywhere
- glowing badges
- fake metallic effects
- green-only trust language

### 13.2 Trust badges

Badges must include text:

- Identity verified
- Watch authenticated
- Escrow protected
- Insured shipping
- Return eligible

---

## 14. Buttons and Controls

## 14.1 Primary button

```css
background: var(--ink);
color: var(--canvas);
border-radius: 999px;
padding: 12px 20px;
font-weight: 650;
```

Light mode hover:

```css
background: var(--coral);
color: #11161A;
```

Dark mode hover:

```css
background: var(--yellow);
color: #11161A;
```

## 14.2 Secondary button

- transparent background
- 1 px border
- ink text
- subtle surface fill on hover

## 14.3 Accent button

Reserve accent buttons for:

- make an offer
- list a watch
- auction urgency
- editorial campaign

Do not use accent color for every action.

---

## 15. Navigation

The navigation should remain calm.

### Desktop

- warm neutral surface
- compact logo
- primary categories
- search
- sell action
- saved items
- account

### Mobile

- bottom or compact top navigation
- persistent search access
- clear sell action
- no decorative clutter

A small halftone or color strip may appear in the active state, but navigation must remain legible.

---

## 16. Iconography

Use simple line icons.

Rules:

- 1.5–2 px stroke
- rounded joins
- no cartoon styling
- no multicolor icons in standard UI
- accent color only for active or highlighted state
- watch-specific icons may reference crowns, bezels, bracelets, loupes, boxes, and certification seals

---

## 17. Motion

Motion should feel mechanical and tactile.

Use:

- short 160–240 ms transitions
- smooth image reveal
- sliding paper panels
- subtle halftone fades
- restrained scale changes
- dial-like rotation only in loading or special moments

Avoid:

- continuous floating
- parallax on every section
- bouncy spring motion
- spinning watches
- overly cinematic transitions
- motion that slows buying or selling

Respect `prefers-reduced-motion`.

---

## 18. Photography and Image Treatment

### 18.1 Standard product photography

- accurate color
- clear dial
- honest condition
- multiple angles
- visible clasp and caseback
- neutral lighting
- no heavy filter

### 18.2 Editorial imagery

For campaigns and category banners:

- stronger cropping
- selective posterization
- halftone overlays
- geometric framing
- mixed scales
- paper texture
- controlled color blocking

### 18.3 Seller photos

Do not force seller photos into pop-art filters.

Instead, place them inside a consistent frame:

- warm neutral mat
- clear border
- subtle caption
- optional color tab
- authentication overlay kept separate

---

## 19. Component Styling Rules

### Cards

- border before shadow
- rounded but not overly soft
- controlled texture
- single accent

### Modals

- clean surfaces
- no decorative collage
- strong heading
- one accent strip or corner block

### Forms

- quiet backgrounds
- strong focus rings
- clear labels
- generous spacing
- no texture behind input text

### Tables

- neutral and precise
- tabular numerals
- accent only on important state
- optional pale paper texture in header

### Empty states

Use a simple illustration:

- watch box
- empty display plinth
- lone watch silhouette
- collector’s tray

Avoid childish characters.

### Notifications

- plain surface
- clear icon
- text label
- accent bar
- no excessive animation

---

## 20. Accessibility

The aesthetic must not weaken usability.

Requirements:

- WCAG AA contrast for body text
- 3:1 minimum for large text and controls
- visible keyboard focus
- minimum 44 × 44 px tap targets
- text labels for color-coded states
- reduced-motion support
- alt text for all editorial images
- product image zoom usable by keyboard
- no essential text embedded in banners
- dark-mode testing under real device brightness

---

## 21. Responsive Rules

### Desktop

- use asymmetry
- preserve negative space
- allow large editorial crops
- show full metadata

### Tablet

- reduce decorative geometry
- stack hero copy and image if needed
- use two- or three-column cards

### Mobile

- prioritize product image, title, price, and trust
- one-column cards or compact two-column browse
- suppress non-essential texture
- reduce halftone density
- keep fixed actions clear
- avoid edge-to-edge decorative clutter

---

## 22. Design Tokens

```css
:root {
  --canvas: #F6F0E5;
  --surface: #FFFDF8;
  --surface-raised: #FFFFFF;

  --ink: #132A3A;
  --ink-muted: #61717A;
  --line: #D8CFC1;

  --navy: #11364B;
  --coral: #EF6A5B;
  --yellow: #F0B83A;
  --teal: #55B8B1;
  --sky: #7FC8DD;
  --peach: #F1B08E;
  --green: #708F76;
  --danger: #B9473F;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 999px;

  --shadow-soft: 0 14px 40px rgba(19, 42, 58, 0.08);
  --shadow-hover: 0 18px 52px rgba(19, 42, 58, 0.14);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
}

[data-theme="dark"] {
  --canvas: #11161A;
  --surface: #182026;
  --surface-raised: #202A31;

  --ink: #F5F0E8;
  --ink-muted: #AAB5BA;
  --line: #344048;

  --navy: #6BB7D0;
  --coral: #F17B6E;
  --yellow: #E9B94A;
  --teal: #64C7BE;
  --sky: #78BED3;
  --peach: #D99477;
  --green: #86A990;
  --danger: #E16B61;

  --shadow-soft: 0 14px 40px rgba(0, 0, 0, 0.22);
  --shadow-hover: 0 18px 52px rgba(0, 0, 0, 0.34);
}
```

---

## 23. Suggested CSS Treatments

### Halftone field

```css
.pop-halftone {
  background-image:
    radial-gradient(circle, currentColor 1px, transparent 1.3px);
  background-size: 10px 10px;
  opacity: 0.08;
}
```

### Paper grain

```css
.paper-surface {
  position: relative;
}

.paper-surface::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  mix-blend-mode: multiply;
  background-image: url("/textures/paper-grain.webp");
}
```

### Offset pop panel

```css
.pop-panel {
  position: relative;
  isolation: isolate;
}

.pop-panel::before {
  content: "";
  position: absolute;
  inset: 10px -10px -10px 10px;
  background: var(--coral);
  border-radius: inherit;
  z-index: -1;
  opacity: 0.88;
}
```

Use offset panels only for editorial and featured content.

---

## 24. Page-by-Page Redirection

### Home

- large pop-art hero
- clear buy and sell actions
- featured watches on quiet cards
- category strip with color-coded art direction
- collector stories
- seller reassurance
- authentication explanation
- latest listings
- restrained editorial footer

### Browse

- clean filter system
- standard card grid
- occasional editorial feature row
- category-specific accent

### Watch detail

- dossier-like layout
- large photography
- strong provenance
- clear transaction panel
- one controlled pop-art graphic layer

### Sell

- calm step-by-step form
- live preview
- reassuring trust language
- restrained graphic framing

### Seller profile

- gallery feel
- clean reputation signals
- inventory shown as a curated collection
- optional editorial header treatment

### Saved items

- minimal
- no decorative clutter
- strong sorting and notes
- gentle accent treatment

### Messages and offers

- transactional and plain
- neutral surfaces
- color only for state
- no collage background

### Checkout

- near-zero decorative texture
- trust, clarity, and completion first

---

## 25. Migration Plan

Do not redesign everything at once.

### Phase 1 — Foundation

1. Add color tokens.
2. Add light and dark themes.
3. Update typography.
4. Update page background and surfaces.
5. Normalize borders, radii, and shadows.

### Phase 2 — Signature moments

1. Replace the home hero.
2. Redesign category headers.
3. Add editorial collection modules.
4. Add featured-card variants.
5. Introduce halftone and paper textures.

### Phase 3 — Marketplace components

1. Update listing cards.
2. Update product-detail layout.
3. Update seller profiles.
4. Update search and filter surfaces.
5. Update trust and authentication badges.

### Phase 4 — Transactional refinement

1. Simplify checkout.
2. Improve listing workflow.
3. Improve offers and messages.
4. Add accessibility review.
5. Add reduced-motion behavior.

### Phase 5 — Quality control

1. Test light and dark modes.
2. Test mobile crops.
3. Test long titles and prices.
4. Test low-quality seller imagery.
5. Check contrast and focus.
6. Remove decorative overuse.
7. Verify performance.

---

## 26. Performance Rules

The visual system should not slow the marketplace.

- Prefer CSS patterns over image textures when possible.
- Use WebP or AVIF.
- Lazy-load editorial imagery below the fold.
- Avoid giant transparent PNG overlays.
- Keep texture assets below 100 KB where possible.
- Serve responsive hero crops.
- Do not animate large background images.
- Avoid multiple blend modes on long scrolling pages.
- Preserve Core Web Vitals.

---

## 27. Do and Do Not

### Do

- use warm negative space
- use one expressive color move per section
- make watches the heroes
- keep information precise
- treat provenance seriously
- mix quiet layouts with energetic editorial moments
- preserve accurate product imagery
- keep dark mode warm and legible
- use texture as atmosphere
- let the marketplace feel curated

### Do not

- turn every component into pop art
- place halftone behind small text
- tint product photographs heavily
- use loud gradients everywhere
- make checkout decorative
- use fake luxury clichés
- overuse gold
- use cartoon bubbles or comic captions
- bury price or seller information
- sacrifice trust for visual novelty

---

## 28. Acceptance Criteria

The redesign is successful when:

- the site feels recognizably related to the new banners
- the marketplace remains easy to understand within seconds
- the same system works in light and dark modes
- product images remain accurate
- the UI feels premium but not sterile
- sellers can list without distraction
- collectors can compare watches quickly
- trust states are obvious
- editorial sections feel rich
- transactional sections feel calm
- no page feels like a generic template
- no page feels visually exhausting

---

## 29. Instruction for AI Coding Tools

Use the following instruction when applying this system to an existing codebase:

> Preserve all current functionality, routing, data structures, and interaction logic. Do not rebuild the application. Refactor the visual layer so the system follows the Time Pop pop-art design direction in this document. Start by introducing design tokens, theme variables, typography, spacing, surfaces, and shared component states. Then update high-impact areas: hero, category headers, listing cards, watch-detail pages, seller profiles, and trust modules. Keep forms, checkout, messages, and account functions visually restrained. Use warm negative space, halftone patterns, paper textures, geometric color fields, and editorial watch crops selectively. Support both light and dark modes. Maintain WCAG AA contrast, keyboard navigation, responsive behavior, and image performance. Do not introduce decorative elements that reduce marketplace clarity.

---

## 30. Final Design Test

Before accepting any page, ask:

1. Is the watch still the main object?
2. Can the user understand the page in five seconds?
3. Is there enough quiet space?
4. Is the pop-art layer selective rather than constant?
5. Does the page work in both light and dark modes?
6. Are trust and transaction states obvious?
7. Does the page feel like Time Pop rather than a generic watch store?

If the answer to any is no, simplify.
