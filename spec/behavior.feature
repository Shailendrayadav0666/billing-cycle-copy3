# Cross-story journeys for this epic — written ONCE per cycle (common/behavior-spec.md Section 3).
#
# This epic's story set was consolidated into a SINGLE story (1.1 — Mid-Cycle Subscription Upgrade)
# at the user's explicit request at GATE 1 (see spec/plans/stories.md's sizing note and
# runtime-artifacts/audit.md's "User Stories — GATE 1: Request Changes" entry). With only one story,
# there is no second unit for a genuine cross-story seam to span — every behaviour this epic
# introduces (CTA -> preview -> confirm -> charge -> quota update, both the success and decline
# paths) is already owned end-to-end by that single story's own feature file
# (spec/behavior/story-1.1.feature, written at dev-implement time).
#
# Recorded explicitly per common/behavior-spec.md Section 3's own instruction: "if the requirement
# has none, record that explicitly" rather than inventing a journey that would just restate what
# story 1.1's own scenarios already cover. The B3 behavioural tier (this file, run only on a PR into
# the base branch) will therefore find zero scenarios here — that is the correct, earned outcome for
# a single-story epic, not a gap.
