# 快速开始

让我们基于 ServerlessInsight 快速从零构建一个简单的全栈 Serverless 应用程序。我们将创建一个简单的 API，在浏览器中显示"Hello World"。本文档以阿里云为例。

## 前提条件

在开始之前，请确保您的开发环境满足以下要求：

- ✅ Node.js >= 18.x
- ✅ npm >= 8.x
- ✅ 阿里云账号（已开通函数计算 FC 和 API 网关服务）

如果尚未安装 Node.js，请访问 [Node.js 官网](https://nodejs.org/en/download/) 下载安装。

## 步骤 1: 安装 ServerlessInsight CLI

使用 npm 全局安装 ServerlessInsight CLI：

```bash
npm install -g @geek-fun/serverlessinsight
```

验证安装是否成功：

```bash
si --version
```

如果安装成功，将会显示版本号，例如：`0.6.8`

## 步骤 2: 配置云供应商密钥

ServerlessInsight 需要访问云供应商的资源。以阿里云为例，您需要配置以下环境变量：

```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_REGION="cn-hangzhou"
```

> 💡 **提示**: 可以将上述命令添加到 `~/.bashrc` 或 `~/.zshrc` 文件中，避免每次终端会话都重新设置。

### 支持的阿里云区域

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

![阿里云 AccessKey 生成示意](/aliyun-access-key.png)

> ⚠️ **安全警告**
> 
> - 请务必妥善保管您的密钥信息，切勿通过任何方式（如 GitHub）将 AccessKey 公开
> - 强烈建议使用 **RAM 子用户**的 AccessKey 进行 API 调用
> - 遵循 [阿里云安全最佳实践](https://help.aliyun.com/document_detail/54577.html)
> - ServerlessInsight 不会保存任何供应商密钥信息

## 步骤 3: 初始化项目

创建项目目录：

```bash
mkdir hello-world-proj && cd hello-world-proj
```

### 推荐的项目结构

ServerlessInsight 不强制要求特定的目录结构，但我们建议按以下方式组织项目（以 TypeScript 项目为例）：

```
hello-world-proj/
├── artifacts/              # 打包后的应用程序代码
│   └── hello-world-api.zip
├── scripts/                # 自动化脚本
│   └── package.sh
├── src/                    # 源代码
│   └── index.ts
├── tests/                  # 测试代码
├── serverlessinsight.yml   # ServerlessInsight 配置文件
├── package.json            # Node.js 项目配置
├── package-lock.json       # 依赖锁定文件
├── tsconfig.json           # TypeScript 配置
└── Dockerfile              # Docker 构建配置
```

## 步骤 4: 配置 serverlessinsight.yml

在项目根目录创建 `serverlessinsight.yml` 文件：

```yaml
version: 0.1.0
provider: aliyun

vars:
  region: cn-hangzhou

stages:
  dev:
    region: ${vars.region}

app: hello-world
service: hello-world-api

tags:
  owner: geek-fun

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

events:
  gateway_event:
    type: API_GATEWAY
    name: insight-poc-gateway
    triggers:
      - method: GET
        path: /api/*
        backend: hello_world_fn
```

### 配置说明

- **version**: 配置文件版本，当前支持 `0.1`
- **provider**: 云供应商配置（aliyun/huawei/tencent）
- **vars**: 可重用的变量，可在配置中通过 `${vars.variableName}` 引用
- **stages**: 不同环境的配置（dev/test/prod），通过 `--stage` 参数指定
- **service**: 服务名称，全局唯一标识符
- **tags**: 资源标签，用于资源管理和成本分摊
- **functions**: 函数计算配置
- **events**: 事件触发器配置

## 步骤 5: 编写应用程序代码

在 `src` 目录下创建 `index.ts` 文件：

```typescript
export async function handler(event: any, context: any) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello World!',
    }),
  };
}
```

创建 `package.json` 文件：

```json
{
  "name": "hello-world-api",
  "version": "1.0.0",
  "description": "Hello World API with ServerlessInsight",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

创建 `tsconfig.json` 文件：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 步骤 6: 配置打包脚本

### 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18.20.3-buster-slim@sha256:95fb3cf1d1ab1834c0fd65cdd2246198662460ae8f982a6cfab187889dd54bbe AS builder
WORKDIR /app

ENV NODE_ENV=development
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY ./tsconfig.json .
COPY ./src ./src
RUN npm run build

# 运行阶段
FROM node:18.20.3-buster-slim@sha256:95fb3cf1d1ab1834c0fd65cdd2246198662460ae8f982a6cfab187889dd54bbe
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/dist .
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install --only=production
```

该 Dockerfile 使用多阶段构建：
- **第一阶段**：安装依赖并编译 TypeScript 代码
- **第二阶段**：仅保留必要的运行时文件，最小化包体积

### 创建打包脚本

在 `scripts` 目录下创建 `package.sh` 文件：

```bash
#!/bin/bash -eux
set -o pipefail

cd "$(dirname "$0")/.." || exit

mkdir -p "artifacts"
rm -rf ./dist ./artifacts/*

IMAGE_NAME="hello-world-api"
docker build -t "${IMAGE_NAME}" .

docker run --rm \
  -v "$(pwd)"/dist:/dist \
  --name "${IMAGE_NAME}-package" "${IMAGE_NAME}:latest" \
  sh -c "cp -r /app/. /dist"

cd dist && zip -r -D "../artifacts/${IMAGE_NAME}.zip" ./*
```

赋予脚本执行权限并运行打包：

```bash
chmod +x scripts/package.sh
./scripts/package.sh
```

打包完成后，您应该在 `artifacts` 目录下看到 `hello-world-api.zip` 文件。

## 步骤 7: 验证配置

在部署之前，建议先验证配置文件是否正确：

```bash
si validate
```

如果配置正确，您将看到类似以下的成功提示：

![validate 校验成功示例](/cli-validate-success.png)

## 步骤 8: 部署服务

使用以下命令将服务部署到阿里云：

```bash
si deploy --stage dev
```

**参数说明：**
- `--stage dev`: 指定部署环境为开发环境（对应配置文件中的 `stages.dev`）

部署成功后，您将看到类似以下输出：

```bash
Deploying service hello-world-api to stage dev
Service hello-world-api deployed successfully
```

## 步骤 9: 调用服务

部署完成后，ServerlessInsight 会输出 API 的访问地址。您可以通过以下方式调用：

```bash
curl https://<your-api-gateway-url>/api/hello
```

或者在浏览器中直接访问该 URL，您将看到：

```json
{
  "message": "Hello World!"
}
```

## 步骤 10: 本地开发调试

ServerlessInsight 支持在本地运行和调试您的应用：

```bash
# 基本本地运行
si local --stage dev

# 启用调试模式
si local --stage dev --debug

# 启用文件监视模式（代码变更自动重载）
si local --stage dev --watch
```

本地开发环境会自动启动所有定义的资源，无需配置任何本地云服务。

## 步骤 11: 清理资源

如果您不再需要该应用，可以使用以下命令清理所有资源：

```bash
si destroy --stage dev
```

> ⚠️ **警告**
> 
> 删除资源栈会删除所有声明的资源，导致服务完全不可用，并丢失所有有状态资源的数据。请确保：
> - 相关数据已备份
> - 确认不再需要这些资源
> 
> 然后再执行此操作。

## 下一步

恭喜！您已经成功使用 ServerlessInsight 构建并部署了第一个 Serverless 应用。

接下来，您可以：

- 📖 阅读 [配置手册](/reference) 了解更多资源配置选项
- 🔧 查看 [命令行工具](/cli) 学习更多 CLI 命令
- 💡 浏览 [实践案例](/case-study) 了解真实应用场景
- 🌐 尝试配置其他云供应商（华为云、腾讯云等）

## 常见问题

### Q: 部署失败怎么办？

检查以下几点：
1. 确认环境变量（AccessKey、Region）已正确设置
2. 确认阿里云账号已开通函数计算 FC 和 API 网关服务
3. 运行 `si validate` 检查配置是否正确
4. 查看错误日志，根据具体错误信息排查

### Q: 如何切换不同的部署环境？

使用 `--stage` 参数指定不同环境：

```bash
# 部署到测试环境
si deploy --stage test

# 部署到生产环境
si deploy --stage prod
```

在配置文件中定义不同环境的变量：

```yaml
stages:
  dev:
    region: cn-hangzhou
  test:
    region: cn-shanghai
  prod:
    region: cn-beijing
```

### Q: 如何更新已部署的应用？

修改代码后重新打包并部署：

```bash
# 重新打包
./scripts/package.sh

# 重新部署（会更新现有资源）
si deploy --stage dev
```

### Q: 支持哪些运行时？

阿里云函数计算支持以下运行时：
- Node.js: `nodejs20`, `nodejs18`, `nodejs16`, `nodejs14`, `nodejs12`, `nodejs10`, `nodejs8`
- Python: `python3.10`, `python3.9`, `python3`
- PHP: `PHP7.2`
- Java: `Java11`
- .NET: `.NETCore3.1`
- Go: `Go1.x`

更多运行时请参考 [阿里云函数计算文档](https://help.aliyun.com/product/50980.html)
