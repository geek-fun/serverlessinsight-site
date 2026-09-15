<script setup lang="ts">
import {computed, ref} from 'vue'
import {useData} from 'vitepress'
import HeroScene from './HeroScene.vue'
import HomeMatrix from './HomeMatrix.vue'
import {CONSOLE_LOGIN_URL} from '../console'

// AGENTS.md: locale must come from the build-time relativePath (SSR-safe),
// never from useData().lang / location inside slot-rendered components.
const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))

const t = computed(() => (isZh.value ? ZH : EN))
const link = (path: string) => (isZh.value ? path : `/en${path}`)

const ZH = {
  h1: '全栈 Serverless 应用平台',
  sub: '构建全生命周期的跨供应商 Serverless 应用管理，助力快速发展的业务',
  ctaPrimary: '免费开始',
  ctaSecondary: '快速开始',
  install: 'npm install -g @geek-fun/serverlessinsight',
  copyTip: '复制安装命令',
  copied: '已复制',
  deployTo: '支持部署到',
  providers: [
    {name: '阿里云', icon: '/icons/platform-aliyun.png'},
    {name: '腾讯云', icon: '/icons/platform-tencent.png'},
    {name: '火山引擎', icon: '/icons/platform-volcengine.png'}
  ],
  proof: ['开源 · Apache-2.0', '62 个版本持续发版', 'Node.js 18+', 'npm 月安装 1,500+'],
  b1: {
    title: '一个文件，声明全栈',
    body: '函数、API 网关、Serverless 数据库、表格存储、对象存储——全部写在 serverlessinsight.yml 里。变量与多环境内建，敏感值通过部署参数注入，永不写入文件。',
    link: '查看配置手册',
    href: '/reference'
  },
  b2: {
    title: '部署前的每一步，先看得见',
    body: 'si deploy 依据状态文件计算增量：将要创建、更新或销毁的资源先完整呈现，确认后才执行。配置外的手工改动会被标记为漂移，无处遁形。',
    link: 'CLI 参考',
    href: '/cli'
  },
  cmds: {
    title: '从校验、部署到本地调试',
    lead: '一个 CLI 覆盖全生命周期，每条命令的输出都可直接检视。',
    rows: [
      {cmd: 'si validate', desc: '部署前校验配置：运行时、枚举与必填字段全部检查', out: 'Yaml is valid! 🎉'},
      {cmd: 'si deploy --stage dev', desc: '依据状态文件增量部署，先生成计划再执行', out: 'Plan: 2 add · 0 modify'},
      {cmd: 'si local --stage dev', desc: '函数在本地进程真实运行，保存即热重载', out: 'listening :4567'}
    ]
  },
  price: {
    title: '简单透明的定价',
    lead: '个人项目永久免费；团队随规模升级，按额度计费。',
    devBadge: '永久免费',
    devName: 'Developer',
    devPrice: '¥0',
    devPeriod: '/月',
    devQuota: '含 10 AMR',
    devCta: '免费开始',
    teamName: 'Team',
    teamPrice: '¥399',
    teamPeriod: '/月',
    teamQuota: '含 100 AMR',
    teamDesc: '团队协作、自动部署与更高额度',
    teamCta: '升级到 Team',
    more: '查看完整定价',
    moreHref: '/pricing'
  },
  close: {
    title: '把整套 Serverless 应用，写进一个文件。',
    primary: '免费开始',
    secondary: '快速开始',
    note: '开源免费 · 无供应商锁定 · si destroy 随时清理'
  }
}

const EN = {
  h1: 'Full-stack Serverless Application Platform',
  sub: 'Full lifecycle cross-provider serverless application management for your fast-growing business.',
  ctaPrimary: 'Start for Free',
  ctaSecondary: 'Get Started',
  install: 'npm install -g @geek-fun/serverlessinsight',
  copyTip: 'Copy install command',
  copied: 'Copied',
  deployTo: 'Deploy to',
  providers: [
    {name: 'Aliyun', icon: '/icons/platform-aliyun.png'},
    {name: 'Tencent Cloud', icon: '/icons/platform-tencent.png'},
    {name: 'Volcengine', icon: '/icons/platform-volcengine.png'}
  ],
  proof: ['Open source · Apache-2.0', '62 releases and counting', 'Node.js 18+', '1,500+ installs / month'],
  b1: {
    title: 'One file declares the whole stack',
    body: 'Functions, API gateways, serverless databases, table storage and object storage — all in one serverlessinsight.yml. Variables and multi-stage environments are built in; secrets are injected at deploy time, never written to the file.',
    link: 'Read the reference',
    href: '/reference'
  },
  b2: {
    title: 'See every change before it ships',
    body: 'si deploy computes an incremental plan from state: every create, update or destroy is presented in full before it runs. Manual changes made outside the file are flagged as drift.',
    link: 'CLI reference',
    href: '/cli'
  },
  cmds: {
    title: 'Validate, deploy, then debug locally',
    lead: 'One CLI covers the full lifecycle — every command prints output you can inspect.',
    rows: [
      {cmd: 'si validate', desc: 'Validate config before deploy: runtimes, enums and required fields', out: 'Yaml is valid! 🎉'},
      {cmd: 'si deploy --stage dev', desc: 'Incremental deploys computed from state — plan first, then execute', out: 'Plan: 2 add · 0 modify'},
      {cmd: 'si local --stage dev', desc: 'Functions run for real in a local process, hot-reloading on save', out: 'listening :4567'}
    ]
  },
  price: {
    title: 'Simple, transparent pricing',
    lead: 'Free forever for personal projects; teams scale with usage-based allowances.',
    devBadge: 'Free forever',
    devName: 'Developer',
    devPrice: '¥0',
    devPeriod: '/mo',
    devQuota: '10 AMR included',
    devCta: 'Start for free',
    teamName: 'Team',
    teamPrice: '¥399',
    teamPeriod: '/mo',
    teamQuota: '100 AMR included',
    teamDesc: 'Team workspaces, auto deploy and a higher allowance',
    teamCta: 'Upgrade to Team',
    more: 'See full pricing',
    moreHref: '/pricing'
  },
  close: {
    title: 'Your entire serverless app, in one file.',
    primary: 'Start for Free',
    secondary: 'Get Started',
    note: 'Open source · No vendor lock-in · si destroy cleans up anytime'
  }
}

/* static YAML artifact for band 1 — real config shape from getting-started */
type Tok = {c: 'k' | 'p' | 'v'; s: string}
const y = (c: Tok['c'], s: string): Tok => ({c, s})
const YAML: Tok[][] = [
  [y('k', 'provider'), y('p', ':')],
  [y('p', '  '), y('k', 'name'), y('p', ':'), y('v', ' aliyun')],
  [y('p', '  '), y('k', 'region'), y('p', ':'), y('v', ' cn-hangzhou')],
  [y('k', 'app'), y('p', ':'), y('v', ' hello-world')],
  [y('k', 'service'), y('p', ':'), y('v', ' hello-world-api')],
  [],
  [y('k', 'functions'), y('p', ':')],
  [y('p', '  '), y('k', 'hello_world_fn'), y('p', ':')],
  [y('p', '    '), y('k', 'code'), y('p', ':')],
  [y('p', '      '), y('k', 'runtime'), y('p', ':'), y('v', ' nodejs18')],
  [y('p', '      '), y('k', 'handler'), y('p', ':'), y('v', ' index.handler')],
  [y('p', '      '), y('k', 'path'), y('p', ':'), y('v', ' artifacts/app.zip')],
  [y('p', '    '), y('k', 'memory'), y('p', ':'), y('v', ' ${stages.memory}')],
  [y('k', 'events'), y('p', ':')],
  [y('p', '  '), y('k', 'gateway_event'), y('p', ':')],
  [y('p', '    '), y('k', 'type'), y('p', ':'), y('v', ' API_GATEWAY')],
  [y('p', '    '), y('k', 'triggers'), y('p', ':')],
  [y('p', '      '), y('p', '- '), y('k', 'method'), y('p', ':'), y('v', ' GET')],
  [y('p', '        '), y('k', 'path'), y('p', ':'), y('v', ' /api/*')],
  [y('p', '        '), y('k', 'backend'), y('p', ':'), y('v', ' hello_world_fn')],
  [y('k', 'databases'), y('p', ':')],
  [y('p', '  '), y('k', 'main_db'), y('p', ':')],
  [y('p', '    '), y('k', 'type'), y('p', ':'), y('v', ' RDS_MYSQL_SERVERLESS')],
  [y('k', 'buckets'), y('p', ':')],
  [y('p', '  '), y('k', 'assets'), y('p', ':')],
  [y('p', '    '), y('k', 'storage'), y('p', ':')],
  [y('p', '      '), y('k', 'class'), y('p', ':'), y('v', ' STANDARD')]
]

/* deploy plan terminal (band 2) — format mirrors the real `si` plan output */
type TLine = {cls: 'cmd' | 'info' | 'head' | 'note' | 'add' | 'pair' | 'sum' | 'ask' | ''; s: string}
const l = (cls: TLine['cls'], s: string): TLine => ({cls, s})
const TERM = computed<TLine[]>(() =>
  isZh.value
    ? [
        l('cmd', '$ si deploy --stage prod'),
        l('info', 'INFO (ServerlessInsight): 正在生成部署计划...'),
        l('', ''),
        l('head', '  ServerlessInsight 将执行以下操作:'),
        l('', ''),
        l('note', '  # hello_world_fn 将被创建'),
        l('add', '  + hello_world_fn:'),
        l('pair', '      runtime:  "nodejs18"'),
        l('pair', '      memory:   128'),
        l('', ''),
        l('note', '  # gateway_event 将被创建'),
        l('add', '  + gateway_event:'),
        l('pair', '      method:   "GET"'),
        l('pair', '      path:     "/api/*"'),
        l('', ''),
        l('sum', '  计划: 新增 2，变更 0，移除 0，重建 0，无变更 1。'),
        l('ask', '是否执行这些操作？(yes/no):')
      ]
    : [
        l('cmd', '$ si deploy --stage prod'),
        l('info', 'INFO (ServerlessInsight): Generating deployment plan...'),
        l('', ''),
        l('head', '  ServerlessInsight will perform the following actions:'),
        l('', ''),
        l('note', '  # hello_world_fn will be created'),
        l('add', '  + hello_world_fn:'),
        l('pair', '      runtime:  "nodejs18"'),
        l('pair', '      memory:   128'),
        l('', ''),
        l('note', '  # gateway_event will be created'),
        l('add', '  + gateway_event:'),
        l('pair', '      method:   "GET"'),
        l('pair', '      path:     "/api/*"'),
        l('', ''),
        l('sum', '  Plan: 2 add, 0 modify, 0 remove, 0 recreate, 1 unchanged.'),
        l('ask', 'Proceed? (yes/no):')
      ]
)

/* install chip copy-to-clipboard */
const copied = ref(false)
let copiedTimer = 0
const copyInstall = async () => {
  try {
    await navigator.clipboard.writeText(t.value.install)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = t.value.install
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="si-landing">
    <!-- ============ hero ============ -->
    <section class="si-hero">
      <div class="si-wrap si-hero__in">
        <div class="si-hero__copy">
          <h1 class="si-hero__h1 rise rise-1">{{ t.h1 }}</h1>
          <p class="si-hero__sub rise rise-2">{{ t.sub }}</p>
          <div class="si-hero__actions rise rise-3">
            <a class="btn btn--brand" :href="CONSOLE_LOGIN_URL">{{ t.ctaPrimary }}</a>
            <a class="btn btn--alt" :href="link('/getting-started')">{{ t.ctaSecondary }}</a>
          </div>
          <div class="install rise rise-4">
            <code class="install__cmd">{{ t.install }}</code>
            <button class="install__btn" type="button" :aria-label="t.copyTip" :title="t.copyTip" @click="copyInstall">
              <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect width="14" height="14" x="8" y="8" rx="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="install__check">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>
          </div>
          <ul class="proof rise rise-4">
            <li v-for="item in t.proof" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
      <div class="si-hero__stage">
        <HeroScene />
      </div>
    </section>

    <!-- ============ provider logo wall (serverless.com-style, first viewport) ============ -->
    <section class="logo-wall">
      <div class="si-wrap">
        <p class="logo-wall__label">{{ t.deployTo }}</p>
        <div class="logo-wall__row">
          <a v-for="p in t.providers" :key="p.name" class="logo-wall__item" :href="link('/reference')">
            <img :src="p.icon" :alt="p.name" />
            <span>{{ p.name }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ============ band 1: one file ============ -->
    <section class="band">
      <div class="si-wrap band__grid">
        <div class="band__copy">
          <h2 class="sec-title">{{ t.b1.title }}</h2>
          <p class="sec-lead">{{ t.b1.body }}</p>
          <a class="sec-link" :href="link(t.b1.href)">{{ t.b1.link }}<span class="sec-link__arrow">→</span></a>
        </div>
        <div class="artifact artifact--file">
          <div class="artifact__head">
            <span class="artifact__dot" />
            <span class="artifact__name">serverlessinsight.yml</span>
          </div>
          <pre class="codeblock"><code><template v-for="(line, li) in YAML" :key="li"><span v-for="(tok, ti) in line" :key="ti" :class="`si-tok si-tok--${tok.c}`">{{ tok.s }}</span>{{
'\n' }}</template></code></pre>
        </div>
      </div>
    </section>

    <!-- ============ band 2: plan ============ -->
    <section class="band band--flip">
      <div class="si-wrap band__grid">
        <div class="band__copy">
          <h2 class="sec-title">{{ t.b2.title }}</h2>
          <p class="sec-lead">{{ t.b2.body }}</p>
          <a class="sec-link" :href="link(t.b2.href)">{{ t.b2.link }}<span class="sec-link__arrow">→</span></a>
        </div>
        <div class="artifact artifact--term">
          <div class="term__bar">
            <span class="term__dot" /><span class="term__dot" /><span class="term__dot" />
            <span class="term__name">si — deploy</span>
          </div>
          <pre class="term__body"><code><span v-for="(line, i) in TERM" :key="i" :class="line.cls ? `t-${line.cls}` : undefined">{{ line.s || ' ' }}
</span></code></pre>
        </div>
      </div>
    </section>

    <!-- ============ matrix ============ -->
    <HomeMatrix />

    <!-- ============ command strip ============ -->
    <section class="cmds">
      <div class="si-wrap">
        <h2 class="sec-title">{{ t.cmds.title }}</h2>
        <p class="sec-lead">{{ t.cmds.lead }}</p>
        <div class="panel">
          <div v-for="row in t.cmds.rows" :key="row.cmd" class="cmd-row">
            <code class="cmd-row__name"><span class="cmd-row__prompt">$</span>{{ row.cmd }}</code>
            <span class="cmd-row__desc">{{ row.desc }}</span>
            <code class="cmd-row__out">{{ row.out }}</code>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ pricing teaser ============ -->
    <section class="pricing">
      <div class="si-wrap">
        <h2 class="sec-title">{{ t.price.title }}</h2>
        <p class="sec-lead">{{ t.price.lead }}</p>
        <div class="price-grid">
          <div class="price-card">
            <div class="price-card__top">
              <span class="price-card__name">{{ t.price.devName }}</span>
              <span class="price-badge">{{ t.price.devBadge }}</span>
            </div>
            <div class="price-card__num">{{ t.price.devPrice }}<span class="price-card__period">{{ t.price.devPeriod }}</span></div>
            <div class="price-card__quota">{{ t.price.devQuota }}</div>
            <a class="btn btn--brand btn--sm" :href="CONSOLE_LOGIN_URL">{{ t.price.devCta }}</a>
          </div>
          <div class="price-card">
            <div class="price-card__top">
              <span class="price-card__name">{{ t.price.teamName }}</span>
            </div>
            <div class="price-card__num">{{ t.price.teamPrice }}<span class="price-card__period">{{ t.price.teamPeriod }}</span></div>
            <div class="price-card__quota">{{ t.price.teamQuota }} · {{ t.price.teamDesc }}</div>
            <a class="price-card__link" :href="CONSOLE_LOGIN_URL">{{ t.price.teamCta }}<span class="sec-link__arrow">→</span></a>
          </div>
        </div>
        <a class="sec-link" :href="link(t.price.moreHref)">{{ t.price.more }}<span class="sec-link__arrow">→</span></a>
      </div>
    </section>

    <!-- ============ close ============ -->
    <section class="close">
      <div class="si-wrap">
        <h2 class="close__title">{{ t.close.title }}</h2>
        <div class="close__actions">
          <a class="btn btn--brand" :href="CONSOLE_LOGIN_URL">{{ t.close.primary }}</a>
          <a class="btn btn--alt" :href="link('/getting-started')">{{ t.close.secondary }}</a>
        </div>
        <p class="close__note">{{ t.close.note }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.si-landing {
  overflow-x: clip;
}

/* ---------------- hero ---------------- */

.si-hero {
  position: relative;
  overflow: hidden;
}

.si-hero__in {
  position: relative;
  z-index: 1;
}

.si-hero__copy {
  padding: 64px 0 24px;
}

.si-hero__h1 {
  margin: 0;
  font-size: clamp(2.25rem, 4.4vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.028em;
  line-height: 1.12;
  text-wrap: balance;
  color: var(--vp-c-text-1);
  max-width: 17em;
}

.si-hero__sub {
  margin: 22px 0 0;
  font-size: 1.08rem;
  line-height: 1.75;
  color: var(--vp-c-text-2);
  max-width: 38em;
}

.si-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 24px;
  border-radius: 21px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  transition: background-color 0.25s, border-color 0.25s, color 0.25s;
}

.btn--brand {
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  border: 1px solid var(--vp-button-brand-border);
}

.btn--brand:hover {
  background: var(--vp-button-brand-hover-bg);
  color: var(--vp-button-brand-hover-text);
  border-color: var(--vp-button-brand-hover-border);
}

.btn--alt {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.btn--alt:hover {
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

.btn:focus-visible,
.install__btn:focus-visible,
.sec-link:focus-visible,
.price-card__link:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.btn--sm {
  height: 38px;
  padding: 0 20px;
  font-size: 13.5px;
}

/* install chip */

.install {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
  padding: 9px 9px 9px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  max-width: 100%;
}

.install__cmd {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.install__cmd::-webkit-scrollbar {
  display: none;
}

.install__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.install__btn:hover {
  background: var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.install__btn svg {
  width: 15px;
  height: 15px;
}

.install__check {
  color: var(--vp-c-brand-1);
}

/* provider logo wall — large, centered, first viewport */

.logo-wall {
  padding: 4px 0 6px;
}

.logo-wall__label {
  margin: 0 0 22px;
  text-align: center;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}

.logo-wall__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: clamp(48px, 9vw, 128px);
}

.logo-wall__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo-wall__item img {
  width: clamp(56px, 5.5vw, 72px);
  height: clamp(56px, 5.5vw, 72px);
  object-fit: contain;
  transition: transform 0.25s ease;
}

.logo-wall__item:hover img {
  transform: translateY(-3px);
}

.logo-wall__item span {
  font-size: 13.5px;
  font-weight: 550;
  color: var(--vp-c-text-2);
}

.logo-wall__item:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
  border-radius: 8px;
}

/* proof strip */

.proof {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 0;
  margin: 40px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.proof li {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.proof li:not(:last-child)::after {
  content: '·';
  margin: 0 12px;
  color: var(--vp-c-text-3);
}

/* hero stage: text left, scene right (>=960px); scene flows below on mobile */

@media (min-width: 960px) {
  .si-hero {
    /* 680 + nav keeps the logo wall fully inside the first viewport on 900px screens */
    min-height: min(680px, 90svh);
    display: flex;
    align-items: center;
  }

  .si-hero__in {
    width: 100%;
  }

  .si-hero__copy {
    width: 50%;
    padding: 96px 0 120px;
  }
}

/* ---------------- shared section primitives live in custom.css ---------------- */

.band {
  padding-top: clamp(72px, 11vh, 120px);
}

.band__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(40px, 6vw, 88px);
  align-items: center;
}

.band--flip .band__copy {
  order: 2;
}

@media (max-width: 959px) {
  .band__grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .band--flip .band__copy {
    order: 0;
  }
}

/* ---------------- artifacts ---------------- */

.artifact {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 32px rgba(0, 0, 0, 0.06);
}

.artifact__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.artifact__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px rgba(102, 64, 191, 0.14);
}

.artifact__name {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.codeblock {
  margin: 0;
  padding: 18px 20px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12.75px;
  line-height: 1.62;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.si-tok--k { color: var(--vp-c-brand-1); }
.si-tok--p { color: var(--vp-c-text-3); }
.si-tok--v { color: var(--vp-c-text-1); }

.dark .si-tok--k { color: var(--vp-c-brand-1); }

/* terminal — one committed dark surface in both modes */

.artifact--term {
  border-color: rgba(0, 0, 0, 0.4);
}

.term__bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 16px;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.term__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
}

.term__name {
  margin-left: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: rgba(230, 237, 243, 0.55);
}

.term__body {
  margin: 0;
  padding: 18px 20px 20px;
  overflow-x: auto;
  background: #0d1117;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  line-height: 1.62;
  color: #e6edf3;
}

.term__body .t-cmd { color: #e6edf3; font-weight: 600; }
.term__body .t-info { color: #8b949e; }
.term__body .t-head { color: #e6edf3; }
.term__body .t-note { color: #8b949e; }
.term__body .t-add { color: #3fb950; font-weight: 600; }
.term__body .t-pair { color: #e6edf3; }
.term__body .t-sum { color: #8b949e; }
.term__body .t-ask { color: #e6edf3; font-weight: 600; }

/* ---------------- command strip ---------------- */

.cmds {
  padding-top: clamp(72px, 11vh, 120px);
}

.cmds .sec-lead {
  margin-bottom: 36px;
}

.panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  overflow: hidden;
}

.cmd-row {
  display: grid;
  grid-template-columns: 250px 1fr auto;
  gap: 22px;
  align-items: center;
  padding: 17px 22px;
}

.cmd-row + .cmd-row {
  border-top: 1px solid var(--vp-c-divider);
}

.cmd-row__name {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.cmd-row__prompt {
  color: var(--vp-c-brand-1);
  margin-right: 9px;
}

.cmd-row__desc {
  font-size: 13.5px;
  color: var(--vp-c-text-2);
}

.cmd-row__out {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 4px 12px;
  white-space: nowrap;
}

@media (max-width: 860px) {
  .cmd-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px 18px;
  }

  .cmd-row__out {
    justify-self: start;
  }
}

/* ---------------- pricing teaser ---------------- */

.pricing {
  padding-top: clamp(72px, 11vh, 120px);
}

.pricing .sec-lead {
  margin-bottom: 36px;
}

.price-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 8px;
}

@media (max-width: 767px) {
  .price-grid {
    grid-template-columns: 1fr;
  }
}

.price-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 26px 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.price-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-card__name {
  font-size: 15px;
  font-weight: 650;
  color: var(--vp-c-text-1);
}

.price-badge {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--success);
  background: var(--success-tint);
  border: 1px solid var(--success-border);
  border-radius: 999px;
  padding: 3px 10px;
}

.price-card__num {
  margin-top: 10px;
  font-family: var(--vp-font-family-mono);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.price-card__period {
  font-size: 14px;
  font-weight: 400;
  color: var(--vp-c-text-3);
  margin-left: 3px;
}

.price-card__quota {
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
}

.price-card__link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  font-size: 14px;
  font-weight: 550;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.price-card__link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* ---------------- close ---------------- */

.close {
  padding: clamp(110px, 16vh, 160px) 0 clamp(96px, 14vh, 140px);
  text-align: center;
}

.close__title {
  margin: 0 auto;
  max-width: 22em;
  font-size: clamp(1.9rem, 3.6vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.024em;
  line-height: 1.2;
  text-wrap: balance;
  color: var(--vp-c-text-1);
}

.close__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}

.close__note {
  margin: 30px 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

/* ---------------- hero entrance (the one authored motion moment) ---------------- */

@media (prefers-reduced-motion: no-preference) {
  .rise {
    animation: si-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .rise-1 { animation-delay: 0.05s; }
  .rise-2 { animation-delay: 0.15s; }
  .rise-3 { animation-delay: 0.25s; }
  .rise-4 { animation-delay: 0.35s; }
  .rise-5 { animation-delay: 0.45s; }
  .rise-6 { animation-delay: 0.55s; }
}

@keyframes si-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rise {
    animation: none;
  }
}
</style>
