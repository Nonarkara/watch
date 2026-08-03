import { createContext, useContext } from 'react'

/** Personal watchlist. localStorage-backed, no auth. The "I want to come back
 *  to this" gesture — what every collector does on paper, now in the browser.
 *  Like the compare store, this lives across sessions on the same device. */

export interface SavedApi {
  ids: string[]
  has: (id: string) => boolean
  toggle: (id: string) => void
  add: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  count: number
}

export const SavedContext = createContext<SavedApi | null>(null)

export function useSaved(): SavedApi {
  const value = useContext(SavedContext)
  if (!value) throw new Error('useSaved outside provider')
  return value
}
