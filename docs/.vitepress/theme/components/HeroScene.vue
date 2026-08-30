<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useData} from 'vitepress'

const canvas = ref<HTMLCanvasElement | null>(null)
const {isDark} = useData()
let disposeScene: (() => void) | undefined

const startScene = async () => {
  if (!canvas.value || typeof window === 'undefined') return
  disposeScene?.()
  const {mountHeroScene} = await import('./heroScene')
  if (canvas.value) disposeScene = mountHeroScene({canvas: canvas.value, dark: isDark.value})
}

onMounted(() => { void startScene() })
watch(isDark, () => { void startScene() })
onBeforeUnmount(() => { disposeScene?.() })
</script>

<template>
  <div class="si-hero-scene" aria-hidden="true">
    <canvas ref="canvas" class="si-hero-scene__canvas" />
  </div>
</template>

<style scoped>
.si-hero-scene {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.88;
}

.si-hero-scene__canvas {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
}
</style>
