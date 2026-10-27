import {onMounted, onUnmounted, reactive} from 'vue'
import initialPricing from './pricing-data.json'

export const PRICING_API = 'https://console.serverlessinsight.com/api/v1/pricing'
type Pricing = typeof initialPricing & {
  plans: {team: typeof initialPricing.plans.team & {annual_base_cents?: number}}
}

/** Each SSR render owns its state; the public API refreshes it after hydration. */
export function usePricing() {
  const pricing = reactive(structuredClone(initialPricing) as Pricing)
  let controller: AbortController | undefined
  onMounted(async () => {
    controller = new AbortController()
    try {
      const response = await fetch(PRICING_API, {cache: 'no-store', signal: controller.signal})
      if (!response.ok) return
      const json = await response.json()
      if (json?.code === 2000 && json.data?.plans?.developer && json.data.plans.team && json.data.plans.enterprise) {
        Object.assign(pricing, json.data)
      }
    } catch {
      // The build-time snapshot remains available offline or during API failures.
    }
  })
  onUnmounted(() => controller?.abort())
  return pricing
}
