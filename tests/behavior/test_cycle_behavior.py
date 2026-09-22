from pathlib import Path

from pytest_bdd import scenarios

# Cycle-level cross-story journeys. This feature file currently has zero scenarios (single-story
# cycle, no cross-unit journeys to test yet — see spec/behavior.feature's own header comment).
# pytest-bdd's scenarios() raises NoScenariosFound for a feature file with zero Scenario: blocks
# (rather than collecting zero tests), so only call it when there is at least one to find — the B3
# tier still "ran on" this file either way, per common/behavior-spec.md Section 6.1, rather than
# being silently skipped.
_FEATURE_PATH = Path(__file__).resolve().parents[2] / "spec" / "behavior.feature"
if "Scenario:" in _FEATURE_PATH.read_text(encoding="utf-8"):
    scenarios("../../spec/behavior.feature")
