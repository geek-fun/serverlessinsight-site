# 命令行工具

本文档介绍了 ServerlessInsight CLI 支持的所有命令及其使用方法。

## 获取帮助

使用 `-h` 或 `--help` 参数查看命令帮助：

```bash
# 查看所有命令
si -h

# 查看特定命令帮助
si deploy -h
```

## 命令概览

| 命令 | 说明 |
|------|------|
| [`validate`](#validate-校验配置文件) | 校验配置文件合法性 |
| [`plan`](#plan-生成部署计划) | 生成部署计划（预览变更） |
| [`deploy`](#deploy-部署-serverless-应用) | 部署 Serverless 应用 |
| [`destroy`](#destroy-销毁-serverless-应用) | 销毁 Serverless 应用 |
| [`show`](#show-查看部署资源信息) | 查看已部署资源信息 |
| [`local`](#local-本地运行-serverless-应用) | 本地运行 Serverless 应用 |

## validate 校验配置文件

`validate` 命令用于校验 `serverlessinsight.yml` 配置文件是否合法。

### 使用方法

```bash
si validate [选项]
```

### 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--file` | `-f` | 指定配置文件路径 | `serverlessinsight.yml` |

### 示例

```bash
# 使用默认配置文件
si validate

# 指定配置文件
si validate -f path/to/config.yml
```

### 输出示例

**校验成功:**

![validate 校验成功示例](/cli-validate-success.png)

```
✓ Configuration file is valid
✓ All resources are properly defined
✓ No errors found
```

**校验失败:**

```
✗ Configuration file is invalid
Error: functions.hello_world_fn.memory must be an integer
```

## plan 生成部署计划

`plan` 命令用于生成部署计划，预览将要创建、更新或删除的资源，帮助您在实际部署前了解变更内容。

### 使用方法

```bash
si plan [选项]
```

### 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--stage` | `-s` | 指定环境 | `default` |
| `--file` | `-f` | 指定配置文件路径 | `serverlessinsight.yml` |

### 示例

```bash
# 预览开发环境的部署变更
si plan --stage dev

# 指定配置文件
si plan -f config/prod.yml -s prod
```

### 输出示例

```bash
Planning deployment for stage dev...

Resources to create:
  + function: hello-world-fn
  + api_gateway: my-api-gateway

Resources to update:
  ~ function: api-handler (code changed)

Resources to delete:
  - function: old-function

Plan: 2 to create, 1 to update, 1 to delete
```

## deploy 部署 Serverless 应用

`deploy` 命令用于将 Serverless 应用部署到指定的云供应商。

### 使用方法

```bash
si deploy [选项]
```

### 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--stage` | `-s` | 指定部署环境 | `default` |
| `--parameter` | `-p` | 传递变量值并覆盖默认值（格式：`key=value`） | - |
| `--file` | `-f` | 指定配置文件路径 | `serverlessinsight.yml` |
| `--region` | `-r` | 指定部署区域 | 配置文件中的 `provider.region` |
| `--provider` | `-pr` | 指定云供应商 | 配置文件中的 `provider.name` |
| `--accessKeyId` | `-ak` | 指定 AccessKey ID | 环境变量 `ALIYUN_ACCESS_KEY_ID` |
| `--accessKeySecret` | `-as` | 指定 AccessKey Secret | 环境变量 `ALIYUN_ACCESS_KEY_SECRET` |
| `--securityToken` | `-at` | 指定安全令牌 | 环境变量 `ALIYUN_SECURITY_TOKEN` |

### 示例

```bash
# 部署到默认环境
si deploy

# 部署到开发环境
si deploy --stage dev

# 部署到生产环境并覆盖内存配置
si deploy --stage prod -p memory_size=2048

# 指定配置文件和区域
si deploy -f config/prod.yml -r cn-beijing

# 使用临时安全令牌部署
si deploy --stage prod \
  -ak $ACCESS_KEY_ID \
  -as $ACCESS_KEY_SECRET \
  -at $SECURITY_TOKEN
```

### 部署流程

1. **验证配置** - 检查配置文件合法性
2. **创建资源栈** - 在云供应商处创建资源栈
3. **部署资源** - 按依赖顺序创建/更新资源
4. **输出结果** - 显示部署结果和资源访问信息

### 输出示例

```bash
Deploying service hello-world-api to stage dev
Creating API Gateway: insight-poc-gateway...
Creating Function: hello-world-fn...
Deploying function code...
Configuring triggers...

✓ Service hello-world-api deployed successfully

API Endpoint: https://abc123.apigateway.cn-hangzhou.aliyuncs.com/api
Function ARN: fc.cn-hangzhou.aliyuncs.com/001234567890/hello-world-fn
```

## destroy 销毁 Serverless 应用

`destroy` 命令用于销毁 Serverless 应用及其所有相关资源。

### 使用方法

```bash
si destroy [选项]
```

### 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--stage` | `-s` | 指定环境 | `default` |
| `--file` | `-f` | 指定配置文件路径 | `serverlessinsight.yml` |
| `--force` | - | 强制删除，不提示确认 | `false` |

### 示例

```bash
# 销毁开发环境资源
si destroy --stage dev

# 强制销毁（不提示确认）
si destroy --stage dev --force

# 指定配置文件销毁
si destroy -f config/prod.yml
```

### ⚠️ 警告

> **删除资源栈会删除所有声明的资源，导致：**
> - 服务完全不可用
> - 丢失所有有状态资源的数据
> - 删除操作不可恢复
>
> **请确保：**
> - 相关数据已备份
> - 确认不再需要这些资源
> - 已通知相关干系人
>
> 然后再执行此操作。

### 输出示例

```bash
Destroying service hello-world-api to stage dev
Deleting API Gateway triggers...
Deleting Function: hello-world-fn...
Deleting API Gateway: insight-poc-gateway...
Deleting resource stack...

✓ Service hello-world-api destroyed successfully
```

## show 查看部署资源信息

`show` 命令用于查看已部署资源的信息，包括资源 ID、状态、访问地址等。

### 使用方法

```bash
si show [选项]
```

### 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--stage` | `-s` | 指定环境 | `default` |
| `--file` | `-f` | 指定配置文件路径 | `serverlessinsight.yml` |

### 示例

```bash
# 查看开发环境的部署信息
si show --stage dev

# 指定配置文件
si show -f config/prod.yml -s prod
```

### 输出示例

```bash
Showing resources for stage dev...

Functions:
  hello-world-fn
    ARN: acs:fc:cn-hangzhou:123456789:functions/hello-world-fn
    Runtime: nodejs18
    Memory: 512MB
    Timeout: 10s

API Gateway:
  my-api-gateway
    ID: api-abc123
    Endpoint: https://abc123.apigateway.cn-hangzhou.aliyuncs.com
    Triggers: 2 routes configured
```

## local 本地运行 Serverless 应用

`local` 命令用于在本地运行和调试 Serverless 应用，无需部署到云端。

### 使用方法

```bash
si local [选项]
```

### 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--stage` | `-s` | 指定运行环境 | `default` |
| `--debug` | `-d` | 启用调试模式 | `false` |
| `--watch` | `-w` | 启用文件监视模式（代码变更自动重载） | `true` |
| `--port` | `-p` | 指定本地服务端口 | `3000` |
| `--file` | `-f` | 指定配置文件路径 | `serverlessinsight.yml` |

### 示例

```bash
# 基本本地运行
si local --stage dev

# 启用调试模式
si local --stage dev --debug

# 启用文件监视模式
si local --stage dev --watch

# 指定端口
si local --stage dev --port 8080

# 组合使用
si local --stage dev --debug --watch --port 8080
```

### 本地开发特性

**🔄 热重载:**
- 文件监视模式会自动检测代码变更
- 自动重新加载变更的函数
- 无需手动重启服务

**🐛 调试支持:**
- 调试模式会输出详细的日志
- 支持断点调试（配合 IDE）
- 显示函数执行时间和资源消耗

**🌐 本地 API Gateway:**
- 模拟 API Gateway 行为
- 支持路由配置
- 处理请求转发

### 输出示例

```bash
Starting local development environment for stage dev
Loading configuration from serverlessinsight.yml
Starting API Gateway emulator on port 3000...
Loading function: hello-world-fn

✓ Local environment started successfully

Endpoints:
  GET  http://localhost:3000/api/*  → hello-world-fn
  POST http://localhost:3000/api/*  → hello-world-fn

Watching for file changes...
```

### 调试模式输出

```bash
[DEBUG] Loading function code from artifacts/hello-world-api.zip
[DEBUG] Function loaded in 234ms
[DEBUG] Memory allocated: 512MB
[DEBUG] Timeout: 30s

[INFO] Request: GET /api/users
[DEBUG] Event: {"path":"/api/users","method":"GET",...}
[DEBUG] Function executed in 45ms
[DEBUG] Response: {"statusCode":200,"body":"..."}
```

## 环境变量

ServerlessInsight CLI 支持通过环境变量配置：

### 云供应商凭证

**阿里云:**
```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_REGION="cn-hangzhou"
export ALIYUN_SECURITY_TOKEN="your-security-token"  # 可选，临时凭证
```

### CLI 配置

```bash
# 指定默认配置文件
export SI_CONFIG_FILE="path/to/config.yml"

# 指定默认 stage
export SI_STAGE="dev"

# 启用详细日志
export SI_DEBUG="true"
```

## 最佳实践

### 1. 使用 .env 文件管理环境变量

创建 `.env` 文件（添加到 `.gitignore`）:

```bash
ALIYUN_ACCESS_KEY_ID=your-key-id
ALIYUN_ACCESS_KEY_SECRET=your-key-secret
ALIYUN_REGION=cn-hangzhou
```

使用 [direnv](https://direnv.net/) 或类似工具自动加载。

### 2. 为不同环境使用不同的 stage

```bash
# 开发环境
si deploy --stage dev

# 测试环境
si deploy --stage test

# 生产环境
si deploy --stage prod
```

### 3. 部署前验证配置

```bash
# 先验证
si validate

# 再部署
si deploy --stage dev
```

### 4. 使用参数覆盖灵活配置

```bash
# 部署时动态调整配置
si deploy --stage prod \
  -p memory_size=2048 \
  -p timeout=60
```

### 5. 本地开发使用 watch 模式

```bash
# 自动重载，提高开发效率
si local --stage dev --watch
```

## 常见问题

### Q: 部署时提示权限不足？

检查环境变量是否正确配置：

```bash
echo $ALIYUN_ACCESS_KEY_ID
echo $ALIYUN_ACCESS_KEY_SECRET
```

确保 RAM 用户有足够的权限（如 AliyunFCFullAccess, AliyunAPIGatewayFullAccess）。

### Q: 如何查看部署日志？

使用 `--verbose` 或设置 `SI_DEBUG=true`：

```bash
SI_DEBUG=true si deploy --stage dev
```

### Q: 本地运行端口被占用？

指定其他端口：

```bash
si local --stage dev --port 8080
```

### Q: 如何清理本地环境？

停止本地服务使用 `Ctrl+C`，然后清理缓存：

```bash
rm -rf .serverlessinsight
```

### Q: 部署失败如何回滚？

ServerlessInsight 目前不支持自动回滚。建议：
1. 使用 Git 管理配置文件
2. 部署前备份当前状态
3. 失败后使用历史版本重新部署

```bash
# 回滚到上一个版本
git checkout HEAD~1 serverlessinsight.yml
si deploy --stage dev
```

## 命令速查表

```bash
# 验证配置
si validate

# 部署应用
si deploy --stage <env>

# 销毁应用
si destroy --stage <env>

# 本地运行
si local --stage <env> [--debug] [--watch]

# 查看帮助
si -h
si <command> -h
```

## 版本信息

查看 CLI 版本：

```bash
si --version
```

升级 CLI：

```bash
npm update -g @geek-fun/serverlessinsight
```
