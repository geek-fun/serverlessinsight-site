import {defineConfig} from 'vitepress'

const titleZh = 'ServerlessInsight| 全栈Serverless应用开发运维平台';
const descZh = 'ServerlessInsight是一个开源的Serverless应用开发运维平台, 提供了全栈Serverless应用开发、部署、监控、调试、优化等功能。支持基础设施即代码的开发实践';
const icon = '/favicon.ico';

const titleEn = 'ServerlessInsight | Full-stack Serverless Development and Operation Platform';
const descEn = 'ServerlessInsight is an open-source full-stack serverless development and operation platform, providing full-stack serverless application development, deployment, monitoring, debugging, optimization and other functions. Support infrastructure as code development practices';
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
          content: 'ServerlessInsight, serverless 平台,serverless framework, 跨云 serverless 管理, serverless 应用开发, serverless 全生命周期管理, 基础设施即代码, ServerlessInsight 特性, 无服务器架构, Serverless Insight, 跨供应商 serverless 管理, 多云 serverless 部署, 极客范开源社区, serverless 开发工具, 云原生开发, 无服务器应用部署, 开源 serverless 软件, serverless CI/CD 集成, 开源 serverless 项目, 云原生 serverless 最佳实践, serverless 微服务架构, serverless 实时数据处理, API 后端 serverless 框架, serverless 事件驱动架构, 可持续软件开发,极客范,geekfun',
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
          {text: '文档', link: '/docs'},
        ],

        sidebar: [
          {
            text: 'ServerlessInsight',
            items: [
              {text: 'ServerlessInsight介绍', link: 'introduction'},
              {text: '快速开始', link: 'getting-started'},
              {text: '配置手册', link: 'reference'},
              {text: '命令行', link: 'cli'},
              {text: '支持服务', link: 'support'},
              {text: '常见问题', link: 'faq'},
              {text: '实战案例', link: 'case-study'},
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
        ['meta', {property: 'og:image', content: icon}],
        ['meta', {property: 'og:url', content: '/'}],
        ['meta', {property: 'og:site_name', content: titleEn}],
        ['meta', {name: 'twitter:card', content: icon}],
        ['meta', {name: 'twitter:title', content: titleEn}],
        ['meta', {name: 'twitter:description', content: descEn}],
        ['meta', {name: 'twitter:image', content: icon}],
      ],
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        siteTitle: 'ServerlessInsight',
        nav: [
          {text: 'Home', link: '/en'},
          {text: 'Docs', link: '/docs'},
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
