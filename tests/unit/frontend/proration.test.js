import { describe, expect, it } from 'vitest'
import { computeProratedCharge, daysRemainingInCycle, formatCurrency } from '../../../src/frontend/src/utils/proration'

describe('computeProratedCharge', () => {
  it.each([
    [0, 0.0],
    [15, 10.0],
    [30, 20.0],
    [1, 0.67],
    [29, 19.33],
  ])('computes the correct prorated charge for %i days remaining', (daysRemaining, expected) => {
    expect(computeProratedCharge(20, 40, daysRemaining, 30)).toBeCloseTo(expected, 2)
  })
})

describe('daysRemainingInCycle', () => {
  it('computes the whole-day difference between now and the renewal date', () => {
    const now = new Date('2026-09-23T00:00:00Z')
    const renewAt = new Date('2026-10-08T00:00:00Z') // 15 days later
    expect(daysRemainingInCycle(renewAt.toISOString(), now)).toBe(15)
  })

  it('never returns a negative number', () => {
    const now = new Date('2026-10-10T00:00:00Z')
    const renewAt = new Date('2026-10-01T00:00:00Z')
    expect(daysRemainingInCycle(renewAt.toISOString(), now)).toBe(0)
  })

  it('never exceeds the 30-day cycle length', () => {
    const now = new Date('2026-09-01T00:00:00Z')
    const renewAt = new Date('2026-12-01T00:00:00Z')
    expect(daysRemainingInCycle(renewAt.toISOString(), now)).toBe(30)
  })
})

describe('formatCurrency', () => {
  it('formats to 2 decimal places with a dollar sign', () => {
    expect(formatCurrency(10)).toBe('$10.00')
    expect(formatCurrency(0.666666)).toBe('$0.67')
  })
})
