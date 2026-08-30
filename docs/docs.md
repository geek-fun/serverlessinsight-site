---
title: 文档中心
description: ServerlessInsight 文档导航
---

# 文档中心

欢迎使用 ServerlessInsight 文档中心。下面的入口按主题组织，帮助你从入门到精通。

## 入门

- [介绍](/introduction) — 了解 ServerlessInsight 的核心理念与适用场景
- [快速开始](/getting-started) — 安装 CLI、理解配置模型并部署第一个应用
- [配置手册](/reference) — 全部资源、字段与可选值

## 供应商

- [供应商总览](/providers/) — 各云能力矩阵与命令支持差异
- [阿里云 Aliyun](/providers/aliyun)
- [火山引擎 Volcengine](/providers/volcengine)
- [腾讯云 Tencent](/providers/tencent)

## 参考与帮助

- [CLI 参考](/cli) — 全部命令与参数
- [常见问题](/faq) — 使用中的常见疑问
- [实践案例](/case-study) — 真实场景示例
- [支持服务](/support) — 获取帮助与反馈渠道

## 最小示例

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

> 华为云与 AWS 暂不可部署，仅出现在供应商枚举中。
