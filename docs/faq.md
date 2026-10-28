---
title: "常见问题"
description: "ServerlessInsight 常见问题：安装与配置、云端部署、本地开发、资源管理、凭证与权限以及故障排查。"
---
# 常见问题 (FAQ)

本文档收集了 ServerlessInsight 使用过程中的常见问题和解答。

## 目录

- [安装与配置](#安装与配置)
- [部署相关](#部署相关)
- [本地开发](#本地开发)
- [资源管理](#资源管理)
- [安全与权限](#安全与权限)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)
- [其他问题](#其他问题)

---

## 安装与配置

### Q: ServerlessInsight CLI 安装失败怎么办？

**A:** 请尝试以下步骤：

1. **检查 Node.js 版本**
   ```bash
   node --version
   # 需要 >= 22.12
   ```

2. **清理 npm 缓存**
   ```bash
   npm cache clean --force
   ```

3. **使用国内镜像（中国大陆用户）**
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install -g @geek-fun/serverlessinsight
   ```

4. **检查网络连接**
   ```bash
   ping registry.npmjs.org
   ```

### Q: 如何升级 ServerlessInsight CLI？

**A:** 使用以下命令升级：

```bash
npm update -g @geek-fun/serverlessinsight
```

或强制重新安装：

```bash
npm install -g @geek-fun/serverlessinsight@latest
```

### Q: 配置文件应该放在哪里？

**A:** 默认情况下，ServerlessInsight 会在当前工作目录查找 `serverlessinsight.yml`。使用 `-f` 参数指向其他配置文件路径即可：

```bash
si deploy -f config/prod.yml
```

### Q: 如何管理多个项目的配置？

**A:** 推荐做法：

1. **每个项目独立的配置文件**
   ```
   project/
   ├── serverlessinsight.dev.yml
   ├── serverlessinsight.prod.yml
   └── ...
   ```

2. **使用 Git 子模块或 Workspaces**
3. **使用环境变量区分项目**

---

## 部署相关

### Q: 部署时提示"权限不足"错误

**A:** 这通常是因为云供应商凭证配置不正确或权限不足：

1. **检查环境变量**
   ```bash
   echo $ALIYUN_ACCESS_KEY_ID
   echo $ALIYUN_ACCESS_KEY_SECRET
   ```

2. **验证 RAM 用户权限**
   确保 RAM 用户具有以下权限：
   - `AliyunFCFullAccess` - 函数计算完全访问权限
   - `AliyunAPIGatewayFullAccess` - API 网关完全访问权限
   - 其他相关服务权限

3. **使用临时凭证**
   ```bash
   export ALIYUN_SECURITY_TOKEN="your-temporary-token"
   ```

### Q: 部署失败后如何回滚？

**A:** ServerlessInsight 目前不支持自动回滚，但可以手动操作：

1. **使用 Git 管理配置**
   ```bash
   # 回滚配置文件
   git checkout HEAD~1 serverlessinsight.yml
   
   # 重新部署
   si deploy --stage dev
   ```

2. **手动删除失败的资源栈**
   ```bash
   si destroy --stage dev
   ```

3. **从备份恢复**
   ```bash
   # 如果有配置备份
   cp serverlessinsight.yml.backup serverlessinsight.yml
   si deploy --stage dev
   ```

### Q: 部分资源部署失败怎么办？（部分失败恢复）

**A:** ServerlessInsight 支持部分失败恢复机制。当部署多个资源时，如果部分资源创建成功、部分失败：

1. **不会回滚已成功的资源** — 已创建成功的资源会保留
2. **修复问题后重试** — 根据错误信息修复配置或权限问题
3. **重新执行部署** — 再次运行 `si deploy --stage <env>`，系统会跳过已存在的资源，只创建失败的资源

```bash
# 查看部署状态
si show --stage dev

# 修复问题后重新部署
si deploy --stage dev
```

> 💡 **提示**: 这种方式避免了每次部署都要从头创建所有资源，大幅缩短了修复重试的时间。

### Q: 如何部署到不同的区域？

**A:** 有两种方式：

1. **修改配置里的 `provider.region`** —— `provider.region` 决定所有资源的落点，改完重新部署即指向新区域（旧区域已部署的资源仍在原地，需用旧配置 `si destroy` 或手动清理）。

2. **命令行参数覆盖**（优先级最高：`-r` > `SI_REGION` > `ALIYUN_REGION` > `provider.region`）：
   ```bash
   si deploy --region cn-beijing
   ```

### Q: 部署时间过长怎么办？

**A:** 可能的原因和解决方案：

1. **代码包过大**
   - 优化代码结构，移除不必要的依赖
   - 使用多阶段构建减小包体积

2. **网络问题**
   - 检查网络连接
   - 使用离部署区域更近的网络

3. **资源创建延迟**
   - 某些云资源创建需要时间（如 SLS）
   - 查看日志了解具体卡在哪个步骤

### Q: 如何同时部署多个服务？

**A:** 一份配置文件描述一个服务（`app` + `service`）。要部署多个服务，请每个服务维护一份配置（各自目录），然后依次部署：

```bash
#!/bin/bash
cd services/api && si deploy --stage dev
cd ../worker && si deploy --stage dev
cd ../web && si deploy --stage dev
```

---

## 本地开发

### Q: 本地运行提示端口被占用

**A:** 本地服务默认监听 `4567`。可以先释放端口，也可以用 `SI_LOCALSTACK_SERVER_PORT` 换一个端口：

```bash
# 查找占用 4567 端口的进程
lsof -i :4567

# 终止进程
kill -9 <PID>

# 或者换个端口
SI_LOCALSTACK_SERVER_PORT=4568 si local --stage dev
```

### Q: 本地开发环境如何调试？

**A:** 使用调试模式：

```bash
si local --stage dev --debug
```

配合 IDE 进行断点调试：

1. **VSCode 配置** (`.vscode/launch.json`)
   ```json
   {
     "type": "node",
     "request": "attach",
     "name": "Attach to ServerlessInsight",
     "port": 9229,
     "restart": true
   }
   ```

2. **在代码中添加 debugger**
   ```typescript
   export async function handler(event: any) {
     debugger; // 断点
     // 你的代码
   }
   ```

### Q: 文件监视模式不工作怎么办？

**A:** 尝试以下方法：

1. **显式启用 watch 模式**
   ```bash
   si local --stage dev --watch
   ```

2. **检查文件变化**
   - 确保修改的路径在配置 `code.path` 指向的目录内
   - 必要时重新打包代码

3. **重启本地环境**
   ```bash
   # Ctrl+C 停止
   si local --stage dev
   ```

### Q: 本地环境与线上环境行为不一致？

**A:** 可能的原因：

1. **环境变量差异**
   - 确保本地设置了相同的环境变量
   - 使用 `.env` 文件管理环境配置

2. **依赖版本不同**
   - 检查 `package.json` 中的依赖版本
   - 使用 `package-lock.json` 锁定版本

3. **资源配置差异**
   - 检查 `stages` 配置是否正确
   - 确保使用相同的 stage 进行本地开发和部署

---

## 资源管理

### Q: 如何查看已部署的资源？

**A:** 有以下几种方式：

1. **通过云供应商控制台**
   - 登录云供应商控制台
   - 根据资源栈名称查找相关资源

2. **通过资源标签**
   - 使用配置的 `tags` 筛选资源
   - 例如：`owner=geek-fun, project=my-app`

3. **使用云供应商 CLI**
   ```bash
   # 阿里云示例
   aliyun fc list services
   aliyun apigateway DescribeApis
   ```

### Q: 如何更新已部署的函数代码？

**A:** 重新打包并部署：

```bash
# 修改代码并重新打包后
si deploy --stage dev
```

ServerlessInsight 会检测到代码变化并更新函数。

### Q: 如何删除单个资源而不删除整个资源栈？

**A:** 目前 ServerlessInsight 不支持删除单个资源。建议：

1. **从配置文件中移除该资源**
2. **重新部署**（ServerlessInsight 会删除配置中不存在的资源）
3. **或在云供应商控制台手动删除**

> ⚠️ **警告**: 删除资源前请确保了解其影响

### Q: 资源数量达到限制怎么办？

**A:** 云供应商通常对资源数量有限制：

1. **清理不用的资源**
   ```bash
   si destroy --stage dev
   ```

2. **申请提高限额**
   - 联系云供应商支持
   - 提供业务需求和预期用量

3. **优化资源使用**
   - 合并类似的函数
   - 使用更高效的资源配置

---

## 安全与权限

### Q: 如何安全管理密钥和敏感信息？

**A:** 推荐做法：

1. **使用环境变量**
   ```bash
   export DB_PASSWORD="your-password"
   ```

2. **在配置中引用**
   ```yaml
   functions:
     my_function:
       environment:
         DB_PASSWORD: ${vars.db_password}
   ```

3. **使用密钥管理服务**
   - 阿里云 KMS
   - 腾讯云 KMS
   - HashiCorp Vault

4. **不要将密钥提交到 Git**
   ```bash
   # .gitignore
   .env
   *.key
   *.pem
   ```

### Q: 如何配置 VPC 和安全组？

**A:** 在 `serverlessinsight.yml` 中配置：

```yaml
functions:
  my_function:
    network:
      vpc_id: vpc-my-vpc
      subnet_ids:
        - vsw-subnet1
      security_group:
        name: my-sg
        ingress:
          - TCP:0.0.0.0/0:443
        egress:
          - ALL:0.0.0.0/0:ALL
```

### Q: 如何启用函数日志？

**A:** 

```yaml
functions:
  my_function:
    log: true
```

> ⚠️ **注意**: 阿里云 SLS 创建有延迟，首次部署时需关闭日志，等待 1-2 分钟后重新部署开启日志。

---

## 故障排查

### Q: 如何查看详细日志？

**A:** 设置 `DEBUG` 环境变量（所有命令日志走 stderr，`--json` 结果数据走 stdout）：

```bash
export DEBUG=true
si deploy --stage dev
```

`--debug` 参数仅 `si local` 提供。

### Q: 部署卡在某个步骤不动

**A:** 可能原因：

1. **网络超时**
   - 检查网络连接
   - 增加超时时间（如果支持）

2. **云供应商 API 限流**
   - 等待几分钟后重试
   - 联系云供应商提高 API 限流

3. **资源创建中**
   - 某些资源创建需要较长时间（如数据库）
   - 查看云供应商控制台确认进度

### Q: 函数执行超时怎么办？

**A:** 

1. **增加超时时间**
   ```yaml
   functions:
     my_function:
       timeout: 60  # 增加到 60 秒
   ```

2. **优化函数性能**
   - 减少不必要的计算
   - 使用异步处理
   - 优化数据库查询

3. **拆分函数**
   - 将大函数拆分为多个小函数
   - 使用链式调用

### Q: 内存不足错误

**A:** 

1. **增加内存配置**
   ```yaml
   functions:
     my_function:
       memory: 1024  # 增加到 1GB
   ```

2. **优化代码**
   - 减少内存占用
   - 使用流式处理大数据
   - 及时释放不用的资源

---

## 最佳实践

### Q: 如何组织大型项目的配置？

**A:** 推荐结构：

```
project/
├── serverlessinsight.yml          # 主配置文件
├── serverlessinsight.dev.yml      # 开发环境配置
├── serverlessinsight.prod.yml     # 生产环境配置
├── functions/
│   ├── user-service/
│   ├── order-service/
│   └── ...
└── scripts/
    └── deploy-all.sh
```

### Q: 如何管理多个环境的配置？

**A:** 使用 `stages`：

每个 stage 就是一组普通标量值，通过 `${stages.<键>}` 引用——它们是变量，不是行为开关：

```yaml
stages:
  dev:
    memory: 512
  test:
    memory: 1024
  prod:
    memory: 2048
```

```yaml
functions:
  api_fn:
    memory: ${stages.memory}
```

指定环境部署用 `si deploy --stage dev`；部署区域来自 `provider.region`（或 `-r`），不来自 stage 键。

### Q: 如何降低 Serverless 成本？

**A:** 

1. **优化函数配置**
   - 根据实际需求配置内存
   - 设置合理的超时时间

2. **调优 Serverless 数据库的弹性 CU 区间**
   - `cu.min` 调低可让空闲期成本趋近于零
   - 按真实峰值设定 `cu.max`，避免超配

3. **监控和分析**
   - 使用云供应商的成本分析工具
   - 识别和优化高成本函数

4. **代码优化**
   - 减少冷启动时间
   - 优化执行效率

### Q: 如何保证高可用性？

**A:** 

1. **多区域部署**：通过 `-r` / `provider.region` 把同一份配置部署到多个区域（每个 stage+region 组合各有一份状态）

2. **配置健康检查**
3. **使用负载均衡**
4. **实现故障转移机制**

---

## 其他问题

### Q: ServerlessInsight 是免费的吗？

**A:** 是的，ServerlessInsight 是开源软件，采用 Apache 2.0 许可证，可以免费使用。

### Q: 如何贡献代码或报告问题？

**A:** 

- **报告问题**: [GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues)
- **贡献代码**: [GitHub Pull Requests](https://github.com/geek-fun/serverlessinsight/pulls)
- **联系支持**: support@wentsen.com

### Q: 有社区或论坛吗？

**A:** 

- **GitHub Discussions**: [discussions](https://github.com/geek-fun/serverlessinsight/discussions)
- **Twitter**: [@Blankll31075](https://x.com/Blankll31075)
- **YouTube**: [GeekFun Club](https://www.youtube.com/@geekfun-club)

### Q: 如何获取技术支持？

**A:** 

1. **社区支持** (免费)
   - GitHub Issues
   - GitHub Discussions
   - 社区论坛

2. **商业支持** (付费)
   - 邮件支持：support@wentsen.com
   - 定制开发和咨询服务

---

## 没有找到你的问题？

如果本文档没有解答你的问题，请：

1. 查看 [GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues) 是否有类似问题
2. 在 [GitHub Discussions](https://github.com/geek-fun/serverlessinsight/discussions) 提问
3. 发送邮件至 support@wentsen.com

我们会持续更新本文档，欢迎贡献你的问题和解答！
