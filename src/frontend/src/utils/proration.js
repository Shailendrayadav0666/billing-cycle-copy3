const DAYS_IN_CYCLE = 30

export function computeProratedCharge(standardPrice, premiumPrice, daysRemaining, daysInCycle = DAYS_IN_CYCLE) {
  const raw = (premiumPrice - standardPrice) * (daysRemaining / daysInCycle)
  return Math.round(raw * 100) / 100
}

export function daysRemainingInCycle(renewAt, now = new Date()) {
  const renewDate = new Date(renewAt)
  const msPerDay = 24 * 60 * 60 * 1000
  const diffDays = Math.round((renewDate.getTime() - now.getTime()) / msPerDay)
  return Math.max(0, Math.min(DAYS_IN_CYCLE, diffDays))
}

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`
}
