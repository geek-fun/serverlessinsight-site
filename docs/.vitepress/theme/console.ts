/** Console app entry points; the host is baked per deploy line (__SITE_LINE__). */
export const CONSOLE_URL =
  __SITE_LINE__ === 'cn' ? 'https://console.serverlessinsight.cn' : 'https://console.serverlessinsight.com'
export const CONSOLE_LOGIN_URL = `${CONSOLE_URL}/login`
export const CONSOLE_GET_STARTED_URL = CONSOLE_URL
