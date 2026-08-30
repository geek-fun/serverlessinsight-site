---
title: Aliyun
description: Authentication, regions, runtimes, and resources for using ServerlessInsight on Aliyun
---

# Aliyun

Aliyun is the most fully supported provider in ServerlessInsight, covering Function Compute (FC3), Object Storage (OSS), API Gateway, databases (RDS / ES Serverless), Table Store (TableStore), CDN, and custom domains.

## Quick Start

### 1. Configure credentials

```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
# Optional: when using STS temporary credentials
export ALIYUN_SECURITY_TOKEN="your-security-token"
# Optional: default region
export ALIYUN_REGION="cn-hangzhou"
```

### 2. Write the config

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

### 3. Deploy

```bash
si validate
si deploy --stage dev
```

## Authentication

Supported environment variables (either set works):

| Variable | Description |
| --- | --- |
| `ALIYUN_ACCESS_KEY_ID` or `ALIBABA_CLOUD_ACCESS_KEY_ID` | AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` or `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | AccessKey Secret |
| `ALIYUN_SECURITY_TOKEN` or `ALIBABA_CLOUD_SECURITY_TOKEN` | STS temporary token (optional) |

CLI flags also override: `-k/--accessKeyId`, `-x/--accessKeySecret`, `-n/--securityToken`.

> Security: use a RAM sub-user AccessKey and never commit secrets to a repo.

If you use the managed SAAS state backend (when `backend` is omitted), authenticate with `si login` (using `SI_API_KEY`) or pass `--si-api-key` at deploy time.

## Regions and Runtimes

### Regions (enforced — only these are allowed)

`cn-qingdao`, `cn-beijing`, `cn-zhangjiakou`, `cn-huhehaote`, `cn-wulanchabu`, `cn-hangzhou`, `cn-shanghai`, `cn-shenzhen`, `cn-heyuan`, `cn-guangzhou`, `cn-chengdu`, `cn-hongkong`, `ap-southeast-1`, `ap-southeast-3`, `ap-southeast-5`, `ap-southeast-6`, `ap-southeast-7`, `ap-northeast-1`, `ap-northeast-2`, `eu-central-1`, `eu-west-1`, `us-east-1`, `us-west-1`, `na-south-1`, `me-east-1`, `me-central-1`

Default region is `cn-hangzhou` (`SI_REGION` > `ALIYUN_REGION` > `provider.region`).

### Runtimes

`nodejs20`, `nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10`, `python3.12`, `python3.10`, `python3.9`, `python3.6`, `java11`, `java8`, `php7.2`, `go1`, `dotnet_core3.1`

## Supported Resources

| Resource | Aliyun service | Notes |
| --- | --- | --- |
| Functions | Function Compute FC3 | Code package or container image |
| Object storage | OSS | Versioning, ACL, custom domain, CDN |
| Events | API Gateway | Custom domain and certificate |
| Databases | RDS Serverless (MySQL / PostgreSQL / SQL Server), ES Serverless | Elastic CU |
| Tables | TableStore | `tables` config |
| CDN | Yes | OSS and API Gateway can use CDN |
| Custom domain | Yes | Functions and gateways |

## Provider Configuration Notes

- `provider.name: aliyun`, `provider.region` must be one of the list above or `validate` fails
- Function name length limit: 64 characters
- Private-network resources use `network` (VPC / subnets / security group)
- Use `${vars.db_password}` to reference a variable instead of hardcoding; override at deploy time with `-p db_password=xxx`

## Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| `region` validation fails | Region not in the Aliyun enum; use one from the list |
| Function name too long | Aliyun limit is 64 characters |
| Missing credentials | AccessKey env vars unset, or STS token missing `ALIYUN_SECURITY_TOKEN` |
| SAAS backend error | Not logged in; run `si login` or pass `--si-api-key` |
| `local` fails | Local dev is Aliyun-only; ensure `provider.name: aliyun` |
