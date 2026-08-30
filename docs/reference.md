---
outline: [2, 4]
---

# 配置手册

ServerlessInsight 的全部能力都通过一份 `serverlessinsight.yml` 表达。这份配置既是给 `si` CLI 读的部署蓝图，也是团队评审基础设施变更的依据：你声明"要什么"，CLI 负责把它落到目标云上，并在后续部署中对比差异、只改动变化的部分。

本文按配置文件的层级自上而下展开：先讲全局骨架（版本、供应商、变量、环境），再逐个讲五类云资源（functions、events、databases、tables、buckets）。每个资源都回答三个问题：它是什么、什么时候用、每个字段怎么填。所有枚举值均对照 `serverlessinsight` v0.7.9 源码 schema 校验。

> 字段级的取值速查推荐用浏览器侧边栏的本页大纲导航；`si validate` 会在部署前校验下述所有约束。

## 快速示例

下面这份配置覆盖了大多数真实场景会用到的能力：一个 HTTP 接口函数、一个 API 网关入口、一个按量付费的 MySQL。先看整体形状，后文逐段拆解：

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

这份文件里每一段的分工：`provider` 决定部署到哪朵云的哪个地域；`vars` 和 `stages` 负责把"随环境变化的值"从资源定义里抽出去；`functions` + `events` 组合成"函数 + HTTP 入口"的经典服务端形态；`databases` 声明函数依赖的数据层。`app` 与 `service` 贯穿所有云资源命名，是整个栈的身份证。

## 核心配置

### version

配置格式的版本号。它不是你应用的版本，而是这份 YAML 遵循的 schema 版本——CLI 用它判断如何解析文件，主版本之间的字段可能不兼容。

```yaml
version: 0.1.0
```

**可选值**：`0.0.0`、`0.0.1`、`0.1.0`。新项目直接写 `0.1.0`。

### provider

声明目标云与地域。整个文件里所有资源都会创建在这个 `region` 里，跨地域部署意味着维护多份配置。

```yaml
provider:
  name: aliyun
  region: cn-hangzhou
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | `aliyun` / `tencent` / `volcengine` / `huawei` / `aws` |
| `region` | string | ✅ | 部署地域 |

当前可实际部署的供应商是 **aliyun**、**tencent**、**volcengine**；`huawei` 与 `aws` 仅存在于枚举中，暂不可部署（华为云目前仅能生成 Terraform 模板，`deploy` 会报错）。

**各平台能力矩阵**——同一份配置在不同平台落地为不同云服务，写配置前先确认目标平台支持哪些资源：

| 资源类型 | 阿里云 | 腾讯云 | 火山引擎 |
| --- | --- | --- | --- |
| 函数计算 | FC3 | SCF | VeFaaS |
| 对象存储 | OSS | COS | TOS |
| API 网关 / 事件 | API Gateway | 无独立网关（函数 URL） | API Gateway |
| 数据库 | RDS Serverless、ES Serverless | TDSQL-C Serverless、ES Serverless | — |
| 表格存储 | TableStore | — | — |
| CDN | 支持（OSS + APIGW） | 不支持 | 不支持 |
| 自定义域名 | 支持 | 支持（DNSPod） | 仅 APIGW 域名 |

**命令支持差异**：

| 命令 | 阿里云 | 腾讯云 | 火山引擎 |
| --- | --- | --- | --- |
| `validate` | ✅ | ✅ | ✅ |
| `plan` | ✅ | ✅ | ❌ |
| `deploy` / `destroy` | ✅ | ✅ | ✅ |
| `local` | ✅（本地模拟） | ❌ | ❌ |
| `show` | ✅ | ✅ | ✅ |

**地域与凭证**（按页面顶部的平台选择器切换）：

::: platform aliyun
地域**强制校验**，仅接受：`cn-qingdao` `cn-beijing` `cn-zhangjiakou` `cn-huhehaote` `cn-wulanchabu` `cn-hangzhou` `cn-shanghai` `cn-shenzhen` `cn-heyuan` `cn-guangzhou` `cn-chengdu` `cn-hongkong` `ap-southeast-1/3/5/6/7` `ap-northeast-1/2` `eu-central-1` `eu-west-1` `us-east-1` `us-west-1` `na-south-1` `me-east-1` `me-central-1`。默认 `cn-hangzhou`，优先级 `SI_REGION` > `ALIYUN_REGION` > `provider.region`。

凭证环境变量（两组别名等价）：

| 变量 | 说明 |
| --- | --- |
| `ALIYUN_ACCESS_KEY_ID` 或 `ALIBABA_CLOUD_ACCESS_KEY_ID` | AccessKey ID |
| `ALIYUN_ACCESS_KEY_SECRET` 或 `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | AccessKey Secret |
| `ALIYUN_SECURITY_TOKEN` 或 `ALIBABA_CLOUD_SECURITY_TOKEN` | STS 临时凭证 Token（可选） |
:::

::: platform tencent
地域为自由文本（如 `ap-guangzhou`、`ap-shanghai`、`ap-beijing`），不做枚举校验。

| 变量 | 说明 |
| --- | --- |
| `TENCENTCLOUD_SECRET_ID` | SecretId |
| `TENCENTCLOUD_SECRET_KEY` | SecretKey |
| `TENCENTCLOUD_SECURITY_TOKEN` | 临时凭证 Token（可选） |
:::

::: platform volcengine
地域建议使用 `cn-beijing`、`cn-shanghai`、`cn-guangzhou`、`ap-southeast-1`，默认 `cn-beijing`（不强制校验）。

凭证环境变量（多组别名等价）：

| 变量 | 说明 |
| --- | --- |
| `VOLCENGINE_ACCESS_KEY_ID` 或 `VOLCENGINE_ACCESS_KEY` 或 `VOLCSTACK_ACCESS_KEY_ID` | AccessKey ID |
| `VOLCENGINE_ACCESS_KEY_SECRET` 或 `VOLCENGINE_SECRET_KEY` 或 `VOLCSTACK_SECRET_ACCESS_KEY` | AccessKey Secret |
| `VOLCENGINE_SESSION_TOKEN` 或 `VOLCSTACK_SESSION_TOKEN` | 临时凭证 Token（可选） |
:::

命令行参数 `-k/--accessKeyId`、`-x/--accessKeySecret`、`-n/--securityToken` 在所有平台都可覆盖环境变量。

### vars

全局变量区。把密码、域名、地域这类"会变的值"抽出来集中管理，避免硬编码散落在资源定义里。引用语法为 `${vars.变量名}`。

```yaml
vars:
  db_host: db.example.com
  memory_size: 512
```

部署时可用 `-p` 覆盖默认值，常用于把敏感值从文件里剥离：

```bash
si deploy --stage prod -p db_password=xxxx
```

### stages

多环境配置。每个 stage 是一组"环境覆盖值"，同一份资源定义在不同环境下拿到不同的内存、域名或地域。选择环境用 `--stage` / `-s`，不指定时使用 `default`。

```yaml
stages:
  dev:
    memory: 256
  prod:
    memory: 1024
```

引用当前 stage 的值用 `${stages.字段名}`：

```yaml
functions:
  api_function:
    memory: ${stages.memory}
```

`${ctx.stage}` 是内置上下文变量，取值为当前部署的 stage 名，适合拼在资源名里做环境隔离（如 `user-api-${ctx.stage}`）。

### app

应用名，标识整个项目的顶层命名空间。必须是静态字符串——它参与所有云资源的命名，CLI 需要在解析变量之前就确定它。

```yaml
app: my-app
```

命名规则：小写字母开头，仅含小写字母、数字与 `-`。

### service

服务名。与 `app` 的区别在于定位：`app` 标识"哪个项目"，`service` 标识"项目里这个可独立部署的单元"。`service` 会作为资源 ID 与资源名的前缀，因此建议简短。同样必须是静态字符串。

```yaml
service: my-app-api
```

> `service` 与命令行的 `<stackName>` 是两回事：`service` 写在配置里负责命名，`stackName` 在部署时指定负责定位状态文件。

### tags

资源标签。CLI 会把这里的键值附加到所有创建的云资源上，用于成本分摊与资源检索。

```yaml
tags:
  owner: geek-fun
  environment: ${ctx.stage}
```

### backend

状态后端。`si deploy` 依赖一份状态文件记录"上次部署了什么"来实现增量更新与删除回收。默认使用 ServerlessInsight 托管的 SAAS 状态后端（需 `si login` 或 `SI_API_KEY` 鉴权）；团队自管时可切换到对象存储：

```yaml
backend:
  state_manager:
    type: BUCKET_STORE
    bucket: my-state-bucket
    key: si-state/
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `state_manager.type` | string | ❌ | `LOCAL`（本地文件）或 `BUCKET_STORE`（对象存储）；省略时用托管 SAAS |
| `state_manager.bucket` | string | ⚠️ | `BUCKET_STORE` 时必填 |
| `state_manager.key` | string | ❌ | 状态文件路径 |

## 资源类型

### functions

函数是 ServerlessInsight 的核心资源。配置里的键名（如 `hello_world_fn`）是**引用名**——`events.triggers.backend` 等字段用它来指向函数；键内部的 `name` 才是云上的实际函数名，必填。

函数有两种部署形态，二选一：**代码包**（`code`）或**容器镜像**（`container`）。绝大多数业务用 `code`；依赖自定义运行时、原生库或需要长启动进程的场景用 `container`。

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

**顶层字段一览**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 云上函数名 |
| `code` | object | ⚠️ | 代码包部署（与 `container` 二选一） |
| `container` | object | ⚠️ | 容器镜像部署（与 `code` 二选一） |
| `memory` | number | ❌ | 内存（MB），默认 128 |
| `timeout` | number | ❌ | 超时（秒），默认 3 |
| `gpu` | string | ❌ | GPU 规格，见下表 |
| `log` | boolean | ❌ | 是否启用日志 |
| `environment` | object | ❌ | 环境变量，值为字符串 / 数字 / 布尔 |
| `network` | object | ❌ | VPC 网络配置 |
| `iam` | object | ❌ | 执行角色与授权 |
| `triggers` | object | ❌ | 函数级触发器（HTTP） |
| `domain` | object | ❌ | 函数级自定义域名 |
| `storage` | object | ❌ | 磁盘与 NAS 挂载 |

> `code` 与 `container` 二选一；两者都提供时以 `container` 为准的行为由供应商决定，不要依赖。

#### code - 代码部署

```yaml
code:
  runtime: nodejs18
  handler: index.handler
  path: artifacts/hello-world-api.zip
```

`runtime` 决定函数在云上的执行环境，`handler` 是"文件.导出函数"格式的入口，`path` 指向打包产物（相对项目根目录，通常放 `artifacts/`）。

**运行时可选值**（按平台切换；`validate` / `plan` 阶段会按 `provider` 精确校验）：

::: platform aliyun
**阿里云 FC**：`nodejs20` `nodejs18` `nodejs16` `nodejs14` `nodejs12` `nodejs10`，`python3.12` `python3.10` `python3.9` `python3.6`，`java11` `java8`，`php7.2`，`go1`，`dotnet_core3.1`
:::

::: platform tencent
**腾讯云 SCF**：`nodejs18` `nodejs16` `nodejs14` `nodejs12` `nodejs10`，`python3.10` `python3.9` `python3.7` `python3.6`，`java8`，`php8.0` `php7.4` `php7.2` `php5.6`，`go1`
:::

::: platform volcengine
**火山引擎 veFaaS**：`golang/v1` `native/v1` `nativejava8/v1` `node14/v1` `node20/v1` `nodeprime14/v1` `python3.12/v1` `python3.9/v1` `native-python3.12/v1` `native-node20/v1`
:::

> 配置里统一写标准标识（如 `nodejs18`），CLI 生成部署物时自动映射为各云原生运行时（如腾讯云的 `Nodejs18.15`）；火山引擎例外，直接使用其原生标识。切换平台后请按上方列表核对 `runtime`。

#### container - 容器部署

```yaml
container:
  image: registry.cn-hangzhou.aliyuncs.com/my-repo/my-image:latest
  port: 9000
  cmd: ["node", "server.js"]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image` | string | ✅ | 容器镜像地址（需提前推送到供应商可拉取的仓库） |
| `port` | number | ✅ | 容器内 HTTP 服务监听端口 |
| `cmd` | string[] | ❌ | 覆盖镜像默认启动命令 |

容器模式下没有 `handler` 的概念——云平台把请求转发给容器内监听 `port` 的 HTTP 服务。

#### gpu

GPU 规格枚举（阿里云）：

`TESLA_8` `TESLA_12` `TESLA_16` `AMPERE_8` `AMPERE_12` `AMPERE_16` `AMPERE_24` `ADA_48`

数字为显存 GB 数。GPU 实例通常需要搭配更高的 `memory` 使用。

#### log

布尔值。开启后函数的调用日志接入供应商日志服务（如阿里云 SLS），`si logs` 等观测命令依赖它：

```yaml
log: true
```

#### network

函数接入私有网络后才能访问 VPC 内的数据库、缓存等内网资源。三个子字段在配置 `network` 时**全部必填**：

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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vpc_id` | string | ✅ | VPC ID |
| `subnet_ids` | string[] | ✅ | 交换机（子网）ID 列表 |
| `security_group` | object | ✅ | 安全组，见下 |
| `security_group.name` | string | ✅ | 安全组名 |
| `security_group.ingress` | string[] | ✅ | 入站规则 |
| `security_group.egress` | string[] | ❌ | 出站规则 |

规则格式为 `协议:CIDR:端口`，端口支持 `ALL`、单端口（`443`）或区间（`80/90`），例如 `TCP:10.0.0.0/8:443`。

#### iam

为函数配置执行角色。最简单的形式是直接引用一个已有的 RAM 角色 ARN；需要精细授权时，用对象形式声明策略与语句：

```yaml
# 形式一：引用已有角色
iam:
  role: acs:ram::1234567890:role/my-role

# 形式二：声明角色与授权语句
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

`statements` 每项必填 `effect`（`Allow` / `Deny`）、`action`、`resource`（字符串或数组），`sid` 可选。

#### triggers - 函数级 HTTP 触发

为函数直接挂 HTTP 触发器（不走 API 网关）。腾讯云函数的 HTTP 入口即通过此方式暴露：

```yaml
triggers:
  http:
    auth_type: public
    access:
      - public
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `auth_type` | string | ✅ | `public`（公网匿名访问）或 `iam`（需签名鉴权） |
| `access` | string[] | ❌ | 网络访问类型：`public`（公网）/ `internal`（内网），至少一项 |

> 函数级 HTTP 触发器适合简单场景；需要路径路由、自定义域名、限流等能力时，改用 `events`（API 网关）。

#### domain - 函数级自定义域名

```yaml
domain:
  domain_name: api.example.com
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  protocol: HTTPS
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domain_name` | string | ✅ | 自定义域名（需已备案并解析到供应商） |
| `certificate_id` | string | ❌ | 已上传的 SSL 证书 ID |
| `protocol` | string | ❌ | `HTTP` 或 `HTTPS` |

#### storage - 磁盘与 NAS

```yaml
storage:
  disk: 512
  nas:
    - mount_path: /mnt/nas
      storage_class: STANDARD_CAPACITY
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `disk` | number | ❌ | 临时磁盘容量（MB） |
| `nas` | object[] | ❌ | NAS 挂载列表 |
| `nas[].mount_path` | string | ✅ | 容器内挂载路径 |
| `nas[].storage_class` | string | ✅ | `STANDARD_CAPACITY` / `STANDARD_PERFORMANCE` / `EXTREME_STANDARD` / `EXTREME_ADVANCE` |

### events

事件资源当前只支持一种形态：**API 网关**（`type: API_GATEWAY`）。它解决的是"多个函数、多条路由"的流量入口问题——网关按路径和方法把请求分发给不同函数，还可以统一挂域名和证书。

与 `functions.triggers.http` 的取舍：单个函数、路径固定的简单 HTTP 服务用函数级触发器更省事；一组接口、需要路由与统一域名的服务用 `events`。

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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 网关名称 |
| `type` | string | ✅ | 仅 `API_GATEWAY` |
| `triggers` | object[] | ✅ | 路由规则列表 |
| `log` | boolean | ❌ | 是否启用网关日志 |
| `network` | object | ❌ | 网关所在 VPC |
| `domain` | object | ❌ | 自定义域名与证书 |

::: platform tencent
> ⚠️ **腾讯云不支持 `events`（API 网关资源）**。函数的 HTTP 入口请通过 `functions.triggers.http` 暴露——系统会创建 SCF 函数 URL 触发器，而非独立网关。
:::

::: platform volcengine
自定义域名仅限 API 网关场景（函数级 `domain` 暂不可用）；域名证书能力与阿里云一致。
:::

#### triggers - 路由规则

```yaml
triggers:
  - method: GET
    path: /api/*
    backend: hello_world_fn
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `method` | string | ✅ | `GET` / `POST` / `PUT` / `DELETE` / `ANY` |
| `path` | string | ✅ | 路径，必须以 `/` 开头，支持 `*` 通配 |
| `backend` | string | ✅ | 目标函数的**引用名**（`functions` 下的键名，不是 `name`） |

> 旧版的 `type: HTTP`、`type: Timer`、`type: sqs` 等事件类型已从 schema 中移除，`validate` 会直接报错。定时与消息类触发能力请关注供应商能力矩阵。

#### domain - 网关自定义域名

```yaml
domain:
  domain_name: api.example.com
  protocol: HTTPS
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  www_bind_apex: false
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `domain_name` | string | ✅ | 自定义域名 |
| `protocol` | string / string[] | ❌ | `HTTP`、`HTTPS` 或两者数组，如 `['HTTP', 'HTTPS']` |
| `certificate_id` | string | ⚠️ | 证书 ID（三选一，见下） |
| `certificate_body` + `certificate_private_key` | string | ⚠️ | 证书内容 + 私钥（三选一） |
| `www_bind_apex` | boolean | ❌ | 是否同时绑定 www 子域 |
| `cdn` | object / boolean | ❌ | CDN 加速配置，见下 |

证书三种配置方式**互斥**：要么 `certificate_id` 引用已有证书，要么同时给 `certificate_body` + `certificate_private_key`，不能混用。

**cdn 配置**（也可直接写 `cdn: true` 使用默认值）：

```yaml
cdn:
  enabled: true
  cdn_type: web
  scope: domestic
  cache_ttl: 3600
  origin_protocol: follow
  force_redirect_https: true
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 是否启用 |
| `cdn_type` | string | `web`（页面）/ `download`（下载）/ `video`（音视频） |
| `scope` | string | `domestic`（国内）/ `overseas`（海外）/ `global`（全球） |
| `cache_ttl` | number | 缓存时间（秒） |
| `ignore_query_string` | boolean | 缓存是否忽略查询参数 |
| `origin_protocol` | string | 回源协议：`http` / `https` / `follow` |
| `compression` | boolean | 智能压缩 |
| `force_redirect_https` | boolean | 强制 HTTPS 跳转 |

### databases

数据库资源声明函数依赖的数据层。Serverless 负责建库、配网、设密码，函数侧只需拿到连接串即可。当前支持阿里云 RDS / Elasticsearch Serverless 与腾讯云 TDSQL-C：

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

`cu.min/max` 是 Serverless 数据库的核心卖点：无流量时缩到 0 CU（不产生计算费用），高峰自动扩到 `max`。**密码务必用 `${vars.*}` 或 `-p` 注入，不要明文提交。**

**类型与版本可选值**：

| 字段 | 可选值 |
|------|--------|
| `type` | `ELASTICSEARCH_SERVERLESS` `RDS_MYSQL_SERVERLESS` `RDS_PGSQL_SERVERLESS` `RDS_MSSQL_SERVERLESS` `TDSQL_C_SERVERLESS` |
| `version` | `MYSQL_5.7` `MYSQL_8.0` `MYSQL_HA_5.7` `MYSQL_HA_8.0`，`PGSQL_14` `PGSQL_15` `PGSQL_16` `PGSQL_HA_14` `PGSQL_HA_15` `PGSQL_HA_16`，`MSSQL_HA_2016` `MSSQL_HA_2017` `MSSQL_HA_2019`，`ES_SEARCH_7.10` `ES_TIME_SERIES_7.10` |

带 `_HA_` 的是高可用版（主备），生产环境建议选择。

**其余字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `cu` | object | 弹性算力范围：`min` / `max` |
| `storage` | object | 存储容量范围：`min` / `max`（GB，整数） |
| `security.basic_auth.master_user` | string | 管理员用户名 |
| `security.basic_auth.password` | string | 管理员密码（建议变量注入） |
| `network` | object | 访问网络，见下 |

**network 字段**：

```yaml
network:
  type: PRIVATE
  vpc_id: vpc-xxxxx
  subnet_id: vsw-xxxxx
  public: false
  ingress_rules:
    - TCP:10.0.0.0/8:3306
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | `PUBLIC`（公网直连）或 `PRIVATE`（VPC 内访问） |
| `vpc_id` / `subnet_id` | string | 私网访问时的 VPC 与交换机（注意是单个 `subnet_id`） |
| `public` | boolean | 是否额外开通公网访问 |
| `ingress_rules` | string[] | 访问规则，格式同安全组规则 |

::: platform aliyun
支持 RDS Serverless（MySQL / PostgreSQL / SQL Server）与 Elasticsearch Serverless，另有表格存储（`tables`）。
:::

::: platform tencent
支持 TDSQL-C Serverless 与 Elasticsearch Serverless，类型分别选 `TDSQL_C_SERVERLESS` 与 `ELASTICSEARCH_SERVERLESS`。
:::

::: platform volcengine
**暂不支持 `databases` 与 `tables` 资源**——数据库请通过现有云上资源自行管理，配置里省略这两段即可。
:::

### tables

表格存储适合海量半结构化数据的低延迟读写（用户画像、会话、IoT 时序等）。当前仅**阿里云 TableStore** 支持。表格必须归属一个实例（`collection`，字符串，必填）——实例是 TableStore 的计费与网络单元。

```yaml
tables:
  sessions:
    collection: my-instance
    name: session-table
    type: TABLE_STORE_H
    desc: 用户会话表
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

**主键设计是表格存储最重要的决策**：`HASH` 键决定数据分布到哪台机器，选择区分度高的字段（如 user_id）避免热点；`RANGE` 键在同一分区内排序，适合范围查询。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `collection` | string | ✅ | 所属实例名（TableStore Instance） |
| `name` | string | ✅ | 表名 |
| `type` | string | ✅ | `TABLE_STORE_C`（容量型，按量，适合写多读少）/ `TABLE_STORE_H`（高性能型，预留算力，低延迟） |
| `desc` | string | ❌ | 表描述，最长 256 字符 |
| `key_schema` | object[] | ✅ | 主键列表，见下 |
| `attributes` | object[] | ✅ | 属性列，见下 |
| `throughput` | object | ❌ | 预留/按需读写 CU |
| `network` | object | ❌ | 访问网络 |

**key_schema / attributes**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 键名 / 属性名 |
| `type` | string | 主键类型：`HASH`（分区键）或 `RANGE`（排序键）；属性类型：`STRING` `INTEGER` `DOUBLE` `BOOLEAN` `BINARY` |

> `key_schema` 中出现的键，必须在 `attributes` 里声明类型——schema 校验会拒绝"有键无型"的配置。

**throughput**（容量型表通常不需要预留）：

| 字段 | 说明 |
|------|------|
| `reserved.read` / `reserved.write` | 预留读 / 写 CU |
| `on_demand.read` / `on_demand.write` | 按需读 / 写上限 CU |

**network**：`type`（`PUBLIC` / `PRIVATE`，必填）、`vpc_id`、`ingress_rules[]`。

### buckets

对象存储桶承载三类典型用途：静态资源与前端产物托管、函数代码包与产物的存放、日志与备份归档。桶名全云唯一，建议带项目前缀：

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

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 桶名（全局唯一，a-zA-Z0-9-_） |
| `storage` | object | ❌ | `class` 必填：存储类型（透传供应商，如 `STANDARD` / `IA` / `ARCHIVE`） |
| `versioning` | object | ❌ | `status` 必填：版本控制（透传供应商，阿里云为 `Enabled` / `Suspended`） |
| `security` | object | ❌ | ACL 与加密，见下 |
| `domain` | object | ❌ | 自定义域名（推荐用法，见下） |
| `website` | object | ❌ | 静态网站托管，见下 |
| `iam` | object | ❌ | 桶资源策略 |

**security**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `acl` | string | `PRIVATE`（默认）/ `PUBLIC_READ` / `PUBLIC_READ_WRITE` |
| `force_delete` | boolean | 销毁时是否强制删除桶内对象（默认 false，桶非空会销毁失败——这是防止误删的保护） |
| `sse_algorithm` | string | 服务端加密：`AES256` / `KMS` |
| `sse_kms_master_key_id` | string | KMS 密钥 ID（`sse_algorithm: KMS` 时使用） |

**domain - 自定义域名（推荐）**：支持字符串简写或对象。对象形态可配证书与 CDN：

```yaml
domain: cdn.example.com        # 简写

domain:                        # 完整形态
  domain_name: static.example.com
  protocol: HTTPS
  certificate_id: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  www_bind_apex: true
  accelerate: true             # OSS 传输加速
  cdn:
    enabled: true
    cdn_type: web
    scope: domestic
    cache_ttl: 3600
    origin_protocol: follow
    force_redirect_https: true
```

证书配置与 `events.domain` 相同：`certificate_id` 与（`certificate_body` + `certificate_private_key`）互斥。`cdn` 字段结构同[events 的 cdn](#cdn-配置)。

**website - 静态网站托管**：

```yaml
website:
  code: dist/
  index: index.html
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | ✅ | 网站产物目录 / 代码包路径 |
| `index` | string | ❌ | 默认首页（默认 index.html） |
| `domain` | string / object | ❌ | ⚠️ 已废弃：改用顶层 `domain` 字段 |

> 公网可访问需要 `security.acl: PUBLIC_READ`；`website` 只负责托管行为，域名与证书统一走顶层 `domain`。

**iam - 桶资源策略**：跨账号或匿名访问控制，语句结构同函数 `iam.statements`（`effect` / `action` / `resource` 必填）：

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

## 变量引用

配置里所有"随环境变化"的值都应该走变量，而不是复制粘贴多份配置。三种引用各有分工：

```yaml
# ${vars.*} —— 团队自定义变量，可被 -p 覆盖
vars:
  db_password: change-me

# ${stages.*} —— 当前 stage 中定义的值
stages:
  dev:
    memory: 256

# ${ctx.*} —— CLI 运行时上下文
# ctx.stage 即当前部署的 stage 名
```

```yaml
functions:
  api_function:
    memory: ${stages.memory}          # 取 stages.<当前stage>.memory
    environment:
      DB_PASSWORD: ${vars.db_password} # 取 vars.db_password
      STAGE: ${ctx.stage}              # dev / prod / ...
```

> `app` 与 `service` 不支持变量——它们参与状态定位，必须在解析变量前就是确定的字面量。

## 本地开发

`si local` 把定义的函数拉到本地进程里跑，用真实的 handler 代码和本地的 HTTP 服务模拟云上行为，改代码不用反复部署（目前支持阿里云函数）：

```bash
si local --stage dev
```

- 本地服务监听 `4567` 端口，按 `events` 的路由规则转发请求
- `--watch` 默认开启，保存代码即热重载
- `--debug` 开启调试模式，可配合 IDE 断点

## 最佳实践

**环境隔离用 stages，不要复制文件**。dev 与 prod 只差参数时，一份配置 + `${stages.*}` 是最小维护成本；差异大到结构不同时再考虑拆文件。

**敏感值走变量注入**。`vars` 只放非敏感默认值，密码类用 `-p key=value` 在部署命令里传入，或接入 CI 的密钥管理。

**函数命名带环境**。资源名里拼 `${ctx.stage}`（如 `user-api-${ctx.stage}`），多套环境并存时一眼可辨，也避免命名冲突。

**销毁有保护**。桶默认不允许非空删除（`force_delete: false`），这是防线不是麻烦——真正需要强制清理的临时资源才显式打开。

**部署前先 validate**。`si validate` 会按供应商校验运行时、枚举与必填字段，把错误拦在创建云资源之前，比部署失败再回滚便宜得多。

## 常见问题

### Q: 事件触发器为什么只有 API_GATEWAY？

当前 schema 只实现了 API 网关事件。定时任务、消息队列等触发器尚未进入 schema——硬写 `type: Timer` 会在 `validate` 阶段报错，这不是 bug 而是未支持。简单 HTTP 场景可先用 `functions.triggers.http`。

### Q: 为什么 `app` / `service` 不允许用变量？

这两个字段参与状态文件定位与资源命名，CLI 必须在解析变量之前确定它们。其他字段（`name`、`environment` 等）都可以自由引用变量。

### Q: 部署报 "runtime not supported"？

`runtime` 是按供应商校验的：阿里云用 `nodejs18` 这类标识，火山引擎用 `node20/v1` 这类带后缀的标识。对照上方运行时表与供应商页面修正。

### Q: 如何更新已部署的函数？

修改代码重新打包后再次 `si deploy`。CLI 依据状态文件计算差异，只变更实际变化的部分。

### Q: 如何删除全部资源？

```bash
si destroy --stage dev
```

销毁基于状态文件逐个回收资源。桶非空时销毁会失败，确认无误后可临时设置 `security.force_delete: true`。