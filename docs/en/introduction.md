# Introduction to ServerlessInsight

## What is ServerlessInsight

![ServerlessInsight Components](/si.drawio.png)

ServerlessInsight is a full-stack serverless application platform that manages the entire lifecycle of serverless apps across multiple cloud providers. By abstracting away cloud-specific differences and combining cloud-native best practices, it helps developers build, deploy, and optimize serverless applications with less effort and lower operational overhead.

### Core Philosophy

ServerlessInsight is built around **Infrastructure as Code (IaC)**. You define your cloud resources declaratively in a single `serverlessinsight.yml` file, and ServerlessInsight handles the creation, configuration, and management of those resources automatically. This lets you focus on business logic instead of infrastructure plumbing.

## Why ServerlessInsight

### 🏗️ Infrastructure as Code

All your serverless resources live in a `serverlessinsight.yml` configuration file. ServerlessInsight reads it and provisions the corresponding cloud resources. No manual console work needed.

**Benefits:**
- **Version control** — track configuration changes in Git for collaboration and auditability
- **Repeatability** — deploy the same configuration to different environments with consistent results
- **Automation** — plug into CI/CD pipelines for fully automated deployments

### 🔄 Full Lifecycle Management

ServerlessInsight covers every phase from development to production:

#### Development
- **Local dev** — spin up a local environment with one command, no cloud credentials required
- **Hot reload** — file watch mode automatically reloads when code changes
- **Debugging** — built-in debug mode for troubleshooting
- **Environment parity** — local setup mirrors your production environment

#### Deployment
- **One-command deploy** — provision all defined resources with `si deploy`
- **Multi-environment support** — manage dev/test/prod through stages
- **Parameter overrides** — override defaults from the command line
- **Rollback** — quickly revert to a previous configuration

#### Monitoring (in progress)
- **Performance monitoring** — real-time function execution metrics
- **Log aggregation** — centralized application log management
- **Alerts** — proactive notifications on anomalies

#### Optimization
- **Cost analysis** — understand resource usage and find savings
- **Performance tuning** — actionable recommendations for faster functions
- **Capacity planning** — scale based on traffic forecasts

### ☁️ Multi-Cloud Support

ServerlessInsight works across major cloud providers so you can pick what fits:

**Supported (deployable):**
- ✅ **Aliyun (Alibaba Cloud)** — FC3, API Gateway, OSS, RDS, TableStore, ES Serverless, CDN, DNS
- ✅ **Tencent Cloud** — SCF, COS, ES Serverless, TDSQL-C (no standalone API Gateway resource; uses function HTTP triggers)
- ✅ **Volcengine** — veFaaS, API Gateway, TOS (databases and tables not yet supported)

**Planned / not deployable yet:**
- 🚧 **Huawei Cloud** — only generates HCL/Terraform templates; `deploy` not supported
- AWS Lambda & API Gateway (enum only)
- GCP, Azure

A unified configuration syntax means you can switch between providers without rewriting your application. Less vendor lock-in, more flexibility.

### 🔧 Open Ecosystem

ServerlessInsight is open source and community-driven:

- **Apache 2.0 license** — free to use and modify
- **Universal CLI** — no dependency on any specific CI/CD tool
- **Easy integration** — fit it into your existing toolchain quickly
- **Community contributions** — issues, PRs, and ideas welcome

## Architecture

![ServerlessInsight Architecture](/si-archtecture.drawio.png)

ServerlessInsight sits on top of cloud providers' serverless services and IaC capabilities. The architecture has five layers:

1. **Config Layer** — `serverlessinsight.yml` defines the resources your app needs
2. **Parse Layer** — reads the config and builds a resource dependency graph
3. **Adapt Layer** — translates your config into provider-specific API calls
4. **Execute Layer** — calls cloud provider APIs to create and manage resources
5. **Runtime Layer** — provides local development environment and debugging tools

This layered design means you never have to worry about provider-specific APIs or operational details. Just define what you need and focus on code.

## Use Cases

ServerlessInsight works well for:

### 1. Event-Driven Applications
Handle user requests, file uploads, database changes, and other events. Each event triggers a function that scales independently during traffic spikes.

### 2. Variable Traffic Workloads
Traditional servers waste resources during quiet periods. Serverless scales with actual demand and charges per use. Great for marketing campaigns, product launches, and viral social content.

### 3. Rapid Development and Iteration
Skip server management and concentrate on features. Ideal for startups, prototypes, and apps that need frequent updates.

### 4. Batch Processing and Task Queues
Run scheduled jobs like report generation, data pipelines, and log analysis. Pay only for the compute time you use.

### 5. Microservices
Split your app into independent services, each scaling on its own. Reduce waste and improve fault isolation.

### 6. API Backends
Build RESTful or GraphQL APIs that scale automatically with traffic. Combine with API Gateway for routing and rate limiting.

### 7. IoT Applications
Process large volumes of small requests from IoT devices with automatic scaling and high concurrency.

### 8. Real-Time Data Processing
Handle streaming data for monitoring, analytics, and clickstream analysis.

## Next Steps

Ready to get started? Head to the [Getting Started](/getting-started) guide and build your first serverless app in five minutes.

## Resources

- [Configuration Model](/en/concepts) — detailed YAML config docs
- [CLI Reference](/cli) — command line tool reference
- [Case Studies](/case-study) — real-world usage examples
- [FAQ](/faq) — frequently asked questions
