import { useCallback, useEffect, useMemo, useState } from 'react'
import { SavedContext, type SavedApi } from './saved-store.ts'

const KEY = 'watch.saved'
const MAX = 200 // generous — most collectors will save a few dozen, not 200

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      return Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.length > 0))].slice(0, MAX) : []
    } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* private mode */ } }, [ids])

  const add = useCallback((id: string) => {
    setIds((cur) => cur.includes(id) || cur.length >= MAX ? cur : [...cur, id])
  }, [])
  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), [])
  const toggle = useCallback((id: string) => {
    setIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX ? cur : [...cur, id])
  }, [])
  const clear = useCallback(() => setIds([]), [])

  const api = useMemo<SavedApi>(() => ({
    ids, has: (id) => ids.includes(id), add, remove, toggle, clear, count: ids.length,
  }), [ids, add, remove, toggle, clear])

  return <SavedContext.Provider value={api}>{children}</SavedContext.Provider>
}
