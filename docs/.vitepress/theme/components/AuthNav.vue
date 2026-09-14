<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue'
import {CONSOLE_URL} from '../console'

/**
 * Auth-aware nav entry: renders 「登录 / Sign in」 for anonymous visitors and
 * 「控制台 / Console」 for logged-in users. The state comes from the lightweight
 * `si-auth` cookie the console writes on login (scoped to the parent domain;
 * cookies ignore ports, so localhost dev environments share it too). The
 * cookie is cosmetic — the console API still owns the real session.
 */
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
    Four static spans; CSS picks the visible one from the build-time
    html[lang] attribute + the runtime authed class. This keeps locale
    correctness in SSG (no SSR data dependency) while the cookie toggles
    登录 ↔ 控制口 at runtime.
  -->
  <a class="auth-nav" :class="{'auth-nav--authed': authed}" :href="CONSOLE_URL">
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
.auth-nav:hover { color: var(--vp-c-brand-1); }
.auth-nav--authed { color: var(--vp-c-brand-1); font-weight: 600; }

/* Locale + auth state via CSS: exactly one span is visible.
   html[lang] is baked per page at build time — SSR-safe by construction. */
.auth-nav .t { display: none; }
:root:not(.dark) .auth-nav .t, html .auth-nav .t { }
html[lang='zh-CN'] .auth-nav .t.zh { display: inline; }
html[lang^='en'] .auth-nav .t.en { display: inline; }
.auth-nav--authed .t-login, .auth-nav:not(.auth-nav--authed) .t-console { display: none !important; }

@media (min-width: 960px) {
  .auth-nav { padding: 0 14px; }
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
