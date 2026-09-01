<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
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

/* --------------------------------- plates --------------------------------- */
// Model: plates are always HORIZONTAL (content face rotateX(90deg) = normal up in
// group space). The whole stack pitches via ONE variable --pitch: -90deg shows a
// plate's face dead-frontal (typing); -40deg reads as "camera above" (stack view).
// Plates move ONLY along group Y (translate3d) — never rotated individually.
// CSS 3D law: opacity/filter/will-change on a preserve-3d container FLATTENS its
// 3D children — fades live on leaf faces (.si-face/.si-edge) only.

const yPlates = reactive([0, 0, 0])
// leaf-face opacity: [yaml, resources, providers]
const faceOp = reactive([1, 0, 0])
// yaml plate's front wall: invisible while typing (frontal), fades in with the tilt
const edgeOp = ref(0)
const tileOn = reactive([false, false, false, false, false])
const chipOn = reactive([false, false, false])
const isNarrow = ref(false)
const stackPitch = ref(0)
const stackScale = ref(1)
const stackShift = ref(0)

const slabT = () => (isNarrow.value ? 20 : 26)
const cardH = () => (isNarrow.value ? 336 : 420)
// pitch: typing = frontal (-90 shows the face-up plate dead-on), stack view = -40
const typingPitch = () => (isNarrow.value ? -85 : -90)
const maxPitch = () => (isNarrow.value ? -30 : -40)
// expanded fan: plate projected depth ~ cardH*sin(40°) ≈ 270; adjacent surfaces
// sit sep*cos(40°) apart → sep = cardH + 40 keeps ~85px clear gaps (zero occlusion).
const sep = () => cardH() + (isNarrow.value ? 30 : 40)
const expScale = () => (isNarrow.value ? 0.55 : 0.6)
// screen-space shift (applied after rotation) centers the fan on the middle plate
const fanShift = () => -sep() * Math.cos((-maxPitch() * Math.PI) / 180) * expScale() + (isNarrow.value ? -14 : -30)
// assembled box: plates touching (spacing = slab thickness), box recentered a touch
const yAssembled = () => [0, slabT(), 2 * slabT()]
const boxShift = () => (isNarrow.value ? -150 : -26)

const plateStyle = (y: number) => ({transform: `translate3d(0, ${y}px, 0)`})

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

// TYPE (4s) -> TILT+L2 (1.4s) -> L3 (1.2s) -> EXPANDED hold (2s) -> ASSEMBLE (1.5s)
// -> CUBOID hold (1.4s) -> RESET (1s). Total 12.5s.
const T1 = 4.0
const T2 = 5.4
const T3 = 6.6
const T4 = 8.6
const T5 = 10.1
const T6 = 11.5
const CYCLE = 12.5

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const seg = (s: number, a: number, b: number) => clamp01((s - a) / (b - a))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const apply = (s: number) => {
  const se = sep()
  const tp = typingPitch()
  const mp = maxPitch()
  const ay = yAssembled()
  const fs = fanShift()
  const bs = boxShift()

  let pitch = tp
  let scale = 1
  let shift = 0
  let eop = 0
  const y = [0, 0, 0]
  const op = [1, 0, 0]

  if (s < T1) {
    // TYPE: stack frontal (pitch -90), only the yaml plate, typing
    typed.value = Math.floor(clamp01((s - 0.2) / (T1 - 0.6)) * YTOTAL)
    cursorOn.value = Math.floor(s * 2) % 2 === 0
    eop = 0
    tileOn.fill(false)
    chipOn.fill(false)
  } else if (s < T2) {
    // TILT + REVEAL L2: pitch -90 -> -40 lays the yaml card down into the lid
    // position while L2's leaf faces fade in and it slides out beneath
    const e = easeInOutCubic(seg(s, T1, T2))
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = lerp(tp, mp, e)
    scale = 1 + (expScale() - 1) * e
    shift = fs * e
    y[1] = se * e
    op[1] = e
    eop = e
    tileOn.fill(true)
    chipOn.fill(false)
  } else if (s < T3) {
    // REVEAL L3: slides out beneath L2, chips stagger as it arrives
    const e = easeInOutCubic(seg(s, T2, T3))
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = mp
    scale = expScale()
    shift = fs
    y[1] = se
    y[2] = 2 * se * e
    op[1] = 1
    op[2] = e
    eop = 1
    tileOn.fill(true)
    chipOn.fill(true)
  } else if (s < T4) {
    // EXPANDED hold: three flat plates fanned below the lid, gentle float
    const float = Math.sin(s * 2.2) * 6
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = mp
    scale = expScale()
    shift = fs
    y[1] = se + float
    y[2] = 2 * se + float
    op[1] = 1
    op[2] = 1
    eop = 1
  } else if (s < T5) {
    // ASSEMBLE: plates slide together until touching (spacing = thickness) and
    // the camera pushes back in — one solid cuboid, lid = yaml
    const e = easeInOutCubic(seg(s, T4, T5))
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = mp
    scale = lerp(expScale(), 1, e)
    shift = lerp(fs, bs, e)
    y[1] = lerp(se, ay[1], e)
    y[2] = lerp(2 * se, ay[2], e)
    op[1] = 1
    op[2] = 1
    eop = 1
  } else if (s < T6) {
    // CUBOID hold: solid box — lid readable, front wall = stacked plate edges;
    // lower faces are physically occluded by the lid (no display hacks)
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = mp
    scale = 1
    shift = bs
    y[1] = ay[1]
    y[2] = ay[2]
    op[1] = 1
    op[2] = 1
    eop = 1
  } else {
    // RESET: pitch back to frontal, L2/L3 faces fade + tuck under, yaml clears
    const e = easeInOutCubic(seg(s, T6, CYCLE))
    typed.value = Math.floor((1 - e) * YTOTAL)
    cursorOn.value = false
    pitch = lerp(mp, tp, e)
    scale = 1
    shift = lerp(bs, 0, e)
    y[1] = lerp(ay[1], 0, e)
    y[2] = lerp(ay[2], 0, e)
    op[1] = 1 - e
    op[2] = 1 - e
    eop = 1 - e
    tileOn.fill(false)
    chipOn.fill(false)
  }

  yPlates[0] = y[0]
  yPlates[1] = y[1]
  yPlates[2] = y[2]
  faceOp[0] = op[0]
  faceOp[1] = op[1]
  faceOp[2] = op[2]
  edgeOp.value = eop
  stackPitch.value = pitch
  stackScale.value = scale
  stackShift.value = shift
}

/* ---------------------------------- mount ---------------------------------- */

let rafId = 0
let start = 0
let mqCleanup: (() => void) | undefined

const tick = (now: number) => {
  apply(((now - start) * 0.001) % CYCLE)
  rafId = requestAnimationFrame(tick)
}

const showStaticCuboid = () => {
  typed.value = YTOTAL
  cursorOn.value = false
  const ay = yAssembled()
  yPlates[0] = ay[0]
  yPlates[1] = ay[1]
  yPlates[2] = ay[2]
  faceOp[0] = 1
  faceOp[1] = 0
  faceOp[2] = 0
  edgeOp.value = 1
  stackPitch.value = maxPitch()
  stackScale.value = 1
  stackShift.value = boxShift()
  tileOn.fill(true)
  chipOn.fill(true)
}

onMounted(() => {
  const mq = window.matchMedia('(max-width: 959px)')
  isNarrow.value = mq.matches
  const onMq = (e: MediaQueryListEvent) => {
    isNarrow.value = e.matches
  }
  mq.addEventListener('change', onMq)
  mqCleanup = () => mq.removeEventListener('change', onMq)
  if (reduced) {
    showStaticCuboid()
    return
  }
  start = performance.now()
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
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
      <div
        class="si-stack"
        :style="{'--pitch': `${stackPitch}deg`, '--ss': String(stackScale), '--shift': `${stackShift}px`}"
      >
        <div v-for="p in 3" :key="p" class="si-plate" :style="plateStyle(yPlates[p - 1])">
          <!-- yaml plate -->
          <div v-if="p === 1" class="si-face si-face--yml" :style="{opacity: faceOp[0], visibility: faceOp[0] > 0 ? 'visible' : 'hidden'}">
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

          <!-- resources plate -->
          <template v-else-if="p === 2">
            <div class="si-face si-face--res" :style="{opacity: faceOp[1], visibility: faceOp[1] > 0 ? 'visible' : 'hidden'}">
              <div class="si-card__head">
                <span class="si-card__title">{{ resTitle }}</span>
              </div>
              <div class="si-res">
                <div
                  v-for="(r, i) in resourceList"
                  :key="r.key"
                  class="si-res__tile"
                  :style="{'--c': r.color, '--i': i, opacity: tileOn[i] ? 1 : 0}"
                >
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
            <span class="si-edge" :style="{opacity: faceOp[1], visibility: faceOp[1] > 0 ? 'visible' : 'hidden'}" />
          </template>

          <!-- providers plate -->
          <template v-else>
            <div class="si-face si-face--prov" :style="{opacity: faceOp[2], visibility: faceOp[2] > 0 ? 'visible' : 'hidden'}">
              <div class="si-card__head">
                <span class="si-card__title">{{ provTitle }}</span>
              </div>
              <div class="si-prov">
                <div
                  v-for="(pr, i) in PROVIDERS"
                  :key="pr.key"
                  class="si-prov__chip"
                  :style="{'--c': pr.color, '--i': i, opacity: chipOn[i] ? 1 : 0}"
                >
                  <img :src="pr.icon" alt="" />
                </div>
              </div>
            </div>
            <span class="si-edge" :style="{opacity: faceOp[2], visibility: faceOp[2] > 0 ? 'visible' : 'hidden'}" />
          </template>

          <!-- yaml plate front wall: hidden while typing (frontal), fades in with the tilt -->
          <span v-if="p === 1" class="si-edge" :style="{opacity: edgeOp, visibility: edgeOp > 0 ? 'visible' : 'hidden'}" />
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

/* ------- color blobs behind the glass plates ------- */

.si-blobs {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.si-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(14px);
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

/* ------- 3D stage ------- */

.si-3d {
  position: absolute;
  inset: 0;
  perspective: 1600px;
}

/* the stack: ONE pitch variable (-90 typing -> -40 stack view), zero yaw */

.si-stack {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform: translateY(var(--shift, 0px)) rotateX(var(--pitch, -90deg)) scale(var(--ss, 1));
  transform-style: preserve-3d;
}

/* horizontal plates: content = top face; plates only translate along group Y.
   NO opacity/filter/will-change here — they would flatten the 3D children. */

.si-plate {
  position: absolute;
  left: -200px;
  top: -210px;
  width: 400px;
  height: 420px;
  transform-style: preserve-3d;
}

/* content face lying flat, normal up in group space (frontal at pitch -90) */
.si-face {
  --si-text: #1f2937;
  --si-muted: #6b7280;
  position: absolute;
  inset: 0;
  transform: rotateX(90deg);
  backface-visibility: hidden;
  border-radius: 26px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.97), rgba(247, 249, 252, 0.95));
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.5),
    0 4px 12px rgba(31, 41, 55, 0.12),
    0 18px 40px rgba(31, 41, 55, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dark .si-face {
  --si-text: #eef2f6;
  --si-muted: #a8b2bd;
  background: linear-gradient(160deg, rgba(58, 65, 78, 1), rgba(46, 52, 62, 1));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 18px 40px rgba(0, 0, 0, 0.55);
}

/* front thickness wall: vertical strip at the plate's FRONT edge plane
   (group z = +210 = where the face's near edge lies). Stacked plates then
   present one contiguous front wall; centered face content stays hidden
   under the lid when assembled and clear of the walls when expanded. */
.si-edge {
  position: absolute;
  left: 0;
  top: 210px;
  width: 400px;
  height: 26px;
  transform: translateZ(210px);
  background: linear-gradient(to bottom, #5d6775, #39404c);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dark .si-edge {
  background: linear-gradient(to bottom, #5d6775, #39404c);
}

.si-face--yml { padding: 18px 22px 20px; }
/* res/prov: title + content cluster at the face center — visible when expanded,
   fully hidden under the lid when assembled */
.si-face--res,
.si-face--prov { padding: 18px 22px 20px; justify-content: center; gap: 6px; }

.si-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.si-face--res .si-card__head,
.si-face--prov .si-card__head { margin-bottom: 0; justify-content: center; }

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

/* ------- resources ------- */

.si-res {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
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

/* ------- providers ------- */

.si-prov {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
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

/* ------- mobile ------- */

@media (max-width: 959px) {
  .si-3d {
    perspective: 1200px;
  }

  .si-plate {
    left: -160px;
    top: -168px;
    width: 320px;
    height: 336px;
  }

  .si-edge {
    top: 168px;
    width: 320px;
    height: 20px;
    transform: translateZ(168px);
  }

  .si-face {
    border-radius: 20px;
  }

  .si-face--yml { padding: 14px 16px 16px; }
  .si-face--res { padding: 14px 16px 16px; }
  .si-face--prov { padding: 14px 16px 16px; }

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
