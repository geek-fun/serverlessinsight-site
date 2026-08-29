---
title: Tencent Cloud
description: Authentication, regions, runtimes, and resources for using ServerlessInsight on Tencent Cloud
---

# Tencent Cloud

Tencent Cloud supports function compute (SCF), object storage (COS), and databases (TDSQL-C Serverless, ES Serverless).

> ⚠️ **Tencent Cloud does not support `events` (API Gateway resources).** To expose a function over HTTP, use `triggers.http` on the function—ServerlessInsight creates an SCF Function URL trigger instead of a standalone API Gateway.

## Quick Start

### 1. Configure credentials

```bash
export TENCENTCLOUD_SECRET_ID="your-secret-id"
export TENCENTCLOUD_SECRET_KEY="your-secret-key"
# Optional: when using temporary credentials
export TENCENTCLOUD_SECURITY_TOKEN="your-security-token"
```

### 2. Write the config

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

### 3. Deploy

```bash
si validate
si deploy --stage dev
```

## Authentication

| Variable | Description |
| --- | --- |
| `TENCENTCLOUD_SECRET_ID` | SecretId |
| `TENCENTCLOUD_SECRET_KEY` | SecretKey |
| `TENCENTCLOUD_SECURITY_TOKEN` | Temporary token (optional) |

CLI flags `-k`, `-x`, `-n` also override.

## Regions and Runtimes

### Regions (free-form)

Tencent regions are free text (e.g. `ap-guangzhou`, `ap-shanghai`, `ap-beijing`) and are not enum-enforced.

### Runtimes

`Nodejs18.15`, `Nodejs16.13`, `Nodejs14.18`, `Nodejs12.16`, `Nodejs10.15`, `Python3.10`, `Python3.9`, `Python3.7`, `Python3.6`, `Java8`, `Php8.0`, `Php7.4`, `Php7.2`, `Php5.6`, `Go1`

## Supported Resources

| Resource | Tencent service | Notes |
| --- | --- | --- |
| Functions | SCF | Code package; HTTP entry via `triggers.http` |
| Object storage | COS | Versioning, ACL, custom domain |
| Databases | TDSQL-C Serverless, ES Serverless | Elastic CU |
| Events (API Gateway) | — | **Not supported**; use `triggers.http` |
| Tables | — | Not supported |
| CDN | — | Not supported (DNSPod DNS only) |

## Provider Configuration Notes

- `provider.name: tencent`
- Expose HTTP entry via `functions.<name>.triggers.http.auth_type` (`public` / `iam`)
- DNS resolution via DNSPod; CDN acceleration is not supported
- Use `${vars.db_password}` to reference a variable for database passwords; override at deploy time with `-p db_password=xxx`

## Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| `events` validation/deploy error | Tencent has no API Gateway resource; use `triggers.http` |
| Missing credentials | SecretId / SecretKey unset, or temporary token missing |
| Unsupported DB type | Only TDSQL-C Serverless and ES Serverless are available |
| SAAS backend error | Not logged in; run `si login` or pass `--si-api-key` |
