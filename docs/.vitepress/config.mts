import {defineConfig} from 'vitepress'
import container from 'markdown-it-container'

const siteOrigin = 'https://www.serverlessinsight.com';
const titleZh = 'ServerlessInsight | 全栈 Serverless 应用开发运维平台';
const descZh = 'ServerlessInsight 是一个开源的全栈 Serverless 应用开发运维平台，支持跨云开发、部署、监控、调试和优化，并采用基础设施即代码实践。';
const icon = '/favicon.ico';

const titleEn = 'ServerlessInsight | Full-stack Serverless Development and Operation Platform';
const descEn = 'ServerlessInsight is an open-source full-stack serverless platform for developing, deploying, monitoring, debugging, and optimizing applications across cloud providers with infrastructure as code.';
const socialImage = '/si-archtecture.drawio.png';

const localizedPages = new Set([
  'index.md',
  'docs.md',
  'getting-started.md',
  'introduction.md',
  'reference.md',
  'cli.md',
  'support.md',
  'faq.md',
  'case-study.md',
]);

const routeFromRelativePath = (relativePath: string) => {
  const path = relativePath.replace(/\.md$/, '');

  if (path === 'index' || path.endsWith('/index')) {
    const localePath = path === 'index' ? '' : path.slice(0, -'/index'.length);
    return localePath ? `/${localePath}/` : '/';
  }

  return `/${path}.html`;
};

const absoluteUrl = (route: string) => `${siteOrigin}${route}`;

const addPageMetadata = (pageData: {relativePath: string; frontmatter: {head?: unknown[]}}) => {
  const route = routeFromRelativePath(pageData.relativePath);
  const head = pageData.frontmatter.head ?? [];
  const metadata = [
    ['link', {rel: 'canonical', href: absoluteUrl(route)}],
    ['meta', {property: 'og:url', content: absoluteUrl(route)}],
    ['meta', {property: 'og:image', content: absoluteUrl(socialImage)}],
    ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
    ['meta', {name: 'twitter:image', content: absoluteUrl(socialImage)}],
  ];

  if (localizedPages.has(pageData.relativePath.replace(/^en\//, ''))) {
    const isEnglish = pageData.relativePath.startsWith('en/');
    const localPath = pageData.relativePath.replace(/^en\//, '');
    const alternatePaths = isEnglish
      ? {en: pageData.relativePath, 'zh-CN': localPath}
      : {en: `en/${localPath}`, 'zh-CN': pageData.relativePath};

    metadata.push(
      ['link', {rel: 'alternate', hreflang: 'en', href: absoluteUrl(routeFromRelativePath(alternatePaths.en))}],
      ['link', {rel: 'alternate', hreflang: 'zh-CN', href: absoluteUrl(routeFromRelativePath(alternatePaths['zh-CN']))}],
    );
  }

  pageData.frontmatter.head = [...head, ...metadata];
};
// https://vitepress.dev/reference/site-config
export default defineConfig({
  lastUpdated: true,
  sitemap: {
    hostname: siteOrigin,
    transformItems: (items) => items.filter(({url}) => !url.includes('404.html')),
  },
  outDir: '../dist',
  cacheDir: '../cache',
  markdown: {
    // ::: platform <aliyun|tencent|volcengine> ... :::
    // Rendered as a div toggled by the platform selector (see theme/styles/platform.css)
    config(md) {
      md.use(container, 'platform', {
        validate: (params: string) => /^platform\s+(aliyun|tencent|volcengine)\s*$/.test(params.trim()),
        render(tokens: any[], idx: number) {
          const token = tokens[idx]
          if (token.nesting === 1) {
            const name = token.info.trim().split(/\s+/)[1] ?? 'aliyun'
            return `<div class="vp-platform-block" data-platform="${name}">\n`
          }
          return '</div>\n'
        }
      })
    }
  },
  transformPageData: addPageMetadata,
  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      title: titleZh,
      description: descZh,
      head: [
        ['link', {rel: 'icon', icon}],
        ['meta', {name: 'description', content: descZh}],
        ['meta', {
          name: 'keywords',
          content: 'ServerlessInsight, serverless 平台,serverless framework, 跨云 serverless 管理, serverless 应用开发, serverless 全生命周期管理, 基础设施即代码, ServerlessInsight 特性, 无服务器架构, Serverless Insight, 跨供应商 serverless 管理, 多云 serverless 部署, 极客范开源社区, serverless 开发工具, 云原生开发, 无服务器应用部署, 开源 serverless 软件, serverless CI/CD 集成, 开源 serverless 项目, 云原生 serverless 最佳实践, serverless 微服务架构, serverless 实时数据处理, API 后端 serverless 框架, serverless 事件驱动架构, 可持续软件开发,极客范,geekfun',
        }],
        ['meta', {property: 'og:title', content: titleZh}],
        ['meta', {property: 'og:description', content: descZh}],
        ['meta', {property: 'og:site_name', content: titleZh}],
        ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
        ['meta', {name: 'twitter:title', content: titleZh}],
        ['meta', {name: 'twitter:description', content: descZh}],
        ['meta', {name: 'baidu-site-verification', content: 'codeva-RxGXH1Uqch'}],
        ['meta', {name: 'google-site-verification', content: 'AZXIysKvXbgU83th3QJrI5ztjLlY3Yys9oav4uEQS6Y'}],
        // Google Analytics
        ['script', {async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-FSJWB3QKGJ'}],
        ['script', {}, `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FSJWB3QKGJ');`],
      ],
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        siteTitle: 'ServerlessInsight',
        logo: icon,
        nav: [
          {text: '主页', link: '/'},
          {text: '文档', link: '/docs'},
        ],

        sidebar: [
          {
            text: 'ServerlessInsight',
            items: [
              {text: 'ServerlessInsight介绍', link: '/introduction'},
              {text: '快速开始', link: '/getting-started'},
              {text: '配置手册', link: '/reference'},
              {text: '命令行', link: '/cli'},
              {text: '支持服务', link: '/support'},
              {text: '常见问题', link: '/faq'},
              {text: '实践案例', link: '/case-study'},
            ]
          }
        ],

        socialLinks: [
          {icon: 'github', link: 'https://github.com/geek-fun/serverlessinsight'},
          {icon: 'twitter', link: 'https://x.com/Blankll31075'},
          {icon: 'youtube', link: 'https://www.youtube.com/@geekfun-club'}
        ]
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      title: titleEn,
      description: descEn,
      head: [
        ['link', {rel: 'icon', icon}],
        ['meta', {name: 'description', content: descEn}],
        ['meta', {
          name: 'keywords',
          content: "ServerlessInsight, serverless platform, multi-cloud serverless management, serverless application development, serverless lifecycle management, infrastructure as code, ServerlessInsight features, serverless architecture, cross-provider serverless management, multi-vendor serverless deployment, Geekfun open-source community, serverless development tools, cloud-native development, serverless app deployment, open-source serverless software, serverless CI/CD integration, open-source serverless projects, cloud-native serverless best practices, serverless microservices architecture, serverless real-time data processing, API backend serverless framework, serverless event-driven architecture, sustainable software development"
        }],
        ['meta', {property: 'og:title', content: titleEn}],
        ['meta', {property: 'og:description', content: descEn}],
        ['meta', {property: 'og:site_name', content: titleEn}],
        ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
        ['meta', {name: 'twitter:title', content: titleEn}],
        ['meta', {name: 'twitter:description', content: descEn}],
        ['meta', {name: 'baidu-site-verification', content: 'codeva-RxGXH1Uqch'}],
        ['meta', {name: 'google-site-verification', content: 'AZXIysKvXbgU83th3QJrI5ztjLlY3Yys9oav4uEQS6Y'}],
        // Google Analytics
        ['script', {async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-FSJWB3QKGJ'}],
        ['script', {}, `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FSJWB3QKGJ');`],
      ],
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        siteTitle: 'ServerlessInsight',
        logo: icon,
        nav: [
          {text: 'Home', link: '/en/'},
          {text: 'Docs', link: '/en/docs'},
        ],

        sidebar: [
          {
            text: 'ServerlessInsight',
            items: [
              {text: 'Introduction', link: '/en/introduction'},
              {text: 'Quick Start', link: '/en/getting-started'},
              {text: 'Configuration Reference', link: '/en/reference'},
              {text: 'CLI Reference', link: '/en/cli'},
              {text: 'Support', link: '/en/support'},
              {text: 'FAQ', link: '/en/faq'},
              {text: 'Case Studies', link: '/en/case-study'},
            ]
          }
        ],

        socialLinks: [
          {icon: 'github', link: 'https://github.com/geek-fun/serverlessinsight'},
          {icon: 'twitter', link: 'https://x.com/Blankll31075'},
          {icon: 'youtube', link: 'https://www.youtube.com/@geekfun-club'}
        ]
      },
    }
  }

})
