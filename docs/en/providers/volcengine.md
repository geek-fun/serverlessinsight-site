---
title: Volcengine
description: Authentication, regions, runtimes, and resources for using ServerlessInsight on Volcengine
---

# Volcengine

Volcengine supports function compute (VeFaaS), object storage (TOS), and API Gateway. Databases and tables are **not** supported yet.

## Quick Start

### 1. Configure credentials

```bash
export VOLCENGINE_ACCESS_KEY="your-access-key-id"
export VOLCENGINE_SECRET_KEY="your-access-key-secret"
# Optional: when using temporary credentials
export VOLCSTACK_SESSION_TOKEN="your-session-token"
```

### 2. Write the config

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

### 3. Deploy

```bash
si validate
si deploy --stage dev
```

> Volcengine does not support the `plan` command yet; run `validate` then `deploy` directly.

## Authentication

Supported environment variables (aliases all accepted):

| Variable | Description |
| --- | --- |
| `VOLCENGINE_ACCESS_KEY` or `VOLCSTACK_ACCESS_KEY_ID` or `VOLCENGINE_ACCESS_KEY_ID` | AccessKey ID |
| `VOLCENGINE_SECRET_KEY` or `VOLCSTACK_SECRET_ACCESS_KEY` or `VOLCENGINE_ACCESS_KEY_SECRET` | AccessKey Secret |
| `VOLCSTACK_SESSION_TOKEN` or `VOLCENGINE_SESSION_TOKEN` | Temporary token (optional) |

CLI flags `-k`, `-x`, `-n` also override.

## Regions and Runtimes

### Regions (informational, not enforced)

`cn-beijing`, `cn-shanghai`, `cn-guangzhou`, `ap-southeast-1`

Default region is `cn-beijing`.

### Runtimes (native)

`golang/v1`, `native/v1`, `nativejava8/v1`, `node14/v1`, `node20/v1`, `nodeprime14/v1`, `python3.12/v1`, `python3.9/v1`, `native-python3.12/v1`, `native-node20/v1`

## Supported Resources

| Resource | Volcengine service | Notes |
| --- | --- | --- |
| Functions | VeFaaS | Code package |
| Object storage | TOS | Versioning, ACL, custom domain |
| Events | API Gateway | Custom domain (APIGW domain only) |
| Databases | — | Not supported |
| Tables | — | Not supported |

## Provider Configuration Notes

- `provider.name: volcengine`
- Region is free-form but use one of the list above for best compatibility
- Custom domains are limited to the API Gateway domain scenario

## Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| `plan` errors | Volcengine has no `plan` support; use `validate` + `deploy` |
| Missing credentials | AccessKey env vars unset, or temporary token missing |
| Database/table errors | Volcengine does not support `databases` or `tables` |
| SAAS backend error | Not logged in; run `si login` or pass `--si-api-key` |
