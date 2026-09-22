# Story Generation Plan — Self-Serve Premium Upgrade

## Grounding
- `spec/plans/requirements.md` — 15 REQ-F, 6 REQ-NF
- `spec/plans/epic-brief.md` — Atlas Epic
- Atlas solution document 4703 ("Story: Mid-Cycle Upgrade Flow") — an existing draft story linked to this Epic, reused as content grounding (proration formula, Premium feature dataset, 400/401 guards all confirmed consistent with `requirements.md`). It bundles everything into one oversized story; this plan slices it per Step 1.5 SPIDR rules.
- Design reference: `spec/context-project/new-references/StreamPlex Billing.html` (CTA placement, modal copy/structure, success banner)

## Breakdown Approach
**Feature-based, SPIDR-sliced** (mandatory per Step 1.5): one story per architectural interface (backend endpoint vs. frontend CTA vs. frontend modal), with the modal's error-handling path and the design-reference-sourced success banner split out as their own stories since each carries independent, reviewable logic. A single foundational plumbing story (dynamic plan-name rendering) is split out via the Steps axis since three later stories depend on it.

## Question: Number of Stories

 How many user stories should I create for this work?

   Recommended: 6 stories (suggested range: 5–7)

  Why 6:
  - 15 functional requirements SPIDR-sliced by Interface (backend REST endpoint / frontend CTA / frontend modal are 3 separate stories even though some logic is conceptually related) and by Path (the modal's failure/error-handling path has real independent logic — inline error + retry — so it's split from the happy-path modal; the trivial one-line Cancel path stays bundled with the happy path per the Paths-axis exception)
  - One foundational plumbing story (making the Billing page's plan-name/heading dynamic instead of hardcoded to "Standard") is split out via the Steps axis because three other stories (CTA visibility, modal state update, success banner) all depend on it
  - Keeps 2 stories (the backend endpoint story and the dynamic-plan-name story) independently workable in parallel from the very start, satisfying team_size=2 with no developer idle
  - Every resulting story stays within the Step 1.5 ceilings: ≤3 ACs, one newly-touched architectural layer, no title conjunction, one scenario class

  Reply with a number to override, or "ok"/"use recommended" to accept 6.
[Answer]: 1

## Execution Checklist

- [ ] Step 1: team_size fixed at 2 (recorded, not asked)
- [ ] Step 1.5: SPIDR slicing applied (logged in runtime-artifacts/audit.md)
- [ ] Step 2-3: This plan + the story-count question (above)
- [ ] Step 4: Mandatory artifacts — stories.md (with Epic header + Covers lines), personas.md, acceptance criteria, Requirements Coverage Matrix
- [ ] Step 6-8: Present this plan, wait for the story-count answer
- [ ] Step 9-10: Analyze the answer for ambiguity; follow up only if needed
- [ ] Step 12: Announce the plan as auto-approved (no gate) once the count is settled
- [ ] Step 14.5: story_creation_mode fixed at all-at-once (recorded, not asked)
- [ ] Step 16: Generate all stories in one pass into spec/plans/stories.md, each with a Covers line
- [ ] Step 17: Populate the Story Tracker in runtime-artifacts/aire-state.md
- [ ] Step 18.5: Requirements full-coverage check (every REQ-F and REQ-NF id covered or explicitly N/A)
- [ ] Step 18.6: Story granularity/splitting check against the Step 1.5 ceilings
- [ ] Step 19-20: Announce the complete story set
- [ ] Step 21-22: GATE 1 — wait for explicit Approve & Continue / Request Changes
- [ ] Step 23-28: Push to tracker (LOCAL — no-op announcement only) + proceed to Dependency Graph

## Candidate Story Breakdown (subject to the answered story count)

1. **Dynamic plan-name rendering** (Steps axis — foundational) — Covers: REQ-F-14
2. **Backend: `POST /api/billing/upgrade` endpoint** (Interfaces axis — REST) — Covers: REQ-F-04, REQ-F-05, REQ-F-06, REQ-F-07, REQ-F-08, REQ-F-11, REQ-NF-01, REQ-NF-02, REQ-NF-03
3. **Frontend: Upgrade CTA visibility** (Interfaces axis — UI entry point) — Covers: REQ-F-01, REQ-F-12
4. **Frontend: Confirmation modal (happy path)** (Interfaces axis — UI, distinct from CTA and backend) — Covers: REQ-F-02, REQ-F-03, REQ-F-09, REQ-F-15
5. **Frontend: Confirmation modal failure handling** (Paths axis — distinct scenario class) — Covers: REQ-F-10
6. **Frontend: Post-upgrade success banner** (new capability from design reference — distinct UI element) — Covers: REQ-F-13, REQ-NF-06

REQ-NF-04 (Resiliency Baseline disabled) and REQ-NF-05 (Property-Based Testing disabled) are configuration facts with no implementation surface — recorded `N/A (extension disabled)` in the Requirements Coverage Matrix rather than forced into a story.

---

## Follow-up: Confirm "1" story

Your answer to the story-count question was `1`. Before generating, I need to confirm what that means, because it conflicts with two hard rules this stage enforces:

- **Parallelism rule**: `team_size` is fixed at 2, and this stage must produce ≥2 independently workable stories so no developer is idle. A single story means only one person can pick it up at a time.
- **Step 1.5 sizing ceilings**: a single story covering all 15 functional requirements (backend endpoint + 4 separate frontend concerns) would have far more than 5 acceptance criteria and would touch multiple architectural layers newly in one story — exactly the problem the Atlas draft story (doc 4703) already has, which is why this plan split it in the first place.

A) You meant to **accept the recommended 6-story breakdown** above (a stray "1" — e.g., read as "yes to option 1 in the checklist," not a count) (Recommended)
B) You genuinely want **exactly 1 story** covering the whole epic — I will generate it, but it will exceed the Step 1.5 ceilings and only one developer can work on it at a time; I'll say so explicitly in the story rather than silently under-slicing
C) You want a different number — reply with the number

X) Other (please describe after [Answer]: tag below)

[Answer]:
