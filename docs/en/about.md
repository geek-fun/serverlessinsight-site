---
title: "About us"
description: "ServerlessInsight's product positioning, engineering principles and the team behind declarative multi-cloud serverless deployments."
---
# About us

ServerlessInsight is an open-source full-stack serverless platform: define, validate and incrementally deploy cross-cloud resources from one declarative YAML.

## What we build

Serverless products across clouds are converging in capability but not in configuration model: functions, API gateways, object storage and databases are declared differently on Alibaba Cloud, Tencent Cloud and Volcengine. Moving a team to another cloud usually means rewriting the deployment scripts and operations process.

ServerlessInsight abstracts that layer:

- **One configuration** — declare functions, gateways, buckets, databases, event bindings and domains in YAML
- **Multi-cloud execution** — the same configuration lands on Alibaba Cloud FC3 / API Gateway / OSS, Tencent Cloud SCF / COS, Volcengine veFaaS / TOS per provider
- **Incremental and verifiable** — parse, validate, change preview, execution and state recording form one loop; deployment state is isolated per service / stage / region
- **Reversible** — every deployment has explicit state ownership, and destructive operations require confirmation

## Engineering principles

| Principle | Meaning |
| --- | --- |
| Declarative first | Users describe *what* they want, not *how*; the tool computes the diff and ordering |
| Cloud-provider neutral | The abstraction is decoupled from each provider, so new clouds never break existing configuration |
| Observable | Deployment progress, state changes and failures are recorded in a verifiable form |
| Open and auditable | Core capabilities are open source (Apache-2.0); anyone can read the implementation and contribute |

## Product forms

| Form | Purpose |
| --- | --- |
| CLI (`si`) | Define, validate and deploy locally; fits into CI/CD pipelines |
| Console | Team collaboration, resource views, deployment history and billing |

See [pricing](/en/pricing.html) for plans and [getting started](/en/getting-started.html) to begin.

## Contact

- Support: support@wentsen.com
- Business: support@wentsen.com
- More channels: [support](/en/support.html) and [contact us](/en/contact.html)
