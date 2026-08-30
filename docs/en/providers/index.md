---
title: Provider Overview
description: Cloud providers supported by ServerlessInsight and their resource capability matrix
---

# Provider Overview

ServerlessInsight hides cloud-provider differences behind a single `serverlessinsight.yml` config. The table below lists the resources that are **actually deployable** on each provider today.

> Huawei Cloud and AWS only appear in the provider enum and are not deployable yet: Huawei Cloud currently only generates HCL/Terraform templates and `deploy` throws; AWS has no deployment path wired up.

## Capability Matrix

| Resource type | Aliyun | Tencent | Volcengine |
| --- | --- | --- | --- |
| Function compute | FC3 | SCF | VeFaaS |
| Object storage | OSS | COS | TOS |
| API Gateway / Events | API Gateway | SCF Function URL (no standalone APIGW resource) | API Gateway |
| Databases | RDS Serverless, ES Serverless | TDSQL-C Serverless, ES Serverless | — |
| Table store | TableStore | — | — |
| CDN | Yes (OSS + APIGW) | No (DNSPod DNS only) | No |
| Custom domain | Yes | Yes (DNSPod) | APIGW domain only |

## Command Support

| Command | Aliyun | Tencent | Volcengine |
| --- | --- | --- | --- |
| `validate` | ✅ | ✅ | ✅ |
| `plan` | ✅ | ✅ | ❌ (not supported) |
| `deploy` / `destroy` | ✅ | ✅ | ✅ |
| `local` | ✅ (local emulator) | ❌ | ❌ |
| `show` | ✅ | ✅ | ✅ |

## Provider Docs

- [Aliyun](/en/providers/aliyun) — full support, most complete
- [Volcengine](/en/providers/volcengine) — functions, object storage, API gateway
- [Tencent Cloud](/en/providers/tencent) — functions, object storage, databases (no API Gateway resource)

## Shared Configuration Model

All providers share the same config syntax—see the [Configuration Reference](/en/reference). Differences in authentication, available regions, and runtimes are covered on each provider page.
