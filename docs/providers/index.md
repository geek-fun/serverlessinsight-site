---
title: 供应商总览
description: ServerlessInsight 支持的云供应商及其资源能力矩阵
---

# 供应商总览

ServerlessInsight 通过统一的 `serverlessinsight.yml` 配置屏蔽不同云供应商的差异。下表列出各供应商当前**实际可部署**的资源能力。

> 华为云（Huawei Cloud）与 AWS 仅出现在供应商枚举中，暂不可部署：华为云目前仅能生成 HCL/Terraform 模板，`deploy` 会抛出异常；AWS 尚未接入任何部署路径。

## 能力矩阵

| 资源类型 | 阿里云 Aliyun | 腾讯云 Tencent | 火山引擎 Volcengine |
| --- | --- | --- | --- |
| 函数计算 | FC3 | SCF | VeFaaS |
| 对象存储 | OSS | COS | TOS |
| API 网关 / 事件 | API Gateway | SCF 函数 URL（无独立 APIGW 资源） | API Gateway |
| 数据库 | RDS Serverless、ES Serverless | TDSQL-C Serverless、ES Serverless | — |
| 表格存储 | TableStore | — | — |
| CDN | 支持（OSS + APIGW） | 不支持（仅 DNSPod DNS） | 不支持 |
| 自定义域名 | 支持 | 支持（DNSPod） | 仅 APIGW 域名 |

## 命令支持差异

| 命令 | 阿里云 | 腾讯云 | 火山引擎 |
| --- | --- | --- | --- |
| `validate` | ✅ | ✅ | ✅ |
| `plan` | ✅ | ✅ | ❌（暂不支持） |
| `deploy` / `destroy` | ✅ | ✅ | ✅ |
| `local` | ✅（本地模拟） | ❌ | ❌ |
| `show` | ✅ | ✅ | ✅ |

## 各供应商文档

- [阿里云 Aliyun](/providers/aliyun) — 完整支持，能力最全
- [火山引擎 Volcengine](/providers/volcengine) — 函数、对象存储、API 网关
- [腾讯云 Tencent](/providers/tencent) — 函数、对象存储、数据库（无 API 网关资源）

## 通用配置模型

所有供应商共享同一套配置语法，详见 [配置手册](/reference)。各供应商在认证方式、可用地域、运行时上的差异，请查阅对应页面。
