#!/usr/bin/env node
// Resolves which spec/behavior/<key>.feature files are ACTIVE for the B2/B3 behaviour tiers,
// per common/behavior-spec.md Section 6.0 (activation rule) and Section 6.1 (last-unit detection).
// A unit's feature file is ACTIVE only if its Story Tracker row is NOT "Ready for Development".
// Deterministic, reads only runtime-artifacts/aire-state.md and the spec/behavior/ directory listing
// already on disk -- never invents a story.
'use strict'
const fs = require('fs')
const path = require('path')

const [, , storyKey, tier] = process.argv
if (!storyKey || !tier) {
  console.error('usage: resolve-active-features.cjs <this-story-key> <b2|b3>')
  process.exit(1)
}

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const statePath = path.join(repoRoot, 'runtime-artifacts', 'aire-state.md')
const behaviorDir = path.join(repoRoot, 'spec', 'behavior')

const state = fs.readFileSync(statePath, 'utf8')

// Parse the '## Story Tracker' markdown table: | Story | Title | Requires | Tracker ID | Status | ...
const trackerSectionMatch = state.match(/## Story Tracker\n([\s\S]*?)\n\n/)
const trackerBlock = trackerSectionMatch ? trackerSectionMatch[1] : ''
const rows = trackerBlock
  .split('\n')
  .filter((l) => l.trim().startsWith('|') && !l.includes('---') && !l.includes('Story |'))
  .map((l) => l.split('|').map((c) => c.trim()).filter((c) => c.length))

// rows: [Story, Title, Requires, TrackerID, Status, PR, Merged, Start, End, Recorded]
const storyStatus = {}
const storyMerged = {}
for (const r of rows) {
  if (r.length < 5) continue
  const id = r[0]
  storyStatus[`story-${id}`] = r[4]
  storyMerged[`story-${id}`] = (r[6] || '').toLowerCase() === 'yes'
}

const allFeatureFiles = fs.existsSync(behaviorDir)
  ? fs.readdirSync(behaviorDir).filter((f) => f.endsWith('.feature'))
  : []

function isActive(key) {
  const status = storyStatus[key]
  if (!status) return true // conservative: no tracker row -> treat as active (legacy behaviour)
  return status !== '🟢 Ready for Development' && !status.includes('Ready for Development')
}

if (tier === 'b2') {
  const others = allFeatureFiles
    .map((f) => f.replace(/\.feature$/, ''))
    .filter((key) => key !== storyKey)
    .filter((key) => isActive(key))
  console.log(others.map((k) => `spec/behavior/${k}.feature`).join(' '))
  process.exit(0)
}

if (tier === 'b3') {
  // Last unit iff every OTHER unit's PR is merged (Section 6.1) -- checked via the Merged column
  // already recorded in the Story Tracker (this script never calls `gh`; the caller/dev-implement
  // workflow is responsible for live-verifying merge state before invoking this tier).
  const otherKeys = allFeatureFiles.map((f) => f.replace(/\.feature$/, '')).filter((k) => k !== storyKey)
  const allOthersMerged = otherKeys.every((k) => storyMerged[k] === true) // empty array -> true (single-unit cycle)
  if (!allOthersMerged) {
    console.log('')
    process.exit(0)
  }
  const active = allFeatureFiles.map((k) => `spec/behavior/${k}`).concat(['spec/behavior.feature'])
  console.log(active.join(' '))
  process.exit(0)
}

console.error(`unknown tier: ${tier}`)
process.exit(1)
