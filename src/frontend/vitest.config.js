import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

// Unit tests live in the repo-root tests/unit/frontend/ tree, outside this
// package, so the repo root is the test directory and shared test libraries
// are resolved from this package's node_modules.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        '@testing-library/jest-dom',
      ],
    },
    server: { fs: { allow: [repoRoot] } },
    test: {
      dir: repoRoot,
      include: ['tests/unit/frontend/**/*.test.{js,jsx}'],
      environment: 'jsdom',
      setupFiles: [`${repoRoot}tests/unit/frontend/setup.js`],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        reporter: ['lcov', 'json', 'json-summary', 'html', 'text'],
      },
    },
  }),
)
