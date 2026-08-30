import * as THREE from 'three'

type SceneOptions = {
  readonly canvas: HTMLCanvasElement
  readonly dark: boolean
}

type Route = {
  readonly start: THREE.Vector3
  readonly end: THREE.Vector3
  readonly phase: number
}

type ScenePalette = {
  readonly accent: number
  readonly line: number
  readonly muted: number
  readonly surface: number
  readonly providers: readonly number[]
}

const providerIcons = [
  '/icons/platform-aliyun.png',
  '/icons/platform-tencent.png',
  '/icons/platform-volcengine.png'
] as const

const getPalette = (dark: boolean): ScenePalette => ({
  accent: dark ? 0xffb45e : 0xf89b40,
  line: dark ? 0xd7e0e8 : 0x65717c,
  muted: dark ? 0x82909d : 0x8c98a3,
  surface: dark ? 0x141b23 : 0xf7f8f9,
  providers: [0xff6a00, 0x0052d9, 0x025af9]
})

const makeLine = (start: THREE.Vector3, end: THREE.Vector3, material: THREE.LineBasicMaterial) => {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
  return new THREE.Line(geometry, material)
}

const createCodeBars = (palette: ScenePalette) => {
  const group = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({color: palette.accent, transparent: true, opacity: 0.72})
  const widths = [2.2, 3.5, 2.8, 4.1, 1.9, 3.1]
  widths.forEach((width, index) => {
    const geometry = new THREE.PlaneGeometry(width, 0.035)
    const bar = new THREE.Mesh(geometry, material)
    bar.position.set(-2.9 + width / 2, 1.3 - index * 0.36, 0.12)
    group.add(bar)
  })
  return group
}

const createSceneGraph = (scene: THREE.Scene, palette: ScenePalette, mobile: boolean) => {
  const root = new THREE.Group()
  const lineMaterial = new THREE.LineBasicMaterial({color: palette.line, transparent: true, opacity: 0.28})
  const glowMaterial = new THREE.MeshBasicMaterial({color: palette.accent, transparent: true, opacity: 0.08})
  const resourceMaterial = new THREE.MeshBasicMaterial({color: palette.surface, transparent: true, opacity: 0.9})

  const card = new THREE.Group()
  const cardGeometry = new THREE.PlaneGeometry(9.2, 3.25)
  const cardMesh = new THREE.Mesh(cardGeometry, new THREE.MeshBasicMaterial({color: palette.surface, transparent: true, opacity: 0.78}))
  const cardEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cardGeometry), new THREE.LineBasicMaterial({color: palette.accent, transparent: true, opacity: 0.7}))
  card.add(cardMesh, cardEdges, createCodeBars(palette))
  card.position.set(0, 5.25, 0.2)
  root.add(card)

  const resourcePositions = mobile
    ? [[-6.5, 0.7], [-4.3, 0.05], [-2.1, 0.75], [0, 0.05], [2.1, 0.75], [4.3, 0.05], [6.5, 0.7]]
    : [[-7.2, 0.7], [-5.2, -0.15], [-3.2, 0.9], [-1.1, -0.1], [1.1, 0.9], [3.2, -0.15], [5.2, 0.7], [7.2, 0.4], [-2.1, -1.2], [2.1, -1.2], [0, 1.6]]
  const resources = resourcePositions.map(([x, y], index) => {
    const size = 0.28 + (index % 3) * 0.1
    const geometry = new THREE.BoxGeometry(size, size, size)
    const mesh = new THREE.Mesh(geometry, resourceMaterial)
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({color: palette.accent, transparent: true, opacity: 0.62}))
    const node = new THREE.Group()
    node.add(mesh, edge)
    node.position.set(x, y, 0.32)
    root.add(node)
    const halo = new THREE.Mesh(new THREE.SphereGeometry(size * 1.8, 16, 16), glowMaterial)
    halo.position.copy(node.position)
    root.add(halo)
    return node.position.clone()
  })

  const pads = [-7, 0, 7].map((x, index) => {
    const geometry = new THREE.CylinderGeometry(1.72, 1.72, 0.12, 48)
    const material = new THREE.MeshBasicMaterial({color: palette.providers[index], transparent: true, opacity: 0.16})
    const pad = new THREE.Mesh(geometry, material)
    pad.rotation.x = Math.PI / 2
    pad.position.set(x, -5.45, 0)
    const ring = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({color: palette.providers[index], transparent: true, opacity: 0.68}))
    ring.rotation.copy(pad.rotation)
    ring.position.copy(pad.position)
    root.add(pad, ring)
    return pad.position.clone().setZ(0.1)
  })

  const routes: Route[] = resources.map((resource, index) => ({
    start: new THREE.Vector3(0, 3.75, 0.15),
    end: resource,
    phase: index / resources.length
  }))
  resources.forEach((resource, index) => {
    routes.push({start: resource, end: pads[index % pads.length], phase: (index + 0.5) / resources.length})
    root.add(makeLine(resource, pads[index % pads.length], lineMaterial))
  })
  resources.forEach((resource) => root.add(makeLine(new THREE.Vector3(0, 3.75, 0.15), resource, lineMaterial)))

  const particles = routes.map((route) => {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({color: palette.accent, transparent: true, opacity: 0.95}))
    root.add(particle)
    return {particle, route}
  })

  scene.add(root)
  return {root, card, particles, resources, pads}
}

type IconLoadOptions = {
  readonly url: string
  readonly target: THREE.Group
  readonly palette: ScenePalette
  readonly registerCleanup: (cleanup: () => void) => void
}

const loadIcon = ({url, target, palette, registerCleanup}: IconLoadOptions) => {
  const image = new Image()
  let disposed = false
  image.decoding = 'async'
  image.onload = () => {
    if (disposed) return
    const texture = new THREE.CanvasTexture(image)
    const material = new THREE.MeshBasicMaterial({map: texture, transparent: true, opacity: 0.94, color: 0xffffff})
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), material)
    icon.position.z = 0.1
    target.add(icon)
  }
  image.src = url
  registerCleanup(() => { disposed = true; image.onload = null })
}

export const mountHeroScene = ({canvas, dark}: SceneOptions): (() => void) => {
  const palette = getPalette(dark)
  const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  if (!context) return () => undefined
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'low-power'})
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 7.5, -7.5, 0.1, 100)
  camera.position.z = 20
  const graph = createSceneGraph(scene, palette, window.innerWidth < 768)
  const iconCleanups: Array<() => void> = []
  const iconGroups = graph.pads.map((pad) => {
    const group = new THREE.Group()
    group.position.copy(pad)
    graph.root.add(group)
    return group
  })
  iconGroups.forEach((group, index) => loadIcon({url: providerIcons[index], target: group, palette, registerCleanup: (cleanup) => iconCleanups.push(cleanup)}))

  let frame = 0
  let paused = document.hidden
  let stopped = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pointer = {x: 0, y: 0}
  const container = canvas.parentElement
  const resize = () => {
    const width = container?.clientWidth ?? canvas.clientWidth
    const height = container?.clientHeight ?? canvas.clientHeight
    if (width === 0 || height === 0) return
    renderer.setSize(width, height, false)
    const aspect = width / height
    camera.left = -7.5 * aspect
    camera.right = 7.5 * aspect
    graph.root.scale.x = Math.min(1, width / 900)
    camera.updateProjectionMatrix()
  }
  const onMouseMove = (event: MouseEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
  }
  const onVisibilityChange = () => {
    paused = document.hidden
    if (!paused && !reducedMotion && !stopped) frame = requestAnimationFrame(render)
  }
  const onContextLost = (event: Event) => { event.preventDefault(); stopped = true; cancelAnimationFrame(frame) }
  const render = (time: number) => {
    if (stopped) return
    resize()
    const seconds = time * 0.001
    graph.root.rotation.y = Math.sin(seconds * Math.PI * 2 / 24) * 0.055 + pointer.x * 0.045
    graph.root.rotation.x = pointer.y * -0.025
    graph.card.position.y = 5.25 + Math.sin(seconds * 0.65) * 0.1
    graph.particles.forEach(({particle, route}) => {
      const progress = (seconds * 0.09 + route.phase) % 1
      particle.position.lerpVectors(route.start, route.end, progress)
    })
    renderer.render(scene, camera)
    if (!paused && !reducedMotion) frame = requestAnimationFrame(render)
  }
  window.addEventListener('resize', resize)
  const resizeObserver = new ResizeObserver(resize)
  if (container) resizeObserver.observe(container)
  window.addEventListener('mousemove', onMouseMove, {passive: true})
  document.addEventListener('visibilitychange', onVisibilityChange)
  canvas.addEventListener('webglcontextlost', onContextLost)
  resize()
  render(0)

  return () => {
    stopped = true
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    resizeObserver.disconnect()
    window.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (material.map) material.map.dispose()
        material.dispose()
      })
    })
    iconCleanups.forEach((cleanup) => cleanup())
    renderer.dispose()
  }
}
