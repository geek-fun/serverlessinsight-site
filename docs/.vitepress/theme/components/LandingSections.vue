<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import ThemeIcon from './ThemeIcon.vue'
import LandingPricing from './LandingPricing.vue'
import {CONSOLE_LOGIN_URL} from '../console'
import {SECTION_EN, SECTION_ZH, ZH_API_ANCHOR} from '../landing-sections'

const {page} = useData()
const zh = computed(() => !page.value.relativePath.startsWith('en/'))
const t = computed(() => (zh.value ? SECTION_ZH : SECTION_EN))
const link = (name: string) => `${zh.value ? '/' : '/en/'}${name}.html`
const caseLink = (item: (typeof SECTION_EN.cases)[number]) =>
  `${link(item.page)}#${zh.value && item.page === 'getting-started' ? ZH_API_ANCHOR : item.hash}`
const stageExample = [
  'stages:',
  '  dev:',
  '    memory: 256',
  '  prod:',
  '    memory: 1024',
  '',
  'functions:',
  '  hello_world_fn:',
  '    memory: ${stages.memory}'
].join('\n')
const consoleScreenshot = computed(() => `/images/console-resources-${zh.value ? 'zh' : 'en'}.jpg`)
</script>

<template>
  <section id="features" class="si-features si-light-section" aria-labelledby="features-title">
    <div class="si-container">
      <div class="si-section-heading">
        <h2 id="features-title">{{ t.featuresTitle }}</h2>
        <p>{{ t.featuresLead }}</p>
      </div>
      <div class="si-benefits">
        <a v-for="benefit in t.benefits" :key="benefit.href" :href="benefit.href"
          ><h3>{{ benefit.title }}<ThemeIcon name="arrow-up-right" :size="18" /></h3>
          <p>{{ benefit.body }}</p></a
        >
      </div>
    </div>
  </section>
  <slot name="configuration" />
  <section
    id="delivery"
    class="si-feature-detail si-feature-detail--mist si-light-section"
    aria-labelledby="delivery-title"
  >
    <div class="si-container si-feature-detail__grid">
      <div class="si-stage-example" role="group" :aria-label="t.stageExample">
        <div class="si-example-bar">
          <span>serverlessinsight.yml</span><span>{{ t.stageExample }}</span>
        </div>
        <pre><code>{{ stageExample }}</code></pre>
        <div class="si-change-preview">
          <div>
            <code>si plan --stage prod</code><span>{{ t.changeExample }}</span>
          </div>
          <p>
            <span>hello_world_fn</span><strong>memory</strong
            ><code>256 MB <ThemeIcon name="arrow-right" :size="16" /> 1024 MB</code>
          </p>
        </div>
      </div>
      <div class="si-feature-detail__copy">
        <h2 id="delivery-title">{{ t.deliveryTitle }}</h2>
        <p>{{ t.deliveryLead }}</p>
        <ul class="si-detail-points">
          <li v-for="point in t.deliveryPoints" :key="point">
            <ThemeIcon name="check" :size="18" /><span>{{ point }}</span>
          </li>
        </ul>
        <a class="si-text-link" :href="`${link('cli')}#si-plan`"
          >{{ t.deliveryLink }}<ThemeIcon name="arrow-up-right" :size="17"
        /></a>
      </div>
    </div>
  </section>
  <section id="development" class="si-feature-detail si-light-section" aria-labelledby="development-title">
    <div class="si-container si-feature-detail__grid">
      <div class="si-feature-detail__copy">
        <h2 id="development-title">{{ t.developmentTitle }}</h2>
        <p>{{ t.developmentLead }}</p>
        <ul class="si-detail-points">
          <li v-for="point in t.developmentPoints" :key="point">
            <ThemeIcon name="check" :size="18" /><span>{{ point }}</span>
          </li>
        </ul>
        <a class="si-text-link" :href="link('getting-started')"
          >{{ t.developmentLink }}<ThemeIcon name="arrow-up-right" :size="17"
        /></a>
      </div>
      <div class="si-local-example">
        <div class="si-local-example__bar">
          <span>si — local</span><span>{{ t.localExample }}</span>
        </div>
        <div class="si-local-example__body">
          <p class="si-local-command"><span>$ </span><code>si validate</code></p>
          <p class="si-local-command"><span>$ </span><code>si local --stage dev</code></p>
          <div class="si-local-path">
            <span>{{ t.edit }}</span
            ><ThemeIcon name="arrow-right" :size="18" /><span>{{ t.test }}</span
            ><ThemeIcon name="arrow-right" :size="18" /><span>{{ t.deploy }}</span>
          </div>
          <div class="si-response-example">
            <span>{{ t.localResult }}</span>
            <pre><code>{
  "message": "Hello, ServerlessInsight!"
}</code></pre>
          </div>
          <p class="si-local-note">{{ t.localNote }}</p>
        </div>
      </div>
    </div>
  </section>
  <slot name="workflow" />
  <section id="teams" class="si-teams" aria-labelledby="teams-title">
    <div class="si-container si-teams__grid">
      <div class="si-teams__copy">
        <div class="si-section-heading">
          <h2 id="teams-title">{{ t.teamsTitle }}</h2>
          <p>{{ t.teamsLead }}</p>
        </div>
        <ul class="si-teams__benefits">
          <li v-for="item in t.teamItems" :key="item"><ThemeIcon name="check" :size="17" />{{ item }}</li>
        </ul>
        <a class="si-text-link" :href="CONSOLE_LOGIN_URL"
          >{{ t.teamsLink }}<ThemeIcon name="arrow-up-right" :size="17"
        /></a>
      </div>
      <figure class="si-console-preview" :aria-label="t.consolePreview">
        <div class="si-console-preview__screen">
          <img :src="consoleScreenshot" :alt="t.consoleAlt" width="1280" height="900" loading="lazy" decoding="async" />
        </div>
        <figcaption>
          <span>{{ t.consolePreview }}</span>
          <a class="si-text-link" :href="consoleScreenshot" target="_blank" rel="noopener noreferrer"
            >{{ t.consoleFullSize }}<ThemeIcon name="arrow-up-right" :size="16"
          /></a>
        </figcaption>
      </figure>
    </div>
  </section>
  <section id="use-cases" class="si-cases si-light-section" aria-labelledby="cases-title">
    <div class="si-container">
      <div class="si-section-heading">
        <h2 id="cases-title">{{ t.casesTitle }}</h2>
        <p>{{ t.casesLead }}</p>
      </div>
      <div class="si-case-list">
        <article v-for="item in t.cases" :key="item.title">
          <div class="si-case-copy">
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
            <a class="si-text-link" :href="caseLink(item)"
              >{{ item.cta }}<ThemeIcon name="arrow-up-right" :size="17"
            /></a>
          </div>
          <div class="si-case-flow" aria-hidden="true">
            <template v-for="(node, i) in item.nodes" :key="node"
              ><ThemeIcon v-if="i" name="arrow-right" :size="19" /><span>{{ node }}</span></template
            >
          </div>
        </article>
      </div>
    </div>
  </section>
  <section class="si-open-source si-light-section" aria-labelledby="open-source-title">
    <div class="si-container si-open-source__grid">
      <div>
        <h2 id="open-source-title">{{ t.trustTitle }}</h2>
        <p>{{ t.trustLead }}</p>
      </div>
      <div>
        <span class="si-license-mark">Apache<span>2.0</span></span>
        <p>{{ t.trustLicense }}</p>
        <a
          class="si-text-link"
          href="https://github.com/geek-fun/serverlessinsight"
          target="_blank"
          rel="noopener noreferrer"
          >{{ t.trustLink }}<ThemeIcon name="arrow-up-right" :size="17"
        /></a>
      </div>
    </div>
  </section>
  <LandingPricing />
  <section id="faq" class="si-faq si-light-section" aria-labelledby="faq-title">
    <div class="si-container si-faq__grid">
      <div>
        <h2 id="faq-title">{{ t.faqTitle }}</h2>
        <p>{{ t.faqLead }}</p>
        <a class="si-text-link" :href="link('docs')">{{ t.faqLink }}<ThemeIcon name="arrow-up-right" :size="17" /></a>
      </div>
      <div class="si-faq__items">
        <details v-for="(item, i) in t.faqs" :key="item.question" :open="i === 0">
          <summary>{{ item.question }}<ThemeIcon name="plus" :size="19" /></summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
