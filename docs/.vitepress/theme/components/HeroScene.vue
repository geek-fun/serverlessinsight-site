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
  {toks: [{cls: 'key', text: '        backend'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' hello_fn'}]},
  {toks: [{cls: 'key', text: 'databases'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '  main_db'}, {cls: 'punct', text: ':'}]},
  {toks: [{cls: 'key', text: '    type'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' RDS_MYSQL_SERVERLESS'}]},
  {toks: [{cls: 'key', text: '    version'}, {cls: 'punct', text: ':'}, {cls: 'val', text: ' MYSQL_8.0'}]},
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

const c1 = reactive({opacity: 1, y: 0})
const c2 = reactive({opacity: 0, y: 48})
const c3 = reactive({opacity: 0, y: 64})
const gap = ref(34)
const tileOn = reactive([false, false, false, false, false])
const chipOn = reactive([false, false, false])
const typeOffset = ref(0)
const isNarrow = ref(false)

const STACKED_GAP = 4
const expandedGap = () => (isNarrow.value ? 18 : 34)

const cardStyle = (c: {opacity: number; y: number}) => ({
  transform: `translate3d(0, ${c.y}px, 0)`,
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

const CYCLE = 12.6
const T1 = 4.5 // resources appear
const T2 = 5.7 // providers appear
const T3 = 7.1 // expanded hold end
const T4 = 9.1 // assemble end
const T5 = 10.6 // stacked hold end
const T6 = 11.8 // reset end

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

const apply = (s: number) => {
  const eg = expandedGap()
  if (s < T1) {
    // TYPE: only the yaml card centered, typing
    typed.value = Math.floor(clamp01((s - 0.2) / (T1 - 0.6)) * YTOTAL)
    cursorOn.value = Math.floor(s * 2) % 2 === 0
    c1.y = typeOffset.value
    c1.opacity = 1
    c2.y = 48
    c2.opacity = 0
    c3.y = 64
    c3.opacity = 0
    gap.value = eg
    tileOn.fill(false)
    chipOn.fill(false)
  } else if (s < T2) {
    // RESOURCES: middle card slides in below, tiles stagger
    typed.value = YTOTAL
    cursorOn.value = false
    c1.y = 0
    c1.opacity = 1
    c2.y = 0
    c2.opacity = 1
    c3.y = 64
    c3.opacity = 0
    gap.value = eg
    tileOn.fill(true)
    chipOn.fill(false)
  } else if (s < T3) {
    // PROVIDERS: base card slides in, chips stagger
    c1.y = 0
    c1.opacity = 1
    c2.y = 0
    c2.opacity = 1
    c3.y = 0
    c3.opacity = 1
    gap.value = eg
    chipOn.fill(true)
  } else if (s < T4) {
    // EXPANDED hold
    c1.y = 0
    c1.opacity = 1
    c2.y = 0
    c2.opacity = 1
    c3.y = 0
    c3.opacity = 1
    gap.value = eg
  } else if (s < T5) {
    // ASSEMBLE
    c1.y = 0
    c1.opacity = 1
    c2.y = 0
    c2.opacity = 1
    c3.y = 0
    c3.opacity = 1
    gap.value = STACKED_GAP
  } else if (s < T6) {
    // STACKED hold
    c1.y = 0
    c1.opacity = 1
    c2.y = 0
    c2.opacity = 1
    c3.y = 0
    c3.opacity = 1
    gap.value = STACKED_GAP
  } else {
    // RESET
    const e = clamp01((s - T6) / (CYCLE - T6))
    typed.value = Math.floor((1 - e) * YTOTAL)
    cursorOn.value = false
    c1.y = 0
    c1.opacity = 1
    c2.y = 48 * e
    c2.opacity = 1 - e
    c3.y = 64 * e
    c3.opacity = 1 - e
    gap.value = STACKED_GAP
    tileOn.fill(false)
    chipOn.fill(false)
  }
}

/* ---------------------------------- mount ---------------------------------- */

const stackRef = ref<HTMLElement | null>(null)
const c2Ref = ref<HTMLElement | null>(null)
const c3Ref = ref<HTMLElement | null>(null)

const measure = () => {
  const h2 = c2Ref.value?.offsetHeight ?? 104
  const h3 = c3Ref.value?.offsetHeight ?? 88
  typeOffset.value = (h2 + h3 + 2 * expandedGap()) / 2
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
  c1.y = 0
  c1.opacity = 1
  c2.y = 0
  c2.opacity = 1
  c3.y = 0
  c3.opacity = 1
  gap.value = expandedGap()
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
      <div ref="stackRef" class="si-stack" :style="{ '--gap': `${gap}px` }">
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
  width: 360px;
  height: 360px;
  left: 6%;
  top: 4%;
  background: radial-gradient(circle, rgba(248, 155, 64, 0.4), rgba(248, 155, 64, 0) 70%);
}

.si-blob--b {
  width: 440px;
  height: 440px;
  right: -4%;
  top: 28%;
  background: radial-gradient(circle, rgba(0, 82, 217, 0.32), rgba(0, 82, 217, 0) 70%);
}

.si-blob--c {
  width: 320px;
  height: 320px;
  left: 16%;
  bottom: 2%;
  background: radial-gradient(circle, rgba(248, 155, 64, 0.24), rgba(2, 90, 249, 0) 72%);
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
  perspective: 1200px;
}

/* ------- the stack: flex column along the stack axis, tilted once ------- */

.si-stack {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotateX(14deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap, 34px);
  padding: 10px 12px;
  transition: gap 0.9s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ------- slab cards: top face strip + frosted front face ------- */

.si-card {
  position: relative;
  width: 360px;
  max-width: 100%;
  transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.si-card__top {
  display: block;
  height: 16px;
  border-radius: 24px 24px 0 0;
  background: linear-gradient(to bottom, rgba(226, 230, 236, 0.95), rgba(208, 213, 221, 0.95));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.25);
}

.dark .si-card__top {
  background: linear-gradient(to bottom, rgba(52, 58, 70, 0.95), rgba(38, 43, 52, 0.95));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), inset 0 -1px 0 rgba(255, 255, 255, 0.03);
}

/* ------- liquid glass front faces ------- */

.si-card__front {
  --si-text: #1f2937;
  --si-muted: #6b7280;
  position: relative;
  border-radius: 0 0 24px 24px;
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  backdrop-filter: blur(20px) saturate(1.4);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 4px 12px rgba(31, 41, 55, 0.06),
    0 18px 40px rgba(31, 41, 55, 0.1),
    0 2px 4px rgba(31, 41, 55, 0.04);
}

.dark .si-card__front {
  --si-text: #e6e9ed;
  --si-muted: #9aa3ad;
  background: rgba(22, 24, 29, 0.55);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.25),
    0 18px 40px rgba(0, 0, 0, 0.35);
}

.si-card__front--yml { padding: 12px 16px 14px; }
.si-card__front--res { padding: 14px 16px 16px; }
.si-card__front--prov { padding: 14px 16px 16px; }

.si-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
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
  line-height: 1.5;
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

/* ------- resources ------- */

.si-res {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.si-res__tile {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 11px 2px 9px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 0.12s);
}

.dark .si-res__tile {
  background: rgba(255, 255, 255, 0.05);
}

.si-res__tile svg {
  width: 24px;
  height: 24px;
  color: var(--c);
}

.si-res__label {
  font-size: 10.5px;
  line-height: 1;
  white-space: nowrap;
  color: var(--si-muted);
}

/* ------- providers ------- */

.si-prov {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.si-prov__chip {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--c);
  background: rgba(255, 255, 255, 0.55);
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 0.3s);
}

.dark .si-prov__chip {
  background: rgba(255, 255, 255, 0.07);
}

.si-prov__chip img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

/* ------- mobile: the scene is a full-width block below the hero text ------- */

@media (max-width: 959px) {
  .si-3d {
    perspective: 1000px;
  }

  .si-stack {
    padding: 6px 12px;
    transform: translate(-50%, -50%) rotateX(8deg);
  }

  .si-card {
    width: 330px;
    max-width: 100%;
  }

  .si-card__top {
    height: 12px;
    border-radius: 20px 20px 0 0;
  }

  .si-card__front {
    border-radius: 0 0 20px 20px;
  }

  .si-card__front--yml { padding: 10px 12px 12px; }
  .si-card__front--res { padding: 9px 12px 11px; }
  .si-card__front--prov { padding: 9px 12px 11px; }

  .si-yaml {
    font-size: 10.5px;
    line-height: 1.42;
  }

  .si-card__head { margin-bottom: 7px; }

  .si-res__tile svg { width: 21px; height: 21px; }
  .si-res__label { font-size: 9.5px; }
  .si-res__tile { gap: 6px; padding: 9px 2px 7px; }

  .si-prov__chip { width: 48px; height: 48px; border-radius: 13px; }
  .si-prov__chip img { width: 25px; height: 25px; }

  .si-blob--a { width: 260px; height: 260px; }
  .si-blob--b { width: 300px; height: 300px; }
  .si-blob--c { width: 240px; height: 240px; }
}
</style>
