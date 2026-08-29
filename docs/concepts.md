---
title: 配置模型
description: ServerlessInsight 的配置模型、资源类型与生命周期概念
---

# 配置模型

ServerlessInsight 以基础设施即代码（IaC）为核心：你只需在项目根目录的 `serverlessinsight.yml` 中声明式地描述所需的云资源，CLI 会自动在目标云供应商创建、更新与回收这些资源。

本文介绍通用的配置模型与资源类型。各云供应商在资源覆盖、认证、地域、运行时上的差异，请查阅 [供应商总览](/providers/) 与对应的供应商页面。

## 项目结构

推荐的项目结构如下：

```
my-app/
├── artifacts/              # 打包后的应用程序（函数代码压缩包等）
├── src/                    # 源代码
├── serverlessinsight.yml   # 资源配置文件（必需）
├── package.json
└── tsconfig.json
```

`serverlessinsight.yml` 是唯一的必需配置文件，放在项目根目录。

## 配置文件概览

`serverlessinsight.yml` 的顶层字段如下：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `version` | 是 | 配置格式版本，取值 `0.0.0` / `0.0.1` / `0.1.0` |
| `provider` | 是 | 云供应商，包含 `name` 与 `region` |
| `app` | 是 | 应用名，小写字母开头，仅含小写字母、数字与 `-` |
| `service` | 是 | 服务名，命名规则同 `app` |
| `vars` | 否 | 全局变量，可在配置中通过 `${vars.xxx}` 引用 |
| `stages` | 否 | 多环境定义，每个 stage 可覆盖 `region`、变量等 |
| `tags` | 否 | 资源标签 |
| `functions` | 否 | 函数计算资源 |
| `events` | 否 | 事件触发器（API 网关） |
| `databases` | 否 | 数据库资源 |
| `buckets` | 否 | 对象存储资源 |
| `tables` | 否 | 表格存储资源 |
| `backend` | 否 | 状态后端配置 |

最小可用配置：

```yaml
version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou
app: hello-world
service: hello-world-api
```

> 供应商仅支持 `aliyun`、`tencent`、`volcengine` 实际部署；`huawei` 与 `aws` 目前仅出现在枚举中，暂不可部署。

## 资源类型

### 函数（Functions）

键名是函数的引用名，内部 `name` 为云上函数名（必填）。代码通过 `code` 指定：

```yaml
functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/hello-world-api.zip
    memory: 512          # 默认 128 (MB)
    timeout: 10           # 默认 3 (秒)
    environment:
      NODE_ENV: prod
```

常用字段：

- `code`：`runtime`、`handler`、`path` 必填（代码包路径）
- `container`：`image` 与 `port` 必填（容器镜像部署方式）
- `memory`：内存上限，默认 128
- `timeout`：超时时间（秒），默认 3
- `gpu`：GPU 规格（`TESLA_*` / `AMPERE_*` / `ADA_*`）
- `environment`：环境变量键值对
- `network`：私有网络（`vpc_id`、`subnet_ids`、`security_group`）
- `iam.role`：函数执行角色（字符串或带策略的对象）
- `triggers.http`：HTTP 触发器（`auth_type` 为 `public` 或 `iam`）
- `domain`：自定义域名（`domain_name` 必填）
- `storage`：磁盘与 NAS 挂载

> 不同供应商支持的运行时不相同，请以对应供应商页面为准。运行时在 `validate` / `plan` 阶段按供应商校验。

### 事件（Events / API 网关）

目前事件类型仅支持 `API_GATEWAY`：

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

- `triggers` 数组每项包含 `method`（GET/POST/PUT/DELETE/ANY）、`path`、`backend`（绑定的函数引用名）
- `domain`：自定义域名与证书
- `network`：网关所在的私有网络

> ⚠️ **腾讯云不支持 `events`（API 网关资源）**。腾讯云函数通过函数上的 `triggers.http` 暴露 HTTP 入口，详见 [腾讯云供应商](/providers/tencent)。

### 对象存储（Buckets）

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

- `name`：桶名（必填）
- `storage.class`：存储类型（必填）
- `versioning.status`：版本控制状态
- `security.acl`：`PRIVATE` / `PUBLIC_READ` / `PUBLIC_READ_WRITE`
- `domain`：绑定自定义域名（支持证书与 CDN）
- `website`：静态网站托管（`domain` 已取代其 `domain` 字段，旧字段废弃）
- `iam`：桶访问策略

### 数据库（Databases）

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

- `type`：`ELASTICSEARCH_SERVERLESS` / `RDS_MYSQL_SERVERLESS` / `RDS_PGSQL_SERVERLESS` / `RDS_MSSQL_SERVERLESS` / `TDSQL_C_SERVERLESS`
- `version`：随 `type` 变化（如 `MYSQL_8.0`、`PGSQL_16`、`ES_SEARCH_7.10` 等）
- `cu`：弹性计算单位范围（`min` / `max`）
- `storage`：存储容量范围（整数）
- `security.basic_auth.password`：必填
- `network`：访问类型（`PUBLIC` / `PRIVATE`）、VPC 与安全规则

> 并非所有供应商都支持全部数据库类型，详见 [供应商总览](/providers/) 的能力矩阵。

### 表格存储（Tables）

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

- `collection` / `name` / `type` / `key_schema` / `attributes` 为必填
- `type`：`TABLE_STORE_C` / `TABLE_STORE_H`
- `key_schema`：主键（`HASH` / `RANGE`）
- `attributes`：属性列（`STRING` / `INTEGER` / `DOUBLE` / `BOOLEAN` / `BINARY`）
- `throughput`：预留或按需读写容量
- `network`：`PUBLIC` / `PRIVATE`

> 目前仅 **阿里云（TableStore）** 支持 `tables`。

### 状态后端（Backend）

```yaml
backend:
  state_manager:
    type: BUCKET_STORE
    bucket: my-state-bucket
    key: si-state/
```

- `state_manager.type`：`LOCAL` 或 `BUCKET_STORE`
- 若省略 `backend`，ServerlessInsight 默认使用其托管的 SAAS 状态后端（需通过 `si login` 或 `SI_API_KEY` 鉴权）

## 供应商与多环境（Stages）

`provider` 决定目标云，而 `stages` 让你在同一份配置上管理多套环境：

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

引用方式：

- `${vars.memory}` 引用全局变量
- `${stage.region}`、`${stage.memory}` 引用当前 stage 的值
- 部署时通过 `-s/--stage <stage>` 选择环境，缺省为 `default`

## 本地开发

`si local` 可在本地启动所定义的函数进行调试（目前仅支持 **阿里云** 函数）：

```bash
si local --stage dev
```

- 默认在 `4567` 端口提供本地 HTTP 服务
- `--watch` 默认开启，代码变更自动重载
- `--debug` 开启调试模式

## 下一步

- 想快速跑通第一个应用？前往 [快速开始](/getting-started)
- 查看 [供应商总览](/providers/) 了解各云的能力差异
- 命令行用法见 [CLI 参考](/cli)
