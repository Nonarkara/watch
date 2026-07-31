import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { loadDataset, type Dataset } from './lib/data.ts'
import { DataContext } from './lib/dataset-context.ts'
import { CompareProvider } from './lib/compare-context.tsx'
import CompareDock from './components/CompareDock.tsx'

const NAV = [
  { to: '/register', label: 'Objects' },
  { to: '/photos', label: 'Rolex atlas' },
  { to: '/screen', label: 'On screen' },
  { to: '/economy', label: 'Economy' },
  { to: '/rehome', label: 'Rehome' },
  { to: '/compare', label: 'Compare' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'The Watch Register — Objects, Stories & Scarcity',
  '/register': 'Watch Reference Register — The Watch Register',
  '/photos': 'Rolex Object Atlas — The Watch Register',
  '/screen': 'Rolex On Screen — The Watch Register',
  '/economy': 'Attention, Supply & Price — The Watch Register',
  '/discover': 'Discover a Watch — The Watch Register',
  '/rehome': 'Rehome a Watch Responsibly — The Watch Register',
  '/compare': 'Compare Watch References — The Watch Register',
  '/signals': 'Scarcity Economics — The Watch Register',
  '/patterns': 'Pattern Screen — The Watch Register',
  '/starter': 'Starter Paths — The Watch Register',
  '/methodology': 'Methodology — The Watch Register',
  '/paper': 'Working Paper — The Watch Register',
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
      <header className="hdr">
        <div className="shell hdr-in">
          <NavLink to="/" className="wordmark">
            <span className="wm-main">THE WATCH REGISTER</span>
            <span className="wm-sub mono">OBJECTS · STORIES · MARKET SIGNALS · WATCH.NONARKARA.ORG</span>
          </NavLink>
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
          <p className="boot mono">DATASET FAILED TO LOAD — {err}. The register refuses to render placeholder data.</p>
        ) : !data ? (
          <p className="boot mono">LOADING REGISTER…</p>
        ) : (
          <Outlet />
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
            <NavLink to="/discover">DISCOVER</NavLink>
            <NavLink to="/compare">COMPARE</NavLink>
            <NavLink to="/signals">SCARCITY</NavLink>
            <NavLink to="/starter">STARTER PATHS</NavLink>
            <NavLink to="/methodology">METHODOLOGY</NavLink>
            <NavLink to="/paper">WORKING PAPER</NavLink>
          </p>
        </div>
      </footer>
      <CompareDock />
      </CompareProvider>
    </DataContext.Provider>
  )
}
