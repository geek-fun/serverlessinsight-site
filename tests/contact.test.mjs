import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {parse} from '@vue/compiler-dom'

const root = new URL('../dist/', import.meta.url)
const isCn = process.env.SITE_LINE === 'cn'
const siteOrigin = `https://www.serverlessinsight.${isCn ? 'cn' : 'com'}`
const consoleOrigin = `https://console.serverlessinsight.${isCn ? 'cn' : 'com'}`
const attr = (node, name) => node.props?.find((prop) => prop.type === 6 && prop.name === name)?.value?.content
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name)
const text = (node) => node.type === 2 ? node.content : (node.children ?? []).map(text).join('')

function find(node, predicate) {
  const result = []
  function visit(item) {
    if (item.type === 1 && predicate(item)) result.push(item)
    for (const child of item.children ?? []) visit(child)
  }
  visit(node)
  return result
}

for (const prefix of ['', 'en/']) {
  const contact = parse(readFileSync(new URL(`${prefix}contact.html`, root), 'utf8'))
  const main = find(contact, (node) => node.tag === 'main')[0]

  test(`${prefix}contact: body links stay on the ${isCn ? 'CN' : 'international'} line`, () => {
    const links = find(main, (node) => node.tag === 'a').map((node) => attr(node, 'href'))
    assert.ok(links.includes(siteOrigin), 'Contact details must link to the current site')
    assert.deepEqual(
      links.filter((href) => href?.startsWith('https://console.serverlessinsight.')),
      [consoleOrigin],
      'Contact details must use the same console as the navigation'
    )
  })

  test(`${prefix}contact: the body shows the ICP filing only on the CN line`, () => {
    const filings = find(main, (node) => node.tag === 'a' && attr(node, 'href') === 'https://beian.miit.gov.cn')
    assert.equal(filings.length, isCn ? 1 : 0)
    assert.equal(text(main).includes('ICP备'), isCn)
    if (isCn) assert.match(text(filings[0]), /^滇ICP备\d+号-\d+$/)
  })

  for (const slug of ['about', 'contact']) {
    test(`${prefix}${slug}: sidebar and pagination include both company pages`, () => {
      const tree = slug === 'contact' ? contact : parse(readFileSync(new URL(`${prefix}${slug}.html`, root), 'utf8'))
      const sidebar = find(tree, (node) => node.tag === 'aside' && hasClass(node, 'VPSidebar'))[0]
      assert.ok(sidebar, 'Company pages must retain the documentation sidebar')
      const sidebarLinks = find(sidebar, (node) => node.tag === 'a').map((node) => attr(node, 'href'))
      for (const page of ['about', 'contact']) assert.ok(sidebarLinks.includes(`/${prefix}${page}.html`))
      const previous = find(tree, (node) => hasClass(node, 'pager-link') && hasClass(node, 'prev'))
      const next = find(tree, (node) => hasClass(node, 'pager-link') && hasClass(node, 'next'))
      assert.deepEqual(previous.map((node) => attr(node, 'href')), [`/${prefix}${slug === 'about' ? 'case-study' : 'about'}.html`])
      assert.deepEqual(next.map((node) => attr(node, 'href')), slug === 'about' ? [`/${prefix}contact.html`] : [])
    })
  }
}
