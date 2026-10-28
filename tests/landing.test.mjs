import assert from 'node:assert/strict'
import {readFileSync, existsSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import test from 'node:test'
import {getAnnualMonthlyUsd} from '../docs/.vitepress/theme/pricing-utils.mjs'
import {parse} from '@vue/compiler-dom'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const pricing = JSON.parse(read('docs/.vitepress/theme/pricing-data.json'))
const documentationExample = read('docs/en/getting-started.md')
  .match(/A minimal deployable config[\s\S]*?```yaml\n([\s\S]*?)```/)[1]
  .trimEnd()

function descendants(node, predicate) {
  const result = []
  function visit(item) {
    if (item.type === 1 && predicate(item)) result.push(item)
    for (const child of item.children ?? []) visit(child)
  }
  visit(node)
  return result
}
const attribute = (node, name) => node.props?.find((prop) => prop.type === 6 && prop.name === name)?.value?.content
const byClass = (node, className) =>
  descendants(node, (item) => (attribute(item, 'class') ?? '').split(/\s+/).includes(className))
function text(node) {
  if (attribute(node, 'aria-hidden') === 'true') return ''
  return node.type === 2 ? node.content : (node.children ?? []).map(text).join('')
}

for (const locale of [
  {
    path: 'dist/index.html',
    language: 'zh-CN',
    prefix: '/',
    title: '全栈 Serverless 应用开发平台',
    closing: '让下一次部署，',
    legal: '隐私政策'
  },
  {
    path: 'dist/en/index.html',
    language: 'en',
    prefix: '/en/',
    title: 'Full-Stack Serverless Development Platform',
    closing: 'Bring clarity to your',
    legal: 'Privacy'
  }
]) {
  const html = read(locale.path)
  const page = parse(html)
  const main = descendants(page, (node) => node.tag === 'main')[0]
  test(`${locale.language}: server-rendered title, language and selected composition`, () => {
    assert.equal(attribute(descendants(page, (node) => node.tag === 'html')[0], 'lang'), locale.language)
    const headings = descendants(main, (node) => node.tag === 'h1')
    assert.equal(headings.length, 1)
    assert.equal(attribute(headings[0], 'aria-label'), locale.title)
    assert.equal(byClass(page, 'si-marketing').length, 1)
    assert.equal(byClass(page, 'VPNav').length, 1)
    assert.ok(text(main).includes(locale.closing))
    assert.ok(!text(main).includes('Put your next application in motion'))
  })
  test(`${locale.language}: keyboard-accessible default deployment tabs`, () => {
    const tabs = descendants(main, (node) => attribute(node, 'role') === 'tab')
    assert.equal(tabs.length, 2)
    assert.equal(attribute(tabs[0], 'aria-selected'), 'false')
    assert.equal(attribute(tabs[0], 'tabindex'), '-1')
    assert.equal(attribute(tabs[1], 'aria-selected'), 'true')
    assert.equal(attribute(tabs[1], 'tabindex'), '0')
    for (const tab of tabs) {
      const panel = descendants(main, (node) => attribute(node, 'id') === attribute(tab, 'aria-controls'))[0]
      assert.ok(panel)
      assert.equal(attribute(panel, 'role'), 'tabpanel')
      assert.equal(attribute(panel, 'aria-labelledby'), attribute(tab, 'id'))
    }
    const hiddenPanel = descendants(main, (node) => attribute(node, 'id') === 'configuration-panel')[0]
    assert.match(attribute(hiddenPanel, 'style'), /display:\s*none/)
  })
  test(`${locale.language}: workflow progresses from local development through validation to deployment`, () => {
    const steps = byClass(main, 'si-workflow__steps')[0]
    const commands = descendants(steps, (node) => node.tag === 'h3').map((heading) => text(heading).trim())
    assert.deepEqual(commands, ['si local', 'si validate', 'si deploy'])
  })
  test(`${locale.language}: copyable example matches the real documentation`, () => {
    const codeWindow = byClass(main, 'si-code-window')[0]
    const code = descendants(codeWindow, (node) => node.tag === 'code')[0]
    assert.equal(text(code), documentationExample)
    assert.ok(text(main).includes('npm install -g @geek-fun/serverlessinsight'))
    const copyButtons = descendants(main, (node) => node.tag === 'button' && attribute(node, 'title'))
    assert.equal(copyButtons.length, 2)
    assert.ok(copyButtons.every((button) => attribute(button, 'aria-label')))
  })
  test(`${locale.language}: correct signup destination and localized footer`, () => {
    const signup = descendants(
      page,
      (node) => node.tag === 'a' && attribute(node, 'href') === 'https://console.serverlessinsight.com/login'
    )
    assert.ok(signup.length >= 3)
    const footer = descendants(page, (node) => node.tag === 'footer')[0]
    assert.ok(text(footer).includes(locale.legal))
    assert.ok(
      descendants(footer, (node) => node.tag === 'a' && attribute(node, 'href') === `${locale.prefix}pricing.html`)
        .length
    )
  })
  test(`${locale.language}: header and footer use the existing ServerlessInsight logo asset`, () => {
    const marks = byClass(page, 'si-brand-mark')
    assert.equal(marks.length, 1)
    for (const mark of marks) {
      assert.equal(mark.tag, 'img')
      assert.equal(attribute(mark, 'src'), '/logo-dark.png')
      assert.equal(attribute(mark, 'width'), attribute(mark, 'height'))
      const alt = mark.props.find((prop) => prop.type === 6 && prop.name === 'alt')
      assert.ok(alt, 'Decorative brand images must have an explicit empty alternative')
      assert.equal(alt.value?.content ?? '', '')
      assert.equal(attribute(mark, 'aria-hidden'), 'true')
    }
    const header = descendants(page, (node) => node.tag === 'header')[0]
    const headerMarks = byClass(header, 'VPImage')
    assert.deepEqual(headerMarks.map((mark) => attribute(mark, 'src')).sort(), ['/logo-dark.png', '/logo.png'])
    for (const mark of headerMarks) {
      assert.equal(attribute(mark, 'width'), '36')
      assert.equal(attribute(mark, 'height'), '36')
      assert.equal(attribute(mark, 'alt') ?? '', '')
    }
    assert.ok(text(byClass(header, 'VPNavBarTitle')[0]).includes('ServerlessInsight'))
    const footer = descendants(page, (node) => node.tag === 'footer')[0]
    assert.equal(byClass(footer, 'si-brand-mark').length, 1)
    assert.ok(text(byClass(footer, 'si-wordmark')[0]).includes('ServerlessInsight'))
    assert.deepEqual(
      readFileSync(resolve(root, 'dist/logo-dark.png')),
      readFileSync(resolve(root, 'docs/public/logo-dark.png'))
    )
  })
  test(`${locale.language}: every local navigation target and fragment exists`, () => {
    const ids = descendants(page, (node) => attribute(node, 'id')).map((node) => attribute(node, 'id'))
    assert.equal(new Set(ids).size, ids.length, 'Element IDs must be unique')
    for (const anchor of descendants(page, (node) => node.tag === 'a')) {
      const href = attribute(anchor, 'href')
      if (!href || /^(https?:|mailto:)/.test(href)) continue
      const [path, fragment] = href.split('#')
      const target = !path ? locale.path : `dist${path.endsWith('/') ? path + 'index.html' : path}`
      assert.ok(existsSync(resolve(root, target)), `Missing page: ${href}`)
      if (fragment) {
        const targetPage = path ? parse(read(target)) : page
        assert.ok(
          descendants(targetPage, (node) => attribute(node, 'id') === decodeURIComponent(fragment)).length,
          `Missing anchor: ${href}`
        )
      }
    }
  })
  test(`${locale.language}: redesigned footer preserves the useful destinations from the standard footer`, () => {
    const footer = byClass(page, 'si-footer')[0]
    const standardPage = parse(read(`dist${locale.prefix}docs.html`))
    const standardFooter = byClass(standardPage, 'site-footer')[0]
    const destinations = descendants(footer, (node) => node.tag === 'a').map((node) => attribute(node, 'href'))
    for (const anchor of descendants(standardFooter, (node) => node.tag === 'a')) {
      const href = attribute(anchor, 'href')
      assert.ok(destinations.includes(href), `Footer destination was lost: ${href}`)
    }
    assert.equal(new Set(destinations).size, destinations.length, 'Avoid repeated footer destinations')
    assert.ok(destinations.includes(`${locale.prefix}#cloud-support`))
    assert.ok(destinations.includes(`${locale.prefix}refund-policy.html`))
    assert.ok(destinations.includes('https://github.com/geek-fun/serverlessinsight/issues'))
    assert.ok(destinations.includes('https://www.youtube.com/@geekfun-club'))
    assert.ok(text(footer).includes('© 2024–'))
    assert.ok(text(footer).includes('Apache-2.0'))
  })
  test(`${locale.language}: footer groups are labeled and external links open safely`, () => {
    const footer = byClass(page, 'si-footer')[0]
    const groups = descendants(footer, (node) => node.tag === 'nav')
    assert.equal(groups.length, 4)
    assert.equal(new Set(groups.map((group) => attribute(group, 'aria-label'))).size, 4)
    for (const group of groups) {
      assert.equal(attribute(group, 'aria-label'), text(descendants(group, (node) => node.tag === 'h2')[0]))
      assert.equal(descendants(group, (node) => node.tag === 'ul').length, 1)
      assert.ok(descendants(group, (node) => node.tag === 'li').length >= 3)
    }
    const external = descendants(footer, (node) => node.tag === 'a' && attribute(node, 'href').startsWith('https://'))
    assert.equal(external.length, 4)
    for (const anchor of external) {
      assert.equal(attribute(anchor, 'target'), '_blank')
      assert.ok(attribute(anchor, 'rel').includes('noopener'))
      assert.ok(attribute(anchor, 'rel').includes('noreferrer'))
    }
    for (const anchor of descendants(
      footer,
      (node) => node.tag === 'a' && !attribute(node, 'href').startsWith('https://')
    )) {
      assert.equal(attribute(anchor, 'target'), undefined)
    }
  })
  test(`${locale.language}: illustrative evidence and supported cloud targets`, () => {
    const providers = byClass(main, 'si-provider-list')[0]
    assert.equal(descendants(providers, (node) => node.tag === 'li').length, 3)
    assert.ok(!/AWS|Huawei|SOC 2|99\.99/.test(text(main)))
    const note = byClass(main, 'si-deployment__note')[0]
    assert.ok(text(note).includes(locale.language === 'en' ? 'Alibaba Cloud' : '阿里云'))
    const table = byClass(main, 'si-plan-table')[0]
    assert.equal(descendants(table, (node) => node.tag === 'caption').length, 1)
    assert.equal(descendants(table, (node) => node.tag === 'th' && attribute(node, 'scope') === 'row').length, 3)
  })
  test(`${locale.language}: full product story is present with usable section navigation`, () => {
    for (const id of ['features', 'stack', 'delivery', 'development', 'teams', 'use-cases', 'pricing', 'faq']) {
      const section = descendants(main, (node) => attribute(node, 'id') === id)[0]
      assert.ok(section, `Missing content section: ${id}`)
      assert.ok(attribute(section, 'aria-labelledby'), `Section needs a heading: ${id}`)
    }
    assert.equal(byClass(main, 'si-benefits').length, 1)
    assert.equal(byClass(main, 'si-case-list')[0].children.filter((node) => node.type === 1).length, 3)
    const header = descendants(page, (node) => node.tag === 'header')[0]
    assert.ok(
      descendants(header, (node) => node.tag === 'a' && attribute(node, 'href') === `${locale.prefix}#features`).length
    )
    assert.ok(
      descendants(header, (node) => node.tag === 'a' && attribute(node, 'href') === `${locale.prefix}pricing.html`)
        .length
    )
  })
  test(`${locale.language}: homepage explains usage billing and links to the dedicated plan comparison`, () => {
    const teaser = descendants(main, (node) => attribute(node, 'id') === 'pricing')[0]
    const content = text(teaser)
    for (const plan of ['Developer', 'Team', 'Enterprise']) assert.ok(content.includes(plan))
    assert.ok(content.includes(locale.language === 'en' ? 'free allowance' : '免费额度'))
    assert.ok(content.includes(locale.language === 'en' ? 'subscription' : '订阅'))
    assert.ok(content.includes(locale.language === 'en' ? 'billed separately' : '另行收取'))
    assert.equal(byClass(teaser, 'si-price-card').length, 0)
    assert.equal(descendants(teaser, (node) => node.tag === 'button').length, 0)
    assert.ok(!/\$\d|billed yearly|按年计费/.test(content))
    const links = descendants(teaser, (node) => node.tag === 'a')
    assert.equal(links.length, 1)
    assert.equal(attribute(links[0], 'href'), `${locale.prefix}pricing.html`)
    const fullPage = parse(read(`dist${locale.prefix}pricing.html`))
    assert.equal(byClass(fullPage, 'pp-card').length, 3)
    assert.equal(descendants(byClass(fullPage, 'pp-toggle')[0], (node) => node.tag === 'button').length, 2)
    assert.ok(text(fullPage).includes(getAnnualMonthlyUsd(pricing.plans.team)))
  })
  test(`${locale.language}: illustrative resource usage follows the billing source weights`, () => {
    const example = byClass(main, 'si-usage-example')[0]
    assert.equal(descendants(example, (node) => node.tag === 'figcaption').length, 1)
    assert.ok(text(example).includes(locale.language === 'en' ? 'Alibaba Cloud example' : '阿里云示例'))
    const weights = ['ALIYUN_FC3_FUNCTION', 'ALIYUN_OSS_BUCKET', 'ALIYUN_TABLESTORE_TABLE'].map(
      (code) => pricing.amr_weights[code]
    )
    const values = descendants(example, (node) => node.tag === 'dd').map((node) => text(node).trim())
    assert.deepEqual(
      values,
      weights.map((weight) => `${weight} AMR`)
    )
    const total = descendants(byClass(example, 'si-usage-example__total')[0], (node) => node.tag === 'strong')[0]
    assert.equal(
      text(total).trim(),
      `${weights.reduce((sum, weight) => sum + weight, 0)} ${locale.language === 'en' ? 'AMR / month' : 'AMR / 月'}`
    )
    assert.ok(
      text(byClass(example, 'si-usage-example__caption')[0]).includes(
        locale.language === 'en' ? 'Stage eligibility and monthly counting rules' : '阶段计费条件与月度统计规则'
      )
    )
  })
  test(`${locale.language}: FAQs are native, accessible disclosures with localized answers`, () => {
    const faq = byClass(main, 'si-faq__items')[0]
    assert.ok(!/shown above|prices above|上方列出|上方价格/.test(text(faq)))
    const details = descendants(faq, (node) => node.tag === 'details')
    assert.equal(details.length, 6)
    assert.equal(details.filter((node) => node.props.some((prop) => prop.name === 'open')).length, 1)
    for (const detail of details) {
      assert.equal(descendants(detail, (node) => node.tag === 'summary').length, 1)
      assert.ok(text(descendants(detail, (node) => node.tag === 'p')[0]).length > 30)
    }
  })
  test(`${locale.language}: console preview uses the real interface capture with labeled example data`, () => {
    const teamSection = descendants(main, (node) => attribute(node, 'id') === 'teams')[0]
    const copy = byClass(teamSection, 'si-teams__copy')[0]
    assert.ok(text(copy).includes(locale.language === 'en' ? 'One shared view.' : '共享的视图。'))
    assert.equal(descendants(copy, (node) => node.tag === 'li').length, 3)
    const consoleActions = descendants(copy, (node) => node.tag === 'a')
    assert.equal(consoleActions.length, 1)
    assert.equal(attribute(consoleActions[0], 'href'), 'https://console.serverlessinsight.com/login')
    assert.ok(text(consoleActions[0]).includes(locale.language === 'en' ? 'Explore the console' : '体验控制台'))
    const preview = byClass(teamSection, 'si-console-preview')[0]
    assert.ok(attribute(preview, 'aria-label').includes(locale.language === 'en' ? 'Example data' : '示例数据'))
    assert.equal(preview.tag, 'figure')
    const images = descendants(preview, (node) => node.tag === 'img')
    assert.equal(images.length, 1)
    const source = `/images/console-resources-${locale.language === 'en' ? 'en' : 'zh'}.jpg`
    assert.equal(attribute(images[0], 'src'), source)
    assert.ok(attribute(images[0], 'alt').includes('ServerlessInsight'))
    assert.equal(attribute(images[0], 'width'), '1280')
    assert.equal(attribute(images[0], 'height'), '900')
    assert.equal(attribute(images[0], 'loading'), 'lazy')
    assert.equal(attribute(images[0], 'decoding'), 'async')
    assert.equal(descendants(preview, (node) => node.tag === 'figcaption').length, 1)
    assert.ok(!/ACCESS_KEY|AKID|@|account_id|secret/i.test(text(preview)))
    assert.equal(descendants(preview, (node) => ['button', 'input', 'select', 'table'].includes(node.tag)).length, 0)
    const fullSizeLinks = descendants(preview, (node) => node.tag === 'a')
    assert.equal(fullSizeLinks.length, 1)
    assert.equal(attribute(fullSizeLinks[0], 'href'), source)
    assert.equal(attribute(fullSizeLinks[0], 'target'), '_blank')
    assert.equal(attribute(fullSizeLinks[0], 'rel'), 'noopener noreferrer')
    assert.deepEqual(readFileSync(resolve(root, `dist${source}`)), readFileSync(resolve(root, `docs/public${source}`)))
  })
  test(`${locale.language}: console screenshot is a complete JPEG with sanitized capture provenance`, () => {
    const source = `docs/public/images/console-resources-${locale.language === 'en' ? 'en' : 'zh'}.jpg`
    const asset = readFileSync(resolve(root, source))
    assert.deepEqual(asset.subarray(0, 2), Buffer.from([0xff, 0xd8]))
    assert.deepEqual(asset.subarray(-2), Buffer.from([0xff, 0xd9]))
    assert.ok(asset.length < 200000, 'Keep the lazy-loaded capture lightweight')
    assert.ok(asset.includes(Buffer.from('synthetic example workspace')))
    assert.ok(!asset.includes(Buffer.from('/Users/')))
    assert.ok(!asset.includes(Buffer.from('node_modules')))
  })
  test(`${locale.language}: document metadata and alternate locales survive the layout change`, () => {
    const links = descendants(page, (node) => node.tag === 'link')
    assert.ok(links.some((node) => attribute(node, 'rel') === 'canonical'))
    assert.ok(links.some((node) => attribute(node, 'hreflang') === 'en'))
    assert.ok(links.some((node) => attribute(node, 'hreflang') === 'zh-CN'))
    assert.ok(
      descendants(page, (node) => node.tag === 'meta' && attribute(node, 'property') === 'og:description').length
    )
  })
}
test('Documentation retains its standard layout and localized footer', () => {
  for (const [path, legal] of [
    ['dist/en/docs.html', 'Terms'],
    ['dist/docs.html', '服务条款']
  ]) {
    const page = parse(read(path))
    assert.equal(byClass(page, 'si-marketing').length, 0)
    assert.ok(byClass(page, 'VPNav').length)
    assert.ok(byClass(page, 'site-footer').length)
    assert.ok(text(byClass(page, 'site-footer')[0]).includes(legal))
  }
})

for (const prefix of ['/', '/en/']) {
  test(`${prefix}: shared navigation and signup actions across home, pricing and documentation`, () => {
    const expected = [`${prefix}#features`, `${prefix}#cloud-support`, `${prefix}pricing.html`, `${prefix}docs.html`]
    let homeLabels
    for (const name of [
      'index',
      'pricing',
      'docs',
      'getting-started',
      'reference',
      'cli',
      'terms',
      'privacy',
      'refund-policy'
    ]) {
      const page = parse(read(`dist${prefix}${name}.html`))
      const headers = byClass(page, 'VPNav')
      assert.equal(headers.length, 1, `${name}: one shared header`)
      const header = headers[0]
      const menu = byClass(header, 'VPNavBarMenu')[0]
      const links = descendants(menu, (node) => node.tag === 'a')
      assert.deepEqual(
        links.map((node) => attribute(node, 'href')),
        expected,
        name
      )
      const labels = links.map(text)
      homeLabels ??= labels
      assert.deepEqual(labels, homeLabels, `${name}: matching labels and order`)
      assert.equal(descendants(header, (node) => attribute(node, 'href') === '#pricing').length, 0)
      assert.equal(byClass(header, 'si-nav-actions').length, 1)
      assert.equal(
        byClass(header, prefix === '/' ? 'auth-nav--zh' : 'auth-nav--en').length,
        1,
        `${name}: route-based auth locale`
      )
      assert.equal(
        attribute(descendants(page, (node) => node.tag === 'html')[0], 'lang'),
        prefix === '/' ? 'zh-CN' : 'en'
      )
      assert.equal(attribute(byClass(header, 'si-nav-start')[0], 'href'), 'https://console.serverlessinsight.com/login')
      assert.equal(byClass(header, 'VPNavBarHamburger').length, 1)
      assert.equal(
        byClass(header, 'VPSwitchAppearance').length,
        2,
        `${name}: native desktop and overflow theme controls`
      )
      const translations = byClass(header, 'VPNavBarTranslations')[0]
      const otherPrefix = prefix === '/' ? '/en/' : '/'
      const counterpart = name === 'index' ? otherPrefix : `${otherPrefix}${name}.html`
      assert.ok(
        descendants(translations, (node) => node.tag === 'a' && attribute(node, 'href') === counterpart).length,
        `${name}: language switch preserves the current page`
      )
      if (name === 'pricing' || name === 'docs') {
        const active = links.filter((node) => (attribute(node, 'class') ?? '').split(' ').includes('active'))
        assert.deepEqual(
          active.map((node) => attribute(node, 'href')),
          [`${prefix}${name}.html`]
        )
      }
    }
  })
}

for (const prefix of ['/', '/en/']) {
  test(`${prefix}: pricing preserves plan facts, accessible billing selection and resource comparison`, () => {
    const page = parse(read(`dist${prefix}pricing.html`))
    const pricingPage = byClass(page, 'pp')[0]
    assert.equal(attribute(pricingPage, 'aria-labelledby'), 'pricing-title')
    const cards = byClass(pricingPage, 'pp-card')
    assert.deepEqual(
      cards.map((card) => text(byClass(card, 'pp-card-name')[0])),
      ['Developer', 'Team', 'Enterprise']
    )
    assert.equal(byClass(pricingPage, 'pp-card--featured').length, 1)
    assert.ok(!text(pricingPage).includes('undefined'))
    if (prefix === '/en/') {
      assert.ok(text(cards[0]).includes('1 member (hard quota)'))
      assert.ok(text(cards[1]).includes(`${pricing.plans.team.free_members} members (hard quota)`))
      assert.ok(text(cards[1]).includes(`${pricing.plans.team.free_workspaces} workspaces included`))
    }
    const buttons = descendants(byClass(pricingPage, 'pp-toggle')[0], (node) => node.tag === 'button')
    assert.deepEqual(
      buttons.map((button) => attribute(button, 'aria-pressed')),
      ['false', 'true']
    )
    assert.ok(text(pricingPage).includes(getAnnualMonthlyUsd(pricing.plans.team)))
    const resourceTable = byClass(pricingPage, 'pp-table')[0]
    assert.equal(descendants(resourceTable, (node) => node.tag === 'caption').length, 1)
    assert.equal(
      descendants(resourceTable, (node) => node.tag === 'th' && attribute(node, 'scope') === 'col').length,
      2
    )
    assert.ok(descendants(pricingPage, (node) => node.tag === 'details').length >= 4)
    const footer = byClass(page, 'si-footer')[0]
    assert.equal(descendants(footer, (node) => node.tag === 'nav').length, 4)
    assert.ok(descendants(footer, (node) => attribute(node, 'src') === '/logo-dark.png').length)
    assert.ok(descendants(footer, (node) => attribute(node, 'href') === `${prefix}#cloud-support`).length)
  })
}

test('Legal page outlines use the supported deep range so client initialization can finish', () => {
  for (const prefix of ['', 'en/']) {
    for (const name of ['terms', 'privacy', 'refund-policy']) {
      const source = read(`docs/${prefix}${name}.md`)
      const frontmatter = source.split('---')[1]
      assert.match(frontmatter, /outline: deep/)
      assert.doesNotMatch(frontmatter, /outline: true/)
    }
  }
})
