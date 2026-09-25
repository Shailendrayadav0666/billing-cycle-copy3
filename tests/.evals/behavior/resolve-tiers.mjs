// Resolves which .feature files a behaviour tier runs (common/behavior-spec.md Section 6.0).
// Usage: node tests/.evals/behavior/resolve-tiers.mjs <b1|b2|b3> <unit-key>
// Prints one feature path per line on stdout; excluded (not started) units go to stderr.
import fs from 'node:fs'
import path from 'node:path'

const [tier, key] = process.argv.slice(2)
const STATUS_RANK = { 'Ready for Development': 0, 'In Development': 1, 'Ready for Testing': 2 }

function trackerRows(file) {
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\.\d+\s*\|/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .map((cells) => ({ story: cells[0], status: cells[4], recorded: cells[9] || '' }))
}

// Resolved view: shared table plus every work-unit fragment; later Recorded wins,
// then the more advanced status (common/parallel-work-state.md Section 4).
const resolved = new Map()
const sources = ['runtime-artifacts/aire-state.md']
const fragDir = 'runtime-artifacts/stories'
if (fs.existsSync(fragDir)) {
  for (const unit of fs.readdirSync(fragDir)) sources.push(path.join(fragDir, unit, 'state.md'))
}
for (const src of sources) {
  for (const row of trackerRows(src)) {
    const prev = resolved.get(row.story)
    const newer =
      !prev ||
      row.recorded > prev.recorded ||
      (row.recorded === prev.recorded && (STATUS_RANK[row.status] ?? 1) > (STATUS_RANK[prev.status] ?? 1))
    if (newer) resolved.set(row.story, row)
  }
}

function isActive(unit) {
  const m = /^story-(\d+\.\d+)$/.exec(unit)
  if (!m) return true
  const row = resolved.get(m[1])
  return !row || row.status !== 'Ready for Development'
}

const own = `spec/behavior/${key}.feature`
if (!fs.existsSync(own)) {
  console.error(`resolve-tiers: ${own} does not exist`)
  process.exit(2)
}
const others = fs
  .readdirSync('spec/behavior')
  .filter((f) => f.endsWith('.feature') && f !== `${key}.feature`)
  .sort()
const active = []
for (const f of others) {
  const unit = f.replace(/\.feature$/, '')
  if (isActive(unit)) active.push(`spec/behavior/${f}`)
  else console.error(`excluded (not started — Ready for Development): spec/behavior/${f}`)
}

let set
if (tier === 'b1') set = [own]
else if (tier === 'b2') set = active
else if (tier === 'b3') set = [own, ...active, 'spec/behavior.feature']
else {
  console.error(`resolve-tiers: unknown tier '${tier}'`)
  process.exit(2)
}
for (const f of set) console.log(f)
