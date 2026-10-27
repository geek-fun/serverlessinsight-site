<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import AuthNav from './AuthNav.vue'
import {CONSOLE_LOGIN_URL} from '../console'

defineProps<{mobile?: boolean}>()
const {page} = useData()
const start = computed(() => (page.value.relativePath.startsWith('en/') ? 'Start for Free' : '免费开始'))
</script>

<template>
  <div class="si-nav-actions" :class="{'si-nav-actions--mobile': mobile}">
    <AuthNav />
    <a class="si-nav-start" :href="CONSOLE_LOGIN_URL">{{ start }}</a>
  </div>
</template>
