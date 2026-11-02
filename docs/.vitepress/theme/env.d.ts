/**
 * Build-time deploy line, injected via Vite `define` in config.mts:
 *   SITE_LINE=cn npm run docs:build  →  'cn'   (Hangzhou bucket, .cn)
 *   npm run docs:build               →  'intl' (Singapore bucket, .com)
 * Theme modules branch on this constant; never read process.env in theme code.
 */
declare const __SITE_LINE__: 'intl' | 'cn'
