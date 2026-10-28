import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {runInNewContext} from 'node:vm'
import {transformWithEsbuild} from 'vite'

const sourceUrl = new URL('../docs/.vitepress/theme/usePricing.ts', import.meta.url)
const snapshot = JSON.parse(readFileSync(new URL('../docs/.vitepress/theme/pricing-data.json', import.meta.url)))
const {code} = await transformWithEsbuild(readFileSync(sourceUrl, 'utf8'), sourceUrl.pathname, {format: 'cjs'})

function createHarness(fetch) {
  const mounted = []
  const unmounted = []
  const module = {exports: {}}
  runInNewContext(code, {
    module,
    exports: module.exports,
    structuredClone,
    AbortController,
    fetch,
    require(name) {
      if (name === 'vue') {
        return {
          reactive: (value) => value,
          onMounted: (callback) => mounted.push(callback),
          onUnmounted: (callback) => unmounted.push(callback)
        }
      }
      if (name === './pricing-data.json') return snapshot
      throw new Error(`Unexpected dependency: ${name}`)
    }
  })
  const state = module.exports.usePricing()
  return {state, mount: () => mounted[0](), unmount: () => unmounted[0](), usePricing: module.exports.usePricing}
}

test('Pricing snapshots are independent per render and do not mutate the imported data', () => {
  const harness = createHarness(() => {
    throw new Error('Fetch must wait until mounted')
  })
  const second = harness.usePricing()
  harness.state.plans.team.monthly_base_cents = 1234
  assert.equal(second.plans.team.monthly_base_cents, snapshot.plans.team.monthly_base_cents)
  assert.equal(snapshot.plans.team.monthly_base_cents, second.plans.team.monthly_base_cents)
  harness.unmount()
})

test('A successful refresh updates displayed prices and allowances with a cancellable uncached request', async () => {
  let request
  const updated = structuredClone(snapshot)
  updated.plans.team.monthly_base_cents = 9900
  updated.plans.developer.free_amr = 20
  const harness = createHarness(async (url, options) => {
    request = {url, options}
    return {ok: true, json: async () => ({code: 2000, data: updated})}
  })
  await harness.mount()
  assert.equal(harness.state.plans.team.monthly_base_cents, 9900)
  assert.equal(harness.state.plans.developer.free_amr, 20)
  assert.equal(request.url, 'https://console.serverlessinsight.com/api/v1/pricing')
  assert.equal(request.options.cache, 'no-store')
  assert.equal(request.options.signal.aborted, false)
  harness.unmount()
  assert.equal(request.options.signal.aborted, true)
})

test('An HTTP error keeps the usable build-time snapshot without parsing the response', async () => {
  const harness = createHarness(async () => ({
    ok: false,
    json: () => {
      throw new Error('Must not parse')
    }
  }))
  await harness.mount()
  assert.deepEqual(harness.state, snapshot)
})

for (const [name, body] of [
  ['application error', {code: 5000, data: snapshot}],
  ['empty response', null],
  ['missing developer plan', {code: 2000, data: {plans: {team: {}, enterprise: {}}}}],
  ['missing team plan', {code: 2000, data: {plans: {developer: {}, enterprise: {}}}}],
  ['missing enterprise plan', {code: 2000, data: {plans: {developer: {}, team: {}}}}]
]) {
  test(`A pricing refresh with ${name} preserves every plan in the snapshot`, async () => {
    const harness = createHarness(async () => ({ok: true, json: async () => body}))
    await harness.mount()
    assert.deepEqual(harness.state, snapshot)
  })
}

for (const phase of ['network', 'json']) {
  test(`A ${phase} failure leaves pricing available`, async () => {
    const fail = () => {
      throw new Error('Unavailable')
    }
    const harness = createHarness(phase === 'network' ? fail : async () => ({ok: true, json: fail}))
    await harness.mount()
    assert.deepEqual(harness.state, snapshot)
  })
}
