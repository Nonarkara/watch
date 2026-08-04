// Cite — a small footnote marker on any published number. Hover or focus
// reveals a popover with the source. The system promise of the site is
// "every number traces to a cited public source" — Cite is the visible
// side of that promise. Used in the Dossier 5-second verdict, the Top4
// tiles, and the metric strip.
//
// Cite is not a tooltip library — it is a single static popover. Mouse-over
// or keyboard focus shows the source below the number. Works without JS.

import { type ReactNode } from 'react'

interface CiteProps {
  /** Short label for the cited source. e.g. "5-signal Scarcity Index" */
  source: string
  /** Optional 1-line detail. e.g. "1 of 5 signals: discontinued, limited, supply, listings, waitlist" */
  detail?: string
  /** Optional URL to the methodology page anchor. */
  href?: string
  /** The number / label to annotate. */
  children: ReactNode
}

export default function Cite({ source, detail, href, children }: CiteProps) {
  return (
    <span className="cite">
      <span className="cite-value">{children}</span>
      <span className="cite-marker" aria-hidden="true">†</span>
      <span className="cite-source" role="tooltip">
        <span className="cite-source-eyebrow mono">SOURCE</span>
        <span className="cite-source-name">{source}</span>
        {detail && <span className="cite-source-detail">{detail}</span>}
        {href && <a className="cite-source-link mono" href={href}>HOW THIS IS COMPUTED →</a>}
      </span>
    </span>
  )
}
