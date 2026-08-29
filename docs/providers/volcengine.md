---
title: 火山引擎 Volcengine
description: 在火山引擎上使用 ServerlessInsight 的认证、地域、运行时与资源说明
---

# 火山引擎 Volcengine

火山引擎支持函数计算（VeFaaS）、对象存储（TOS）与 API 网关。目前**不支持**数据库与表格存储资源。

## 快速开始

### 1. 配置凭证

```bash
export VOLCENGINE_ACCESS_KEY="your-access-key-id"
export VOLCENGINE_SECRET_KEY="your-access-key-secret"
# 可选：使用临时凭证时
export VOLCSTACK_SESSION_TOKEN="your-session-token"
```

### 2. 编写配置

```yaml
version: 0.1.0
provider:
  name: volcengine
  region: cn-beijing
app: hello-world
service: hello-world-api

functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: node20/v1
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

> 火山引擎暂不支持 `plan` 命令；请直接执行 `validate` 后 `deploy`。

## 认证

支持以下环境变量（多组别名均可）：

| 变量 | 说明 |
| --- | --- |
| `VOLCENGINE_ACCESS_KEY` 或 `VOLCSTACK_ACCESS_KEY_ID` 或 `VOLCENGINE_ACCESS_KEY_ID` | AccessKey ID |
| `VOLCENGINE_SECRET_KEY` 或 `VOLCSTACK_SECRET_ACCESS_KEY` 或 `VOLCENGINE_ACCESS_KEY_SECRET` | AccessKey Secret |
| `VOLCSTACK_SESSION_TOKEN` 或 `VOLCENGINE_SESSION_TOKEN` | 临时凭证 Token（可选） |

命令行参数 `-k`、`-x`、`-n` 同样可覆盖。

## 地域与运行时

### 地域（提示性，非强制）

`cn-beijing`、`cn-shanghai`、`cn-guangzhou`、`ap-southeast-1`

默认地域为 `cn-beijing`。

### 运行时（原生）

`golang/v1`、`native/v1`、`nativejava8/v1`、`node14/v1`、`node20/v1`、`nodeprime14/v1`、`python3.12/v1`、`python3.9/v1`、`native-python3.12/v1`、`native-node20/v1`

## 支持的资源

| 资源 | 火山引擎服务 | 说明 |
| --- | --- | --- |
| 函数 | VeFaaS | 支持代码包 |
| 对象存储 | TOS | 支持版本控制、ACL、自定义域名 |
| 事件 | API 网关 | 支持自定义域名（仅 APIGW 域名） |
| 数据库 | — | 暂不支持 |
| 表格存储 | — | 暂不支持 |

## 供应商配置要点

- `provider.name: volcengine`
- 地域为自由输入，但建议使用上表之一以获得最佳兼容性
- 自定义域名仅限 API 网关域名场景

## 故障排查

| 现象 | 可能原因 / 处理 |
| --- | --- |
| `plan` 报错 | 火山引擎暂不支持 `plan`，请使用 `validate` + `deploy` |
| 凭证缺失 | 未设置 AccessKey 环境变量，或临时凭证缺少 Token |
| 数据库/表格报错 | 火山引擎暂不支持 `databases` 与 `tables` |
| SAAS 后端报错 | 未登录控制台，执行 `si login` 或部署时加 `--si-api-key` |
