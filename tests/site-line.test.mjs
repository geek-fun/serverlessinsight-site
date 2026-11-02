import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {runInNewContext} from 'node:vm'
import {transformWithEsbuild} from 'vite'

// Line derivation (#52 Phase M): endpoints are baked per build via the
// __SITE_LINE__ define. These tests compile the same theme modules Vite
// compiles and assert both bake results.
const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

async function compile(path) {
  const source = read(path)
  const {code} = await transformWithEsbuild(source, path, {format: 'cjs', loader: 'ts'})
  return code
}

function evaluateInLine(code, siteLine) {
  const module = {exports: {}}
  runInNewContext(code, {
    __SITE_LINE__: siteLine,
    module,
    exports: module.exports,
    require(name) {
      if (name === 'vue') return {reactive: (v) => v, onMounted: () => {}, onUnmounted: () => {}}
      if (name === './pricing-data.json') return {plans: {}}
      throw new Error(`Unexpected dependency: ${name}`)
    }
  })
  return module.exports
}

for (const [line, consoleUrl] of [
  ['intl', 'https://console.serverlessinsight.com'],
  ['cn', 'https://console.serverlessinsight.cn']
]) {
  test(`The ${line} build bakes the ${line} console endpoints`, async () => {
    const consoleExports = evaluateInLine(await compile('docs/.vitepress/theme/console.ts'), line)
    assert.equal(consoleExports.CONSOLE_URL, consoleUrl)
    assert.equal(consoleExports.CONSOLE_LOGIN_URL, `${consoleUrl}/login`)
    assert.equal(consoleExports.CONSOLE_GET_STARTED_URL, consoleUrl)
  })
  test(`The ${line} build bakes the ${line} pricing API`, async () => {
    const pricingExports = evaluateInLine(await compile('docs/.vitepress/theme/usePricing.ts'), line)
    assert.equal(pricingExports.PRICING_API, `${consoleUrl}/api/v1/pricing`)
  })
}

test('Compliance constants carry the CN filings and cross-line entry points', async () => {
  const compliance = evaluateInLine(await compile('docs/.vitepress/theme/compliance.ts'), 'cn')
  assert.match(compliance.ICP_NUMBER, /^滇ICP备\d+号-\d+$/)
  assert.equal(compliance.PSB_NUMBER, '')
  assert.ok(compliance.ICP_URL.includes('beian.miit.gov.cn'))
  assert.equal(compliance.SITE_URL_CN, 'https://www.serverlessinsight.cn')
  assert.equal(compliance.SITE_URL_INTL, 'https://www.serverlessinsight.com')
})

test('The footer renders filings and the sibling-site link only on the CN line', async () => {
  const footer = read('docs/.vitepress/theme/components/LandingFooter.vue')
  // Filings come from the single constants module, never inlined strings.
  assert.ok(footer.includes("from '../compliance'"))
  assert.ok(footer.includes('ICP_NUMBER'))
  // The sibling link points at the opposite line, both directions declared.
  assert.ok(footer.includes('SITE_URL_CN') && footer.includes('SITE_URL_INTL'))
})
