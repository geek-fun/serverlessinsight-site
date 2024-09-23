import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ServerlessInsight",
  description: "ServerlessInsight Site",
  outDir: '../dist',
  cacheDir: '../cache',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
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
  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'en',
    }
  }
})
