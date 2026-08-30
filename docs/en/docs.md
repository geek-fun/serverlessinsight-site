---
title: Documentation
description: ServerlessInsight documentation hub
---

# Documentation

Welcome to the ServerlessInsight documentation center. The entries below are organized by topic to take you from first steps to mastery.

## Getting Started

- [Introduction](/en/introduction) — core ideas and use cases
- [Getting Started](/en/getting-started) — install the CLI and deploy your first app in 5 minutes
- [Configuration Model](/en/concepts) — `serverlessinsight.yml` structure and core ideas
- [Configuration Reference](/en/reference) — all resources, fields, and valid values

## Providers

- [Provider Overview](/en/providers/) — capability matrix and command support
- [Aliyun](/en/providers/aliyun)
- [Volcengine](/en/providers/volcengine)
- [Tencent Cloud](/en/providers/tencent)

## Reference & Help

- [CLI Reference](/en/cli) — all commands and options
- [FAQ](/en/faq) — common questions
- [Case Studies](/en/case-study) — real-world examples
- [Support](/en/support) — how to get help and give feedback

## Minimal Example

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
```

> Huawei Cloud and AWS are not deployable yet; they only appear in the provider enum.
