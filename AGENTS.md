# AGENTS.md — Agent 工作约定（serverlessinsight-site）

面向在本仓库工作的 AI agent 与贡献者。本站是 ServerlessInsight 的**标准营销网站**
（VitePress SSG，中文为主 + `en/` 英文副本）；登录与控制台应用由
`console-serverlessinsight` 提供，本站只做入口链接。提交前跑通 `npm run docs:build`。

---

## 设计系统：色彩规则（V3 · Mono + Violet Accent）

> 与 `console-serverlessinsight` 仓库的 `AGENTS.md` 同源同纪律——品牌色 =
> **Violet / 靛紫，hue 258**；本站 token 全部位于
> `docs/.vitepress/theme/custom.css`（`--vp-c-brand-1`、`--vp-button-brand-*`、
> `--vp-home-hero-name-color`）。营销站是品牌对外门面，克制纪律比控制台更严格。

### 核心原则

1. **一个颜色只说一件事（语义所有权）**：

| 颜色 | 唯一职责 | 说明 |
|---|---|---|
| Violet 258° | 品牌：链接、活跃导航、小图标点缀、focus、**featured CTA** | `--vp-c-brand-1` |
| Green ≈142° | 「免费」信号（价格表 0 AMR 徽章） | `pp-freebadge` / 绿色 500 类 |
| Amber ≈38° | 警告（保留给未来的告警组件） | 尚未使用 |
| Sky ≈210° | 中性信息 | 尚未使用 |
| Red 0° | 错误 / 阻断 | `--vp-c-danger-*`（VitePress 默认） |

2. **按钮单色（Vercel 式）**：VitePress brand 按钮通过 `--vp-button-brand-*`
   变量渲染为单色——亮色模式近黑底白字、暗色模式白底黑字。**禁止实心紫色按钮**，
   唯一例外见第 4 条。

3. **Hero 展示文字不带品牌色**：`--vp-home-hero-name-color` 已设置为中性色。
   VitePress 会用 `-webkit-text-fill-color` 渲染它——改 hero 标题颜色必须走这个
   变量，普通的 `color` 覆盖不会生效（血泪教训）。大字号标题永远不是「画布」。

4. **中性面零色度**：页面/卡片/描边为纯灰。环境光斑（`--gf/blob` 类渐变）可用
   violet→indigo 的**低饱和**色做玻璃纵深，但不引入第二装饰色系。

5. **每屏一次品牌时刻**：品牌色占界面 ≤10%。定价页的实心 violet CTA 只允许出现在
   **featured 套餐卡**（Team）上——它是该视口唯一的品牌时刻；其余 CTA 一律单色。

6. **厂商色只属于厂商**：Aliyun 橙 `#FF6A00`、腾讯蓝 `#0052D9`、火山蓝 `#025AF9`
   仅用于平台选择器 / 架构图中的**厂商标识本身**；站点 chrome（导航、按钮、标题、
   背景）永远不用。产品 logo（DocKit / SqlKit / Data Studio Agent）同理保留自有身份。

7. **绿色只做「免费」信号且限制面积**：价格表 0 AMR 徽章（描线 + 小徽章）是唯一
   用法；行背景、正文保持中性，绿色面积不得大到压过品牌色。

### 允许 ✓ / 禁止 ✗ 速查（Violet）

| ✓ Violet 可以 | ✗ Violet 不行 |
|---|---|
| 文字链接（`text-v-link` 风格 / `--vp-c-brand-1` 深紫 on 白） | Hero 展示标题、正文、大色块背景 |
| 活跃导航项（文字色） | 实心按钮填充——**唯一例外**：featured 套餐 CTA（每屏一个） |
| focus-ring（`--vp-c-brand-1`） | 非交互徽章填充（用描线 + 圆点） |
| 小型图标点缀（定价页功能图标、计费说明卡、Qx 序号） | 成功 / 免费信号（归绿）、警告（橙）、错误（红） |
| featured 套餐 CTA（每屏唯一实心紫） | 站点 chrome 使用任何云厂商色 |
| 低饱和 violet 渐变光斑（玻璃纵深，≤8% alpha） | 引入 violet/中性/语义色之外的第四种装饰色 |

### 硬性指标

- 正文对比度 ≥ 4.5:1；按钮前景/背景 ≥ 4.5:1；大号加粗标题 ≥ 3:1。
- 浅色底链接/文字紫用 `#6640BF`（白底 7.9:1）；暗底用 `#A384EB`（6.3:1）。
  雾紫 `#8F6AE7` 只做填充，不做浅底文字色。
- 状态不得只靠颜色区分——伴随图标或文字。

### SSG / 多语言注意（本仓库特有）

- 站点为 VitePress SSG 多 locale（root 中文 + `en/` 英文）。**组件内做
  locale 相关样式时禁止依赖 `useData().lang` / `location`**：多 locale 页面
  由单进程串行 SSR，slot 上下文中二者不可靠（曾导致中英文案反串）。正确做法：
  - 文案/颜色随 locale 切换 → 用构建期固化的 `html[lang]` 属性 + CSS 显隐
    （参考 `AuthNav.vue` 的四 span 模式）；
  - 或组件内 `useData().page.value.relativePath` 判断（SSR 安全）。
- 新页面在 `localizedPages`（config.mts）登记以生成 hreflang 头；导航双侧
  （zh/en）同步增删。

### 新颜色 / 新内容落地流程

1. 优先复用现有 token；新增色先在 `custom.css` 定义变量再使用，组件内禁止
   新增一次性硬编码色值（历史遗留的语义 tailwind 类容忍至 token 化完成）。
2. 改主题 = 只改 `custom.css` + 发版；已构建页面不追溯。
3. 定价数字与控制台 `conf/*.json` → `billing` 段保持同步（PricingPage.vue 内
   静态快照处有标注）；控制台调价后需手动同步本站文案与数字。
4. 控制台地址常量在 `docs/.vitepress/theme/console.ts`（`CONSOLE_URL`），
   生产域名变更只改这一处。

### 已知待办（接手可做）

- [ ] OG 分享图（`si-archtecture.drawio.png`）与其他位图品牌资产如含旧琥珀色，
      需设计重出为 violet 版本。
- [ ] 语义色 token 化：`pp-freebadge` 等处的绿色硬编码迁移到 `--success` token。
- [ ] 登录/控制台入口的 Terms / Privacy 链接目前为占位（`#`），法务页面上线后
      替换真实地址。

---

## 仓库约定（速览）

- VitePress SSG：`npm run docs:dev`（本地）、`npm run docs:build`（构建到 `dist/`）。
- 多 locale：`docs/` root = 中文，`docs/en/` = 英文；新页面两侧都要建，并在
  `config.mts` 的 `localizedPages` 登记。
- 部署产物为纯静态；控制台登录入口指向 `console.ts` 中的 `CONSOLE_URL`。
