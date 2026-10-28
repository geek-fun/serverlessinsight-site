import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatUsd,
  getAnnualBaseCents,
  getAnnualMonthlyUsd,
  getAnnualSavings
} from '../docs/.vitepress/theme/pricing-utils.mjs'

test('USD display preserves free, integer, decimal and sub-dollar amounts', () => {
  assert.equal(formatUsd(0), '$0')
  assert.equal(formatUsd(7900), '$79')
  assert.equal(formatUsd(6580), '$65.8')
  assert.equal(formatUsd(6599), '$65.99')
  assert.equal(formatUsd(5), '$0.05')
})
test('Missing or invalid amounts never appear as a free plan', () => {
  for (const value of [undefined, null, NaN, Infinity, '7900']) assert.equal(formatUsd(value), '—')
})
test('Annual billing prefers the explicit API amount', () => {
  assert.equal(getAnnualBaseCents({monthly_base_cents: 7900, annual_base_cents: 75000}), 75000)
  assert.equal(getAnnualBaseCents({monthly_base_cents: 7900, annual_base_cents: 0}), 0)
})
test('Legacy pricing payloads retain the existing ten-month annual rule', () => {
  assert.equal(getAnnualBaseCents({monthly_base_cents: 7900}), 79000)
  assert.equal(getAnnualBaseCents({monthly_base_cents: 7900, annual_base_cents: null}), 79000)
  assert.equal(getAnnualBaseCents({}), 0)
})
test('Annual monthly equivalent retains the pricing page truncation rule', () => {
  assert.equal(getAnnualMonthlyUsd({monthly_base_cents: 7900}), '$65.8')
  assert.equal(getAnnualMonthlyUsd({monthly_base_cents: 7900, annual_base_cents: 75000}), '$62.5')
  assert.equal(getAnnualMonthlyUsd({monthly_base_cents: 1200, annual_base_cents: 12000}), '$10')
  assert.equal(getAnnualMonthlyUsd({}), '$0')
})
test('Savings are calculated against twelve monthly payments', () => {
  assert.equal(getAnnualSavings({monthly_base_cents: 7900}), 17)
  assert.equal(getAnnualSavings({monthly_base_cents: 7900, annual_base_cents: 75000}), 21)
})
test('Free or more expensive annual pricing does not claim misleading savings', () => {
  assert.equal(getAnnualSavings({}), 0)
  assert.equal(getAnnualSavings({monthly_base_cents: 0}), 0)
  assert.equal(getAnnualSavings({monthly_base_cents: 100, annual_base_cents: 1300}), 0)
})
