---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "ServerlessInsight"
  text: '全栈 Serverless 应用平台'
  tagline: "构建全生命周期的跨供应商 Serverless 应用管理，助力快速发展的业务"
  image:
    src: /si-archtecture.drawio.png
    alt: ServerlessInsight Architecture
  actions:
    - theme: brand
      text: 快速开始
      link: /getting-started
    - theme: alt
      text: 配置手册
      link: /concepts
    - theme: alt
      text: GitHub
      link: https://github.com/geek-fun/serverlessinsight

features:
  - title: 🏗️ 基础设施即代码
    details: 通过 serverlessinsight.yml 定义 Serverless 应用资源，系统自动生成对应代码，无需手动申请或创建资源，提升开发效率

  - title: 🔄 全生命周期管理
    details: 提供开发、部署、监控、调优等一站式功能。本地开发环境一键启动，与线上环境无缝连接，方便调试

  - title: ☁️ 跨云供应商支持
    details: 支持阿里云、华为云、腾讯云等多个云厂商，帮助您灵活选择供应商，降低供应商锁定风险

  - title: 🔧 开放生态
    details: 开源开放，提供通用 CLI 工具，无特定 CI/CD 工具依赖，可快速集成到现有开发工具链

  - title: 🚀 一键部署
    details: 支持一键部署所有定义的资源到指定云供应商，无需手动配置任何资源，简化部署流程

  - title: 📦 丰富的资源类型
    details: 支持函数计算、API 网关、数据库、表格存储、对象存储等多种云资源，满足各类应用需求

---
