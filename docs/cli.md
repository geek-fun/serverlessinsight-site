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
| `si diff` | 预览部署变更（不执行、不写状态） |
| `si deploy` | 部署配置到云供应商 |
| `si destroy` | 销毁已部署的资源栈 |
| `si local` | 本地运行应用进行调试（阿里云 / 腾讯云 / 火山引擎） |
| `si migrate` | 将旧版本地 / 桶状态一次性迁移到控制台托管 |
| `si schema` | 导出 IaC 配置的 JSON Schema（draft-07） |
| `si force-unlock <lockId>` | 手动解除卡住的部署锁 |

> 没有 `init` 命令。项目与 `serverlessinsight.yml` 由你自行创建，可参考 [快速开始](/getting-started)。
>
> **`si plan` 已在 v0.9.4 移除**，统一使用 `si diff`（参数、退出码与 JSON 输出格式完全一致）。执行 `si plan` 会直接报错并提示迁移。

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
si show -s dev --json | jq '.resourceCount'
```

从部署状态中读取并展示资源。加 `--json` 时向 stdout 输出带版本的 JSON 信封（`showVersion: 1`，含 `provider`、`app`、`service`、`stage`、`stateLocation`、`backend`、`locked`、`resources`、`resourceCount` 等字段），日志走 stderr。

### si validate

```bash
si validate -f serverlessinsight.yml -s dev
si validate -s dev --json | jq '.valid'
```

校验配置语法与语义（含供应商相关的运行时、资源校验）。校验失败时进程退出码为 **1**，通过则为 **0**。`--json` 输出 `{ validateVersion: 1, valid, errors: [...] }` 信封，错误项含 `path`、`keyword`、`message` 与可选的 `allowedValues`。

### si diff

```bash
si diff -f serverlessinsight.yml --stage dev
si diff --stage dev --json
si diff --stage dev --region cn-beijing -p memory=1024
si diff --stage dev --no-refresh
```

预览部署变更，支持阿里云、腾讯云与火山引擎。`diff` 读取配置的状态后端与线上云资源做逐字段对比（含漂移检测），但**不执行任何资源变更、也不保存状态**。火山引擎的计划包含函数、TOS 桶与 API 网关资源，并按依赖顺序排列。

| 参数 | 说明 |
| --- | --- |
| `-p, --parameter <key=value>` | 覆盖配置变量（可重复） |
| `--no-refresh` | 跳过对已纳管资源的线上漂移检查（仅对比配置与状态）；新资源的归属探测仍会执行 |
| `--json` | 向 stdout 输出带版本的 JSON 信封，日志走 stderr |
| `--no-color` | 关闭人类可读输出中的 ANSI 颜色 |

stage、region、provider 与凭证覆盖使用[通用参数](#通用参数)。执行前需配置好云凭证与受支持的状态后端；已迁移的历史状态会告警但保持不变，状态或云端读取失败仍按错误处理。

`--json` 信封为 `planVersion: 1`：`{ provider, app, service, stage, changes: [{ logicalId, type, action, attributes, drifted?, driftReasons? }], summary: { create, update, destroy, recreate, unchanged } }`，其中 `action` 取值 `create` / `update` / `destroy` / `recreate`。

**退出码**遵循 Terraform 惯例：**0** 无变更、**2** 有变更、**1** 出错。`--json` 模式下失败输出 `{ error: { code, message } }`，`code` 为与语言无关的稳定错误码（各命令一致）。

### si deploy

```bash
si deploy -s dev
si deploy -s dev -y
si deploy -s dev -p memory=1024
si deploy -s dev --si-api-key $SI_API_KEY
si deploy -s dev --no-refresh
```

| 参数 | 说明 |
| --- | --- |
| `--si-api-key <key>` | ServerlessInsight API Key（覆盖 `SI_API_KEY`） |
| `-y, --auto-approve` | 跳过交互式确认直接部署 |
| `-p, --parameter <key=value>` | 覆盖参数（可重复） |
| `--no-refresh` | 跳过部署前的线上漂移检查 |

非交互环境（无 TTY）下必须加 `-y`，否则会报错。`si deploy` 先展示计划再执行确认，执行内容与 `si diff` 的预览一致；已成功的资源在部分失败后保留，修复问题后重试即可续跑。

### si migrate

```bash
si migrate -f serverlessinsight.yml -s dev            # 交互确认后迁移
si migrate -s dev --dry-run                           # 只展示迁移映射与影响，不写入
si migrate -s dev --rollback                          # 清除迁移标记（显式撤销）
```

把旧版本地 / 对象存储状态**一次性**迁移到 ServerlessInsight 控制台托管（SAAS 后端）。流程为：预检 → 锁定源状态 → 拉取校验 → 计划 → 确认 → 上传 → 回读校验 → 写迁移标记。上传按内容哈希去重，每一步都可安全重跑；迁移标记写入后旧后端不再接受变更。

| 参数 | 说明 |
| --- | --- |
| `--si-api-key <key>` | 控制台 API Key（覆盖 `SI_API_KEY`） |
| `-y, --auto-approve` | 跳过交互确认 |
| `--force` | 目标 stage 已有控制台状态时也强制导入为新版本 |
| `--no-marker` | 迁移后不写迁移标记 |
| `--dry-run` | 只展示迁移映射与影响，不写入任何内容 |
| `--rollback` | 清除源状态上的迁移标记（显式撤销迁移） |

### si destroy

```bash
si destroy -s dev
```

销毁指定环境的资源栈。

### si local

```bash
si local -s dev
si local -s dev --debug
si local --no-watch
```

| 参数 | 说明 |
| --- | --- |
| `-d, --debug` | 开启调试模式 |
| `-w, --watch` | 文件监视模式，默认开启；`--no-watch` 关闭 |

在本地 `4567` 端口提供 HTTP 服务（可用环境变量 `SI_LOCALSTACK_SERVER_PORT` 换端口），**无需任何云凭证**。三个可部署平台都提供供应商原生的本地模拟：

- **阿里云 FC**：FC Buffer 事件、上下文与响应转换；定时器事件模拟
- **腾讯云 SCF**：SCF 原生调用上下文，HTTP 入口按 si 部署的函数 URL 触发器契约（网关兼容事件）模拟
- **火山引擎 veFaaS**：veFaaS 原生 HTTP 事件与响应转换；定时器以 CloudEvents 信封触发

本地路由规则（火山引擎与通用形态）：

- `/si_events/<event键>/<配置的路径>` — 按网关事件路由到 backend 函数
- `/si_functions/<函数键>/<路径>` — 直接调用函数的 HTTP 适配器，无需已部署的触发器

`functions.*.triggers.timer` 会在本地按 si-cron（UTC 墙钟，`@every` 自服务启动起算）真实触发，事件形状与云上一致。运行时可用的本地模拟子集与完整示例（腾讯 SCF、火山 veFaaS）见框架仓库的 Local development 文档。

### si schema

```bash
si schema                      # 输出到 stdout
si schema -o schema.json       # 写入文件
```

导出 IaC 配置校验所用的 JSON Schema（**draft-07**、自包含），可用于编辑器补全或 CI 中对配置做独立校验。

### si force-unlock

```bash
si force-unlock <lockId> -f serverlessinsight.yml
```

手动解除卡住的部署锁。对 SAAS 状态后端会拒绝执行。**请谨慎使用。**

## 环境变量

- 云供应商凭证：见[配置手册](/reference)的"地域与凭证"部分
- `SI_API_KEY`：控制台 API Key（托管状态后端）
- `SI_REGION` / `ALIYUN_REGION`：默认地域
- `SI_LOCALSTACK_SERVER_PORT`：`si local` 的监听端口（默认 `4567`）
- `NO_COLOR`：设为任意值时禁用输出着色（亦可用 `--no-color`）
- `SI_LANG`：覆盖 CLI 界面语言（默认随 `LC_ALL` / `LANG`，支持 `en` / `zh-CN`）
- `DEBUG`：开启后打印错误堆栈

CLI 输出约定：**日志一律走 stderr，结果数据走 stdout**——`si diff --json | jq '.summary'` 这类管道拿到的永远是一个可解析的 JSON 文档。所有 JSON 信封都带版本字段，错误码在各语言环境下保持一致。

## 相关文档

- [快速开始](/getting-started) — 安装与配置模型入门
- [配置手册](/reference) — 全部资源、字段与可选值
