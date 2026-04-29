import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Listen on 5000 so the Replit web preview can reach us. Locally you can
    // still hit http://localhost:5000.
    port: Number(process.env.FRONTEND_PORT) || 5000,
    host: '0.0.0.0',
    strictPort: true,
    // The Replit preview proxies through *.replit.dev, so we accept any host.
    allowedHosts: true,
    proxy: {
      // All API traffic is forwarded to the Spring Boot backend.
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // Same for static uploads served directly off the backend.
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    // Avoid stale HTML between code changes without breaking HMR module caching.
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
