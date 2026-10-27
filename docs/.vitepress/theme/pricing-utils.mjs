/** Shared USD display and annual billing calculations for marketing surfaces. */
export function formatUsd(cents) {
  if (cents == null || !Number.isFinite(cents)) return '—'
  const value = cents / 100
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}`
}
export function getAnnualBaseCents(plan) {
  return plan.annual_base_cents ?? (plan.monthly_base_cents ?? 0) * 10
}
export function getAnnualMonthlyUsd(plan) {
  const monthly = Math.floor((getAnnualBaseCents(plan) / 1200) * 10) / 10
  return formatUsd(Math.round(monthly * 100))
}
export function getAnnualSavings(plan) {
  if (!(plan.monthly_base_cents > 0)) return 0
  return Math.max(0, Math.round((1 - getAnnualBaseCents(plan) / (plan.monthly_base_cents * 12)) * 100))
}
