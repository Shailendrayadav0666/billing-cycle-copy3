module.exports = {
  default: {
    require: ['./tests/behavior/steps/_register.cjs', './tests/behavior/steps/common_steps.cjs'],
    paths: [process.env.AIRE_FEATURE_GLOB || 'spec/behavior/story-1.1.feature'],
    format: ['summary', 'progress'],
    formatOptions: { snippetInterface: 'synchronous' },
  },
}
