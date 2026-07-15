/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
