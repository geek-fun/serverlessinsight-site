<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useData} from 'vitepress'

const canvas = ref<HTMLCanvasElement | null>(null)
const {isDark, lang} = useData()
let disposeScene: (() => void) | undefined

const startScene = async () => {
  if (!canvas.value || typeof window === 'undefined') return
  disposeScene?.()
  const {mountHeroScene} = await import('./heroScene')
  if (canvas.value) disposeScene = mountHeroScene({canvas: canvas.value, dark: isDark.value, lang: lang.value})
}

onMounted(() => { void startScene() })
watch([isDark, lang], () => { void startScene() })
onBeforeUnmount(() => { disposeScene?.() })
</script>

<template>
  <div class="si-hero-scene" aria-hidden="true">
    <canvas ref="canvas" class="si-hero-scene__canvas" />
  </div>
</template>

<style scoped>
.si-hero-scene {
  overflow: hidden;
  pointer-events: none;
}

.si-hero-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
}
</style>
