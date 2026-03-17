# Documentation

Welcome to the ServerlessInsight documentation center. Here you'll find comprehensive guides and references for using ServerlessInsight.

## Getting Started

New to ServerlessInsight? Start here:

- **[Quick Start](/en/getting-started)** - Build your first serverless application in 5 minutes
- **[Introduction](/introduction)** - Learn about core concepts and capabilities
- **[Configuration Guide](/reference)** - Detailed YAML configuration reference
- **[CLI Reference](/cli)** - Command-line tool documentation

## Core Concepts

### Infrastructure as Code

Define your serverless resources declaratively in `serverlessinsight.yml`. ServerlessInsight handles resource creation and management automatically.

```yaml
version: 0.1.0
provider:
  name: aliyun
  region: cn-hangzhou

app: my-app
service: my-service

functions:
  my_function:
    runtime: nodejs18
    handler: index.handler
    code: artifacts/function.zip

events:
  api_gateway:
    type: API_GATEWAY
    triggers:
      - method: GET
        path: /api/*
        backend: my_function
```

### Multi-Environment Support

Manage different environments (dev/test/prod) using stages:

```yaml
stages:
  dev:
    region: cn-hangzhou
    memory: 512
  prod:
    region: cn-beijing
    memory: 2048
```

```bash
# Deploy to development
si deploy --stage dev

# Deploy to production
si deploy --stage prod
```

### Resource Types

ServerlessInsight supports various cloud resource types:

- **Functions** - Serverless compute (Function Compute)
- **Events** - Triggers (API Gateway, SQS, Timer, etc.)
- **Databases** - Database resources (RDS, Elasticsearch, etc.)
- **Tables** - NoSQL databases (Table Store, DynamoDB, etc.)
- **Buckets** - Object storage (OSS, S3, etc.)

## Supported Cloud Providers

### Currently Supported

- ✅ **Alibaba Cloud** - Full support for FC, API Gateway, RDS, OSS, etc.
- 🚧 **Huawei Cloud** - In development
- 🚧 **Tencent Cloud** - In development

### Planned

- AWS Lambda & API Gateway
- Google Cloud Functions
- Azure Functions

## Command Line Interface

### Installation

```bash
npm install -g @geek-fun/serverlessinsight
```

### Basic Commands

```bash
# Validate configuration
si validate

# Deploy application
si deploy --stage dev

# Run locally
si local --stage dev

# Destroy resources
si destroy --stage dev
```

## Learning Resources

### Tutorials

- [Building a REST API](/getting-started) - Create a RESTful API with ServerlessInsight
- [Database Integration](/reference#databases) - Connect your functions to databases
- [Static Website Hosting](/reference#buckets) - Host static websites on object storage

### Best Practices

- **Environment Isolation** - Use stages to separate environments
- **Variable Reuse** - Extract common configurations to `vars`
- **Resource Naming** - Use meaningful names with environment info
- **Tag Management** - Add tags for better resource management
- **Security** - Use environment variables for sensitive information

### Reference

- **[Configuration Specification](/reference)** - Complete YAML specification
- **[CLI Commands](/cli)** - All supported CLI commands and options
- **[Case Studies](/case-study)** - Real-world implementation examples

## Getting Help

- **[FAQ](/faq)** - Frequently asked questions
- **[GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues)** - Report bugs and request features
- **[Twitter](https://x.com/Blankll31075)** - Follow for updates and announcements
- **[Email](mailto:support@geekfun.club)** - Contact us directly

## Contributing

We welcome contributions from the community:

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit code changes

Please see our [Contributing Guide](/CONTRIBUTING) for more information.

## Community

Join the ServerlessInsight community:

- **GitHub**: [geek-fun/serverlessinsight](https://github.com/geek-fun/serverlessinsight)
- **Twitter**: [@Blankll31075](https://x.com/Blankll31075)
- **YouTube**: [GeekFun Club](https://www.youtube.com/@geekfun-club)

---

Made with ❤️ by [GeekFun](https://geekfun.club)
