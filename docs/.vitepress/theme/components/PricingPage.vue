<script setup lang="ts">
// ── data flow: conf is the only price source ──────────────────────────────
// Prices are defined once in the console repo's conf/*.json, exposed via
// GET /api/v1/pricing, and consumed here two ways:
//   1. build time — scripts/fetch-pricing.mjs bakes a snapshot
//      (pricing-data.json, generated, never hand-edited) so the SSG HTML
//      carries real prices for SEO / no-JS / Creem reviewers;
//   2. runtime — onMounted re-fetches and overwrites, so a conf edit reaches
//      the live site on the next page load without touching this repo.
// No price value lives in this file.
import {computed, onMounted, reactive, ref} from 'vue'
import {useData} from 'vitepress'
import {CONSOLE_LOGIN_URL} from '../console'
import ThemeIcon from './ThemeIcon.vue'
import initialPricing from '../pricing-data.json'

// AGENTS.md: locale must come from the build-time relativePath (SSR-safe),
// never from useData().lang / location inside slot-rendered components.
const {page} = useData()
const zh = computed(() => !page.value.relativePath.startsWith('en/'))

// Billing-period toggle — annual is the default landing state (issue #57).
const billingPeriod = ref<'year' | 'month'>('year')

const PRICING_API = 'https://console.serverlessinsight.com/api/v1/pricing'
const pricing = reactive(structuredClone(initialPricing))

onMounted(async () => {
  try {
    const res = await fetch(PRICING_API, {cache: 'no-store'})
    const json = await res.json()
    if (json?.code === 2000 && json.data?.plans?.team) Object.assign(pricing, json.data)
  } catch {
    // offline / API down — the baked snapshot stands in
  }
})

type Cents = number | null | undefined
const fmtUsd = (cents: Cents): string => {
  if (cents == null) return '—'
  const v = cents / 100
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2).replace(/0$/, '').replace(/\.$/, '')}`
}
// The annual plan's monthly equivalent truncates to one decimal ($65.8) —
// the approved card copy, deliberately not fmtUsd's 2-decimal rounding.
const fmtUsd1 = (dollars: number): string =>
  Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(1)}`
const fmtAmr = (n: number): number => (Number.isInteger(n) ? n : Math.round(n * 100) / 100)
const pl = (n: number | null | undefined, one: string, many: string): string =>
  `${n ?? 0} ${(n ?? 0) === 1 ? one : many}`

const dev = computed(() => pricing.plans.developer)
const team = computed(() => pricing.plans.team)

// Transitional shim: consoles older than the annualBaseCents payload don't
// carry the field yet — derive it from the checkout rule (pay 10 months,
// covered 12) until that release lands everywhere. Remove once it does.
const annualBaseCents = computed(
  () => team.value.annual_base_cents ?? (team.value.monthly_base_cents ?? 0) * 10,
)

const annualMonthlyUsd = computed(() =>
  fmtUsd1(Math.floor(((annualBaseCents.value ?? 0) / 1200) * 10) / 10),
)
const savePct = computed(() =>
  Math.round(
    (1 - (annualBaseCents.value ?? 0) / (((team.value.monthly_base_cents ?? 0) * 12) || 1)) * 100,
  ),
)
const monthsPaid = computed(() =>
  Math.round((annualBaseCents.value ?? 0) / (team.value.monthly_base_cents || 1)),
)

// AMR weights come from the same payload — the resource table is conf-driven.
const weightOf = (code: string): number => pricing.amr_weights?.[code] ?? 0
const groupIsFree = (pattern: string): boolean => {
  const prefix = pattern.replace(/\*$/, '')
  const keys = Object.keys(pricing.amr_weights ?? {}).filter((k) => k.startsWith(prefix))
  return keys.length > 0 && keys.every((k) => (pricing.amr_weights?.[k] ?? 0) === 0)
}

// ── derived display values ────────────────────────────────────────────────
const d = computed(() => {
  const devO = dev.value.overage?.amr_cents
  const teamO = team.value.overage?.amr_cents
  return {
    devFreeAmr: dev.value.free_amr ?? 0,
    devMembers: dev.value.free_members ?? 0,
    devWorkspaces: dev.value.free_workspaces ?? 0,
    devOverageUsd: fmtUsd(devO),
    devBudgetPct: dev.value.budget_cap?.default_alert_threshold_percent ?? 80,
    teamFreeAmr: team.value.free_amr ?? 0,
    teamMembers: team.value.free_members ?? 0,
    teamWorkspaces: team.value.free_workspaces ?? 0,
    teamOverageUsd: fmtUsd(teamO),
    teamMonthlyUsd: fmtUsd(team.value.monthly_base_cents),
    teamValueUsd: fmtUsd((devO ?? 0) * (team.value.free_amr ?? 0)),
    team80Usd: fmtUsd(Math.round(((team.value.monthly_base_cents ?? 0) * (dev.value.budget_cap?.default_alert_threshold_percent ?? 80)) / 100)),
    annualUsd: fmtUsd(annualBaseCents.value),
    annualMonthlyUsd: annualMonthlyUsd.value,
    savePct: savePct.value,
    monthsPaid: monthsPaid.value,
    workspaceWeight: pricing.workspace_weight_amr ?? 1,
    exampleAmr: fmtAmr(weightOf('ALIYUN_FC3_FUNCTION') + weightOf('ALIYUN_OSS_BUCKET') + weightOf('ALIYUN_TABLESTORE_TABLE')),
  }
})

const savePctLabel = computed(() => (zh.value ? `省 ${savePct.value}%` : `−${savePct.value}%`))

const pick = (v: {zh: string; en: string}) => (zh.value ? v.zh : v.en)

// ── plan cards ────────────────────────────────────────────────────────────
const tx = computed(() => {
  const v = d.value
  return {
    overageDev: {zh: `超出后 ${v.devOverageUsd} / AMR（需预存余额）`, en: `${v.devOverageUsd} / AMR beyond quota (prepaid balance required)`},
    overageTeam: {zh: `超出后 ${v.teamOverageUsd} / AMR`, en: `${v.teamOverageUsd} / AMR beyond quota`},
    overageCustom: {zh: '超额单价按合同约定', en: 'Custom overage rate'},
    members1: {zh: `${v.devMembers} 名成员（硬配额）`, en: `${pl(v.devMembers, 'member')} (hard quota)`},
    members10: {zh: `${v.teamMembers} 名成员（硬配额）`, en: `${pl(v.teamMembers, 'member')} (hard quota)`},
    membersUnlimited: {zh: '成员不限', en: 'Unlimited members'},
    workspaces1: {zh: `含 ${v.devWorkspaces} 个工作区`, en: `${pl(v.devWorkspaces, 'workspace')} included`},
    workspaces5: {zh: `含 ${v.teamWorkspaces} 个工作区`, en: `${pl(v.teamWorkspaces, 'workspace')} included`},
    workspacesUnlimited: {zh: '工作区不限', en: 'Unlimited workspaces'},
    workspaceOverage: {zh: `超额工作区 +${v.workspaceWeight} AMR / 个`, en: `+${v.workspaceWeight} AMR per extra workspace`},
    autoDeployOn: {zh: '自动部署 ✓', en: 'Auto deploy ✓'},
    autoDeployOff: {zh: '自动部署 ✗', en: 'Auto deploy ✗'},
    cloudReadonly: {zh: '多云聚合视图 · 只读透传', en: 'Multi-cloud view · read-only'},
    cloudFull: {zh: '多云聚合视图 · 统一跨云搜索', en: 'Multi-cloud view · unified search'},
    budgetHard: {zh: `预算控制 · 硬上限（${v.devBudgetPct}% 告警）`, en: `Budget · hard cap (${v.devBudgetPct}% alert)`},
    budgetAlert: {zh: '预算控制 · 超额告警', en: 'Budget · overspend alerts'},
    supportCommunity: {zh: '社区支持', en: 'Community support'},
    supportTicket: {zh: '工单支持 · 1 个工作日', en: 'Tickets · 1 business day'},
    supportTam: {zh: '专属 TAM · 7×24', en: 'Dedicated TAM · 7×24'},
    teamValue: {
      zh: `含 ${v.teamFreeAmr} AMR — 按 Developer 按量价折算价值 ${v.teamValueUsd}，仅需 ${v.teamMonthlyUsd}`,
      en: `${v.teamFreeAmr} AMR included — worth ${v.teamValueUsd} at Developer pay-as-you-go rates, only ${v.teamMonthlyUsd}`,
    },
  }
})

const PLANS = computed(() => [
  {
    key: 'developer',
    featured: false,
    cta: {zh: '免费开始', en: 'Start for free'},
    href: CONSOLE_LOGIN_URL,
    price: fmtUsd(dev.value.monthly_base_cents),
    priceYear: '',
    period: {zh: '/月', en: '/mo'},
    periodYear: '',
    quota: {zh: `含 ${d.value.devFreeAmr} AMR`, en: `${d.value.devFreeAmr} AMR included`},
    features: () => [
      {text: pick(tx.value.overageDev), icon: 'coins'},
      {text: pick(tx.value.members1), icon: 'users'},
      {text: pick(tx.value.workspaces1), icon: 'layout-grid'},
      {text: pick(tx.value.workspaceOverage), icon: 'plus'},
      {text: pick(tx.value.autoDeployOff), icon: 'rocket', dim: true},
      {text: pick(tx.value.cloudReadonly), icon: 'globe'},
      {text: pick(tx.value.budgetHard), icon: 'gauge'},
      {text: pick(tx.value.supportCommunity), icon: 'life-buoy'},
    ],
  },
  {
    key: 'team',
    featured: true,
    cta: {zh: '升级到 Team', en: 'Upgrade to Team'},
    href: CONSOLE_LOGIN_URL,
    price: d.value.teamMonthlyUsd,
    priceYear: d.value.annualMonthlyUsd,
    period: {zh: '/月', en: '/mo'},
    periodYear: {zh: `/月 · 按年计费 ${d.value.annualUsd}`, en: `/mo · ${d.value.annualUsd} billed yearly`},
    quota: {zh: `含 ${d.value.teamFreeAmr} AMR`, en: `${d.value.teamFreeAmr} AMR included`},
    features: () => [
      {text: pick(tx.value.overageTeam), icon: 'coins'},
      {text: pick(tx.value.members10), icon: 'users'},
      {text: pick(tx.value.workspaces5), icon: 'layout-grid'},
      {text: pick(tx.value.workspaceOverage), icon: 'plus'},
      {text: pick(tx.value.autoDeployOn), icon: 'rocket'},
      {text: pick(tx.value.cloudFull), icon: 'globe'},
      {text: pick(tx.value.budgetAlert), icon: 'gauge'},
      {text: pick(tx.value.supportTicket), icon: 'life-buoy'},
    ],
  },
  {
    key: 'enterprise',
    featured: false,
    cta: {zh: '联系销售', en: 'Contact sales'},
    href: 'mailto:support@wentsen.com?subject=Enterprise',
    price: null,
    priceYear: '',
    period: {zh: '', en: ''},
    periodYear: '',
    quota: {zh: 'AMR 额度按合同约定', en: 'AMR allowance by contract'},
    features: () => [
      {text: pick(tx.value.overageCustom), icon: 'coins'},
      {text: pick(tx.value.membersUnlimited), icon: 'users'},
      {text: pick(tx.value.workspacesUnlimited), icon: 'layout-grid'},
      {text: pick(tx.value.autoDeployOn), icon: 'rocket'},
      {text: pick(tx.value.cloudFull), icon: 'globe'},
      {text: pick(tx.value.budgetAlert), icon: 'gauge'},
      {text: pick(tx.value.supportTam), icon: 'life-buoy'},
    ],
  },
])

const saveLine = computed(() => ({
  zh: `一次支付 ${d.value.annualUsd}/年，相当于按 ${d.value.monthsPaid} 个月计费 — 省 ${d.value.savePct}%`,
  en: `Pay ${d.value.annualUsd}/year — billed as ${d.value.monthsPaid} months, save ${d.value.savePct}%`,
}))

// ── resource table (weights from the payload, labels stay editorial) ─────
const BILLABLE = [
  {name: '函数计算 FC3', code: 'ALIYUN_FC3_FUNCTION'},
  {name: '云函数 SCF', code: 'SCF_FUNCTION'},
  {name: '函数服务 VeFaaS', code: 'VOLCENGINE_VEFAAS_FUNCTION'},
  {name: 'API 网关分组', code: 'ALIYUN_APIGW_GROUP'},
  {name: '对象存储 OSS', code: 'ALIYUN_OSS_BUCKET'},
  {name: '对象存储 COS', code: 'COS_BUCKET'},
  {name: '对象存储 TOS', code: 'VOLCENGINE_TOS_BUCKET'},
  {name: 'RDS Serverless', code: 'ALIYUN_RDS_SERVERLESS'},
  {name: 'TDSQL-C Serverless', code: 'TDSQL_C_SERVERLESS'},
  {name: 'ES Serverless', code: 'ALIYUN_ES_SERVERLESS'},
  {name: '表格存储 Tablestore', code: 'ALIYUN_TABLESTORE_TABLE'},
].filter((r) => pricing.amr_weights?.[r.code] != null)

// Free groups: a wildcard over the conf weight map — the row only renders as
// "always free" while every matching resource has weight 0 in conf.
const FREE_GROUPS = [
  {name: '日志服务 SLS Project / Logstore / Index', code: 'ALIYUN_SLS_*'},
  {name: '日志服务 CLS 日志集 / 日志主题', code: 'TENCENT_CLS_*'},
  {name: 'API 网关 API / 部署 / 日志配置', code: 'ALIYUN_APIGW_*'},
  {name: 'CDN 加速域名（bucket.cdn 产物）', code: 'ALIYUN_CDN_DISTRIBUTION'},
  {name: 'NAS 文件系统 / 挂载点 / 访问组', code: 'ALIYUN_NAS_*'},
].filter((g) => groupIsFree(g.code))

const freeRows = FREE_GROUPS

// ── "what one AMR covers" — each card's weight reads from the payload ────
const COVERS = computed(() => [
  {icon: 'zap', name: {zh: '函数实例', en: 'Function instance'}, detail: {zh: 'FC3 · SCF · VeFaaS', en: 'FC3 · SCF · VeFaaS'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}, amr: fmtAmr(weightOf('ALIYUN_FC3_FUNCTION'))},
  {icon: 'globe', name: {zh: 'API 网关分组', en: 'API gateway group'}, detail: {zh: '每个分组', en: 'per group'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}, amr: fmtAmr(weightOf('ALIYUN_APIGW_GROUP'))},
  {icon: 'package', name: {zh: '对象存储桶', en: 'Object storage bucket'}, detail: {zh: 'OSS · COS · TOS', en: 'OSS · COS · TOS'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}, amr: fmtAmr(weightOf('ALIYUN_OSS_BUCKET'))},
  {icon: 'database', name: {zh: 'Serverless 数据库', en: 'Serverless database'}, detail: {zh: 'RDS · TDSQL-C · ES', en: 'RDS · TDSQL-C · ES'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}, amr: fmtAmr(weightOf('ALIYUN_RDS_SERVERLESS'))},
  {icon: 'table', name: {zh: '数据表', en: 'Data table'}, detail: {zh: 'Tablestore', en: 'Tablestore'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}, amr: fmtAmr(weightOf('ALIYUN_TABLESTORE_TABLE'))},
  {icon: 'layout-grid', name: {zh: '超额工作区', en: 'Extra workspace'}, detail: {zh: '超出含入数的部分', en: 'beyond the included count'}, per: {zh: '/ 个 · 月', en: '/ workspace · mo'}, amr: fmtAmr(pricing.workspace_weight_amr ?? 1)},
])

// ── page copy ─────────────────────────────────────────────────────────────
const T = computed(() => {
  const v = d.value
  return {
    heroTitle: {zh: '简单定价，随您扩展', en: 'Simple pricing that scales with you'},
    heroSub: {
      zh: `万物一个单位：AMR。您在 yml 中声明的每个实体实例 — 函数、网关、桶、库、表 — 均为 1 AMR。Developer 免费含 ${v.devFreeAmr} AMR 起步，团队成长时升级 Team。`,
      en: `One unit for everything: AMR. Each instance of a declared entity — function, gateway, bucket, database, table — weighs 1 AMR. Start free on Developer with ${v.devFreeAmr} AMR.`,
    },
    planTitle: {zh: '选择版本', en: 'Choose your plan'},
    priceTableTitle: {zh: '资源价格', en: 'Resource pricing'},
    priceTableSub: {zh: '按实例计费 — 每个声明实体实例每月消耗其权重的 AMR。', en: 'Billed per declared-entity instance — each instance costs its weight in AMR per month.'},
    resource: {zh: '资源', en: 'Resource'},
    amrCol: {zh: 'AMR / 实例 · 月', en: 'AMR / instance · mo'},
    free: {zh: '免费', en: 'Free'},
    zeroGroup: {zh: '0 AMR — 以下永远免费', en: '0 AMR — the ones below are always free'},
    amrNote: {
      zh: `超出额度后 1 AMR 单价：Developer ${v.devOverageUsd} · Team ${v.teamOverageUsd}；免费额度内 $0。价格以美元（USD）计。`,
      en: `1 AMR beyond quota: Developer ${v.devOverageUsd} · Team ${v.teamOverageUsd} — $0 within the free quota. Prices in USD.`,
    },
    enterpriseNote: {zh: 'Enterprise 单价按合同约定（≤ 目录价）。', en: 'Enterprise rates are contract-defined (at or below list price).'},
    coversTitle: {zh: '1 个 AMR 可以是什么', en: 'What one AMR covers'},
    coversIntro: {zh: '1 个 AMR 可兑换以下任意一项（按月计）。', en: 'Each AMR covers any one of the below for a month.'},
    zeroCardName: {zh: '自动生成的附属资源', en: 'Auto-generated plumbing'},
    zeroCardDetail: {zh: '日志 · 角色 · API 部署 · 域绑定 · 挂载点', en: 'logs · roles · API deployments · domains · mounts'},
    zeroBadge: {zh: '0 AMR · 永远免费', en: '0 AMR · always free'},
    rulesTitle: {zh: '计费规则', en: 'Billing rules'},
    rules: {
      zh: [
        '阶段存活 ≥ 14 天且当月有成功部署 → 计入 AMR',
        'personal-* 阶段永久免费（每组织最多 2 个）',
        '每月 1 日 00:00 UTC 结算；免费额度内不产生费用',
        `Developer 预算：${v.devBudgetPct}% 告警、100% 阻断新部署（现有资源不受影响）`,
        '月中升级按天折算；降级次月 1 日生效',
      ],
      en: [
        'A stage counts when alive ≥ 14 days AND it had a successful deployment that month',
        'personal-* stages are permanently free (up to 2 per org)',
        'Settled monthly on the 1st at 00:00 UTC — nothing is charged within the free quota',
        `Developer budget: alert at ${v.devBudgetPct}%, block new deploys at 100% — existing resources are never touched`,
        'Mid-month upgrades prorate by day; downgrades take effect on the 1st of the next month',
      ],
    },
    exampleNote: {
      zh: `Developer 免费额度 ${v.devFreeAmr} AMR/月内为 $0；超出后按版本单价计费。价格以美元（USD）计。`,
      en: `$0 within the Developer free quota of ${v.devFreeAmr} AMR/mo; beyond it the plan rate applies. Prices in USD.`,
    },
    faqTitle: {zh: '常见问题', en: 'FAQ'},
    faq: {
      zh: [
        ['Developer 版真的免费吗？', `是的 — 免费额度内（${v.devFreeAmr} AMR、${v.devMembers} 成员、${v.devWorkspaces} 工作区）永久免费，无需预付。超出后可充值余额按量扣费，或设置预算硬上限控制成本。`],
        ['什么时候升级 Team 更划算？', `Team ${v.teamMonthlyUsd}/月含 ${v.teamFreeAmr} AMR — 按 Developer 按量价（${v.devOverageUsd}/AMR）折算价值 ${v.teamValueUsd}。当月账单接近 ${v.team80Usd}（Team 的 ${v.devBudgetPct}%）时控制台会自动提示升级；超出后每 AMR 仅 ${v.teamOverageUsd}，是 Developer 的一半。`],
        ['不绑卡如何付款？', '支持在线支付：在控制台发起充值/升级，通过 Checkout 页用国际信用卡或常见钱包完成支付，余额实时到账。'],
        ['免费额度用完又不充值会怎样？', `不会有任何破坏。现有资源继续运行，但当 AMR 用量（含超额工作区）超过免费额度后，新部署将被暂停；充值余额后自动恢复。成员是硬配额：Developer 第 ${v.devMembers + 1} 名成员需要升级。`],
        ['可以降级回 Developer 吗？', '可以 — 在控制台 Billing 页自助操作，次月 1 日生效。届时若用量超出免费额度且余额不足，新部署将被暂停；充值后自动恢复。'],
        ['有年付选项吗？', `有 — Team 年付 ${v.annualUsd}/年（按 ${v.monthsPaid} 个月计费，省 ${v.savePct}%），在控制台账单页购买，自下个账期起覆盖 12 个月基础月费；覆盖期最后 30 天内可开启自动续费（从余额扣款），续费周期开始前也可取消并全额退回余额。`],
      ],
      en: [
        ['Is the Developer plan really free?', `Yes — within the free quota (${v.devFreeAmr} AMR, ${v.devMembers} member, ${v.devWorkspaces} workspace) it is free forever, no credit card needed. Beyond the quota: bind a payment method for pay-as-you-go, or set a hard budget cap.`],
        ['When does upgrading to Team pay off?', `Team costs ${v.teamMonthlyUsd}/month with ${v.teamFreeAmr} AMR included — worth ${v.teamValueUsd} at the Developer pay-as-you-go rate (${v.devOverageUsd}/AMR). When your monthly bill approaches ${v.team80Usd} (${v.devBudgetPct}% of Team), the console suggests upgrading; beyond the included ${v.teamFreeAmr} AMR each additional AMR is only ${v.teamOverageUsd}.`],
        ['How does payment work without a card?', 'Online payment is built in: start a topup or upgrade in the console and pay on the hosted Checkout page with an international card or a common wallet — the balance is credited instantly.'],
        ['What happens when I hit the free quota without paying?', `Nothing breaks. Existing resources keep running, but new deployments are blocked once AMR usage (including extra workspaces) passes the free quota until a payment method is bound. Members are a hard quota: the ${pl(v.devMembers + 1, 'member')} needs an upgrade.`],
        ['Can I downgrade back to Developer?', 'Yes — self-service from the console Billing tab, effective the first day of the next month. If usage then exceeds the free quota without a bound card, new deployments are blocked.'],
        ['Is there an annual option?', `Yes — Team annual is ${v.annualUsd}/yr (billed as ${v.monthsPaid} months, save ${v.savePct}%). Purchase it from the console Billing tab: coverage starts the next billing period and lasts 12 months of the base fee. Auto-renewal from your balance can be enabled during the last 30 days, and a renewed period can be cancelled for a full balance refund before it begins.`],
      ],
    },
    ctaBand: {zh: '准备好开始了吗？', en: 'Ready to get started?'},
    ctaBandSub: {
      zh: '免费开始，团队成长时再升级 — 一分钟部署您的第一个函数。',
      en: 'Start free, upgrade when your team grows — deploy your first function in a minute.',
    },
    ctaFree: {zh: '免费开始', en: 'Start for free'},
    ctaContact: {zh: '联系销售', en: 'Contact sales'},
  }
})

const rules = computed(() => (zh.value ? T.value.rules.zh : T.value.rules.en))
const faq = computed(() => (zh.value ? T.value.faq.zh : T.value.faq.en))
</script>



<template>
  <div class="pp">
    <!-- hero -->
    <section class="pp-hero">
      <h1 class="pp-title">{{ pick(T.heroTitle) }}</h1>
      <p class="pp-sub">{{ pick(T.heroSub) }}</p>
    </section>

    <!-- plan cards -->

    <section class="pp-plans">
      <h2 class="pp-h2 pp-plans-title">{{ pick(T.planTitle) }}</h2>
      <div class="pp-toggle-wrap">
      <div class="pp-toggle" role="group" :aria-label="zh ? '计费周期' : 'Billing period'">
        <button
          type="button"
          :class="['pp-toggle-btn', {'pp-toggle-btn--on': billingPeriod === 'month'}]"
          @click="billingPeriod = 'month'"
        >{{ zh ? '月付' : 'Monthly' }}</button>
        <button
          type="button"
          :class="['pp-toggle-btn', {'pp-toggle-btn--on': billingPeriod === 'year'}]"
          @click="billingPeriod = 'year'"
        >{{ zh ? '年付' : 'Annual' }}<span class="pp-toggle-save">{{ savePctLabel }}</span></button>
      </div>
      </div>
      <div
        v-for="(plan, i) in PLANS"
        :key="plan.key"
        class="pp-card"
        :class="{'pp-card--featured': plan.featured}"
        :style="{'--i': i}"
      >
        <span v-if="plan.featured" class="pp-pop"><span class="pp-dot"></span>{{ zh ? '最受欢迎' : 'Most popular' }}</span>
        <h3 class="pp-card-name">{{ plan.key }}</h3>
        <div class="pp-price">
          <template v-if="plan.price">
            <template v-if="plan.key === 'team' && billingPeriod === 'year'">
              <span class="pp-price-num">{{ plan.priceYear }}</span>
              <span class="pp-price-period">{{ pick(plan.periodYear) }}</span>
            </template>
            <template v-else>
              <span class="pp-price-num">{{ plan.price }}</span>
              <span class="pp-price-period">{{ pick(plan.period) }}</span>
            </template>
          </template>
          <template v-else>
            <span class="pp-price-num">{{ zh ? '联系销售' : 'Contact sales' }}</span>
          </template>
        </div>
        <p class="pp-quota">⚡ {{ pick(plan.quota) }}</p>
        <p v-if="plan.key === 'team' && billingPeriod === 'year'" class="pp-save">
          {{ pick(saveLine) }}
        </p>
        <p v-if="plan.key === 'team'" class="pp-worth">{{ pick(tx.teamValue) }}</p>
        <ul class="pp-feats">
          <li v-for="f in plan.features()" :key="f.text" :class="{'pp-feat--dim': f.dim}">
            <ThemeIcon class="pp-feat-icon" :name="f.icon" :size="14" /><span>{{ f.text }}</span>
          </li>
        </ul>
        <a class="pp-btn" :class="{'pp-btn--featured': plan.featured}" :href="plan.href">
          {{ pick(plan.cta) }}
        </a>
      </div>
    </section>

    <!-- resource price table -->
    <section class="pp-section">
      <h2 class="pp-h2">{{ pick(T.priceTableTitle) }}</h2>
      <p class="pp-h2sub">{{ pick(T.priceTableSub) }}</p>
      <div class="pp-tablewrap">
        <table class="pp-table">
          <thead>
            <tr><th>{{ pick(T.resource) }}</th><th>{{ pick(T.amrCol) }}</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ zh ? '工作区（超含入数）' : 'Workspace (beyond the included count)' }} <code>workspace</code></td>
              <td><b>+{{ pricing.workspace_weight_amr }}</b></td>
            </tr>
            <tr v-for="r in BILLABLE" :key="r.code">
              <td>{{ zh ? r.name : r.code }} <code>{{ r.code }}</code></td>
              <td><b>{{ weightOf(r.code) }}</b></td>
            </tr>
            <tr class="pp-zerohead">
              <td colspan="2">{{ pick(T.zeroGroup) }}</td>
            </tr>
            <tr v-for="g in freeRows" :key="g.name" class="pp-zerorow">
              <td>
                {{ g.name }}
                <code>{{ g.code }}</code>
              </td>
              <td><span class="pp-freebadge">✓ 0 · {{ pick(T.free) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="pp-note">{{ pick(T.amrNote) }}</p>
      <p class="pp-note">{{ pick(T.enterpriseNote) }}</p>
    </section>

    <!-- how billing works -->
    <section class="pp-section">
      <h2 class="pp-h2">{{ pick(T.coversTitle) }}</h2>
      <p class="pp-h2sub">{{ pick(T.coversIntro) }}</p>
      <div class="pp-covers">
        <div v-for="c in COVERS" :key="c.name.en" class="pp-cover-card">
          <div class="pp-cover-name"><ThemeIcon class="pp-cover-icon" :name="c.icon" :size="15" /> {{ pick(c.name) }}</div>
          <div class="pp-cover-detail">{{ pick(c.detail) }}</div>
          <div class="pp-cover-amr">{{ c.amr }} AMR <span>{{ pick(c.per) }}</span></div>
        </div>
        <div class="pp-cover-card pp-cover-card--free">
          <div class="pp-cover-name"><ThemeIcon class="pp-cover-icon" name="shield-check" :size="15" /> {{ pick(T.zeroCardName) }}</div>
          <div class="pp-cover-detail">{{ pick(T.zeroCardDetail) }}</div>
          <div class="pp-cover-amr pp-cover-amr--free">{{ pick(T.zeroBadge) }}</div>
        </div>
      </div>

      <div class="pp-rules">
        <div class="pp-rule-card">
          <h3 class="pp-h3icon"><ThemeIcon name="calculator" :size="15" /> {{ zh ? '算一笔账' : 'Worked example' }}</h3>
          <p class="pp-example">1 × {{ zh ? '函数' : 'function' }} + 1 × {{ zh ? '桶' : 'bucket' }} + 1 × {{ zh ? '数据表' : 'table' }} = {{ d.exampleAmr }} AMR</p>
          <p class="pp-note">{{ pick(T.exampleNote) }}</p>
        </div>
        <div class="pp-rule-card">
          <h3 class="pp-h3icon"><ThemeIcon name="list-checks" :size="15" /> {{ pick(T.rulesTitle) }}</h3>
          <ul>
            <li v-for="r in rules" :key="r">{{ r }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="pp-section">
      <h2 class="pp-h2">{{ pick(T.faqTitle) }}</h2>
      <div class="pp-faq">
        <details v-for="([q, a], i) in faq" :key="i" class="pp-faq-item">
          <summary><span class="pp-qnum">Q{{ i + 1 }}</span>{{ q }}</summary>
          <p>{{ a }}</p>
        </details>
      </div>
    </section>

    <!-- bottom CTA -->
    <section class="pp-ctaband">
      <h2>{{ pick(T.ctaBand) }}</h2>
      <p>{{ pick(T.ctaBandSub) }}</p>
      <div class="pp-ctaband-btns">
        <a class="pp-btn pp-btn--lg" :href="CONSOLE_LOGIN_URL">{{ pick(T.ctaFree) }}</a>
        <a class="pp-btn pp-btn--ghost pp-btn--lg" href="mailto:support@wentsen.com">{{ pick(T.ctaContact) }}</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pp-toggle-wrap{grid-column: 1 / -1; display: flex; justify-content: center; margin-bottom: 8px}
.pp-toggle{display:inline-flex;gap:4px;padding:4px;border:1px solid var(--vp-c-divider);border-radius:999px;background:var(--vp-c-bg-soft)}
.pp-toggle-btn{border:none;background:transparent;color:var(--vp-c-text-2);font-size:14px;font-weight:500;padding:6px 18px;border-radius:999px;cursor:pointer;transition:color .2s, background-color .2s}
.pp-toggle-btn--on{background:var(--vp-c-bg);color:var(--vp-c-text-1);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.pp-toggle-save{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;color:#fff;background:var(--vp-c-brand-1)}
.pp-save{margin-top:2px;font-size:13px;color:var(--vp-c-text-2)}

.pp { max-width: 1152px; margin: 0 auto; padding: 24px 24px 80px; }
.pp-title { font-size: 2.75rem; font-weight: 800; letter-spacing: -0.03em; text-align: center; margin-top: 32px; }
.pp-sub { max-width: 720px; margin: 14px auto 0; text-align: center; color: var(--vp-c-text-2); font-size: 1.05rem; line-height: 1.7; }

.pp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 44px; }
.pp-plans-title { grid-column: 1 / -1; }
@media (max-width: 900px) { .pp-plans { grid-template-columns: 1fr; } }
.pp-card { position: relative; display: flex; flex-direction: column; border: 1px solid var(--vp-c-divider); border-radius: 16px; padding: 24px; background: var(--vp-c-bg); }
.pp-card--featured { border-color: var(--vp-c-brand-1); box-shadow: 0 8px 32px rgba(102, 64, 191, 0.14); }
.pp-pop { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 999px; color: var(--vp-c-brand-1); border: 1px solid var(--vp-c-brand-1); background: var(--vp-c-bg); white-space: nowrap; }
.pp-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--vp-c-brand-1); }
.pp-card-name { font-size: 1rem; font-weight: 650; text-transform: capitalize; }
.pp-price { margin-top: 10px; }
.pp-price-num { font-size: 2rem; font-weight: 750; letter-spacing: -0.02em; }
.pp-price-period { font-size: 0.85rem; color: var(--vp-c-text-2); margin-left: 2px; }
.pp-quota { margin-top: 12px; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; }
.pp-worth { margin-top: 6px; font-size: 0.78rem; color: var(--vp-c-text-2); line-height: 1.55; }

/* Authored focal motion: the ladder settles, then the recommended rung lights
   up. One-time load entrance for this section only; default state stays fully
   visible so no-JS / failed-animation renders never hide content. */
@keyframes pp-settle {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@keyframes pp-glow {
  from { box-shadow: 0 8px 32px rgba(102, 64, 191, 0); }
  to { box-shadow: 0 8px 32px rgba(102, 64, 191, 0.14); }
}
@keyframes pp-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: no-preference) {
  .pp-plans-title { animation: pp-settle 300ms cubic-bezier(0.16, 1, 0.3, 1) both; }
  .pp-plans .pp-card {
    animation: pp-settle 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(60ms + var(--i, 0) * 80ms);
  }
  .pp-plans .pp-card--featured {
    animation-name: pp-settle, pp-glow;
    animation-duration: 420ms, 500ms;
    animation-delay: calc(60ms + var(--i, 0) * 80ms), 140ms;
  }
  .pp-worth { animation: pp-fade 300ms ease both; animation-delay: 420ms; }
}

@media (prefers-reduced-motion: reduce) {
  .pp-plans-title, .pp-plans .pp-card, .pp-plans .pp-card--featured, .pp-worth { animation: none; }
}
.pp-feats { list-style: none; margin: 16px 0 0; padding: 14px 0 0; border-top: 1px solid var(--vp-c-divider); flex: 1; display: flex; flex-direction: column; gap: 10px; font-size: 0.875rem; }
.pp-feats li { display: flex; align-items: flex-start; gap: 8px; font-weight: 500; }
.pp-feats li.pp-feat--dim { color: var(--vp-c-text-2); font-weight: 400; }
.pp-feat-icon { flex: none; color: var(--vp-c-brand-1); margin-top: 2px; }
.pp-btn { display: flex; align-items: center; justify-content: center; height: 44px; margin-top: 18px; border-radius: 10px; background: var(--vp-button-brand-bg); color: var(--vp-button-brand-text); font-weight: 650; font-size: 0.9rem; text-decoration: none; transition: opacity 0.2s ease, transform 0.12s ease; }
.pp-btn:hover { opacity: 0.9; color: var(--vp-button-brand-text); }
.pp-btn:active { transform: scale(0.98); }
.pp-btn--lg { height: 46px; padding: 0 26px; }
.pp-btn--ghost { background: transparent; border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-1); }
/* The featured plan's CTA is the page's single solid-violet brand moment. */
.pp-btn--featured { background: #6640BF; color: #ffffff; }
.dark .pp-btn--featured { background: #A384EB; color: #170F2E; }

.pp-section { margin-top: 72px; }
.pp-h2 { font-size: 1.6rem; font-weight: 750; letter-spacing: -0.02em; }
.pp-h2sub { color: var(--vp-c-text-2); font-size: 0.9rem; margin-top: 6px; }
.pp-tablewrap { margin-top: 20px; border: 1px solid var(--vp-c-divider); border-radius: 12px; overflow-x: auto; }
.pp-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.pp-table th { text-align: left; font-weight: 500; color: var(--vp-c-text-2); padding: 10px 16px; background: var(--vp-c-bg-alt); }
.pp-table th:last-child, .pp-table td:last-child { text-align: right; }
.pp-table td { padding: 9px 16px; border-top: 1px solid var(--vp-c-divider); }
.pp-table code { margin-left: 8px; font-size: 0.72rem; opacity: 0.55; font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
.pp-zerohead td { font-size: 0.75rem; font-weight: 600; color: var(--success); }
.pp-zerorow td:first-child { color: var(--vp-c-text-2); }
.pp-freebadge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 999px; background: var(--success-tint); color: var(--success); }
.pp-note { margin-top: 10px; font-size: 0.78rem; color: var(--vp-c-text-2); }

.pp-covers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px; }
@media (max-width: 900px) { .pp-covers { grid-template-columns: 1fr; } }
.pp-cover-card { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 16px; }
.pp-cover-name { font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 7px; }
.pp-cover-icon { color: var(--vp-c-brand-1); flex: none; }
.pp-h3icon { display: flex; align-items: center; gap: 7px; }
.pp-h3icon svg { color: var(--vp-c-brand-1); flex: none; }
.pp-cover-detail { font-size: 0.75rem; color: var(--vp-c-text-2); margin-top: 4px; }
.pp-cover-amr { margin-top: 12px; font-size: 1.1rem; font-weight: 750; }
.pp-cover-amr span { font-size: 0.72rem; font-weight: 400; color: var(--vp-c-text-2); }
.pp-cover-card--free { border-color: var(--success-border); background: var(--success-tint-soft); }
.pp-cover-card--free .pp-cover-name, .pp-cover-card--free .pp-cover-amr { color: var(--success); }

.pp-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
@media (max-width: 900px) { .pp-rules { grid-template-columns: 1fr; } }
.pp-rule-card { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 18px; }
.pp-rule-card h3 { font-size: 0.925rem; font-weight: 650; }
.pp-example { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.825rem; margin-top: 12px; }
.pp-rule-card ul { list-style: none; margin-top: 10px; }
.pp-rule-card li { font-size: 0.85rem; color: var(--vp-c-text-2); padding: 5px 0; display: flex; gap: 8px; }
.pp-rule-card li::before { content: '✓'; color: var(--vp-c-brand-1); flex: none; }

.pp-faq { margin-top: 20px; display: flex; flex-direction: column; gap: 16px; }
.pp-faq-item { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 10px 18px; interpolate-size: allow-keywords; }
/* native <details> keeps working with zero script — browsers without
   ::details-content support simply open instantly */
.pp-faq-item::details-content { block-size: 0; overflow: clip; opacity: 0; content-visibility: hidden; transition: block-size 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, content-visibility 300ms allow-discrete; }
.pp-faq-item[open]::details-content { block-size: auto; opacity: 1; content-visibility: visible; }
.pp-faq-item summary { min-height: 44px; padding: 10px 0; cursor: pointer; font-weight: 600; font-size: 0.925rem; list-style: none; }
.pp-faq-item summary::-webkit-details-marker { display: none; }
.pp-qnum { color: var(--vp-c-brand-1); font-weight: 700; margin-right: 10px; }
.pp-faq-item p { margin-top: 10px; font-size: 0.875rem; color: var(--vp-c-text-2); line-height: 1.7; }

.pp-ctaband { margin-top: 72px; text-align: center; border: 1px solid var(--vp-c-divider); border-radius: 18px; padding: 44px 24px; background: linear-gradient(135deg, rgba(143, 106, 231, 0.08), rgba(102, 64, 191, 0.05)); }
.pp-ctaband h2 { font-size: 1.5rem; font-weight: 750; letter-spacing: -0.02em; }
.pp-ctaband p { color: var(--vp-c-text-2); margin-top: 8px; }
.pp-ctaband-btns { margin-top: 20px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }

@media (prefers-reduced-motion: reduce) {
  .pp-faq-item::details-content { transition: opacity 120ms ease; }
  .pp-btn:active { transform: none; }
}
</style>
