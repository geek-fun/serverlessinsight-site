export const INSTALL_COMMAND = 'npm install -g @geek-fun/serverlessinsight'

// The minimal deployable function example from docs/getting-started.md.
export const CONFIGURATION = `version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou
app: hello-world
service: hello-world-api

functions:
  hello_world_fn:
    name: hello-world-fn
    code:
      runtime: nodejs18
      handler: index.handler
      path: artifacts/hello-world-api.zip`

export const CONFIGURATION_LINES = CONFIGURATION.split('\n').map((line) => {
  const match = line.match(/^(\s*[\w]+:)(.*)$/)
  return match ? {key: match[1], value: match[2]} : {key: '', value: line}
})

export const EN = {
  eyebrow: 'Open-source · Multi-cloud',
  title: 'Full-Stack Serverless Development Platform',
  titleLines: ['Full-Stack', 'Serverless', 'Development', 'Platform'],
  subtitle:
    'One-stop management for the development, deployment and operations of cross-cloud serverless applications.',
  start: 'Start for Free',
  docs: 'Read the docs',
  trust: 'Apache-2.0',
  ownership: 'Deploy in your cloud',
  copyInstall: 'Copy install command',
  copyConfiguration: 'Copy configuration',
  copied: 'Copied to clipboard.',
  copyFailed: 'Unable to copy. Please select and copy the text.',
  panelTitle: 'See every change before it ships.',
  illustration: 'Illustrative workflow',
  configuration: 'Configuration',
  plan: 'Deployment plan',
  resource: 'Resource',
  type: 'Type',
  change: 'Change',
  function: 'Function',
  gateway: 'API Gateway',
  storage: 'Storage',
  create: 'Create',
  unchanged: 'Unchanged',
  added: '2 to add',
  modified: '0 to modify',
  removed: '0 to remove',
  proceed: 'Proceed? (yes/no):',
  topology: 'Application resource relationships',
  gatewayLabel: 'Gateway',
  functionLabel: 'Function',
  storageLabel: 'Storage',
  panelNote: 'Deployment plan shown for Alibaba Cloud.',
  replay: 'Replay workflow',
  deployTo: 'Deploy to',
  cloudSupport: 'View cloud support',
  cloudNote: 'Resource and command support varies by provider.',
  clouds: ['Alibaba Cloud', 'Tencent Cloud', 'Volcengine'],
  workflowTitle: 'A clear path\nfrom code to cloud.',
  workflowLead: 'Develop locally, validate your configuration, then deploy to your cloud.',
  steps: [
    {command: 'si local', description: 'Run and debug your application locally.'},
    {command: 'si validate', description: 'Check the configuration before deployment.'},
    {command: 'si deploy', description: 'Review and apply incremental changes.'}
  ],
  cliReference: 'Explore the CLI reference',
  configurationEyebrow: 'One configuration',
  stackTitle: 'Your full stack,\nin one file.',
  stackLead: 'Define functions, API entry points, databases and storage in serverlessinsight.yml.',
  resourceLabels: ['Functions', 'API entry points', 'Databases', 'Object storage'],
  configurationReference: 'Explore the configuration reference',
  example: 'Alibaba Cloud example',
  exampleCaption: 'A minimal function configuration. Explore the reference for the full resource model.',
  closeTitle: 'Bring clarity to your\nnext deployment.',
  closeLead: 'Define your application. Understand the changes. Deploy with confidence.',
  pricing: 'Explore pricing',
  license: 'Open source under Apache-2.0.'
}

export const ZH: typeof EN = {
  eyebrow: '开源 · 多云',
  title: '全栈 Serverless 应用开发平台',
  titleLines: ['全栈', 'Serverless', '应用开发平台'],
  subtitle: '一站式管理跨云 Serverless 应用的开发、部署与运维。',
  start: '免费开始',
  docs: '阅读文档',
  trust: 'Apache-2.0',
  ownership: '部署到你的云',
  copyInstall: '复制安装命令',
  copyConfiguration: '复制配置',
  copied: '已复制到剪贴板。',
  copyFailed: '无法自动复制，请选中文本后复制。',
  panelTitle: '部署前，看清每一项变更。',
  illustration: '工作流示例',
  configuration: '应用配置',
  plan: '部署计划',
  resource: '资源',
  type: '类型',
  change: '变更',
  function: '函数',
  gateway: 'API 网关',
  storage: '对象存储',
  create: '创建',
  unchanged: '无变更',
  added: '新增 2',
  modified: '变更 0',
  removed: '移除 0',
  proceed: '是否执行？(yes/no):',
  topology: '应用资源关系',
  gatewayLabel: '网关',
  functionLabel: '函数',
  storageLabel: '存储',
  panelNote: '此部署计划以阿里云为例。',
  replay: '重播工作流',
  deployTo: '支持部署到',
  cloudSupport: '查看云支持',
  cloudNote: '各云厂商支持的资源与命令有所不同。',
  clouds: ['阿里云', '腾讯云', '火山引擎'],
  workflowTitle: '从代码到云端，\n每一步都清晰。',
  workflowLead: '本地开发调试，验证应用配置，再部署到你的云。',
  steps: [
    {command: 'si local', description: '在本地运行和调试应用。'},
    {command: 'si validate', description: '部署前，检查应用配置。'},
    {command: 'si deploy', description: '检查并执行增量变更。'}
  ],
  cliReference: '查看 CLI 参考',
  configurationEyebrow: '一份配置',
  stackTitle: '一个文件，\n定义完整应用。',
  stackLead: '在 serverlessinsight.yml 中声明函数、API 入口、数据库与对象存储。',
  resourceLabels: ['函数', 'API 入口', '数据库', '对象存储'],
  configurationReference: '查看配置手册',
  example: '阿里云示例',
  exampleCaption: '可部署的最小函数配置。完整资源模型请查阅配置手册。',
  closeTitle: '让下一次部署，\n清晰可见。',
  closeLead: '声明应用，理解变更，从容部署。',
  pricing: '查看定价',
  license: '基于 Apache-2.0 协议开源。'
}
