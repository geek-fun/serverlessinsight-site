# Configuration Reference

This document details the ServerlessInsight configuration specification, including the Infrastructure as Code (IaC) YAML syntax and all available resource types, fields, and valid values. Verified against the `serverlessinsight` v0.7.9 source schema.

## Table of Contents

- [Quick Example](#quick-example)
- [Core Configuration](#core-configuration)
  - [version](#version)
  - [provider](#provider)
  - [vars](#vars)
  - [stages](#stages)
  - [app](#app)
  - [service](#service)
  - [tags](#tags)
  - [backend](#backend)
- [Resource Types](#resource-types)
  - [functions](#functions)
    - [code - Code Deployment](#code---code-deployment)
    - [container - Container Deployment](#container---container-deployment)
    - [memory - Memory](#memory---memory)
    - [timeout - Timeout](#timeout---timeout)
    - [gpu - GPU Configuration](#gpu---gpu-configuration)
    - [log - Log Configuration](#log---log-configuration)
    - [environment - Environment Variables](#environment---environment-variables)
    - [network - Network Configuration](#network---network-configuration)
    - [iam - IAM Role Configuration](#iam---iam-role-configuration)
    - [triggers - Function-level Triggers](#triggers---function-level-triggers)
    - [domain - Function-level Custom Domain](#domain---function-level-custom-domain)
    - [storage - Storage Mounts](#storage---storage-mounts)
  - [events](#events)
    - [triggers - Trigger Rules](#triggers---trigger-rules)
    - [domain - Custom Domain](#domain---custom-domain)
  - [databases](#databases)
  - [tables](#tables)
  - [buckets](#buckets)
- [Variable References](#variable-references)
- [Local Development](#local-development)
- [Best Practices](#best-practices)
- [FAQ](#faq)

## Quick Example

A complete `serverlessinsight.yml` configuration example:

```yaml
version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou

vars:
  region: cn-hangzhou
  account_id: 1234567890
  memory_size: 512

stages:
  dev:
    region: ${vars.region}
    memory: 512
  prod:
    region: ${vars.region}
    memory: 1024

app: my-app
service: my-app-service

tags:
  owner: geek-fun
  project: my-app

functions:
  api_function:
    name: my-api-function
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/function.zip
    memory: ${stages.memory}
    timeout: 30
    environment:
      NODE_ENV: production
      DB_HOST: ${vars.db_host}

events:
  api_gateway:
    type: API_GATEWAY
    name: my-api-gateway
    triggers:
      - method: GET
        path: /api/*
        backend: api_function
      - method: POST
        path: /api/*
        backend: api_function

databases:
  main_db:
    name: main-db
    type: RDS_MYSQL_SERVERLESS
    version: MYSQL_8.0
    security:
      basic_auth:
        password: "${vars.db_password}"
```

## Core Configuration

### version

Specifies the version of the ServerlessInsight YAML configuration file.

```yaml
version: 0.1.0
```

> ⚠️ **Note**: Only version `0.1` is currently supported. Major versions may contain incompatible changes. Ensure your configuration file is compatible with the ServerlessInsight CLI version.

### provider

Configures the cloud provider information.

```yaml
provider:
  name: aliyun
  region: cn-hangzhou
```

**Supported fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Provider name: `aliyun`, `tencent`, `volcengine`, `huawei`, `aws` |
| `region` | string | ✅ | Deployment region |

**Supported Aliyun regions:**

**Mainland China:**
- `cn-qingdao`, `cn-beijing`, `cn-zhangjiakou`, `cn-huhehaote`, `cn-wulanchabu`
- `cn-hangzhou`, `cn-shanghai`, `cn-shenzhen`, `cn-heyuan`, `cn-guangzhou`, `cn-chengdu`

**Asia Pacific:**
- `cn-hongkong`, `ap-southeast-1`, `ap-southeast-3`, `ap-southeast-5`
- `ap-southeast-6`, `ap-southeast-7`, `ap-northeast-1`, `ap-northeast-2`

**Europe & Americas:**
- `eu-central-1`, `eu-west-1`, `us-east-1`, `us-west-1`, `na-south-1`

**Middle East:**
- `me-east-1`, `me-central-1`

> 💡 **Tip**: Provider support status:
> - ✅ **Aliyun** — Full support (FC3, API Gateway, OSS, RDS, TableStore, ES Serverless, CDN)
> - ✅ **Tencent Cloud** — Full support (SCF, COS, ES Serverless, TDSQL-C)
> - ✅ **Volcengine** — Full support (veFaaS, API Gateway, TOS)
> - 🚧 **Huawei Cloud** — Beta (FunctionGraph)
> - 🚧 **AWS** — Planned

### vars

Defines reusable variables that can be referenced in the configuration via `${vars.variableName}`.

```yaml
vars:
  region: cn-hangzhou
  account_id: 1234567890
  memory_size: 512
  db_host: db.example.com
```

**Variable reference example:**

```yaml
functions:
  my_function:
    memory: ${vars.memory_size}
    environment:
      REGION: ${vars.region}
```

**Command-line override:**

Variable defaults can be overridden at deploy time via `--parameter` or `-p`:

```bash
si deploy --stage prod -p memory_size=1024
```

### stages

Defines configuration for different deployment environments. Select the environment via `--stage` or `-s`.

```yaml
stages:
  default:
    domain_name: my-domain.com
    database_name: my-database
  dev:
    domain_name: dev.my-domain.com
    database_name: my-database-dev
    memory: 512
  prod:
    domain_name: my-domain.com
    database_name: my-database-prod
    memory: 2048
```

**Usage example:**

```yaml
app: my-app
service: my-app-service

functions:
  api_function:
    memory: ${stages.memory}
```

**Deploy commands:**

```bash
# Deploy to the dev environment
si deploy --stage dev

# Deploy to the production environment
si deploy --stage prod

# Defaults to `default` when no stage is specified
si deploy
```

> 💡 **Tip**: `${ctx.stage}` is a global predefined variable provided by ServerlessInsight that represents the current deployment stage.

### app

Specifies the application name, used to identify the entire ServerlessInsight project.

```yaml
app: my-app
```

**Naming rules:**
- Must start with a lowercase letter; only lowercase letters, digits, and hyphens (`-`)
- Must be a static string — variables are not allowed
- Globally unique identifier; using the project name is recommended

### service

Specifies the service name. It is used as the prefix for resource IDs and resource names.

```yaml
service: my-app-service
```

**Naming tips:**
- Use lowercase letters, digits, and hyphens (`-`)
- Keep it short (resource names append this service name)
- Must be a static string — variables are not allowed

> ⚠️ **Note**: 
> - Both `app` and `service` are required and must be static strings
> - `service` is different from `<stackName>` on the command line. `service` is used for resource naming; `stackName` is the deployment stack identifier.

### tags

Defines resource tags for resource management, cost allocation, etc.

```yaml
tags:
  owner: geek-fun
  project: my-app
  environment: ${ctx.stage}
```

All created resources automatically carry these tags.

### backend

Configures the backend state storage used to manage deployment state and locks.

```yaml
backend:
  state_manager:
    type: BUCKET_STORE  # or LOCAL
    bucket: my-state-bucket
    key: serverlessinsight/my-service/state.json
```

**Field description:**

| Field | Type | Required | Default | Description |
|------|------|------|--------|------|
| `state_manager.type` | string | ❌ | `LOCAL` | State storage type: `LOCAL` (local file) or `BUCKET_STORE` (object storage) |
| `state_manager.bucket` | string | ⚠️ | - | Bucket name (required for `BUCKET_STORE`) |
| `state_manager.key` | string | ❌ | `state.json` | State file path |

> 💡 **Tip**: Use `BUCKET_STORE` for team collaboration — members share the same state file to avoid deploy conflicts.

## Resource Types

### functions

Defines serverless function compute resources. Supports both code-package deployment (`code`) and container-image deployment (`container`) — choose one.

```yaml
functions:
  function_key:
    name: function-name
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/function.zip
    memory: 512
    timeout: 30
```

**Top-level fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Function name (a-zA-Z0-9-_, 1-64 chars) |
| `code` | object | ⚠️ | Code deployment config (mutually exclusive with `container`; required when `container` is absent) |
| `container` | object | ⚠️ | Container deployment config (mutually exclusive with `code`) |
| `memory` | integer | ❌ | Memory in MB, default 512, range 128-3072 |
| `timeout` | integer | ❌ | Timeout in seconds, default 30, range 1-900 |
| `gpu` | string | ❌ | GPU spec (e.g. `AMPERE_16`, `V100_16`) |
| `log` | object | ❌ | Log configuration |
| `environment` | object | ❌ | Environment variables (key-value; values may use variable references) |
| `network` | object | ❌ | VPC network configuration |
| `iam` | object | ❌ | IAM role configuration |
| `triggers` | object | ❌ | Function-level triggers (HTTP, Timer, CDN, etc.) |
| `domain` | object | ❌ | Function-level custom domain |
| `storage` | object | ❌ | Storage mounts (NAS/OSS) |

> 💡 **Note**: `code` and `container` are mutually exclusive. For `code`, provide `runtime`, `handler`, and `path`; for `container`, provide `image` and `port`.

#### code - Code Deployment

```yaml
code:
  runtime: nodejs18
  handler: index.handler
  path: artifacts/function.zip
```

**Field description:**

| Field | Type | Required | Description |
|------|------|------|------|
| `runtime` | string | ✅ | Runtime identifier, see table below |
| `handler` | string | ✅ | Entry function, format: `file.function` |
| `path` | string | ✅ | Code package path (relative to project root) |

**Supported runtimes (generic + Aliyun-specific):**

| Category | Runtime identifiers |
|------|-------------|
| **Node.js** | `nodejs20`, `nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10` |
| **Python** | `python3.12`, `python3.11`, `python3.10`, `python3.9`, `python3.8`, `python3.7`, `python3.6` |
| **Java** | `java17`, `java11`, `java8` |
| **Go** | `go1.x` |
| **PHP** | `php7.2`, `php7.3`, `php7.4`, `php8.0`, `php8.1` |
| **.NET** | `dotnetcore3.1`, `dotnet6`, `dotnet8` |
| **Custom Runtime** | `custom`, `custom.debian10` |

> 💡 **Tip**: These are the generic runtimes. Aliyun FC3 also supports the latest versions such as `nodejs20` and `python3.12`. For provider-specific versions, refer to the corresponding cloud vendor documentation.

#### container - Container Deployment

```yaml
container:
  image: registry.cn-hangzhou.aliyuncs.com/my-repo/my-image:latest
  port: 9000
```

**Field description:**

| Field | Type | Required | Description |
|------|------|------|------|
| `image` | string | ✅ | Full container image address |
| `port` | integer | ✅ | Container listening port (1-65535) |

> ⚠️ **Note**: In container mode, the function entry is handled by the HTTP service inside the container — no `handler` is needed. The image must include an HTTP service listening on the specified port.

#### memory - Memory

```yaml
memory: 1024
```

- Unit: MB
- Range: 128 - 3072
- Default: 512
- Must be a multiple of 64 (some providers require multiples of 128)

#### timeout - Timeout

```yaml
timeout: 60
```

- Unit: seconds
- Range: 1 - 900
- Default: 30

#### gpu - GPU Configuration

```yaml
gpu: AMPERE_16
```

**Supported GPU specs (Aliyun):**
- `AMPERE_16` - A10 16GB
- `AMPERE_24` - A10G 24GB
- `V100_16` - V100 16GB
- `V100_32` - V100 32GB
- `T4_16` - T4 16GB

> 💡 **Tip**: GPU instances require higher memory; `memory >= 4096` is recommended.

#### log - Log Configuration

```yaml
log:
  project: my-log-project
  logstore: my-function-logs
  ttl: 30
```

**Field description:**

| Field | Type | Required | Description |
|------|------|------|------|
| `project` | string | ❌ | SLS log project name |
| `logstore` | string | ❌ | Logstore name |
| `ttl` | integer | ❌ | Log retention days (1-3650) |

#### environment - Environment Variables

```yaml
environment:
  NODE_ENV: production
  DB_HOST: "${vars.db_host}"
  API_KEY: "secret-value"
```

- Format: `key: value`; values support variable references `${vars.xxx}`, `${stages.xxx}`, `${ctx.stage}`
- All environment variables are accessible at runtime via `process.env`

#### network - Network Configuration

```yaml
network:
  vpc_id: vpc-xxxxx
  subnet_ids:
    - vsw-xxxxx
    - vsw-xxxxx
  security_group:
    name: my-sg
    ingress:
      - TCP:10.0.0.0/8:443
      - UDP:172.16.0.0/12:53
```

**Field description:**

| Field | Type | Required | Description |
|------|------|------|------|
| `vpc_id` | string | ⚠️ | VPC ID (required when configuring network) |
| `subnet_ids` | string[] | ⚠️ | vSwitch ID list (required when configuring network) |
| `security_group` | object | ❌ | Security group configuration |

**security_group fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Security group name |
| `ingress` | string[] | ❌ | Inbound rules, format: `protocol:CIDR:port` |

#### iam - IAM Role Configuration

```yaml
iam:
  role: acs:ram::1234567890:role/my-role
  policies:
    - AliyunOSSReadOnlyAccess
    - AliyunRDSReadOnlyAccess
```

**Field description:**

| Field | Type | Required | Description |
|------|------|------|------|
| `role` | string | ❌ | Existing RAM role ARN |
| `policies` | string[] | ❌ | Attached system policy name list |

> 💡 **Note**: If not specified, a role with basic permissions is created automatically.

#### triggers - Function-level Triggers

```yaml
triggers:
  http:
    type: HTTP
    methods: [GET, POST]
    path: /api/v1/*
  timer:
    type: TIMER
    cron: "0 */5 * * * *"
```

**Supported trigger types:**

| Type | Description | Required fields |
|------|------|----------|
| `HTTP` | HTTP trigger | `methods`, `path` |
| `TIMER` | Timer trigger | `cron` (6-field cron expression) |
| `CDN` | CDN event trigger | `event` |

#### domain - Function-level Custom Domain

```yaml
domain:
  domain_name: api.example.com
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  protocol: HTTPS
  route_config:
    - path: /api/*
      methods: [GET, POST]
```

**Field description:**

| Field | Type | Required | Description |
|------|------|------|------|
| `domain_name` | string | ✅ | Custom domain |
| `certificate_id` | string | ❌ | SSL certificate ID |
| `protocol` | string/array | ❌ | Protocol: `HTTP`, `HTTPS`, or `['HTTP', 'HTTPS']` |
| `route_config` | object[] | ❌ | Route configuration |

#### storage - Storage Mounts

```yaml
storage:
  nas:
    - mount_point: /mnt/nas
      server: nas-xxxxx.cn-hangzhou.nas.aliyuncs.com
      path: /serverless
      access_group: DEFAULT_VPC_GROUP_NAME
  oss:
    - mount_point: /mnt/oss
      bucket: my-bucket
      endpoint: oss-cn-hangzhou.aliyuncs.com
```

---

### events

Defines event triggers (e.g. API Gateway). Currently only `API_GATEWAY` is supported.

```yaml
events:
  api_gateway:
    type: API_GATEWAY
    name: my-api-gateway
    triggers:
      - method: GET
        path: /api/*
        backend: api_function
      - method: POST
        path: /api/*
        backend: api_function
    domain:
      domain_name: api.example.com
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      protocol: HTTPS
```

**Top-level fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `type` | string | ✅ | Event type — only `API_GATEWAY` is supported |
| `name` | string | ✅ | Gateway name |
| `triggers` | object[] | ✅ | Trigger rule list |
| `domain` | object | ❌ | Custom domain configuration |

#### triggers - Trigger Rules

```yaml
triggers:
  - method: GET
    path: /api/*
    backend: api_function
  - method: POST
    path: /api/*
    backend: api_function
```

**Each trigger object:**

| Field | Type | Required | Description |
|------|------|------|------|
| `method` | string | ✅ | HTTP method: `GET`, `POST`, `PUT`, `DELETE`, `ANY` |
| `path` | string | ✅ | Path pattern (must start with `/`; wildcard `*` supported) |
| `backend` | string | ✅ | Backend function key (corresponds to a key in `functions`) |

> ⚠️ **Note**: The `type` in `events` only supports `API_GATEWAY`. Legacy types such as `HTTP`, `Timer`, and `SQS` are no longer supported.

#### domain - Custom Domain

Same as [functions.domain](#domain---function-level-custom-domain).

---

### databases

Defines serverless database resources. Currently supports MySQL, PostgreSQL, SQL Server, Elasticsearch, and TDSQL-C.

```yaml
databases:
  main_db:
    name: main-db
    type: RDS_MYSQL_SERVERLESS
    version: MYSQL_8.0
    security:
      basic_auth:
        password: "${vars.db_password}"
```

**Top-level fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Database instance name |
| `type` | enum | ✅ | Database type (see table below) |
| `version` | enum | ✅ | Engine version (see table below) |
| `security` | object | ✅ | Security config; must include `basic_auth.password` |

**Database type (`type`) enum values:**

| Value | Description |
|----|------|
| `ELASTICSEARCH_SERVERLESS` | Elasticsearch Serverless |
| `RDS_MYSQL_SERVERLESS` | RDS MySQL Serverless |
| `RDS_PGSQL_SERVERLESS` | RDS PostgreSQL Serverless |
| `RDS_MSSQL_SERVERLESS` | RDS SQL Server Serverless |
| `TDSQL_C_SERVERLESS` | TDSQL-C Serverless (Tencent Cloud) |

**Version (`version`) enum values (grouped by type):**

| Type | Supported versions |
|------|-----------|
| `RDS_MYSQL_SERVERLESS` | `MYSQL_5.7`, `MYSQL_8.0`, `MYSQL_HA_5.7`, `MYSQL_HA_8.0` |
| `RDS_PGSQL_SERVERLESS` | `PGSQL_14`, `PGSQL_15`, `PGSQL_16`, `PGSQL_HA_14`, `PGSQL_HA_15`, `PGSQL_HA_16` |
| `RDS_MSSQL_SERVERLESS` | `MSSQL_HA_2016`, `MSSQL_HA_2017`, `MSSQL_HA_2019` |
| `ELASTICSEARCH_SERVERLESS` | `ES_SEARCH_7.10`, `ES_TIME_SERIES_7.10` |
| `TDSQL_C_SERVERLESS` | (Tencent Cloud versions; see console) |

> ⚠️ **Note**: Legacy values such as `RDS_REDIS_SERVERLESS` and `REDIS_6.0` have been removed; Redis Serverless is not currently supported.

**Security basic auth:**

```yaml
security:
  basic_auth:
    password: "${vars.db_password}"
```

| Field | Type | Required | Description |
|------|------|------|------|
| `basic_auth.password` | string | ✅ | Database password (a variable reference is recommended) |

---

### tables

Defines table storage resources (TableStore / DynamoDB, etc.).

```yaml
tables:
  user_table:
    name: user-table
    type: TABLE_STORE_H
    collection:
      name: my-instance
    key_schema:
      - name: user_id
        type: HASH
      - name: created_at
        type: RANGE
    attributes:
      - name: user_id
        type: STRING
      - name: created_at
        type: INTEGER
      - name: email
        type: STRING
    throughput:
      reserved:
        read: 100
        write: 100
```

**Top-level fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Table name |
| `type` | enum | ✅ | Table type: `TABLE_STORE_C` (capacity) or `TABLE_STORE_H` (high-performance) |
| `collection` | object | ❌ | Instance/store configuration |
| `key_schema` | object[] | ✅ | Primary key structure |
| `attributes` | object[] | ✅ | Attribute definitions |
| `throughput` | object | ❌ | Throughput configuration |

**collection fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ❌ | Name of a new instance/store |
| `id` | string | ❌ | ID of an existing instance/store |

> 💡 **Note**: Concepts differ across cloud vendors:
> - **Aliyun**: Table storage belongs to an instance (Instance)
> - **Huawei Cloud**: Table storage belongs to a store (Store)
> - **AWS**: A DynamoDB table is a top-level unit; no collection needed

**key_schema fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Key name |
| `type` | enum | ✅ | Key type: `HASH` (partition key) or `RANGE` (sort key) |

**attributes fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | Attribute name |
| `type` | enum | ✅ | Data type: `STRING`, `INTEGER`, `DOUBLE`, `BOOLEAN`, `BINARY` |

**throughput fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `reserved.read` | integer | ❌ | Reserved read CU (1-10000) |
| `reserved.write` | integer | ❌ | Reserved write CU (1-10000) |
| `on_demand.read` | integer | ❌ | Max on-demand read CU (AWS only) |
| `on_demand.write` | integer | ❌ | Max on-demand write CU (AWS only) |

> ⚠️ **Note**: Keys declared in `key_schema` must have their data types declared in `attributes`.

---

### buckets

Defines object storage bucket resources (e.g. Aliyun OSS, AWS S3).

```yaml
buckets:
  my_bucket:
    name: my-app-bucket
    storage:
      class: STANDARD
    versioning:
      status: ENABLED
    security:
      acl: PRIVATE
      force_delete: false
      sse_algorithm: KMS
      sse_kms_master_key_id: 1234567890
    website:
      code: dist/
      domain: www.example.com
      index: index.html
      error_page: 404.html
      error_code: 404
    domain:
      domain_name: static.example.com
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      protocol: HTTPS
      www_bind_apex: true
      cdn:
        enabled: true
        cdn_type: web
        scope: domestic
        cache_ttl: 3600
        origin_protocol: https
        force_redirect_https: true
      accelerate: true
    iam:
      resource:
        statements:
          - effect: Allow
            principal:
              AWS: '123456789012'
            action:
              - oss:GetObject
              - oss:PutObject
            resource:
              - my-app-bucket/*
```

**Top-level fields:**

| Field | Type | Required | Default | Description |
|------|------|------|--------|------|
| `name` | string | ✅ | - | Bucket name (a-zA-Z0-9-_, 1-64 chars) |
| `storage` | object | ❌ | - | Storage configuration |
| `versioning` | object | ❌ | - | Versioning configuration |
| `security` | object | ❌ | - | Security configuration |
| `domain` | object | ❌ | - | Custom domain configuration (recommended; takes precedence over `website.domain`) |
| `website` | object | ❌ | - | Static website hosting configuration |
| `iam` | object | ❌ | - | Bucket IAM resource policy |

**Storage classes (`storage.class`):**
- `STANDARD` - Standard storage
- `IA` - Infrequent access
- `ARCHIVE` - Archive storage
- `COLD` - Cold storage

**Versioning (`versioning.status`):**
- `ENABLED` - Enable versioning
- `DISABLED` - Disable versioning

**Security configuration (`security`):**

| Field | Type | Required | Default | Description |
|------|------|------|--------|------|
| `acl` | string | ❌ | PRIVATE | Access control: `PRIVATE`, `PUBLIC_READ`, `PUBLIC_READ_WRITE` |
| `force_delete` | boolean | ❌ | false | Force delete (non-recoverable) |
| `sse_algorithm` | string | ❌ | - | Encryption algorithm: `AES256`, `KMS` |
| `sse_kms_master_key_id` | string | ❌ | - | KMS key ID |

**Static website hosting (`website`):**

> ⚠️ **Note**: 
> - Public access requires `acl` set to `PUBLIC_READ`
> - Except for `code`, these settings cannot be modified after creation

| Field | Type | Required | Default | Description |
|------|------|------|--------|------|
| `code` | string | ✅ | - | Website code package path |
| `domain` | string/object | ❌ | - | Custom domain (string or object) |
| `index` | string | ❌ | index.html | Default index page |
| `error_page` | string | ❌ | 404.html | Error page |
| `error_code` | integer | ❌ | 404 | Error code |

**Top-level `domain` configuration (recommended; supports CDN and OSS acceleration):**

```yaml
domain:
  domain_name: static.example.com
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  protocol: HTTPS
  www_bind_apex: true
  cdn:
    enabled: true
    cdn_type: web
    scope: domestic
    cache_ttl: 3600
    origin_protocol: https
    force_redirect_https: true
  accelerate: true
```

**cdn configuration fields:**

| Field | Type | Required | Description |
|------|------|------|------|
| `enabled` | boolean | ✅ | Whether CDN is enabled |
| `cdn_type` | string | ❌ | CDN type: `web` (website), `download` (download), `video` (media) |
| `scope` | string | ❌ | Acceleration scope: `domestic` (China), `overseas` (international), `global` |
| `cache_ttl` | number | ❌ | Cache duration (seconds) |
| `ignore_query_string` | boolean | ❌ | Whether to ignore query strings |
| `origin_protocol` | string | ❌ | Origin protocol: `http`, `https`, `follow` |
| `compression` | boolean | ❌ | Whether compression is enabled |
| `force_redirect_https` | boolean | ❌ | Whether to force redirect to HTTPS |

**IAM resource policy (`iam.resource.statements`):**

```yaml
iam:
  resource:
    statements:
      - effect: Allow
        principal:
          AWS: '123456789012'
        action:
          - oss:GetObject
          - oss:PutObject
        resource:
          - my-app-bucket/*
```

| Field | Type | Required | Description |
|------|------|------|------|
| `effect` | string | ✅ | `Allow` or `Deny` |
| `principal` | object | ✅ | Principal (e.g. `AWS: 'account-id'`) |
| `action` | string/array | ✅ | Allowed or denied actions |
| `resource` | string/array | ✅ | Resource paths |
| `condition` | object | ❌ | Policy conditions |

---

## Variable References

ServerlessInsight supports several variable reference styles:

### 1. vars variables

```yaml
vars:
  region: cn-hangzhou
  memory: 512

functions:
  my_function:
    memory: ${vars.memory}
    environment:
      REGION: ${vars.region}
```

### 2. stages variables

```yaml
stages:
  dev:
    memory: 512
  prod:
    memory: 2048

functions:
  my_function:
    memory: ${stages.memory}
```

### 3. Context variables

```yaml
app: my-app
service: my-app-service
```

**Predefined context variables:**
- `${ctx.stage}` - the name of the current deployment stage

> ⚠️ **Note**: `app` and `service` must be static strings — variables are not allowed. Other configuration may use variables such as `${ctx.stage}`.

## Local Development

ServerlessInsight can launch all defined resources locally for development and debugging.

**Local run commands:**

```bash
# Basic local run
si local --stage dev

# Debug mode
si local --stage dev --debug

# Watch mode (auto-reload on code changes)
si local --stage dev --watch
```

**Local development benefits:**
- ✅ No local cloud resources needed
- ✅ Dev environment consistent with production
- ✅ Hot reload for higher productivity
- ✅ Fast debugging and testing

## Best Practices

### 1. Environment isolation

Use `stages` to manage environments:

```yaml
stages:
  dev:
    region: cn-hangzhou
    memory: 512
  test:
    region: cn-shanghai
    memory: 1024
  prod:
    region: cn-beijing
    memory: 2048
```

### 2. Variable reuse

Extract common configuration into `vars`:

```yaml
vars:
  regions:
    dev: cn-hangzhou
    prod: cn-beijing
  memory:
    dev: 512
    prod: 2048
```

### 3. Resource naming

Use meaningful names with environment info:

```yaml
app: my-app
service: my-app-service

functions:
  user_api:
    name: user-api-${ctx.stage}
```

> ⚠️ **Note**: `app` and `service` must be static strings, but resource names (e.g. the `name` field) may use variables.

### 4. Tag management

Add tags to all resources for easier management:

```yaml
tags:
  owner: team-name
  project: project-name
  environment: ${ctx.stage}
  cost-center: cc-12345
```

### 5. Security configuration

- Manage sensitive information via environment variables
- Configure VPC and security groups for production
- Enable bucket versioning and encryption

## FAQ

### Q: How do I switch cloud providers?

Change `provider.name` and adjust the region configuration:

```yaml
provider:
  name: aliyun  # or tencent, volcengine
  region: cn-hangzhou
```

### Q: How do I update a deployed function?

Redeploy after modifying configuration or code:

```bash
# Repackage the code
./scripts/package.sh

# Redeploy (updates existing resources)
si deploy --stage dev
```

### Q: How do I delete resources?

Use the `destroy` command:

```bash
si destroy --stage dev
```

> ⚠️ **Warning**: This deletes all related resources — proceed with caution.

### Q: What if configuration validation fails?

Use the `validate` command to check the configuration:

```bash
si validate
```

Fix issues according to the error messages.

### Q: Why does deployment fail with "runtime not supported"?

Check whether `functions.<name>.code.runtime` is a supported runtime identifier. Runtimes differ per cloud vendor; see the runtime list in [functions.code](#code---code-deployment).

### Q: Which event trigger types are supported?

Currently only `API_GATEWAY`. For timer or HTTP triggering, configure function-level triggers via `functions.<name>.triggers`.