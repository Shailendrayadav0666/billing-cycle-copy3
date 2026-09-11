"""Behaviour Gate — cycle-level cross-story journeys (spec/behavior.feature). Part of tier B3.

This epic was consolidated into a single story at the user's explicit request (GATE 1) — there
is no second work unit for a genuine cross-story seam to span, so this feature file intentionally
carries zero scenarios (see spec/behavior.feature's own header comment). Collecting it here still
proves the B3 tier resolves and executes this file rather than silently omitting it.
"""
from pathlib import Path

from pytest_bdd import scenarios

_FEATURE_PATH = Path(__file__).resolve().parents[2] / "spec" / "behavior.feature"

# pytest-bdd's scenarios() raises NoScenariosFound (a collection ERROR) for a Feature with
# zero Scenario blocks — but zero is the documented, correct outcome here (see this file's
# own docstring and spec/behavior.feature's header). Only call scenarios() if there is at
# least one to run, so the earned "zero" reads as zero tests, not a broken collection.
if "Scenario" in _FEATURE_PATH.read_text(encoding="utf-8"):
    scenarios("../../spec/behavior.feature")
