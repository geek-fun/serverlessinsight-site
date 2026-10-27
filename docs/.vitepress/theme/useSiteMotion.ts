import {nextTick, onMounted, onUnmounted, provide, watch} from 'vue'
import {useData} from 'vitepress'
import {createSiteMotion} from './motion.mjs'

export function useSiteMotion() {
  const {page} = useData()
  let controller: ReturnType<typeof createSiteMotion> | null = null
  let revision = 0
  provide('si-replay-workflow', () => controller?.replay())
  onMounted(() => {
    controller = createSiteMotion(window)
    controller.enter(page.value.relativePath, {initial: true})
  })
  watch(
    () => page.value.relativePath,
    async (path) => {
      const current = ++revision
      await nextTick()
      if (current === revision) controller?.enter(path)
    },
    {flush: 'post'}
  )
  onUnmounted(() => {
    ++revision
    controller?.dispose()
    controller = null
  })
}
