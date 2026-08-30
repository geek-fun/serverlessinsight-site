<script setup>
import {computed, onMounted, ref} from 'vue'
import {useData} from 'vitepress'

const STORAGE_KEY = 'si-platform'
const PLATFORMS = ['aliyun', 'tencent', 'volcengine']
const DEFAULT_PLATFORM = 'aliyun'

const {lang} = useData()
const current = ref(DEFAULT_PLATFORM)

const labels = {
  zh: {aliyun: '阿里云', tencent: '腾讯云', volcengine: '火山引擎'},
  en: {aliyun: 'Aliyun', tencent: 'Tencent', volcengine: 'Volcengine'}
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
</script>

<template>
  <div class="vp-platform-selector" role="group" :aria-label="lang.startsWith('zh') ? '选择云平台' : 'Select cloud platform'">
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
