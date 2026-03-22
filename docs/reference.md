# 配置手册

本文档详细介绍了 ServerlessInsight 的配置规范，包括基础设施即代码 (IaC) 的 YAML 定义语法和所有可用的资源类型。

## 目录

- [快速示例](#快速示例)
- [核心配置](#核心配置)
  - [version](#version)
  - [provider](#provider)
  - [vars](#vars)
  - [stages](#stages)
  - [service](#service)
  - [tags](#tags)
- [资源类型](#资源类型)
  - [functions](#functions)
  - [events](#events)
  - [databases](#databases)
  - [tables](#tables)
  - [buckets](#buckets)
- [变量引用](#变量引用)
- [本地开发](#本地开发)

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
| `name` | string | ✅ | 云供应商名称：`aliyun`, `huawei`, `tencent` |
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

> 💡 **提示**: 目前仅完整支持阿里云，华为云和腾讯云正在开发中。

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

### service

指定 Serverless 应用的名称。该名称将作为资源 ID 和资源名称的前缀。

```yaml
app: my-app
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

## 资源类型

### functions

定义 Serverless 函数计算资源。

**完整示例:**

```yaml
functions:
  my_function:
    name: my-function
    # 代码部署方式（二选一）
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/function.zip
    # 或容器部署方式
    container:
      image: registry.cn-hangzhou.aliyuncs.com/myrepo/myimage:latest
      cmd: npm start
      port: 9000
    # 资源配置
    memory: 512
    timeout: 30
    gpu: TESLA_8
    # 网络配置
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
    # 存储配置
    storage:
      disk: 512
      nas:
        - mount_path: /mnt/nas
          storage_class: STANDARD_CAPACITY
    # 环境变量
    environment:
      NODE_ENV: production
      API_KEY: ${vars.api_key}
```

**字段说明:**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✅ | - | 函数名称（a-zA-Z0-9-_，1-64 字符） |
| `code` | object | ⚠️ | - | 代码部署配置（与 `container` 二选一） |
| `container` | object | ⚠️ | - | 容器部署配置（与 `code` 二选一） |
| `memory` | integer | ❌ | 128MB | 内存大小（MB） |
| `timeout` | integer | ❌ | 15 分钟 | 超时时间（秒） |
| `gpu` | enum | ❌ | - | GPU 配置 |
| `network` | object | ❌ | - | 网络配置 |
| `storage` | object | ❌ | - | 存储配置 |
| `environment` | object | ❌ | - | 环境变量 |

#### code - 代码部署

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `runtime` | string | ✅ | 运行时环境 |
| `handler` | string | ✅ | 函数处理程序入口 |
| `path` | string | ✅ | 代码包路径（zip 格式） |

**支持的运行时:**
- Node.js: `nodejs20`, `nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10`, `nodejs8`
- Python: `python3.10`, `python3.9`, `python3`
- PHP: `PHP7.2`
- Java: `Java11`
- .NET: `.NETCore3.1`
- Go: `Go1.x`

#### container - 容器部署

> ⚠️ **注意**: 阿里云仅支持同一账户下的 ACR 镜像，不支持 Docker Hub 等公共镜像。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `image` | string | ✅ | - | 容器镜像地址 |
| `cmd` | string | ❌ | Dockerfile 中的配置 | 容器启动命令 |
| `port` | integer | ✅ | - | 容器服务端口 |

**镜像格式:**
```yaml
image: registry.cn-hangzhou.aliyuncs.com/namespace/image:tag
```

#### gpu - GPU 配置

支持的 GPU 类型（格式：型号_显存）:

- `TESLA_8`, `TESLA_12`, `TESLA_16`
- `AMPERE_8`, `AMPERE_12`, `AMPERE_16`, `AMPERE_24`
- `ADA_48`

> ⚠️ **注意**: 阿里云不支持将已存在的函数修改为 GPU 类型。如需使用 GPU，需删除原函数后重新创建。

#### network - 网络配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vpc_id` | string | ✅ | VPC ID |
| `subnet_ids` | array | ✅ | 子网 ID 列表 |
| `security_group` | object | ✅ | 安全组配置 |

**安全组规则格式:**

```yaml
security_group:
  name: my-security-group
  ingress:
    - TCP:0.0.0.0/0:80          # 允许所有 IPv4 的 TCP 80 端口
    - TCP:0.0.0.0/0:1028/1030   # 允许端口范围
    - ICMP:0.0.0.0/0:ALL        # 允许 ICMP
  egress:
    - ALL:0.0.0.0/0:ALL         # 允许所有出站流量
```

**规则格式:** `协议:IP 范围：端口范围`

**支持的协议:** `TCP`, `UDP`, `ICMP`, `ALL`

#### storage - 存储配置

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `disk` | integer | ❌ | 512MB | 临时磁盘空间（MB） |
| `nas` | array | ❌ | - | NAS 挂载配置 |

**NAS 配置:**

> ⚠️ **注意**: NAS 必须与函数在同一 VPC 下，且仅支持内网访问。配置 NAS 时必须同时配置 `network`。

```yaml
nas:
  - mount_path: /mnt/nas
    storage_class: STANDARD_CAPACITY
```

**支持的 NAS 类型:**
- `STANDARD_CAPACITY` - 标准容量型
- `STANDARD_PERFORMANCE` - 标准性能型
- `EXTREME_STANDARD` - 极速标准型
- `EXTREME_ADVANCE` - 极速高级型

### events

定义事件触发器，用于触发函数执行。

**完整示例:**

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
      # 方式一：引用已有证书
      certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      # 方式二：上传新证书（二选一）
      # certificate_body: |
      #   -----BEGIN CERTIFICATE-----
      #   ...
      # certificate_private_key: |
      #   -----BEGIN PRIVATE KEY-----
      #   ...
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 事件类型（当前仅支持 `API_GATEWAY`） |
| `name` | string | ✅ | 事件名称 |
| `triggers` | array | ✅ | 触发器配置列表 |
| `domain` | object | ❌ | 自定义域名配置 |

#### triggers - 触发器配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `method` | string | ✅ | HTTP 方法 |
| `path` | string | ✅ | 请求路径 |
| `backend` | string | ✅ | 后端函数名称 |

**支持的 HTTP 方法:**
`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`, `ANY`

**其他支持的事件类型（开发中）:**
- `SQS` - 消息队列
- `S3` - 对象存储事件
- `HTTP` - HTTP 触发器
- `Timer` - 定时触发器

#### domain - 自定义域名

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domain_name` | string | ✅ | 自定义域名 |
| `certificate_id` | string | ❌ | 云厂商已存在的 SSL 证书 ID（与 `certificate_body` + `certificate_private_key` 二选一） |
| `certificate_body` | string | ❌ | SSL 证书内容（PEM 格式，需同时提供 `certificate_private_key`） |
| `certificate_private_key` | string | ❌ | SSL 证书私钥（PEM 格式，需同时提供 `certificate_body`） |
| `protocol` | string/array | ❌ | 协议类型：`HTTP`、`HTTPS` 或数组 `['HTTP', 'HTTPS']` |

> 💡 **说明**: SSL 证书配置有两种模式（二选一）：
> - **引用模式**：使用 `certificate_id` 引用云厂商已存在的证书
> - **上传模式**：使用 `certificate_body` + `certificate_private_key` 上传新证书

### databases

定义数据库资源。

**完整示例:**

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
        master_user: admin
        password: SecurePassword123
    network:
      type: PRIVATE
      public: false
```

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 数据库名称 |
| `type` | string | ✅ | 数据库类型 |
| `version` | string | ✅ | 数据库版本 |
| `cu` | object | ❌ | 计算单元配置 |
| `storage` | object | ❌ | 存储配置 |
| `security` | object | ✅ | 安全配置 |
| `network` | object | ❌ | 网络配置 |

**支持的数据库类型:**
- `ELASTICSEARCH_SERVERLESS` - Elasticsearch Serverless
- `RDS_MYSQL_SERVERLESS` - MySQL Serverless
- `RDS_PGSQL_SERVERLESS` - PostgreSQL Serverless
- `RDS_MSSQL_SERVERLESS` - SQL Server Serverless

**支持的数据库版本:**
- MySQL: `MYSQL_5.7`, `MYSQL_8.0`, `MYSQL_HA_5.7`, `MYSQL_HA_8.0`
- PostgreSQL: `PGSQL_14`, `PGSQL_15`, `PGSQL_16`, `PGSQL_HA_14`, `PGSQL_HA_15`, `PGSQL_HA_16`
- SQL Server: `MSSQL_HA_2016`, `MSSQL_HA_2017`, `MSSQL_HA_2019`
- Elasticsearch: `ES_SEARCH_7.10`, `ES_TIME_SERIES_7.10`

**CU 配置:**

| 字段 | 类型 | 必填 | 范围 |
|------|------|------|------|
| `min` | integer | ❌ | 0-32 |
| `max` | integer | ❌ | 1-32 |

### tables

定义表格存储资源（如阿里云 Table Store、AWS DynamoDB）。

**完整示例:**

```yaml
tables:
  my_table:
    collection: my-instance  # 或使用已存在实例的 ID
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

**字段说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `collection` | object | ⚠️ | 所属实例/存储仓 |
| `name` | string | ✅ | 表名 |
| `type` | enum | ✅ | 表类型 |
| `network` | object | ❌ | 网络配置 |
| `throughput` | object | ❌ | 吞吐量配置 |
| `key_schema` | array | ✅ | 主键结构 |
| `attributes` | array | ✅ | 属性定义 |

**collection 配置:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ❌ | 新建实例/存储仓名称 |
| `id` | string | ❌ | 已存在实例/存储仓 ID |

> 💡 **说明**: 不同云厂商的表格存储概念不同：
> - **阿里云**: 表格存储属于实例 (Instance)
> - **华为云**: 表格存储属于存储仓 (Store)
> - **AWS**: DynamoDB 表为顶层单元，无需 collection

**支持的表类型:**
- `TABLE_STORE_C` - 容量型
- `TABLE_STORE_G` - 性能型

**吞吐量配置:**

| 字段 | 类型 | 必填 | 范围 | 说明 |
|------|------|------|------|------|
| `reserved.read` | integer | ❌ | 1-10000 | 预留读 CU |
| `reserved.write` | integer | ❌ | 1-10000 | 预留写 CU |
| `on_demand.read` | integer | ❌ | 1-10000 | 按需读最大 CU（仅 AWS 支持） |
| `on_demand.write` | integer | ❌ | 1-10000 | 按需写最大 CU（仅 AWS 支持） |

**主键类型:**
- `HASH` - 分区键
- `RANGE` - 排序键

**属性数据类型:**
- `STRING` - 字符串
- `NUMBER` - 数字
- `BOOLEAN` - 布尔值
- `BINARY` - 二进制
- `MAP` - 映射
- `LIST` - 列表

> ⚠️ **注意**: `key_schema` 中声明的键必须在 `attributes` 中声明其数据类型。

### buckets

定义对象存储桶资源（如阿里云 OSS、AWS S3）。

**完整示例:**

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

**字段说明:**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | ✅ | - | 存储桶名称（a-zA-Z0-9-_，1-64 字符） |
| `storage` | object | ❌ | - | 存储配置 |
| `versioning` | object | ❌ | - | 版本控制配置 |
| `security` | object | ❌ | - | 安全配置 |
| `website` | object | ❌ | - | 静态网站托管配置 |

**存储类型:**
- `STANDARD` - 标准存储
- `IA` - 低频访问
- `ARCHIVE` - 归档存储
- `COLD` - 冷存储

**版本控制:**

| 字段 | 类型 | 必填 | 选项 |
|------|------|------|------|
| `status` | string | ✅ | `ENABLED`, `DISABLED` |

**安全配置:**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `acl` | string | ❌ | PRIVATE | 访问控制：`PRIVATE`, `PUBLIC_READ`, `PUBLIC_READ_WRITE` |
| `force_delete` | boolean | ❌ | false | 强制删除（删除后不可恢复） |
| `sse_algorithm` | string | ❌ | - | 加密算法：`AES256`, `KMS` |
| `sse_kms_master_key_id` | string | ❌ | - | KMS 密钥 ID |

**静态网站托管:**

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

**domain 配置对象（支持 SSL 证书）:**

当需要为静态网站配置 SSL 证书时，`domain` 可以配置为对象：

```yaml
website:
  code: dist/
  domain:
    domain_name: www.example.com
    certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    # 或者使用证书内容
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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domain_name` | string | ✅ | 自定义域名 |
| `certificate_id` | string | ❌ | 云厂商已存在的 SSL 证书 ID |
| `certificate_body` | string | ❌ | SSL 证书内容（需同时提供 `certificate_private_key`） |
| `certificate_private_key` | string | ❌ | SSL 证书私钥 |
| `protocol` | string/array | ❌ | 协议：`HTTP`、`HTTPS` 或 `['HTTP', 'HTTPS']` |

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
  name: aliyun  # 或 huawei, tencent
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
