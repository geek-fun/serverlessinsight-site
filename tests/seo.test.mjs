import assert from 'node:assert/strict'
import {readFileSync, existsSync, readdirSync} from 'node:fs'
import test from 'node:test'
import {parse} from '@vue/compiler-dom'
import {
  createSeoHooks,
  formatPageTitle,
  LOCALIZED_PAGES,
  routeFromRelativePath,
  serializeJsonLd,
  SITE_ORIGIN
} from '../docs/.vitepress/seo.mjs'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const attr = (node, name) => node.props?.find((prop) => prop.type === 6 && prop.name === name)?.value?.content
function find(node, predicate) {
  const result = []
  function visit(item) {
    if (item.type === 1 && predicate(item)) result.push(item)
    for (const child of item.children ?? []) visit(child)
  }
  visit(node)
  return result
}
const text = (node) => (node.type === 2 ? node.content : (node.children ?? []).map(text).join(''))
const page = (relativePath = 'en/docs.md', overrides = {}) => ({
  relativePath,
  title: 'Documentation',
  description: 'Page-specific documentation summary.',
  frontmatter: {},
  ...overrides
})
const meta = (p, key) =>
  p.frontmatter.head.find(([tag, attrs]) => tag === 'meta' && (attrs.name ?? attrs.property) === key)?.[1].content
const links = (p, rel) => p.frontmatter.head.filter(([tag, attrs]) => tag === 'link' && attrs.rel === rel)
const graph = (p) =>
  JSON.parse(p.frontmatter.head.find(([tag, attrs]) => tag === 'script' && attrs.id === 'si-structured-data')[2])[
    '@graph'
  ]

test('Canonical routes preserve the existing .html URLs and locale homepage paths', () => {
  assert.equal(routeFromRelativePath('index.md'), '/')
  assert.equal(routeFromRelativePath('en/index.md'), '/en/')
  assert.equal(routeFromRelativePath('en/reference.md'), '/en/reference.html')
  assert.equal(routeFromRelativePath('guide/index.md'), '/guide/')
})

test('Titles follow the renderer template and avoid repeating the site identity', () => {
  assert.equal(formatPageTitle(page()), 'Documentation | ServerlessInsight')
  assert.equal(formatPageTitle(page('index.md', {title: 'ServerlessInsight'})), 'ServerlessInsight')
  assert.equal(formatPageTitle(page('index.md', {title: 'Title', titleTemplate: false})), 'Title')
  assert.equal(formatPageTitle(page('index.md', {title: 'Title', titleTemplate: ':title — Custom'})), 'Title — Custom')
  assert.equal(formatPageTitle(page('index.md', {title: 'Title', titleTemplate: 'Custom'})), 'Title | Custom')
})

test('Frontmatter descriptions are authoritative and social summaries match search metadata', () => {
  const p = page('en/docs.md', {frontmatter: {description: 'An authored page summary.'}})
  createSeoHooks().transformPageData(p)
  assert.equal(p.description, 'An authored page summary.')
  assert.equal(meta(p, 'og:description'), p.description)
  assert.equal(meta(p, 'twitter:description'), p.description)
  assert.equal(meta(p, 'og:title'), 'Documentation | ServerlessInsight')
  assert.equal(links(p, 'canonical')[0][1].href, `${SITE_ORIGIN}/en/docs.html`)
})

test('Known translated pages include reciprocal alternates, including all legal documents', () => {
  for (const slug of ['privacy.md', 'terms.md', 'refund-policy.md']) {
    const zh = page(slug),
      en = page(`en/${slug}`)
    const hooks = createSeoHooks()
    hooks.transformPageData(zh)
    hooks.transformPageData(en)
    assert.deepEqual(links(zh, 'alternate'), links(en, 'alternate'))
    assert.deepEqual(
      links(en, 'alternate').map((entry) => entry[1].hreflang),
      ['en', 'zh-CN', 'x-default']
    )
  }
  const unpaired = page('guide.md')
  createSeoHooks().transformPageData(unpaired)
  assert.equal(links(unpaired, 'alternate').length, 0)
})

test('404, contributor and legacy helper pages cannot leak into the sitemap or canonical graph', () => {
  const hooks = createSeoHooks()
  for (const path of ['404.md', 'CONTRIBUTING.md', 'case-study/serverlessInsight-depseek.md']) {
    const p = page(path)
    hooks.transformPageData(p)
    assert.match(meta(p, 'robots'), /noindex/)
    assert.equal(links(p, 'canonical').length, 0)
    assert.ok(!p.frontmatter.head.some(([tag]) => tag === 'script'))
  }
  const custom = page('draft.md', {frontmatter: {head: [['meta', {name: 'robots', content: 'noindex, nosnippet'}]]}})
  hooks.transformPageData(custom)
  assert.equal(meta(custom, 'robots'), 'noindex, nosnippet')
  const urls = [
    '404.html',
    'CONTRIBUTING.html',
    'case-study/serverlessInsight-depseek.html',
    'draft.html',
    'en/docs.html'
  ]
  assert.deepEqual(
    hooks.transformSitemap(urls.map((url) => ({url}))).map(({url}) => url),
    ['en/docs.html']
  )
})

test('Explicit snippet controls and unrelated head entries survive repeated metadata transforms', () => {
  const hooks = createSeoHooks()
  const p = page('en/docs.md', {
    frontmatter: {
      head: [
        ['meta', {name: 'robots', content: 'index, follow, max-snippet:40'}],
        ['meta', {name: 'author', content: 'Example author'}]
      ]
    }
  })
  hooks.transformPageData(p)
  const head = structuredClone(p.frontmatter.head)
  hooks.transformPageData(p)
  assert.deepEqual(p.frontmatter.head, head)
  assert.equal(meta(p, 'robots'), 'index, follow, max-snippet:40')
  assert.equal(meta(p, 'author'), 'Example author')
})

test('Home identity describes the public open-source project without fabricated offers or reviews', () => {
  const p = page('en/index.md', {title: 'ServerlessInsight — Full-Stack Serverless Development Platform'})
  createSeoHooks().transformPageData(p)
  assert.equal(p.titleTemplate, false)
  assert.equal(meta(p, 'og:title'), p.title)
  const nodes = graph(p)
  assert.deepEqual(
    nodes.map((node) => node['@type']),
    ['Organization', 'WebSite', 'SoftwareSourceCode', 'WebPage']
  )
  assert.equal(nodes[2].codeRepository, 'https://github.com/geek-fun/serverlessinsight')
  assert.equal(nodes[2].license, 'https://www.apache.org/licenses/LICENSE-2.0')
  assert.ok(!JSON.stringify(nodes).match(/aggregateRating|reviewCount|priceCurrency|Offer|SearchAction/))
})

test('Breadcrumbs follow home → documentation → reference and keep pricing directly below home', () => {
  const hooks = createSeoHooks()
  const reference = page('en/reference.md', {title: 'Configuration Reference'})
  hooks.transformPageData(reference)
  const breadcrumb = graph(reference).find((node) => node['@type'] === 'BreadcrumbList')
  assert.deepEqual(
    breadcrumb.itemListElement.map((item) => item.item),
    [`${SITE_ORIGIN}/en/`, `${SITE_ORIGIN}/en/docs.html`, `${SITE_ORIGIN}/en/reference.html`]
  )
  assert.deepEqual(
    breadcrumb.itemListElement.map((item) => item.position),
    [1, 2, 3]
  )
  const pricing = page('pricing.md', {title: '定价'})
  hooks.transformPageData(pricing)
  assert.equal(graph(pricing)[0].itemListElement.length, 2)
})

test('Serialized JSON-LD cannot close its script element or inject markup', () => {
  const data = {name: '</script><script>alert("x")</script>', description: '& > \u2028\u2029'}
  const encoded = serializeJsonLd(data)
  assert.ok(!/[<>&\u2028\u2029]/.test(encoded))
  assert.deepEqual(JSON.parse(encoded), data)
})

const descriptions = new Set()
for (const localPath of LOCALIZED_PAGES) {
  for (const prefix of ['', 'en/']) {
    const relativePath = `${prefix}${localPath}`
    const route = routeFromRelativePath(relativePath)
    const file = route.endsWith('/') ? `dist${route}index.html` : `dist${route}`
    test(`${relativePath}: built SEO metadata is unique, localized, crawlable and consistent`, () => {
      const tree = parse(read(file))
      const title = text(find(tree, (node) => node.tag === 'title')[0])
      const metadata = (key) =>
        find(tree, (node) => node.tag === 'meta' && (attr(node, 'name') ?? attr(node, 'property')) === key)
      const description = metadata('description')
      assert.equal(description.length, 1)
      const summary = attr(description[0], 'content')
      assert.ok(summary.length > 40)
      assert.ok(!descriptions.has(summary), 'Each indexable page needs its own summary')
      descriptions.add(summary)
      assert.equal(title.split('ServerlessInsight').length - 1, 1, 'Brand appears once in the document title')
      assert.equal(attr(metadata('og:title')[0], 'content'), title)
      assert.equal(attr(metadata('twitter:title')[0], 'content'), title)
      assert.equal(attr(metadata('og:description')[0], 'content'), summary)
      assert.equal(attr(metadata('twitter:description')[0], 'content'), summary)
      assert.equal(metadata('keywords').length, 0)
      assert.match(attr(metadata('robots')[0], 'content'), /^index,/)
      assert.equal(attr(find(tree, (node) => node.tag === 'html')[0], 'lang'), prefix ? 'en' : 'zh-CN')
      const canonical = find(tree, (node) => node.tag === 'link' && attr(node, 'rel') === 'canonical')
      assert.equal(canonical.length, 1)
      assert.equal(attr(canonical[0], 'href'), `${SITE_ORIGIN}${route}`)
      const alternates = find(tree, (node) => node.tag === 'link' && attr(node, 'hreflang'))
      assert.equal(alternates.length, 3)
      assert.equal(find(tree, (node) => attr(node, 'data-si-translations') === 'off').length, 0)
      for (const alternate of alternates) {
        const path = new URL(attr(alternate, 'href')).pathname
        assert.ok(existsSync(new URL(path.endsWith('/') ? `dist${path}index.html` : `dist${path}`, root)))
      }
      const structured = find(tree, (node) => node.tag === 'script' && attr(node, 'type') === 'application/ld+json')
      assert.equal(structured.length, 1)
      const data = JSON.parse(text(structured[0]))
      const webpage = data['@graph'].find((node) => ['WebPage', 'CollectionPage'].includes(node['@type']))
      assert.equal(webpage.url, `${SITE_ORIGIN}${route}`)
      assert.equal(webpage.name, title)
      assert.equal(webpage.description, summary)
      assert.equal(webpage.inLanguage, prefix ? 'en' : 'zh-CN')
    })
  }
}

test('The generated sitemap contains only indexable pages and every URL has a matching canonical', () => {
  const xml = read('dist/sitemap.xml')
  assert.ok(!/404\.html|CONTRIBUTING|serverlessInsight-depseek/.test(xml))
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  assert.equal(locations.length, LOCALIZED_PAGES.size * 2)
  for (const url of locations) {
    const path = new URL(url).pathname
    const tree = parse(read(path.endsWith('/') ? `dist${path}index.html` : `dist${path}`))
    const canonical = find(tree, (node) => node.tag === 'link' && attr(node, 'rel') === 'canonical')[0]
    assert.equal(attr(canonical, 'href'), url)
  }
})

test('Utility pages remain crawlable for noindex processing but expose no canonical or structured entity', () => {
  for (const path of ['404.html', 'CONTRIBUTING.html', 'case-study/serverlessInsight-depseek.html']) {
    const tree = parse(read(`dist/${path}`))
    assert.match(
      attr(find(tree, (node) => node.tag === 'meta' && attr(node, 'name') === 'robots')[0], 'content'),
      /noindex/
    )
    assert.equal(find(tree, (node) => node.tag === 'link' && attr(node, 'rel') === 'canonical').length, 0)
    assert.equal(find(tree, (node) => node.tag === 'script' && attr(node, 'type') === 'application/ld+json').length, 0)
  }
  // VitePress renders the 404 body only on the client, so the locale-picker
  // flag is verifiable in static HTML just for the SSR-rendered helper pages.
  for (const path of ['CONTRIBUTING.html', 'case-study/serverlessInsight-depseek.html']) {
    const tree = parse(read(`dist/${path}`))
    assert.ok(
      find(tree, (node) => attr(node, 'data-si-translations') === 'off').length,
      `${path} must hide the locale picker`
    )
    assert.equal(
      find(tree, (node) => node.tag === 'a' && attr(node, 'href') === `/en/${path}`).length,
      0,
      `${path} must not link to its untranslated counterpart`
    )
  }
  assert.match(read('dist/robots.txt'), /User-agent: \*\s+Allow: \//)
  assert.match(read('dist/robots.txt'), /Sitemap: https:\/\/www\.serverlessinsight\.com\/sitemap\.xml/)
})

test('Descriptions fall back safely when a page has no frontmatter or authored summary', () => {
  const p = {relativePath: 'en/guide.md', title: 'Guide'}
  const hooks = createSeoHooks()
  hooks.transformPageData(p)
  assert.match(p.description, /open-source serverless IaC/)
  assert.equal(meta(p, 'og:description'), p.description)
})

test('The robots none shorthand is respected as noindex and removes a URL from the sitemap', () => {
  const hooks = createSeoHooks()
  const p = page('draft.md', {frontmatter: {robots: 'none'}})
  hooks.transformPageData(p)
  assert.equal(meta(p, 'robots'), 'none')
  assert.equal(links(p, 'canonical').length, 0)
  assert.equal(hooks.transformSitemap([{url: 'draft.html'}]).length, 0)
})

test('The renderer receives one authoritative description attribute with its original text', () => {
  const description = 'Use "functions" & <resources> in YAML.'
  assert.deepEqual(createSeoHooks().transformHead({description}), [
    ['meta', {name: 'description', content: description}]
  ])
})

test('All links and fragments on indexable pages resolve to generated files', () => {
  const cache = new Map()
  const load = (path) => {
    const file = path.endsWith('/') ? `dist${path}index.html` : `dist${path}`
    if (!cache.has(file)) cache.set(file, parse(read(file)))
    return cache.get(file)
  }
  for (const localPath of LOCALIZED_PAGES) {
    for (const prefix of ['', 'en/']) {
      const route = routeFromRelativePath(`${prefix}${localPath}`)
      for (const link of find(load(route), (node) => node.tag === 'a' && attr(node, 'href'))) {
        const url = new URL(attr(link, 'href'), `${SITE_ORIGIN}${route}`)
        if (url.origin !== SITE_ORIGIN) continue
        const path = decodeURIComponent(url.pathname)
        const file = path.endsWith('/') ? `dist${path}index.html` : `dist${path}`
        assert.ok(existsSync(new URL(file, root)), `${route}: missing ${url.pathname}`)
        if (!url.hash || !file.endsWith('.html')) continue
        const anchor = decodeURIComponent(url.hash.slice(1))
        assert.ok(
          find(load(path), (node) => attr(node, 'id') === anchor).length,
          `${route}: missing ${url.pathname}${url.hash}`
        )
      }
    }
  }
})

test('No built page serves an internal link to a missing route or fragment', () => {
  const walk = (dir) =>
    readdirSync(new URL(dir, root), {withFileTypes: true}).flatMap((entry) =>
      entry.isDirectory() ? walk(`${dir}${entry.name}/`) : entry.name.endsWith('.html') ? [`${dir}${entry.name}`] : []
    )
  const cache = new Map()
  const load = (file) => {
    if (!cache.has(file)) cache.set(file, parse(read(file)))
    return cache.get(file)
  }
  for (const file of walk('dist/')) {
    for (const link of find(load(file), (node) => node.tag === 'a' && attr(node, 'href'))) {
      const href = attr(link, 'href')
      if (!href.startsWith('/') || href.startsWith('//')) continue
      const [rawPath, rawHash] = href.split('#')
      const path = decodeURIComponent(rawPath)
      const target = path.endsWith('/') ? `dist${path}index.html` : `dist${path}`
      assert.ok(existsSync(new URL(target, root)), `${file} links to missing ${path}`)
      if (!rawHash || !target.endsWith('.html')) continue
      const anchor = decodeURIComponent(rawHash)
      assert.ok(find(load(target), (node) => attr(node, 'id') === anchor).length, `${file} links to missing #${anchor}`)
    }
  }
})
