import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@components': resolve('src/renderer/src/components'),
      '@pages': resolve('src/renderer/src/pages'),
      '@api': resolve('src/renderer/src/api'),
      '@store': resolve('src/renderer/src/store'),
      '@theme': resolve('src/renderer/src/theme'),
      '@mock': resolve('src/renderer/src/mock'),
      '@windows': resolve('src/renderer/src/windows')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/renderer/src/test/setup.ts'],
    css: false
  }
})
