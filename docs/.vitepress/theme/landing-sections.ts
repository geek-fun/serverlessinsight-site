export const SECTION_EN = {
  featuresTitle: 'Everything you need\nto build and ship.',
  featuresLead:
    'Bring your application resources, environments and delivery workflow together. Start with a file. Grow into a shared platform.',
  benefits: [
    {
      title: 'Define the full stack',
      body: 'Functions, APIs, databases and storage in one configuration.',
      href: '#stack'
    },
    {
      title: 'Review every change',
      body: 'Understand what will change before it reaches your cloud.',
      href: '#delivery'
    },
    {
      title: 'Work in your own flow',
      body: 'Develop locally and deploy through your existing pipeline.',
      href: '#development'
    },
    {title: 'Bring your team together', body: 'A shared view of services, resources and deployments.', href: '#teams'}
  ],
  deliveryTitle: 'Know what changes.\nBefore production.',
  deliveryLead:
    'Keep development and production in the same configuration. Preview incremental changes against deployment state, then decide what to apply.',
  deliveryPoints: [
    'Separate environments with stages and variables.',
    'Inspect resource changes with si plan or si diff.',
    'Track configuration changes in version control.'
  ],
  deliveryLink: 'Explore deployment planning',
  stageExample: 'Environment example',
  changeExample: 'Illustrative change',
  developmentTitle: 'Keep your tools.\nImprove your workflow.',
  developmentLead:
    'Run and debug functions locally, then use the same CLI in your delivery pipeline. ServerlessInsight fits the way your team already builds.',
  developmentPoints: [
    'Local development and debugging.',
    'Configuration validation before deployment.',
    'CLI commands that fit existing CI/CD tools.'
  ],
  developmentLink: 'Start developing locally',
  localExample: 'Local workflow example',
  edit: 'Edit',
  test: 'Test locally',
  deploy: 'Deploy',
  localNote: 'Local development and resource support vary by provider.',
  localResult: 'Example function response',
  teamsTitle: 'Your applications.\nOne shared view.',
  teamsLead:
    'Move from individual commands to a common workspace. Explore application resources, follow deployment history and give your team a consistent place to work.',
  teamItems: ['Workspaces and members', 'Resources across clouds', 'Deployment history'],
  teamsLink: 'Explore the console',
  consolePreview: 'Console screenshot · Example data',
  consoleAlt:
    'ServerlessInsight console Resources screen with workspace and stage selectors, summary cards, service list and resource details, using example data.',
  consoleFullSize: 'View full-size screenshot',
  casesTitle: 'Built for the work\nyou want to ship.',
  casesLead: 'Start with a familiar application pattern and connect the cloud resources it needs.',
  cases: [
    {
      title: 'API backends',
      body: 'Connect an HTTP entry point to functions and a data layer. Keep routes and resources alongside your application.',
      nodes: ['HTTP', 'Function', 'Database'],
      cta: 'Build an API',
      page: 'getting-started',
      hash: 'give-the-function-an-http-entry'
    },
    {
      title: 'Full-stack web applications',
      body: 'Define static assets, API entry points and storage together. Manage the application as a complete stack.',
      nodes: ['Web assets', 'API', 'Storage'],
      cta: 'Explore storage',
      page: 'reference',
      hash: 'buckets'
    },
    {
      title: 'Scheduled jobs',
      body: 'Use timer-triggered functions for recurring application tasks and background processing.',
      nodes: ['Schedule', 'Function', 'Output'],
      cta: 'Explore functions',
      page: 'reference',
      hash: 'functions'
    }
  ],
  trustTitle: 'Open source.\nOn your terms.',
  trustLead: 'Review the source, keep your configuration in Git and deploy resources into your own cloud account.',
  trustLink: 'Explore on GitHub',
  trustLicense: 'Apache-2.0 licensed',
  faqTitle: 'A few things\nyou may be wondering.',
  faqLead: 'More details in our documentation.',
  faqLink: 'Visit the docs',
  faqs: [
    {
      question: 'How do the open-source CLI and platform plans fit together?',
      answer:
        'The CLI is open source under Apache-2.0. Developer, Team and Enterprise plans provide platform capabilities and managed resource allowances. Full details are on the pricing page. Your cloud provider bills cloud usage separately.'
    },
    {
      question: 'Does the plan price include cloud infrastructure costs?',
      answer:
        'No. ServerlessInsight charges cover the platform and managed resource usage. Functions, databases, storage and other cloud services are billed separately by your cloud provider.'
    },
    {
      question: 'Where do my applications run?',
      answer:
        'Application resources are deployed into the cloud account and region you configure. ServerlessInsight manages their definition and deployment workflow.'
    },
    {
      question: 'Are the same resources available on every cloud?',
      answer:
        'Resource types and command support differ between providers. Check the configuration reference for the current support matrix before choosing your target cloud.'
    },
    {
      question: 'Can I use my existing CI/CD pipeline?',
      answer:
        'Yes. The CLI can run in your existing pipeline with the appropriate cloud credentials, configuration and environment settings. It does not require a particular CI/CD vendor.'
    },
    {
      question: 'Can I start alone and move to a team plan later?',
      answer:
        'Yes. Start with the Developer allowance and choose Team when you need more members, workspaces, resources or automated deployment. Full allowances and billing rules are available on the pricing page.'
    }
  ]
}
export const SECTION_ZH: typeof SECTION_EN = {
  featuresTitle: '从构建到交付，\n所需尽在其中。',
  featuresLead: '把应用资源、多环境配置和交付流程连在一起。从一份配置开始，扩展为团队共享的平台。',
  benefits: [
    {title: '声明完整应用', body: '函数、API、数据库与对象存储，一份配置统一定义。', href: '#stack'},
    {title: '看清部署变更', body: '在变更进入云端之前，先理解每一项操作。', href: '#delivery'},
    {title: '沿用熟悉的工具', body: '本地开发调试，接入已有的交付流水线。', href: '#development'},
    {title: '让团队协作起来', body: '在共同的视图中管理服务、资源和部署。', href: '#teams'}
  ],
  deliveryTitle: '上线之前，\n先把变更看清楚。',
  deliveryLead: '在同一份配置中管理开发和生产环境。依据部署状态预览增量变更，再决定执行哪些操作。',
  deliveryPoints: [
    '通过 stages 和变量区分环境。',
    '使用 si plan 或 si diff 检查资源变更。',
    '在版本控制中追踪配置变化。'
  ],
  deliveryLink: '了解部署计划',
  stageExample: '多环境配置示例',
  changeExample: '变更示例',
  developmentTitle: '保留熟悉的工具，\n改进交付的方式。',
  developmentLead: '在本地运行和调试函数，再通过相同的 CLI 接入交付流水线。ServerlessInsight 融入团队已有的开发方式。',
  developmentPoints: ['本地开发与调试。', '部署前检查应用配置。', '通用 CLI，接入已有 CI/CD 工具。'],
  developmentLink: '开始本地开发',
  localExample: '本地工作流示例',
  edit: '编辑代码',
  test: '本地测试',
  deploy: '部署',
  localNote: '本地开发能力与资源支持因云厂商而异。',
  localResult: '示例函数响应',
  teamsTitle: '团队的应用，\n共享的视图。',
  teamsLead: '从独立的命令走向共同的工作区。查看应用资源、追踪部署历史，为团队提供一致的工作入口。',
  teamItems: ['工作区与成员', '跨云资源视图', '部署历史'],
  teamsLink: '体验控制台',
  consolePreview: '控制台截图 · 示例数据',
  consoleAlt: 'ServerlessInsight 控制台资源页，包含工作区与环境选择、资源概览、服务列表和资源详情，使用示例数据。',
  consoleFullSize: '查看完整尺寸截图',
  casesTitle: '为你想交付的\n应用而构建。',
  casesLead: '从熟悉的应用模式出发，连接所需的云资源。',
  cases: [
    {
      title: 'API 后端',
      body: '将 HTTP 入口、函数和数据层连接起来，让路由与资源和应用代码一同管理。',
      nodes: ['HTTP', '函数', '数据库'],
      cta: '构建 API',
      page: 'getting-started',
      hash: 'give-the-function-an-http-entry'
    },
    {
      title: '全栈 Web 应用',
      body: '共同定义静态资源、API 入口和存储，将应用作为完整的技术栈交付。',
      nodes: ['静态资源', 'API', '存储'],
      cta: '了解对象存储',
      page: 'reference',
      hash: 'buckets'
    },
    {
      title: '定时任务',
      body: '通过定时触发函数执行周期性任务与后台处理。',
      nodes: ['定时触发', '函数', '输出'],
      cta: '了解函数配置',
      page: 'reference',
      hash: 'functions'
    }
  ],
  trustTitle: '开源开放，\n由你掌控。',
  trustLead: '查看源代码，在 Git 中管理配置，将资源部署到自己的云账号。',
  trustLink: '在 GitHub 上了解项目',
  trustLicense: 'Apache-2.0 开源协议',
  faqTitle: '你可能还想\n了解这些。',
  faqLead: '更多细节，尽在文档。',
  faqLink: '查看文档',
  faqs: [
    {
      question: '开源 CLI 与平台套餐是什么关系？',
      answer:
        'CLI 基于 Apache-2.0 协议开源。Developer、Team 和 Enterprise 套餐提供平台能力与托管资源额度，具体内容请查看定价页。云资源的使用费用由云厂商另外收取。'
    },
    {
      question: '套餐价格包含云资源费用吗？',
      answer:
        '不包含。ServerlessInsight 按平台与托管资源用量计费。函数、数据库、对象存储等云服务，由你的云厂商独立计费。'
    },
    {
      question: '应用运行在哪里？',
      answer: '应用资源部署在你配置的云账号与地域。ServerlessInsight 负责资源声明与部署工作流。'
    },
    {
      question: '每个云厂商的功能都一样吗？',
      answer: '各云厂商支持的资源类型与命令有所不同。选择部署目标前，请查看配置手册中的支持矩阵。'
    },
    {
      question: '能接入现有的 CI/CD 流水线吗？',
      answer: '可以。配置好云凭据、应用配置与环境参数后，即可在已有流水线中运行 CLI，无需使用特定的 CI/CD 厂商。'
    },
    {
      question: '可以先个人使用，之后再升级团队套餐吗？',
      answer:
        '可以。先使用 Developer 额度；需要更多成员、工作区、资源额度或自动部署时，再选择 Team。完整额度与计费规则请查看定价页。'
    }
  ]
}
// The localized getting-started document has its own translated heading anchor.
export const ZH_API_ANCHOR = '给函数接一个-http-入口'
