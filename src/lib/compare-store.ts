import { createContext, useContext } from 'react'

export interface CompareApi {
  ids: string[]
  has: (id: string) => boolean
  add: (id: string) => void
  remove: (id: string) => void
  toggle: (id: string) => void
  clear: () => void
  full: boolean
}

export const CompareContext = createContext<CompareApi | null>(null)

export function useCompare(): CompareApi {
  const value = useContext(CompareContext)
  if (!value) throw new Error('useCompare outside provider')
  return value
}
