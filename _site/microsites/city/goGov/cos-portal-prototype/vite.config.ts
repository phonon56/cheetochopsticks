import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/microsites/city/goGov/cos-portal-prototype/build/',
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
})
