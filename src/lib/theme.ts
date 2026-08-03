import { useEffect, useState, useCallback } from 'react'

/** Theme is a 3-state machine: explicit 'light', explicit 'dark', or 'auto'
 *  (follows system pref). The toggle button in the header cycles
 *  auto → light → dark → auto. The 'auto' state shows the system preference
 *  and updates live when the OS changes its mind. The visible label on the
 *  toggle reflects the EFFECTIVE theme (light/dark), not the preference. */

export type ThemePref = 'auto' | 'light' | 'dark'
export type EffectiveTheme = 'light' | 'dark'

const KEY = 'watch.theme'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'auto') return v
  } catch { /* private mode */ }
  return 'auto'
}

function writePref(p: ThemePref) {
  try { localStorage.setItem(KEY, p) } catch { /* private mode */ }
}

function readSystem(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyToDom(eff: EffectiveTheme) {
  const root = document.documentElement
  if (eff === 'dark') root.setAttribute('data-theme', 'dark')
  else root.setAttribute('data-theme', 'light')
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref)
  const [system, setSystem] = useState<EffectiveTheme>(readSystem)

  // Track OS preference changes (only matters when pref === 'auto')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const effective: EffectiveTheme = pref === 'auto' ? system : pref

  // Apply to DOM whenever effective changes
  useEffect(() => { applyToDom(effective) }, [effective])

  const cycle = useCallback(() => {
    setPref((cur) => {
      const next: ThemePref = cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto'
      writePref(next)
      return next
    })
  }, [])

  const setExplicit = useCallback((p: ThemePref) => {
    setPref(p)
    writePref(p)
  }, [])

  return { pref, effective, cycle, set: setExplicit }
}
