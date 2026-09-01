---
title: CLI 参考
description: ServerlessInsight CLI 全部命令与参数说明
---

# CLI 参考

ServerlessInsight 的命令行工具名为 `si`。安装方式：

```bash
npm install -g @geek-fun/serverlessinsight
si --version
```

## 命令总览

| 命令 | 说明 |
| --- | --- |
| `si login` | 登录 ServerlessInsight 控制台（获取 API Key） |
| `si logout` | 注销并清除本地凭证 |
| `si whoami` | 显示当前登录状态 |
| `si show` | 从状态中展示已部署资源 |
| `si validate` | 校验 `serverlessinsight.yml` 配置 |
| `si plan` | 生成并展示部署计划（仅阿里云、腾讯云） |
| `si deploy` | 部署配置到云供应商 |
| `si destroy` | 销毁已部署的资源栈 |
| `si local` | 本地运行应用进行调试（仅阿里云） |
| `si force-unlock <lockId>` | 手动解除卡住的部署锁 |

> 没有 `init` 命令。项目与 `serverlessinsight.yml` 由你自行创建，可参考 [快速开始](/getting-started)。

## 通用参数

以下参数在多个命令中可用（具体见各命令）：

| 参数 | 说明 |
| --- | --- |
| `-f, --file <path>` | 指定 YAML 配置文件路径 |
| `-s, --stage <stage>` | 指定部署环境（stage）；`local` 默认 `default` |
| `-r, --region <region>` | 指定地域，覆盖配置与环境变量 |
| `-v, --provider <provider>` | 指定云供应商，覆盖配置 |
| `-k, --accessKeyId <id>` | 指定 AccessKeyId，覆盖环境变量 |
| `-x, --accessKeySecret <secret>` | 指定 AccessKeySecret，覆盖环境变量 |
| `-n, --securityToken <token>` | 指定临时凭证 Token，覆盖环境变量 |

命令行参数优先级高于环境变量与 YAML 配置。地域解析顺序：`SI_REGION` > `ALIYUN_REGION` > `provider.region`（默认 `cn-hangzhou`）。

## 各命令详解

### si login

```bash
si login [--si-api-key <key>]
```

与 ServerlessInsight 控制台鉴权，用于托管 SAAS 状态后端。可使用已有 API Key 直接登录。环境变量 `SI_API_KEY` 亦可被 `deploy` 的 `--si-api-key` 覆盖。

### si logout

```bash
si logout
```

清除本地保存的凭证。

### si whoami

```bash
si whoami
```

显示当前登录状态。

### si show

```bash
si show -f serverlessinsight.yml -s dev
```

从部署状态中读取并展示资源。

### si validate

```bash
si validate -f serverlessinsight.yml -s dev
```

校验配置语法与语义（含供应商相关的运行时、资源校验）。

### si plan

```bash
si plan -s dev
```

生成部署计划。**注意：仅阿里云与腾讯云支持 `plan`；火山引擎会报错。**

### si deploy

```bash
si deploy -s dev
si deploy -s dev -y
si deploy -s dev -p memory=1024
si deploy -s dev --si-api-key $SI_API_KEY
```

| 参数 | 说明 |
| --- | --- |
| `--si-api-key <key>` | ServerlessInsight API Key（覆盖 `SI_API_KEY`） |
| `-y, --auto-approve` | 跳过交互式确认直接部署 |
| `-p, --parameter <key=value>` | 覆盖参数（可重复） |

非交互环境（无 TTY）下必须加 `-y`，否则会报错。

### si destroy

```bash
si destroy -s dev
```

销毁指定环境的资源栈。

### si local

```bash
si local -s dev
si local -s dev --debug
```

| 参数 | 说明 |
| --- | --- |
| `-d, --debug` | 开启调试模式 |
| `-w, --watch` | 文件监视模式（默认开启，不可关闭） |

在本地 `4567` 端口提供 HTTP 服务，**仅支持阿里云函数**。

### si force-unlock

```bash
si force-unlock <lockId> -f serverlessinsight.yml
```

手动解除卡住的部署锁。对 SAAS 状态后端会拒绝执行。**请谨慎使用。**

## 环境变量

- 云供应商凭证：见[配置手册](/reference)的"地域与凭证"部分
- `SI_API_KEY`：控制台 API Key（托管状态后端）
- `SI_REGION` / `ALIYUN_REGION`：默认地域
- `DEBUG`：开启后打印错误堆栈

## 相关文档

- [快速开始](/getting-started) — 安装与配置模型入门
- [配置手册](/reference) — 全部资源、字段与可选值
