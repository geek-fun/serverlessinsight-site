---
title: 腾讯云 Tencent
description: 在腾讯云上使用 ServerlessInsight 的认证、地域、运行时与资源说明
---

# 腾讯云 Tencent

腾讯云支持函数计算（SCF）、对象存储（COS）与数据库（TDSQL-C Serverless、ES Serverless）。

> ⚠️ **腾讯云不支持 `events`（API 网关资源）。** 若要通过 HTTP 暴露函数，请在函数上使用 `triggers.http`；系统会创建 SCF 函数 URL 触发器，而非独立的 API 网关。

## 快速开始

### 1. 配置凭证

```bash
export TENCENTCLOUD_SECRET_ID="your-secret-id"
export TENCENTCLOUD_SECRET_KEY="your-secret-key"
# 可选：使用临时凭证时
export TENCENTCLOUD_SECURITY_TOKEN="your-security-token"
```

### 2. 编写配置

```yaml
version: 0.1.0
provider:
  name: tencent
  region: ap-guangzhou
app: hello-world
service: hello-world-api

functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: Nodejs18.15
      handler: index.handler
      path: artifacts/hello-world-api.zip
    triggers:
      http:
        auth_type: public
```

### 3. 部署

```bash
si validate
si deploy --stage dev
```

## 认证

| 变量 | 说明 |
| --- | --- |
| `TENCENTCLOUD_SECRET_ID` | SecretId |
| `TENCENTCLOUD_SECRET_KEY` | SecretKey |
| `TENCENTCLOUD_SECURITY_TOKEN` | 临时凭证 Token（可选） |

命令行参数 `-k`、`-x`、`-n` 同样可覆盖。

## 地域与运行时

### 地域（自由输入）

腾讯云地域为自由文本（如 `ap-guangzhou`、`ap-shanghai`、`ap-beijing`），不做枚举强制校验。

### 运行时

`Nodejs18.15`、`Nodejs16.13`、`Nodejs14.18`、`Nodejs12.16`、`Nodejs10.15`、`Python3.10`、`Python3.9`、`Python3.7`、`Python3.6`、`Java8`、`Php8.0`、`Php7.4`、`Php7.2`、`Php5.6`、`Go1`

## 支持的资源

| 资源 | 腾讯云服务 | 说明 |
| --- | --- | --- |
| 函数 | SCF | 支持代码包；HTTP 入口使用 `triggers.http` |
| 对象存储 | COS | 支持版本控制、ACL、自定义域名 |
| 数据库 | TDSQL-C Serverless、ES Serverless | 弹性 CU |
| 事件（API 网关） | — | **不支持**，请用 `triggers.http` |
| 表格存储 | — | 暂不支持 |
| CDN | — | 不支持（仅 DNSPod DNS） |

## 供应商配置要点

- `provider.name: tencent`
- 通过 `functions.<name>.triggers.http.auth_type`（`public` / `iam`）暴露 HTTP 入口
- 域名解析通过 DNSPod，不支持 CDN 加速
- 数据库密码建议使用 `${vars.db_password}` 引用变量，避免明文；部署时可用 `-p db_password=xxx` 覆盖

## 故障排查

| 现象 | 可能原因 / 处理 |
| --- | --- |
| `events` 校验/部署报错 | 腾讯云不支持 API 网关资源，改用 `triggers.http` |
| 凭证缺失 | 未设置 SecretId / SecretKey，或临时凭证缺少 Token |
| 数据库类型不支持 | 仅 TDSQL-C Serverless 与 ES Serverless 可用 |
| SAAS 后端报错 | 未登录控制台，执行 `si login` 或部署时加 `--si-api-key` |
