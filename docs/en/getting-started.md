---
title: Getting Started
description: Install the ServerlessInsight CLI and deploy your first Serverless app in 5 minutes
---

# Getting Started

This guide helps you install the ServerlessInsight CLI and deploy your first Serverless application in 5 minutes. Authentication, regions, and resources differ across cloud providers—follow the provider-specific [quick start](/en/providers/) for exact steps.

## 1. Install the CLI

Prerequisites: Node.js >= 18, npm >= 8.

```bash
npm install -g @geek-fun/serverlessinsight
si --version
```

## 2. Create a project

```bash
mkdir hello-world && cd hello-world
```

Recommended project structure:

```
hello-world/
├── artifacts/              # packaged function code
├── src/                    # source code
└── serverlessinsight.yml   # config file
```

Write a minimal `serverlessinsight.yml` (Aliyun example):

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

## 3. Choose a provider and configure credentials

ServerlessInsight supports multiple cloud providers, but authentication and environment variables differ:

- [Aliyun quick start](/en/providers/aliyun)
- [Volcengine quick start](/en/providers/volcengine)
- [Tencent Cloud quick start](/en/providers/tencent)

> Huawei Cloud and AWS are not deployable yet; they only appear in the provider enum.

After setting the provider's environment variables (AccessKey, etc.), deploy:

```bash
# Validate the config
si validate

# Deploy to the dev stage
si deploy --stage dev
```

## 4. Clean up

```bash
si destroy --stage dev
```

## Next Steps

- Learn the full [Configuration Model](/en/concepts)
- See the [Provider Overview](/en/providers/) capability matrix
- Read the [CLI Reference](/en/cli) for all commands
