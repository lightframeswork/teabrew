import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Der Quellcode liegt in app/, das fertige Bundle im Wurzelverzeichnis –
 * von dort liefert GitHub Pages die App unter /teabrew/ aus. Ohne diese
 * Trennung würde der Build seine eigene Vorlage überschreiben.
 */
export default defineConfig({
  root: 'app',
  base: '/teabrew/',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
  },
})
