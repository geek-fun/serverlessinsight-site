<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'

// Global footer rendered in the layout-bottom slot on every page.
// Locale from the build-time relativePath (SSR-safe, see AGENTS.md).
const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))
const link = (path: string) => (isZh.value ? path : `/en${path}`)

const T = computed(() =>
  isZh.value
    ? {
        tagline: '开源的声明式 Serverless IaC——从函数到存储，整套应用写进一个文件。',
        product: '产品',
        resources: '资源',
        community: '社区',
        links: {
          start: '快速开始',
          reference: '配置手册',
          cli: 'CLI 参考',
          pricing: '定价',
          caseStudy: '实践案例',
          faq: '常见问题',
          support: '技术支持',
          docs: '文档中心',
          github: 'GitHub 仓库',
          issues: 'Issues',
          x: 'X (Twitter)',
          youtube: 'YouTube'
        },
        deployed: '本站由 ServerlessInsight 部署',
        license: 'Apache-2.0 License'
      }
    : {
        tagline: 'Open-source declarative serverless IaC — from functions to storage, your whole app in one file.',
        product: 'Product',
        resources: 'Resources',
        community: 'Community',
        links: {
          start: 'Get Started',
          reference: 'Reference',
          cli: 'CLI Reference',
          pricing: 'Pricing',
          caseStudy: 'Case Study',
          faq: 'FAQ',
          support: 'Support',
          docs: 'Docs',
          github: 'GitHub Repo',
          issues: 'Issues',
          x: 'X (Twitter)',
          youtube: 'YouTube'
        },
        deployed: 'This site is deployed with ServerlessInsight',
        license: 'Apache-2.0 License'
      }
)

const GITHUB_URL = 'https://github.com/geek-fun/serverlessinsight'
</script>

<template>
  <footer class="site-footer">
    <div class="si-wrap">
      <div class="sf-main">
        <div class="sf-brand">
          <a class="sf-wordmark" :href="link('/')">
            <span class="sf-dot" />
            ServerlessInsight
          </a>
          <p class="sf-tagline">{{ T.tagline }}</p>
          <div class="sf-social">
            <a :href="GITHUB_URL" target="_blank" rel="noopener" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
            </a>
            <a href="https://x.com/Blankll31075" target="_blank" rel="noopener" aria-label="X (Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/></svg>
            </a>
            <a href="https://www.youtube.com/@geekfun-club" target="_blank" rel="noopener" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>
            </a>
          </div>
        </div>

        <nav class="sf-col" :aria-label="T.product">
          <h3 class="sf-col__title">{{ T.product }}</h3>
          <a :href="link('/getting-started')">{{ T.links.start }}</a>
          <a :href="link('/reference')">{{ T.links.reference }}</a>
          <a :href="link('/cli')">{{ T.links.cli }}</a>
          <a :href="link('/pricing')">{{ T.links.pricing }}</a>
        </nav>

        <nav class="sf-col" :aria-label="T.resources">
          <h3 class="sf-col__title">{{ T.resources }}</h3>
          <a :href="link('/docs')">{{ T.links.docs }}</a>
          <a :href="link('/case-study')">{{ T.links.caseStudy }}</a>
          <a :href="link('/faq')">{{ T.links.faq }}</a>
          <a :href="link('/support')">{{ T.links.support }}</a>
        </nav>

        <nav class="sf-col" :aria-label="T.community">
          <h3 class="sf-col__title">{{ T.community }}</h3>
          <a :href="GITHUB_URL" target="_blank" rel="noopener">{{ T.links.github }}</a>
          <a :href="`${GITHUB_URL}/issues`" target="_blank" rel="noopener">{{ T.links.issues }}</a>
          <a href="https://x.com/Blankll31075" target="_blank" rel="noopener">{{ T.links.x }}</a>
          <a href="https://www.youtube.com/@geekfun-club" target="_blank" rel="noopener">{{ T.links.youtube }}</a>
        </nav>
      </div>

      <div class="sf-bottom">
        <span>© 2026 geek-fun · {{ T.license }}</span>
        <span class="sf-deployed">{{ T.deployed }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  padding: 56px 0 40px;
  margin-top: 0;
}

.sf-main {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  gap: 40px;
}

.sf-wordmark {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.sf-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px rgba(102, 64, 191, 0.14);
}

.sf-tagline {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.75;
  color: var(--vp-c-text-2);
  max-width: 34em;
}

.sf-social {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}

.sf-social a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--vp-c-text-3);
  transition: color 0.2s, background-color 0.2s;
}

.sf-social a:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-divider);
}

.sf-social svg {
  width: 16px;
  height: 16px;
}

.sf-col {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.sf-col__title {
  margin: 0 0 4px;
  font-size: 12.5px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-1);
}

.sf-col a {
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  width: fit-content;
}

.sf-col a:hover {
  color: var(--vp-c-brand-1);
}

.sf-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  justify-content: space-between;
  margin-top: 48px;
  padding-top: 22px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.sf-deployed {
  font-family: var(--vp-font-family-mono);
}

.sf-wordmark:focus-visible,
.sf-social a:focus-visible,
.sf-col a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (max-width: 860px) {
  .sf-main {
    grid-template-columns: 1fr 1fr;
    gap: 36px 24px;
  }

  .sf-brand {
    grid-column: 1 / -1;
  }
}
</style>
