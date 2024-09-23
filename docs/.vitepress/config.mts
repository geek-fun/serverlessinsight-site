import {defineConfig} from 'vitepress'

const titleZh = 'ServerlessInsight| 全栈Serverless应用开发运维平台';
const descZh = 'ServerlessInsight是一个开源的Serverless应用开发运维平台, 提供了全栈Serverless应用开发、部署、监控、调试、优化等功能。支持基础设施即代码的开发实践';
const icon = '/favicon.ico';
// https://vitepress.dev/reference/site-config
export default defineConfig({
  lastUpdated: true,
  outDir: '../dist',
  cacheDir: '../cache',
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
          content: 'ServerlessInsight, serverless, serverless insight, 无服务器, serverless architecture, Serverless应用开发, Serverless应用部署，Serverless应用运维, 无服务器架构, 极客范,geekfun, 极客范开源社区, 开源软件, 软件可持续性,可持续软件项目'
        }],
        ['meta', {property: 'og:title', content: titleZh}],
        ['meta', {property: 'og:description', content: descZh}],
        ['meta', {property: 'og:image', content: icon}],
        ['meta', {property: 'og:url', content: '/'}],
        ['meta', {property: 'og:site_name', content: titleZh}],
        ['meta', {name: 'twitter:card', content: icon}],
        ['meta', {name: 'twitter:title', content: titleZh}],
        ['meta', {name: 'twitter:description', content: descZh}],
        ['meta', {name: 'twitter:image', content: icon}],
      ],
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        siteTitle: 'ServerlessInsight',
        nav: [
          {text: '主页', link: '/'},
          {text: '产品', link: '/products'},
          {text: '文档', link: '/docs'},
        ],

        sidebar: [
          {
            text: 'ServerlessInsight',
            items: [
              {text: 'ServerlessInsight介绍', link: 'introduction'},
              {text: '快速入门', link: 'getting-started'},
              {text: '用户手册', link: 'reference'},
              {text: '支持服务', link: 'support'},
              {text: '常见问题', link: 'faq'},
              {text: '实战案例', link: 'case-study'},
            ]
          }
        ],

        socialLinks: [
          {icon: 'github', link: 'https://github.com/geek-fun/serverlessinsight'}
        ]
      },
    },
    en: {
      label: 'English',
      lang: 'en',
    }
  }

})
