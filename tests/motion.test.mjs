import assert from 'node:assert/strict'
import test from 'node:test'
import {animateContentChange, createSiteMotion} from '../docs/.vitepress/theme/motion.mjs'

function events(target = {}) {
  const listeners = new Map()
  return Object.assign(target, {
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name).add(callback)
    },
    removeEventListener(name, callback) {
      listeners.get(name)?.delete(callback)
    },
    emit(name, event = {}) {
      for (const callback of [...(listeners.get(name) ?? [])]) callback(event)
    },
    listenerCount(name) {
      return listeners.get(name)?.size ?? 0
    }
  })
}

function harness({reduced = false, hidden = false, supported = true, observed = false} = {}) {
  const calls = []
  const preference = events({matches: reduced})
  const element = (name) => ({
    name,
    animate: supported
      ? (frames, options) => {
          let resolve, reject
          const finished = new Promise((yes, no) => {
            resolve = yes
            reject = no
          })
          const animation = {
            name,
            frames,
            options,
            finished,
            cancelled: false,
            cancel() {
              this.cancelled = true
              reject(new Error('cancelled'))
            },
            finish() {
              resolve()
            }
          }
          calls.push(animation)
          return animation
        }
      : undefined
  })
  const hero = element('hero')
  const lines = [0, 1, 2, 3].map((i) => element(`line-${i}`))
  const rows = [0, 1, 2].map((i) => element(`row-${i}`))
  const nodes = [0, 1, 2].map((i) => element(`node-${i}`))
  const artifact = element('artifact')
  const chapter = element('chapter')
  const topology = element('topology')
  const observers = []
  const pricing = element('pricing')
  const reading = element('reading')
  const sidebar = element('sidebar')
  const arrows = [0, 1].map((i) => {
    const path = {...element(`path-${i}`), getTotalLength: () => 32}
    return {...element(`arrow-${i}`), path, querySelectorAll: () => [path]}
  })
  const document = events({
    visibilityState: hidden ? 'hidden' : 'visible',
    documentElement: {dataset: {platformSwitched: ''}},
    querySelector(selector) {
      if (selector === '.si-topology') return topology
      if (selector === '.VPSidebar .nav') return sidebar
      return selector === '.si-deployment'
        ? artifact
        : selector === '.pp-hero'
          ? pricing
          : selector.startsWith('.si-hero')
            ? hero
            : reading
    },
    querySelectorAll(selector) {
      return selector === '.si-topology__trace'
        ? arrows
        : selector === '.si-plan-table tbody tr'
          ? rows
          : selector === '.si-topology > div > svg'
            ? nodes
            : selector === '.si-hero__title > span'
              ? lines
              : [chapter]
    }
  })
  const runtime = {
    document,
    matchMedia(query) {
      assert.equal(query, '(prefers-reduced-motion: reduce)')
      return preference
    },
    getComputedStyle: () => ({getPropertyValue: () => ''})
  }
  if (observed)
    runtime.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback
        this.options = options
        this.targets = new Set()
        this.disconnected = false
        observers.push(this)
      }
      observe(target) {
        this.targets.add(target)
      }
      unobserve(target) {
        this.targets.delete(target)
      }
      disconnect() {
        this.disconnected = true
        this.targets.clear()
      }
      intersect(target, isIntersecting = true) {
        this.callback([{target, isIntersecting}])
      }
    }
  return {
    calls,
    preference,
    runtime,
    document,
    hero,
    arrows,
    lines,
    rows,
    nodes,
    artifact,
    topology,
    chapter,
    observers,
    element
  }
}

test('Motion modules are safe without a browser and leave SSR content alone', () => {
  const motion = createSiteMotion()
  motion.enter('index.md')
  motion.dispose()
  assert.equal(animateContentChange(null), null)
  assert.equal(animateContentChange({}), null)
})

test('The home authors readable headline entrances and a bounded plan-to-topology sequence', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('en/index.md', {initial: true})
  assert.deepEqual(
    h.calls.slice(0, 4).map((call) => call.name),
    ['line-0', 'line-1', 'line-2', 'line-3']
  )
  assert.equal(h.calls[0].options.duration, 720)
  assert.equal(h.calls[3].options.delay, 255)
  assert.equal(h.calls[0].frames[0].transform, 'translateY(28px)')
  const rows = h.calls.filter((call) => call.name.startsWith('row-'))
  assert.deepEqual(
    rows.map((call) => call.options.delay),
    [400, 850, 1300]
  )
  const nodes = h.calls.filter((call) => call.name.startsWith('node-'))
  assert.deepEqual(
    nodes.map((call) => call.options.delay),
    [1900, 2550, 3200]
  )
  const path = h.calls.find((call) => call.name === 'path-0')
  assert.equal(path.frames[0].strokeDashoffset, 32)
  assert.equal(path.frames[1].strokeDashoffset, 0)
  assert.equal(path.options.delay, 2200)
  assert.ok(h.calls.every((call) => call.options.fill === 'none'))
  assert.equal(Math.max(...h.calls.map((call) => call.options.duration + (call.options.delay ?? 0))), 3850)
  motion.dispose()
})

test('Offscreen artifacts wait for visibility and each chapter enters only once', () => {
  const h = harness({observed: true})
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  const observer = h.observers[0]
  assert.equal(observer.options.threshold, 0.18)
  assert.equal(h.calls.length, 6, 'Headline and actions enter before offscreen artifacts')
  observer.intersect(h.artifact, false)
  assert.equal(h.calls.length, 6)
  observer.intersect(h.artifact)
  assert.ok(!h.calls.some((call) => call.name === 'row-0'), 'Workflow waits for the diagram itself')
  observer.intersect(h.topology)
  assert.ok(h.calls.some((call) => call.name === 'row-0'))
  assert.equal(observer.targets.has(h.artifact), false)
  observer.intersect(h.chapter)
  const count = h.calls.length
  observer.intersect(h.chapter)
  assert.equal(h.calls.length, count)
  motion.enter('en/docs.md', {initial: true})
  assert.equal(observer.disconnected, true)
  motion.dispose()
})

test('Replay restarts the resource workflow without moving headlines or accumulating animations', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.replay()
  assert.equal(h.calls.length, 0)
  motion.enter('index.md')
  const old = [...h.calls]
  motion.replay()
  assert.ok(old.filter((call) => /^(row|node|path|arrow)-/.test(call.name)).every((call) => call.cancelled))
  assert.ok(old.filter((call) => /^(line|hero|artifact)/.test(call.name)).every((call) => !call.cancelled))
  assert.ok(h.calls.slice(old.length).every((call) => /^(row|node|path|arrow)-/.test(call.name)))
  motion.enter('pricing.md')
  const count = h.calls.length
  motion.replay()
  assert.equal(h.calls.length, count)
  motion.dispose()
})

test('Changing routes cancels the previous sequence before starting the next hero', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  const previous = [...h.calls]
  motion.enter('pricing.md')
  assert.ok(previous.every((call) => call.cancelled))
  assert.equal(h.calls.at(-1).name, 'pricing')
  assert.equal(h.calls.length, previous.length + 1)
  motion.dispose()
})

test('Reading pages have no initial choreography and use only a quick route opacity change', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('en/docs.md', {initial: true})
  assert.equal(h.calls.length, 0)
  assert.equal(h.document.documentElement.dataset.platformSwitched, undefined)
  motion.enter('en/reference.md')
  assert.equal(h.calls.length, 1)
  assert.equal(h.calls[0].name, 'reading')
  assert.equal(h.calls[0].options.duration, 220)
  assert.ok(h.calls[0].frames.every((frame) => !('transform' in frame)))
  motion.dispose()
})

test('Pricing to docs reveals the reading content and sidebar while keeping the header anchored', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('en/pricing.md', {initial: true})
  const pricingCount = h.calls.length
  motion.enter('en/docs.md')
  const arrival = h.calls.slice(pricingCount)
  assert.deepEqual(
    arrival.map((call) => call.name),
    ['reading', 'sidebar']
  )
  assert.equal(arrival[0].options.duration, 420)
  assert.equal(arrival[0].frames[0].opacity, 0.2)
  assert.equal(arrival[0].frames[0].transform, 'translateY(16px)')
  assert.equal(arrival[1].options.delay, 40)
  motion.enter('en/reference.md')
  assert.equal(h.calls.at(-1).options.duration, 220)
  assert.ok(h.calls.at(-1).frames.every((frame) => !('transform' in frame)))
  motion.dispose()
})

test('A marketing-to-reading arrival is cancelled by fast navigation and never runs under reduced motion', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('pricing.md')
  motion.enter('docs.md')
  const arrival = h.calls.slice(-2)
  motion.enter('reference.md')
  assert.ok(arrival.every((call) => call.cancelled))
  h.preference.matches = true
  const count = h.calls.length
  motion.enter('pricing.md')
  motion.enter('docs.md')
  assert.equal(h.calls.length, count)
  motion.dispose()
})

test('Finished animations leave the cancellation set and do not accumulate across routes', async () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('pricing.md')
  h.calls[0].finish()
  await Promise.resolve()
  motion.enter('en/terms.md', {initial: true})
  assert.equal(h.calls[0].cancelled, false)
  motion.dispose()
})

test('Reduced motion suppresses initial work and cancels an active sequence on preference changes', () => {
  const h = harness({reduced: true})
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  motion.replay()
  assert.equal(h.calls.length, 0)
  h.preference.matches = false
  motion.enter('index.md')
  h.preference.matches = true
  h.preference.emit('change', {matches: true})
  assert.ok(h.calls.every((call) => call.cancelled))
  const count = h.calls.length
  motion.enter('pricing.md')
  motion.replay()
  assert.equal(h.calls.length, count)
  motion.dispose()
  assert.equal(h.preference.listenerCount('change'), 0)
})

test('Hidden documents neither start nor replay a sequence; hiding cancels active work', () => {
  const h = harness({hidden: true})
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  assert.equal(h.calls.length, 0)
  h.document.visibilityState = 'visible'
  motion.enter('index.md')
  h.document.visibilityState = 'hidden'
  h.document.emit('visibilitychange')
  assert.ok(h.calls.every((call) => call.cancelled))
  const count = h.calls.length
  h.document.visibilityState = 'visible'
  h.document.emit('visibilitychange')
  assert.equal(h.calls.length, count)
  motion.dispose()
})

test('Dispose is repeatable, cancels work, removes listeners and prevents later entry', () => {
  const h = harness()
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  const count = h.calls.length
  motion.dispose()
  motion.dispose()
  motion.enter('index.md')
  assert.equal(h.calls.length, count)
  assert.ok(h.calls.every((call) => call.cancelled))
  assert.equal(h.document.listenerCount('visibilitychange'), 0)
  assert.equal(h.preference.listenerCount('change'), 0)
})

test('Unavailable or rejected animation APIs cannot break page content or navigation', () => {
  const h = harness({supported: false})
  const motion = createSiteMotion(h.runtime)
  assert.doesNotThrow(() => motion.enter('index.md'))
  assert.equal(h.calls.length, 0)
  assert.equal(animateContentChange(h.hero, h.runtime), null)
  motion.dispose()
  const broken = harness()
  for (const element of [...broken.lines, ...broken.rows, ...broken.nodes, broken.artifact, broken.hero])
    element.animate = () => {
      throw new Error('Unsupported keyframes')
    }
  broken.arrows[0].path.getTotalLength = () => {
    throw new Error('Unavailable SVG geometry')
  }
  broken.arrows[1].path.getTotalLength = () => 0
  const fallback = createSiteMotion(broken.runtime)
  assert.doesNotThrow(() => fallback.enter('index.md'))
  assert.equal(broken.calls.length, 0)
  fallback.dispose()
})

test('Feedback shows the updated content immediately and cleans preference listeners when finished', async () => {
  const h = harness()
  const animation = animateContentChange(h.hero, h.runtime)
  assert.equal(animation.options.duration, 160)
  assert.equal(animation.frames[0].opacity, 0.94)
  assert.equal(h.preference.listenerCount('change'), 1)
  animation.finish()
  await Promise.resolve()
  assert.equal(h.preference.listenerCount('change'), 0)
})

test('Feedback cancels when reduced motion is requested and releases its listener', async () => {
  const h = harness()
  const animation = animateContentChange(h.hero, h.runtime)
  h.preference.matches = true
  h.preference.emit('change', {matches: true})
  assert.equal(animation.cancelled, true)
  await Promise.resolve()
  assert.equal(h.preference.listenerCount('change'), 0)
  assert.equal(animateContentChange(h.hero, h.runtime), null)
  h.document.visibilityState = 'hidden'
  h.preference.matches = false
  assert.equal(animateContentChange(h.hero, h.runtime), null)
})

test('Shared CSS timing tokens drive the controller and feedback without a separate animation library', () => {
  const h = harness()
  const tokens = {
    '--si-motion-page': '220ms',
    '--si-motion-trace': '400ms',
    '--si-motion-feedback': '120ms',
    '--si-motion-ease': 'ease-out'
  }
  h.runtime.getComputedStyle = () => ({getPropertyValue: (name) => tokens[name] ?? ''})
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  assert.equal(h.calls[0].options.duration, 220)
  assert.equal(h.calls.find((call) => call.name === 'path-0').options.duration, 400)
  assert.equal(h.calls[0].options.easing, 'ease-out')
  const feedback = animateContentChange(h.hero, h.runtime)
  assert.equal(feedback.options.duration, 120)
  feedback.cancel()
  motion.dispose()
})

test('Mobile artifact entrances stay on the vertical axis to avoid horizontal overflow', () => {
  const h = harness()
  h.runtime.innerWidth = 390
  const motion = createSiteMotion(h.runtime)
  motion.enter('index.md')
  assert.equal(h.calls.find((call) => call.name === 'artifact').frames[0].transform, 'translateY(28px)')
  motion.dispose()
})

test('Reduced motion and hidden tabs disconnect pending scroll observers', () => {
  for (const reason of ['hidden', 'reduced']) {
    const h = harness({observed: true})
    const motion = createSiteMotion(h.runtime)
    motion.enter('index.md')
    const count = h.calls.length
    if (reason === 'hidden') {
      h.document.visibilityState = 'hidden'
      h.document.emit('visibilitychange')
    } else {
      h.preference.matches = true
      h.preference.emit('change', {matches: true})
    }
    assert.equal(h.observers[0].disconnected, true)
    h.observers[0].intersect(h.topology)
    motion.replay()
    assert.equal(h.calls.length, count)
    motion.dispose()
  }
})
