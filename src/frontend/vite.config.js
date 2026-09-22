import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const r = (p) => fileURLToPath(new URL(p, import.meta.url)).replace(/\\/g, '/')

// tests/unit/frontend/ lives OUTSIDE this package root, so Vite's bare-import resolver (which walks
// up from the importing FILE's own directory, not from this config's root) never reaches
// src/frontend/node_modules for test-only packages imported directly by files under tests/. Alias
// them explicitly rather than duplicating node_modules or moving tests under src/.
const testOnlyPackages = ['@testing-library/jest-dom', '@testing-library/react', '@testing-library/user-event', 'vitest', 'react', 'react-dom']

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: testOnlyPackages.map((pkg) => ({
      // Exact package or an explicit subpath only (`pkg` or `pkg/sub`) — never a prefix match,
      // which would otherwise also catch unrelated packages like "react-router" under the "react" entry.
      find: new RegExp(`^${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\/.*)?$`),
      replacement: r(`./node_modules/${pkg}`) + '$1',
    })),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    fs: {
      allow: [r('../../')],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: [r('../../tests/unit/frontend/setup.js')],
    include: [r('../../tests/unit/frontend/**/*.test.jsx')],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: r('../../reports/unit-test-evidence/story-1.1/coverage-frontend'),
      include: ['src/pages/Billing.jsx'],
    },
  },
})
