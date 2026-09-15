<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import {useData} from 'vitepress'

const {page} = useData()
// AGENTS.md: lang/location are unreliable in slot context during serial SSR —
// the build-time relativePath is the safe locale signal.
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))

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

// The only reactive state left in the hot path: the typed text (DOM text
// content, updated only during the 3.6s typing act), the tile/chip reveal
// flags (toggled at act boundaries), and the active act index (3x per cycle).
// All motion runs through CSS custom properties.
const typed = ref(0)
const cursorOn = ref(false)
const act = ref(0)
const tileOn = reactive([false, false, false, false, false])
const chipOn = reactive([false, false, false])

const ACT_LABELS = computed(() =>
  isZh.value ? ['声明', '生成', '交付'] : ['Declare', 'Provision', 'Ship']
)

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

/* --------------------------------- geometry -------------------------------- */
// Model: plates are always HORIZONTAL (content face rotateX(90deg) = normal up in
// group space). ONE animated pitch: -90deg shows a plate's face dead-frontal
// (typing); -40deg reads as "camera above" (stack view). Plates move ONLY along
// group Y. CSS 3D law: opacity/filter/will-change on a preserve-3d container
// FLATTENS its 3D children — fades live on leaf faces only. Assembled cuboid =
// three glass layers with air between, corners tied by dashed vertical guide
// lines (边角虚线连接).

const isNarrow = ref(false)

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

// AGENTS.md colour discipline: resource tiles are a violet accent, not a
// five-hue decoration strip. Provider colours are the one allowed exception
// (vendor identity only), applied to the vendor chips.
const RESOURCES = [
  {key: 'fn', en: 'Functions', zh: '函数'},
  {key: 'event', en: 'Events', zh: '事件'},
  {key: 'db', en: 'Database', zh: '数据库'},
  {key: 'bucket', en: 'Storage', zh: '存储'},
  {key: 'table', en: 'Table', zh: '表格'}
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

/* ------------------------------ CSS-var driver ------------------------------ */
// All per-frame motion is written as custom properties on the stack root —
// no Vue reactivity in the 60fps path. A value cache skips redundant writes
// during the hold phases.

const sceneEl = ref<HTMLElement | null>(null)
const stackEl = ref<HTMLElement | null>(null)

const cache: Record<string, string> = {}
const setVar = (el: HTMLElement | null, name: string, value: string) => {
  if (!el || cache[name] === value) return
  cache[name] = value
  el.style.setProperty(name, value)
}

const setAct = (idx: number) => {
  if (act.value === idx) return
  act.value = idx
}

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

  let pitch = tp
  let scale = 1
  let shift = 0
  let wire = 0
  let wall = 0
  const y = [0, 0, 0]
  const sc = [1, 1, 1]
  const op = [1, 0, 0]

  if (s < T1) {
    // TYPE: stack frontal (pitch -90), only the yaml plate, typing.
    // The card itself settles in over the first 0.4s so a new cycle begins
    // with a fade-in instead of a pop.
    typed.value = Math.floor(clamp01((s - 0.2) / (T1 - 0.6)) * YTOTAL)
    cursorOn.value = Math.floor(s * 2) % 2 === 0
    op[0] = seg(s, 0, 0.4)
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
    setAct(1)
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
    shift = fs + float * 0.4
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
    // CUBOID hold: three glass blocks + corner guides = one box with air inside.
    // A slow bob keeps the finished assembly alive instead of freezing.
    typed.value = YTOTAL
    cursorOn.value = false
    pitch = ap
    shift = cs + Math.sin((s - T5) * 1.4) * 4
    y[0] = -stp
    y[1] = 0
    y[2] = stp
    op[1] = 1
    op[2] = 1
    wall = 1
    wire = 1
  } else {
    // RESET: guides retract, walls thin back to planes, layers sink and fade,
    // pitch returns to frontal. The typed file fades with the card — no
    // rewind-style un-typing.
    const e = easeInOutCubic(seg(s, T7, CYCLE))
    cursorOn.value = false
    pitch = lerp(ap, tp, e)
    scale = lerp(cubScale(), 1, e)
    shift = lerp(cs, 0, e)
    y[0] = lerp(-stp, 0, e)
    y[1] = lerp(0, df, e)
    y[2] = lerp(stp, se + df, e)
    sc[1] = lerp(1, ds, e)
    sc[2] = lerp(1, ds, e)
    op[0] = 1 - e
    op[1] = 1 - e
    op[2] = 1 - e
    wall = 1 - e
    wire = 1 - e
    tileOn.fill(false)
    chipOn.fill(false)
  }

  // act captions: 1=declare (typing), 2=provision (derive/fan), 3=ship (assembly+hold+reset)
  setAct(s < T1 ? 0 : s < T5 ? 1 : 2)

  const el = stackEl.value
  setVar(el, '--pitch', `${pitch.toFixed(2)}deg`)
  setVar(el, '--ss', scale.toFixed(3))
  setVar(el, '--shift', `${shift.toFixed(1)}px`)
  setVar(el, '--y0', `${y[0].toFixed(1)}px`)
  setVar(el, '--y1', `${y[1].toFixed(1)}px`)
  setVar(el, '--y2', `${y[2].toFixed(1)}px`)
  setVar(el, '--f0', op[0].toFixed(3))
  setVar(el, '--f1', op[1].toFixed(3))
  setVar(el, '--f2', op[2].toFixed(3))
  setVar(el, '--wg', wall.toFixed(3))
  setVar(el, '--wire', wire.toFixed(3))
  setVar(el, '--wire-h', `${((2 * stp + blockH()) * wire).toFixed(0)}px`)
  setVar(el, '--as', `${stp}px`)
}

/* ---------------------------------- mount ---------------------------------- */

let rafId = 0
let start = 0
// cycle position (seconds) captured when the loop is paused off-screen, so the
// resume picks the animation up exactly where it stopped
let elapsedSec = 0
// the decorative CSS loops (blobs, cursor blink) are paused via a class instead
// of being torn down, so they resume from the same keyframe position
let inView = true
let mqCleanup: (() => void) | undefined
let io: IntersectionObserver | undefined

const tick = (now: number) => {
  apply(((now - start) * 0.001) % CYCLE)
  rafId = requestAnimationFrame(tick)
}

const pauseLoop = () => {
  if (!rafId) return
  cancelAnimationFrame(rafId)
  rafId = 0
  elapsedSec = (performance.now() - start) * 0.001 % CYCLE
}

const resumeLoop = () => {
  if (reduced || rafId) return
  start = performance.now() - elapsedSec * 1000
  rafId = requestAnimationFrame(tick)
}

// decorative CSS loops keep running in the background even when the scene is
// scrolled away — park them behind a class whenever the scene is out of view or
// the tab is hidden (the rAF loop has its own pause/resume above)
const syncOffscreen = () => {
  if (!sceneEl.value) return
  sceneEl.value.classList.toggle('is-offscreen', !inView || document.hidden)
}

const showStaticCuboid = () => {
  typed.value = YTOTAL
  cursorOn.value = false
  setAct(2)
  const stp = asSpacing()
  const el = stackEl.value
  setVar(el, '--pitch', `${asPitch()}deg`)
  setVar(el, '--ss', String(cubScale()))
  setVar(el, '--shift', `${cubShift()}px`)
  setVar(el, '--y0', `${-stp}px`)
  setVar(el, '--y1', '0px')
  setVar(el, '--y2', `${stp}px`)
  setVar(el, '--f0', '1')
  setVar(el, '--f1', '1')
  setVar(el, '--f2', '1')
  setVar(el, '--wg', '1')
  setVar(el, '--wire', '1')
  setVar(el, '--wire-h', `${2 * stp + blockH()}px`)
  setVar(el, '--as', `${stp}px`)
}

onMounted(() => {
  const mq = window.matchMedia('(max-width: 959px)')
  isNarrow.value = mq.matches
  const onMq = (e: MediaQueryListEvent) => {
    isNarrow.value = e.matches
    // geometry constants derive from isNarrow — repaint the current frame
    if (reduced) showStaticCuboid()
    else apply(elapsedSec)
  }
  mq.addEventListener('change', onMq)
  mqCleanup = () => mq.removeEventListener('change', onMq)
  if (reduced) {
    showStaticCuboid()
    return
  }
  start = performance.now()
  rafId = requestAnimationFrame(tick)
  // the scene is decorative and off-screen most of the time (scrolled past the
  // hero) — stop the rAF loop while it is out of view
  io = new IntersectionObserver(
    (entries) => {
      inView = entries[0]?.isIntersecting ?? true
      syncOffscreen()
      if (inView) resumeLoop()
      else pauseLoop()
    },
    {rootMargin: '200px'}
  )
  if (sceneEl.value) io.observe(sceneEl.value)
  document.addEventListener('visibilitychange', syncOffscreen)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  io?.disconnect()
  document.removeEventListener('visibilitychange', syncOffscreen)
  mqCleanup?.()
})
</script>

<template>
  <div ref="sceneEl" class="si-hero-scene" aria-hidden="true">
    <div class="si-blobs">
      <span class="si-blob si-blob--a" />
      <span class="si-blob si-blob--b" />
      <span class="si-blob si-blob--c" />
    </div>

    <div class="si-3d">
      <div ref="stackEl" class="si-stack">
        <!-- dashed corner guides: tie the three layers into one cuboid -->
        <span
          v-for="w in 4"
          :key="`w${w}`"
          class="si-wire"
          :class="[w < 3 ? 'si-wire--l' : 'si-wire--r', w % 2 === 1 ? 'si-wire--f' : 'si-wire--b']"
        />

        <div class="si-plate si-plate--1">
          <div class="si-face si-face--yml">
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
          />
        </div>

        <div class="si-plate si-plate--2">
          <div class="si-face si-face--res">
            <div class="si-card__head">
              <span class="si-card__title">{{ resTitle }}</span>
            </div>
            <div class="si-res">
              <div
                v-for="(r, i) in resourceList"
                :key="r.key"
                class="si-res__tile"
                :style="{'--i': i, opacity: tileOn[i] ? 1 : 0}"
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
          />
        </div>

        <div class="si-plate si-plate--3">
          <div class="si-face si-face--prov">
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
          />
        </div>
      </div>
    </div>

    <!-- act captions, synced to the state machine -->
    <div class="si-acts">
      <span v-for="(label, i) in ACT_LABELS" :key="label" class="si-acts__item" :class="{'is-on': act === i}">
        <i class="si-acts__n">{{ i + 1 }}</i>{{ label }}
      </span>
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
  background: radial-gradient(circle, rgba(102, 64, 191, 0.55), rgba(102, 64, 191, 0) 70%);
}

.si-blob--c {
  width: 360px;
  height: 360px;
  left: 14%;
  bottom: 0;
  background: radial-gradient(circle, rgba(143, 106, 231, 0.45), rgba(143, 106, 231, 0) 72%);
}

.dark .si-blob--a {
  background: radial-gradient(circle, rgba(143, 106, 231, 0.52), rgba(143, 106, 231, 0) 70%);
}

.dark .si-blob--b {
  background: radial-gradient(circle, rgba(102, 64, 191, 0.4), rgba(102, 64, 191, 0) 70%);
}

.dark .si-blob--c {
  background: radial-gradient(circle, rgba(143, 106, 231, 0.32), rgba(143, 106, 231, 0) 72%);
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

/* park the decorative loops while the scene is scrolled away or the tab is
   hidden (class toggled by syncOffscreen) */
.si-hero-scene.is-offscreen .si-blob,
.si-hero-scene.is-offscreen .si-yaml__cursor {
  animation-play-state: paused;
}

/* ------- 3D stage ------- */

.si-3d {
  position: absolute;
  inset: 0;
  perspective: 1600px;
}

/* the stack: ONE pitch variable (-90 typing -> -40 stack view), zero yaw.
   On desktop it shifts left inside the right-half canvas so the 3D scene and
   the hero text split the main area visually 50/50. All per-frame motion
   arrives as custom properties written by the rAF driver. */

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

/* horizontal plates: content = top face; plates only translate along group Y
   via --y0/1/2. NO opacity/filter/will-change here — they would flatten the
   3D children. */

.si-plate {
  position: absolute;
  left: -200px;
  top: -210px;
  width: 400px;
  height: 420px;
  transform-style: preserve-3d;
}

.si-plate--1 { transform: translate3d(0, var(--y0, 0px), 0); }
.si-plate--2 { transform: translate3d(0, var(--y1, 0px), 0); }
.si-plate--3 { transform: translate3d(0, var(--y2, 0px), 0); }

/* content face lying flat, normal up in group space (frontal at pitch -90) */
.si-face {
  --si-text: #1f2937;
  --si-muted: #6b7280;
  --si-accent: #6640BF;
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
  --si-accent: #A384EB;
  background: linear-gradient(160deg, rgba(58, 65, 78, 0.98), rgba(46, 52, 62, 0.98));
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
}

.si-face--yml { padding: 18px 22px 20px; opacity: var(--f0, 1); }
/* res/prov: title + content cluster at the face center — visible when expanded
   and in the layered cuboid, fully clear of neighbouring plates */
.si-face--res,
.si-face--prov { padding: 18px 22px 16px; justify-content: flex-end; gap: 6px; opacity: var(--f1, 0); }
.si-face--prov { opacity: var(--f2, 0); }

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

/* corner guides: thin, quiet, extending downward from the lid corners;
   height and opacity arrive via --wire-h / --wire */
.si-wire {
  position: absolute;
  width: 1.5px;
  top: calc(-1 * var(--as, 280px) - 2px);
  height: var(--wire-h, 0px);
  opacity: var(--wire, 0);
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
  opacity: var(--wg, 0);
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

/* ------- yaml ------- */

.si-yaml {
  white-space: pre;
  font-family: 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace;
  font-size: 12.5px;
  line-height: 1.48;
  color: var(--si-text);
}

.si-tok--key { color: var(--si-accent); }
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
  color: var(--si-accent);
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

/* ------- act captions ------- */

.si-acts {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 22px;
}

.si-acts__item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--si-muted, #6b7280);
  opacity: 0.55;
  transition: opacity 0.5s ease, color 0.5s ease;
}

.dark .si-acts__item { color: #a8b2bd; }

.si-acts__item.is-on {
  opacity: 1;
  color: #1f2937;
}

.dark .si-acts__item.is-on { color: #eef2f6; }

.si-acts__n {
  font-style: normal;
  font-family: 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace;
  font-size: 10.5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.45);
  color: inherit;
}

.si-acts__item.is-on .si-acts__n {
  box-shadow: inset 0 0 0 1.5px var(--si-accent, #6640BF);
  color: var(--si-accent, #6640BF);
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

  .si-acts { bottom: 12px; gap: 16px; }
}
</style>
