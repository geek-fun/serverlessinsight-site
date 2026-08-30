---
title: 快速开始
description: 安装 ServerlessInsight CLI，理解配置模型，并部署你的第一个 Serverless 应用
platforms: true
---

# 快速开始

本指南带你完成一次完整的 ServerlessInsight 旅程：安装 CLI、理解 `serverlessinsight.yml` 的配置模型、部署第一个应用、再到本地调试。读完它，你不仅知道"怎么做"，也知道"为什么这么配"。字段级的完整取值请查阅[配置手册](/reference)。

## 1. 安装 CLI

前置条件：Node.js >= 18，npm >= 8。

```bash
npm install -g @geek-fun/serverlessinsight
si --version
```

`si` 是唯一的交互入口：校验、部署、销毁、本地调试都通过它完成。

## 2. 创建项目

```bash
mkdir hello-world && cd hello-world
```

推荐的项目结构：

```
hello-world/
├── artifacts/              # 打包后的函数代码（zip 产物）
├── src/                    # 源代码
└── serverlessinsight.yml   # 资源配置文件（唯一必需）
```

`serverlessinsight.yml` 是 ServerlessInsight 的全部——它以声明式的方式描述"你要哪些云资源"，`si deploy` 负责把这份声明落到云上。传统方式里你需要手工在控制台建函数、配网关、开数据库；在这里，它们都是文件里的一段 YAML。

## 3. 理解配置模型

在写第一份配置前，先花一分钟理解它的骨架。一个 `serverlessinsight.yml` 由两部分组成：

- **全局骨架**：`version`（配置格式版本）、`provider`（部署到哪朵云的哪个地域）、`app` / `service`（项目与服务标识，参与所有资源命名）、`vars` / `stages`（变量与多环境）；
- **资源声明**：`functions`（函数）、`events`（API 网关入口）、`databases` / `tables` / `buckets`（数据与存储层）。

写出最小可部署配置（以阿里云为例）：

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

逐段看这份配置在说什么：

- `provider` 决定所有资源的落点。当前可部署的供应商为 `aliyun`、`tencent`、`volcengine`（`huawei` 与 `aws` 暂不可部署）。平台间的能力矩阵、地域与凭证差异见[配置手册](/reference)。
- `app` 与 `service` 必须是静态字符串（小写字母、数字、`-`），因为它们要在解析变量之前就确定，并作为前缀出现在每个云资源的名字里。
- `functions` 的键名 `hello_world_fn` 是**引用名**，后续 `events` 里的 `backend` 就用它指向这个函数；内部的 `name` 才是云上的实际函数名。函数支持两种形态：`code`（代码包）或 `container`（容器镜像），二选一。
- `code` 三要素缺一不可：`runtime` 是云上的执行环境（按供应商校验，如阿里云的 `nodejs18`、火山引擎的 `node20/v1`），`handler` 是 `文件.导出函数` 格式的入口，`path` 指向 `artifacts/` 里的打包产物。
- 没写的字段都有合理默认：`memory` 默认 128 MB，`timeout` 默认 3 秒——起步足够，之后按需调整。

### 给函数接一个 HTTP 入口

上面的函数还没有任何触发方式。最快的路径是声明一个 API 网关，把 `GET /api/*` 的请求转发给它：

```yaml
events:
  gateway_event:
    name: hello-world-gateway
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: hello_world_fn   # 函数的引用名，不是 name
```

`triggers` 数组里每条规则就是一个路由：`method` 支持 `GET` / `POST` / `PUT` / `DELETE` / `ANY`，`path` 以 `/` 开头、支持 `*` 通配，`backend` 填函数的引用名。多条规则可以指向不同函数，这就是"一组接口"的标准形态。

> ⚠️ **腾讯云不支持 `events`**。腾讯云函数通过函数自身的 `triggers.http` 暴露 HTTP 入口。

### 函数之外：数据与存储

真实应用往往还需要数据层。在同一个文件里声明它们，部署时由 CLI 一并创建并打通网络：

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

`cu.min/max` 是 Serverless 数据库的精髓——空闲时缩到 0 CU 不计费，高峰自动扩容。各资源类型的完整字段与枚举值见[配置手册](/reference)。

### 变量与多环境

到目前为止配置里都是"写死的值"。把它们抽成变量，同一份文件就能在多个环境间复用：

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
    memory: ${stages.memory}        # 取当前 stage 的 memory
    environment:
      STAGE: ${ctx.stage}           # 内置上下文：当前 stage 名
```

三种引用各有分工：`${vars.*}` 是团队自定义变量（可用 `-p` 在部署时覆盖，适合放密钥）；`${stages.*}` 取当前环境的覆盖值；`${ctx.stage}` 是 CLI 注入的运行时上下文。敏感值永远不要写进文件——部署时用 `si deploy -p db_password=xxx` 注入。

## 4. 配置云凭证

凭证不写在配置里，通过环境变量注入。在页面顶部选择你的平台，查看对应的变量（默认展示阿里云）：

::: platform aliyun
```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_REGION="cn-hangzhou"
```

完整变量别名与 STS 临时凭证见[配置手册](/reference)。
:::

::: platform tencent
```bash
export TENCENTCLOUD_SECRET_ID="your-secret-id"
export TENCENTCLOUD_SECRET_KEY="your-secret-key"
```

完整变量别名与 STS 临时凭证见[配置手册](/reference)。
:::

::: platform volcengine
```bash
export VOLCENGINE_ACCESS_KEY_ID="your-access-key-id"
export VOLCENGINE_ACCESS_KEY_SECRET="your-access-key-secret"
```

完整变量别名与临时凭证 Token 见[配置手册](/reference)。
:::

> ⚠️ 使用 RAM 子用户的 AccessKey，不要用主账号；密钥切勿提交到仓库。

## 5. 部署

```bash
# 校验配置：运行时、枚举、必填字段都会在此检查
si validate

# 打包代码到 artifacts/（或使用你自己的构建脚本）

# 部署
si deploy --stage dev
```

`si deploy` 依据状态文件计算"这次要改什么"：新建缺失的资源、更新变化的资源、回收删掉的资源。首次部署会全量创建，之后都是增量。

## 6. 本地调试

改一行代码就要部署一次，太慢。`si local` 把函数拉到本地进程运行，用真实的 handler 代码响应请求（目前支持阿里云函数）：

```bash
si local --stage dev
```

本地服务监听 `4567` 端口，按 `events` 的路由规则转发请求；`--watch` 默认开启，保存代码即热重载；`--debug` 可配合 IDE 断点。

## 7. 清理资源

```bash
si destroy --stage dev
```

销毁基于状态文件逐个回收资源。桶非空时销毁会失败——这是防止误删的保护；确认无误后可临时设置 `security.force_delete: true`。

## 下一步

- [配置手册](/reference) — 全部资源、字段与可选值
- [CLI 参考](/cli) — 全部命令与参数
- [实践案例](/case-study) — 真实场景示例