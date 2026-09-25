# Code Generation Plan — Story 1.1: Premium upgrade dialog on the Billing page

**Unit**: story-1.1 · **Branch**: `story/1.1-premium-upgrade-dialog-on-the-billing-page` (cut from `epic/4702-self-serve-premium-upgrade` @ ce9c3c2) · **Tracker**: LOCAL · **AIRE**: v1.0
**Status**: auto-approved (no gate) — single source of truth for this story's code generation

## Story Context
- **Acceptance criteria** (`spec/plans/stories.md`): AC-1 CTA for Standard users · AC-2 no CTA for Premium users · AC-3 dialog content, no request on open · AC-4 dismiss by Cancel / Escape / backdrop with no changes · AC-5 accessible dialog (role, modal, label, focus in, focus back).
- **Covers**: REQ-F-08 (CTA), REQ-F-09 (dialog — the static shell only; charge rows and Confirm arrive in Story 1.7), REQ-F-13 (dismiss), REQ-NF-02 (accessibility), REQ-NF-04 (visual fidelity), REQ-NF-06 (no runtime deps), REQ-NF-07 (frontend test stack).
- **Requirement text honoured beyond the ACs**: REQ-F-09 also lists a loading state and Confirm — deferred by the approved story split to 1.7, so this plan renders neither. REQ-NF-01: the dialog shows no charge at all yet, so no frontend math can creep in.
- **Dependencies**: requires none. Enables 1.3 (reuses this story's test tooling and title row) and 1.7 (adds charge rows and Confirm to this dialog).
- **Contracts consumed**: existing `GET /api/billing` payload (`plan_name`, `price`, …) — unchanged. No new endpoint.
- **Contract**: `spec/behavior/story-1.1.feature` (5 scenarios, 5 ACs) — read, never rewritten. Manual test plan: `spec/test-plans/story-1.1-premium-upgrade-dialog-on-the-billing-page/`.
- **Architecture constraints** (`spec/plans/architecture.md` Section 10): ARCH-05 (the dialog's static benefit list and "Premium is $40/month" copy are the only permitted frontend plan constants; current plan comes from the API payload), ARCH-06 (no runtime dependency — test tooling only in devDependencies), ARCH-01 (no charge arithmetic in the frontend).

## Design Reference Grounding (DR-5 / DR-8)
Reconciliations read first (`runtime-artifacts/aire-state.md` → `### Reconciliations`): the prototype's 38-day demo charge, its "4K + HDR" / "Download on 4 devices" bullets, its 2-perk list and its configurable `premiumPrice` are settled against the reference — this plan follows the Epic data for the benefit list and never makes the price configurable.

| Component | Grounding |
|---|---|
| Upgrade CTA (`Billing.jsx` title row) | Design reference: `spec/context-project/new-references/StreamPlex Billing.html` — grounded (primary green button "Upgrade to Premium" at the right of the "Plan & Billing" title row, rendered only when not Premium; #0d9b74, hover #0a7a5b, white 700 15px text, 14px 22px padding, radius 10px) |
| `UpgradeDialog` (new component) | Design reference: `spec/context-project/new-references/StreamPlex Billing.html` — grounded (fixed overlay rgba(11,18,32,0.5), white card max-width 460px radius 16px padding 32px; title "Upgrade to Premium" 24px 800; line "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."; bordered summary box radius 12px; bullet list of benefits; outline "Cancel" button #d7dbe2 border). Unreconciled additions from the Epic (not in the prototype, not contradicting it): "Current plan" / "New plan" rows in the summary box (AC-3 / Epic AC-2). Benefit wording follows the Epic data per the recorded reconciliation. The prototype's "Remaining days" / "Charge today" rows and "Confirm & pay" button belong to Story 1.7 |
| Existing Billing page styles | Design reference: not applied — the live page keeps its existing teal palette (#0f766e); restyling existing elements is outside Story 1.1's ACs. New components use the reference palette |

Capabilities in the prototype outside this story: the post-upgrade panel (Story 1.8) and charge rows (Story 1.7) — excluded here, owned by later stories. Focus trapping (Tab cycling inside the dialog) is not shown in the prototype and not required by REQ-NF-02 — not built; noted as the test plan's open question TC-ACC-04.

## Steps

- [x] **Step 1 — Frontend Components Generation: `UpgradeDialog` component** (REQ-F-09, REQ-F-13, REQ-NF-02, REQ-NF-04, ARCH-05; AC-3, AC-4, AC-5)
  - New file `src/frontend/src/components/UpgradeDialog.jsx`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title; props `currentPlan` (label built from the billing payload) and `onClose`; renders title, explainer line, summary box (Current plan / New plan), benefit list, Cancel button.
  - Focus moves into the dialog on mount (the dialog element); Escape calls `onClose`; a click on the backdrop itself (not the card) calls `onClose`.
  - No `fetch` anywhere in the component.
- [x] **Step 2 — Frontend Components Generation: Billing page CTA and dialog wiring** (REQ-F-08, REQ-F-13, REQ-NF-02; AC-1, AC-2, AC-3, AC-4, AC-5)
  - `src/frontend/src/pages/Billing.jsx`: render the "Upgrade to Premium" button in `.billing-header` only when `data.plan_name === 'Standard'`; open state via `useState`; render `UpgradeDialog` with `currentPlan = "<plan_name> (<price as $X/mo>)"`; on close, hide the dialog and return focus to the CTA (ref).
- [x] **Step 3 — Frontend Components Summary: styles** (REQ-NF-04; AC-1, AC-3)
  - `src/frontend/src/App.css`: new classes `.upgrade-cta`, `.upgrade-overlay`, `.upgrade-dialog`, `.upgrade-dialog-title`, `.upgrade-dialog-text`, `.upgrade-summary`, `.upgrade-summary-row`, `.upgrade-benefits`, `.upgrade-actions`, `.upgrade-cancel` with the reference values; focus-visible outline on both buttons.
- [x] **Step 4 — Unit Test & Coverage** (REQ-NF-07; AC-1 … AC-5) — Step 11a
  - `tests/unit/frontend/src/components/UpgradeDialog.test.jsx` and `tests/unit/frontend/src/pages/Billing.test.jsx` (Vitest + React Testing Library + jsdom; `fetch` stubbed, `useAuth` mocked). Cover CTA shown/hidden, dialog content, Cancel / Escape / backdrop close, click inside the card does not close, focus in and focus return, no upgrade request on open or dismiss, loading state unchanged.
  - Run `npx vitest run --config vitest.config.js --coverage` from `src/frontend`; changed-lines coverage ≥ `unitTestCoverageMin`; evidence to `reports/unit-test-evidence/story-1.1/`.
- [x] **Step 5 — Behavioural Test Gate B1/B2/B3** (AC-1 … AC-5) — Step 6.1
  - `tests/behavior/steps/story-1.1.steps.jsx` binds `spec/behavior/story-1.1.feature` through the rendered Billing page (its public UI surface). Run `run.sh b1` / `b2` in the `aire-behavior:local` Podman image with `AIRE_STORY_KEY=story-1.1`. B2: empty active set expected (N/A, exit 3). B3: N/A — not the last work unit.
- [x] **Step 6 — API & Contract Testing Gate** — N/A: the plan has no API Layer Generation step (no endpoint added or changed).
- [x] **Step 7 — Test Placement Verification** — every changed test file under `tests/unit/frontend/src/…` (mirroring `src/frontend/src/…`) or `tests/behavior/steps/`; none under `src/`. Log to `reports/unit-test-evidence/story-1.1/test-placement-check.log`.
- [x] **Step 8 — Full Regression vs Baseline** — re-run the whole suite (all unit tests; no Python or e2e tests exist) and diff against `baseline-regression.log` (0 tests at baseline).
- [x] **Step 9 — Static Eval Gate D1–D7** — oxlint (D1), D2 N/A (plain JS/JSX), semgrep auto (D3, files staged so they are tracked), npm audit (D4), license-checker (D5), oxlint complexity (D6), gitleaks on the staged diff (D7); diff against `static/baseline/`; write `eval.json` + `eval-summary.md`.
- [x] **Step 10 — Playwright Readiness** — runner (`@playwright/test` at the repo root), browsers, and Playwright's official agents (`.claude/agents/playwright-test-*.md`, `.mcp.json` `playwright-test`) already present; verify `npx playwright --version` and install browsers if missing. No session restart needed. The readiness files (root `package.json` + `package-lock.json`, the three agent files, `.mcp.json`) are committed with this story, and the root `.gitignore` gains `node_modules/` so the root Playwright install is never committed. *(Plan revision 1, see below.)*
- [x] **Step 11 — Test Plans + Playwright UI Automation** — part 1: manual test plan present (approved at the STOP CHECKPOINT). Part 2: invoke `playwright-implement` in WORKFLOW MODE for Story 1.1 (starts backend + frontend locally, Planner/Generator/Healer, `--headed`), specs in `tests/e2e/story-1.1-premium-upgrade-dialog-on-the-billing-page/`.
- [x] **Step 12 — Playwright E2E Regression** — baseline was N/A (no specs in `tests/e2e/` at baseline); record the same reason.
- [x] **Step 13 — Documentation** — `src/README.md` Frontend section: note the Upgrade dialog and the test commands (`npx vitest run`, behaviour runner).
- [x] **Step 14 — Deployment Artifacts** — none (no infrastructure change).

## Trace Summary (REQ / AC → steps)
| Item | Steps |
|---|---|
| AC-1 | 2, 3, 4, 5 |
| AC-2 | 2, 4, 5 |
| AC-3 | 1, 2, 3, 4, 5 |
| AC-4 | 1, 2, 4, 5 |
| AC-5 | 1, 2, 4, 5 |
| REQ-F-08 | 2 |
| REQ-F-09 | 1 (shell; remainder in Story 1.7) |
| REQ-F-13 | 1, 2 |
| REQ-NF-02 | 1, 2 |
| REQ-NF-04 | 1, 3 |
| REQ-NF-06 | 4, 9 (devDependencies only; checked by ARCH-06) |
| REQ-NF-07 | 4, 5, 11 |

Trace completeness self-check: 5/5 ACs and 7/7 covered REQ-IDs appear in at least one step — PASS.

## Plan Revisions
| # | Change | Why |
|---|---|---|
| 1 | Step 10 also adds `node_modules/` to the root `.gitignore` | The root `.gitignore` did not ignore `node_modules/`, so the root Playwright install (a readiness file set this story commits) would otherwise be committable. Found by the Step 7 placement scan. |
| 2 | Root `.gitignore` also ignores `test-results/`, `playwright-report/` and `.playwright-mcp/` | Playwright and its MCP server write run output there; generated, never committed |
