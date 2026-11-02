/**
 * Console app entry points. The marketing site links to the console for
 * login/signup — the login page itself is served by console-serverlessinsight.
 * The host is baked per deploy line (#52 Phase M): the CN build links the
 * domestic console, the default build links the international one.
 */
export const CONSOLE_URL =
  __SITE_LINE__ === 'cn' ? 'https://console.serverlessinsight.cn' : 'https://console.serverlessinsight.com'
export const CONSOLE_LOGIN_URL = `${CONSOLE_URL}/login`
export const CONSOLE_GET_STARTED_URL = CONSOLE_URL
