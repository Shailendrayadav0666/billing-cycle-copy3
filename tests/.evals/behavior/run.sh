#!/bin/sh
# Behaviour gate entry point (common/behavior-spec.md Sections 5 and 6). The same
# command runs locally and in CI, inside the aire-behavior:local image:
#   podman run --rm -v "<repo>:/work:Z" -v /work/src/frontend/node_modules \
#     -e AIRE_STORY_KEY=<unit-key> aire-behavior:local "sh tests/.evals/behavior/run.sh <b1|b2|b3>"
# Exit codes: 0 pass, 1 failure, 2 usage/config error, 3 N/A (no active feature files).
set -u

TIER="${1:-}"
KEY="${AIRE_STORY_KEY:-}"
case "$TIER" in b1|b2|b3) ;; *) echo "run.sh: tier must be b1, b2 or b3 (got '$TIER')"; exit 2 ;; esac
[ -n "$KEY" ] || { echo "run.sh: AIRE_STORY_KEY is not set — refusing to guess the work unit"; exit 2; }

FEATURES="$(node tests/.evals/behavior/resolve-tiers.mjs "$TIER" "$KEY")" || exit 2
if [ -z "$FEATURES" ]; then
  echo "run.sh: tier $TIER has no active feature files for $KEY — N/A"
  exit 3
fi
echo "run.sh: tier $TIER for $KEY — feature files:"
printf '  %s\n' $FEATURES

OUT="reports/behavior-test-evidence/$KEY/$TIER"
mkdir -p "$OUT"

# Each feature file is bound by exactly one step-definition module:
#   tests/behavior/steps/<unit>.steps.jsx  (frontend units, Vitest + vitest-cucumber)
#   tests/behavior/test_<unit>.py          (backend units, pytest-bdd)
JS_FILTERS=""
PY_TESTS=""
MISSING=""
for f in $FEATURES; do
  unit="$(basename "$f" .feature)"
  py="tests/behavior/test_$(printf '%s' "$unit" | tr '.-' '__').py"
  if [ -f "tests/behavior/steps/$unit.steps.jsx" ]; then
    JS_FILTERS="$JS_FILTERS tests/behavior/steps/$unit.steps.jsx"
  elif [ -f "$py" ]; then
    PY_TESTS="$PY_TESTS $py"
  else
    MISSING="$MISSING $f"
  fi
done
if [ -n "$MISSING" ]; then
  echo "run.sh: no step definitions for:$MISSING"
  exit 1
fi

RC=0
if [ -n "$JS_FILTERS" ]; then
  # shellcheck disable=SC2086
  (cd src/frontend && npx vitest run --config vitest.behavior.config.js $JS_FILTERS \
    --reporter=verbose --reporter=json --outputFile.json="../../$OUT/behavior-test-report.json") || RC=1
fi
if [ -n "$PY_TESTS" ]; then
  # shellcheck disable=SC2086
  python -m pytest $PY_TESTS -v --junitxml="$OUT/behavior-test-report-pytest.xml" || RC=1
fi
exit $RC
