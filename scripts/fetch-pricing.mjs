// Refreshes the pricing snapshot consumed by PricingPage.vue from the live,
// conf-backed /api/v1/pricing endpoint. conf/*.json (console repo) is the only
// place prices are defined — this file is a generated cache of it, never
// hand-edited: docs:build fetches hard (fail-fast — a price-less pricing page
// is worse than a failed build), docs:dev fetches soft (keeps the committed
// snapshot so offline dev still works; the browser re-fetches at runtime and
// overwrites prices anyway, which is what makes "conf edit → site reflects"
// work without a redeploy).
const ENDPOINT = 'https://console.serverlessinsight.com/api/v1/pricing'
const OUT = new URL('../docs/.vitepress/theme/pricing-data.json', import.meta.url)

const soft = process.argv.includes('--soft')

try {
  const res = await fetch(ENDPOINT, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json?.code !== 2000 || !json.data?.plans?.team) throw new Error('unexpected payload shape')

  const { writeFileSync } = await import('node:fs')
  const payload = { _source: ENDPOINT, _fetchedAt: new Date().toISOString(), ...json.data }
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(`✔ pricing snapshot refreshed from ${ENDPOINT}`)
} catch (err) {
  if (soft) {
    const { existsSync } = await import('node:fs')
    if (existsSync(OUT)) {
      console.warn(`⚠ pricing snapshot refresh failed (${err.message}) — keeping the committed snapshot`)
      process.exit(0)
    }
    console.error(`✗ no committed pricing snapshot to fall back to — run once with network access to ${ENDPOINT}`)
    process.exit(1)
  }
  console.error(`✗ pricing snapshot fetch failed: ${err.message}`)
  process.exit(1)
}
