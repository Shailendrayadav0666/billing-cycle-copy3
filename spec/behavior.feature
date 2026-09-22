# This cycle has exactly ONE work unit (Story 1.1 — see the confirmed single-story
# override in spec/plans/stories.md). A cross-story journey, by definition, spans work
# units that no single story owns. With only one story, there is no seam between units
# for a genuine cross-unit journey to exercise — everything Story 1.1 does is already
# owned end-to-end by story-1.1.feature.
#
# Per common/behavior-spec.md Section 3: "write the genuine cross-unit journeys, or
# record explicitly that the requirement has none." This file records explicitly: NONE.
# The B3 tier (common/behavior-spec.md Section 6) still runs on this single unit at
# dev-implement time — it simply has no additional scenarios of its own to contribute
# beyond story-1.1.feature.

Feature: Self-Serve Premium Upgrade — cycle-level cross-story journeys

  # No scenarios: this cycle has a single work unit (Story 1.1), so there is no
  # cross-unit seam to test here. See story-1.1.feature for the full journey.

