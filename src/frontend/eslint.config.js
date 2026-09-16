// Minimal ESLint config — used ONLY for the D6 cyclomatic complexity gate (oxlint, this repo's
// primary linter for D1, has no configurable complexity threshold). Bootstrapped per
// aire-workflow/common/eval-framework.md Section 2.3 (recommended preset, not strict/all) and
// aire-workflow/common/ci-pipeline-generation.md Section 3.0c (the gate MUST reference the
// threshold from tests/.evals/config.json via AIRE_MAX_CYCLOMATIC_COMPLEXITY — never a hardcoded
// literal).
export default [
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    rules: {
      complexity: [
        "error",
        { max: parseInt(process.env.AIRE_MAX_CYCLOMATIC_COMPLEXITY || "12", 10) },
      ],
    },
  },
];
