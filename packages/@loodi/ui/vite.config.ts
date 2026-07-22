import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: !process.argv.includes('--watch'),
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'mini-header': resolve(__dirname, 'src/mini-header.ts'),
        'bottom-nav': resolve(__dirname, 'src/bottom-nav.ts'),
        launcher: resolve(__dirname, 'src/launcher-entry.ts'),
        'shared-preferences': resolve(__dirname, 'src/shared-preferences.ts'),
        'global-settings': resolve(__dirname, 'src/global-settings.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react'],
    },
  },
})
