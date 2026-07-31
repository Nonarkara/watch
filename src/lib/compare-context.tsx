import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'watch.compare'
export const COMPARE_MAX = 4

interface CompareApi {
  ids: string[]
  has: (id: string) => boolean
  add: (id: string) => void
  remove: (id: string) => void
  toggle: (id: string) => void
  clear: () => void
  full: boolean
}

const Ctx = createContext<CompareApi | null>(null)
export const useCompare = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCompare outside provider')
  return v
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]').slice(0, COMPARE_MAX) } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* private mode */ } }, [ids])

  const add = useCallback((id: string) => {
    setIds((cur) => (cur.includes(id) || cur.length >= COMPARE_MAX ? cur : [...cur, id]))
  }, [])
  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), [])
  const toggle = useCallback((id: string) => {
    setIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= COMPARE_MAX ? cur : [...cur, id])
  }, [])
  const clear = useCallback(() => setIds([]), [])

  const api = useMemo<CompareApi>(() => ({
    ids, has: (id) => ids.includes(id), add, remove, toggle, clear, full: ids.length >= COMPARE_MAX,
  }), [ids, add, remove, toggle, clear])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
