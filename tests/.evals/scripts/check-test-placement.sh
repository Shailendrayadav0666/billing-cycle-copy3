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
#   (git diff --name-only --diff-filter=ACMR <base-sha>...HEAD). With no argument, scans the
#   whole tracked + untracked-but-not-ignored tree.
#
# Emits, per common/ci-pipeline-generation.md Section 4.0.7 Step 4, a JSON summary to stdout:
#   {"files_scanned": N, "violations": [{"path","classification","expected_root","reason"}, ...], "verdict": "PASS"|"FAIL"}
# Exit 0 on PASS, exit 1 on FAIL.

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

# api-test detection: a test-like file whose content imports/uses a real-endpoint test client.
is_api_test() {
  [ -f "$1" ] || return 1
  grep -qE 'supertest|httpx|TestClient|RestAssured|MockMvc' "$1" 2>/dev/null
}

files_scanned=0
violations_json="[]"

while IFS= read -r f; do
  [ -z "$f" ] && continue
  files_scanned=$((files_scanned + 1))
  is_test_like "$f" || continue

  if is_api_test "$f"; then
    classification="api-test"; expected_root="tests/api/"
  else
    classification="unit-test"; expected_root="tests/unit/"
  fi

  ok=0
  reason=""
  case "$f" in
    tests/behavior/*) ok=1 ;;   # correct — Gherkin step definitions / runners
    tests/e2e/*) ok=1 ;;        # correct — Playwright specs
    src/*)
      ok=0
      reason="test-like file under src/ — this stack has no co-located test convention (never Go _test.go / Rust #[cfg(test)]); must live under ${expected_root}"
      ;;
    tests/*)
      if [ "$classification" = "api-test" ]; then
        case "$f" in tests/api/*) ok=1 ;; *) ok=0; reason="API/contract test outside tests/api/ (found under a sibling tests/ folder) — never under tests/unit/, never co-located with the endpoint's unit tests" ;; esac
      else
        case "$f" in tests/unit/*) ok=1 ;; *) ok=0; reason="unit/component test outside tests/unit/ (found under a sibling tests/ folder, e.g. tests/components/) — rule 4a forbids a sibling top-level folder" ;; esac
      fi
      ;;
    *)
      ok=0
      reason="test-like file outside any tests/ root"
      ;;
  esac

  if [ "$ok" -eq 0 ]; then
    violations_json="$(printf '%s' "$violations_json" | jq -c \
      --arg path "$f" --arg classification "$classification" \
      --arg expected_root "$expected_root" --arg reason "$reason" \
      '. + [{"path":$path,"classification":$classification,"expected_root":$expected_root,"reason":$reason}]')"
  fi
done <<EOF
$FILES
EOF

violation_count="$(printf '%s' "$violations_json" | jq 'length')"
verdict="PASS"
[ "$violation_count" -gt 0 ] && verdict="FAIL"

mkdir -p tests/.evals/_run
summary="$(jq -nc --argjson files_scanned "$files_scanned" --argjson violations "$violations_json" --arg verdict "$verdict" \
  '{files_scanned: $files_scanned, violations: $violations, verdict: $verdict}')"

printf '%s\n' "$summary" > tests/.evals/_run/test-placement.json
printf '%s\n' "$summary"

[ "$verdict" = "PASS" ] && exit 0
exit 1
