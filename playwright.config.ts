import { defineConfig, devices } from '@playwright/test'

// Browser tests for the StreamPlex app. Seed and generated specs live under tests/e2e/.
// Backend: FastAPI on :8000 (src/README.md). Frontend: Vite dev server on :5173, proxying /api.
const python =
  process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `${python} -m uvicorn main:app --port 8000`,
      cwd: 'src/backend',
      url: 'http://localhost:8000/docs',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      cwd: 'src/frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
