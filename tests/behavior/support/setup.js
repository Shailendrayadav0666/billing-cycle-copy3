// Each Gherkin step runs as its own Vitest test, so the rendered page must survive
// between steps: step files clean up in AfterEachScenario, not afterEach.
import '@testing-library/jest-dom/vitest'
