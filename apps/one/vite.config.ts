/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
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
