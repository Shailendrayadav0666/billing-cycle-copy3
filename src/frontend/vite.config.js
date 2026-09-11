import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repoTests = fileURLToPath(new URL('../../tests/unit/frontend', import.meta.url)).replace(/\\/g, '/')

export default defineConfig({
  plugins: [react()],
  resolve: {
    // tests/unit/frontend/ lives OUTSIDE this Vite root (tests always live at the repo root per
    // common/directory-structure.md), so Vite's default node_modules walk-up from the importing
    // file's own ancestors never reaches src/frontend/node_modules. Alias the handful of test-only
    // packages those files import so they resolve against this project's own install — the same
    // "point resolution at the stack's own node_modules" fix common/behavior-spec.md Section 4.1a
    // prescribes for cucumber-js step files in the same situation (there via NODE_PATH; here via
    // Vite's own alias mechanism, since Vite's resolver does not honour NODE_PATH).
    alias: {
      '@testing-library/jest-dom/vitest': fileURLToPath(
        new URL('./node_modules/@testing-library/jest-dom/vitest.js', import.meta.url)
      ),
      '@testing-library/react': fileURLToPath(new URL('./node_modules/@testing-library/react', import.meta.url)),
      '@testing-library/user-event': fileURLToPath(
        new URL('./node_modules/@testing-library/user-event', import.meta.url)
      ),
      'react/jsx-dev-runtime': fileURLToPath(new URL('./node_modules/react/jsx-dev-runtime.js', import.meta.url)),
      'react-dom/test-utils': fileURLToPath(new URL('./node_modules/react-dom/test-utils.js', import.meta.url)),
      'react-dom/client': fileURLToPath(new URL('./node_modules/react-dom/client.js', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    fs: {
      // Allows the repo-root tests/ tree (outside this Vite root) to be served during `vitest run` —
      // tests always live at the repo root per common/directory-structure.md, never under src/.
      allow: ['../..'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [`${repoTests}/setup.js`],
    include: [`${repoTests}/**/*.test.jsx`],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: fileURLToPath(
        new URL('../../reports/unit-test-evidence/story-1.1/frontend-coverage', import.meta.url)
      ),
      include: ['src/pages/Billing.jsx'],
    },
  },
})
