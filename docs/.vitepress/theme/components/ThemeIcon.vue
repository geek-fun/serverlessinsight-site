<script setup lang="ts">
import {ICONS} from '../icons'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), {size: 14})
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[props.name]"
  />
</template>
