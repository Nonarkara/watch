import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: ['/Users/nonarkara/Projects'] } }, // design tokens live in ../_shared
})
