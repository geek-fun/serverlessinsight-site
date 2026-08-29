---
title: 快速开始
description: 5 分钟安装 ServerlessInsight CLI 并部署你的第一个 Serverless 应用
---

# 快速开始

本指南帮助你 5 分钟内安装 ServerlessInsight CLI，并部署第一个 Serverless 应用。不同云供应商的认证、地域与资源差异较大，具体步骤请跳转到对应的 [供应商](/providers/) 快速开始。

## 1. 安装 CLI

前置条件：Node.js >= 18，npm >= 8。

```bash
npm install -g @geek-fun/serverlessinsight
si --version
```

## 2. 创建项目

```bash
mkdir hello-world && cd hello-world
```

推荐项目结构：

```
hello-world/
├── artifacts/              # 打包后的函数代码
├── src/                    # 源代码
└── serverlessinsight.yml   # 配置文件
```

在 `serverlessinsight.yml` 中写入最小配置（以阿里云为例）：

```yaml
version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou
app: hello-world
service: hello-world-api

functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/hello-world-api.zip
```

## 3. 选择供应商并配置凭证

ServerlessInsight 支持多个云供应商，但认证方式与环境变量各不相同：

- [阿里云 Aliyun 快速开始](/providers/aliyun)
- [火山引擎 Volcengine 快速开始](/providers/volcengine)
- [腾讯云 Tencent 快速开始](/providers/tencent)

> 华为云与 AWS 暂不可部署，仅出现在供应商枚举中。

配置好对应云的环境变量（AccessKey 等）后，即可部署：

```bash
# 校验配置
si validate

# 部署到 dev 环境
si deploy --stage dev
```

## 4. 清理资源

```bash
si destroy --stage dev
```

## 下一步

- 了解完整的 [配置模型](/concepts)
- 查看 [供应商总览](/providers/) 的能力矩阵
- 查阅 [CLI 参考](/cli) 了解全部命令
