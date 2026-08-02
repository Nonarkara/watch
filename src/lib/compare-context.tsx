import { useCallback, useEffect, useMemo, useState } from 'react'
import { COMPARE_MAX } from './compare-config.ts'
import { CompareContext, type CompareApi } from './compare-store.ts'

const KEY = 'watch.compare'

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

  return <CompareContext.Provider value={api}>{children}</CompareContext.Provider>
}
