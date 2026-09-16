# Story Generation Plan — Self-Serve Premium Upgrade

## Execution Checklist

- [x] Apply Step 1.5 SPIDR slicing to requirements.md's 10 functional + 9 non-functional requirements
- [ ] Collect answers to the questions below
- [ ] Analyze answers for ambiguity (Step 9)
- [ ] Announce the finalized plan (Step 12 — no approval gate)
- [ ] Generate all stories in one pass into `spec/plans/stories.md` (Epic header first)
- [ ] Generate `spec/plans/personas.md`
- [ ] Populate the Story Tracker in `runtime-artifacts/aire-state.md`
- [ ] Run the Requirements Full-Coverage Check (Step 18.5)
- [ ] Run the Story Granularity & Splitting Check (Step 18.6)
- [ ] Present the story set for GATE 1 approval

## SPIDR Slicing Analysis

The Epic's own story list names one story (S-01), but the hard sizing ceiling in Step 1.5 forbids a
single story from newly touching more than one architectural layer unless the extra layer is pure
pass-through. This capability has real, independently-verifiable logic in **both** layers:

- **Backend** (`main.py`): proration formula, plan mutation, idempotency guard, object-level
  authorization, input validation — none of this is pass-through.
- **Frontend** (`Billing.jsx`, `App.css`): CTA visibility, confirmation panel, preview display,
  confirm/apply call wiring, success/error UI states — none of this is pass-through either.

**Slice axis used: Interfaces (I)** — backend REST endpoint vs frontend UI are different interfaces
sharing one capability. Idempotency (already-Premium → 400) stays inside the backend story rather than
becoming its own story: it is a one-line guard-clause variation with no independent logic worth
reviewing on its own (the Paths-axis exception in Step 1.5).

## Question 1 — Number of user stories (MANDATORY)

 How many user stories should I create for this work?

   Recommended: 2 stories (range: 2–2)

  Why 2:
  - The epic's single capability newly touches exactly two architectural layers with real,
    independent logic in each (backend proration/authz/idempotency; frontend CTA/preview/confirm/
    error states) — the Step 1.5 hard ceiling forces a split along the Interfaces axis, and neither
    layer is thin enough to merge back with the other.
  - 2 stories meets team_size (= 2) — once the backend story's endpoint contract is established
    (already fully specified in requirements.md REQ-F-02/03/05/06/07/09/10), the frontend story is
    independently buildable and reviewable against that contract.
  - Both stories stay within the Step 1.5 ceilings on their own: ≤5 acceptance criteria each, exactly
    one new architectural layer each, no title conjunction, and no more than one bundled scenario
    class beyond the accepted trivial-guard-clause exception.

  Reply with a number to override, or "ok"/"use recommended" to accept 2.
[Answer]: 1

## Question 2 — Persona detail

The Epic names one user type ("Standard plan users"). Story 1.1 (backend) also needs to reason about an
already-Premium caller for the idempotency guard-clause AC. Is a single primary persona
("Standard Subscriber") enough, or should I also define a distinct "Premium Subscriber" persona for the
idempotency/CTA-hidden behavior?

A) One persona is enough — "Standard Subscriber" as primary; treat "already Premium" purely as a
   system state in the acceptance criteria, not a separate persona

B) Define two personas — "Standard Subscriber" (primary, upgrade path) and "Premium Subscriber"
   (secondary, sees no CTA / triggers the idempotency guard)

X) Other (please describe after [Answer]: tag below)

[Answer]: a
