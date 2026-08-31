import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * The IaC hero: a 3-layer mechanical stack that tells the story.
 * A yaml "definition" plate types itself out, resources and providers
 * stack up beneath it, then everything assembles into a tight stack
 * and resets. Loop: type -> resources -> providers -> expanded hold
 * -> assemble -> stacked hold -> reset.
 * ------------------------------------------------------------------ */

type SceneOptions = {
  readonly canvas: HTMLCanvasElement
  readonly dark: boolean
  readonly lang: string
}

const PLATE_W = 4.5
const PLATE_D = 2.8
const PLATE_T = 0.22

const TEXTURE_W = 1024
const TEXTURE_H = 640
const TAU = Math.PI * 2

const PROVIDERS = [
  {color: '#ff6a00', icon: '/icons/platform-aliyun.png'},
  {color: '#0052d9', icon: '/icons/platform-tencent.png'},
  {color: '#025af9', icon: '/icons/platform-volcengine.png'}
] as const

/* ------------------------------- timeline ------------------------------- */

const TYPE_DUR = 3.5
const RES_DUR = 1.2
const PROV_DUR = 1.4
const EXPAND_DUR = 2.0
const ASSEMBLE_DUR = 1.5
const STACK_DUR = 1.2
const RESET_DUR = 0.8
const CYCLE = TYPE_DUR + RES_DUR + PROV_DUR + EXPAND_DUR + ASSEMBLE_DUR + STACK_DUR + RESET_DUR

const T1 = TYPE_DUR
const T2 = T1 + RES_DUR
const T3 = T2 + PROV_DUR
const T4 = T3 + EXPAND_DUR
const T5 = T4 + ASSEMBLE_DUR
const T6 = T5 + STACK_DUR

const CAMERA_FOV = 40
const BASE_YAW = -0.3
const BASE_PITCH = 0.62

/* plates are indexed bottom -> top: [providers, resources, yaml] */
const EXPANDED_Y = [-2.5, 0, 2.5]
const STACKED_Y = [-0.42, 0, 0.42]

/* ------------------------------- palette ------------------------------- */

type Palette = {
  readonly plate: string
  readonly plateSide: string
  readonly edge: string
  readonly text: string
  readonly textMuted: string
  readonly guide: string
  readonly glassTint: string
}

const getPalette = (dark: boolean): Palette =>
  dark
    ? {
        plate: '#16181d',
        plateSide: '#0d0f13',
        edge: '#2a2e35',
        text: '#e6e9ed',
        textMuted: '#9aa3ad',
        guide: 'rgba(160, 170, 185, 0.35)',
        glassTint: 'rgba(40, 44, 52, 0.88)'
      }
    : {
        plate: '#f6f7f8',
        plateSide: '#e6e8eb',
        edge: '#d9dce0',
        text: '#1f2937',
        textMuted: '#4b5563',
        guide: 'rgba(125, 135, 150, 0.4)',
        glassTint: 'rgba(250, 251, 252, 0.9)'
      }

/* --------------------------- canvas 2d helpers --------------------------- */

const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
const MONO_STACK = `'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace`

const fitFont = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number) => {
  let size = startSize
  while (size > 20) {
    ctx.font = `700 ${size}px ${FONT_STACK}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

const drawPlateBase = (ctx: CanvasRenderingContext2D, palette: Palette, glassy: boolean) => {
  ctx.clearRect(0, 0, TEXTURE_W, TEXTURE_H)
  roundRectPath(ctx, 26, 26, TEXTURE_W - 52, TEXTURE_H - 52, 56)
  ctx.fillStyle = glassy ? palette.glassTint : palette.plate
  ctx.fill()
  ctx.strokeStyle = palette.edge
  ctx.lineWidth = glassy ? 5 : 4
  ctx.stroke()
}

const drawHeader = (ctx: CanvasRenderingContext2D, palette: Palette, text: string) => {
  const size = fitFont(ctx, text, TEXTURE_W - 200, 84)
  ctx.fillStyle = palette.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, TEXTURE_W / 2, 150)
}

/* ------------------------------- yaml plate ------------------------------- */

const YAML_LINES = [
  'service: hello-world',
  'functions:',
  '  hello_fn',
  'events:',
  '  gateway',
  'databases:',
  '  main_db'
] as const
const YAML_TOTAL = YAML_LINES.reduce((n, line) => n + line.length, 0)

const YAML_HEADER = 'serverlessinsight.yml'
const YAML_FONT = 46
const YAML_LINE_H = 52
const YAML_TOP = 176

const drawYaml = (ctx: CanvasRenderingContext2D, palette: Palette, typedChars: number, cursorOn: boolean) => {
  drawPlateBase(ctx, palette, true)

  ctx.font = `600 38px ${MONO_STACK}`
  ctx.fillStyle = palette.textMuted
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(YAML_HEADER, 64, 92)
  ctx.strokeStyle = palette.edge
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(64, 116)
  ctx.lineTo(TEXTURE_W - 64, 116)
  ctx.stroke()

  const left = 96
  ctx.font = `${YAML_FONT}px ${MONO_STACK}`
  ctx.fillStyle = palette.text
  let remaining = typedChars
  let cursorPlaced = false
  for (let li = 0; li < YAML_LINES.length; li++) {
    const line = YAML_LINES[li]
    const y = YAML_TOP + li * YAML_LINE_H
    if (remaining >= line.length) {
      ctx.fillText(line, left, y)
      remaining -= line.length
    } else {
      const prefix = line.slice(0, remaining)
      if (prefix) ctx.fillText(prefix, left, y)
      if (cursorOn) {
        const cx = left + ctx.measureText(prefix).width
        ctx.fillStyle = palette.text
        ctx.fillRect(cx + 8, y - 42, 24, 46)
      }
      cursorPlaced = true
      break
    }
  }
  if (!cursorPlaced && cursorOn) {
    const y = YAML_TOP + YAML_LINES.length * YAML_LINE_H
    ctx.fillStyle = palette.text
    ctx.fillRect(left + 8, y - 42, 24, 46)
  }
}

/* ------------------------- resources glyph plates ------------------------- */

type GlyphKind = 'function' | 'event' | 'database' | 'bucket' | 'table'

const GLYPHS: ReadonlyArray<{kind: GlyphKind; en: string; zh: string}> = [
  {kind: 'function', en: 'fn', zh: '函数'},
  {kind: 'event', en: 'event', zh: '事件'},
  {kind: 'database', en: 'db', zh: '数据库'},
  {kind: 'bucket', en: 'bucket', zh: '存储'},
  {kind: 'table', en: 'table', zh: '表格'}
]

const drawGlyphIcon = (ctx: CanvasRenderingContext2D, kind: GlyphKind, cx: number, cy: number, color: string) => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 13
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  switch (kind) {
    case 'function': {
      ctx.font = `italic 600 92px Georgia, 'Times New Roman', serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ƒ(x)', cx, cy + 8)
      break
    }
    case 'event': {
      const s = 56
      ctx.beginPath()
      ctx.moveTo(cx + s * 0.3, cy - s)
      ctx.lineTo(cx - s * 0.42, cy + s * 0.12)
      ctx.lineTo(cx + s * 0.05, cy + s * 0.12)
      ctx.lineTo(cx - s * 0.3, cy + s)
      ctx.lineTo(cx + s * 0.42, cy - s * 0.12)
      ctx.lineTo(cx - s * 0.05, cy - s * 0.12)
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'database': {
      const rw = 66
      const rh = 34
      ctx.beginPath()
      ctx.ellipse(cx, cy - rh, rw, rh, 0, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(cx, cy + rh, rw, rh, 0, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - rw, cy - rh)
      ctx.lineTo(cx - rw, cy + rh)
      ctx.moveTo(cx + rw, cy - rh)
      ctx.lineTo(cx + rw, cy + rh)
      ctx.moveTo(cx - rw, cy)
      ctx.lineTo(cx + rw, cy)
      ctx.stroke()
      break
    }
    case 'bucket': {
      const s = 62
      const h = 36
      ctx.beginPath()
      ctx.moveTo(cx, cy - h)
      ctx.lineTo(cx + s, cy - h * 0.5)
      ctx.lineTo(cx + s, cy + h * 0.5)
      ctx.lineTo(cx, cy + h)
      ctx.lineTo(cx - s, cy + h * 0.5)
      ctx.lineTo(cx - s, cy - h * 0.5)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - h)
      ctx.lineTo(cx, cy + h)
      ctx.moveTo(cx + s, cy - h * 0.5)
      ctx.lineTo(cx + s, cy + h * 0.5)
      ctx.moveTo(cx - s, cy - h * 0.5)
      ctx.lineTo(cx - s, cy + h * 0.5)
      ctx.moveTo(cx - s, cy)
      ctx.lineTo(cx + s, cy)
      ctx.stroke()
      break
    }
    case 'table': {
      const s = 66
      for (let i = 0; i <= 3; i++) {
        const x0 = cx - s + (i * 2 * s) / 3
        ctx.beginPath()
        ctx.moveTo(x0, cy - s)
        ctx.lineTo(x0, cy + s)
        ctx.stroke()
        const y0 = cy - s + (i * 2 * s) / 3
        ctx.beginPath()
        ctx.moveTo(cx - s, y0)
        ctx.lineTo(cx + s, y0)
        ctx.stroke()
      }
      break
    }
  }
  ctx.restore()
}

const drawGlyph = (ctx: CanvasRenderingContext2D, palette: Palette, kind: GlyphKind, label: string) => {
  ctx.clearRect(0, 0, 240, 320)
  drawGlyphIcon(ctx, kind, 120, 126, palette.textMuted)
  ctx.font = `600 44px ${FONT_STACK}`
  ctx.fillStyle = palette.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(label, 120, 290)
}

/* ------------------------------- chip plates ------------------------------- */

const drawChip = (ctx: CanvasRenderingContext2D, provider: (typeof PROVIDERS)[number], img: HTMLImageElement | null) => {
  ctx.clearRect(0, 0, 256, 256)
  roundRectPath(ctx, 14, 14, 228, 228, 50)
  ctx.fillStyle = hexToRgba(provider.color, 0.14)
  ctx.fill()
  ctx.strokeStyle = provider.color
  ctx.lineWidth = 10
  ctx.stroke()
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save()
    roundRectPath(ctx, 14, 14, 228, 228, 50)
    ctx.clip()
    ctx.drawImage(img, 53, 53, 150, 150)
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.arc(128, 128, 22, 0, TAU)
    ctx.fillStyle = provider.color
    ctx.fill()
  }
}

/* ------------------------------ plate meshes ------------------------------ */

const makePlateGeometry = () => {
  const r = 0.05
  const shape = new THREE.Shape()
  shape.moveTo(r, 0)
  shape.lineTo(1 - r, 0)
  shape.quadraticCurveTo(1, 0, 1, r)
  shape.lineTo(1, 1 - r)
  shape.quadraticCurveTo(1, 1, 1 - r, 1)
  shape.lineTo(r, 1)
  shape.quadraticCurveTo(0, 1, 0, 1 - r)
  shape.lineTo(0, r)
  shape.quadraticCurveTo(0, 0, r, 0)

  const geometry = new THREE.ExtrudeGeometry(shape, {depth: PLATE_T, bevelEnabled: false, curveSegments: 10})
  geometry.scale(PLATE_W, PLATE_D, 1)
  geometry.translate(-PLATE_W / 2, -PLATE_D / 2, -PLATE_T / 2)
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

const makeTexture = (canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) => {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  return texture
}

const createPlate = (texture: THREE.CanvasTexture, palette: Palette, glassy: boolean) => {
  const geometry = makePlateGeometry()
  // unlit lid so the texture renders at its exact palette colors
  const lidMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: glassy ? 0.94 : 1,
    side: THREE.FrontSide
  })
  const sideMaterial = new THREE.MeshLambertMaterial({
    color: palette.plateSide,
    transparent: true,
    opacity: glassy ? 0.82 : 1
  })
  return new THREE.Mesh(geometry, [lidMaterial, sideMaterial])
}

const makeFlatSprite = (texture: THREE.CanvasTexture, w: number, h: number) => {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/* ------------------------------ scene builder ------------------------------ */

type PlateInfo = {
  readonly group: THREE.Group
  readonly lid: THREE.MeshLambertMaterial
  readonly side: THREE.MeshLambertMaterial
  readonly baseLid: number
  readonly baseSide: number
}

type StackGraph = {
  readonly root: THREE.Group
  readonly plates: readonly PlateInfo[]
  readonly yamlCtx: CanvasRenderingContext2D
  readonly yamlTexture: THREE.CanvasTexture
  readonly glyphs: readonly THREE.Mesh[]
  readonly chips: readonly THREE.Mesh[]
  readonly guideMaterial: THREE.LineBasicMaterial
  readonly sheen: THREE.Mesh
  readonly refreshChips: (images: readonly (HTMLImageElement | null)[]) => void
}

const PLATE_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['供应商', 'Providers'],
  ['资源', 'Resources'],
  ['serverlessinsight.yml', 'serverlessinsight.yml']
]

const GLYPH_X = [-1.75, -0.88, 0, 0.88, 1.75]
const CHIP_X = [-1.15, 0, 1.15]

const buildStack = (scene: THREE.Scene, renderer: THREE.WebGLRenderer, palette: Palette, lang: string): StackGraph => {
  const root = new THREE.Group()
  scene.add(root)

  const isZh = lang.startsWith('zh')
  const labelOf = (index: number) => (isZh ? PLATE_LABELS[index][0] : PLATE_LABELS[index][1])

  const yamlCanvas = document.createElement('canvas')
  yamlCanvas.width = TEXTURE_W
  yamlCanvas.height = TEXTURE_H
  const yamlCtx = yamlCanvas.getContext('2d')
  if (!yamlCtx) throw new Error('2d canvas unavailable')
  const yamlTexture = makeTexture(yamlCanvas, renderer)
  drawYaml(yamlCtx, palette, 0, true)

  const plates: PlateInfo[] = PLATE_LABELS.map((_, i) => {
    const glassy = i === 2
    const texture = glassy ? yamlTexture : (() => {
      const canvas = document.createElement('canvas')
      canvas.width = TEXTURE_W
      canvas.height = TEXTURE_H
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2d canvas unavailable')
      drawPlateBase(ctx, palette, false)
      drawHeader(ctx, palette, labelOf(i))
      return makeTexture(canvas, renderer)
    })()
    const mesh = createPlate(texture, palette, glassy)
    const group = new THREE.Group()
    group.add(mesh)
    root.add(group)
    return {
      group,
      lid: mesh.material[0] as THREE.MeshLambertMaterial,
      side: mesh.material[1] as THREE.MeshLambertMaterial,
      baseLid: glassy ? 0.94 : 1,
      baseSide: glassy ? 0.82 : 1
    }
  })

  const glyphs: THREE.Mesh[] = GLYPHS.map((glyph, gi) => {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 320
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2d canvas unavailable')
    drawGlyph(ctx, palette, glyph.kind, isZh ? glyph.zh : glyph.en)
    const sprite = makeFlatSprite(makeTexture(canvas, renderer), 0.68, 0.92)
    sprite.position.set(GLYPH_X[gi], PLATE_T / 2 + 0.005, 0.35)
    plates[1].group.add(sprite)
    return sprite
  })

  const chipCanvases: HTMLCanvasElement[] = []
  const chips: THREE.Mesh[] = PROVIDERS.map((provider, ci) => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2d canvas unavailable')
    drawChip(ctx, provider, null)
    chipCanvases.push(canvas)
    const sprite = makeFlatSprite(makeTexture(canvas, renderer), 1.0, 1.0)
    sprite.position.set(CHIP_X[ci], PLATE_T / 2 + 0.005, 0.3)
    plates[0].group.add(sprite)
    return sprite
  })

  const refreshChips = (images: readonly (HTMLImageElement | null)[]) => {
    chips.forEach((chip, ci) => {
      const ctx = chipCanvases[ci].getContext('2d')
      if (!ctx) return
      drawChip(ctx, PROVIDERS[ci], images[ci])
      ;(chip.material as THREE.MeshBasicMaterial).map!.needsUpdate = true
    })
  }

  const guideMaterial = new THREE.LineBasicMaterial({
    color: palette.guide,
    transparent: true,
    opacity: 0,
    depthTest: false
  })
  const guideGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -3.4, 0),
    new THREE.Vector3(0, 3.4, 0)
  ])
  const guide = new THREE.Line(guideGeometry, guideMaterial)
  guide.renderOrder = 1
  root.add(guide)

  const sheenMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.95), sheenMaterial)
  sheen.rotation.x = -Math.PI / 2
  sheen.position.set(0, STACKED_Y[2] + 0.28, 0)
  root.add(sheen)

  return {root, plates, yamlCtx, yamlTexture, glyphs, chips, guideMaterial, sheen, refreshChips}
}

const preloadIcons = () =>
  PROVIDERS.map(
    (provider) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = provider.icon
      })
  )

/* ------------------------------- timeline ------------------------------- */

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

type Timeline = {
  readonly typedChars: number
  readonly cursorOn: boolean
  readonly plate: ReadonlyArray<{opacity: number; y: number}>
  readonly glyphAlpha: readonly number[]
  readonly chipAlpha: readonly number[]
  readonly guide: number
  readonly sheen: number
  readonly floatGain: number
}

const timeline = (t: number, seconds: number): Timeline => {
  const plate: Array<{opacity: number; y: number}> = [
    {opacity: 0, y: -0.5},
    {opacity: 0, y: -0.3},
    {opacity: 1, y: 0}
  ]

  if (t < T1) {
    // typing state — initial array already has only the yaml plate centered
  } else if (t < T2) {
    const e = easeInOutCubic((t - T1) / RES_DUR)
    plate[2] = {opacity: 1, y: EXPANDED_Y[2] * e}
    plate[1] = {opacity: e, y: -0.3 + 0.3 * e}
  } else if (t < T3) {
    const e = easeInOutCubic((t - T2) / PROV_DUR)
    plate[2] = {opacity: 1, y: EXPANDED_Y[2]}
    plate[1] = {opacity: 1, y: EXPANDED_Y[1]}
    plate[0] = {opacity: e, y: -0.5 + (EXPANDED_Y[0] + 0.5) * e}
  } else if (t < T4) {
    plate.forEach((p, i) => {
      p.opacity = 1
      p.y = EXPANDED_Y[i]
    })
  } else if (t < T5) {
    const e = easeInOutCubic((t - T4) / ASSEMBLE_DUR)
    plate.forEach((p, i) => {
      p.opacity = 1
      p.y = EXPANDED_Y[i] + (STACKED_Y[i] - EXPANDED_Y[i]) * e
    })
  } else if (t < T6) {
    plate.forEach((p, i) => {
      p.opacity = 1
      p.y = STACKED_Y[i]
    })
  } else {
    const e = easeInOutCubic((t - T6) / RESET_DUR)
    plate[2] = {opacity: 1, y: STACKED_Y[2] + (0 - STACKED_Y[2]) * e}
    plate[1] = {opacity: 1 - e, y: STACKED_Y[1] + (-0.7 - STACKED_Y[1]) * e}
    plate[0] = {opacity: 1 - e, y: STACKED_Y[0] + (-0.9 - STACKED_Y[0]) * e}
  }

  const glyphAlpha = GLYPHS.map((_, gi) => {
    if (t < T1) return 0
    if (t < T2) return clamp01((t - T1 - gi * 0.16) / 0.5)
    if (t < T6) return 1
    return 1 - easeInOutCubic(clamp01((t - T6) / 0.6))
  })

  const chipAlpha = PROVIDERS.map((_, ci) => {
    if (t < T2) return 0
    if (t < T3) return clamp01((t - T2 - ci * 0.3) / 0.55)
    if (t < T6) return 1
    return 1 - easeInOutCubic(clamp01((t - T6) / 0.6))
  })

  const typedChars = t < T1 ? Math.floor(clamp01((t - 0.2) / (TYPE_DUR - 0.6)) * YAML_TOTAL) : t < T6 ? YAML_TOTAL : 0
  const cursorOn = t < T1 ? Math.floor(seconds * 2) % 2 === 0 : false

  const guide = t >= T3 && t < T5 ? 0.3 : 0
  const sheen = t >= T5 && t < T6 ? 0.1 * Math.min(1, easeInOutCubic((t - T5) / 0.2), easeInOutCubic((T6 - t) / 0.2)) : 0
  const floatGain = t >= T3 && t < T4 ? 1 : 0

  return {typedChars, cursorOn, plate, glyphAlpha, chipAlpha, guide, sheen, floatGain}
}

/* ---------------------------------- mount ---------------------------------- */

export const mountHeroScene = ({canvas, dark, lang}: SceneOptions): (() => void) => {
  const palette = getPalette(dark)
  const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  if (!context) return () => undefined

  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'low-power'})
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
  keyLight.position.set(6, 12, 8)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35)
  fillLight.position.set(-6, 4, -6)
  scene.add(fillLight)

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)
  const graph = buildStack(scene, renderer, palette, lang)

  const icons = preloadIcons()
  Promise.all(icons).then((images) => {
    if (stopped) return
    graph.refreshChips(images)
  })

  const target = new THREE.Vector3(0, 0, 0)
  let baseDist = 12
  let frame = 0
  let paused = document.hidden
  let stopped = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pointer = {x: 0, y: 0}
  const container = canvas.parentElement
  const startTime = performance.now()
  let lastTyped = -1
  let lastCursor = true

  const resize = () => {
    const width = container?.clientWidth ?? canvas.clientWidth
    const height = container?.clientHeight ?? canvas.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    const aspect = width / height
    camera.aspect = aspect
    const vFov = THREE.MathUtils.degToRad(CAMERA_FOV)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const fitH = 7.8
    const fitW = 5.8
    baseDist = Math.max((fitH / 2) / Math.tan(vFov / 2), (fitW / 2) / Math.tan(hFov / 2))
    camera.updateProjectionMatrix()
  }

  const zoomScale = (t: number) => {
    if (t < T1) return 0.7
    if (t < T2) return 0.7 + 0.3 * easeInOutCubic((t - T1) / RES_DUR)
    return 1
  }

  const updateCamera = (seconds: number, dist: number) => {
    const yaw = BASE_YAW + Math.sin((seconds * TAU) / 16) * 0.105 + pointer.x * 0.05
    const pitch = BASE_PITCH + Math.sin((seconds * TAU) / 21) * 0.035 + pointer.y * 0.03
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.cos(yaw)
    )
    camera.lookAt(target)
  }

  const applyState = (st: Timeline, seconds: number) => {
    if (st.typedChars !== lastTyped || st.cursorOn !== lastCursor) {
      lastTyped = st.typedChars
      lastCursor = st.cursorOn
      drawYaml(graph.yamlCtx, palette, st.typedChars, st.cursorOn)
      graph.yamlTexture.needsUpdate = true
    }
    graph.plates.forEach((plate, i) => {
      const y = st.plate[i].y + st.floatGain * Math.sin(seconds * 2.2 + i * 1.7) * 0.04
      plate.group.position.y = y
      plate.lid.opacity = plate.baseLid * st.plate[i].opacity
      plate.side.opacity = plate.baseSide * st.plate[i].opacity
    })
    graph.glyphs.forEach((glyph, i) => {
      glyph.material.opacity = st.glyphAlpha[i] * st.plate[1].opacity
    })
    graph.chips.forEach((chip, i) => {
      chip.material.opacity = st.chipAlpha[i] * st.plate[0].opacity
    })
    graph.guideMaterial.opacity = st.guide
    ;(graph.sheen.material as THREE.MeshBasicMaterial).opacity = st.sheen
  }

  const renderFrame = (seconds: number) => {
    const t = seconds % CYCLE
    const st = timeline(t, seconds)
    applyState(st, seconds)
    updateCamera(seconds, baseDist * zoomScale(t))
    renderer.render(scene, camera)
  }

  const onMouseMove = (event: MouseEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
  }

  const onVisibilityChange = () => {
    paused = document.hidden
    if (!paused && !reducedMotion && !stopped) frame = requestAnimationFrame(render)
  }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    stopped = true
    cancelAnimationFrame(frame)
  }

  const render = (time: number) => {
    if (stopped) return
    resize()
    renderFrame((time - startTime) * 0.001)
    if (!paused && !reducedMotion) frame = requestAnimationFrame(render)
  }

  window.addEventListener('resize', resize)
  const resizeObserver = new ResizeObserver(resize)
  if (container) resizeObserver.observe(container)
  window.addEventListener('mousemove', onMouseMove, {passive: true})
  document.addEventListener('visibilitychange', onVisibilityChange)
  canvas.addEventListener('webglcontextlost', onContextLost)

  resize()
  if (reducedMotion) {
    // static frame: all three layers visible and separated, yaml fully typed, providers lit
    const staticState: Timeline = {
      typedChars: YAML_TOTAL,
      cursorOn: false,
      plate: EXPANDED_Y.map((y) => ({opacity: 1, y})),
      glyphAlpha: [1, 1, 1, 1, 1],
      chipAlpha: [1, 1, 1],
      guide: 0,
      sheen: 0,
      floatGain: 0
    }
    applyState(staticState, 0)
    updateCamera(0, baseDist)
    renderer.render(scene, camera)
  } else {
    renderFrame(0)
    frame = requestAnimationFrame(render)
  }

  return () => {
    stopped = true
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    resizeObserver.disconnect()
    window.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (material.map) material.map.dispose()
        material.dispose()
      })
    })
    renderer.dispose()
  }
}
