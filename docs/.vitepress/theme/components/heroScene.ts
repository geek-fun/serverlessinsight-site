import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * serverlessinsight.yml — a mechanical stack of 6 thin plates.
 * Loop: assembled hold -> explode -> exploded hold -> assemble.
 * ------------------------------------------------------------------ */

type SceneOptions = {
  readonly canvas: HTMLCanvasElement
  readonly dark: boolean
  readonly lang: string
}

type LayerKey = 'providers' | 'storage' | 'databases' | 'events' | 'functions' | 'yml'

type Layer = {
  readonly key: LayerKey
  readonly labelZh: string
  readonly labelEn: string
}

const LAYERS: readonly Layer[] = [
  {key: 'providers', labelZh: '供应商', labelEn: 'Providers'},
  {key: 'storage', labelZh: '存储', labelEn: 'Storage'},
  {key: 'databases', labelZh: '数据库', labelEn: 'Databases'},
  {key: 'events', labelZh: '事件', labelEn: 'Events'},
  {key: 'functions', labelZh: '函数', labelEn: 'Functions'},
  {key: 'yml', labelZh: 'serverlessinsight.yml', labelEn: 'serverlessinsight.yml'}
]

const PLATE_W = 4.5
const PLATE_D = 2.8
const PLATE_T = 0.15
const STACK_STEP = PLATE_T + 0.25 // uniform 0.25 gaps
const SPREAD = 3.9 // ~3.8x stack height when exploded

const TEXTURE_W = 1024
const TEXTURE_H = 640
const TAU = Math.PI * 2

const PROVIDERS = [
  {color: '#ff6a00', icon: '/icons/platform-aliyun.png'},
  {color: '#0052d9', icon: '/icons/platform-tencent.png'},
  {color: '#025af9', icon: '/icons/platform-volcengine.png'}
] as const

/* ------------------------------- timeline ------------------------------- */

const CYCLE = 7.2
const HOLD_TOP = 1.1 // assembled hold
const EXPLODE_DUR = 1.8
const HOLD_BOTTOM = 2.5 // exploded hold
const ASSEMBLE_DUR = 1.8

const CAMERA_FOV = 40
const BASE_YAW = -0.3
const BASE_PITCH = 0.5
const STACK_CENTER_Y = ((LAYERS.length - 1) * STACK_STEP) / 2

/* ------------------------------- palette ------------------------------- */

type Palette = {
  readonly plate: string
  readonly plateSide: string
  readonly text: string
  readonly accent: string
  readonly edge: string
  readonly guide: string
  readonly glassTint: string
  readonly chipTint: number
}

const getPalette = (dark: boolean): Palette =>
  dark
    ? {
        plate: '#2d3945',
        plateSide: '#161d25',
        text: '#e7eef6',
        accent: '#ffb45e',
        edge: 'rgba(255, 180, 94, 0.65)',
        guide: 'rgba(196, 206, 218, 0.5)',
        glassTint: 'rgba(64, 80, 100, 0.78)',
        chipTint: 0.34
      }
    : {
        plate: '#eef1f4',
        plateSide: '#d3d8de',
        text: '#2a3139',
        accent: '#f08a1e',
        edge: 'rgba(15, 23, 32, 0.16)',
        guide: 'rgba(90, 100, 112, 0.45)',
        glassTint: 'rgba(255, 255, 255, 0.72)',
        chipTint: 0.22
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
  if (glassy) {
    ctx.fillStyle = palette.glassTint
    ctx.fill()
    ctx.strokeStyle = palette.accent
    ctx.lineWidth = 6
    ctx.stroke()
  } else {
    ctx.fillStyle = palette.plate
    ctx.fill()
    ctx.strokeStyle = palette.edge
    ctx.lineWidth = 4
    ctx.stroke()
  }
}

const drawLabel = (ctx: CanvasRenderingContext2D, palette: Palette, text: string) => {
  const size = fitFont(ctx, text, TEXTURE_W - 160, 118)
  ctx.fillStyle = palette.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, TEXTURE_W / 2, 186)
}

const drawIcon = (ctx: CanvasRenderingContext2D, kind: LayerKey, cx: number, cy: number, size: number, color: string, lw: number) => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lw
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  switch (kind) {
    case 'storage': {
      // isometric cube — buckets & tables
      const s = size * 0.46
      const h = s * 0.58
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
    case 'databases': {
      const rw = size * 0.48
      const rh = size * 0.26
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
    case 'events': {
      // lightning bolt
      const s = size * 0.48
      ctx.beginPath()
      ctx.moveTo(cx + s * 0.28, cy - s)
      ctx.lineTo(cx - s * 0.42, cy + s * 0.12)
      ctx.lineTo(cx + s * 0.02, cy + s * 0.12)
      ctx.lineTo(cx - s * 0.28, cy + s)
      ctx.lineTo(cx + s * 0.42, cy - s * 0.12)
      ctx.lineTo(cx - s * 0.02, cy - s * 0.12)
      ctx.closePath()
      ctx.stroke()
      break
    }
    case 'functions': {
      ctx.font = `italic 700 ${Math.round(size * 0.86)}px Georgia, 'Times New Roman', serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ƒ(x)', cx, cy + size * 0.04)
      break
    }
    case 'yml': {
      // abstract code-line bars (drawn directly, no single icon)
      const bars = [0.86, 0.5, 0.72, 0.94, 0.58, 0.78, 0.42]
      const barW = 620
      const barH = 26
      const gap = 46
      const totalH = bars.length * (barH + gap) - gap
      let y = cy - totalH / 2
      bars.forEach((frac, i) => {
        const w = barW * frac
        const x0 = cx - w / 2
        ctx.globalAlpha = i === 2 ? 1 : i === 4 ? 0.4 : 0.78
        roundRectPath(ctx, x0, y, w, barH, barH / 2)
        ctx.fillStyle = color
        ctx.fill()
        y += barH + gap
      })
      ctx.globalAlpha = 1
      break
    }
    case 'providers':
      break // handled separately
  }
  ctx.restore()
}

const drawProviders = (ctx: CanvasRenderingContext2D, palette: Palette, images: readonly (HTMLImageElement | null)[]) => {
  const chip = 204
  const gap = 40
  const total = chip * 3 + gap * 2
  const startX = (TEXTURE_W - total) / 2
  const cy = 448
  PROVIDERS.forEach((provider, i) => {
    const cx = startX + i * (chip + gap) + chip / 2
    const x = cx - chip / 2
    const y = cy - chip / 2
    roundRectPath(ctx, x, y, chip, chip, 46)
    ctx.fillStyle = hexToRgba(provider.color, palette.chipTint)
    ctx.fill()
    ctx.strokeStyle = provider.color
    ctx.lineWidth = 7
    ctx.stroke()
    const img = images[i]
    if (img && img.complete && img.naturalWidth > 0) {
      const size = 152
      ctx.save()
      roundRectPath(ctx, x, y, chip, chip, 46)
      ctx.clip()
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
      ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(cx, cy, 20, 0, TAU)
      ctx.fillStyle = provider.color
      ctx.fill()
    }
  })
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
  const lidMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true,
    opacity: glassy ? 0.94 : 1,
    side: THREE.DoubleSide
  })
  const sideMaterial = new THREE.MeshLambertMaterial({
    color: palette.plateSide,
    transparent: true,
    opacity: glassy ? 0.82 : 1
  })
  // ExtrudeGeometry groups: 0 = lid faces (top+bottom), 1 = side walls
  return new THREE.Mesh(geometry, [lidMaterial, sideMaterial])
}

/* ------------------------------ scene builder ------------------------------ */

type StackGraph = {
  readonly root: THREE.Group
  readonly plates: readonly THREE.Group[]
  readonly guideMaterial: THREE.LineBasicMaterial
  readonly refreshProviders: (images: readonly (HTMLImageElement | null)[]) => void
}

const buildStack = (scene: THREE.Scene, renderer: THREE.WebGLRenderer, palette: Palette, lang: string): StackGraph => {
  const root = new THREE.Group()
  scene.add(root)

  const isZh = lang.startsWith('zh')
  const labelOf = (layer: Layer) => (isZh ? layer.labelZh : layer.labelEn)

  const providersCanvas = document.createElement('canvas')
  providersCanvas.width = TEXTURE_W
  providersCanvas.height = TEXTURE_H
  const providersCtx = providersCanvas.getContext('2d')
  const providersTexture = makeTexture(providersCanvas, renderer)
  if (providersCtx) {
    drawPlateBase(providersCtx, palette, false)
    drawLabel(providersCtx, palette, labelOf(LAYERS[0]))
    drawProviders(providersCtx, palette, [null, null, null])
  }

  const plates: THREE.Group[] = LAYERS.map((layer, i) => {
    const glassy = layer.key === 'yml'
    let texture: THREE.CanvasTexture
    if (layer.key === 'providers') {
      texture = providersTexture
    } else {
      const canvas = document.createElement('canvas')
      canvas.width = TEXTURE_W
      canvas.height = TEXTURE_H
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2d canvas unavailable')
      drawPlateBase(ctx, palette, glassy)
      drawLabel(ctx, palette, labelOf(layer))
      drawIcon(ctx, layer.key, TEXTURE_W / 2, 436, 240, palette.accent, 16)
      texture = makeTexture(canvas, renderer)
    }

    const mesh = createPlate(texture, palette, glassy)
    const group = new THREE.Group()
    group.add(mesh)
    group.position.y = i * STACK_STEP
    root.add(group)
    return group
  })

  const guideMaterial = new THREE.LineBasicMaterial({
    color: palette.guide,
    transparent: true,
    opacity: 0,
    depthTest: false
  })
  const guideGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -3.4, 0),
    new THREE.Vector3(0, 5.4, 0)
  ])
  const guide = new THREE.Line(guideGeometry, guideMaterial)
  guide.renderOrder = 1
  root.add(guide)

  const refreshProviders = (images: readonly (HTMLImageElement | null)[]) => {
    if (!providersCtx) return
    drawPlateBase(providersCtx, palette, false)
    drawLabel(providersCtx, palette, labelOf(LAYERS[0]))
    drawProviders(providersCtx, palette, images)
    providersTexture.needsUpdate = true
  }

  return {root, plates, guideMaterial, refreshProviders}
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

/* --------------------------------- helpers --------------------------------- */

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const explodeAmount = (t: number): {e: number; floatGain: number} => {
  if (t < HOLD_TOP) return {e: 0, floatGain: 0}
  if (t < HOLD_TOP + EXPLODE_DUR) return {e: easeInOutCubic((t - HOLD_TOP) / EXPLODE_DUR), floatGain: 0}
  const hold = t - HOLD_TOP - EXPLODE_DUR
  if (hold < HOLD_BOTTOM) return {e: 1, floatGain: Math.sin((Math.PI * hold) / HOLD_BOTTOM)}
  const a = (t - HOLD_TOP - EXPLODE_DUR - HOLD_BOTTOM) / ASSEMBLE_DUR
  return {e: 1 - easeInOutCubic(a), floatGain: 0}
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
  scene.add(new THREE.AmbientLight(0xffffff, 0.72))
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25)
  keyLight.position.set(6, 12, 8)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4)
  fillLight.position.set(-6, 4, -6)
  scene.add(fillLight)

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100)
  const graph = buildStack(scene, renderer, palette, lang)

  const icons = preloadIcons()
  Promise.all(icons).then((images) => {
    if (stopped) return
    graph.refreshProviders(images)
  })

  const explodeY = LAYERS.map((_, i) => STACK_CENTER_Y + SPREAD * (i * STACK_STEP - STACK_CENTER_Y))
  const shiftX = LAYERS.map((_, i) => (i % 2 === 0 ? 1 : -1) * 0.42)
  const shiftZ = LAYERS.map((_, i) => (i % 2 === 0 ? -1 : 1) * 0.34)
  const rotY = LAYERS.map((_, i) => ((i % 2 === 0 ? 1 : -1) * (4 + (i % 3) * 1.5) * Math.PI) / 180)

  const target = new THREE.Vector3(0, STACK_CENTER_Y, 0)
  let dist = 12
  let frame = 0
  let paused = document.hidden
  let stopped = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pointer = {x: 0, y: 0}
  const container = canvas.parentElement
  const startTime = performance.now()

  const resize = () => {
    const width = container?.clientWidth ?? canvas.clientWidth
    const height = container?.clientHeight ?? canvas.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    const aspect = width / height
    camera.aspect = aspect
    const vFov = THREE.MathUtils.degToRad(CAMERA_FOV)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const fitH = 9.6
    const fitW = 6.4
    dist = Math.max((fitH / 2) / Math.tan(vFov / 2), (fitW / 2) / Math.tan(hFov / 2))
    camera.updateProjectionMatrix()
  }

  const updateCamera = (seconds: number) => {
    const yaw = BASE_YAW + Math.sin((seconds * TAU) / 16) * 0.105 + pointer.x * 0.05
    const pitch = BASE_PITCH + Math.sin((seconds * TAU) / 21) * 0.035 + pointer.y * 0.03
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.sin(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.cos(yaw)
    )
    camera.lookAt(target)
  }

  const renderFrame = (seconds: number) => {
    const t = seconds % CYCLE
    const {e, floatGain} = explodeAmount(t)
    graph.plates.forEach((group, i) => {
      group.position.x = shiftX[i] * e
      group.position.y = i * STACK_STEP + (explodeY[i] - i * STACK_STEP) * e + floatGain * Math.sin(seconds * 2.4 + i * 1.25) * 0.04
      group.position.z = shiftZ[i] * e
      group.rotation.y = rotY[i] * e
    })
    graph.guideMaterial.opacity = 0.3 * e
    updateCamera(seconds)
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
  renderFrame(0)
  if (!reducedMotion) frame = requestAnimationFrame(render)

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
