---
title: Configuration Model
description: ServerlessInsight's configuration model, resource types, and lifecycle concepts
---

# Configuration Model

ServerlessInsight is built around Infrastructure as Code (IaC): you declaratively describe the cloud resources you need in a `serverlessinsight.yml` file at the project root, and the CLI provisions, updates, and tears down those resources on the target cloud provider.

This page describes the generic configuration model and resource types. Differences between providers—resource coverage, authentication, regions, and runtimes—are covered in the [Provider Overview](/en/providers/) and each provider page.

## Project Structure

A recommended project layout:

```
my-app/
├── artifacts/              # packaged artifacts (function zip, etc.)
├── src/                    # source code
├── serverlessinsight.yml   # resource config (required)
├── package.json
└── tsconfig.json
```

`serverlessinsight.yml` is the only required file and lives at the project root.

## Configuration Overview

Top-level fields of `serverlessinsight.yml`:

| Field | Required | Description |
| --- | --- | --- |
| `version` | yes | Config format version: `0.0.0` / `0.0.1` / `0.1.0` |
| `provider` | yes | Cloud provider, with `name` and `region` |
| `app` | yes | App name, lowercase letter start, `[a-z0-9-]` only |
| `service` | yes | Service name, same naming rule as `app` |
| `vars` | no | Global variables, referenced via `${vars.xxx}` |
| `stages` | no | Multi-environment definitions; each stage can override `region`, variables, etc. |
| `tags` | no | Resource tags |
| `functions` | no | Function compute resources |
| `events` | no | Event triggers (API Gateway) |
| `databases` | no | Database resources |
| `buckets` | no | Object storage resources |
| `tables` | no | Table store resources |
| `backend` | no | State backend configuration |

Minimal valid config:

```yaml
version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou
app: hello-world
service: hello-world-api
```

> Only `aliyun`, `tencent`, and `volcengine` can actually be deployed. `huawei` and `aws` appear in the enum but are not deployable yet.

## Resource Types

### Functions

The key is the function reference name; the inner `name` is the cloud function name (required). Code is specified via `code`:

```yaml
functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/hello-world-api.zip
    memory: 512          # default 128 (MB)
    timeout: 10           # default 3 (seconds)
    environment:
      NODE_ENV: prod
```

Common fields:

- `code`: `runtime`, `handler`, `path` required (path to the code package)
- `container`: `image` and `port` required (container image deployment)
- `memory`: memory limit, default 128
- `timeout`: timeout in seconds, default 3
- `gpu`: GPU spec (`TESLA_*` / `AMPERE_*` / `ADA_*`)
- `environment`: environment variable key-values
- `network`: private network (`vpc_id`, `subnet_ids`, `security_group`)
- `iam.role`: function execution role (string or policy object)
- `triggers.http`: HTTP trigger (`auth_type` is `public` or `iam`)
- `domain`: custom domain (`domain_name` required)
- `storage`: disk and NAS mounts

> Supported runtimes differ per provider—see the provider page. Runtimes are validated per provider at `validate` / `plan` time.

### Events (API Gateway)

Currently only the `API_GATEWAY` event type is supported:

```yaml
events:
  gateway_event:
    name: insight-poc-gateway
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: hello_world_fn
```

- `triggers` is an array; each item has `method` (GET/POST/PUT/DELETE/ANY), `path`, and `backend` (bound function reference)
- `domain`: custom domain and certificate
- `network`: the VPC/subnets the gateway lives in

> ⚠️ **Tencent Cloud does not support `events` (API Gateway resources).** Tencent functions expose an HTTP entry via `triggers.http` on the function—see [Tencent Cloud](/en/providers/tencent).

### Buckets

```yaml
buckets:
  assets:
    name: my-app-assets
    storage:
      class: STANDARD
    versioning:
      status: Enabled
    security:
      acl: PUBLIC_READ
    domain:
      domain_name: cdn.example.com
      protocol: HTTPS
```

- `name`: bucket name (required)
- `storage.class`: storage class (required)
- `versioning.status`: versioning status
- `security.acl`: `PRIVATE` / `PUBLIC_READ` / `PUBLIC_READ_WRITE`
- `domain`: bind a custom domain (certificate and CDN supported)
- `website`: static website hosting (its `domain` is deprecated in favor of top-level `domain`)
- `iam`: bucket access policy

### Databases

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
        password: "${vars.db_password}"
```

- `type`: `ELASTICSEARCH_SERVERLESS` / `RDS_MYSQL_SERVERLESS` / `RDS_PGSQL_SERVERLESS` / `RDS_MSSQL_SERVERLESS` / `TDSQL_C_SERVERLESS`
- `version`: varies by `type` (e.g. `MYSQL_8.0`, `PGSQL_16`, `ES_SEARCH_7.10`)
- `cu`: elastic compute unit range (`min` / `max`)
- `storage`: storage capacity range (integer)
- `security.basic_auth.password`: required
- `network`: access type (`PUBLIC` / `PRIVATE`), VPC, and security rules

> Not every provider supports every database type—see the [Provider Overview](/en/providers/) capability matrix.

### Tables

```yaml
tables:
  sessions:
    collection: sessions
    name: session-table
    type: TABLE_STORE_C
    key_schema:
      - name: pk
        type: HASH
    attributes:
      - name: pk
        type: STRING
    throughput:
      reserved:
        read: 0
        write: 0
```

- `collection` / `name` / `type` / `key_schema` / `attributes` are required
- `type`: `TABLE_STORE_C` / `TABLE_STORE_H`
- `key_schema`: primary key (`HASH` / `RANGE`)
- `attributes`: attribute columns (`STRING` / `INTEGER` / `DOUBLE` / `BOOLEAN` / `BINARY`)
- `throughput`: reserved or on-demand read/write capacity
- `network`: `PUBLIC` / `PRIVATE`

> Currently only **Aliyun (TableStore)** supports `tables`.

### State Backend

```yaml
backend:
  state_manager:
    type: BUCKET_STORE
    bucket: my-state-bucket
    key: si-state/
```

- `state_manager.type`: `LOCAL` or `BUCKET_STORE`
- If `backend` is omitted, ServerlessInsight uses its managed SAAS state backend (requires `si login` or `SI_API_KEY`)

## Providers and Stages

`provider` selects the target cloud, while `stages` let you manage multiple environments from one config:

```yaml
provider:
  name: aliyun
  region: cn-hangzhou

vars:
  memory: 512

stages:
  dev:
    region: cn-hangzhou
    memory: 256
  prod:
    region: cn-shanghai
    memory: 1024
```

References:

- `${vars.memory}` references a global variable
- `${stage.region}`, `${stage.memory}` reference the current stage's values
- Select an environment at deploy time with `-s/--stage <stage>`; defaults to `default`

## Local Development

`si local` runs the defined functions locally for debugging (currently **Aliyun** functions only):

```bash
si local --stage dev
```

- Serves a local HTTP endpoint on port `4567`
- `--watch` is on by default; code changes reload automatically
- `--debug` enables debug mode

## Next Steps

- Want to run your first app? Go to [Getting Started](/en/getting-started)
- See the [Provider Overview](/en/providers/) for capability differences
- CLI usage is in the [CLI Reference](/en/cli)
