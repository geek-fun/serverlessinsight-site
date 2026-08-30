---
title: Getting Started
description: Install the ServerlessInsight CLI, understand the configuration model, and deploy your first Serverless app
platforms: true
---

# Getting Started

This guide walks a complete ServerlessInsight journey: installing the CLI, understanding the `serverlessinsight.yml` configuration model, deploying your first app, and debugging it locally. You'll learn not just *how* but *why* each piece of configuration exists. For field-level values, see the [Configuration Reference](/en/reference).

## 1. Install the CLI

Prerequisites: Node.js >= 18, npm >= 8.

```bash
npm install -g @geek-fun/serverlessinsight
si --version
```

`si` is the single entry point: validate, deploy, destroy, and local debugging all go through it.

## 2. Create a project

```bash
mkdir hello-world && cd hello-world
```

Recommended project structure:

```
hello-world/
├── artifacts/              # packaged function code (zip artifacts)
├── src/                    # source code
└── serverlessinsight.yml   # resource config (the only required file)
```

`serverlessinsight.yml` is everything to ServerlessInsight. It declaratively describes *which* cloud resources you want, and `si deploy` turns that declaration into real infrastructure. The traditional route — clicking through consoles to create functions, gateways, and databases — becomes sections of YAML in one file.

## 3. Understand the configuration model

Before writing your first config, spend a minute on its skeleton. A `serverlessinsight.yml` has two parts:

- **Global skeleton**: `version` (config format version), `provider` (which cloud and region), `app` / `service` (project and service identity used in all resource naming), `vars` / `stages` (variables and environments);
- **Resource declarations**: `functions`, `events` (API gateway entry), and `databases` / `tables` / `buckets` (the data and storage layer).

A minimal deployable config (Aliyun example):

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

What each piece is saying:

- `provider` decides where every resource lands. Deployable providers today are `aliyun`, `tencent`, and `volcengine` (`huawei` and `aws` are not yet deployable). Switching providers means switching runtime identifiers and capability matrices — see the [Provider Overview](/en/providers/).
- `app` and `service` must be static strings (lowercase letters, digits, `-`) because they must be known before variable resolution, and they prefix every cloud resource name.
- In `functions`, the key `hello_world_fn` is the **reference name** — later, `events` uses it in `backend` to point at this function. The inner `name` is the actual cloud function name. A function takes one of two shapes: `code` (code package) or `container` (image), never both.
- The `code` triple is all required: `runtime` is the cloud execution environment (validated per provider — Aliyun's `nodejs18`, Volcengine's `node20/v1`), `handler` is the `file.exportedFunction` entry, `path` points at the build artifact in `artifacts/`.
- Unspecified fields have sensible defaults: `memory` defaults to 128 MB, `timeout` to 3 seconds — enough to start, adjust as you grow.

### Give the function an HTTP entry

The function above has no trigger yet. The quickest path is an API gateway that forwards `GET /api/*` to it:

```yaml
events:
  gateway_event:
    name: hello-world-gateway
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: hello_world_fn   # the function's reference name, not its `name`
```

Each entry in `triggers` is a route: `method` accepts `GET` / `POST` / `PUT` / `DELETE` / `ANY`, `path` starts with `/` and supports the `*` wildcard, and `backend` holds the function's reference name. Multiple rules can target different functions — the standard shape for "a set of endpoints".

> ⚠️ **Tencent Cloud does not support `events`.** Tencent functions expose HTTP via `triggers.http` on the function itself — see [Tencent Cloud](/en/providers/tencent).

### Beyond functions: data and storage

Real applications need a data layer. Declare it in the same file and the CLI creates it — network wiring included — during deploy:

```yaml
databases:
  main_db:
    name: main-db
    type: RDS_MYSQL_SERVERLESS
    version: MYSQL_8.0
    cu:
      min: 0
      max: 8
    security:
      basic_auth:
        master_user: dbadmin
        password: "${vars.db_password}"

buckets:
  assets:
    name: hello-world-assets
    storage:
      class: STANDARD
```

`cu.min/max` is the essence of serverless databases — scale to 0 CU when idle (no compute cost) and burst automatically under load. Full fields and enum values for every resource are in the [Configuration Reference](/en/reference).

### Variables and environments

Everything so far is hard-coded. Extract it into variables and one file serves all environments:

```yaml
vars:
  memory: 512

stages:
  dev:
    memory: 256
  prod:
    memory: 1024

functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/hello-world-api.zip
    memory: ${stages.memory}        # the current stage's memory
    environment:
      STAGE: ${ctx.stage}           # built-in context: current stage name
```

The three references have distinct jobs: `${vars.*}` is team-defined (overridable at deploy time with `-p`, the right place for secrets), `${stages.*}` reads the current environment's overrides, and `${ctx.stage}` is CLI-injected runtime context. Never commit secrets — inject them with `si deploy -p db_password=xxx`.

## 4. Configure cloud credentials

Credentials never live in the config — they are injected via environment variables. Pick your platform at the top of the page to see the matching variables (Aliyun is the default):

::: platform aliyun
```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_REGION="cn-hangzhou"
```

Variable names and setup details: [Aliyun provider page](/en/providers/aliyun).
:::

::: platform tencent
```bash
export TENCENTCLOUD_SECRET_ID="your-secret-id"
export TENCENTCLOUD_SECRET_KEY="your-secret-key"
```

Variable names and setup details: [Tencent Cloud provider page](/en/providers/tencent).
:::

::: platform volcengine
```bash
export VOLCENGINE_ACCESS_KEY_ID="your-access-key-id"
export VOLCENGINE_ACCESS_KEY_SECRET="your-access-key-secret"
```

Variable names and setup details: [Volcengine provider page](/en/providers/volcengine).
:::

> ⚠️ Use a RAM sub-user's AccessKey, not the root account; never commit keys to a repository.

## 5. Deploy

```bash
# Validate: runtimes, enums, and required fields are all checked here
si validate

# Package code into artifacts/ (or use your own build script)

# Deploy
si deploy --stage dev
```

`si deploy` diffs against the state file to decide "what changes this time": creates missing resources, updates changed ones, and tears down removed ones. The first deploy provisions everything; every later one is incremental.

## 6. Local debugging

Deploying on every change is too slow. `si local` runs your functions in local processes, with your real handler code answering requests (currently Aliyun functions only):

```bash
si local --stage dev
```

The local server listens on port `4567` and routes requests per your `events` rules; `--watch` is on by default so saving code hot-reloads; `--debug` works with IDE breakpoints.

## 7. Clean up

```bash
si destroy --stage dev
```

Destroy tears down resources one by one from the state file. Non-empty buckets fail teardown — that's protection against accidental deletion; once confirmed, temporarily set `security.force_delete: true`.

## Next Steps

- [Configuration Reference](/en/reference) — every resource, field, and valid value
- [Provider Overview](/en/providers/) — capability matrix and per-cloud differences
- [CLI Reference](/en/cli) — all commands and options
- [Case Studies](/en/case-study) — real-world examples