<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import {usePricing} from '../usePricing'
import ThemeIcon from './ThemeIcon.vue'

const {page} = useData()
const zh = computed(() => !page.value.relativePath.startsWith('en/'))
const pricing = usePricing()
const t = computed(() =>
  zh.value
    ? {
        title: '按资源用量计费，\n随业务规模成长。',
        lead: '从免费额度开始，超出后按托管资源用量付费。函数、存储与数据库，使用统一的 AMR 单位衡量。',
        packages:
          '个人项目可从 Developer 起步；Team 订阅提供更多资源额度与协作能力；Enterprise 为更大规模的需求提供定制方案。',
        action: '查看套餐与用量定价',
        example: '资源用量如何计算',
        provider: '阿里云示例',
        function: '1 个函数',
        bucket: '1 个存储桶',
        table: '1 张数据表',
        total: '示例资源用量',
        unit: 'AMR / 月',
        caption: '示例用量按资源权重计算；阶段计费条件与月度统计规则详见定价页。',
        note: '云资源费用由云厂商另行收取。'
      }
    : {
        title: 'Pay as you go.\nGrow at your pace.',
        lead: 'Start with a free allowance, then pay for managed resource usage beyond it. Functions, storage and databases share one billing unit: AMR.',
        packages:
          'Start on Developer for personal projects. A Team subscription adds more included resources and collaboration. Enterprise supports tailored requirements.',
        action: 'Explore plans and usage rates',
        example: 'How resource usage adds up',
        provider: 'Alibaba Cloud example',
        function: '1 function',
        bucket: '1 storage bucket',
        table: '1 database table',
        total: 'Example resource usage',
        unit: 'AMR / month',
        caption:
          'Illustrative usage based on resource weights. Stage eligibility and monthly counting rules are detailed on the pricing page.',
        note: 'Cloud infrastructure is billed separately by your provider.'
      }
)
const resources = computed(() => [
  {name: t.value.function, icon: 'code', weight: pricing.amr_weights.ALIYUN_FC3_FUNCTION},
  {name: t.value.bucket, icon: 'bucket', weight: pricing.amr_weights.ALIYUN_OSS_BUCKET},
  {name: t.value.table, icon: 'database', weight: pricing.amr_weights.ALIYUN_TABLESTORE_TABLE}
])
const exampleUsage = computed(() => resources.value.reduce((total, resource) => total + resource.weight, 0))
</script>

<template>
  <section id="pricing" class="si-pricing si-light-section" aria-labelledby="pricing-title">
    <div class="si-container si-pricing__grid">
      <div class="si-pricing__copy">
        <h2 id="pricing-title">{{ t.title }}</h2>
        <p class="si-pricing__lead">{{ t.lead }}</p>
        <p class="si-pricing__packages">{{ t.packages }}</p>
        <a class="si-button si-pricing__action" :href="zh ? '/pricing.html' : '/en/pricing.html'">
          {{ t.action }}<ThemeIcon name="arrow-right" :size="17" />
        </a>
        <p class="si-pricing__note">{{ t.note }}</p>
      </div>
      <figure class="si-usage-example">
        <figcaption>
          <span>{{ t.example }}</span
          ><span>{{ t.provider }}</span>
        </figcaption>
        <dl class="si-usage-example__resources">
          <div v-for="resource in resources" :key="resource.icon">
            <dt><ThemeIcon :name="resource.icon" :size="20" />{{ resource.name }}</dt>
            <dd>{{ resource.weight }} <span>AMR</span></dd>
          </div>
        </dl>
        <p class="si-usage-example__total">
          <span>{{ t.total }}</span
          ><strong
            >{{ exampleUsage }} <span>{{ t.unit }}</span></strong
          >
        </p>
        <p class="si-usage-example__caption">{{ t.caption }}</p>
      </figure>
    </div>
  </section>
</template>
