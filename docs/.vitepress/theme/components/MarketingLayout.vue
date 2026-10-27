<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import {LOCALIZED_PAGES} from '../../seo.mjs'
import {useSiteMotion} from '../useSiteMotion'
import SiteNavActions from './SiteNavActions.vue'
import PlatformSelector from './PlatformSelector.vue'
import SiteFooter from './SiteFooter.vue'
import LandingHeader from './LandingHeader.vue'
import LandingFooter from './LandingFooter.vue'

useSiteMotion()
const {page, frontmatter} = useData()
const isLanding = computed(() => ['index.md', 'en/index.md'].includes(page.value.relativePath))
const closeNavigationOnEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  const toggle = (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(
    '.VPNavBarHamburger[aria-expanded="true"]'
  )
  toggle?.click()
  toggle?.focus()
}
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))
// Pages without a translated counterpart would get a locale-picker link to a
// nonexistent page (VitePress rewrites the path unconditionally).
const hasTranslation = computed(() => LOCALIZED_PAGES.has(page.value.relativePath.replace(/^en\//, '')))
</script>

<template>
  <div v-if="isLanding" class="si-marketing" @keydown="closeNavigationOnEscape">
    <a class="si-skip-link" href="#VPContent">{{ isZh ? '跳转到主要内容' : 'Skip to content' }}</a>
    <LandingHeader />
    <main id="VPContent" tabindex="-1"><Content /></main>
    <LandingFooter />
  </div>
  <DefaultTheme.Layout
    v-else
    class="si-site"
    :class="{'si-reading-page': frontmatter.layout === 'page' && !page.relativePath.endsWith('pricing.md')}"
    :data-si-translations="hasTranslation ? null : 'off'"
    @keydown="closeNavigationOnEscape"
  >
    <template #sidebar-nav-before><PlatformSelector /></template>
    <template #nav-bar-content-after><SiteNavActions /></template>
    <template #nav-screen-content-after><SiteNavActions mobile /></template>
    <template #layout-bottom><SiteFooter /></template>
  </DefaultTheme.Layout>
</template>
