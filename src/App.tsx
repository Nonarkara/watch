import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { loadDataset, type Dataset } from './lib/data.ts'
import { DataContext } from './lib/dataset-context.ts'
import { CompareProvider } from './lib/compare-context.tsx'
import { SavedProvider } from './lib/saved-context.tsx'
import { useRecentlyViewed } from './lib/recently-viewed.ts'
import CompareDock from './components/CompareDock.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import SavedBadge from './components/SavedBadge.tsx'
import ThemeToggle from './components/ThemeToggle.tsx'
import TimePopMark from './components/TimePopMark.tsx'
import { SearchPalette } from './lib/SearchPalette.tsx'

// Top-bar nav. Kept short on purpose — the footer carries the rest. Seven
// items is the most that fits the masthead without scrolling on a 1280px
// viewport. About, Data, and Uncle Pom live in the footer; nothing is hidden.
const NAV = [
  { to: '/register', label: 'Objects' },
  { to: '/brands', label: 'Brands' },
  { to: '/screen', label: 'On Screen' },
  { to: '/watchmaking', label: 'Watchmaking' },
  { to: '/bible', label: 'Bible' },
  { to: '/economy', label: 'Economy' },
  { to: '/labs', label: 'Labs' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Time Pop — Watches, Stories & Screen',
  '/register': 'Object Archive — Time Pop',
  '/brands': 'Brand Directory — Time Pop',
  '/photos': 'Rolex Object Atlas — Time Pop',
  '/screen': 'Watches on Screen — Time Pop',
  '/economy': 'Attention, Supply & Price — Time Pop',
  '/labs': 'Labs — Speculative Instruments — Time Pop',
  '/data': 'Data Pipeline — Time Pop',
  '/glossary': 'Glossary — Time Pop',
  '/watchmaking': 'Watchmaking — Time Pop',
  '/bible': 'The Bible — Time Pop',
  '/about': 'About — Time Pop',
  '/discover': 'Discover a Watch — Time Pop',
  '/rehome': 'Rehome a Watch — Time Pop',
  '/compare': 'Compare References — Time Pop',
  '/signals': 'Scarcity Economics — Time Pop',
  '/patterns': 'Pattern Screen — Time Pop',
  '/starter': 'Starter Paths — Time Pop',
  '/methodology': 'Methodology — Time Pop',
  '/resources': 'Resources — The Reference Shelf — Time Pop',
  '/legal': 'Fine Print — Time Pop',
  '/paper': 'Working Paper — Time Pop',
}

export default function App() {
  const [data, setData] = useState<Dataset | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const { pathname } = useLocation()

  useEffect(() => { loadDataset().then(setData, (e) => setErr(String(e))) }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    if (!pathname.startsWith('/w/')) document.title = PAGE_TITLES[pathname] ?? PAGE_TITLES['/']
  }, [pathname])

  return (
    <DataContext.Provider value={data}>
      <CompareProvider>
      <SavedProvider>
      <SearchPalette />
      <RecentlyViewedTracker />
      <header className="hdr">
        <div className="shell hdr-in">
          <NavLink to="/" end className="wordmark" aria-label="Time Pop — home">
            <TimePopMark />
            <span className="wm-stack">
              <span className="wm-main">Time Pop</span>
              <span className="wm-sub mono">A LIVING ARCHIVE OF WATCHES</span>
              <span className="wm-tag">EST. 2005</span>
            </span>
          </NavLink>
          <div className="hdr-cluster">
            <button type="button" className="srch-btn mono" onClick={() => {
              window.dispatchEvent(new CustomEvent('timepop:open-search'))
            }} aria-label="Open search">
              <span>⌕</span><span className="srch-btn-text">SEARCH</span><span className="srch-btn-kbd">⌘K</span>
            </button>
            <SavedBadge />
            <ThemeToggle />
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => 'nav-a mono' + (isActive ? ' on' : '')}>
                {n.label.toUpperCase()}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="shell">
        {err ? (
          <p className="boot mono">DATASET FAILED TO LOAD — {err}. Time Pop refuses to render placeholder data.</p>
        ) : !data ? (
          <p className="boot mono">LOADING TIME POP…</p>
        ) : (
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        )}
      </main>
      <footer className="ftr">
        <div className="shell">
          <p className="mono micro">
            {data ? `${data.count} REFERENCES · DATA BUILT ${data.built} · METHODOLOGY V${data.methodology_version}` : ''}
          </p>
          <p className="micro dim">
            Every number on this site traces to a cited public source or is computed from cited evidence — the
            methodology page shows how, including what we refuse to estimate. No affiliation with any watch brand.
            Prices are evidence, not financial advice. A Dr Non system.
          </p>
          <p className="micro mono ftr-links">
            <NavLink to="/about">ABOUT</NavLink>
            <NavLink to="/brands">BRANDS</NavLink>
            <NavLink to="/watchmaking">WATCHMAKING</NavLink>
            <NavLink to="/bible">BIBLE</NavLink>
            <NavLink to="/pom">UNCLE POM\'S</NavLink>
            <NavLink to="/saved">MY SAVED</NavLink>
            <NavLink to="/glossary">GLOSSARY</NavLink>
            <NavLink to="/data">DATA</NavLink>
            <NavLink to="/discover">DISCOVER</NavLink>
            <NavLink to="/compare">COMPARE</NavLink>
            <NavLink to="/signals">SCARCITY</NavLink>
            <NavLink to="/starter">STARTER PATHS</NavLink>
            <NavLink to="/labs">LABS</NavLink>
            <NavLink to="/methodology">METHODOLOGY</NavLink>
            <NavLink to="/paper">WORKING PAPER</NavLink>
            <NavLink to="/resources">RESOURCES</NavLink>
            <NavLink to="/legal">FINE PRINT</NavLink>
          </p>
        </div>
      </footer>
      <CompareDock />
      </SavedProvider>
      </CompareProvider>
    </DataContext.Provider>
  )
}

/** Watches the route, updates the recently-viewed list. Renders nothing. */
function RecentlyViewedTracker() {
  useRecentlyViewed()
  return null
}
