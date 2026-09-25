import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

// Behaviour (Gherkin) step definitions live in the repo-root
// tests/behavior/steps/ tree and load their .feature contract from spec/behavior/
// by explicit path. tests/.evals/behavior/run.sh picks the files per tier.
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
        '@amiceli/vitest-cucumber',
      ],
    },
    server: { fs: { allow: [repoRoot] } },
    test: {
      dir: repoRoot,
      include: ['tests/behavior/steps/**/*.steps.{js,jsx}'],
      environment: 'jsdom',
      setupFiles: [`${repoRoot}tests/behavior/support/setup.js`],
    },
  }),
)
