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

---

## 安装与配置

### Q: ServerlessInsight CLI 安装失败怎么办？

**A:** 请尝试以下步骤：

1. **检查 Node.js 版本**
   ```bash
   node --version
   # 需要 >= 18.x
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

**A:** 默认情况下，ServerlessInsight 会在当前工作目录查找 `serverlessinsight.yml`。你也可以：

- 使用 `-f` 参数指定配置文件路径
- 设置环境变量 `SI_CONFIG_FILE`

```bash
# 指定配置文件
si deploy -f config/prod.yml

# 使用环境变量
export SI_CONFIG_FILE="config/prod.yml"
si deploy
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

### Q: 如何部署到不同的区域？

**A:** 有两种方式：

1. **在配置文件中定义多个 stage**
   ```yaml
   stages:
   hangzhou:
     region: cn-hangzhou
   beijing:
     region: cn-beijing
   
   si deploy --stage hangzhou
   si deploy --stage beijing
   ```

2. **使用命令行参数覆盖**
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

**A:** 目前 ServerlessInsight 不支持同时部署多个服务，但可以通过脚本实现：

```bash
#!/bin/bash

# 部署服务 A
si deploy --stage dev

# 部署服务 B
si deploy --stage dev

# 部署服务 C
si deploy --stage dev
```

---

## 本地开发

### Q: 本地运行提示端口被占用

**A:** 指定其他端口：

```bash
si local --stage dev --port 8080
```

或者停止占用端口的进程：

```bash
# 查找占用 3000 端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
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
   - 确保修改的是 `src/` 目录下的文件
   - 重新打包代码：`./scripts/package.sh`

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
# 修改代码后
./scripts/package.sh
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
   si destroy --stage dev old-stack
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
   - AWS Secrets Manager
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

**A:** 启用调试模式：

```bash
# 命令行参数
si deploy --stage dev --debug

# 或环境变量
export SI_DEBUG=true
si deploy --stage dev
```

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

```yaml
stages:
  dev:
    region: cn-hangzhou
    memory: 512
    debug: true
  test:
    region: cn-shanghai
    memory: 1024
    debug: false
  prod:
    region: cn-beijing
    memory: 2048
    debug: false
```

### Q: 如何降低 Serverless 成本？

**A:** 

1. **优化函数配置**
   - 根据实际需求配置内存
   - 设置合理的超时时间

2. **使用预留实例**
   - 对于长期运行的应用
   - 预留实例比按量付费更便宜

3. **监控和分析**
   - 使用云供应商的成本分析工具
   - 识别和优化高成本函数

4. **代码优化**
   - 减少冷启动时间
   - 优化执行效率

### Q: 如何保证高可用性？

**A:** 

1. **多区域部署**
   ```yaml
   stages:
     hangzhou:
       region: cn-hangzhou
     shanghai:
       region: cn-shanghai
   ```

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
- **联系支持**: support@geekfun.club

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
   - 邮件支持：support@geekfun.club
   - 定制开发和咨询服务

---

## 没有找到你的问题？

如果本文档没有解答你的问题，请：

1. 查看 [GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues) 是否有类似问题
2. 在 [GitHub Discussions](https://github.com/geek-fun/serverlessinsight/discussions) 提问
3. 发送邮件至 support@geekfun.club

我们会持续更新本文档，欢迎贡献你的问题和解答！
