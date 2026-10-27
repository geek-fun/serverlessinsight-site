<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import BrandMark from './BrandMark.vue'

const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))
const link = (path: string) => `${isZh.value ? '/' : '/en/'}${path}.html`
const year = new Date().getFullYear()
const supportEmail = 'support@wentsen.com'
const t = computed(() =>
  isZh.value
    ? {
        tagline: '跨云构建全栈 Serverless 应用。',
        product: '产品',
        start: '快速开始',
        reference: '配置手册',
        cli: 'CLI 参考',
        clouds: '云支持',
        pricing: '定价',
        resources: '资源',
        docs: '文档中心',
        cases: '实践案例',
        faq: '常见问题',
        support: '技术支持',
        community: '社区',
        github: 'GitHub 仓库',
        issues: 'GitHub Issues',
        legal: '法务',
        privacy: '隐私政策',
        terms: '服务条款',
        refund: '退款政策'
      }
    : {
        tagline: 'Full-stack serverless, across clouds.',
        product: 'Product',
        start: 'Get started',
        reference: 'Configuration reference',
        cli: 'CLI reference',
        clouds: 'Cloud support',
        pricing: 'Pricing',
        resources: 'Resources',
        docs: 'Docs',
        cases: 'Case studies',
        faq: 'FAQ',
        support: 'Support',
        community: 'Community',
        github: 'GitHub repository',
        issues: 'GitHub Issues',
        legal: 'Legal',
        privacy: 'Privacy policy',
        terms: 'Terms of service',
        refund: 'Refund policy'
      }
)
const groups = computed(() => [
  {
    title: t.value.product,
    links: [
      {label: t.value.start, href: link('getting-started')},
      {label: t.value.reference, href: link('reference')},
      {label: t.value.cli, href: link('cli')},
      {label: t.value.clouds, href: `${isZh.value ? '/' : '/en/'}#cloud-support`},
      {label: t.value.pricing, href: link('pricing')}
    ]
  },
  {
    title: t.value.resources,
    links: [
      {label: t.value.docs, href: link('docs')},
      {label: t.value.cases, href: link('case-study')},
      {label: t.value.faq, href: link('faq')},
      {label: t.value.support, href: link('support')}
    ]
  },
  {
    title: t.value.community,
    links: [
      {label: t.value.github, href: 'https://github.com/geek-fun/serverlessinsight'},
      {label: t.value.issues, href: 'https://github.com/geek-fun/serverlessinsight/issues'},
      {label: 'X (Twitter)', href: 'https://x.com/Blankll31075'},
      {label: 'YouTube', href: 'https://www.youtube.com/@geekfun-club'}
    ]
  },
  {
    title: t.value.legal,
    links: [
      {label: t.value.terms, href: link('terms')},
      {label: t.value.privacy, href: link('privacy')},
      {label: t.value.refund, href: link('refund-policy')}
    ]
  }
])
</script>

<template>
  <footer id="site-footer" class="si-footer site-footer">
    <div class="si-container">
      <div class="si-footer__grid">
        <div class="si-footer__brand">
          <a class="si-wordmark" :href="isZh ? '/' : '/en/'"><BrandMark /><span>ServerlessInsight</span></a>
          <p>{{ t.tagline }}</p>
          <a class="si-footer__support" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a>
        </div>
        <nav v-for="group in groups" :key="group.title" class="si-footer__group" :aria-label="group.title">
          <h2>{{ group.title }}</h2>
          <ul>
            <li v-for="item in group.links" :key="item.href">
              <a
                :href="item.href"
                :target="item.href.startsWith('https://') ? '_blank' : undefined"
                :rel="item.href.startsWith('https://') ? 'noopener noreferrer' : undefined"
                >{{ item.label }}</a
              >
            </li>
          </ul>
        </nav>
      </div>
      <div class="si-footer__bottom">
        <span>© 2024–{{ year }} ServerlessInsight</span><span>Apache-2.0</span>
      </div>
    </div>
  </footer>
</template>
