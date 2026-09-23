import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const resolveFromHere = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url))

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  resolve: {
    alias: {
      '@testing-library/jest-dom/vitest': resolveFromHere('./node_modules/@testing-library/jest-dom/vitest.js'),
      '@testing-library/jest-dom': resolveFromHere('./node_modules/@testing-library/jest-dom'),
      '@testing-library/react': resolveFromHere('./node_modules/@testing-library/react'),
      '@testing-library/user-event': resolveFromHere('./node_modules/@testing-library/user-event'),
      react: resolveFromHere('./node_modules/react'),
      'react-dom': resolveFromHere('./node_modules/react-dom'),
      vitest: resolveFromHere('./node_modules/vitest'),
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
      allow: [resolveFromHere('../../')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolveFromHere('../../tests/unit/frontend/setup.js')],
    include: ['../../tests/unit/frontend/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: resolveFromHere('../../reports/unit-test-evidence/story-1.1/coverage'),
      include: ['src/components/UpgradeModal.jsx', 'src/pages/Billing.jsx', 'src/utils/proration.js'],
    },
  },
})
