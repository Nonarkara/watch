// HeroBanner.tsx -- full-bleed image hero with translucent text block.
//
// Design contract:
//   1. Banner image fills the full hero (object-fit: cover).
//   2. Title sits in a translucent ink-colored block on top of the image.
//      Hue picks the block color (coral/yellow/navy/teal), with the title
//      auto-flipped to white when the block is dark enough.
//   3. Eyebrow / subtitle / actions live inside the block so the image
//      provides atmosphere and the block provides the read.
//   4. Optional meta slot (right side) takes the ledger / status card
//      without inheriting the banner's saturation.
//
// Why "translucent" and not "opaque": a solid block is a slap. A
// translucent block lets the pop-art banner show through, so the
// image and the type belong to the same composition.

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type HeroHue = 'coral' | 'yellow' | 'navy' | 'teal'

interface ActionLink { to: string; label: string; variant?: 'primary' | 'secondary' }

function HeroAction({ action, kind }: { action: ActionLink; kind: 'primary' | 'secondary' }) {
  const className = `hero-banner-btn hero-banner-btn--${kind}`
  return action.to.startsWith('#')
    ? <a className={className} href={action.to}>{action.label}</a>
    : <Link className={className} to={action.to}>{action.label}</Link>
}

interface HeroBannerProps {
  bg: string
  hue?: HeroHue
  /** Optional image alt text — for accessibility. */
  alt?: string
  /** Fixed top-of-page band height. Default "lg" (540px desktop). */
  size?: 'md' | 'lg' | 'xl'
  /** Background image position (CSS object-position). Default "center". */
  position?: string
  /** Set true for the very first fold of the home page. */
  eager?: boolean
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  primary?: ActionLink
  secondary?: ActionLink
  /** Optional right-side meta block (ledger, status card, etc.). */
  meta?: ReactNode
  /** Optional element rendered above the title (eyebrow rendered separately,
   *  this slot is for things like a logo or a number tag). */
  above?: ReactNode
  /** Where to align the text block. Default "left". */
  align?: 'left' | 'center'
  /** Optional credit line under the subtitle. */
  credit?: string
}

export default function HeroBanner({
  bg, hue = 'navy', alt, size = 'lg', position = 'center', eager,
  eyebrow, title, subtitle, primary, secondary, meta, above, align = 'left', credit,
}: HeroBannerProps) {
  return (
    <section className={`hero-banner hero-banner--${size} hero-banner--${hue} hero-banner--align-${align}`}>
      <img
        className="hero-banner-bg"
        src={bg}
        alt={alt ?? ''}
        loading={eager ? 'eager' : 'lazy'}
        style={{ objectPosition: position }}
      />
      <div className="hero-banner-overlay" aria-hidden="true" />
      <div className="hero-banner-grid">
        <div className="hero-banner-copy">
          {above}
          <p className="hero-banner-eyebrow mono">{eyebrow}</p>
          <h1 className="hero-banner-title">{title}</h1>
          {subtitle && <p className="hero-banner-subtitle">{subtitle}</p>}
          {(primary || secondary) && (
            <div className="hero-banner-actions">
              {primary && (
                <HeroAction action={primary} kind="primary" />
              )}
              {secondary && (
                <HeroAction action={secondary} kind="secondary" />
              )}
            </div>
          )}
          {credit && <p className="hero-banner-credit mono">{credit}</p>}
        </div>
        {meta && <div className="hero-banner-meta">{meta}</div>}
      </div>
    </section>
  )
}
