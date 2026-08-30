---
title: 阿里云 Aliyun
description: 在阿里云上使用 ServerlessInsight 的认证、地域、运行时与资源说明
---

# 阿里云 Aliyun

阿里云是 ServerlessInsight 支持最完整的供应商，覆盖函数计算（FC3）、对象存储（OSS）、API 网关、数据库（RDS / ES Serverless）、表格存储（TableStore）、CDN 与自定义域名等。

## 快速开始

### 1. 配置凭证

```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
# 可选：使用 STS 临时凭证时
export ALIYUN_SECURITY_TOKEN="your-security-token"
# 可选：默认地域
export ALIYUN_REGION="cn-hangzhou"
```

### 2. 编写配置

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

events:
  gateway_event:
    name: insight-poc-gateway
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: hello_world_fn
```

### 3. 部署

```bash
si validate
si deploy --stage dev
```

## 认证

支持以下环境变量（两组均可，二选一即可）：

| 变量 | 说明 |
| --- | --- |
| `ALIYUN_ACCESS_KEY_ID` 或 `ALIBABA_CLOUD_ACCESS_KEY_ID` | AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` 或 `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | AccessKey Secret |
| `ALIYUN_SECURITY_TOKEN` 或 `ALIBABA_CLOUD_SECURITY_TOKEN` | STS 临时凭证 Token（可选） |

也可通过命令行参数覆盖：`-k/--accessKeyId`、`-x/--accessKeySecret`、`-n/--securityToken`。

> 安全提示：请使用 RAM 子用户的 AccessKey，并妥善保管，切勿提交到代码仓库。

若使用托管 SAAS 状态后端（省略 `backend` 配置时），还需通过 `si login`（使用 `SI_API_KEY`）或在部署时传 `--si-api-key` 进行鉴权。

## 地域与运行时

### 地域（强制校验，仅下列可选）

`cn-qingdao`、`cn-beijing`、`cn-zhangjiakou`、`cn-huhehaote`、`cn-wulanchabu`、`cn-hangzhou`、`cn-shanghai`、`cn-shenzhen`、`cn-heyuan`、`cn-guangzhou`、`cn-chengdu`、`cn-hongkong`、`ap-southeast-1`、`ap-southeast-3`、`ap-southeast-5`、`ap-southeast-6`、`ap-southeast-7`、`ap-northeast-1`、`ap-northeast-2`、`eu-central-1`、`eu-west-1`、`us-east-1`、`us-west-1`、`na-south-1`、`me-east-1`、`me-central-1`

默认地域为 `cn-hangzhou`（`SI_REGION` > `ALIYUN_REGION` > `provider.region`）。

### 运行时

`nodejs20`、`nodejs18`、`nodejs16`、`nodejs14`、`nodejs12`、`nodejs10`、`python3.12`、`python3.10`、`python3.9`、`python3.6`、`java11`、`java8`、`php7.2`、`go1`、`dotnet_core3.1`

## 支持的资源

| 资源 | 阿里云服务 | 说明 |
| --- | --- | --- |
| 函数 | 函数计算 FC3 | 支持代码包与容器镜像 |
| 对象存储 | OSS | 支持版本控制、ACL、自定义域名、CDN |
| 事件 | API 网关 | 支持自定义域名与证书 |
| 数据库 | RDS Serverless（MySQL / PostgreSQL / SQL Server）、ES Serverless | 弹性 CU |
| 表格存储 | TableStore | `tables` 配置 |
| CDN | 支持 | OSS 与 API 网关可接入 CDN |
| 自定义域名 | 支持 | 函数与网关均支持 |

## 供应商配置要点

- `provider.name: aliyun`，`provider.region` 必须为上表中的地域之一，否则 `validate` 报错
- 函数名长度上限 64 字符
- 私网资源通过 `network`（VPC / 子网 / 安全组）配置
- 数据库密码建议使用 `${vars.db_password}` 引用变量，避免明文；部署时可用 `-p db_password=xxx` 覆盖

## 故障排查

| 现象 | 可能原因 / 处理 |
| --- | --- |
| `region` 校验失败 | 地域不在阿里云枚举列表中，请使用上表之一 |
| 函数名过长 | 阿里云函数名上限 64 字符 |
| 凭证缺失 | 未设置 AccessKey 环境变量，或临时凭证缺少 `ALIYUN_SECURITY_TOKEN` |
| SAAS 后端报错 | 未登录控制台，执行 `si login` 或部署时加 `--si-api-key` |
| `local` 调试失败 | 本地开发仅支持阿里云函数，确认 `provider.name: aliyun` |
