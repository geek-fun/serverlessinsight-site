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
      runtime: nodejs18
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

The config uses standard identifiers; the CLI maps them to Tencent's native runtimes at deploy time:

`nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10`, `python3.10`, `python3.9`, `python3.7`, `python3.6`, `java8`, `php8.0`, `php7.4`, `php7.2`, `php5.6`, `go1`

(Native mappings include `Nodejs18.15`, `Nodejs16.13`, `Python3.10`, `Java8`, `Php8.0`, `Go1`, etc. — you never write these in the config.)

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
