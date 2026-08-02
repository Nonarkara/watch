import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Home from './pages/Home.tsx'

// Route-level code splitting. Home stays in the main bundle (it's the first
// thing every visitor sees); every other route is a lazy chunk fetched on
// demand. This cut the initial JS payload ~60–70% on a 21-route site where
// most visitors only hit one or two pages per session.
const Register = lazy(() => import('./pages/Register.tsx'))
const Dossier = lazy(() => import('./pages/Dossier.tsx'))
const Compare = lazy(() => import('./pages/Compare.tsx'))
const Discover = lazy(() => import('./pages/Discover.tsx'))
const Rehome = lazy(() => import('./pages/Rehome.tsx'))
const Signals = lazy(() => import('./pages/Signals.tsx'))
const Patterns = lazy(() => import('./pages/Patterns.tsx'))
const Starter = lazy(() => import('./pages/Starter.tsx'))
const Methodology = lazy(() => import('./pages/Methodology.tsx'))
const Resources = lazy(() => import('./pages/Resources.tsx'))
const Legal = lazy(() => import('./pages/Legal.tsx'))
const Paper = lazy(() => import('./pages/Paper.tsx'))
const Economy = lazy(() => import('./pages/Economy.tsx'))
const Photos = lazy(() => import('./pages/Photos.tsx'))
const Screen = lazy(() => import('./pages/Screen.tsx'))
const About = lazy(() => import('./pages/About.tsx'))
const Brands = lazy(() => import('./pages/Brands.tsx'))
const Data = lazy(() => import('./pages/Data.tsx'))
const Glossary = lazy(() => import('./pages/Glossary.tsx'))
const Watchmaking = lazy(() => import('./pages/Watchmaking.tsx'))

function RouteFallback() {
  return <p className="boot mono">LOADING…</p>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="register" element={<Suspense fallback={<RouteFallback />}><Register /></Suspense>} />
          <Route path="photos" element={<Suspense fallback={<RouteFallback />}><Photos /></Suspense>} />
          <Route path="screen" element={<Suspense fallback={<RouteFallback />}><Screen /></Suspense>} />
          <Route path="economy" element={<Suspense fallback={<RouteFallback />}><Economy /></Suspense>} />
          <Route path="w/:id" element={<Suspense fallback={<RouteFallback />}><Dossier /></Suspense>} />
          <Route path="compare" element={<Suspense fallback={<RouteFallback />}><Compare /></Suspense>} />
          <Route path="discover" element={<Suspense fallback={<RouteFallback />}><Discover /></Suspense>} />
          <Route path="rehome" element={<Suspense fallback={<RouteFallback />}><Rehome /></Suspense>} />
          <Route path="signals" element={<Suspense fallback={<RouteFallback />}><Signals /></Suspense>} />
          <Route path="patterns" element={<Suspense fallback={<RouteFallback />}><Patterns /></Suspense>} />
          <Route path="starter" element={<Suspense fallback={<RouteFallback />}><Starter /></Suspense>} />
          <Route path="methodology" element={<Suspense fallback={<RouteFallback />}><Methodology /></Suspense>} />
          <Route path="resources" element={<Suspense fallback={<RouteFallback />}><Resources /></Suspense>} />
          <Route path="legal" element={<Suspense fallback={<RouteFallback />}><Legal /></Suspense>} />
          <Route path="paper" element={<Suspense fallback={<RouteFallback />}><Paper /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<RouteFallback />}><About /></Suspense>} />
          <Route path="brands" element={<Suspense fallback={<RouteFallback />}><Brands /></Suspense>} />
          <Route path="data" element={<Suspense fallback={<RouteFallback />}><Data /></Suspense>} />
          <Route path="glossary" element={<Suspense fallback={<RouteFallback />}><Glossary /></Suspense>} />
          <Route path="watchmaking" element={<Suspense fallback={<RouteFallback />}><Watchmaking /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)