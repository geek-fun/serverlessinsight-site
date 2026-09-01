<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useData} from 'vitepress'

const {lang} = useData()
const isZh = computed(() => lang.value.startsWith('zh'))

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------ yaml typing ------------------------------ */

type TokCls = 'key' | 'punct' | 'val'
type Tok = {cls: TokCls; text: string}
type YLine = {toks: Tok[]; len: number}

const YLINES: YLine[] = [
  {toks: [{cls: 'key', text: 'service'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' hello-world'}]},
  {toks: [{cls: 'key', text: 'functions'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '  hello_fn'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '    code'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '      runtime'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' nodejs18'}]},
  {toks: [{cls: 'key', text: '      handler'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' index.handler'}]},
  {toks: [{cls: 'key', text: '      path'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' artifacts/app.zip'}]},
  {toks: [{cls: 'key', text: 'events'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '  gateway'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '    type'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' API_GATEWAY'}]},
  {toks: [{cls: 'key', text: '    triggers'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'punct', text: '      - '}, {cls: 'key', text: 'method'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' GET'}]},
  {toks: [{cls: 'key', text: '        path'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' /api/*'}]},
  {toks: [{cls: 'key', text: '        backend'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' \${functions.hello_fn}'}]},
  {toks: [{cls: 'key', text: 'buckets'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '  assets'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '    storage'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '      class'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' STANDARD'}]}
].map((l) => ({toks: l.toks, len: l.toks.reduce((n, t) => n + t.text.length, 0)}))

const YTOTAL = YLINES.reduce((n, l) => n + l.len, 0)

const typed = ref(0)
const cursorOn = ref(false)

const typedLines = computed(() => {
  let remaining = typed.value
  if (remaining <= 0) return {lines: [], cursorLine: -1}
  const lines: Tok[][] = []
  let last = -1
  for (const line of YLINES) {
    const toks: Tok[] = []
    for (const tok of line.toks) {
      if (remaining <= 0) break
      const take = Math.min(remaining, tok.text.length)
      toks.push({cls: tok.cls, text: tok.text.slice(0, take)})
      remaining -= take
    }
    if (toks.length) last = lines.length
    lines.push(toks)
  }
  return {lines, cursorLine: cursorOn.value && last >= 0 ? last : -1}
})

/* --------------------------------- cards --------------------------------- */

const c1 = reactive({opacity: 1, y: 0, z: 0})
const c2 = reactive({opacity: 0, y: 0, z: 0})
const c3 = reactive({opacity: 0, y: 0, z: 0})
const tileOn = reactive([false, false, false, false, false])
const chipOn = reactive([false, false, false])
const isNarrow = ref(false)
const stackScale = ref(1)

const slabT = () => (isNarrow.value ? 20 : 26)
const cardH = () => (isNarrow.value ? 336 : 420)
const expScale = () => (isNarrow.value ? 0.48 : 0.6)
// center-to-center separation (unscaled) in the stack plane. Must be >= card height
// so the expanded cards never overlap; +60 gives a clear gap that stays visible after
// the 0.62 pull-back (60*0.62 ≈ 37px). Composition 3*420 + 2*60 = 1380 * 0.62 ≈ 856px.
const sep = () => cardH() + 60

// assembled (cuboid): all y=0, z = [0,-slabT,-2*slabT]
// expanded: yaml -sep (top) / resources 0 / providers +sep (bottom), z fan slightly behind
const CARD_Y_EXPANDED = () => [-sep(), 0, sep()]
const CARD_Z_ASSEMBLED = () => [0, -slabT(), -2 * slabT()]
const CARD_Z_EXPANDED = [0, -40, -80]

const cardStyle = (c: {opacity: number; y: number; z: number}) => ({
  transform: `translate3d(0, ${c.y}px, ${c.z}px)`,
  opacity: c.opacity,
  visibility: c.opacity > 0 ? 'visible' : 'hidden'
})

const RESOURCES = [
  {key: 'fn', en: 'Functions', zh: '函数', color: '#F89B40'},
  {key: 'event', en: 'Events', zh: '事件', color: '#8b5cf6'},
  {key: 'db', en: 'Database', zh: '数据库', color: '#10b981'},
  {key: 'bucket', en: 'Storage', zh: '存储', color: '#3b82f6'},
  {key: 'table', en: 'Table', zh: '表格', color: '#06b6d4'}
]
const resourceList = computed(() => RESOURCES.map((r) => ({...r, label: isZh.value ? r.zh : r.en})))

const PROVIDERS = [
  {key: 'aliyun', color: '#FF6A00', icon: '/icons/platform-aliyun.png'},
  {key: 'tencent', color: '#0052D9', icon: '/icons/platform-tencent.png'},
  {key: 'volcengine', color: '#025AF9', icon: '/icons/platform-volcengine.png'}
]

const resTitle = computed(() => (isZh.value ? '资源' : 'Resources'))
const provTitle = computed(() => (isZh.value ? '供应商' : 'Providers'))

/* ------------------------------ state machine ------------------------------ */

const CYCLE = 12.8
const T1 = 4.0 // resources appear
const T2 = 5.2 // providers appear
const T3 = 6.9 // expanded hold end (scale-out lands here)
const T4 = 9.1 // assemble end
const T5 = 10.6 // stacked hold end
const T6 = 12.0 // reset end

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const apply = (s: number) => {
  const az = CARD_Z_ASSEMBLED()
  const ez = CARD_Z_EXPANDED
  if (s < T1) {
    // TYPE: only the yaml card centered, typing
    typed.value = Math.floor(clamp01((s - 0.2) / (T1 - 0.6)) * YTOTAL)
    cursorOn.value = Math.floor(s * 2) % 2 === 0
    c1.y = 0
    c1.z = az[0]
    c1.opacity = 1
    c2.y = 0
    c2.z = az[1]
    c2.opacity = 0
    c3.y = 0
    c3.z = az[2]
    c3.opacity = 0
    stackScale.value = 1
    tileOn.fill(false)
    chipOn.fill(false)
  } else if (s < T2) {
    // RESOURCES: middle card slides in, tiles stagger
    typed.value = YTOTAL
    cursorOn.value = false
    c1.y = 0
    c1.z = az[0]
    c1.opacity = 1
    c2.y = 0
    c2.z = az[1]
    c2.opacity = 1
    c3.y = 0
    c3.z = az[2]
    c3.opacity = 0
    stackScale.value = 1
    tileOn.fill(true)
    chipOn.fill(false)
  } else if (s < T3) {
    // PROVIDERS appear + EXPLODE: cards separate along the stack axis, stack scales out
    const e = easeInOutCubic(clamp01((s - T2) / (T3 - T2)))
    const ey = CARD_Y_EXPANDED()
    c1.y = ey[0] * e
    c1.z = az[0] + (ez[0] - az[0]) * e
    c1.opacity = 1
    c2.y = ey[1] * e
    c2.z = az[1] + (ez[1] - az[1]) * e
    c2.opacity = 1
    c3.y = ey[2] * e
    c3.z = az[2] + (ez[2] - az[2]) * e
    c3.opacity = 1
    stackScale.value = 1 + (expScale() - 1) * e
    chipOn.fill(true)
    tileOn.fill(true)
  } else if (s < T4) {
    // EXPANDED hold: fully separated, scaled out
    const ey = CARD_Y_EXPANDED()
    c1.y = ey[0]
    c1.z = ez[0]
    c1.opacity = 1
    c2.y = ey[1]
    c2.z = ez[1]
    c2.opacity = 1
    c3.y = ey[2]
    c3.z = ez[2]
    c3.opacity = 1
    stackScale.value = expScale()
  } else if (s < T5) {
    // ASSEMBLE: cards slide back to the cuboid, stack scales back in
    const e = easeInOutCubic(clamp01((s - T4) / (T5 - T4)))
    const ey = CARD_Y_EXPANDED()
    c1.y = ey[0] * (1 - e)
    c1.z = az[0] + (ez[0] - az[0]) * (1 - e)
    c1.opacity = 1
    c2.y = ey[1] * (1 - e)
    c2.z = az[1] + (ez[1] - az[1]) * (1 - e)
    c2.opacity = 1
    c3.y = ey[2] * (1 - e)
    c3.z = az[2] + (ez[2] - az[2]) * (1 - e)
    c3.opacity = 1
    stackScale.value = 1 + (expScale() - 1) * (1 - e)
  } else if (s < T6) {
    // STACKED hold (cuboid)
    c1.y = 0
    c1.z = az[0]
    c1.opacity = 1
    c2.y = 0
    c2.z = az[1]
    c2.opacity = 1
    c3.y = 0
    c3.z = az[2]
    c3.opacity = 1
    stackScale.value = 1
  } else {
    // RESET
    const e = clamp01((s - T6) / (CYCLE - T6))
    typed.value = Math.floor((1 - e) * YTOTAL)
    cursorOn.value = false
    c1.y = 0
    c1.z = az[0]
    c1.opacity = 1
    c2.y = 48 * e
    c2.z = az[1]
    c2.opacity = 1 - e
    c3.y = 64 * e
    c3.z = az[2]
    c3.opacity = 1 - e
    stackScale.value = 1
    tileOn.fill(false)
    chipOn.fill(false)
  }
}

/* ---------------------------------- mount ---------------------------------- */

const stackRef = ref<HTMLElement | null>(null)
const c2Ref = ref<HTMLElement | null>(null)
const c3Ref = ref<HTMLElement | null>(null)

const measure = () => {
  // cards are centered; nothing to compute for the typing offset
}

let rafId = 0
let start = 0
let resizeObserver: ResizeObserver | undefined
let mqCleanup: (() => void) | undefined

const tick = (now: number) => {
  apply(((now - start) * 0.001) % CYCLE)
  rafId = requestAnimationFrame(tick)
}

const showStaticExpanded = () => {
  typed.value = YTOTAL
  cursorOn.value = false
  const ey = CARD_Y_EXPANDED()
  const ez = CARD_Z_EXPANDED
  c1.y = ey[0]
  c1.z = ez[0]
  c1.opacity = 1
  c2.y = ey[1]
  c2.z = ez[1]
  c2.opacity = 1
  c3.y = ey[2]
  c3.z = ez[2]
  c3.opacity = 1
  stackScale.value = expScale()
  tileOn.fill(true)
  chipOn.fill(true)
}

onMounted(() => {
  isNarrow.value = window.matchMedia('(max-width: 959px)').matches
  const mq = window.matchMedia('(max-width: 959px)')
  const onMq = (e: MediaQueryListEvent) => { isNarrow.value = e.matches }
  mq.addEventListener('change', onMq)
  mqCleanup = () => mq.removeEventListener('change', onMq)
  measure()
  resizeObserver = new ResizeObserver(() => measure())
  if (stackRef.value) resizeObserver.observe(stackRef.value)
  if (reduced) {
    showStaticExpanded()
    return
  }
  start = performance.now()
  rafId = requestAnimationFrame(tick)
})

watch(isZh, () => { void nextTick(measure) })

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  mqCleanup?.()
})
</script>

<template>
  <div class="si-hero-scene" aria-hidden="true">
    <div class="si-blobs">
      <span class="si-blob si-blob--a" />
      <span class="si-blob si-blob--b" />
      <span class="si-blob si-blob--c" />
    </div>

    <div class="si-3d">
      <div ref="stackRef" class="si-stack" :style="{ '--ss': String(stackScale) }">
        <div class="si-card" :style="cardStyle(c1)">
          <span class="si-card__top" aria-hidden="true" />
          <div class="si-card__front si-card__front--yml">
            <div class="si-card__head">
              <span class="si-card__file-dot" />
              <span class="si-card__title si-card__title--mono">serverlessinsight.yml</span>
            </div>
            <div class="si-yaml">
              <div v-for="(line, li) in typedLines.lines" :key="li" class="si-yaml__line">
                <span v-for="(tok, ti) in line" :key="ti" :class="`si-tok si-tok--${tok.cls}`">{{ tok.text }}</span>
                <span v-if="cursorOn && li === typedLines.cursorLine" class="si-yaml__cursor" />
              </div>
            </div>
          </div>
          <span class="si-card__bottom" aria-hidden="true" />
        </div>

        <div ref="c2Ref" class="si-card" :style="cardStyle(c2)">
          <span class="si-card__top" aria-hidden="true" />
          <div class="si-card__front si-card__front--res">
            <div class="si-card__head">
              <span class="si-card__title">{{ resTitle }}</span>
            </div>
            <div class="si-res">
              <div v-for="(r, i) in resourceList" :key="r.key" class="si-res__tile" :style="{ '--c': r.color, '--i': i, opacity: tileOn[i] ? 1 : 0 }">
                <svg v-if="r.key === 'fn'" viewBox="0 0 24 24" aria-hidden="true">
                  <text x="12" y="17.5" text-anchor="middle" font-size="19" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="700" fill="currentColor">ƒ</text>
                </svg>
                <svg v-else-if="r.key === 'event'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13 2 3 14h6l-2 8 10-12h-6z" />
                </svg>
                <svg v-else-if="r.key === 'db'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <ellipse cx="12" cy="6" rx="7" ry="2.6" />
                  <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
                  <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
                </svg>
                <svg v-else-if="r.key === 'bucket'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 3 19 7v10l-7 4-7-4V7z" />
                  <path d="M5 7l7 4 7-4" />
                  <path d="M12 11v10" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" />
                  <rect x="13" y="3" width="8" height="8" rx="1.5" />
                  <rect x="3" y="13" width="8" height="8" rx="1.5" />
                  <rect x="13" y="13" width="8" height="8" rx="1.5" />
                </svg>
                <span class="si-res__label">{{ r.label }}</span>
              </div>
            </div>
          </div>
          <span class="si-card__bottom" aria-hidden="true" />
        </div>

        <div ref="c3Ref" class="si-card" :style="cardStyle(c3)">
          <span class="si-card__top" aria-hidden="true" />
          <div class="si-card__front si-card__front--prov">
            <div class="si-card__head">
              <span class="si-card__title">{{ provTitle }}</span>
            </div>
            <div class="si-prov">
              <div v-for="(p, i) in PROVIDERS" :key="p.key" class="si-prov__chip" :style="{ '--c': p.color, '--i': i, opacity: chipOn[i] ? 1 : 0 }">
                <img :src="p.icon" alt="" />
              </div>
            </div>
          </div>
          <span class="si-card__bottom" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.si-hero-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

/* ------- color blobs behind the glass cards (make the blur visible) ------- */

.si-blobs {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.si-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(14px);
  will-change: transform;
}

.si-blob--a {
  width: 400px;
  height: 400px;
  left: 6%;
  top: 2%;
  background: radial-gradient(circle, rgba(248, 155, 64, 0.7), rgba(248, 155, 64, 0) 70%);
}

.si-blob--b {
  width: 480px;
  height: 480px;
  right: -4%;
  top: 26%;
  background: radial-gradient(circle, rgba(0, 82, 217, 0.6), rgba(0, 82, 217, 0) 70%);
}

.si-blob--c {
  width: 360px;
  height: 360px;
  left: 14%;
  bottom: 0;
  background: radial-gradient(circle, rgba(248, 155, 64, 0.45), rgba(2, 90, 249, 0) 72%);
}

@keyframes si-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(34px, -26px) scale(1.1); }
}

@media (prefers-reduced-motion: no-preference) {
  .si-blob--a { animation: si-drift 20s ease-in-out infinite; }
  .si-blob--b { animation: si-drift 26s ease-in-out infinite reverse; }
  .si-blob--c { animation: si-drift 23s ease-in-out infinite; }
}

@media (prefers-reduced-motion: reduce) {
  .si-blob { animation: none !important; }
}

/* ------- 3D stage: fixed pitch, zero yaw ------- */

.si-3d {
  position: absolute;
  inset: 0;
  perspective: 1100px;
}

/* ------- the stack: preserve-3d, tilted once, cards overlap in depth ------- */

.si-stack {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform: rotateX(22deg) scale(var(--ss, 1));
  transform-style: preserve-3d;
  transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* ------- true 3D slab cards (absolute, centered; JS drives y/z) ------- */

.si-card {
  --si-text: #1f2937;
  --si-muted: #6b7280;
  position: absolute;
  left: -200px;
  top: -210px;
  width: 400px;
  height: 420px;
  transform-style: preserve-3d;
  transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.dark .si-card {
  --si-text: #eef2f6;
  --si-muted: #a8b2bd;
}

.si-card__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 26px;
  transform-origin: top center;
  transform: rotateX(90deg);
  border-radius: 26px 26px 0 0;
  background: linear-gradient(to bottom, #eef1f6, #d8dde4);
  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.5);
}

.dark .si-card__top {
  background: linear-gradient(to bottom, #6a7482, #4a525f);
  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.12);
}

.si-card__bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 26px;
  transform-origin: bottom center;
  transform: rotateX(-90deg);
  border-radius: 0 0 26px 26px;
  background: linear-gradient(to top, #e3e7ec, #ccd2da);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.4);
}

.dark .si-card__bottom {
  background: linear-gradient(to top, #5a626f, #3c434e);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.08);
}

/* ------- translucent front faces (no backdrop-filter — unlocks true 3D) ------- */

.si-card__front {
  position: absolute;
  inset: 0;
  border-radius: 26px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.62), rgba(238, 243, 249, 0.5));
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 4px 12px rgba(31, 41, 55, 0.12),
    0 18px 40px rgba(31, 41, 55, 0.2),
    0 2px 4px rgba(31, 41, 55, 0.06);
  display: flex;
  flex-direction: column;
}

.dark .si-card__front {
  background: linear-gradient(160deg, rgba(52, 58, 70, 0.88), rgba(38, 43, 52, 0.82));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 18px 40px rgba(0, 0, 0, 0.6);
}

.si-card__front--yml { padding: 18px 22px 20px; }
.si-card__front--res { padding: 18px 22px 20px; }
.si-card__front--prov { padding: 18px 22px 20px; }

.si-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.si-card__file-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f89b40;
  box-shadow: 0 0 0 3px rgba(248, 155, 64, 0.18);
}

.si-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--si-muted);
  letter-spacing: 0.1px;
}

.si-card__title--mono {
  font-family: 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  color: var(--si-text);
}

/* ------- yaml ------- */

.si-yaml {
  white-space: pre;
  font-family: 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.48;
  color: var(--si-text);
}

.si-tok--key { color: #f89b40; }
.si-tok--punct { color: var(--si-muted); }
.si-tok--val { color: var(--si-text); }

.si-yaml__cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.15em;
  margin-left: 2px;
  vertical-align: -0.18em;
  background: var(--si-text);
  animation: si-blink 1s steps(1) infinite;
}

@keyframes si-blink {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .si-yaml__cursor { animation: none; opacity: 1; }
}

/* ------- resources: centered within the fixed card ------- */

.si-res {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  flex: 1;
  padding: 8px 0;
}

.si-res__tile {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 16px 2px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 0.12s);
}

.dark .si-res__tile {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.si-res__tile svg {
  width: 30px;
  height: 30px;
  color: var(--c);
}

.si-res__label {
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  color: var(--si-muted);
}

/* ------- providers: centered within the fixed card ------- */

.si-prov {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  flex: 1;
}

.si-prov__chip {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--c);
  background: rgba(255, 255, 255, 0.7);
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 0.3s);
}

.dark .si-prov__chip {
  background: rgba(255, 255, 255, 0.08);
}

.si-prov__chip img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

/* ------- mobile: the scene is a full-width block below the hero text ------- */

@media (max-width: 959px) {
  .si-3d {
    perspective: 900px;
  }

  .si-stack {
    transform: rotateX(13deg) scale(var(--ss, 1));
  }

  .si-card {
    left: -160px;
    top: -168px;
    width: 320px;
    height: 336px;
  }

  .si-card__top,
  .si-card__bottom {
    height: 20px;
    border-radius: 20px 20px 0 0;
  }

  .si-card__bottom {
    border-radius: 0 0 20px 20px;
  }

  .si-card__front {
    border-radius: 20px;
  }

  .si-card__front--yml { padding: 14px 16px 16px; }
  .si-card__front--res { padding: 14px 16px 16px; }
  .si-card__front--prov { padding: 14px 16px 16px; }

  .si-yaml {
    font-size: 11px;
    line-height: 1.5;
  }

  .si-card__head { margin-bottom: 10px; }

  .si-res__tile svg { width: 24px; height: 24px; }
  .si-res__label { font-size: 10px; }
  .si-res__tile { gap: 7px; padding: 12px 2px 10px; }

  .si-prov__chip { width: 56px; height: 56px; border-radius: 15px; }
  .si-prov__chip img { width: 30px; height: 30px; }

  .si-blob--a { width: 260px; height: 260px; }
  .si-blob--b { width: 300px; height: 300px; }
  .si-blob--c { width: 240px; height: 240px; }
}
</style>
