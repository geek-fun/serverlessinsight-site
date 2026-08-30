# 配置手册

本文档详细介绍了 ServerlessInsight 的配置规范，包括基础设施即代码 (IaC) 的 YAML 定义语法和所有可用的资源类型、字段及可选值。基于 `serverlessinsight` v0.7.9 源码 schema 验证。

## 目录

- [快速示例](#快速示例)
- [核心配置](#核心配置)
  - [version](#version)
  - [provider](#provider)
  - [vars](#vars)
  - [stages](#stages)
  - [app](#app)
  - [service](#service)
  - [tags](#tags)
  - [backend](#backend)
- [资源类型](#资源类型)
  - [functions](#functions)
    - [code - 代码部署](#code---代码部署)
    - [container - 容器部署](#container---容器部署)
    - [memory - 内存](#memory---内存)
    - [timeout - 超时时间](#timeout---超时时间)
    - [gpu - GPU 配置](#gpu---gpu-配置)
    - [log - 日志配置](#log---日志配置)
    - [environment - 环境变量](#environment---环境变量)
    - [network - 网络配置](#network---网络配置)
    - [iam - IAM 角色配置](#iam---iam-角色配置)
    - [triggers - 函数级触发器](#triggers---函数级触发器)
    - [domain - 函数级自定义域名](#domain---函数级自定义域名)
    - [storage - 存储挂载](#storage---存储挂载)
  - [events](#events)
    - [triggers - 触发器配置](#triggers---触发器配置)
    - [domain - 自定义域名](#domain---自定义域名)
  - [databases](#databases)
  - [tables](#tables)
  - [buckets](#buckets)
- [变量引用](#变量引用)
- [本地开发](#本地开发)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 快速示例

以下是一个完整的 `serverlessinsight.yml` 配置示例：

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

## 核心配置

### version

指定 ServerlessInsight YAML 配置文件的版本。

```yaml
version: 0.1.0
```

> ⚠️ **注意**: 当前仅支持 `0.1` 版本。主版本之间可能存在不兼容的变更，请确保配置文件与 ServerlessInsight CLI 版本兼容。

### provider

配置云供应商信息。

```yaml
provider:
  name: aliyun
  region: cn-hangzhou
```

**支持的字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 云供应商名称：`aliyun`, `tencent`, `volcengine`, `huawei`, `aws` |
| `region` | string | ✅ | 服务部署区域 |

**阿里云支持的区域:**

**中国大陆:**
- `cn-qingdao`, `cn-beijing`, `cn-zhangjiakou`, `cn-huhehaote`, `cn-wulanchabu`
- `cn-hangzhou`, `cn-shanghai`, `cn-shenzhen`, `cn-heyuan`, `cn-guangzhou`, `cn-chengdu`

**亚太地区:**
- `cn-hongkong`, `ap-southeast-1`, `ap-southeast-3`, `ap-southeast-5`
- `ap-southeast-6`, `ap-southeast-7`, `ap-northeast-1`, `ap-northeast-2`

**欧洲&美洲:**
- `eu-central-1`, `eu-west-1`, `us-east-1`, `us-west-1`, `na-south-1`

**中东:**
- `me-east-1`, `me-central-1`

> 💡 **提示**: 各供应商支持状态：
> - ✅ **阿里云** — 完整支持（FC3、API Gateway、OSS、RDS、TableStore、ES Serverless、CDN）
> - ✅ **腾讯云** — 完整支持（SCF、COS、ES Serverless、TDSQL-C）
> - ✅ **火山引擎** — 完整支持（veFaaS、API Gateway、TOS）
> - 🚧 **华为云** — Beta（FunctionGraph）
> - 🚧 **AWS** — 规划中

### vars

定义可重用的变量，可在配置文件中通过 `${vars.variableName}` 引用。

```yaml
vars:
  region: cn-hangzhou
  account_id: 1234567890
  memory_size: 512
  db_host: db.example.com
```

**变量引用示例:**

```yaml
functions:
  my_function:
    memory: ${vars.memory_size}
    environment:
      REGION: ${vars.region}
```

**命令行覆盖:**

部署时可通过 `--parameter` 或 `-p` 参数覆盖变量默认值：

```bash
si deploy --stage prod -p memory_size=1024
```

### stages

定义不同部署环境的配置。通过 `--stage` 或 `-s` 参数指定使用的环境。

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

**使用示例:**

```yaml
app: my-app
service: my-app-service

functions:
  api_function:
    memory: ${stages.memory}
```

**部署命令:**

```bash
# 部署到开发环境
si deploy --stage dev

# 部署到生产环境
si deploy --stage prod

# 不指定 stage 时，默认使用 default
si deploy
```

> 💡 **提示**: `${ctx.stage}` 是 ServerlessInsight 提供的全局预定义变量，表示当前部署的 stage。

### app

指定应用的名称，用于标识整个 ServerlessInsight 项目。

```yaml
app: my-app
```

**命名规范:**
- 以小写字母开头，仅包含小写字母、数字和连字符（`-`）
- 必须为静态字符串，不能使用变量
- 全局唯一标识符，建议使用项目名称

### service

指定服务的名称。该名称将作为资源 ID 和资源名称的前缀。

```yaml
service: my-app-service
```

**命名建议:**
- 使用小写字母、数字和连字符（`-`）
- 保持名称简短（资源名称会附加此服务名）
- 必须为静态字符串，不能使用变量

> ⚠️ **注意**: 
> - `app` 和 `service` 都是必填字段，且必须为静态字符串
> - `service` 与命令行中的 `<stackName>` 不同。`service` 用于资源命名，`stackName` 是部署时指定的资源栈标识。

### tags

定义资源标签，用于资源管理、成本分摊等。

```yaml
tags:
  owner: geek-fun
  project: my-app
  environment: ${ctx.stage}
```

所有创建的资源都会自动附加这些标签。

### backend

配置后端状态存储，用于管理部署状态和锁信息。

```yaml
backend:
  state_manager:
    type: BUCKET_STORE  # 或 LOCAL
    bucket: my-state-bucket
    key: serverlessinsight/my-service/state.json
```

**字段说明:**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `state_manager.type` | string | ❌ | `LOCAL` | 状态存储类型：`LOCAL`（本地文件）或 `BUCKET_STORE`（对象存储） |
| `state_manager.bucket` | string | ⚠️ | - | 存储桶名称（`BUCKET_STORE` 类型必填） |
| `state_manager.key` | string | ❌ | `state.json` | 状态文件路径 |

> 💡 **提示**: 使用 `BUCKET_STORE` 类型可实现团队协作，多个成员共享同一状态文件，避免部署冲突。

## 资源类型

### functions

定义 Serverless 函数计算资源。支持代码包部署 (`code`) 和容器镜像部署 (`container`) 两种模式，二选一。

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

**顶层字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 函数名称（a-zA-Z0-9-_，1-64 字符） |
| `code` | object | ⚠️ | 代码部署配置（与 `container` 二选一，`container` 缺省时必填） |
| `container` | object | ⚠️ | 容器部署配置（与 `code` 二选一） |
| `memory` | integer | ❌ | 内存大小 MB，默认 512，范围 128-3072 |
| `timeout` | integer | ❌ | 超时时间秒，默认 30，范围 1-900 |
| `gpu` | string | ❌ | GPU 规格（如 `AMPERE_16`、`V100_16`） |
| `log` | object | ❌ | 日志配置 |
| `environment` | object | ❌ | 环境变量（key-value，值可为字符串或变量引用） |
| `network` | object | ❌ | VPC 网络配置 |
| `iam` | object | ❌ | IAM 角色配置 |
| `triggers` | object | ❌ | 函数级触发器（HTTP、Timer、CDN 等） |
| `domain` | object | ❌ | 函数级自定义域名 |
| `storage` | object | ❌ | 存储挂载（NAS/OSS） |

> 💡 **说明**: `code` 和 `container` 二选一。使用 `code` 时需提供 `runtime`、`handler`、`path`；使用 `container` 时提供 `image` 和 `port`。

#### code - 代码部署

```yaml
code:
  runtime: nodejs18
  handler: index.handler
  path: artifacts/function.zip
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `runtime` | string | ✅ | 运行时标识符，见下表 |
| `handler` | string | ✅ | 入口函数，格式：`文件.函数` |
| `path` | string | ✅ | 代码包路径（相对项目根目录） |

**支持的运行时 (通用 + 阿里云专用):**

| 类别 | 运行时标识符 |
|------|-------------|
| **Node.js** | `nodejs20`, `nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10` |
| **Python** | `python3.12`, `python3.11`, `python3.10`, `python3.9`, `python3.8`, `python3.7`, `python3.6` |
| **Java** | `java17`, `java11`, `java8` |
| **Go** | `go1.x` |
| **PHP** | `php7.2`, `php7.3`, `php7.4`, `php8.0`, `php8.1` |
| **.NET** | `dotnetcore3.1`, `dotnet6`, `dotnet8` |
| **Custom Runtime** | `custom`, `custom.debian10` |

> 💡 **提示**: 以上为通用运行时。阿里云 FC3 还支持：`nodejs20`、`python3.12`、`java17` 等最新版本。具体供应商版本请参考对应云厂商文档。

#### container - 容器部署

```yaml
container:
  image: registry.cn-hangzhou.aliyuncs.com/my-repo/my-image:latest
  port: 9000
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image` | string | ✅ | 容器镜像完整地址 |
| `port` | integer | ✅ | 容器监听端口（1-65535） |

> ⚠️ **注意**: 使用容器模式时，函数入口由容器内的 HTTP 服务处理，不需要 `handler`。镜像需包含 HTTP 服务监听指定端口。

#### memory - 内存

```yaml
memory: 1024
```

- 单位：MB
- 范围：128 - 3072
- 默认：512
- 必须是 64 的倍数（部分云厂商要求 128 的倍数）

#### timeout - 超时时间

```yaml
timeout: 60
```

- 单位：秒
- 范围：1 - 900
- 默认：30

#### gpu - GPU 配置

```yaml
gpu: AMPERE_16
```

**支持的 GPU 规格（阿里云）:**
- `AMPERE_16` - A10 16GB
- `AMPERE_24` - A10G 24GB
- `V100_16` - V100 16GB
- `V100_32` - V100 32GB
- `T4_16` - T4 16GB

> 💡 **提示**: GPU 实例需要更高内存配置，建议 `memory >= 4096`。

#### log - 日志配置

```yaml
log:
  project: my-log-project
  logstore: my-function-logs
  ttl: 30
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `project` | string | ❌ | SLS 日志项目名称 |
| `logstore` | string | ❌ | 日志库名称 |
| `ttl` | integer | ❌ | 日志保留天数（1-3650） |

#### environment - 环境变量

```yaml
environment:
  NODE_ENV: production
  DB_HOST: "${vars.db_host}"
  API_KEY: "secret-value"
```

- 格式：`key: value`，值支持变量引用 `${vars.xxx}`、`${stages.xxx}`、`${ctx.stage}`
- 所有环境变量在函数运行时可通过 `process.env` 访问

#### network - 网络配置

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

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vpc_id` | string | ⚠️ | VPC ID（配置网络时必填） |
| `subnet_ids` | string[] | ⚠️ | 交换机 ID 列表（配置网络时必填） |
| `security_group` | object | ❌ | 安全组配置 |

**security_group 字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 安全组名称 |
| `ingress` | string[] | ❌ | 入站规则，格式：`协议:CIDR:端口` |

#### iam - IAM 角色配置

```yaml
iam:
  role: acs:ram::1234567890:role/my-role
  policies:
    - AliyunOSSReadOnlyAccess
    - AliyunRDSReadOnlyAccess
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | string | ❌ | 现有 RAM 角色 ARN |
| `policies` | string[] | ❌ | 附加的系统策略名称列表 |

> 💡 **说明**: 如不指定，将自动创建包含基础权限的角色。

#### triggers - 函数级触发器

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

**支持的触发器类型:**

| 类型 | 说明 | 必填字段 |
|------|------|----------|
| `HTTP` | HTTP 触发器 | `methods`, `path` |
| `TIMER` | 定时触发器 | `cron` (6 位 cron 表达式) |
| `CDN` | CDN 事件触发器 | `event` |

#### domain - 函数级自定义域名

```yaml
domain:
  domain_name: api.example.com
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  protocol: HTTPS
  route_config:
    - path: /api/*
      methods: [GET, POST]
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domain_name` | string | ✅ | 自定义域名 |
| `certificate_id` | string | ❌ | SSL 证书 ID |
| `protocol` | string/array | ❌ | 协议：`HTTP`、`HTTPS` 或 `['HTTP', 'HTTPS']` |
| `route_config` | object[] | ❌ | 路由配置 |

#### storage - 存储挂载

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

定义事件触发器（如 API Gateway）。当前仅支持 `API_GATEWAY` 类型。

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

**顶层字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 事件类型，仅支持 `API_GATEWAY` |
| `name` | string | ✅ | 网关名称 |
| `triggers` | object[] | ✅ | 触发器规则列表 |
| `domain` | object | ❌ | 自定义域名配置 |

#### triggers - 触发器配置

```yaml
triggers:
  - method: GET
    path: /api/*
    backend: api_function
  - method: POST
    path: /api/*
    backend: api_function
```

**每个触发器对象:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `method` | string | ✅ | HTTP 方法：`GET`、`POST`、`PUT`、`DELETE`、`ANY` |
| `path` | string | ✅ | 路径模式（必须以 `/` 开头，支持通配符 `*`） |
| `backend` | string | ✅ | 后端函数 key（对应 `functions` 中的键名） |

> ⚠️ **注意**: `events` 中的 `type` **仅支持 `API_GATEWAY`**。旧版 `HTTP`、`Timer`、`SQS` 等类型已不支持。

#### domain - 自定义域名

同 [functions.domain](#domain---函数级自定义域名)。

---

### databases

定义 Serverless 数据库资源。当前支持 MySQL、PostgreSQL、SQL Server、Elasticsearch、TDSQL-C。

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

**顶层字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 数据库实例名称 |
| `type` | enum | ✅ | 数据库类型（见下表） |
| `version` | enum | ✅ | 引擎版本（见下表） |
| `security` | object | ✅ | 安全配置，必须包含 `basic_auth.password` |

**数据库类型 (`type`) 枚举值:**

| 值 | 说明 |
|----|------|
| `ELASTICSEARCH_SERVERLESS` | Elasticsearch Serverless |
| `RDS_MYSQL_SERVERLESS` | RDS MySQL Serverless |
| `RDS_PGSQL_SERVERLESS` | RDS PostgreSQL Serverless |
| `RDS_MSSQL_SERVERLESS` | RDS SQL Server Serverless |
| `TDSQL_C_SERVERLESS` | TDSQL-C Serverless (腾讯云) |

**版本 (`version`) 枚举值（按类型分组）:**

| 类型 | 支持的版本 |
|------|-----------|
| `RDS_MYSQL_SERVERLESS` | `MYSQL_5.7`, `MYSQL_8.0`, `MYSQL_HA_5.7`, `MYSQL_HA_8.0` |
| `RDS_PGSQL_SERVERLESS` | `PGSQL_14`, `PGSQL_15`, `PGSQL_16`, `PGSQL_HA_14`, `PGSQL_HA_15`, `PGSQL_HA_16` |
| `RDS_MSSQL_SERVERLESS` | `MSSQL_HA_2016`, `MSSQL_HA_2017`, `MSSQL_HA_2019` |
| `ELASTICSEARCH_SERVERLESS` | `ES_SEARCH_7.10`, `ES_TIME_SERIES_7.10` |
| `TDSQL_C_SERVERLESS` | （腾讯云版本，以控制台为准） |

> ⚠️ **注意**: 旧版 `RDS_REDIS_SERVERLESS`、`REDIS_6.0` 等已移除，当前不支持 Redis Serverless。

**security 基础认证:**

```yaml
security:
  basic_auth:
    password: "${vars.db_password}"
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `basic_auth.password` | string | ✅ | 数据库密码（建议使用变量引用） |

---

### tables

定义表格存储资源（TableStore / DynamoDB 等）。

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

**顶层字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 表名 |
| `type` | enum | ✅ | 表类型：`TABLE_STORE_C` (容量型) 或 `TABLE_STORE_H` (高性能型) |
| `collection` | object | ❌ | 所属实例/存储仓配置 |
| `key_schema` | object[] | ✅ | 主键结构 |
| `attributes` | object[] | ✅ | 属性定义 |
| `throughput` | object | ❌ | 吞吐量配置 |

**collection 字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ❌ | 新建实例/存储仓名称 |
| `id` | string | ❌ | 已存在实例/存储仓 ID |

> 💡 **说明**: 不同云厂商概念不同：
> - **阿里云**: 表格存储属于实例 (Instance)
> - **华为云**: 表格存储属于存储仓 (Store)
> - **AWS**: DynamoDB 表为顶层单元，无需 collection

**key_schema 字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 键名 |
| `type` | enum | ✅ | 键类型：`HASH` (分区键) 或 `RANGE` (排序键) |

**attributes 字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 属性名 |
| `type` | enum | ✅ | 数据类型：`STRING`、`INTEGER`、`DOUBLE`、`BOOLEAN`、`BINARY` |

**throughput 字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reserved.read` | integer | ❌ | 预留读 CU (1-10000) |
| `reserved.write` | integer | ❌ | 预留写 CU (1-10000) |
| `on_demand.read` | integer | ❌ | 按需读最大 CU (仅 AWS 支持) |
| `on_demand.write` | integer | ❌ | 按需写最大 CU (仅 AWS 支持) |

> ⚠️ **注意**: `key_schema` 中声明的键必须在 `attributes` 中声明其数据类型。

---

### buckets

定义对象存储桶资源（如阿里云 OSS、AWS S3）。

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

**顶层字段:**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✅ | - | 存储桶名称（a-zA-Z0-9-_，1-64 字符） |
| `storage` | object | ❌ | - | 存储配置 |
| `versioning` | object | ❌ | - | 版本控制配置 |
| `security` | object | ❌ | - | 安全配置 |
| `domain` | object | ❌ | - | 自定义域名配置（推荐方式，优先于 `website.domain`） |
| `website` | object | ❌ | - | 静态网站托管配置 |
| `iam` | object | ❌ | - | 存储桶 IAM 资源策略 |

**存储类型 (`storage.class`):**
- `STANDARD` - 标准存储
- `IA` - 低频访问
- `ARCHIVE` - 归档存储
- `COLD` - 冷存储

**版本控制 (`versioning.status`):**
- `ENABLED` - 启用版本控制
- `DISABLED` - 禁用版本控制

**安全配置 (`security`):**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `acl` | string | ❌ | PRIVATE | 访问控制：`PRIVATE`, `PUBLIC_READ`, `PUBLIC_READ_WRITE` |
| `force_delete` | boolean | ❌ | false | 强制删除（删除后不可恢复） |
| `sse_algorithm` | string | ❌ | - | 加密算法：`AES256`, `KMS` |
| `sse_kms_master_key_id` | string | ❌ | - | KMS 密钥 ID |

**静态网站托管 (`website`):**

> ⚠️ **注意**: 
> - 公网访问需要将 `acl` 设置为 `PUBLIC_READ`
> - 除 `code` 外，其他配置创建后无法修改

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `code` | string | ✅ | - | 网站代码包路径 |
| `domain` | string/object | ❌ | - | 自定义域名（字符串或对象） |
| `index` | string | ❌ | index.html | 默认首页 |
| `error_page` | string | ❌ | 404.html | 错误页面 |
| `error_code` | integer | ❌ | 404 | 错误码 |

**顶级 `domain` 配置（推荐，支持 CDN 和 OSS 加速）:**

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

**cdn 配置字段:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | ✅ | 是否启用 CDN |
| `cdn_type` | string | ❌ | CDN 类型：`web`（网页）、`download`（下载）、`video`（音视频） |
| `scope` | string | ❌ | 加速范围：`domestic`（国内）、`overseas`（海外）、`global`（全球） |
| `cache_ttl` | number | ❌ | 缓存时间（秒） |
| `ignore_query_string` | boolean | ❌ | 是否忽略查询参数 |
| `origin_protocol` | string | ❌ | 回源协议：`http`、`https`、`follow` |
| `compression` | boolean | ❌ | 是否启用压缩 |
| `force_redirect_https` | boolean | ❌ | 是否强制跳转 HTTPS |

**IAM 资源策略 (`iam.resource.statements`):**

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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `effect` | string | ✅ | `Allow` 或 `Deny` |
| `principal` | object | ✅ | 授权主体（如 `AWS: 'account-id'`） |
| `action` | string/array | ✅ | 允许或拒绝的操作 |
| `resource` | string/array | ✅ | 资源路径 |
| `condition` | object | ❌ | 策略条件 |

---

## 变量引用

ServerlessInsight 支持多种变量引用方式：

### 1. vars 变量

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

### 2. stages 变量

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

### 3. 上下文变量

```yaml
app: my-app
service: my-app-service
```

**预定义的上下文变量:**
- `${ctx.stage}` - 当前部署的 stage 名称

> ⚠️ **注意**: `app` 和 `service` 必须为静态字符串，不能使用变量。其他配置可以使用 `${ctx.stage}` 等变量。

## 本地开发

ServerlessInsight 支持在本地启动所有定义的资源，方便开发调试。

**本地运行命令:**

```bash
# 基本本地运行
si local --stage dev

# 启用调试模式
si local --stage dev --debug

# 启用文件监视模式（代码变更自动重载）
si local --stage dev --watch
```

**本地开发优势:**
- ✅ 无需配置本地云资源
- ✅ 开发环境与线上环境一致
- ✅ 支持热重载，提高开发效率
- ✅ 快速调试和测试

## 最佳实践

### 1. 环境隔离

使用 `stages` 管理不同环境：

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

### 2. 变量复用

将常用配置提取为 `vars`：

```yaml
vars:
  regions:
    dev: cn-hangzhou
    prod: cn-beijing
  memory:
    dev: 512
    prod: 2048
```

### 3. 资源命名

使用有意义的命名并包含环境信息：

```yaml
app: my-app
service: my-app-service

functions:
  user_api:
    name: user-api-${ctx.stage}
```

> ⚠️ **注意**: `app` 和 `service` 必须为静态字符串，但资源名称（如 `name` 字段）可以使用变量。

### 4. 标签管理

为所有资源添加标签便于管理：

```yaml
tags:
  owner: team-name
  project: project-name
  environment: ${ctx.stage}
  cost-center: cc-12345
```

### 5. 安全配置

- 使用环境变量管理敏感信息
- 为生产环境配置 VPC 和安全组
- 启用存储桶版本控制和加密

## 常见问题

### Q: 如何切换不同的云供应商？

修改 `provider.name` 并调整相应的区域配置：

```yaml
provider:
  name: aliyun  # 或 tencent, volcengine
  region: cn-hangzhou
```

### Q: 如何更新已部署的函数？

修改配置或代码后重新部署：

```bash
# 重新打包代码
./scripts/package.sh

# 重新部署（更新现有资源）
si deploy --stage dev
```

### Q: 如何删除资源？

使用 `destroy` 命令：

```bash
si destroy --stage dev
```

> ⚠️ **警告**: 这会删除所有相关资源，请谨慎操作。

### Q: 配置文件验证失败怎么办？

使用 `validate` 命令检查配置：

```bash
si validate
```

根据错误提示修复配置问题。

### Q: 为什么我的函数部署报错 "runtime not supported"？

检查 `functions.<name>.code.runtime` 是否为支持的运行时标识符。不同云厂商支持的运行时不同，请参考 [functions.code](#code---代码部署) 中的运行时列表。

### Q: 事件触发器支持哪些类型？

当前仅支持 `API_GATEWAY`。如需定时触发、HTTP 触发等，请使用 `functions.<name>.triggers` 配置函数级触发器。