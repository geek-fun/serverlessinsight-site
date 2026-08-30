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
  <div class="vp-platform-selector">
    <label class="vp-platform-selector__label" for="vp-platform-select">{{ lang.startsWith('zh') ? '平台' : 'Platform' }}</label>
    <select
      id="vp-platform-select"
      class="vp-platform-selector__select"
      :value="current"
      @change="select($event.target.value)"
    >
      <option v-for="[value, label] in options" :key="value" :value="value">{{ label }}</option>
    </select>
  </div>
</template>
