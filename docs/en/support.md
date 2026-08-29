# Support

ServerlessInsight offers multiple support channels to help you solve problems you encounter during use.

## Support Channels

### Community Support (Free)

We encourage users to get help and share experiences through community channels:

#### GitHub Issues
- **Purpose**: Report bugs, request features
- **Link**: [github.com/geek-fun/serverlessinsight/issues](https://github.com/geek-fun/serverlessinsight/issues)
- **Response time**: 1-3 business days
- **Language**: English / Chinese

#### GitHub Discussions
- **Purpose**: Ask questions, discuss best practices
- **Link**: [github.com/geek-fun/serverlessinsight/discussions](https://github.com/geek-fun/serverlessinsight/discussions)
- **Response time**: 1-5 business days
- **Language**: English / Chinese

#### Social Media
- **Twitter**: [@Blankll31075](https://x.com/Blankll31075)
  - Latest updates and announcements
  - Response time: 1-2 business days

- **YouTube**: [GeekFun Club](https://www.youtube.com/@geekfun-club)
  - Tutorial videos
  - Product demos
  - Best practice sharing

#### Email Support
- **Email**: support@geekfun.club
- **Purpose**: General inquiries, partnership discussions
- **Response time**: 2-5 business days

### Commercial Support (Paid)

We offer professional support services for enterprise users:

#### Standard Support
- **Hours**: Business days 9:00-18:00 (Beijing time)
- **Response time**:
  - Critical issues: 4 hours
  - General issues: 24 hours
- **Includes**:
  - Priority technical support
  - Remote issue diagnosis
  - Configuration optimization advice
  - Regular health checks

#### Advanced Support
- **Hours**: 24/7
- **Response time**:
  - Critical issues: 1 hour
  - General issues: 8 hours
- **Includes**:
  - Everything in Standard Support
  - Dedicated support engineer
  - Emergency on-site support (optional)
  - Customized training
  - Architecture review and optimization

#### Enterprise Support
- **Hours**: 24/7
- **Response time**:
  - Critical issues: 30 minutes
  - General issues: 4 hours
- **Includes**:
  - Everything in Advanced Support
  - Dedicated customer success manager
  - Regular on-site technical support
  - Custom development and integration
  - SLA guarantees

## Support Scope

### What We Cover

✅ **ServerlessInsight Product**
- Installation and configuration
- Feature usage guidance
- Bug reporting and fixes
- Best practice guidance
- Performance optimization advice

✅ **Integration Support**
- CI/CD integration
- Cloud provider service integration
- Third-party tool integration

✅ **Architecture Consulting**
- Serverless architecture design
- Cost optimization
- High availability solutions
- Security configuration guidance

### What We Don't Cover

❌ **Cloud Provider Platform Issues**
- Cloud provider API failures
- Cloud platform configuration problems
- Cloud provider billing issues

❌ **Custom Code Issues**
- Business logic errors
- Custom code debugging
- Third-party library issues

❌ **Unofficial Versions**
- Modified versions of ServerlessInsight
- Outdated CLI versions (use latest version recommended)

## Issue Severity

To handle your issues efficiently, we classify them as follows:

### P0 - Critical
**Definition**: System completely unavailable, core functionality broken

**Examples**:
- Cannot deploy any resources
- All functions fail to execute
- Data loss or corruption

**Response time**:
- Commercial support: 30 minutes - 4 hours
- Community support: Best effort

### P1 - High
**Definition**: Major functionality affected, with workaround available

**Examples**:
- Partial resource deployment failures
- Severe performance degradation
- Important feature unavailable

**Response time**:
- Commercial support: 1-8 hours
- Community support: 1-3 business days

### P2 - Medium
**Definition**: Functionality partially affected, core business not impacted

**Examples**:
- Non-core feature anomalies
- Configuration issues
- Usage questions

**Response time**:
- Commercial support: 8-24 hours
- Community support: 2-5 business days

### P3 - Low
**Definition**: Minor issues, no usage impact

**Examples**:
- Documentation errors
- Display issues
- Feature suggestions

**Response time**:
- Commercial support: 24-72 hours
- Community support: 5-10 business days

## Best Practices for Getting Help

### 1. Before Asking

Prepare the following information:

**Basic Info**:
- ServerlessInsight CLI version (`si --version`)
- Node.js version (`node --version`)
- Operating system and version
- Cloud provider and region

**Problem Description**:
- Clear description of the problem
- Expected vs actual behavior
- Frequency of occurrence
- Recent configuration changes

**Reproduction Steps**:
- Detailed reproduction steps
- Relevant configuration (redact sensitive info)
- Error logs (enable with `SI_DEBUG=true`)

### 2. Providing Logs

Enable debug mode for detailed logs:

```bash
# Set environment variable
export SI_DEBUG=true

# Or use command-line flag
si deploy --stage dev --debug
```

### 3. Protecting Sensitive Info

When sharing configuration and logs:

- ❌ Never share AccessKey/SecretKey
- ❌ Never share passwords or tokens
- ❌ Never share personal private information
- ✅ Use placeholders for sensitive values
- ✅ Use `.env` files to manage secrets

### 4. Effective Communication

**Good question example**:

> Title: Function creation fails when deploying to cn-hangzhou
>
> Environment:
> - ServerlessInsight CLI: 0.7.9
> - Node.js: 18.16.0
> - Cloud provider: Alibaba Cloud cn-hangzhou
>
> Problem:
> Running `si deploy --stage dev` fails with "Insufficient permissions" when creating functions
>
> Tried:
> 1. Confirmed RAM user has AliyunFCFullAccess permission
> 2. Verified AccessKey is correct
> 3. Recreated stack, same issue
>
> Config snippet:
> ```yaml
> provider:
>   name: aliyun
>   region: cn-hangzhou
> functions:
>   my_fn:
>     name: my-fn
>     code:
>       runtime: nodejs18
>       handler: index.handler
>       path: artifacts/my-fn.zip
> ```
>
> Error log: [attached full log]

## Training Services

We offer training courses for different roles:

### Developer Training
- **Duration**: 1-2 days
- **Content**:
  - ServerlessInsight basics
  - Local development and debugging
  - Function writing best practices
  - Hands-on exercises

### Operations Training
- **Duration**: 1 day
- **Content**:
  - Deployment and release processes
  - Monitoring and log management
  - Troubleshooting
  - Cost optimization

### Architect Training
- **Duration**: 2-3 days
- **Content**:
  - Serverless architecture design
  - High availability solutions
  - Security and compliance
  - Performance optimization

**Formats**: Live online, on-site, recorded videos

**Contact**: training@geekfun.club

## Consulting Services

We offer professional serverless architecture consulting:

### Services

1. **Architecture Assessment**
   - Current architecture analysis
   - Improvement recommendations
   - Cost-benefit analysis

2. **Migration Support**
   - Migrate from traditional architecture to serverless
   - Migrate from other serverless frameworks
   - Data migration planning

3. **Performance Optimization**
   - Bottleneck analysis
   - Optimization implementation
   - Results validation

4. **Security Audit**
   - Security configuration review
   - Vulnerability scanning
   - Hardening recommendations

### Consulting Process

1. **Requirements** - Understand your needs and goals
2. **Assessment** - Analyze current systems
3. **Design** - Create optimization plans
4. **Implementation** - Support deployment
5. **Validation** - Verify improvements
6. **Optimization** - Continuous iteration

**Contact**: consulting@geekfun.club

## Feedback

We value your feedback to improve the product:

### How to Submit

- **Feature requests**: [GitHub Discussions](https://github.com/geek-fun/serverlessinsight/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues)
- **Email feedback**: feedback@geekfun.club

### Process

1. **Receive** - We get your feedback
2. **Triage** - Assigned to appropriate team
3. **Evaluate** - Priority and feasibility assessment
4. **Schedule** - Added to development plan
5. **Implement** - Development and testing
6. **Respond** - We update you on the outcome

## Service Hours

### Community Support
- **Hours**: 24/7 (volunteer response times may vary)
- **Channels**: GitHub, Twitter, Email

### Commercial Support
- **Standard**: Business days 9:00-18:00 (Beijing time)
- **Advanced/Enterprise**: 24/7

### Holidays
- Chinese public holidays may have slower response
- Critical issues (P0) are not affected by holidays

## Contact Us

| Department | Email | Purpose |
|------------|-------|---------|
| Technical Support | support@geekfun.club | General technical inquiries |
| Sales | sales@geekfun.club | Commercial support and training |
| Training | training@geekfun.club | Course registration |
| Consulting | consulting@geekfun.club | Architecture consulting |
| Product Feedback | feedback@geekfun.club | Suggestions and feedback |
| Partnerships | partnership@geekfun.club | Business partnerships |

## Service Level Agreement (SLA)

For commercial support customers, we provide the following SLA commitments:

### Availability

| Support Level | Availability | Service Credit |
|--------------|-------------|----------------|
| Standard | 99% | 10% credit if not met |
| Advanced | 99.5% | 25% credit if not met |
| Enterprise | 99.9% | 50% credit if not met |

### Response Time

| Severity | Standard | Advanced | Enterprise |
|----------|----------|----------|------------|
| P0 | 4 hours | 1 hour | 30 minutes |
| P1 | 24 hours | 8 hours | 4 hours |
| P2 | 72 hours | 24 hours | 8 hours |
| P3 | 5 business days | 72 hours | 24 hours |

### Escalation

If an issue isn't resolved within the committed time, it's automatically escalated:

1. **L1 Support** - Technical support engineer
2. **L2 Support** - Senior engineer / technical expert
3. **L3 Support** - Product manager / engineering team
4. **Management** - Customer success manager / director

---

**Last updated**: 2024-12

We are committed to providing the best support experience. Contact us anytime!
