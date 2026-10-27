export const SITE_ORIGIN = 'https://www.serverlessinsight.com'
export const SITE_NAME = 'ServerlessInsight'
export const SOCIAL_IMAGE = '/og.jpg'
export const DEFAULT_DESCRIPTIONS = {
  'zh-CN': 'ServerlessInsight 是开源的全栈 Serverless 应用平台，使用声明式 YAML 管理云资源、验证配置并执行增量部署。',
  en: 'ServerlessInsight is an open-source serverless IaC platform for defining cloud resources in YAML, validating configuration and reviewing incremental deployments.'
}
export const LOCALIZED_PAGES = new Set([
  'index.md',
  'pricing.md',
  'docs.md',
  'getting-started.md',
  'introduction.md',
  'reference.md',
  'cli.md',
  'support.md',
  'faq.md',
  'case-study.md',
  'terms.md',
  'privacy.md',
  'refund-policy.md'
])
const UTILITY_PAGES = new Set(['404.md', 'CONTRIBUTING.md', 'case-study/serverlessInsight-depseek.md'])
const DOCUMENTATION_PAGES = new Set([
  'docs.md',
  'getting-started.md',
  'introduction.md',
  'reference.md',
  'cli.md',
  'support.md',
  'faq.md',
  'case-study.md'
])
const MANAGED_META = new Set([
  'robots',
  'og:url',
  'og:type',
  'og:locale',
  'og:locale:alternate',
  'og:image',
  'og:image:width',
  'og:image:height',
  'og:image:alt',
  'og:title',
  'og:description',
  'twitter:card',
  'twitter:image',
  'twitter:image:alt',
  'twitter:title',
  'twitter:description'
])
const absolute = (path) => `${SITE_ORIGIN}${path}`
const withoutLocale = (path) => path.replace(/^en\//, '')

export function routeFromRelativePath(relativePath) {
  const path = relativePath.replace(/\.md$/, '')
  if (path === 'index') return '/'
  return path.endsWith('/index') ? `/${path.slice(0, -6)}/` : `/${path}.html`
}

export function formatPageTitle(page) {
  const title = page.title || SITE_NAME
  const template = page.titleTemplate ?? page.frontmatter?.titleTemplate
  if (template === false) return title
  if (typeof template === 'string') {
    if (template.includes(':title')) return template.replace(/:title/g, title)
    return title === template ? title : `${title} | ${template}`
  }
  return title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  )
}

function pageGraph(page, language, title, description) {
  const localPath = withoutLocale(page.relativePath)
  const home = localPath === 'index.md'
  const prefix = language === 'en' ? '/en/' : '/'
  const url = absolute(routeFromRelativePath(page.relativePath))
  const websiteId = absolute('/#website')
  const organizationId = absolute('/#organization')
  const softwareId = absolute('/#software')
  const graph = []
  if (home) {
    graph.push(
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: absolute('/'),
        logo: absolute('/logo.png')
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: SITE_NAME,
        url: absolute('/'),
        inLanguage: ['zh-CN', 'en'],
        publisher: {'@id': organizationId}
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': softwareId,
        name: 'ServerlessInsight CLI',
        url: 'https://github.com/geek-fun/serverlessinsight',
        codeRepository: 'https://github.com/geek-fun/serverlessinsight',
        license: 'https://www.apache.org/licenses/LICENSE-2.0',
        runtimePlatform: 'Node.js'
      }
    )
  }
  const webpage = {
    '@type': localPath === 'docs.md' ? 'CollectionPage' : 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: language,
    isPartOf: {'@id': websiteId}
  }
  if (home || localPath === 'introduction.md') webpage.mainEntity = {'@id': softwareId}
  if (!home) {
    const items = [{name: language === 'en' ? 'Home' : '首页', item: absolute(prefix)}]
    if (DOCUMENTATION_PAGES.has(localPath) && localPath !== 'docs.md') {
      items.push({name: language === 'en' ? 'Documentation' : '文档中心', item: absolute(`${prefix}docs.html`)})
    }
    items.push({name: page.title, item: url})
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: items.map((item, index) => ({'@type': 'ListItem', position: index + 1, ...item}))
    }
    webpage.breadcrumb = {'@id': breadcrumb['@id']}
    graph.push(breadcrumb)
  }
  graph.push(webpage)
  return {'@context': 'https://schema.org', '@graph': graph}
}

export function createSeoHooks() {
  const excludedRoutes = new Set(Array.from(UTILITY_PAGES, routeFromRelativePath))
  return {
    transformPageData(page) {
      const localPath = withoutLocale(page.relativePath)
      const language = page.relativePath.startsWith('en/') ? 'en' : 'zh-CN'
      const route = routeFromRelativePath(page.relativePath)
      const frontmatter = page.frontmatter ?? (page.frontmatter = {})
      const previousHead = frontmatter.head ?? []
      const explicitRobots =
        frontmatter.robots ??
        previousHead.find(([tag, attrs]) => tag === 'meta' && attrs?.name === 'robots')?.[1]?.content
      const noindex = UTILITY_PAGES.has(page.relativePath) || /\b(?:noindex|none)\b/i.test(explicitRobots ?? '')
      if (noindex) excludedRoutes.add(route)
      else excludedRoutes.delete(route)
      if (localPath === 'index.md') {
        page.titleTemplate = false
        frontmatter.titleTemplate = false
      }
      const title = formatPageTitle(page)
      const description = frontmatter.description || page.description || DEFAULT_DESCRIPTIONS[language]
      page.description = description
      const metadata = [
        [
          'meta',
          {
            name: 'robots',
            content: noindex
              ? explicitRobots && /\b(?:noindex|none)\b/i.test(explicitRobots)
                ? explicitRobots
                : 'noindex, follow'
              : explicitRobots || 'index, follow, max-image-preview:large'
          }
        ],
        ['meta', {property: 'og:type', content: 'website'}],
        ['meta', {property: 'og:url', content: absolute(route)}],
        ['meta', {property: 'og:locale', content: language === 'en' ? 'en_US' : 'zh_CN'}],
        ['meta', {property: 'og:locale:alternate', content: language === 'en' ? 'zh_CN' : 'en_US'}],
        ['meta', {property: 'og:image', content: absolute(SOCIAL_IMAGE)}],
        ['meta', {property: 'og:image:width', content: '1200'}],
        ['meta', {property: 'og:image:height', content: '630'}],
        ['meta', {property: 'og:image:alt', content: title}],
        ['meta', {property: 'og:title', content: title}],
        ['meta', {property: 'og:description', content: description}],
        ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
        ['meta', {name: 'twitter:image', content: absolute(SOCIAL_IMAGE)}],
        ['meta', {name: 'twitter:image:alt', content: title}],
        ['meta', {name: 'twitter:title', content: title}],
        ['meta', {name: 'twitter:description', content: description}]
      ]
      if (!noindex) {
        metadata.push(['link', {rel: 'canonical', href: absolute(route)}])
        if (LOCALIZED_PAGES.has(localPath)) {
          for (const [hreflang, relativePath] of [
            ['en', `en/${localPath}`],
            ['zh-CN', localPath],
            ['x-default', localPath]
          ]) {
            metadata.push(['link', {rel: 'alternate', hreflang, href: absolute(routeFromRelativePath(relativePath))}])
          }
        }
        metadata.push([
          'script',
          {type: 'application/ld+json', id: 'si-structured-data'},
          serializeJsonLd(pageGraph(page, language, title, description))
        ])
      }
      frontmatter.head = [
        ...previousHead.filter(([tag, attrs]) => {
          if (tag === 'meta') return !MANAGED_META.has(attrs?.name ?? attrs?.property)
          if (tag === 'link') return attrs?.rel !== 'canonical' && !(attrs?.rel === 'alternate' && attrs?.hreflang)
          return !(tag === 'script' && attrs?.id === 'si-structured-data')
        }),
        ...metadata
      ]
    },
    // Let VitePress render the attribute so quotes in authored summaries are escaped.
    transformHead({description}) {
      return [['meta', {name: 'description', content: description}]]
    },
    // Pages without a translated counterpart must not serve locale-picker
    // anchors to a nonexistent URL; the picker itself stays hidden through the
    // layout's data-si-translations attribute (covers client-only routes like 404).
    transformHtml(code, id, ctx) {
      const localPath = withoutLocale(ctx.pageData.relativePath)
      if (LOCALIZED_PAGES.has(localPath)) return code
      const target = `/en/${localPath.replace(/\.md$/, '.html')}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return code.replace(new RegExp(`<a[^>]*href="${target}"[^>]*>[\\s\\S]*?</a>`, 'g'), '')
    },
    transformSitemap(items) {
      return items.filter(({url}) => !excludedRoutes.has(new URL(url, SITE_ORIGIN).pathname))
    }
  }
}
