/** Shared money display and annual billing calculations for marketing surfaces. */
const CURRENCY_SYMBOLS = {USD: '$', CNY: '¥'}

/**
 * Dual-currency display (#52 Phase M): the pricing API payload carries its own
 * `currency` (USD on the international line, CNY once the domestic console is
 * live) — unknown codes fall back to an ISO prefix so a new currency can never
 * render as a wrong symbol.
 */
export function formatCents(cents, currency = 'USD') {
  if (cents == null || !Number.isFinite(cents)) return '—'
  const value = cents / 100
  const formatted = Number.isInteger(value) ? `${value}` : `${value.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}`
  const symbol = CURRENCY_SYMBOLS[currency]
  return symbol ? `${symbol}${formatted}` : `${currency} ${formatted}`
}
export function formatUsd(cents) {
  return formatCents(cents, 'USD')
}
export function getAnnualBaseCents(plan) {
  return plan.annual_base_cents ?? (plan.monthly_base_cents ?? 0) * 10
}
export function getAnnualMonthlyAmount(plan, currency = 'USD') {
  const monthly = Math.floor((getAnnualBaseCents(plan) / 1200) * 10) / 10
  return formatCents(Math.round(monthly * 100), currency)
}
export const getAnnualMonthlyUsd = (plan) => getAnnualMonthlyAmount(plan, 'USD')
export function getAnnualSavings(plan) {
  if (!(plan.monthly_base_cents > 0)) return 0
  return Math.max(0, Math.round((1 - getAnnualBaseCents(plan) / (plan.monthly_base_cents * 12)) * 100))
}
