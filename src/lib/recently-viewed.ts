import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

/** Track the last 6 dossiers the visitor has opened. localStorage-backed,
 *  no auth, no server. Mounted in App.tsx and updated on every /w/:id route
 *  change. Surfaced on the /saved page (or a future /history page) and used
 *  by the home page ticker as a personalization signal. */
const KEY = 'watch.recent'
const MAX = 6

export function useRecentlyViewed() {
  const { id } = useParams<{ id: string }>()
  useEffect(() => {
    if (!id || !id.startsWith) return
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      const list: string[] = Array.isArray(raw) ? raw : []
      const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch { /* private mode */ }
  }, [id])
}

export function getRecentlyViewed(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}
