import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/learnx/api': {
        target: 'http://127.0.0.1:8792',
        changeOrigin: true,
      },
    },
  },
})
