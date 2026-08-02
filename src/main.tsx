import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import Register from './pages/Register.tsx'
import Dossier from './pages/Dossier.tsx'
import Compare from './pages/Compare.tsx'
import Discover from './pages/Discover.tsx'
import Rehome from './pages/Rehome.tsx'
import Signals from './pages/Signals.tsx'
import Patterns from './pages/Patterns.tsx'
import Starter from './pages/Starter.tsx'
import Methodology from './pages/Methodology.tsx'
import Resources from './pages/Resources.tsx'
import Legal from './pages/Legal.tsx'
import Paper from './pages/Paper.tsx'
import Economy from './pages/Economy.tsx'
import Photos from './pages/Photos.tsx'
import Screen from './pages/Screen.tsx'
import About from './pages/About.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="register" element={<Register />} />
          <Route path="photos" element={<Photos />} />
          <Route path="screen" element={<Screen />} />
          <Route path="economy" element={<Economy />} />
          <Route path="w/:id" element={<Dossier />} />
          <Route path="compare" element={<Compare />} />
          <Route path="discover" element={<Discover />} />
          <Route path="rehome" element={<Rehome />} />
          <Route path="signals" element={<Signals />} />
          <Route path="patterns" element={<Patterns />} />
          <Route path="starter" element={<Starter />} />
          <Route path="methodology" element={<Methodology />} />
          <Route path="resources" element={<Resources />} />
          <Route path="legal" element={<Legal />} />
          <Route path="paper" element={<Paper />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
