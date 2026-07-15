import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  publicDir: path.resolve(__dirname, '../one/public'),
  server: {
    host: true,
    port: 4000,
    strictPort: true,
    open: true,
    https: {
      cert: fs.readFileSync(path.resolve(__dirname, '../../.certs/cert.pem')),
      key: fs.readFileSync(path.resolve(__dirname, '../../.certs/key.pem')),
    },
  },
})
