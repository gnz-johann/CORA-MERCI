// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  // svgr habilita los imports `import Icon from './x.svg?react'` usados en AppLayout.
  plugins: [react(), tailwindcss(), svgr()],
  server: {
    proxy: {
      // Redirige /api/* al backend en desarrollo
      // Así el frontend hace fetch('/api/...') sin cross-origin
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
