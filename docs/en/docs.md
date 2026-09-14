---
title: Documentation
description: ServerlessInsight documentation hub
---

# Documentation

Welcome to the ServerlessInsight documentation center. The entries below are organized by topic to take you from first steps to mastery.

## Getting Started

- [Introduction](/en/introduction) — core ideas and use cases
- [Getting Started](/en/getting-started) — install the CLI, learn the config model, deploy your first app
- [Configuration Reference](/en/reference) — all resources, fields, and valid values

## Platform Support

- Deployable platforms: **Aliyun · Tencent Cloud · Volcengine** — switch perspective with the selector at the top of doc pages (Aliyun is the default)
- Capability matrix, command differences, regions, and credentials: see the [Configuration Reference](/en/reference)

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
