// Registers an esbuild-backed require() hook so step definitions under tests/behavior/steps/
// can `require()` the application's JSX source files directly (src/frontend/src/**).
// Loaded first via cucumber.cjs's `requireModule`.
require('esbuild-register/dist/node').register({
  jsx: 'automatic',
  jsxImportSource: 'react',
  format: 'cjs',
})

// Vite handles `import '*.css'` as a build-time side effect; a plain Node require() cannot
// parse CSS. Stub it out, matching the same no-op treatment test frameworks (Jest's
// moduleNameMapper) give CSS imports in a non-browser test runtime.
require.extensions['.css'] = function () {
  return undefined
}

// Provide a DOM environment (matching the app's real public surface — a browser) so
// @testing-library/react can render into a document, exactly like the jsdom environment
// vitest.config uses for the unit-test gate.
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator
global.HTMLElement = dom.window.HTMLElement
global.getComputedStyle = dom.window.getComputedStyle
Object.defineProperty(global, 'localStorage', { value: dom.window.localStorage, configurable: true })
