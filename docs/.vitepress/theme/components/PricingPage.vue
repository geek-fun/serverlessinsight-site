<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import {CONSOLE_LOGIN_URL} from '../console'
import ThemeIcon from './ThemeIcon.vue'

const {lang} = useData()
const zh = computed(() => lang.value !== 'en')

/**
 * Static pricing snapshot — keep in sync with `conf/*.json` → `billing` in
 * console-serverlessinsight (the runtime source of truth). Marketing copy is
 * bilingual; numbers are the V2 calibration (issue #40).
 */
const PLANS = [
  {
    key: 'developer',
    price: {zh: '¥0', en: '¥0'},
    period: {zh: '/月', en: '/mo'},
    quota: {zh: '含 10 AMR', en: '10 AMR included'},
    featured: false,
    cta: {zh: '免费开始', en: 'Start for free'},
    href: CONSOLE_LOGIN_URL,
    features: (t: typeof TEXT) => [
      {text: pick(t.overageDev), icon: 'coins'},
      {text: pick(t.members1), icon: 'users'},
      {text: pick(t.workspaces1), icon: 'layout-grid'},
      {text: pick(t.workspaceOverage), icon: 'plus'},
      {text: pick(t.autoDeployOff), icon: 'rocket', dim: true},
      {text: pick(t.cloudReadonly), icon: 'globe'},
      {text: pick(t.budgetHard), icon: 'gauge'},
      {text: pick(t.supportCommunity), icon: 'life-buoy'},
    ],
  },
  {
    key: 'team',
    price: {zh: '¥399', en: '¥399'},
    period: {zh: '/月', en: '/mo'},
    quota: {zh: '含 100 AMR', en: '100 AMR included'},
    featured: true,
    cta: {zh: '升级到 Team', en: 'Upgrade to Team'},
    href: CONSOLE_LOGIN_URL,
    features: (t: typeof TEXT) => [
      {text: pick(t.overageTeam), icon: 'coins'},
      {text: pick(t.members10), icon: 'users'},
      {text: pick(t.workspaces5), icon: 'layout-grid'},
      {text: pick(t.workspaceOverage), icon: 'plus'},
      {text: pick(t.autoDeployOn), icon: 'rocket'},
      {text: pick(t.cloudFull), icon: 'globe'},
      {text: pick(t.budgetAlert), icon: 'gauge'},
      {text: pick(t.supportTicket), icon: 'life-buoy'},
    ],
  },
  {
    key: 'enterprise',
    price: null,
    quota: {zh: 'AMR 额度按合同约定', en: 'AMR allowance by contract'},
    featured: false,
    cta: {zh: '联系销售', en: 'Contact sales'},
    href: 'mailto:sales@serverlessinsight.com?subject=Enterprise',
    features: (t: typeof TEXT) => [
      {text: pick(t.overageCustom), icon: 'coins'},
      {text: pick(t.membersUnlimited), icon: 'users'},
      {text: pick(t.workspacesUnlimited), icon: 'layout-grid'},
      {text: pick(t.autoDeployOn), icon: 'rocket'},
      {text: pick(t.cloudFull), icon: 'globe'},
      {text: pick(t.budgetAlert), icon: 'gauge'},
      {text: pick(t.supportTam), icon: 'life-buoy'},
    ],
  },
]

// Billable declared-entity classes, all weight 1.0 (issue #40 baseline B1);
// generated/derived classes below are never billed (explicit 0 in conf).
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
]
const NEVER_BILLED = [
  {name: '日志服务 SLS Project / Logstore / Index', code: 'ALIYUN_SLS_*'},
  {name: '日志服务 CLS 日志集 / 日志主题', code: 'TENCENT_CLS_*'},
  {name: 'API 网关 API / 部署 / 日志配置', code: 'ALIYUN_APIGW_*'},
  {name: 'CDN 加速域名（bucket.cdn 产物）', code: 'ALIYUN_CDN_DISTRIBUTION'},
  {name: 'NAS 文件系统 / 挂载点 / 访问组', code: 'ALIYUN_NAS_*'},
  {name: '执行角色、域绑定、安全组等隐式依赖', code: ''},
]

const COVERS = [
  {icon: 'zap', name: {zh: '函数实例', en: 'Function instance'}, detail: {zh: 'FC3 · SCF · VeFaaS', en: 'FC3 · SCF · VeFaaS'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}},
  {icon: 'globe', name: {zh: 'API 网关分组', en: 'API gateway group'}, detail: {zh: '每个分组', en: 'per group'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}},
  {icon: 'package', name: {zh: '对象存储桶', en: 'Object storage bucket'}, detail: {zh: 'OSS · COS · TOS', en: 'OSS · COS · TOS'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}},
  {icon: 'database', name: {zh: 'Serverless 数据库', en: 'Serverless database'}, detail: {zh: 'RDS · TDSQL-C · ES', en: 'RDS · TDSQL-C · ES'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}},
  {icon: 'table', name: {zh: '数据表', en: 'Data table'}, detail: {zh: 'Tablestore', en: 'Tablestore'}, per: {zh: '/ 实例 · 月', en: '/ instance · mo'}},
  {icon: 'layout-grid', name: {zh: '超额工作区', en: 'Extra workspace'}, detail: {zh: '超出含入数的部分', en: 'beyond the included count'}, per: {zh: '/ 个 · 月', en: '/ workspace · mo'}},
]

const TEXT = {
  overageDev: {zh: '超出后 ¥10 / AMR（需绑卡）', en: '¥10 / AMR beyond quota (card required)'},
  overageTeam: {zh: '超出后 ¥5 / AMR', en: '¥5 / AMR beyond quota'},
  overageCustom: {zh: '超额单价按合同约定', en: 'Custom overage rate'},
  members1: {zh: '1 名成员（硬配额）', en: '1 member (hard quota)'},
  members10: {zh: '10 名成员（硬配额）', en: '10 members (hard quota)'},
  membersUnlimited: {zh: '成员不限', en: 'Unlimited members'},
  workspaces1: {zh: '含 1 个工作区', en: '1 workspace included'},
  workspaces5: {zh: '含 5 个工作区', en: '5 workspaces included'},
  workspacesUnlimited: {zh: '工作区不限', en: 'Unlimited workspaces'},
  workspaceOverage: {zh: '超额工作区 +1 AMR / 个', en: '+1 AMR per extra workspace'},
  autoDeployOn: {zh: '自动部署 ✓', en: 'Auto deploy ✓'},
  autoDeployOff: {zh: '自动部署 ✗', en: 'Auto deploy ✗'},
  cloudReadonly: {zh: '多云聚合视图 · 只读透传', en: 'Multi-cloud view · read-only'},
  cloudFull: {zh: '多云聚合视图 · 统一跨云搜索', en: 'Multi-cloud view · unified search'},
  budgetHard: {zh: '预算控制 · 硬上限（80% 告警）', en: 'Budget · hard cap (80% alert)'},
  budgetAlert: {zh: '预算控制 · 超额告警', en: 'Budget · overspend alerts'},
  supportCommunity: {zh: '社区支持', en: 'Community support'},
  supportTicket: {zh: '工单支持 · 1 个工作日', en: 'Tickets · 1 business day'},
  supportTam: {zh: '专属 TAM · 7×24', en: 'Dedicated TAM · 7×24'},
  teamValue: {
    zh: '含 100 AMR — 按 Developer 按量价折算价值 ¥1,000，仅需 ¥399',
    en: '100 AMR included — worth ¥1,000 at Developer pay-as-you-go rates, only ¥399',
  },
}

const T = ({
  heroTitle: {zh: '简单定价，随您扩展', en: 'Simple pricing that scales with you'},
  heroSub: {
    zh: '万物一个单位：AMR。您在 yml 中声明的每个实体实例 — 函数、网关、桶、库、表 — 均为 1 AMR。Developer 免费含 10 AMR 起步，团队成长时升级 Team。',
    en: 'One unit for everything: AMR. Each instance of a declared entity — function, gateway, bucket, database, table — weighs 1 AMR. Start free on Developer with 10 AMR.',
  },
  planTitle: {zh: '选择版本', en: 'Choose your plan'},
  priceTableTitle: {zh: '资源价格', en: 'Resource pricing'},
  priceTableSub: {zh: '按实例计费 — 每个声明实体实例每月消耗其权重的 AMR。', en: 'Billed per declared-entity instance — each instance costs its weight in AMR per month.'},
  resource: {zh: '资源', en: 'Resource'},
  amrCol: {zh: 'AMR / 实例 · 月', en: 'AMR / instance · mo'},
  free: {zh: '免费', en: 'Free'},
  zeroGroup: {zh: '0 AMR — 以下永远免费', en: '0 AMR — the ones below are always free'},
  amrNote: {zh: '超出额度后 1 AMR 单价：Developer ¥10 · Team ¥5；免费额度内 ¥0。', en: '1 AMR beyond quota: Developer ¥10 · Team ¥5 — ¥0 within the free quota.'},
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
      'Developer 预算：80% 告警、100% 阻断新部署（现有资源不受影响）',
      '月中升级按天折算；降级次月 1 日生效',
    ],
    en: [
      'A stage counts when alive ≥ 14 days AND it had a successful deployment that month',
      'personal-* stages are permanently free (up to 2 per org)',
      'Settled monthly on the 1st at 00:00 UTC — nothing is charged within the free quota',
      'Developer budget: alert at 80%, block new deploys at 100% — existing resources are never touched',
      'Mid-month upgrades prorate by day; downgrades take effect on the 1st of the next month',
    ],
  },
  faqTitle: {zh: '常见问题', en: 'FAQ'},
  faq: {
    zh: [
      ['Developer 版真的免费吗？', '是的 — 免费额度内（10 AMR、1 成员、1 工作区）永久免费，无需绑卡。超出后可绑卡按量付费，或设置预算硬上限控制成本。'],
      ['什么时候升级 Team 更划算？', 'Team ¥399/月含 100 AMR — 按 Developer 按量价（¥10/AMR）折算价值 ¥1,000。当月账单接近 ¥319（Team 的 80%）时控制台会自动提示升级；超出后每 AMR 仅 ¥5，是 Developer 的一半。'],
      ['不绑卡如何付款？', '当前采用人工收款：提交订单后按收款说明转账，由平台确认。自动化支付通道在后续版本接入。'],
      ['免费额度用完又不绑卡会怎样？', '不会有任何破坏。现有资源继续运行，但当 AMR 用量（含超额工作区）超过免费额度后，新部署将被阻断，直到绑卡恢复按量付费。成员是硬配额：Developer 第 2 名成员需要升级。'],
      ['可以降级回 Developer 吗？', '可以 — 在控制台 Billing 页自助操作，次月 1 日生效。届时若用量超出免费额度且未绑卡，新部署将被阻断。'],
    ],
    en: [
      ['Is the Developer plan really free?', 'Yes — within the free quota (10 AMR, 1 member, 1 workspace) it is free forever, no credit card needed. Beyond the quota: bind a payment method for pay-as-you-go, or set a hard budget cap.'],
      ['When does upgrading to Team pay off?', 'Team costs ¥399/month with 100 AMR included — worth ¥1,000 at the Developer pay-as-you-go rate (¥10/AMR). When your monthly bill approaches ¥319 (80% of Team), the console suggests upgrading; beyond the included 100 AMR each additional AMR is only ¥5.'],
      ['How does payment work without a card?', 'Payments are confirmed manually for now: submit the order, transfer following the provided instructions, and the platform confirms receipt. Automated payment channels land in a later release.'],
      ['What happens when I hit the free quota without paying?', 'Nothing breaks. Existing resources keep running, but new deployments are blocked once AMR usage (including extra workspaces) passes the free quota until a payment method is bound. Members are a hard quota: the 2nd Developer member needs an upgrade.'],
      ['Can I downgrade back to Developer?', 'Yes — self-service from the console Billing tab, effective the first day of the next month. If usage then exceeds the free quota without a bound card, new deployments are blocked.'],
    ],
  },
  ctaBand: {
    zh: '准备好开始了吗？', en: 'Ready to get started?'},
  ctaBandSub: {
    zh: '免费开始，团队成长时再升级 — 一分钟部署您的第一个函数。',
    en: 'Start free, upgrade when your team grows — deploy your first function in a minute.',
  },
  ctaFree: {zh: '免费开始', en: 'Start for free'},
  ctaContact: {zh: '联系销售', en: 'Contact sales'},
})

const pick = (v: {zh: string; en: string}) => (zh.value ? v.zh : v.en)
const rules = computed(() => (zh.value ? T.rules.zh : T.rules.en))
const faq = computed(() => (zh.value ? T.faq.zh : T.faq.en))
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
            <span class="pp-price-num">{{ pick(plan.price) }}</span>
            <span class="pp-price-period">{{ pick(plan.period) }}</span>
          </template>
          <template v-else>
            <span class="pp-price-num">{{ zh ? '联系销售' : 'Contact sales' }}</span>
          </template>
        </div>
        <p class="pp-quota">⚡ {{ pick(plan.quota) }}</p>
        <p v-if="plan.key === 'team'" class="pp-worth">{{ pick(TEXT.teamValue) }}</p>
        <ul class="pp-feats">
          <li v-for="f in plan.features(TEXT)" :key="f.text" :class="{'pp-feat--dim': f.dim}">
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
              <td><b>+1</b></td>
            </tr>
            <tr v-for="r in BILLABLE" :key="r.code">
              <td>{{ zh ? r.name : r.code }} <code>{{ r.code }}</code></td>
              <td><b>1</b></td>
            </tr>
            <tr class="pp-zerohead">
              <td colspan="2">{{ pick(T.zeroGroup) }}</td>
            </tr>
            <tr v-for="r in NEVER_BILLED" :key="r.name" class="pp-zerorow">
              <td>
                {{ r.name }}
                <code v-if="r.code">{{ r.code }}</code>
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
          <div class="pp-cover-amr">1 AMR <span>{{ pick(c.per) }}</span></div>
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
          <p class="pp-example">1 × {{ zh ? '函数' : 'function' }} + 1 × {{ zh ? '桶' : 'bucket' }} + 1 × {{ zh ? '数据表' : 'table' }} = 3 AMR</p>
          <p class="pp-note">{{ zh ? 'Developer 免费额度 10 AMR/月内为 ¥0；超出后按版本单价计费。' : '¥0 within the Developer free quota of 10 AMR/mo; beyond it the plan rate applies.' }}</p>
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
        <a class="pp-btn pp-btn--ghost pp-btn--lg" href="mailto:sales@serverlessinsight.com">{{ pick(T.ctaContact) }}</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
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
