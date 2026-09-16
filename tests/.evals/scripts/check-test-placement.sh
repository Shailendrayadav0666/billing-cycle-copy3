#!/usr/bin/env bash
# check-test-placement.sh — Test Placement Verification Gate
#
# NOT a copy of a canonical AIRE template: no template for this script exists under
# aire-workflow/templates/ci/ at generation time (verified — no check-test-placement.* file
# anywhere in that directory). Generated deterministically for THIS repo instead, per
# common/directory-structure.md "MISSING -> CREATE IT on the cycle branch" rule, to satisfy
# common/ci-pipeline-generation.md Section 4.0.7 / V35.
#
# Enforces common/directory-structure.md rules 4a/4b:
#   - ALL unit tests (including UI/component tests) live under tests/unit/, mirroring src/.
#     No sibling top-level folder like tests/components/ is allowed.
#   - API & Contract tests live ONLY under tests/api/ — never under tests/unit/, never
#     co-located with the endpoint's unit tests.
#   - No test-like file may live under src/ (this repo's stacks — Python, JS/JSX — do not use
#     co-located test conventions like Go's _test.go or Rust's #[cfg(test)]).
#
# Usage: check-test-placement.sh [<base-sha>]
#   <base-sha> optional — when given, scope the scan to files changed since that ref
#   (git diff --name-only <base-sha>...HEAD). With no argument, scans the whole tracked tree.
#
# Exit 0 with "verdict": "PASS" when no violation is found.
# Exit 1 with "verdict": "FAIL" and a list of violations when one is found.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BASE_SHA="${1:-}"

if [ -n "$BASE_SHA" ]; then
  FILES=$(git diff --name-only --diff-filter=ACMR "${BASE_SHA}...HEAD" -- . || true)
else
  # Whole-tree scan: tracked files plus untracked-but-not-ignored files (so a locally
  # misplaced fixture is caught before it is ever committed), excluding .git itself.
  FILES=$(git ls-files --cached --others --exclude-standard)
fi

# Test-like filename patterns across this repo's stacks (Python + JS/JSX) and the common
# cross-stack conventions this framework's other repos may introduce over time.
is_test_like() {
  case "$1" in
    *.test.js|*.test.jsx|*.test.ts|*.test.tsx) return 0 ;;
    *.spec.js|*.spec.jsx|*.spec.ts|*.spec.tsx) return 0 ;;
    */test_*.py|test_*.py) return 0 ;;
    *_test.py) return 0 ;;
    */__tests__/*) return 0 ;;
    *) return 1 ;;
  esac
}

violations=""
violation_count=0

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if is_test_like "$f"; then
    case "$f" in
      tests/unit/*) : ;;                    # correct — unit tests (incl. UI/component tests)
      tests/api/*) : ;;                     # correct — API & contract tests
      tests/behavior/*) : ;;                # correct — Gherkin step definitions / runners
      tests/e2e/*) : ;;                     # correct — Playwright specs
      src/*)
        violations="${violations}  - ${f}: test-like file under src/ (must live under tests/)\n"
        violation_count=$((violation_count + 1))
        ;;
      tests/*)
        # A test-like file directly under some other tests/<name>/ sibling folder —
        # e.g. tests/components/Foo.test.jsx — violates rule 4a (no sibling top-level folder).
        violations="${violations}  - ${f}: unit/component test outside tests/unit/ (found under a sibling tests/ folder)\n"
        violation_count=$((violation_count + 1))
        ;;
      *)
        violations="${violations}  - ${f}: test-like file outside any tests/ root\n"
        violation_count=$((violation_count + 1))
        ;;
    esac
  fi
done <<EOF
$FILES
EOF

mkdir -p tests/.evals/_run

if [ "$violation_count" -gt 0 ]; then
  {
    echo "{"
    echo "  \"verdict\": \"FAIL\","
    echo "  \"violationCount\": ${violation_count}"
    echo "}"
  } > tests/.evals/_run/test-placement.json
  echo "Test Placement Verification Gate: FAIL (${violation_count} violation(s))"
  printf '%b' "$violations"
  exit 1
fi

{
  echo "{"
  echo "  \"verdict\": \"PASS\","
  echo "  \"violationCount\": 0"
  echo "}"
} > tests/.evals/_run/test-placement.json
echo "Test Placement Verification Gate: PASS"
exit 0
