import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {runInNewContext} from 'node:vm'
import {transformWithEsbuild} from 'vite'

const source = new URL('../docs/.vitepress/theme/useSiteMotion.ts', import.meta.url)
const {code} = await transformWithEsbuild(readFileSync(source, 'utf8'), source.pathname, {format: 'cjs'})

function harness() {
  const mounted = [],
    unmounted = [],
    ticks = [],
    entries = []
  const page = {value: {relativePath: 'en/index.md'}}
  let watchCallback,
    watchOptions,
    created = 0,
    disposed = 0,
    replayed = 0,
    replayCallback
  const module = {exports: {}}
  runInNewContext(code, {
    module,
    exports: module.exports,
    window: {},
    require(name) {
      if (name === 'vue')
        return {
          provide(key, callback) {
            assert.equal(key, 'si-replay-workflow')
            replayCallback = callback
          },
          nextTick: () => new Promise((resolve) => ticks.push(resolve)),
          onMounted: (callback) => mounted.push(callback),
          onUnmounted: (callback) => unmounted.push(callback),
          watch(getter, callback, options) {
            assert.equal(getter(), 'en/index.md')
            watchCallback = callback
            watchOptions = options
          }
        }
      if (name === 'vitepress') return {useData: () => ({page})}
      if (name === './motion.mjs')
        return {
          createSiteMotion() {
            ++created
            return {
              enter: (path, options) => entries.push({path, initial: options?.initial ?? false}),
              replay: () => ++replayed,
              dispose: () => ++disposed
            }
          }
        }
      throw new Error(`Unexpected dependency: ${name}`)
    }
  })
  module.exports.useSiteMotion()
  return {
    mount: () => mounted[0](),
    unmount: () => unmounted[0](),
    change: (path) => watchCallback(path),
    flush: () => ticks.splice(0).forEach((resolve) => resolve()),
    entries,
    replay: () => replayCallback(),
    replayed: () => replayed,
    options: watchOptions,
    created: () => created,
    disposed: () => disposed
  }
}

test('The Vue motion integration waits for mounting, leaving server rendering untouched', () => {
  const h = harness()
  assert.equal(h.created(), 0)
  assert.equal(h.options.flush, 'post')
  h.mount()
  assert.equal(h.created(), 1)
  assert.deepEqual(h.entries, [{path: 'en/index.md', initial: true}])
  h.unmount()
  assert.equal(h.disposed(), 1)
})

test('Rapid route changes animate only the final rendered destination', async () => {
  const h = harness()
  h.mount()
  const first = h.change('en/docs.md')
  const second = h.change('en/pricing.md')
  h.flush()
  await Promise.all([first, second])
  assert.deepEqual(
    h.entries.map((entry) => entry.path),
    ['en/index.md', 'en/pricing.md']
  )
  h.unmount()
})

test('Unmount cancels the controller and prevents a pending route callback from starting new work', async () => {
  const h = harness()
  h.mount()
  const pending = h.change('en/docs.md')
  h.unmount()
  h.flush()
  await pending
  assert.equal(h.disposed(), 1)
  assert.equal(h.entries.length, 1)
  const server = harness()
  assert.doesNotThrow(() => server.unmount())
})

test('The replay callback is SSR-safe and follows controller mounting and cleanup', () => {
  const h = harness()
  h.replay()
  assert.equal(h.replayed(), 0)
  h.mount()
  h.replay()
  assert.equal(h.replayed(), 1)
  h.unmount()
  h.replay()
  assert.equal(h.replayed(), 1)
})
