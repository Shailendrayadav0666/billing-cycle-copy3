#!/bin/sh
# Behaviour test runner entry point — invoked as: podman run ... "bash tests/.evals/behavior/run.sh <tier>"
# Resolves tier membership itself (b1/b2/b3) from the spec/ layout — never duplicated in CI YAML.
# The app under test is started IN-PROCESS by tests/behavior/conftest.py (a background uvicorn
# thread sharing the same Python process as pytest) so step definitions can seed exact fixture
# state (specific renew_at dates, specific plans) directly on main.users/main.billing_data before
# Playwright's browser drives the real, running HTTP server — never two disconnected processes
# guessing at each other's state.
set -e

TIER="$1"
if [ -z "$TIER" ]; then
  echo "no tier supplied" >&2
  exit 1
fi

cd /work

STORY_KEY="${AIRE_STORY_KEY:-story-1.1}"
OTHER_FEATURES=$(find /work/spec/behavior -maxdepth 1 -name "*.feature" ! -name "${STORY_KEY}.feature" 2>/dev/null | wc -l)

case "$TIER" in
  b1)
    echo "B1 — unit scope: spec/behavior/${STORY_KEY}.feature"
    pytest tests/behavior/test_story_1_1.py -v --junitxml=/work/behavior-test-report.xml
    ;;
  b2)
    if [ "$OTHER_FEATURES" -eq 0 ]; then
      echo "B2 — N/A: no other feature file exists in spec/behavior/ (single-story cycle so far)"
      exit 3
    fi
    echo "B2 — cumulative scope: all other feature files"
    pytest tests/behavior/ -v --ignore=tests/behavior/test_story_1_1.py --junitxml=/work/behavior-test-report.xml
    ;;
  b3)
    echo "B3 — epic scope: B1 + B2 (N/A, no other units) + spec/behavior.feature (0 scenarios recorded — single-unit cycle, no cross-story journeys)"
    pytest tests/behavior/test_story_1_1.py tests/behavior/test_cycle_behavior.py -v --junitxml=/work/behavior-test-report.xml
    ;;
  *)
    echo "unknown tier: $TIER" >&2
    exit 1
    ;;
esac
