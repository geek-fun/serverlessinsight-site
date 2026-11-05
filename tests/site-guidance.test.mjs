import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {runInNewContext} from 'node:vm'
import {transformWithEsbuild} from 'vite'

const source = readFileSync(new URL('../docs/.vitepress/theme/site-guidance.ts', import.meta.url), 'utf8')
const {code} = await transformWithEsbuild(source, 'site-guidance.ts', {format: 'cjs', loader: 'ts'})
const module = {exports: {}}
runInNewContext(code, {
  module, exports: module.exports, URL,
  require: (name) => {
    assert.equal(name, './compliance')
    return {SITE_URL_CN: 'https://www.serverlessinsight.cn'}
  }
})
const {suggestCnSite} = module.exports
const input = {
  siteLine: 'intl', languages: ['en-US'], timeZone: 'America/New_York',
  preference: null, currentHref: 'https://www.serverlessinsight.com/en/docs.html?campaign=example#deploy'
}

test('An international visitor without a domestic signal sees no suggestion', () => {
  assert.equal(suggestCnSite(input), null)
})
for (const language of ['zh-CN', 'zh-Hans', 'zh-Hans-CN', 'ZH-cn']) {
  test(`Simplified Chinese ${language} suggests the matching China page without redirecting`, () => {
    assert.equal(suggestCnSite({...input, languages: [language]}), 'https://www.serverlessinsight.cn/en/docs.html#deploy')
  })
}
test('Shanghai time zone can suggest the domestic site for an English browser', () => {
  assert.ok(suggestCnSite({...input, timeZone: 'Asia/Shanghai'}))
})
test('Traditional Chinese alone does not infer a domestic preference', () => {
  assert.equal(suggestCnSite({...input, languages: ['zh-TW', 'zh-HK']}), null)
})
for (const preference of ['cn', 'intl']) {
  test(`A saved ${preference} choice suppresses repeated prompts`, () => {
    assert.equal(suggestCnSite({...input, languages: ['zh-CN'], preference}), null)
  })
}
test('The domestic build never suggests switching to itself', () => {
  assert.equal(suggestCnSite({...input, siteLine: 'cn', languages: ['zh-CN'], timeZone: 'Asia/Shanghai'}), null)
})
test('Unavailable or old storage values still allow a suggestion', () => {
  assert.ok(suggestCnSite({...input, preference: 'old-value', languages: ['zh-CN']}))
})
for (const currentHref of ['not-a-url', 'javascript:alert(1)']) {
  test(`Unusable page URL is ignored: ${currentHref}`, () => {
    assert.equal(suggestCnSite({...input, languages: ['zh-CN'], currentHref}), null)
  })
}
test('The destination host stays domestic even for an unusual current pathname', () => {
  const url = suggestCnSite({...input, languages: ['zh-CN'], currentHref: 'https://www.serverlessinsight.com//other.example/path'})
  assert.equal(new URL(url).origin, 'https://www.serverlessinsight.cn')
})
