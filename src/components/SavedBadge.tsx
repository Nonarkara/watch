import { NavLink } from 'react-router-dom'
import { useSaved } from '../lib/saved-store.ts'

/** Header pill that shows the saved-watchlist count. Sits between the search
 *  button and the nav. When empty, hidden — don't promise a feature the user
 *  hasn't used. */
export default function SavedBadge() {
  const { count } = useSaved()
  if (count === 0) return null
  return (
    <NavLink to="/saved" className="saved-badge mono" aria-label={`Saved watches: ${count}`}>
      <span>★</span>
      <span>{count}</span>
    </NavLink>
  )
}
