// ArtBand — a full-bleed plate of real, licensed painting used to divide a
// page and give the eye somewhere to rest between runs of type.
//
// Why this exists, and why it is not the thing that was removed twice: the
// old hero system pasted an AI-generated collage of identifiable people
// behind a translucent colour panel, uncredited. This renders a Dutch
// vanitas painting that is verifiably out of copyright, names the artist,
// the year, the collection and the licence on the face of the band, and
// links to the Commons file. If a band cannot say where its picture came
// from, it does not render at all — see the `work` guard below.
//
// The plate is dark-grounded in BOTH themes on purpose. Every painting in
// the set is a dark-ground 17th-century oil; letting the band stay dark on
// white paper reads as a gallery plate hung on a wall rather than as a
// decorated <div>, and it gives the page a consistent rhythm instead of a
// surface that changes character with the theme toggle.
//
// House law: no border-radius, no box-shadow, one accent hue at a time. The
// only gradient is the dark-to-transparent scrim, which exists solely so the
// type stays legible over the picture (§11.10 contrast).

import { artById } from '../lib/art-timepieces.ts'

type Tint = 'coral' | 'yellow' | 'navy' | 'teal'

interface ArtBandProps {
  /** id from ART_WORKS. Unknown id renders nothing rather than a broken frame. */
  id: string
  /** Mono kicker, upper-left. */
  eyebrow?: string
  /** One line of display type. Keep it to a single thought. */
  line?: string
  /** Hue for the top rule. One at a time — never two on one page fold. */
  tint?: Tint
  /** sm ≈ a rule with a picture in it; md is the default; lg is a full stop. */
  height?: 'sm' | 'md' | 'lg'
  /** Show the artwork's own caption under the line. Off by default. */
  showCaption?: boolean
}

export default function ArtBand({
  id,
  eyebrow,
  line,
  tint = 'coral',
  height = 'md',
  showCaption = false,
}: ArtBandProps) {
  const work = artById(id)
  if (!work) return null

  return (
    <div className={`art-band-stage art-band--${height} art-band--${tint}`}>
      <img
        className="art-band-img"
        src={work.local}
        alt={work.caption}
        style={{ objectPosition: work.focus }}
        loading="lazy" decoding="async"
        width={work.width}
        height={work.height}
      />
      <div className="art-band-scrim" aria-hidden="true" />

      <aside
        className="art-band"
        aria-label={`${work.artwork} by ${work.artist}, ${work.year}`}
      >
      <div className="art-band-body">
        {eyebrow && <p className="art-band-eyebrow mono">{eyebrow}</p>}
        {line && <p className="art-band-line">{line}</p>}
        {showCaption && <p className="art-band-caption">{work.caption}</p>}
      </div>

      <a
        className="art-band-credit mono"
        href={work.source_url}
        target="_blank"
        rel="noreferrer"
      >
        {work.artist.toUpperCase()} · {work.artwork.toUpperCase()}, {work.year.toUpperCase()} ·{' '}
        {work.collection.toUpperCase()} · {work.license.toUpperCase()} ↗
      </a>
      </aside>
    </div>
  )
}

/** Portrait/object works shown in a grid rather than as a full-bleed band. */
export function ArtPlate({ id }: { id: string }) {
  const work = artById(id)
  if (!work) return null

  return (
    <figure className="art-plate">
      <a className="art-plate-media" href={work.source_url} target="_blank" rel="noreferrer">
        <img
          src={work.local}
          alt={work.caption}
          loading="lazy" decoding="async"
          width={work.width}
          height={work.height}
        />
      </a>
      <figcaption className="art-plate-cap">
        <p className="art-plate-title">
          <strong>{work.artist}</strong>, <em>{work.artwork}</em>, {work.year}
        </p>
        <p className="art-plate-body">{work.caption}</p>
        <p className="art-plate-credit mono micro dim">
          {work.collection.toUpperCase()} · {work.license.toUpperCase()} ·{' '}
          <a href={work.source_url} target="_blank" rel="noreferrer">
            COMMONS ↗
          </a>
        </p>
      </figcaption>
    </figure>
  )
}
