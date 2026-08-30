---
outline: [2, 4]
---

# Configuration Reference

Everything ServerlessInsight does is expressed through a single `serverlessinsight.yml`. The file is both a deployment blueprint the `si` CLI executes and a reviewable record of your infrastructure: you declare *what* you need, the CLI provisions it on the target cloud, and on subsequent deploys it diffs against the last state and only changes what actually changed.

This reference walks the file top-down: first the global skeleton (version, provider, variables, stages), then each of the five resource kinds — `functions`, `events`, `databases`, `tables`, `buckets`. For every resource we answer three questions: what it is, when to use it, and how each field is filled. All enum values are verified against the `serverlessinsight` v0.7.9 source schema.

> Use the on-page outline in the browser sidebar for quick field lookups; `si validate` checks every constraint below before anything is deployed.

## Quick Example

This configuration covers what most real projects need: one HTTP function, an API gateway entry, and a pay-per-use MySQL. Read it for the overall shape — each block is dissected below:

```yaml
version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou

vars:
  db_password: "${ctx.stage}-secret"

stages:
  dev:
    memory: 256
  prod:
    memory: 1024

app: my-app
service: my-app-api

tags:
  owner: geek-fun

functions:
  api_function:
    name: my-api-function
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/api.zip
    memory: ${stages.memory}
    timeout: 30
    environment:
      NODE_ENV: production

events:
  api_gateway:
    name: my-api-gateway
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: api_function

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
```

Division of labor in this file: `provider` decides which cloud and region everything lands in; `vars` and `stages` pull environment-specific values out of resource definitions; `functions` + `events` form the classic "function + HTTP entry" server shape; `databases` declares the data layer the functions depend on. `app` and `service` thread through all cloud resource naming — they are the identity of the whole stack.

## Core Configuration

### version

The version of the config format itself — not your app's version. The CLI uses it to decide how to parse the file; fields may be incompatible across major versions.

```yaml
version: 0.1.0
```

**Valid values**: `0.0.0`, `0.0.1`, `0.1.0`. New projects should use `0.1.0`.

### provider

Declares the target cloud and region. Every resource in the file is created in this `region`; deploying to multiple regions means maintaining multiple configs.

```yaml
provider:
  name: aliyun
  region: cn-hangzhou
```

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | `aliyun` / `tencent` / `volcengine` / `huawei` / `aws` |
| `region` | string | ✅ | Deployment region |

Providers you can actually deploy to today are **aliyun**, **tencent**, and **volcengine**; `huawei` and `aws` exist in the enum only and are not yet deployable.

**Common Aliyun regions**: `cn-hangzhou`, `cn-shanghai`, `cn-beijing`, `cn-qingdao`, `cn-shenzhen`, `cn-zhangjiakou`, `cn-huhehaote`, `cn-wulanchabu`, `cn-heyuan`, `cn-guangzhou`, `cn-chengdu`, `cn-hongkong`, plus `ap-southeast-1/3/5/6/7`, `ap-northeast-1/2`, `eu-central-1`, `eu-west-1`, `us-east-1`, `us-west-1`, `me-east-1`, `me-central-1`.

Cloud credentials are never written in the config — they are injected via environment variables (e.g. `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET`). See each provider page for details.

### vars

The global variable area. Pull values that change — passwords, domains, sizes — out of resource definitions into one place. Referenced as `${vars.name}`.

```yaml
vars:
  db_host: db.example.com
  memory_size: 512
```

Values can be overridden at deploy time with `-p`, which is how secrets stay out of the file:

```bash
si deploy --stage prod -p db_password=xxxx
```

### stages

Per-environment configuration. Each stage is a set of overrides; the same resource definitions pick up different memory, domains, or regions per environment. Select with `--stage` / `-s`; `default` is used when omitted.

```yaml
stages:
  dev:
    memory: 256
  prod:
    memory: 1024
```

Reference the current stage's values with `${stages.field}`:

```yaml
functions:
  api_function:
    memory: ${stages.memory}
```

`${ctx.stage}` is a built-in context variable holding the current stage name — handy for environment-suffixed resource names like `user-api-${ctx.stage}`.

### app

The application name — the top-level namespace identifying your project. It must be a static string: it participates in all cloud resource naming, and the CLI must resolve it before any variable interpolation.

```yaml
app: my-app
```

Naming rules: starts with a lowercase letter, contains only lowercase letters, digits, and `-`.

### service

The service name. Where `app` answers "which project", `service` answers "which independently deployable unit of it". It prefixes resource IDs and names, so keep it short. Also must be a static string.

```yaml
service: my-app-api
```

> `service` is not the same as the CLI's `<stackName>`: `service` lives in the config and drives naming; `stackName` is given at deploy time and locates the state file.

### tags

Resource tags. The CLI attaches these key-values to every cloud resource it creates, for cost allocation and resource search.

```yaml
tags:
  owner: geek-fun
  environment: ${ctx.stage}
```

### backend

The state backend. `si deploy` relies on a state file recording what the last deployment created, enabling incremental updates and resource teardown. By default ServerlessInsight uses its managed SaaS state backend (authenticate via `si login` or `SI_API_KEY`); teams that self-manage can switch to object storage:

```yaml
backend:
  state_manager:
    type: BUCKET_STORE
    bucket: my-state-bucket
    key: si-state/
```

| Field | Type | Required | Description |
|------|------|------|------|
| `state_manager.type` | string | ❌ | `LOCAL` (local file) or `BUCKET_STORE` (object storage); omitted = managed SaaS |
| `state_manager.bucket` | string | ⚠️ | required when `BUCKET_STORE` |
| `state_manager.key` | string | ❌ | state file path |

## Resource Types

### functions

Functions are the core resource. The config key (e.g. `hello_world_fn`) is the **reference name** — fields like `events.triggers.backend` point at functions by it. The inner `name` is the actual cloud function name and is required.

A function has one of two deployment shapes, mutually exclusive: a **code package** (`code`) or a **container image** (`container`). Most business logic uses `code`; custom runtimes, native libraries, or long-running processes call for `container`.

```yaml
functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/hello-world-api.zip
    memory: 512
    timeout: 10
    environment:
      NODE_ENV: prod
```

**Top-level fields**:

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | cloud function name |
| `code` | object | ⚠️ | code package deployment (either this or `container`) |
| `container` | object | ⚠️ | container image deployment (either this or `code`) |
| `memory` | number | ❌ | memory (MB), default 128 |
| `timeout` | number | ❌ | timeout (seconds), default 3 |
| `gpu` | string | ❌ | GPU spec, see below |
| `log` | boolean | ❌ | enable logging |
| `environment` | object | ❌ | environment variables; values are string / number / boolean |
| `network` | object | ❌ | VPC networking |
| `iam` | object | ❌ | execution role and grants |
| `triggers` | object | ❌ | function-level triggers (HTTP) |
| `domain` | object | ❌ | function-level custom domain |
| `storage` | object | ❌ | disk and NAS mounts |

> `code` and `container` are mutually exclusive; providing both is not a supported combination.

#### code - Code Deployment

```yaml
code:
  runtime: nodejs18
  handler: index.handler
  path: artifacts/hello-world-api.zip
```

`runtime` selects the execution environment on the cloud, `handler` is the entry in `file.exportedFunction` form, and `path` points at the build artifact (relative to project root, usually under `artifacts/`).

**Runtime values** (`validate` / `plan` re-check per provider — see provider pages):

| Provider | Runtimes |
|--------|--------|
| **Aliyun FC** | `nodejs24` `nodejs22` `nodejs20` `nodejs18` `nodejs16` `nodejs14` `nodejs12` `nodejs10`, `python3.14` `python3.13` `python3.12` `python3.11` `python3.10` `python3.9` `python3.7` `python3.6`, `java25` `java21` `java17` `java11` `java8`, `php8.0` `php7.4` `php7.2` `php5.6`, `go1`, `dotnet_core3.1` |
| **Volcengine veFaaS** | `golang/v1` `native/v1` `nativejava8/v1` `node14/v1` `node20/v1` `nodeprime14/v1` `python3.12/v1` `python3.9/v1` `native-python3.12/v1` `native-node20/v1` |

> Volcengine runtime identifiers carry a `/v1` suffix — unlike Aliyun's style — so switching providers means updating `runtime` accordingly.

#### container - Container Deployment

```yaml
container:
  image: registry.cn-hangzhou.aliyuncs.com/my-repo/my-image:latest
  port: 9000
  cmd: ["node", "server.js"]
```

| Field | Type | Required | Description |
|------|------|------|------|
| `image` | string | ✅ | image address (must be pullable by the provider) |
| `port` | number | ✅ | HTTP port your service listens on inside the container |
| `cmd` | string[] | ❌ | override the image's default entry command |

In container mode there is no `handler` — the platform forwards requests to the HTTP service listening on `port` inside your container.

#### gpu

GPU spec enum (Aliyun):

`TESLA_8` `TESLA_12` `TESLA_16` `AMPERE_8` `AMPERE_12` `AMPERE_16` `AMPERE_24` `ADA_48`

The number is VRAM in GB. GPU instances usually need a higher `memory` to match.

#### log

A boolean. When enabled, invocation logs flow into the provider's log service (e.g. Aliyun SLS); observability commands like `si logs` depend on it:

```yaml
log: true
```

#### network

Attaching a function to a private network is what lets it reach databases, caches, and other VPC-internal endpoints. All three sub-fields are **required** when `network` is present:

```yaml
network:
  vpc_id: vpc-xxxxx
  subnet_ids:
    - vsw-xxxxx
    - vsw-yyyyy
  security_group:
    name: my-sg
    ingress:
      - TCP:10.0.0.0/8:443
    egress:
      - UDP:0.0.0.0/0:ALL
```

| Field | Type | Required | Description |
|------|------|------|------|
| `vpc_id` | string | ✅ | VPC ID |
| `subnet_ids` | string[] | ✅ | vSwitch (subnet) IDs |
| `security_group` | object | ✅ | see below |
| `security_group.name` | string | ✅ | security group name |
| `security_group.ingress` | string[] | ✅ | inbound rules |
| `security_group.egress` | string[] | ❌ | outbound rules |

Rule format is `protocol:CIDR:port` where port is `ALL`, a single port (`443`), or a range (`80/90`) — e.g. `TCP:10.0.0.0/8:443`.

#### iam

Configures the function's execution role. The simple form references an existing RAM role ARN; for fine-grained grants, use the object form:

```yaml
# Form 1: reference an existing role
iam:
  role: acs:ram::1234567890:role/my-role

# Form 2: declare the role and its grants
iam:
  role:
    name: my-fn-role
    managed_policies:
      - AliyunOSSReadOnlyAccess
    statements:
      - effect: Allow
        action:
          - oss:GetObject
        resource:
          - my-bucket/*
```

Each `statements` item requires `effect` (`Allow` / `Deny`), `action`, and `resource` (string or array); `sid` is optional.

#### triggers - Function-level HTTP Trigger

Attaches an HTTP trigger directly to the function (no API gateway). Tencent Cloud functions expose their HTTP entry this way:

```yaml
triggers:
  http:
    auth_type: public
    access:
      - public
```

| Field | Type | Required | Description |
|------|------|------|------|
| `auth_type` | string | ✅ | `public` (anonymous public access) or `iam` (signature-authenticated) |
| `access` | string[] | ❌ | network access types: `public` / `internal`, at least one |

> Function-level HTTP triggers fit simple cases; for path routing, custom domains, and rate limiting, use `events` (API gateway) instead.

#### domain - Function-level Custom Domain

```yaml
domain:
  domain_name: api.example.com
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  protocol: HTTPS
```

| Field | Type | Required | Description |
|------|------|------|------|
| `domain_name` | string | ✅ | custom domain (registered and pointed at the provider) |
| `certificate_id` | string | ❌ | uploaded SSL certificate ID |
| `protocol` | string | ❌ | `HTTP` or `HTTPS` |

#### storage - Disk and NAS

```yaml
storage:
  disk: 512
  nas:
    - mount_path: /mnt/nas
      storage_class: STANDARD_CAPACITY
```

| Field | Type | Required | Description |
|------|------|------|------|
| `disk` | number | ❌ | temporary disk size (MB) |
| `nas` | object[] | ❌ | NAS mount list |
| `nas[].mount_path` | string | ✅ | in-container mount path |
| `nas[].storage_class` | string | ✅ | `STANDARD_CAPACITY` / `STANDARD_PERFORMANCE` / `EXTREME_STANDARD` / `EXTREME_ADVANCE` |

### events

The events resource currently has exactly one shape: an **API gateway** (`type: API_GATEWAY`). It solves the "many functions, many routes" traffic-entry problem — the gateway dispatches requests to different functions by path and method, and carries a shared domain and certificate.

Choosing between `functions.triggers.http` and `events`: a single function with a fixed path is simpler with a function-level trigger; a set of endpoints needing routing and one shared domain belongs in `events`.

```yaml
events:
  gateway_event:
    name: insight-poc-gateway
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: hello_world_fn
    domain:
      domain_name: api.example.com
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      protocol: HTTPS
```

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | gateway name |
| `type` | string | ✅ | `API_GATEWAY` only |
| `triggers` | object[] | ✅ | routing rules |
| `log` | boolean | ❌ | enable gateway logging |
| `network` | object | ❌ | the VPC the gateway lives in |
| `domain` | object | ❌ | custom domain and certificate |

> ⚠️ **Tencent Cloud does not support `events`.** Tencent functions expose HTTP via `functions.triggers.http` — see [Tencent Cloud](/en/providers/tencent).

#### triggers - Routing Rules

```yaml
triggers:
  - method: GET
    path: /api/*
    backend: hello_world_fn
```

| Field | Type | Required | Description |
|------|------|------|------|
| `method` | string | ✅ | `GET` / `POST` / `PUT` / `DELETE` / `ANY` |
| `path` | string | ✅ | must start with `/`; `*` wildcard supported |
| `backend` | string | ✅ | target function's **reference name** (the key under `functions`, not its `name`) |

> Legacy event types — `type: HTTP`, `type: Timer`, `type: sqs` — have been removed from the schema and fail `validate`. Timer and messaging triggers are not yet supported.

#### domain - Gateway Custom Domain

```yaml
domain:
  domain_name: api.example.com
  protocol: HTTPS
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  www_bind_apex: false
```

| Field | Type | Required | Description |
|------|------|------|------|
| `domain_name` | string | ✅ | custom domain |
| `protocol` | string / string[] | ❌ | `HTTP`, `HTTPS`, or an array of both, e.g. `['HTTP', 'HTTPS']` |
| `certificate_id` | string | ⚠️ | certificate ID (one of three forms, see below) |
| `certificate_body` + `certificate_private_key` | string | ⚠️ | certificate content + private key (one of three forms) |
| `www_bind_apex` | boolean | ❌ | also bind the www subdomain |
| `cdn` | object / boolean | ❌ | CDN acceleration, see below |

The three certificate forms are **mutually exclusive**: either `certificate_id`, or `certificate_body` + `certificate_private_key` together — never a mix.

**cdn configuration** (or simply `cdn: true` for defaults):

```yaml
cdn:
  enabled: true
  cdn_type: web
  scope: domestic
  cache_ttl: 3600
  origin_protocol: follow
  force_redirect_https: true
```

| Field | Type | Description |
|------|------|------|
| `enabled` | boolean | enable CDN |
| `cdn_type` | string | `web` / `download` / `video` |
| `scope` | string | `domestic` / `overseas` / `global` |
| `cache_ttl` | number | cache duration (seconds) |
| `ignore_query_string` | boolean | exclude query strings from cache keys |
| `origin_protocol` | string | origin protocol: `http` / `https` / `follow` |
| `compression` | boolean | smart compression |
| `force_redirect_https` | boolean | force HTTPS redirect |

### databases

The databases resource declares the data layer your functions depend on. ServerlessInsight provisions the instance, wires the network, and sets credentials — your function just needs the connection string. Supported: Aliyun RDS / Elasticsearch Serverless and Tencent TDSQL-C:

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
```

`cu.min/max` is the point of serverless databases: scale to 0 CU with no traffic (no compute cost) and burst to `max` under load. **Always inject the password via `${vars.*}` or `-p` — never commit it in plain text.**

**Type and version values**:

| Field | Values |
|------|--------|
| `type` | `ELASTICSEARCH_SERVERLESS` `RDS_MYSQL_SERVERLESS` `RDS_PGSQL_SERVERLESS` `RDS_MSSQL_SERVERLESS` `TDSQL_C_SERVERLESS` |
| `version` | `MYSQL_5.7` `MYSQL_8.0` `MYSQL_HA_5.7` `MYSQL_HA_8.0`, `PGSQL_14` `PGSQL_15` `PGSQL_16` `PGSQL_HA_14` `PGSQL_HA_15` `PGSQL_HA_16`, `MSSQL_HA_2016` `MSSQL_HA_2017` `MSSQL_HA_2019`, `ES_SEARCH_7.10` `ES_TIME_SERIES_7.10` |

The `_HA_` variants are high-availability (primary-standby) — prefer them in production.

**Remaining fields**:

| Field | Type | Description |
|------|------|------|
| `cu` | object | elastic compute unit range: `min` / `max` |
| `storage` | object | storage capacity range: `min` / `max` (GB, integers) |
| `security.basic_auth.master_user` | string | admin username |
| `security.basic_auth.password` | string | admin password (inject via variable) |
| `network` | object | access network, see below |

**network fields**:

```yaml
network:
  type: PRIVATE
  vpc_id: vpc-xxxxx
  subnet_id: vsw-xxxxx
  public: false
  ingress_rules:
    - TCP:10.0.0.0/8:3306
```

| Field | Type | Description |
|------|------|------|
| `type` | string | `PUBLIC` (direct public access) or `PRIVATE` (VPC-internal) |
| `vpc_id` / `subnet_id` | string | VPC and vSwitch for private access (note: a single `subnet_id`) |
| `public` | boolean | additionally expose public access |
| `ingress_rules` | string[] | access rules, same format as security group rules |

> Not every provider supports every database type — see the [Provider Overview](/en/providers/) capability matrix.

### tables

Table storage fits low-latency reads/writes over massive semi-structured data (user profiles, sessions, IoT time series). Currently supported only on **Aliyun TableStore**. Every table belongs to an instance (`collection`, a string, required) — the instance is TableStore's billing and network unit.

```yaml
tables:
  sessions:
    collection: my-instance
    name: session-table
    type: TABLE_STORE_H
    desc: user session table
    key_schema:
      - name: user_id
        type: HASH
      - name: session_id
        type: RANGE
    attributes:
      - name: user_id
        type: STRING
      - name: session_id
        type: STRING
      - name: payload
        type: BINARY
    throughput:
      reserved:
        read: 100
        write: 100
```

**Primary key design is the single most important decision here**: the `HASH` key decides which shard a row lands on — pick a high-cardinality field (like user_id) to avoid hot spots; the `RANGE` key sorts rows within a shard and suits range queries.

| Field | Type | Required | Description |
|------|------|------|------|
| `collection` | string | ✅ | owning instance name |
| `name` | string | ✅ | table name |
| `type` | string | ✅ | `TABLE_STORE_C` (capacity, pay-per-use, write-heavy) / `TABLE_STORE_H` (high-performance, reserved capacity, low latency) |
| `desc` | string | ❌ | description, max 256 chars |
| `key_schema` | object[] | ✅ | primary keys, see below |
| `attributes` | object[] | ✅ | attribute columns, see below |
| `throughput` | object | ❌ | reserved / on-demand read-write CU |
| `network` | object | ❌ | access network |

**key_schema / attributes**:

| Field | Type | Description |
|------|------|------|
| `name` | string | key / attribute name |
| `type` | string | key type: `HASH` (partition) or `RANGE` (sort); attribute types: `STRING` `INTEGER` `DOUBLE` `BOOLEAN` `BINARY` |

> Every key in `key_schema` must have its type declared in `attributes` — schema validation rejects keys without types.

**throughput** (capacity-type tables usually need no reservation):

| Field | Description |
|------|------|
| `reserved.read` / `reserved.write` | reserved read / write CU |
| `on_demand.read` / `on_demand.write` | on-demand read / write CU caps |

**network**: `type` (`PUBLIC` / `PRIVATE`, required), `vpc_id`, `ingress_rules[]`.

### buckets

Object storage buckets serve three typical purposes: hosting static assets and frontend builds, storing function code packages and artifacts, and archiving logs and backups. Bucket names are globally unique — prefix them with your project:

```yaml
buckets:
  assets:
    name: my-app-assets
    storage:
      class: STANDARD
    versioning:
      status: Enabled
    security:
      acl: PRIVATE
      sse_algorithm: KMS
    domain:
      domain_name: static.example.com
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      protocol: HTTPS
```

| Field | Type | Required | Description |
|------|------|------|------|
| `name` | string | ✅ | bucket name (globally unique, a-zA-Z0-9-_) |
| `storage` | object | ❌ | `class` required: storage class (provider-passthrough, e.g. `STANDARD` / `IA` / `ARCHIVE`) |
| `versioning` | object | ❌ | `status` required: versioning (provider-passthrough; Aliyun uses `Enabled` / `Suspended`) |
| `security` | object | ❌ | ACL and encryption, see below |
| `domain` | object | ❌ | custom domain (recommended, see below) |
| `website` | object | ❌ | static website hosting, see below |
| `iam` | object | ❌ | bucket resource policy |

**security**:

| Field | Type | Description |
|------|------|------|
| `acl` | string | `PRIVATE` (default) / `PUBLIC_READ` / `PUBLIC_READ_WRITE` |
| `force_delete` | boolean | allow destroy to delete non-empty buckets (default false — a non-empty bucket fails teardown, by design) |
| `sse_algorithm` | string | server-side encryption: `AES256` / `KMS` |
| `sse_kms_master_key_id` | string | KMS key ID (used with `sse_algorithm: KMS`) |

**domain - custom domain (recommended)**: a plain string or an object. The object form adds certificates and CDN:

```yaml
domain: cdn.example.com        # shorthand

domain:                        # full form
  domain_name: static.example.com
  protocol: HTTPS
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  www_bind_apex: true
  accelerate: true             # OSS transfer acceleration
  cdn:
    enabled: true
    cdn_type: web
    scope: domestic
    cache_ttl: 3600
    origin_protocol: follow
    force_redirect_https: true
```

Certificate rules match `events.domain`: `certificate_id` and (`certificate_body` + `certificate_private_key`) are mutually exclusive. The `cdn` object is the same as the [events cdn](#cdn-configuration).

**website - static website hosting**:

```yaml
website:
  code: dist/
  index: index.html
```

| Field | Type | Required | Description |
|------|------|------|------|
| `code` | string | ✅ | website build output / code package path |
| `index` | string | ❌ | default index page (index.html) |
| `domain` | string / object | ❌ | ⚠️ deprecated: use the top-level `domain` field |

> Public access requires `security.acl: PUBLIC_READ`; `website` only handles hosting behavior — domains and certificates go through the top-level `domain`.

**iam - bucket resource policy**: cross-account or anonymous access control; statement structure mirrors function `iam.statements` (`effect` / `action` / `resource` required):

```yaml
iam:
  resource:
    statements:
      - effect: Allow
        action:
          - oss:GetObject
        resource:
          - my-app-assets/*
```

## Variable References

Anything that varies across environments should go through variables instead of copy-pasted configs. The three forms have distinct jobs:

```yaml
# ${vars.*} — team-defined variables, overridable via -p
vars:
  db_password: change-me

# ${stages.*} — values defined in the current stage
stages:
  dev:
    memory: 256

# ${ctx.*} — CLI runtime context
# ctx.stage is the stage being deployed
```

```yaml
functions:
  api_function:
    memory: ${stages.memory}          # stages.<current>.memory
    environment:
      DB_PASSWORD: ${vars.db_password} # vars.db_password
      STAGE: ${ctx.stage}              # dev / prod / ...
```

> `app` and `service` do not support variables — they participate in state-file resolution and must be literals before interpolation happens.

## Local Development

`si local` runs the defined functions in local processes, using your real handler code behind a local HTTP server that simulates cloud behavior — iterate without redeploying (currently Aliyun functions only):

```bash
si local --stage dev
```

- Local server listens on port `4567`, routing requests per your `events` rules
- `--watch` is on by default; saving code hot-reloads
- `--debug` enables debug mode and IDE breakpoints

## Best Practices

**Isolate environments with stages, not file copies.** When dev and prod differ only in parameters, one config + `${stages.*}` is the cheapest thing to maintain; split files only when the structure itself diverges.

**Inject secrets, don't commit them.** Keep non-sensitive defaults in `vars`; pass passwords with `-p key=value` at deploy time or wire them from your CI's secret manager.

**Put the environment in function names.** Suffix resource names with `${ctx.stage}` (e.g. `user-api-${ctx.stage}`) so parallel environments are instantly identifiable and never collide.

**Let destroy fail loudly.** Buckets refuse to delete while non-empty (`force_delete: false`) — that guard is protection, not friction. Enable it only for genuinely disposable scratch resources.

**Validate before deploying.** `si validate` checks runtimes, enums, and required fields per provider — catching errors before any cloud resource is created is always cheaper than rolling back a failed deploy.

## FAQ

### Q: Why is API_GATEWAY the only event type?

The schema currently implements only API gateway events. Timer and messaging triggers are not in the schema yet — writing `type: Timer` fails `validate` by design, not by bug. For simple HTTP, use `functions.triggers.http` meanwhile.

### Q: Why can't `app` / `service` use variables?

Both fields participate in state-file resolution and resource naming; the CLI must know them as literals before interpolation. Every other field (`name`, `environment`, ...) may reference variables freely.

### Q: Deployment fails with "runtime not supported"?

`runtime` is validated per provider: Aliyun uses identifiers like `nodejs18`, Volcengine uses suffixed ones like `node20/v1`. Check the runtime table above and the provider page.

### Q: How do I update a deployed function?

Repackage and run `si deploy` again. The CLI diffs against the state file and only changes what actually changed.

### Q: How do I delete all resources?

```bash
si destroy --stage dev
```

Destroy tears down resources recorded in the state file. Non-empty buckets fail teardown; after confirming, you can temporarily set `security.force_delete: true`.