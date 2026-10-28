<script setup lang="ts">
import VPNav from 'vitepress/dist/client/theme-default/components/VPNav.vue'
import SiteNavActions from './SiteNavActions.vue'
</script>

<template>
  <VPNav>
    <template #nav-bar-content-after><SiteNavActions /></template>
    <template #nav-screen-content-after><SiteNavActions mobile /></template>
  </VPNav>
</template>
