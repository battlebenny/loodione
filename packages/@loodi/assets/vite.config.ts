import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: !process.argv.includes('--watch'),
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        brand: resolve(__dirname, 'src/brand.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
  },
})
