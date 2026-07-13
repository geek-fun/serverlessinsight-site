# Configuration Reference

This document covers the ServerlessInsight configuration specification, including the Infrastructure as Code (IaC) YAML syntax and all available resource types.

## Table of Contents

- [Quick Example](#quick-example)
- [Core Configuration](#core-configuration)
  - [version](#version)
  - [provider](#provider)
  - [vars](#vars)
  - [stages](#stages)
  - [service](#service)
  - [tags](#tags)
  - [backend](#backend)
- [Resource Types](#resource-types)
  - [functions](#functions)
  - [events](#events)
  - [databases](#databases)
  - [tables](#tables)
  - [buckets](#buckets)
- [Variable References](#variable-references)
- [Local Development](#local-development)
- [Best Practices](#best-practices)
- [FAQ](#faq)

## Quick Example

A complete `serverlessinsight.yml` configuration:

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
```

## Core Configuration

### version

Specifies the version of the ServerlessInsight YAML configuration file.

```yaml
version: 0.1.0
```

> ⚠️ **Note**: Only version `0.1` is currently supported. Breaking changes may occur between major versions. Make sure your configuration is compatible with your ServerlessInsight CLI version.

### provider

Configures the cloud provider.

```yaml
provider:
  name: aliyun
  region: cn-hangzhou
```

**Supported providers:**

| Provider | Status | Resources |
|----------|--------|-----------|
| `aliyun` | ✅ Full support | Function Compute, API Gateway, Elasticsearch Serverless, Table Store, OSS |
| `tencent` | ✅ Full support | SCF, API Gateway, COS, ES Serverless, TDSQL-C |
| `volcengine` | ✅ Full support | veFaaS, API Gateway, TOS |
| `huawei` | 🚧 Beta | FunctionGraph |

**Provider fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Cloud provider name: `aliyun`, `tencent`, `volcengine`, `huawei`, `aws` |
| `region` | string | Yes | Deployment region |

**Supported regions:**

<details>
<summary>Aliyun regions</summary>

**China Mainland:**
- `cn-qingdao`, `cn-beijing`, `cn-zhangjiakou`, `cn-huhehaote`, `cn-wulanchabu`
- `cn-hangzhou`, `cn-shanghai`, `cn-shenzhen`, `cn-heyuan`, `cn-guangzhou`, `cn-chengdu`

**Asia Pacific:**
- `cn-hongkong`, `ap-southeast-1`, `ap-southeast-3`, `ap-southeast-5`
- `ap-southeast-6`, `ap-southeast-7`, `ap-northeast-1`, `ap-northeast-2`

**Europe & Americas:**
- `eu-central-1`, `eu-west-1`, `us-east-1`, `us-west-1`, `na-south-1`

**Middle East:**
- `me-east-1`, `me-central-1`
</details>

<details>
<summary>Tencent Cloud regions</summary>

**China Mainland:**
- `ap-guangzhou`, `ap-shanghai`, `ap-beijing`, `ap-chengdu`, `ap-chongqing`
- `ap-nanjing`, `ap-hongkong`

**Asia Pacific:**
- `ap-singapore`, `ap-tokyo`, `ap-seoul`, `ap-mumbai`
</details>

<details>
<summary>Volcengine regions</summary>

- `cn-north-1`, `cn-north-2`, `cn-beijing`
- `ap-southeast-1`
</details>

<details>
<summary>Huawei Cloud regions</summary>

- `cn-north-1`, `cn-north-4`, `cn-east-2`, `cn-south-1`
- `ap-southeast-1`, `ap-southeast-2`
</details>

### vars

Defines reusable variables that can be referenced throughout the configuration using `${vars.variableName}`.

```yaml
vars:
  region: cn-hangzhou
  account_id: 1234567890
  memory_size: 512
  db_host: db.example.com
```

**Referencing variables:**

```yaml
functions:
  my_function:
    memory: ${vars.memory_size}
    environment:
      REGION: ${vars.region}
```

**Overriding from the command line:**

Pass variables at deploy time using `--parameter` or `-p`:

```bash
si deploy --stage prod -p memory_size=1024
```

### stages

Defines configuration for different deployment environments. Select a stage with `--stage` or `-s`.

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

**Usage:**

```yaml
app: my-app
service: my-app-service

functions:
  api_function:
    memory: ${stages.memory}
```

**Deploy commands:**

```bash
# Deploy to dev
si deploy --stage dev

# Deploy to prod
si deploy --stage prod

# Without --stage, defaults to "default"
si deploy
```

> 💡 **Tip**: `${ctx.stage}` is a built-in context variable that resolves to the current deployment stage.

### app

Specifies the application name, used to identify the entire ServerlessInsight project.

```yaml
app: my-app
```

**Naming guidelines:**
- Must start with a lowercase letter, containing only lowercase letters, digits, and hyphens (`-`)
- Must be a static string, no variable references
- Globally unique identifier; use your project name

### service

Specifies the application name. This name serves as a prefix for resource IDs and resource names.

```yaml
app: my-app
service: my-app-service
```

**Naming guidelines:**

- Use lowercase letters, digits, and hyphens (`-`)
- Keep it short (the service name gets appended to resource names)
- Must be a static string, no variable references

> ⚠️ **Note**:
> - Both `app` and `service` are required fields and must be static strings
> - `service` is different from the `<stackName>` used on the command line. `service` is used for resource naming, while `stackName` identifies the deployment stack.

### tags

Defines resource tags for management and cost allocation.

```yaml
tags:
  owner: geek-fun
  project: my-app
  environment: ${ctx.stage}
```

All created resources will automatically carry these tags.

### backend

Configures backend state management for deployment state tracking.

```yaml
backend:
  state_manager:
    type: BUCKET_STORE  # or LOCAL
    bucket: my-state-bucket
    key: path/to/state.json
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | State storage type: `BUCKET_STORE` or `LOCAL` |
| `bucket` | string | Conditional | Bucket name (required when type is `BUCKET_STORE`) |
| `key` | string | No | Object key within the bucket (defaults to `state.json`) |

> 💡 **Tip**: Use `LOCAL` to store state on disk for development, and `BUCKET_STORE` for team environments where state needs to be shared.

## Resource Types

### functions

Defines Serverless function compute resources.

**Full example:**

```yaml
functions:
  my_function:
    name: my-function
    # Code deployment (choose one)
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/function.zip
    # Or container deployment
    container:
      image: registry.cn-hangzhou.aliyuncs.com/myrepo/myimage:latest
      cmd: npm start
      port: 9000
    # Resource configuration
    memory: 512
    timeout: 30
    gpu: TESLA_8
    # Network configuration
    network:
      vpc_id: vpc-my-vpc
      subnet_ids:
        - vsw-subnet1
        - vsw-subnet2
      security_group:
        name: my-sg
        ingress:
          - TCP:0.0.0.0/0:80
          - TCP:0.0.0.0/0:443
        egress:
          - ALL:0.0.0.0/0:ALL
    # Storage configuration
    storage:
      disk: 512
      nas:
        - mount_path: /mnt/nas
          storage_class: STANDARD_CAPACITY
    # Environment variables
    environment:
      NODE_ENV: production
      API_KEY: ${vars.api_key}
```

**Field reference:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Function name (`a-zA-Z0-9-_`, 1-64 characters) |
| `code` | object | Conditional | - | Code deployment config (mutually exclusive with `container`) |
| `container` | object | Conditional | - | Container deployment config (mutually exclusive with `code`) |
| `memory` | integer | No | 128MB | Memory in MB |
| `timeout` | integer | No | 15 min | Timeout in seconds |
| `gpu` | enum | No | - | GPU configuration |
| `log` | boolean | No | `true` | Enable log collection (SLS). First deployment may have delay creating log resources. |
| `network` | object | No | - | Network configuration |
| `storage` | object | No | - | Storage configuration |
| `iam` | object | No | - | IAM role configuration |
| `environment` | object | No | - | Environment variables |

#### code - Code Deployment

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `runtime` | string | Yes | Runtime environment |
| `handler` | string | Yes | Function handler entry point |
| `path` | string | Yes | Code package path (zip format) |

**Code size limits:**
- **300KB** for inline deployment
- **70MB** when uploaded via OSS for larger packages

**Supported runtimes:**

| Runtime | Aliyun FC3 | Tencent SCF |
|---------|-----------|-------------|
| Node.js | `nodejs24`, `nodejs22`, `nodejs20`, `nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10` | `nodejs/v20`, `nodejs/v18`, `nodejs/v16`, `nodejs/v14` |
| Python | `python3.14`, `python3.13`, `python3.12`, `python3.11`, `python3.10`, `python3.9`, `python3.7`, `python3.6` | `python/v3.12`, `python/v3.11`, `python/v3.10`, `python/v3.9` |
| Java | `java25`, `java21`, `java17`, `java11`, `java8` | `java/v21`, `java/v17`, `java/v11`, `java/v8` |
| Go | `go1` | `golang/v1` |
| PHP | `php8.0`, `php7.4`, `php7.2`, `php5.6` | — |
| .NET | `dotnet_core3.1` | — |

#### container - Container Deployment

> ⚠️ **Note**: Aliyun only supports ACR images within the same account. Public registries like Docker Hub are not supported.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `image` | string | Yes | - | Container image address |
| `cmd` | string | No | Dockerfile default | Container startup command |
| `port` | integer | Yes | - | Container service port |

**Image format:**
```yaml
image: registry.cn-hangzhou.aliyuncs.com/namespace/image:tag
```

#### gpu - GPU Configuration

Supported GPU types (format: model_memory):

- `TESLA_8`, `TESLA_12`, `TESLA_16`
- `AMPERE_8`, `AMPERE_12`, `AMPERE_16`, `AMPERE_24`
- `ADA_48`

> ⚠️ **Note**: Aliyun does not support converting an existing function to a GPU type. You must delete the function and recreate it.

#### network - Network Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vpc_id` | string | Yes | VPC ID |
| `subnet_ids` | array | Yes | List of subnet IDs |
| `security_group` | object | Yes | Security group configuration |

**Security group rule format:**

```yaml
security_group:
  name: my-security-group
  ingress:
    - TCP:0.0.0.0/0:80          # Allow TCP port 80 from all IPv4
    - TCP:0.0.0.0/0:1028/1030   # Allow port range
    - ICMP:0.0.0.0/0:ALL        # Allow ICMP
  egress:
    - ALL:0.0.0.0/0:ALL         # Allow all outbound traffic
```

**Rule format:** `protocol:IP_range:port_range`

**Supported protocols:** `TCP`, `UDP`, `ICMP`, `ALL`

#### storage - Storage Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `disk` | integer | No | 512MB | Ephemeral disk space (MB) |
| `nas` | array | No | - | NAS mount configuration |

**NAS configuration:**

> ⚠️ **Note**: NAS must be in the same VPC as the function and only supports private network access. You must also configure `network` when using NAS.

```yaml
nas:
  - mount_path: /mnt/nas
    storage_class: STANDARD_CAPACITY
```

**Supported NAS types:**
- `STANDARD_CAPACITY` - Standard capacity type
- `STANDARD_PERFORMANCE` - Standard performance type
- `EXTREME_STANDARD` - Extreme standard type
- `EXTREME_ADVANCE` - Extreme advanced type

#### log - Log Configuration

Function logs are enabled by default, automatically creating an SLS log project and logstore.

```yaml
functions:
  my_function:
    log: true  # enabled by default
```

> ⚠️ **Note**: Aliyun SLS log resource creation has a delay. If log creation fails on the first deployment, disable the log, wait 1-2 minutes, then re-deploy to enable it.

#### iam - IAM Role Configuration

Configure an IAM execution role for the function, supporting an existing role name or creating a new role.

```yaml
functions:
  my_function:
    iam:
      role: my-existing-role  # Use an existing role name
```

Or detailed configuration:

```yaml
functions:
  my_function:
    iam:
      role:
        name: my-function-role        # New role name
        managed_policies:             # Attached system policies
          - AliyunFCFullAccess
        statements:                   # Custom permission statements
          - sid: MyCustomAction
            effect: Allow
            action:
              - oss:GetObject
              - oss:PutObject
            resource:
              - arn:oss:*:*:my-bucket/*
```

**IAM field reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string/object | No | IAM role name, or role configuration object |
| `role.name` | string | No | Name for a new role |
| `role.managed_policies` | array | No | List of system policy names to attach |
| `role.statements` | array | No | List of custom permission statements |
| `statement.sid` | string | No | Statement identifier |
| `statement.effect` | string | Yes | `Allow` or `Deny` |
| `statement.action` | string/array | Yes | Allowed or denied actions |
| `statement.resource` | string/array | Yes | Resource ARN |

### events

Defines event triggers that invoke functions.

**Full example:**

```yaml
events:
  api_gateway:
    type: API_GATEWAY
    name: my-api-gateway
    triggers:
      - method: GET
        path: /api/users
        backend: user_function
      - method: POST
        path: /api/users
        backend: user_function
    domain:
      domain_name: api.example.com
      # Option 1: Reference an existing certificate
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      # Option 2: Upload a new certificate (mutually exclusive with option 1)
      # certificate_body: |
      #   -----BEGIN CERTIFICATE-----
      #   ...
      # certificate_private_key: |
      #   -----BEGIN PRIVATE KEY-----
      #   ...
```

**Field reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Event type (currently only `API_GATEWAY` is supported) |
| `name` | string | Yes | Event name |
| `triggers` | array | Yes | List of trigger configurations |
| `domain` | object | No | Custom domain configuration |

#### triggers - Trigger Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | Yes | HTTP method |
| `path` | string | Yes | Request path |
| `backend` | string | Yes | Backend function name |

**Supported HTTP methods:**
`GET`, `POST`, `PUT`, `DELETE`, `ANY`

**Other event types (in development):**
- `SQS` - Message queue
- `S3` - Object storage events
- `HTTP` - HTTP trigger
- `Timer` - Scheduled trigger

#### domain - Custom Domain

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain_name` | string | Yes | Custom domain name |
| `certificate_id` | string | No | Existing SSL certificate ID (mutually exclusive with `certificate_body` + `certificate_private_key`) |
| `certificate_body` | string | No | SSL certificate content (PEM format, requires `certificate_private_key`) |
| `certificate_private_key` | string | No | SSL certificate private key (PEM format, requires `certificate_body`) |
| `protocol` | string/array | No | Protocol: `HTTP`, `HTTPS`, or array `['HTTP', 'HTTPS']` |
| `www_bind_apex` | boolean | No | Auto-bind `www` subdomain to the apex domain (API Gateway only) |
| `cdn` | boolean/object | No | CDN acceleration configuration |

**cdn - CDN acceleration configuration:**

```yaml
domain:
  domain_name: api.example.com
  cdn:
    enabled: true
    cdn_type: web           # web / download / video
    scope: domestic          # domestic / overseas / global
    cache_ttl: 3600          # Cache duration (seconds)
    origin_protocol: https   # http / https / follow
    force_redirect_https: true
```

> 💡 **Note**: SSL certificate configuration supports two modes (choose one):
> - **Reference mode**: Use `certificate_id` to reference an existing certificate
> - **Upload mode**: Use `certificate_body` + `certificate_private_key` to upload a new certificate

**www_bind_apex dual-domain binding:**

When `www_bind_apex` is set to `true`, the system automatically binds the `www.example.com` subdomain to the same backend as the apex domain `example.com`. This is useful for sites that need to serve traffic from both `www` and non-`www` URLs.

```yaml
events:
  api_gateway:
    type: API_GATEWAY
    name: my-api-gateway
    triggers:
      - method: GET
        path: /api/*
        backend: api_function
    domain:
      domain_name: example.com
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      protocol: HTTPS
      www_bind_apex: true  # Auto-bind www.example.com
```

### databases

Defines database resources.

**Full example:**

```yaml
databases:
  my_database:
    name: my-app-db
    type: ELASTICSEARCH_SERVERLESS
    version: ES_SEARCH_7.10
    cu:
      min: 1
      max: 6
    storage:
      min: 20
    security:
      basic_auth:
        master_user: admin    # Optional, auto-generated if omitted
        password: SecurePassword123
    network:
      type: PRIVATE
      vpc_id: vpc-my-vpc
      subnet_id: vsw-subnet1
      ingress_rules:
        - TCP:0.0.0.0/0:3306
      public: false            # Enable public network access
```

**Field reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Database name |
| `type` | string | Yes | Database type |
| `version` | string | Yes | Database version |
| `cu` | object | No | Compute unit configuration |
| `storage` | object | No | Storage configuration |
| `security` | object | Yes | Security configuration (`basic_auth.password` is required, `master_user` is optional) |
| `network` | object | No | Network configuration |

**Network configuration fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Network type: `PUBLIC` or `PRIVATE` |
| `vpc_id` | string | No | VPC ID (`PRIVATE` type only) |
| `subnet_id` | string | No | Subnet ID (`PRIVATE` type only) |
| `ingress_rules` | array | No | Inbound rules (same format as security group rules) |
| `public` | boolean | No | Enable public network access |

**Supported database types:**
- `ELASTICSEARCH_SERVERLESS` - Elasticsearch Serverless
- `RDS_MYSQL_SERVERLESS` - MySQL Serverless
- `RDS_PGSQL_SERVERLESS` - PostgreSQL Serverless
- `RDS_MSSQL_SERVERLESS` - SQL Server Serverless
- `TDSQL_C_SERVERLESS` - Tencent Cloud TDSQL-C Serverless (MySQL compatible)

**Supported database versions:**
- MySQL: `MYSQL_5.7`, `MYSQL_8.0`, `MYSQL_HA_5.7`, `MYSQL_HA_8.0`
- PostgreSQL: `PGSQL_14`, `PGSQL_15`, `PGSQL_16`, `PGSQL_HA_14`, `PGSQL_HA_15`, `PGSQL_HA_16`
- SQL Server: `MSSQL_HA_2016`, `MSSQL_HA_2017`, `MSSQL_HA_2019`
- Elasticsearch: `ES_SEARCH_7.10`, `ES_TIME_SERIES_7.10`

**CU configuration:**

| Field | Type | Required | Range |
|-------|------|----------|-------|
| `min` | integer | No | 0-32 |
| `max` | integer | No | 1-32 |

### tables

Defines table storage resources (e.g., Aliyun Table Store, AWS DynamoDB).

**Full example:**

```yaml
tables:
  my_table:
    collection: my-instance  # Or use an existing instance ID
    name: my-app-table
    type: TABLE_STORE_C
    network:
      type: PRIVATE
      ingress_rules:
        - TCP:0.0.0.0/0:80
        - TCP:0.0.0.0/0:443
    throughput:
      reserved:
        read: 5
        write: 10
      on_demand:
        read: 100
        write: 100
    key_schema:
      - name: id
        type: HASH
      - name: created_at
        type: RANGE
    attributes:
      - name: id
        type: STRING
      - name: created_at
        type: INTEGER
      - name: data
        type: BINARY
```

**Field reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collection` | object | Conditional | Parent instance/store |
| `name` | string | Yes | Table name |
| `type` | enum | Yes | Table type |
| `desc` | string | No | Table description (max 256 characters) |
| `network` | object | No | Network configuration |
| `throughput` | object | No | Throughput configuration |
| `key_schema` | array | Yes | Primary key schema |
| `attributes` | array | Yes | Attribute definitions |

**collection configuration:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Name for a new instance/store |
| `id` | string | No | ID of an existing instance/store |

> 💡 **Note**: Table storage concepts differ across providers:
> - **Aliyun**: Tables belong to an Instance
> - **Huawei**: Tables belong to a Store
> - **AWS**: DynamoDB tables are top-level; no collection needed

**Supported table types:**
- `TABLE_STORE_C` - Capacity type
- `TABLE_STORE_H` - High performance type

**Throughput configuration:**

| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| `reserved.read` | integer | No | 1-10000 | Reserved read CU |
| `reserved.write` | integer | No | 1-10000 | Reserved write CU |
| `on_demand.read` | integer | No | 1-10000 | On-demand max read CU (AWS only) |
| `on_demand.write` | integer | No | 1-10000 | On-demand max write CU (AWS only) |

**Primary key types:**
- `HASH` - Partition key
- `RANGE` - Sort key

**Attribute data types:**
- `STRING` - String
- `INTEGER` - 64-bit signed integer
- `DOUBLE` - 64-bit double-precision floating point
- `BOOLEAN` - Boolean
- `BINARY` - Binary

> ⚠️ **Note**: Keys declared in `key_schema` must have their data types declared in `attributes`.

### buckets

Defines object storage bucket resources (e.g., Aliyun OSS, AWS S3).

**Full example:**

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
```

**Field reference:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Bucket name (`a-zA-Z0-9-_`, 1-64 characters) |
| `storage` | object | No | - | Storage configuration |
| `versioning` | object | No | - | Versioning configuration |
| `security` | object | No | - | Security configuration |
| `domain` | object | No | - | Custom domain configuration (recommended over `website.domain`) |
| `website` | object | No | - | Static website hosting configuration |
| `iam` | object | No | - | Bucket IAM resource policy |

**Storage classes:**
- `STANDARD` - Standard storage
- `IA` - Infrequent Access
- `ARCHIVE` - Archive storage
- `COLD` - Cold storage

**Versioning:**

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `status` | string | Yes | `ENABLED`, `DISABLED` |

**Security configuration:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `acl` | string | No | PRIVATE | Access control: `PRIVATE`, `PUBLIC_READ`, `PUBLIC_READ_WRITE` |
| `force_delete` | boolean | No | false | Force delete (irreversible after deletion) |
| `sse_algorithm` | string | No | - | Encryption algorithm: `AES256`, `KMS` |
| `sse_kms_master_key_id` | string | No | - | KMS key ID |

**Static website hosting:**

> ⚠️ **Note**:
> - Public access requires setting `acl` to `PUBLIC_READ`
> - Apart from `code`, other settings cannot be modified after creation

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `code` | string | Yes | - | Website code package path |
| `domain` | string/object | No | - | Custom domain (string or object) |
| `index` | string | No | index.html | Default index page |
| `error_page` | string | No | 404.html | Error page |
| `error_code` | integer | No | 404 | Error code |

**domain configuration object (supports SSL certificates):**

When you need to configure SSL for a static website, `domain` can be an object:

```yaml
website:
  code: dist/
  domain:
    domain_name: www.example.com
    certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    # Or use certificate content
    # certificate_body: |
    #   -----BEGIN CERTIFICATE-----
    #   ...
    # certificate_private_key: |
    #   -----BEGIN PRIVATE KEY-----
    #   ...
    protocol: HTTPS
  index: index.html
  error_page: 404.html
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain_name` | string | Yes | Custom domain name |
| `certificate_id` | string | No | Existing SSL certificate ID |
| `certificate_body` | string | No | SSL certificate content (requires `certificate_private_key`) |
| `certificate_private_key` | string | No | SSL certificate private key |
| `protocol` | string/array | No | Protocol: `HTTP`, `HTTPS`, or `['HTTP', 'HTTPS']` |
| `www_bind_apex` | boolean | No | Auto-bind `www` subdomain (for apex domain configuration) |
| `cdn` | boolean/object | No | CDN acceleration configuration |

> 💡 **Recommendation**: Use the top-level `domain` field (rather than `website.domain`) for custom domain configuration. It supports CDN acceleration and OSS transfer acceleration.

**Top-level domain configuration example:**

```yaml
buckets:
  my_bucket:
    name: my-app-bucket
    domain:
      domain_name: static.example.com
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      protocol: HTTPS
      www_bind_apex: true
      cdn:                             # CDN acceleration
        enabled: true
        cdn_type: web
        scope: domestic
        cache_ttl: 3600
        origin_protocol: https
        force_redirect_https: true
      accelerate: true                 # OSS transfer acceleration (cross-region)
```

**cdn configuration fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | boolean | Yes | Enable CDN |
| `cdn_type` | string | No | CDN type: `web`, `download`, `video` |
| `scope` | string | No | Acceleration scope: `domestic`, `overseas`, `global` |
| `cache_ttl` | number | No | Cache duration (seconds) |
| `ignore_query_string` | boolean | No | Ignore query string parameters |
| `origin_protocol` | string | No | Origin protocol: `http`, `https`, `follow` |
| `compression` | boolean | No | Enable compression |
| `force_redirect_https` | boolean | No | Force HTTPS redirect |

#### iam - Bucket Resource Policy

Configure IAM resource policies for the bucket to control cross-account or anonymous access.

```yaml
buckets:
  my_bucket:
    name: my-app-bucket
    iam:
      resource:
        statements:
          - effect: Allow
            principal:
              AWS: '123456789012'
            action:
              - oss:GetObject
            resource:
              - my-app-bucket/*
```

**IAM field reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `effect` | string | Yes | `Allow` or `Deny` |
| `principal` | object | Yes | Authorized principal (e.g., `AWS: 'account-id'`) |
| `action` | string/array | Yes | Allowed or denied actions |
| `resource` | string/array | Yes | Resource path |
| `condition` | object | No | Policy condition |

## Variable References

ServerlessInsight supports several ways to reference variables:

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

**Built-in context variables:**
- `${ctx.stage}` - Current deployment stage name

> ⚠️ **Note**: `app` and `service` must be static strings and cannot use variables. Other configuration fields can use `${ctx.stage}` and similar references.

## Local Development

ServerlessInsight supports running all defined resources locally for development and debugging.

**Local run commands:**

```bash
# Basic local run
si local --stage dev

# Enable debug mode
si local --stage dev --debug

# Enable file watching (auto-reload on code changes)
si local --stage dev --watch
```

**Local development advantages:**
- ✅ No local cloud resource setup required
- ✅ Development environment matches production
- ✅ Hot reload support for faster iteration
- ✅ Quick debugging and testing

## Best Practices

### 1. Environment Isolation

Use `stages` to manage different environments:

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

### 2. Variable Reuse

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

### 3. Resource Naming

Use meaningful names that include environment information:

```yaml
app: my-app
service: my-app-service

functions:
  user_api:
    name: user-api-${ctx.stage}
```

> ⚠️ **Note**: `app` and `service` must be static strings, but resource names (like the `name` field) can use variables.

### 4. Tag Management

Tag all resources for easier management:

```yaml
tags:
  owner: team-name
  project: project-name
  environment: ${ctx.stage}
  cost-center: cc-12345
```

### 5. Security

- Use environment variables for sensitive information
- Configure VPC and security groups for production
- Enable bucket versioning and encryption

## FAQ

### How do I switch cloud providers?

Change `provider.name` and update the region accordingly:

```yaml
provider:
  name: tencent  # or aliyun, volcengine, huawei
  region: ap-guangzhou
```

### How do I update a deployed function?

Re-deploy after modifying the configuration or code:

```bash
# Repackage the code
./scripts/package.sh

# Redeploy (updates existing resources)
si deploy --stage dev
```

### How do I delete resources?

Use the `destroy` command:

```bash
si destroy --stage dev
```

> ⚠️ **Warning**: This deletes all related resources. Proceed with caution.

### The configuration file validation failed. What should I do?

Run the `validate` command to check your configuration:

```bash
si validate
```

Fix the issues based on the error messages.

### What are the code size limits?

- **300KB** for inline deployment
- **70MB** via OSS upload for larger packages

### How do I deploy to a different region?

Pass the `--region` flag:

```bash
si deploy --stage dev --region cn-beijing
```

### How do I override variables at deploy time?

Use `-p key=value` to override `vars` values:

```bash
si deploy --stage prod -p memory_size=2048 -p db_host=prod.db.example.com
```
