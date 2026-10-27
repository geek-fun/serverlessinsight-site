import {defineConfig} from 'vitepress'
import container from 'markdown-it-container'
import {createSeoHooks, DEFAULT_DESCRIPTIONS, SITE_NAME, SITE_ORIGIN} from './seo.mjs'

const siteOrigin = SITE_ORIGIN;
const titleZh = SITE_NAME;
const descZh = DEFAULT_DESCRIPTIONS['zh-CN'];
const icon = '/favicon.ico';
const logo = {
  light: {src: '/logo.png', width: 36, height: 36},
  dark: {src: '/logo-dark.png', width: 36, height: 36},
  alt: '',
};

const titleEn = SITE_NAME;
const descEn = DEFAULT_DESCRIPTIONS.en;
const seo = createSeoHooks();

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lastUpdated: true,
  sitemap: {
    hostname: siteOrigin,
    transformItems: seo.transformSitemap,
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
  transformPageData: seo.transformPageData,
  transformHead: seo.transformHead,
  transformHtml: seo.transformHtml,
  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      title: titleZh,
      description: descZh,
      head: [
        ['link', {rel: 'icon', href: icon, sizes: 'any'}],
        ['link', {rel: 'icon', type: 'image/png', href: '/favicon-32.png', sizes: '32x32'}],
        ['link', {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'}],
        ['meta', {property: 'og:site_name', content: titleZh}],
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
        langMenuLabel: '选择语言',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色主题',
        darkModeSwitchTitle: '切换到深色主题',
        logo,
        nav: [
          {text: '功能', link: '/#features'},
          {text: '云支持', link: '/#cloud-support'},
          {text: '定价', link: '/pricing.html'},
          {text: '文档', link: '/docs.html', activeMatch: '/(docs|introduction|getting-started|reference|cli|support|faq|case-study)(\\.html)?$'},
        ],

        sidebar: [
          {
            text: 'ServerlessInsight',
            items: [
              {text: 'ServerlessInsight介绍', link: '/introduction.html'},
              {text: '快速开始', link: '/getting-started.html'},
              {text: '配置手册', link: '/reference.html'},
              {text: '命令行', link: '/cli.html'},
              {text: '支持服务', link: '/support.html'},
              {text: '常见问题', link: '/faq.html'},
              {text: '实践案例', link: '/case-study.html'},
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
        ['link', {rel: 'icon', href: icon, sizes: 'any'}],
        ['link', {rel: 'icon', type: 'image/png', href: '/favicon-32.png', sizes: '32x32'}],
        ['link', {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'}],
        ['meta', {property: 'og:site_name', content: titleEn}],
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
        logo,
        nav: [
          {text: 'Features', link: '/en/#features'},
          {text: 'Cloud support', link: '/en/#cloud-support'},
          {text: 'Pricing', link: '/en/pricing.html'},
          {text: 'Docs', link: '/en/docs.html', activeMatch: '/en/(docs|introduction|getting-started|reference|cli|support|faq|case-study)(\\.html)?$'},
        ],

        sidebar: [
          {
            text: 'ServerlessInsight',
            items: [
              {text: 'Introduction', link: '/en/introduction.html'},
              {text: 'Quick Start', link: '/en/getting-started.html'},
              {text: 'Configuration Reference', link: '/en/reference.html'},
              {text: 'CLI Reference', link: '/en/cli.html'},
              {text: 'Support', link: '/en/support.html'},
              {text: 'FAQ', link: '/en/faq.html'},
              {text: 'Case Studies', link: '/en/case-study.html'},
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
