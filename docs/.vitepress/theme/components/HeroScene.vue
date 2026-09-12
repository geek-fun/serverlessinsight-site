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
// group space). ONE animated pitch: -90deg shows a plate's face dead-frontal
// (typing); -40deg reads as "camera above" (stack view). Plates move ONLY along
// group Y. CSS 3D law: opacity/filter/will-change on a preserve-3d container
// FLATTENS its 3D children — fades live on leaf faces only. Assembled cuboid =
// three glass layers with air between, corners tied by dashed vertical guide
// lines (边角虚线连接).

const y0 = ref(0)
const y1 = ref(0)
const y2 = ref(0)
const s1 = ref(1)
const s2 = ref(1)
// leaf-face opacity: [yaml, resources, providers]
const faceOp = reactive([1, 0, 0])
const wireOp = ref(0)
const wireH = ref(0)
const wallOp = ref(0)
const tileOn = reactive([false, false, false, false, false])
const chipOn = reactive([false, false, false])
const isNarrow = ref(false)
const stackPitch = ref(0)
const stackScale = ref(1)
const stackShift = ref(0)
const asStep = ref(226)

const cardH = () => (isNarrow.value ? 336 : 420)
// pitch: typing = frontal (-90 shows the face-up plate dead-on); the stack view
// tilts to maxPitch, and assembly rotates a little further (asPitch) so the
// cuboid presents its top face
const typingPitch = () => (isNarrow.value ? -85 : -90)
const maxPitch = () => (isNarrow.value ? -28 : -38)
const asPitch = () => (isNarrow.value ? -24 : -28)
// expanded fan: plate projected depth ~ cardH*sin(pitch); sep keeps clear gaps
const sep = () => cardH() + (isNarrow.value ? 20 : -20)
// desktop keeps scale 1 through the whole reveal; mobile frames the taller fan
// with a gentle pull-back spread over the tilt (not during the layer reveals)
const expScale = () => (isNarrow.value ? 0.85 : 1)
// screen-space shift (applied after rotation) centers the fan on the middle plate
const fanShift = () => -sep() * Math.cos((-maxPitch() * Math.PI) / 180) * expScale() - 6
// after the tilt the lid rests a touch higher than dead-center
const raise = () => (isNarrow.value ? -20 : -36)
// assembled cuboid: surfaces at -step / 0 / +step — 2*step + blockH stays just
// under the plate width, so the final box is a slightly-flat CUBE, not a pillar
const asSpacing = () => (isNarrow.value ? 130 : 165)
// block thickness: each layer grows glass walls and becomes a slightly-flat cuboid
const blockH = () => (isNarrow.value ? 48 : 56)
const cubScale = () => (isNarrow.value ? 0.75 : 1)
// mobile: seat the box in the upper part of the 620px scene (lid clears the
// scene's top edge, providers peek past the first-viewport fold)
const cubShift = () => (isNarrow.value ? -136 : -10)
// derivation: a child layer is extruded from beneath its parent — it starts
// just below the parent, smaller, and grows into place (layer 1 generates the
// resources, the resources generate the providers)
const deriveOffset = () => (isNarrow.value ? 96 : 110)
const deriveScale = () => 0.72

const RESOURCES = [
  {key: 'fn', en: 'Functions', zh: '函数', color: '#8F6AE7'},
  {key: 'event', en: 'Events', zh: '事件', color: '#F89B40'},
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

// the four side walls of each layer's block (front / back / left / right)
const WALLS = ['f', 'b', 'l', 'r']

const resTitle = computed(() => (isZh.value ? '资源' : 'Resources'))
const provTitle = computed(() => (isZh.value ? '供应商' : 'Providers'))

/* ------------------------------ state machine ------------------------------ */

// TYPE (3.6s) -> TILT (1.2s, lid settles + raises) -> L2 derives from L1 (1.8s)
// -> L3 derives from L2 (1.8s) -> EXPANDED hold (1.4s) -> ASSEMBLE (1.4s:
// layers close in, slabs grow thickness, guides extend downward)
// -> CUBOID hold (1.6s) -> RESET (1s). Total 13.8s.
const T1 = 3.6
const T2 = 4.8
const T3 = 6.6
const T4 = 8.4
const T5 = 9.8
const T6 = 11.2
const T7 = 12.8
const CYCLE = 13.8

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const seg = (s: number, a: number, b: number) => clamp01((s - a) / (b - a))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const apply = (s: number) => {
  const se = sep()
  const tp = typingPitch()
  const mp = maxPitch()
  const ap = asPitch()
  const stp = asSpacing()
  const fs = fanShift()
  const cs = cubShift()
  const df = deriveOffset()
  const ds = deriveScale()
  asStep.value = stp

  let pitch = tp
  let scale = 1
  let shift = 0
  let wire = 0
  let wall = 0
  const y = [0, 0, 0]
  const sc = [1, 1, 1]
  const op = [1, 0, 0]

  if (s < T1) {
    // TYPE: stack frontal (pitch -90), only the yaml plate, typing
    typed.value = Math.floor(clamp01((s - 0.2) / (T1 - 0.6)) * YTOTAL)
    cursorOn.value = Math.floor(s * 2) % 2 === 0
    tileOn.fill(false)
    chipOn.fill(false)
  } else if (s < T2) {
    // TILT: pitch -90 -> stack view; the lid settles and rests a touch higher
    const e = easeInOutCubic(seg(s, T1, T2))
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = lerp(tp, mp, e)
    scale = lerp(1, expScale(), e)
    shift = lerp(0, raise(), e)
  } else if (s < T3) {
    // L2 DERIVES from L1: extruded from just beneath the lid, smaller, growing
    // into its slot — layer 1 generates the resources
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = mp
    scale = expScale()
    shift = raise()
    const e = easeOutCubic(seg(s, T2, T3))
    y[1] = lerp(df, se, e)
    sc[1] = lerp(ds, 1, e)
    op[1] = clamp01(e * 1.6)
    tileOn.fill(true)
  } else if (s < T4) {
    // L3 DERIVES from L2 the same way; the camera reframes to hold the fan
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = mp
    scale = expScale()
    const e = easeOutCubic(seg(s, T3, T4))
    y[1] = se
    y[2] = lerp(se + df, 2 * se, e)
    sc[2] = lerp(ds, 1, e)
    op[1] = 1
    op[2] = clamp01(e * 1.6)
    shift = lerp(raise(), fs, e)
    tileOn.fill(true)
    chipOn.fill(true)
  } else if (s < T5) {
    // EXPANDED hold: three flat plates fanned, gentle float
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
  } else if (s < T6) {
    // ASSEMBLE: from planes to blocks — layers close in with air between, every
    // plate grows glass walls (paper becomes a slightly-flat cuboid), the view
    // opens up a touch, and the dashed corner guides extend down the corners
    const e = easeInOutCubic(seg(s, T5, T6))
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = lerp(mp, ap, e)
    shift = lerp(fs, cs, e)
    y[0] = lerp(0, -stp, e)
    y[1] = lerp(se, 0, e)
    y[2] = lerp(2 * se, stp, e)
    op[1] = 1
    op[2] = 1
    wall = e
    wire = e
  } else if (s < T7) {
    // CUBOID hold: three glass blocks + corner guides = one box with air inside
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = ap
    shift = cs
    y[0] = -stp
    y[1] = 0
    y[2] = stp
    op[1] = 1
    op[2] = 1
    wall = 1
    wire = 1
  } else {
    // RESET: guides retract, walls thin back to planes, layers sink and fade,
    // pitch returns to frontal
    const e = easeInOutCubic(seg(s, T7, CYCLE))
    typed.value = Math.floor((1 - e) * YTOTAL)
    cursorOn.value = false
    pitch = lerp(ap, tp, e)
    scale = lerp(cubScale(), 1, e)
    shift = lerp(cs, 0, e)
    y[0] = lerp(-stp, 0, e)
    y[1] = lerp(0, df, e)
    y[2] = lerp(stp, se + df, e)
    sc[1] = lerp(1, ds, e)
    sc[2] = lerp(1, ds, e)
    op[1] = 1 - e
    op[2] = 1 - e
    wall = 1 - e
    wire = 1 - e
    tileOn.fill(false)
    chipOn.fill(false)
  }

  y0.value = y[0]
  y1.value = y[1]
  y2.value = y[2]
  s1.value = sc[0]
  s2.value = sc[1]
  faceOp[0] = op[0]
  faceOp[1] = op[1]
  faceOp[2] = op[2]
  wireOp.value = wire
  wireH.value = (2 * stp + blockH()) * wire
  wallOp.value = wall
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
  y0.value = -asSpacing()
  y1.value = 0
  y2.value = asSpacing()
  faceOp[0] = 1
  faceOp[1] = 1
  faceOp[2] = 1
  wireOp.value = 1
  wireH.value = 2 * asSpacing() + blockH()
  wallOp.value = 1
  stackPitch.value = asPitch()
  stackScale.value = cubScale()
  stackShift.value = cubShift()
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
        :style="{'--pitch': `${stackPitch}deg`, '--ss': String(stackScale), '--shift': `${stackShift}px`, '--as': `${asStep}px`, '--wg': String(wallOp)}"
      >
        <!-- dashed corner guides: tie the three layers into one cuboid -->
        <span
          v-for="w in 4"
          :key="`w${w}`"
          class="si-wire"
          :class="[w < 3 ? 'si-wire--l' : 'si-wire--r', w % 2 === 1 ? 'si-wire--f' : 'si-wire--b']"
          :style="{opacity: wireOp, height: `${wireH}px`, visibility: wireOp > 0 && wireH > 0 ? 'visible' : 'hidden'}"
        />

        <div class="si-plate" :style="{transform: `translate3d(0, ${y0}px, 0)`}">
          <div class="si-face si-face--yml" :style="{opacity: faceOp[0], visibility: faceOp[0] > 0 ? 'visible' : 'hidden'}">
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
          <i
            v-for="d in WALLS"
            :key="`w1-${d}`"
            class="si-wall"
            :class="`si-wall--${d}`"
            :style="{opacity: wallOp, visibility: wallOp > 0 ? 'visible' : 'hidden'}"
          />
        </div>

        <div class="si-plate" :style="{transform: `translate3d(0, ${y1}px, 0)`}">
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
          <i
            v-for="d in WALLS"
            :key="`w2-${d}`"
            class="si-wall"
            :class="`si-wall--${d}`"
            :style="{opacity: wallOp, visibility: wallOp > 0 ? 'visible' : 'hidden'}"
          />
        </div>

        <div class="si-plate" :style="{transform: `translate3d(0, ${y2}px, 0)`}">
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
          <i
            v-for="d in WALLS"
            :key="`w3-${d}`"
            class="si-wall"
            :class="`si-wall--${d}`"
            :style="{opacity: wallOp, visibility: wallOp > 0 ? 'visible' : 'hidden'}"
          />
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
  background: radial-gradient(circle, rgba(143, 106, 231, 0.7), rgba(143, 106, 231, 0) 70%);
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
  background: radial-gradient(circle, rgba(143, 106, 231, 0.45), rgba(2, 90, 249, 0) 72%);
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

/* the stack: ONE pitch variable (-90 typing -> -40 stack view), zero yaw.
   On desktop it shifts left inside the right-half canvas so the 3D scene and
   the hero text split the main area visually 50/50. */

.si-stack {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform: translateY(var(--shift, 0px)) rotateX(var(--pitch, -90deg)) scale(var(--ss, 1));
  transform-style: preserve-3d;
}

@media (min-width: 960px) {
  .si-stack {
    left: calc(50% - 80px);
  }
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
  box-shadow: 0 6px 18px rgba(31, 41, 55, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dark .si-face {
  --si-text: #eef2f6;
  --si-muted: #a8b2bd;
  background: linear-gradient(160deg, rgba(58, 65, 78, 0.98), rgba(46, 52, 62, 0.98));
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
}

.si-face--yml { padding: 18px 22px 20px; }
/* res/prov: title + content cluster at the face center — visible when expanded
   and in the layered cuboid, fully clear of neighbouring plates */
.si-face--res,
.si-face--prov { padding: 18px 22px 16px; justify-content: flex-end; gap: 6px; }

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
  background: #8F6AE7;
  box-shadow: 0 0 0 3px rgba(143, 106, 231, 0.18);
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

/* ------- dashed corner guides (cuboid wireframe) ------- */

/* corner guides: thin, quiet, extending downward from the lid corners */
.si-wire {
  position: absolute;
  width: 1.5px;
  top: calc(-1 * var(--as, 280px) - 2px);
  background: repeating-linear-gradient(to bottom, rgba(154, 165, 180, 0.42) 0 5px, transparent 5px 13px);
}

.si-wire--l { left: -200px; }
.si-wire--r { left: 198.5px; }
.si-wire--f { transform: translateZ(210px); }
.si-wire--b { transform: translateZ(-210px); }

.dark .si-wire {
  background: repeating-linear-gradient(to bottom, rgba(165, 176, 192, 0.38) 0 5px, transparent 5px 13px);
}

/* layer blocks: during assembly every plate grows four glass walls hanging
   from its sheet edge (planes become slightly-flat cuboids). Walls are leaf
   elements, so the opacity animation is safe. --wg scales them up from the
   sheet plane; height = block thickness (56px desktop / 48px mobile). */
.si-wall {
  position: absolute;
  top: 210px;
  height: 56px;
  transform-origin: 50% 0;
  backface-visibility: visible;
}

.si-wall--f,
.si-wall--b {
  left: 0;
  width: 400px;
  border-radius: 0 0 10px 10px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(214, 222, 232, 0.22));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(148, 163, 184, 0.35), inset 1px 0 0 rgba(148, 163, 184, 0.2), inset -1px 0 0 rgba(148, 163, 184, 0.2);
}

.si-wall--f { transform: translateZ(210px) scaleY(var(--wg, 0)); }
.si-wall--b { transform: translateZ(-210px) scaleY(var(--wg, 0)); }

.si-wall--l,
.si-wall--r {
  top: 210px;
  width: 420px;
  background: linear-gradient(to bottom, rgba(226, 233, 242, 0.42), rgba(198, 208, 222, 0.2));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(148, 163, 184, 0.3);
}

.si-wall--l { left: -210px; transform: rotateY(90deg) scaleY(var(--wg, 0)); }
.si-wall--r { left: 190px; transform: rotateY(90deg) scaleY(var(--wg, 0)); }

.dark .si-wall--f,
.dark .si-wall--b {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.25), inset 1px 0 0 rgba(255, 255, 255, 0.08), inset -1px 0 0 rgba(255, 255, 255, 0.08);
}

.dark .si-wall--l,
.dark .si-wall--r {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

/* ------- yaml ------- */

.si-yaml {
  white-space: pre;
  font-family: 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.48;
  color: var(--si-text);
}

.si-tok--key { color: #6640BF; }
.dark .si-tok--key { color: #A384EB; }
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

  .si-wire {
    top: calc(-1 * var(--as, 200px) - 2px);
  }

  .si-wall {
    height: 48px;
  }

  .si-wall--f,
  .si-wall--b {
    width: 320px;
  }

  .si-wall--f { transform: translateZ(168px) scaleY(var(--wg, 0)); }
  .si-wall--b { transform: translateZ(-168px) scaleY(var(--wg, 0)); }

  .si-wall--l,
  .si-wall--r {
    width: 336px;
  }

  .si-wall--l { left: -168px; }
  .si-wall--r { left: 152px; }

  .si-wire--l { left: -160px; }
  .si-wire--r { left: 158.5px; }
  .si-wire--f { transform: translateZ(168px); }
  .si-wire--b { transform: translateZ(-168px); }

  .si-face {
    border-radius: 20px;
  }

  .si-face--yml { padding: 14px 16px 16px; }
  .si-face--res { padding: 14px 16px 14px; }
  .si-face--prov { padding: 14px 16px 14px; }

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
