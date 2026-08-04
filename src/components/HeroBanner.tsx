// HeroBanner.tsx -- masthead block: eyebrow, title, subtitle, actions, and an
// optional meta panel (ledger / stat card) on the right.
//
// This component intentionally renders no image. It shipped twice with a
// full-bleed AI-generated pop-art collage behind a translucent colour panel
// (coral/yellow/navy/teal) -- an unlicensed image of identifiable people, and
// also the single most recognisable "AI website builder" template tell there
// is. Both times it was removed after review; see tasks/lessons.md before
// wiring an image or a second accent colour back in. House law is one
// accent colour only (--amber), no exceptions -- if a page needs a visual
// anchor, it should come from the register's own data (a stat, a number, a
// real credited photograph on its own dossier), never decorative stock art.
//
// `bg`/`alt`/`position` remain in the prop type so existing call sites don't
// need touching if a *real*, credited, rights-cleared photograph is ever
// worth adding to a specific page -- but the default, and the only thing
// this component renders today, is type on paper.

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
  /** Reserved for a real, credited photograph. Not rendered — see file header. */
  bg?: string
  hue?: HeroHue
  alt?: string
  /** Fixed top-of-page band height. Default "lg". */
  size?: 'md' | 'lg' | 'xl'
  position?: string
  eager?: boolean
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  primary?: ActionLink
  secondary?: ActionLink
  /** Optional right-side meta block (ledger, status card, etc.). */
  meta?: ReactNode
  /** Optional element rendered above the title (e.g. a logo or a number tag). */
  above?: ReactNode
  align?: 'left' | 'center'
  /** Optional credit line under the subtitle — for a cited source, not decoration. */
  credit?: string
}

export default function HeroBanner({
  hue = 'navy', size = 'lg', eyebrow, title, subtitle, primary, secondary, meta, above, align = 'left', credit,
}: HeroBannerProps) {
  return (
    <section className={`hero-banner hero-banner--${size} hero-banner--${hue} hero-banner--align-${align}`}>
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
