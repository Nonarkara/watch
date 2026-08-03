import { useTheme } from '../lib/theme.ts'

/** Header toggle. Cycles auto → light → dark → auto. The icon shows the
 *  EFFECTIVE theme (the moon when dark is in effect, the sun when light).
 *  A small subscript letter shows the preference: A for auto, L for light,
 *  D for dark. The label is hidden on mobile to keep the header tight. */
export default function ThemeToggle() {
  const { pref, effective, cycle } = useTheme()
  return (
    <button
      type="button"
      className="theme-toggle mono"
      onClick={cycle}
      aria-label={`Theme: ${pref}. Click to cycle.`}
      title={`Theme: ${pref} — click to cycle`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {effective === 'dark' ? '☾' : '☀'}
      </span>
      <span className="theme-toggle-label">
        {effective === 'dark' ? 'DARK' : 'LIGHT'}
        <span className="theme-toggle-pref"> · {pref === 'auto' ? 'A' : pref === 'light' ? 'L' : 'D'}</span>
      </span>
    </button>
  )
}
