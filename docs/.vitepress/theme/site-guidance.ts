import {SITE_URL_CN} from './compliance'

export const SITE_PREFERENCE_KEY = 'si:site-preference:v1'

export function suggestCnSite(input: {
  siteLine: string
  languages: readonly string[]
  timeZone: string
  preference: string | null
  currentHref: string
}): string | null {
  if (input.siteLine !== 'intl' || input.preference === 'cn' || input.preference === 'intl') return null
  const simplifiedChinese = input.languages.some((language) => /^zh-(cn|hans)(-|$)/i.test(language))
  if (!simplifiedChinese && input.timeZone !== 'Asia/Shanghai') return null
  try {
    const current = new URL(input.currentHref)
    if (current.protocol !== 'https:' && current.protocol !== 'http:') return null
    const target = new URL(SITE_URL_CN)
    target.pathname = current.pathname
    target.hash = current.hash
    return target.href
  } catch {
    return null
  }
}
