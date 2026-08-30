<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useData} from 'vitepress'

const STORAGE_KEY = 'si-platform'
const PLATFORMS = ['aliyun', 'tencent', 'volcengine']
const DEFAULT_PLATFORM = 'aliyun'

const {page, lang, frontmatter} = useData()
const current = ref(DEFAULT_PLATFORM)
// SSR-correct visibility: only pages opting in via frontmatter `platforms: true`
const hasBlocks = ref(!!frontmatter.value.platforms)

const labels = {
  zh: {aliyun: '阿里云', tencent: '腾讯云', volcengine: '火山引擎'},
  en: {aliyun: 'Aliyun', tencent: 'Tencent Cloud', volcengine: 'Volcengine'}
}
const options = computed(() =>
  Object.entries(lang.value.startsWith('zh') ? labels.zh : labels.en)
)

function apply(platform) {
  current.value = platform
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.platform = platform
  }
}

function select(platform) {
  apply(platform)
  try {
    localStorage.setItem(STORAGE_KEY, platform)
  } catch {
    /* storage unavailable (private mode) — selection stays for this session */
  }
}

onMounted(() => {
  let saved = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  apply(saved && PLATFORMS.includes(saved) ? saved : DEFAULT_PLATFORM)
})

// Keep selection applied across client-side navigations
watch(
  () => page.value.relativePath,
  () => apply(current.value)
)

// Re-evaluate visibility on navigation
watch(frontmatter, (fm) => {
  hasBlocks.value = !!fm.platforms
})
</script>

<template>
  <div v-show="hasBlocks" class="vp-platform-selector" role="group" :aria-label="lang.startsWith('zh') ? '选择云平台' : 'Select cloud platform'">
    <span class="vp-platform-selector__label">{{ lang.startsWith('zh') ? '平台' : 'Platform' }}</span>
    <button
      v-for="[value, label] in options"
      :key="value"
      type="button"
      class="vp-platform-selector__btn"
      :class="{'is-active': current === value}"
      :aria-pressed="current === value"
      @click="select(value)"
    >
      {{ label }}
    </button>
  </div>
</template>
