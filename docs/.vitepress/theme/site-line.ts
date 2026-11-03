/**
 * Deploy line, resolved at build time and safe at runtime.
 *
 * Vite's `define` on a bare identifier is applied by the esbuild pass in build
 * mode only — in dev the identifier would stay unresolved and throw a
 * ReferenceError, blanking the whole SPA. `typeof` is safe on an undeclared
 * name, so build gets the baked value while dev falls through to
 * import.meta.env (Vite's own channel, available in both modes) and finally to
 * the international default.
 */
export type SiteLine = 'intl' | 'cn'

export const SITE_LINE: SiteLine =
  typeof __SITE_LINE__ !== 'undefined'
    ? __SITE_LINE__
    : (import.meta.env.SITE_LINE as SiteLine | undefined) === 'cn'
      ? 'cn'
      : 'intl'

export const isCnLine = SITE_LINE === 'cn'
