/**
 * Compliance and cross-line site constants (#52 Phase M / #89). One place to
 * update when filings change — the ICP number is rendered in the footer of the
 * CN build and grepped by the deploy-cn health gate, so keep it in sync with
 * the actual filing.
 */

// ICP filing for serverlessinsight.cn (attached to the console's Aliyun entity).
export const ICP_NUMBER = '滇ICP备2025072614号-6'
// Public-security (公安) filing — pending; rendered once non-empty.
export const PSB_NUMBER = ''
export const PSB_SEARCH_URL = 'https://beian.mps.gov.cn/#/query/webSearch'
export const ICP_URL = 'https://beian.miit.gov.cn'

// Cross-line entry points (#89: switching stays user-initiated — footer links
// only, no auto-redirect; the GeoIP guidance banner is a separate change).
export const SITE_URL_CN = 'https://www.serverlessinsight.cn'
export const SITE_URL_INTL = 'https://www.serverlessinsight.com'
