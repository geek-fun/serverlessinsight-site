<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {useData} from 'vitepress'

const STORAGE_KEY = 'si-platform'
const PLATFORMS = ['aliyun', 'tencent', 'volcengine']
const DEFAULT_PLATFORM = 'aliyun'

const {lang} = useData()
const current = ref(DEFAULT_PLATFORM)
const open = ref(false)
const rootEl = ref(null)

const meta = {
  zh: {
    aliyun: {label: '阿里云', icon: '/icons/platform-aliyun.png'},
    tencent: {label: '腾讯云', icon: '/icons/platform-tencent.png'},
    volcengine: {label: '火山引擎', icon: '/icons/platform-volcengine.png'}
  },
  en: {
    aliyun: {label: 'Aliyun', icon: '/icons/platform-aliyun.png'},
    tencent: {label: 'Tencent Cloud', icon: '/icons/platform-tencent.png'},
    volcengine: {label: 'Volcengine', icon: '/icons/platform-volcengine.png'}
  }
}
const options = computed(() =>
  Object.entries(lang.value.startsWith('zh') ? meta.zh : meta.en).map(([value, m]) => ({value, ...m}))
)
const currentMeta = computed(() => options.value.find((o) => o.value === current.value))

function apply(platform) {
  current.value = platform
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.platform = platform
  }
}

function select(platform) {
  apply(platform)
  open.value = false
  try {
    localStorage.setItem(STORAGE_KEY, platform)
  } catch {
    /* storage unavailable (private mode) — selection stays for this session */
  }
}

function onDocClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    open.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    open.value = false
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
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootEl" class="vp-platform-selector">
    <span class="vp-platform-selector__label">{{ lang.startsWith('zh') ? '平台' : 'Platform' }}</span>
    <button
      type="button"
      class="vp-platform-selector__trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
    >
      <img class="vp-platform-selector__icon" :src="currentMeta.icon" alt="" />
      <span class="vp-platform-selector__text">{{ currentMeta.label }}</span>
      <svg
        class="vp-platform-selector__chevron"
        :class="{'is-open': open}"
        viewBox="0 0 24 24"
        width="12"
        height="12"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <ul v-show="open" class="vp-platform-selector__menu" role="listbox">
      <li v-for="o in options" :key="o.value">
        <button
          type="button"
          class="vp-platform-selector__option"
          :class="{'is-active': o.value === current}"
          role="option"
          :aria-selected="o.value === current"
          @click="select(o.value)"
        >
          <img class="vp-platform-selector__icon" :src="o.icon" alt="" />
          <span>{{ o.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
