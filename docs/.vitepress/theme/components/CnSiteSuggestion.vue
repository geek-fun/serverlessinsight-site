<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useData} from 'vitepress'
import {SITE_LINE} from '../site-line'
import {SITE_PREFERENCE_KEY, suggestCnSite} from '../site-guidance'

const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))
const visible = ref(false)
const target = computed(() => visible.value && page.value.relativePath ? suggestCnSite({
  siteLine: SITE_LINE,
  languages: signals.value.languages,
  timeZone: signals.value.timeZone,
  preference: signals.value.preference,
  currentHref: window.location.href,
}) : null)
const signals = ref<{languages: readonly string[]; timeZone: string; preference: string | null}>({
  languages: [], timeZone: '', preference: null,
})

onMounted(() => {
  let preference: string | null = null
  try { preference = localStorage.getItem(SITE_PREFERENCE_KEY) } catch { /* Storage can be disabled. */ }
  let timeZone = ''
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { /* Language remains available. */ }
  signals.value = {languages: navigator.languages ?? [navigator.language], timeZone, preference}
  visible.value = true
})

function choose(line: 'cn' | 'intl') {
  try { localStorage.setItem(SITE_PREFERENCE_KEY, line) } catch { /* Dismiss for this visit. */ }
  visible.value = false
}
</script>

<template>
  <aside v-if="visible && target" class="si-region-notice" :aria-label="isZh ? '站点选择' : 'Site choice'" data-testid="cn-site-suggestion">
    <p>{{ isZh ? '也可使用国内站，查看人民币定价并进入国内控制台。' : 'You can also use the China site for CNY pricing and the China console.' }}</p>
    <div class="si-region-notice__actions">
      <button type="button" @click="choose('intl')">{{ isZh ? '继续使用国际站' : 'Stay on international site' }}</button>
      <a :href="target" @click="choose('cn')">{{ isZh ? '前往国内站' : 'Go to China site' }}</a>
    </div>
  </aside>
</template>

<style scoped>
.si-region-notice {
  position: fixed;
  z-index: 100;
  inset-inline: 16px;
  bottom: max(16px, env(safe-area-inset-bottom));
  width: fit-content;
  max-width: min(760px, calc(100% - 32px));
  margin-inline: auto;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 1.6;
}
.si-region-notice p { margin: 0; }
.si-region-notice__actions { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 8px; }
.si-region-notice button, .si-region-notice a { min-height: 40px; display: inline-flex; align-items: center; }
.si-region-notice button { color: var(--vp-c-text-2); cursor: pointer; }
.si-region-notice a { color: var(--vp-c-brand-1); text-decoration: underline; text-underline-offset: 4px; }
.si-region-notice :is(button, a):focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 4px; }
</style>
