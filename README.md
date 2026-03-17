# ServerlessInsight

[![generate page site](https://github.com/geek-fun/hostsless-site/actions/workflows/page-site.yml/badge.svg)](https://github.com/geek-fun/hostsless-site/actions/workflows/page-site.yml)
[![npm version](https://img.shields.io/npm/v/@geek-fun/serverlessinsight.svg)](https://www.npmjs.com/package/@geek-fun/serverlessinsight)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**全栈 Serverless 应用平台 | Full-stack Serverless Application Platform**

ServerlessInsight 是一个开源的全栈 Serverless 应用开发运维平台，提供全生命周期的跨云供应商 Serverless 应用管理。通过基础设施即代码 (IaC) 的开发实践，屏蔽底层云供应商差异，帮助开发者快速构建、部署、监控和优化 Serverless 应用。

## ✨ 特性

- **🏗️ 基础设施即代码** - 通过 `serverlessinsight.yml` 定义资源，自动生成对应代码，无需手动申请或创建资源
- **🔄 全生命周期管理** - 提供开发、部署、监控、调优等一站式功能，降低运维成本
- **☁️ 跨云供应商支持** - 支持阿里云、华为云、腾讯云等多个云厂商，降低供应商锁定风险
- **🔧 开放生态** - 开源开放，提供通用 CLI，无特定 CI/CD 工具依赖，轻松集成现有工具链
- **🚀 本地开发支持** - 一键启动本地开发环境，无需配置本地资源，开发环境与线上环境无缝连接
- **📦 一键部署** - 支持一键部署到指定云供应商，无需手动配置任何资源

## 📦 安装

### 前提条件

- Node.js >= 18.x
- npm >= 8.x

### 安装 CLI

```bash
npm install -g @geek-fun/serverlessinsight
```

验证安装：

```bash
si --version
```

## 🚀 快速开始

### 1. 配置云供应商密钥

以阿里云为例，需要配置以下环境变量：

```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_REGION="cn-hangzhou"
```

> ⚠️ **安全提示**: 请使用 RAM 子用户的 AccessKey，并妥善保管密钥信息，切勿公开到 GitHub 等公共渠道。

### 2. 初始化项目

创建项目目录并初始化 `serverlessinsight.yml`：

```bash
mkdir hello-world-proj && cd hello-world-proj
```

推荐的项目结构：

```
hello-world-proj/
├── artifacts/          # 打包后的应用程序
├── scripts/           # 自动化脚本
├── src/               # 源代码
├── tests/             # 测试代码
├── serverlessinsight.yml
├── package.json
└── tsconfig.json
```

### 3. 配置 serverlessinsight.yml

```yaml
version: 0.1
provider: aliyun

vars:
  region: cn-hangzhou

stages:
  dev:
    region: ${vars.region}

service: hello-world-api

tags:
  owner: geek-fun

functions:
  hello_world_fn:
    fc_name: hello-world-fn
    runtime: nodejs18
    handler: index.handler
    code: artifacts/hello-world-api.zip
    memory: 512
    timeout: 10
    environment:
      NODE_ENV: prod

events:
  gateway_event:
    type: API_GATEWAY
    name: insight-poc-gateway
    triggers:
      - method: GET
        path: /api/*
        backend: hello-world-fn
```

### 4. 编写代码

创建 `src/index.ts`：

```typescript
export async function handler(event: any, context: any) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello World!',
    }),
  };
}
```

### 5. 打包并部署

```bash
# 打包应用程序
./scripts/package.sh

# 验证配置
si validate

# 部署服务
si deploy --stage dev hello-world-stack
```

### 6. 清理资源

```bash
si destroy --stage dev hello-world-stack
```

## 📚 文档

完整的文档请访问：[ServerlessInsight 文档](https://www.serverlessinsight.com)

- [介绍](docs/introduction.md) - 了解 ServerlessInsight 的核心概念
- [快速开始](docs/getting-started.md) - 5 分钟上手指南
- [配置手册](docs/reference.md) - 详细的 YAML 配置说明
- [命令行工具](docs/cli.md) - CLI 命令参考
- [实践案例](docs/case-study.md) - 真实应用场景分享

## 🌍 支持的云供应商

### 已支持

- ✅ 阿里云 (Aliyun) - 完整支持
- 🚧 华为云 (Huawei Cloud) - 开发中
- 🚧 腾讯云 (Tencent Cloud) - 开发中

### 规划中

- AWS
- Google Cloud
- Azure

## 🛠️ 本地开发

ServerlessInsight 支持在本地启动所有定义的资源，方便开发调试：

```bash
# 本地运行
si local --stage dev hello-world-stack

# 启用调试模式
si local --stage dev hello-world-stack --debug

# 启用文件监视模式
si local --stage dev hello-world-stack --watch
```

## 📋 核心资源类型

ServerlessInsight 支持以下资源类型：

- **Functions** - Serverless 函数计算 (FC)
- **Events** - 事件触发器 (API Gateway, SQS, Timer 等)
- **Databases** - 数据库资源 (RDS, Elasticsearch Serverless 等)
- **Tables** - 表格存储 (Table Store, DynamoDB 等)
- **Buckets** - 对象存储 (OSS, S3 等)

详细配置请参考 [配置手册](docs/reference.md)。

## 🤝 贡献

我们欢迎各种形式的贡献：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码

请查看 [贡献指南](CONTRIBUTING.md) 了解如何参与。

## 📄 许可证

Apache License 2.0

## 🔗 链接

- [官方网站](https://www.serverlessinsight.com)
- [GitHub 仓库](https://github.com/geek-fun/serverlessinsight)
- [NPM 包](https://www.npmjs.com/package/@geek-fun/serverlessinsight)
- [问题反馈](https://github.com/geek-fun/serverlessinsight/issues)

## 👥 联系方式

- Twitter: [@Blankll31075](https://x.com/Blankll31075)
- YouTube: [GeekFun Club](https://www.youtube.com/@geekfun-club)
- Email: support@geekfun.club

---

Made with ❤️ by [GeekFun](https://geekfun.club)
