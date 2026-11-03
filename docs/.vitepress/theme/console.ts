import { isCnLine } from './site-line'

/** Console app entry points; the host follows the deploy line. */
export const CONSOLE_URL = isCnLine
  ? 'https://console.serverlessinsight.cn'
  : 'https://console.serverlessinsight.com'
export const CONSOLE_LOGIN_URL = `${CONSOLE_URL}/login`
export const CONSOLE_GET_STARTED_URL = CONSOLE_URL
