import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Register from './pages/Register.tsx'
import Dossier from './pages/Dossier.tsx'
import Compare from './pages/Compare.tsx'
import Starter from './pages/Starter.tsx'
import Methodology from './pages/Methodology.tsx'
import Paper from './pages/Paper.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Register />} />
          <Route path="w/:id" element={<Dossier />} />
          <Route path="compare" element={<Compare />} />
          <Route path="starter" element={<Starter />} />
          <Route path="methodology" element={<Methodology />} />
          <Route path="paper" element={<Paper />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
