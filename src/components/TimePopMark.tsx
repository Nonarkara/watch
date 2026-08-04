/** Header monogram — ink line cut, one coral tip. No raster plate. */
export default function TimePopMark({ className = 'wm-logo' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width={44}
      height={44}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* T crossbar + stem */}
      <rect x="14" y="16" width="24" height="5" fill="currentColor" />
      <rect x="26" y="16" width="6" height="32" fill="currentColor" />
      {/* P outer */}
      <path d="M32 22h10c6.6 0 12 5.4 12 12s-5.4 12-12 12H32V22z" fill="currentColor" />
      {/* P counter (punches hole with bg via destination — use inset rect of paper) */}
      <path d="M38 28h4c3.3 0 6 2.7 6 6s-2.7 6-6 6h-4V28z" fill="var(--bg, #0A0A0A)" />
      {/* hand */}
      <line x1="32" y1="32" x2="45" y2="19" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="47" cy="17" r="3.5" fill="var(--amber, #EF6A5B)" />
    </svg>
  )
}
