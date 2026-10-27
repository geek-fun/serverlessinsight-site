const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

function settings(runtime) {
  const style = runtime.getComputedStyle?.(runtime.document.documentElement)
  const value = (name, fallback) => Number.parseFloat(style?.getPropertyValue(name)) || fallback
  return {
    ease: style?.getPropertyValue('--si-motion-ease').trim() || EASE,
    page: value('--si-motion-page', 720),
    route: value('--si-motion-route', 420),
    feedback: value('--si-motion-feedback', 160),
    trace: value('--si-motion-trace', 750)
  }
}

function animate(element, frames, options) {
  if (!element?.animate) return null
  try {
    return element.animate(frames, {...options, fill: 'none'})
  } catch {
    // Animation is progressive enhancement; content and controls stay usable.
    return null
  }
}

export function animateContentChange(element, runtime = globalThis.window) {
  if (!element || !runtime?.matchMedia || runtime.document.visibilityState === 'hidden') return null
  const preference = runtime.matchMedia(REDUCED_MOTION)
  if (preference.matches) return null
  const motion = settings(runtime)
  const animation = animate(
    element,
    [
      {opacity: 0.94, transform: 'translateY(2px)'},
      {opacity: 1, transform: 'none'}
    ],
    {duration: motion.feedback, easing: motion.ease}
  )
  if (!animation) return null
  const onPreference = (event) => {
    if (event.matches) animation.cancel()
  }
  const cleanup = () => preference.removeEventListener?.('change', onPreference)
  preference.addEventListener?.('change', onPreference)
  animation.finished.then(cleanup, cleanup)
  return animation
}

export function createSiteMotion(runtime) {
  if (!runtime?.matchMedia || !runtime.document) return {enter() {}, replay() {}, dispose() {}}
  const document = runtime.document
  const preference = runtime.matchMedia(REDUCED_MOTION)
  const active = new Set()
  const workflow = new Set()
  let observer = null
  let disposed = false
  let home = false
  let previousPath = null
  const marketing = (path) => ['index.md', 'en/index.md', 'pricing.md', 'en/pricing.md'].includes(path)
  const allowed = () => !disposed && !preference.matches && document.visibilityState !== 'hidden'
  const cancel = (animations) => {
    for (const animation of animations) animation.cancel()
    animations.clear()
  }
  const stop = () => {
    observer?.disconnect()
    observer = null
    cancel(active)
    workflow.clear()
  }
  const track = (element, frames, options, group) => {
    const animation = animate(element, frames, options)
    if (!animation) return
    active.add(animation)
    group?.add(animation)
    const cleanup = () => {
      active.delete(animation)
      group?.delete(animation)
    }
    animation.finished.then(cleanup, cleanup)
  }
  const arrive = (element, motion, delay = 0, horizontal = false) =>
    track(
      element,
      [
        {
          opacity: 0.35,
          transform: horizontal && (runtime.innerWidth ?? 1280) > 640 ? 'translateX(24px)' : 'translateY(28px)'
        },
        {opacity: 1, transform: 'none'}
      ],
      {duration: motion.page, delay, easing: motion.ease}
    )

  const playWorkflow = () => {
    if (!home || !allowed()) return
    cancel(workflow)
    const motion = settings(runtime)
    // Guide the eye through the existing illustrative plan, then its resource relationships.
    // Values stay truthful and immediately readable throughout the sequence.
    Array.from(document.querySelectorAll('.si-plan-table tbody tr')).forEach((row, index) => {
      track(
        row,
        [
          {opacity: 0.55, backgroundColor: 'transparent', transform: 'translateX(12px)'},
          {opacity: 1, backgroundColor: 'var(--si-motion-row)', transform: 'none', offset: 0.25},
          {opacity: 1, backgroundColor: 'var(--si-motion-row)', transform: 'none', offset: 0.7},
          {opacity: 1, backgroundColor: 'transparent', transform: 'none'}
        ],
        {duration: 650, delay: 400 + index * 450, easing: 'ease-in-out'},
        workflow
      )
    })
    Array.from(document.querySelectorAll('.si-topology > div > svg')).forEach((node, index) => {
      track(
        node,
        [
          {transform: 'scale(1)', color: 'var(--si-text)'},
          {transform: 'scale(1.12)', color: 'var(--si-link)', offset: 0.3},
          {transform: 'scale(1.12)', color: 'var(--si-link)', offset: 0.65},
          {transform: 'scale(1)', color: 'var(--si-text)'}
        ],
        {duration: 650, delay: 1900 + index * 650, easing: 'ease-in-out'},
        workflow
      )
    })
    Array.from(document.querySelectorAll('.si-topology__trace'))
      .slice(0, 2)
      .forEach((arrow, index) => {
        const paths = Array.from(arrow.querySelectorAll('path')).flatMap((path) => {
          try {
            const length = path.getTotalLength()
            return length > 0 ? [{path, length}] : []
          } catch {
            return []
          }
        })
        if (!paths.length) return
        const options = {duration: motion.trace, delay: 2200 + index * 650, easing: motion.ease}
        for (const {path, length} of paths) {
          track(
            path,
            [
              {strokeDasharray: `${length} ${length}`, strokeDashoffset: length},
              {strokeDasharray: `${length} ${length}`, strokeDashoffset: 0}
            ],
            options,
            workflow
          )
        }
        track(
          arrow,
          [{opacity: 0}, {opacity: 1, offset: 0.2}, {opacity: 1, offset: 0.8}, {opacity: 0}],
          {...options, easing: 'linear'},
          workflow
        )
      })
  }
  const onPreference = (event) => {
    if (event.matches) stop()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') stop()
  }
  preference.addEventListener?.('change', onPreference)
  document.addEventListener('visibilitychange', onVisibility)

  return {
    enter(path, {initial = false} = {}) {
      stop()
      const fromMarketing = marketing(previousPath)
      previousPath = path
      home = path === 'index.md' || path === 'en/index.md'
      if (!allowed()) return
      delete document.documentElement.dataset.platformSwitched
      const motion = settings(runtime)
      const pricing = path === 'pricing.md' || path === 'en/pricing.md'
      if (!home && !pricing) {
        // The header stays anchored while a marketing-to-reading route reveals its new layout.
        // Routine reading navigation stays quick and has no spatial movement.
        if (!initial) {
          track(
            document.querySelector('.si-site .VPContent'),
            fromMarketing
              ? [
                  {opacity: 0.2, transform: 'translateY(16px)'},
                  {opacity: 1, transform: 'none'}
                ]
              : [{opacity: 0.6}, {opacity: 1}],
            {duration: fromMarketing ? motion.route : 220, easing: motion.ease}
          )
          if (fromMarketing)
            track(
              document.querySelector('.VPSidebar .nav'),
              [
                {opacity: 0.25, transform: 'translateY(10px)'},
                {opacity: 1, transform: 'none'}
              ],
              {duration: motion.route, delay: 40, easing: motion.ease}
            )
        }
        return
      }
      if (home) {
        Array.from(document.querySelectorAll('.si-hero__title > span')).forEach((line, index) =>
          arrive(line, motion, index * 85)
        )
        arrive(document.querySelector('.si-hero__subtitle'), motion, 180)
        arrive(document.querySelector('.si-hero__actions'), motion, 260)
      } else arrive(document.querySelector('.pp-hero'), motion)

      const pending = new Map()
      const deployment = document.querySelector('.si-deployment')
      if (home && deployment) pending.set(deployment, () => arrive(deployment, motion, 0, true))
      const topology = document.querySelector('.si-topology')
      if (home && topology) pending.set(topology, playWorkflow)
      // Only the product artifacts enter on scroll; prose and reading pages stay still.
      Array.from(
        document.querySelectorAll(home ? '.si-code-window, .si-stage-example, .si-console-preview' : '.pp-card')
      ).forEach((element) => pending.set(element, () => arrive(element, motion)))
      if (runtime.IntersectionObserver) {
        observer = new runtime.IntersectionObserver(
          (entries) => {
            if (!allowed()) return
            for (const entry of entries) {
              if (!entry.isIntersecting) continue
              const start = pending.get(entry.target)
              pending.delete(entry.target)
              observer?.unobserve(entry.target)
              start?.()
            }
          },
          {threshold: 0.18, rootMargin: '0px 0px -32px 0px'}
        )
        for (const element of pending.keys()) observer.observe(element)
      } else if (home && deployment) {
        // No hidden CSS state: browsers without observers retain all page content.
        pending.get(deployment)?.()
        playWorkflow()
      }
    },
    replay: playWorkflow,
    dispose() {
      disposed = true
      stop()
      preference.removeEventListener?.('change', onPreference)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}
