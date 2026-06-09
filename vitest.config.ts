// Kept separate from vite.config.ts: the app config instantiates the PWA
// plugin and derives `base` from the deploy environment, none of which tests
// need. Tests only require the `@` path alias.
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
