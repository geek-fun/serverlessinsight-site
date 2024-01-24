import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "hostsless",
  description: "A VitePress Site",
  outDir: '../dist',
  cacheDir: '../cache',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Products', link: '/products' },
      { text: 'Docs', link: '/docs' },
    ],

    sidebar: [
      {
        text: 'sidebar',
        items: [
          { text: 'Docs', link: '/docs' },
          { text: 'Products', link: '/products' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/hostsless' }
    ]
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
    }
  }
})
