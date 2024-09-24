# ServerlessInsight 介绍

## 什么是ServerlessInsight

![ServerlessInsight 组件](/si.drawio.png)

ServerlessInsight是一个全栈Serverless应用平台，它可以帮助您构建全生命周期的跨供应商Serverless用程序管理，助力快速发展的业务。ServerlessInsight的目标在于屏蔽底层Serverless供应商的差异,结合cloud
native和serverless的业内最佳实践，以其为础设计出一套全栈serverless系统开发框架，帮助您快速构建Serverless应用，提升开发效率，降低运维成本。

## 为什么选择ServerlessInsight

ServerlessInsight聚焦于赋能全生命周期的全Serverless应用管理，通过基础设施即代码(Infrastructure As Code)
提供了一站式的Serverless应用开发、部署、运维、监控、调优等功能，帮助您快速构建Serverless应用，提升开发效率，降低运维成本。我们从一下几个方面来看看ServerlessInsight的优势：

### 基础设施即代码

通过ServerlessInsight，开发者只需要在`serverlessinsight.yml`
中定义Serverless应用的资源，ServerlessInsight会自动根据定义的资源生成对应的Serverless应用代码，无需开发者手动申请或创建资源，提升开发效率。

### 全生命周期管理

ServerlessInsight提供了全生命周期的Serverless应用管理，包括开发、部署、监控、调优等功能，帮助您快速构建Serverless应用，提升开发效率，降低运维成本。

**开发:** ServerlessInsight提供了本地开发功能，支持本地启动所有定义的Serverless应用，开发人员无需配置任何本地资源&环境，一行命令即即可在本地启动所有定义在
`serverlessinsight.yml`中的资源，开发环境与线上环境无缝连接， 方便开发人员在本地调试Serverless应用。

**部署:** ServerlessInsight提供了一键部署功能，支持一键部署所有定义的Serverless应用，无需手动配置任何资源，一行命令即可将所有定义在
`serverlessinsight.yml`中的资源部署到指定的Serverless供应商中。

**监控(开发中):** ServerlessInsight提供了丰富的监控功能，支持监控Serverless应用的性能、稳定性、可用性等指标，帮助您及时发现问题，提升用户体验。

### 跨供应商

ServerlessInsight支持多个Serverless供应商，包括阿里云、华为云、腾讯云等，帮助您更好的选择Serverless供应商，降低供应商锁定风险。

### 开放生态

ServerlessInsight提供了丰富且通用的cli，无任何对特定CI/CD工具的依赖，方便您快速集成到现有的开发工具链中，提升开发效率。

## ServerlessInsight架构于原理

ServerlessInsight依托云厂商提供的Serverless服务和基础设施即代码(Infrastructure As Code)
服务，屏蔽底层细节，构建高层抽象，结合业内最佳实践，提出ServerlessInsight的全栈serverless开发实践，使用ServerlessInsight并依托其开发实践，让开发者无需关心底层Serverless供应商的差异，复杂的serverless运维等细节，只需专注于业务逻辑的开发，并按需申明资源即可，简单高效。
![ServerlessInsight架构于原理图](/si-archtecture.drawio.png)

## ServerlessInsight适用场景

ServerlessInsight全生命周期赋能Serverless应用，任何基于Serverless架构的应用都可以使用ServerlessInsight来提升开发效率，降低运维负载，Serverless架构适用于以下场景：

1. **事件驱动的应用程序**  
   Serverless适合处理事件驱动的场景，如用户请求、文件上传、数据库操作等。每个事件都会触发相应的函数进行处理。这种架构可以在高峰期动态扩展，处理不确定的流量。

2. **不定期的流量**  
   如果应用的流量波动较大，传统的服务器可能在流量低时浪费资源，而Serverless可以根据实际需求自动缩放，按实际使用付费，因此在不定期流量场景下非常适合，比如营销活动、社交媒体热点等。

3. **快速开发与迭代**  
   Serverless让开发者无需担心服务器的维护和管理，专注于业务逻辑，适合需要快速开发、部署并频繁更新的应用场景，如初创项目或实验性产品。

4. **批处理和任务队列**  
   Serverless非常适合处理周期性的批处理任务或后台的任务队列，比如定时生成报告、数据处理、日志分析等。这类任务通常是事件触发的，利用Serverless的按需运行特性，避免了持续运行服务器的成本。

5. **微服务架构**  
   在微服务架构中，应用被拆分成多个独立的服务，Serverless可以轻松支持这种架构。每个服务可以根据其自身的资源需求动态扩展，减少资源浪费。

6. **API后端服务**  
   Serverless架构可以轻松构建RESTful API或GraphQL API。它与API Gateway等服务结合，能够根据请求流量进行自动扩展，并减少维护成本。

7. **物联网（IoT）应用**  
   IoT设备通常会发送大量小型请求，Serverless可以处理这些请求，动态扩展并处理高并发，是物联网场景中的理想选择。

8. **实时数据处理**  
   适用于需要处理大量实时数据流的场景，例如实时监控、日志处理、数据分析、点击流分析等。Serverless可以根据数据流量自动扩展处理能力。

