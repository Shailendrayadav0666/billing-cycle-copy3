#!/bin/sh
set -eu

TIER="${1:?usage: run.sh <b1|b2|b3>}"
STORY_KEY="${AIRE_STORY_KEY:?AIRE_STORY_KEY env var required (e.g. story-1.1)}"

cd /work
export NODE_PATH="/work/src/frontend/node_modules"

EVIDENCE_DIR="reports/behavior-test-evidence/${STORY_KEY}/${TIER}"
mkdir -p "$EVIDENCE_DIR"

case "$TIER" in
  b1)
    export AIRE_FEATURE_GLOB="spec/behavior/${STORY_KEY}.feature"
    ;;
  b2)
    # Resolve every OTHER feature file whose work unit is ACTIVE (In Development / Ready for
    # Testing / done) per common/behavior-spec.md Section 6.0, from the Story Tracker.
    ACTIVE_OTHERS=$(node tests/.evals/scripts/resolve-active-features.cjs "$STORY_KEY" b2 || true)
    if [ -z "$ACTIVE_OTHERS" ]; then
      echo "B2: N/A - no other ACTIVE feature files besides ${STORY_KEY} (all other stories are still Ready for Development)"
      exit 3
    fi
    export AIRE_FEATURE_GLOB="$ACTIVE_OTHERS"
    ;;
  b3)
    ACTIVE_ALL=$(node tests/.evals/scripts/resolve-active-features.cjs "$STORY_KEY" b3 || true)
    if [ -z "$ACTIVE_ALL" ]; then
      echo "B3: N/A - deferred (other work units' PRs are not all merged yet)"
      exit 3
    fi
    export AIRE_FEATURE_GLOB="$ACTIVE_ALL"
    ;;
  *)
    echo "unknown tier: $TIER (expected b1, b2, or b3)" >&2
    exit 1
    ;;
esac

echo "Tier: $TIER | AIRE_STORY_KEY=$STORY_KEY | features: $AIRE_FEATURE_GLOB"

npx --prefix src/frontend cucumber-js \
  --config cucumber.cjs \
  --format "json:${EVIDENCE_DIR}/behavior-test-report.json" \
  2>&1 | tee "${EVIDENCE_DIR}/behavior-test-run.log"
