<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useData} from 'vitepress'
import {CONSOLE_URL} from '../console'

/**
 * Auth-aware nav entry: renders 「登录 / Sign in」 for anonymous visitors and
 * 「控制台 / Console」 for logged-in users. The state comes from the lightweight
 * `si-auth` cookie the console writes on login (scoped to the parent domain;
 * cookies ignore ports, so localhost dev environments share it too). The
 * cookie is cosmetic — the console API still owns the real session.
 */
const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))
const authed = ref(false)

const update = () => {
  authed.value = document.cookie.includes('si-auth=1')
}

let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  update()
  // cheap cookie poll: covers logging in/out in another console tab
  poll = setInterval(update, 3000)
  window.addEventListener('focus', update)
})
onUnmounted(() => {
  if (poll) clearInterval(poll)
  window.removeEventListener('focus', update)
})
</script>

<template>
  <!--
    Locale comes from the SSR-safe page path, so the auth label remains
    available while the document language updates during navigation.
  -->
  <a
    class="auth-nav"
    :class="{'auth-nav--authed': authed, 'auth-nav--zh': isZh, 'auth-nav--en': !isZh}"
    :href="CONSOLE_URL"
  >
    <span class="t zh t-login">登录</span>
    <span class="t zh t-console">控制台</span>
    <span class="t en t-login">Sign in</span>
    <span class="t en t-console">Console</span>
  </a>
</template>

<style scoped>
.auth-nav {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  line-height: var(--vp-nav-height);
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.25s;
  white-space: nowrap;
}
.auth-nav:hover {
  color: var(--vp-c-brand-1);
}
.auth-nav--authed {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* Route locale and cosmetic auth state select one visible label. */
.auth-nav .t {
  display: none;
}
.auth-nav--zh .t.zh {
  display: inline;
}
.auth-nav--en .t.en {
  display: inline;
}
.auth-nav--authed .t-login,
.auth-nav:not(.auth-nav--authed) .t-console {
  display: none !important;
}

@media (min-width: 960px) {
  .auth-nav {
    padding: 0 14px;
  }
}
/* mobile full-screen menu: block row instead of inline link */
:global(.VPNavScreen) .auth-nav {
  display: flex;
  line-height: 48px;
  font-size: 15px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 0 4px;
}
</style>
