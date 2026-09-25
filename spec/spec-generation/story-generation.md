# Story Generation Plan — Epic 4702 Self-Serve Premium Upgrade

**Inputs**: `spec/plans/requirements.md` (REQ-F-01..14, REQ-NF-01..08), `spec/plans/epic-brief.md` (Atlas Epic 4702 + Story 4703), `spec/plans/atlas-deep-dive.md`, design reference #1 `spec/context-project/new-references/StreamPlex Billing.html` (plus its Reconciliations in `runtime-artifacts/aire-state.md`)
**Fixed defaults (not asked)**: `team_size: 2` · `story_creation_mode: all-at-once`
**Tracker**: LOCAL (stories stay in `stories.md` + the Story Tracker; Parent Epic 4702 on Atlas)

---

## 1. Slicing Analysis (Step 1.5 — SPIDR)

The Atlas story 4703 bundles the whole Epic into one "M (3–5 days)" story with 7 ACs, a backend API and a UI. That breaks every sizing ceiling (more than 5 ACs, two new layers, several scenario classes), so it is sliced as follows:

| Capability (REQ) | SPIDR axis | Candidate story |
|---|---|---|
| Proration rule (REQ-F-02) | **R** — a distinct business rule with edge cases | S1 Prorated charge calculation |
| Read-only preview (REQ-F-03) | **I** — its own entry point | S2 Upgrade preview endpoint |
| Apply upgrade: happy path (REQ-F-01, F-04, F-05, F-06) | **I** + **D** (Premium plan data) | S3 Upgrade endpoint applies Premium |
| Rejections: already Premium (400) / unknown user (401) on both endpoints (REQ-F-03, F-04) | **P** — the error path | S4 Upgrade requests rejected for ineligible users |
| Plan-driven page labels (REQ-F-07, F-14) | **D** — the page renders any plan, not just Standard | S5 Billing page reflects the current plan |
| CTA + dialog review (REQ-F-08, F-09, NF-02, NF-04) | **S** — journey step 1: review | S6 Review the prorated upgrade in a dialog |
| Confirm: page updates + confirmation panel (REQ-F-10, F-11, NF-03) | **S** — journey step 2: commit | S7 Confirm the upgrade from the dialog |
| Cancel / Escape / backdrop (REQ-F-13) | **P** — the alternate path | S8 Dismiss the dialog without upgrading |
| Request failures shown in the dialog (REQ-F-12) | **P** — the failure path | S9 Upgrade failures shown in the dialog |

Cross-cutting requirements attach to the story that first needs them: REQ-NF-01 (S1–S3, S6), REQ-NF-05 (S2–S4), REQ-NF-06 (all), REQ-NF-07 (S1 sets up backend test tooling, S5 frontend unit tooling, S6 Playwright), REQ-NF-08 (S2, S3).

**Parallelism**: S1 (backend) and S5 (frontend) have no prerequisites, so 2 stories are workable from the start (≥ team_size 2). The Dependency Graph stage infers the rest (expected: S2/S3 need S1, S4 needs S2 and S3, S6 needs S2 and S5, S7 needs S3 and S6, S8 needs S6, S9 needs S7).

---

## 2. Breakdown Approach

Options considered:
- **User Journey-Based** — follows Review → Confirm → Dismiss. Good for the UI, but backend rules get buried inside UI stories.
- **Feature-Based** — one story per capability. Mirrors the Atlas story; too coarse for the ceilings.
- **Persona-Based** — Standard vs Premium subscriber. Only two personas, and most work serves one of them, so it adds little.
- **Domain-Based** — pricing vs plan management. Too few domains to organise by.
- **Epic-Based** — already one Epic; no sub-epics needed.

**Chosen approach: hybrid.** Backend stories are feature/rule-based; frontend stories are journey-based (one step or path per story). That split is what makes 2 stories runnable in parallel and keeps each diff to one layer.

---

## 3. Questions

## Question 1 — Number of Stories to Create

 How many user stories should I create for this work?

    Recommended: 9 stories  (suggested range: 7–10)

   Why 9:
   - 14 functional requirements group into 9 single-purpose slices: 1 rule, 3 backend paths or interfaces, 1 data variation, 2 journey steps and 2 alternate/failure paths (table above)
   - keeps ≥ 2 stories runnable in parallel from the start (S1 backend, S5 frontend) so neither developer is idle
   - each story stays within the Step 1.5 ceilings (≤ 5 ACs, one new layer, one scenario class) so each review is small and mechanical; going below 7 would re-bundle error paths into happy-path stories

   Reply with a number to override, or "ok"/"use recommended" to accept 9.
[Answer]: ok (use recommended: 9) — given in chat. Additional instruction: "make the first story purely frontend so that i can see the changes post story 1.1"

## Question 2
Which personas should `personas.md` define?

A) Two subscriber personas: the Standard subscriber who wants Premium mid-cycle (primary) and the Premium subscriber who must not be offered an upgrade (secondary) (Recommended)

B) The two subscriber personas above, plus the Product Strategist as a stakeholder persona (the Epic requires their sign-off on acceptance criteria)

X) Other (please describe after [Answer]: tag below)

[Answer]: A (chat "ok" = recommended)

## Question 3
The repo has no test tooling yet. Where should its setup live?

A) Inside the first story that needs it — S1 adds pytest/pytest-bdd, S5 adds Vitest/React Testing Library, S6 adds the Playwright E2E setup — so there is no pure-plumbing story and S1 and S5 stay parallel (Recommended)

B) A separate enabling story ("Test tooling in place") that every other story depends on — clearer ownership, but it blocks all parallel work until it merges

X) Other (please describe after [Answer]: tag below)

[Answer]: A (chat "ok" = recommended)

## Question 4
What format should acceptance criteria use?

A) Given / When / Then, one scenario per AC, numbered AC-1..n per story — matches the Atlas story and maps one-to-one onto the `.feature` scenarios written later (Recommended)

B) Plain checklist statements

X) Other (please describe after [Answer]: tag below)

[Answer]: A (chat "ok" = recommended)

---

## 4. Execution Checklist

### Part 1 — Planning
- [x] Record `team_size: 2` (fixed default, not asked)
- [x] Apply SPIDR slicing to every capability (Section 1)
- [x] Choose the breakdown approach (Section 2)
- [x] Embed questions with `[Answer]:` tags (Section 3)
- [x] Collect and analyse answers; raise follow-ups if any are ambiguous (none — all recommended; ordering constraint added: Story 1.1 purely frontend and visible)
- [x] Record `target_story_count` in `runtime-artifacts/aire-state.md`
- [x] Announce the plan (no approval gate)

### Part 2 — Generation (all at once)
- [x] Record `story_creation_mode: all-at-once`
- [x] Generate `spec/plans/stories.md`, first line `EPIC TICKET: ...` (Parent Epic 4702, Atlas)
- [x] Every story: narrative, persona, `**Covers**:` REQ-IDs, Given/When/Then ACs, design-reference grounding line for UI stories, INVEST check
- [x] Generate `spec/plans/personas.md` and map personas to stories
- [x] Populate `## Story Tracker` (Requires = TBD, Tracker ID = —, Status = Ready for Development)
- [x] Requirements full-coverage check (Step 18.5) and Coverage Matrix appended to `stories.md`
- [x] Granularity check against the sizing ceilings (Step 18.6)
- [x] Present GATE 1 — Story Set Approval, and wait

### Part 3 — Push (after GATE 1)
- [x] LOCAL: announce that stories stay local (Tracker ID: LOCAL); no push

---

## 5. Plan Revision After Answers (user ordering constraint)

User: *"make the first story purely frontend so that i can see the changes post story 1.1"*. The slices are re-cut so that Story 1.1 needs no backend change and gives a visible result:

- The dialog is split into a **static shell** (Story 1.1: CTA, dialog with plan comparison and benefits, Cancel/Escape/backdrop close, accessibility) and the **server-computed charge** (Story 1.7). The old S8 "dismiss" slice is folded into 1.1, so the dialog can always be closed. This is a deliberate exception to the one-scenario-class ceiling (happy path + dismiss path in one story), made so 1.1 is usable on its own.
- The old S6 becomes 1.7 (dialog shows the prorated charge from the preview endpoint).
- Final count stays **9** — a new frontend slice for the charge display replaces the merged dismiss slice.
- Stories with no prerequisites: 1.1 (frontend), 1.2 (backend), 1.3 (frontend) — 3 parallel starters.

| New ID | Story | Layer | Replaces |
|---|---|---|---|
| 1.1 | Premium upgrade dialog on the Billing page | Frontend | S6 (static part) + S8 |
| 1.2 | Prorated charge calculation | Backend | S1 |
| 1.3 | Billing page reflects the current plan | Frontend | S5 |
| 1.4 | Upgrade preview endpoint | Backend | S2 |
| 1.5 | Upgrade endpoint switches the user to Premium | Backend | S3 |
| 1.6 | Upgrade requests rejected for ineligible users | Backend | S4 |
| 1.7 | Dialog shows the server-computed prorated charge | Frontend | S6 (dynamic part) |
| 1.8 | Confirm the upgrade from the dialog | Frontend | S7 |
| 1.9 | Upgrade failures shown in the dialog | Frontend | S9 |
