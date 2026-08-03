/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  // Environment files belong to the monorepo so local, Vercel and native
  // builds resolve the same Supabase configuration.
  envDir: path.resolve(__dirname, '../..'),
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Les packages workspace changent pendant le développement : ne pas les figer
    // dans le cache de pré-bundling de Vite.
    exclude: ['@loodi/ui', '@loodi/auth', '@loodi/bridge'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    host: 'one.loodi.test',
    port: 4001,
    strictPort: true,
    open: true,
    https: {
      cert: fs.readFileSync(path.resolve(__dirname, '../../.certs/cert.pem')),
      key: fs.readFileSync(path.resolve(__dirname, '../../.certs/key.pem')),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
