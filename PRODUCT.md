# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

首要受众：独立开发者与小团队（中文开发者为主），正在国内云（阿里云/腾讯云/火山引擎）上构建 Serverless 应用，想用代码而非控制台点选管理基础设施。次要受众：评估多云 IaC 方案的企业平台团队（次级叙事，不作为首页主口径）。

## Product Purpose

ServerlessInsight 是面向国内云厂商的开源 Serverless IaC 工具：用一个 `serverlessinsight.yml` 声明函数、API 网关、数据库、表存储、对象存储等全栈资源，`si` CLI 完成校验、计划、部署、本地调试、销毁的全生命周期。部署基于状态文件做增量计算（首次全量、之后增量）。成功 = 开发者从定义到上线的路径足够短且可信。

## Positioning

跨厂商（阿里云/腾讯云/火山引擎）的声明式单文件 Serverless IaC + 状态化增量生命周期管理——一份 YAML 不改语义跨云部署，`si deploy` 依据状态精确计算变更。不点名对比竞品（用户决策 2026-09-15）。

## Operating Context

- Node.js >= 18，`npm install -g @geek-fun/serverlessinsight`，唯一入口 `si` 命令
- 核心工作流：`si validate` → `si deploy --stage <env>` → `si local`（本地调试，热重载）→ `si destroy`
- 配置模型：全局骨架（version/provider/app/service/vars/stages）+ 资源声明（functions/events/databases/tables/buckets）；变量引用 `${vars.*}` / `${stages.*}` / `${ctx.*}`
- 凭证经环境变量注入；web 控制台 console.serverlessinsight.com 提供登录/管理（本站只做入口）
- CI/CD 无特定依赖，可集成现有工具链

## Capabilities and Constraints

- 可部署供应商：`aliyun`、`tencent`、`volcengine`（`huawei`/`aws` 配置可写但暂不可部署，文案不得宣称）
- 资源类型：函数（代码包/容器镜像）、API 网关事件、Serverless MySQL（RDS）、Tablestore、OSS 桶（静态站点+自定义域名+证书）
- 腾讯云暂不支持 `events`（HTTP 入口走函数 triggers）——对比矩阵措辞需准确
- 版本 0.9.0（2026-09-11 发布），共 62 个版本，迭代活跃
- 首页证据素材已获用户批准：真实 YAML/CLI 示例、GitHub/npm 真实数据、多云厂商支持矩阵
- 明暗基调：跟随系统自适应（用户决策）

## Brand Commitments

- **品牌口号（2026-09-15 用户重申）**：首页主标题必须使用既有口号「全栈 Serverless 应用平台」/"Full-stack Serverless Application Platform"，tagline「构建全生命周期的跨供应商 Serverless 应用管理，助力快速发展的业务」——不得自创替换
- 仓库 AGENTS.md 的 V3 Mono + Violet 设计系统为硬约束：violet(hue 258) 只拥有链接/活跃导航/小图标/focus/featured CTA；按钮单色（近黑/白）；hero 展示文字中性色；厂商色（Aliyun #FF6A00、腾讯 #0052D9、火山 #025AF9）只属于厂商标识本身；每屏品牌色 ≤10%
- 双语：root 中文 + `en/` 英文，文案与导航双侧同步
- 控制台地址常量 `docs/.vitepress/theme/console.ts`；主 CTA「免费开始」指向控制台（用户决策）
- 营销文案不得写死云厂商数量（多云阵容随版本扩展）

## Evidence on Hand

- 真实可展示：getting-started.md 的 YAML 配置示例（函数/网关/数据库/stages 变量）、CLI 命令流、HeroScene.vue 已有的 YAML 打字 3D 场景
- 真实数据（2026-09-15 取自公开接口）：npm 累计发布 62 版本、月下载 ~1,510、年下载 ~8,959；GitHub 88 stars / 10 forks、Apache-2.0、2024-01 开源
- 禁止虚构：无客户 Logo、无推荐语、无性能基准、无下载量夸大——star/下载量数字偏小，只做低调的诚实呈现（如「62 个版本 · Apache-2.0 · 持续迭代」），不做大数字英雄牌
- 定价页存在真实快照（PricingPage.vue，0 AMR 免费档 + Team featured 档），可 teaser 引用但以定价页为准

## Product Principles

1. **一个文件就是全部**——声明式 YAML 是产品心智的核心，首页永远让代码站在主角位置
2. **诚实胜过声量**——只展示真实命令、真实输出、真实数字；小而真 > 大而假
3. **路径要短**——访客从「这是什么」到「我自己跑起来」不超过三步
4. **多云不是口号**——供应商矩阵、差异与约束如实呈现
5. **开源是信任底座**——Apache-2.0、活跃发版是给开发者的第一层背书

## Accessibility & Inclusion

遵循 AGENTS.md 硬指标：正文对比度 ≥ 4.5:1，按钮前景/背景 ≥ 4.5:1，状态不得只靠颜色区分（伴随图标或文字）；尊重 prefers-reduced-motion（HeroScene 已实现）。
