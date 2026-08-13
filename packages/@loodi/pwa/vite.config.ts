import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: !process.argv.includes('--watch'),
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.tsx'),
        vite: resolve(__dirname, 'src/vite.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', 'workbox-window', 'vite', 'vite-plugin-pwa'],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
