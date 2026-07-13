# Frequently Asked Questions (FAQ)

Common questions and answers about working with ServerlessInsight.

## Table of Contents

- [Installation & Configuration](#installation--configuration)
- [Deployment](#deployment)
- [Local Development](#local-development)
- [Resource Management](#resource-management)
- [Security & Permissions](#security--permissions)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Other Questions](#other-questions)

---

## Installation & Configuration

### Q: The CLI installation fails. What should I do?

**A:** Try these steps:

1. **Check your Node.js version**
   ```bash
   node --version
   # Requires >= 18.x
   ```

2. **Clear the npm cache**
   ```bash
   npm cache clean --force
   ```

3. **Use a mirror registry** (useful if you're behind a corporate firewall or in a region with slow npm access)
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install -g @geek-fun/serverlessinsight
   ```

4. **Verify network connectivity**
   ```bash
   ping registry.npmjs.org
   ```

### Q: How do I upgrade the CLI?

**A:** Run the update command:

```bash
npm update -g @geek-fun/serverlessinsight
```

Or force a fresh install of the latest version:

```bash
npm install -g @geek-fun/serverlessinsight@latest
```

### Q: Where should the configuration file go?

**A:** By default, ServerlessInsight looks for `serverlessinsight.yml` in the current working directory. You can also:

- Pass `-f` to specify a different path
- Set the `SI_CONFIG_FILE` environment variable

```bash
# Specify a config file
si deploy -f config/prod.yml

# Use an environment variable
export SI_CONFIG_FILE="config/prod.yml"
si deploy
```

### Q: How do I manage configurations across multiple projects?

**A:** A few approaches:

1. **Per-environment config files**
   ```
   project/
   ├── serverlessinsight.dev.yml
   ├── serverlessinsight.prod.yml
   └── ...
   ```

2. **Git submodules or package manager workspaces** for shared configs
3. **Environment variables** to differentiate projects

---

## Deployment

### Q: I get a "permission denied" error during deployment.

**A:** This usually means your cloud provider credentials are misconfigured or lack the required permissions:

1. **Check your environment variables**
   ```bash
   echo $ALIYUN_ACCESS_KEY_ID
   echo $ALIYUN_ACCESS_KEY_SECRET
   ```

2. **Verify IAM/RAM user permissions**
   Make sure the user has the right policies attached. For Aliyun, common ones include:
   - `AliyunFCFullAccess` — full access to Function Compute
   - `AliyunAPIGatewayFullAccess` — full access to API Gateway
   - Any other policies for services you're using

3. **Use temporary credentials if available**
   ```bash
   export ALIYUN_SECURITY_TOKEN="your-temporary-token"
   ```

### Q: How do I recover after a failed deployment?

**A:** ServerlessInsight preserves any resources that deployed successfully before the failure. To recover:

1. **Fix the issue** in your config or code
2. **Re-deploy** — ServerlessInsight picks up where it left off and continues deploying the remaining resources

If you need to start fresh instead:

1. **Roll back your config with Git**
   ```bash
   git checkout HEAD~1 serverlessinsight.yml
   si deploy --stage dev
   ```

2. **Or destroy everything and redeploy**
   ```bash
   si destroy --stage dev
   ```

### Q: How do I deploy to a different region?

**A:** Two options:

1. **Define multiple stages in your config**
   ```yaml
   stages:
     hangzhou:
       region: cn-hangzhou
     beijing:
       region: cn-beijing
   ```
   Then deploy with:
   ```bash
   si deploy --stage hangzhou
   si deploy --stage beijing
   ```

2. **Override from the command line**
   ```bash
   si deploy --region cn-beijing
   ```

### Q: Deployment is taking forever. What can I do?

**A:** Common causes and fixes:

1. **Large code bundle** — trim unnecessary dependencies and use multi-stage builds to reduce package size
2. **Slow network** — check your connection, or use a network closer to the target region
3. **Slow resource creation** — some resources (databases, search services) take time to provision. Check the cloud provider's console to confirm progress

### Q: Can I deploy multiple services at once?

**A:** Not directly, but you can script it:

```bash
#!/bin/bash
si deploy --stage dev service-a
si deploy --stage dev service-b
si deploy --stage dev service-c
```

---

## Local Development

### Q: The local server says the port is already in use.

**A:** Use a different port:

```bash
si local --stage dev --port 8080
```

Or find and stop the process using the default port:

```bash
lsof -i :3000
kill -9 <PID>
```

### Q: How do I debug locally?

**A:** Start with debug mode enabled:

```bash
si local --stage dev --debug
```

Then attach your IDE's debugger. For VS Code, add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to ServerlessInsight",
  "port": 9229,
  "restart": true
}
```

You can also add a `debugger` statement in your handler:

```typescript
export async function handler(event: any) {
  debugger; // breakpoint
  // your code
}
```

### Q: File watching isn't working.

**A:** Try these:

1. **Enable watch mode explicitly**
   ```bash
   si local --stage dev --watch
   ```

2. **Make sure you're editing files in the right directory** — only changes under `src/` are picked up. Re-package if needed: `./scripts/package.sh`

3. **Restart the local environment**
   ```bash
   # Ctrl+C to stop, then
   si local --stage dev
   ```

### Q: Local behavior doesn't match production.

**A:** A few things to check:

1. **Environment variables** — make sure the same vars are set locally. Use a `.env` file to keep things consistent
2. **Dependency versions** — verify `package.json` matches what's deployed. Use `package-lock.json` to lock versions
3. **Stage config** — confirm you're using the same stage for local dev and deployment

---

## Resource Management

### Q: How do I see what resources are deployed?

**A:** A few ways:

1. **Cloud provider console** — log in and look up resources by stack name
2. **Resource tags** — filter by the tags defined in your config, like `owner=geek-fun`
3. **Provider CLI**
   ```bash
   # Aliyun example
   aliyun fc list services
   aliyun apigateway DescribeApis
   ```

### Q: How do I update a deployed function's code?

**A:** Repackage and redeploy:

```bash
# After making code changes
./scripts/package.sh
si deploy --stage dev
```

ServerlessInsight detects code changes and updates the function accordingly.

### Q: Can I delete a single resource without tearing down the whole stack?

**A:** Not directly. The recommended approach:

1. **Remove the resource from your config file**
2. **Redeploy** — ServerlessInsight deletes resources that are no longer in the config
3. **Or delete manually** through the cloud provider's console

⚠️ Always double-check what you're removing before redeploying.

### Q: I've hit the resource limit for my cloud account.

**A:** Cloud providers cap how many of each resource type you can create:

1. **Clean up unused resources**
   ```bash
   si destroy --stage dev old-stack
   ```

2. **Request a quota increase** from your cloud provider — explain your use case and expected usage

3. **Optimize resource usage** — merge similar functions, right-size allocations

---

## Security & Permissions

### Q: How do I manage secrets and sensitive config values?

**A:** Best practices:

1. **Use environment variables**
   ```bash
   export DB_PASSWORD="your-password"
   ```

2. **Reference them in your config**
   ```yaml
   functions:
     my_function:
       environment:
         DB_PASSWORD: ${vars.db_password}
   ```

3. **Use a secrets manager** — cloud KMS, AWS Secrets Manager, HashiCorp Vault, etc.

4. **Never commit secrets to Git**
   ```bash
   # .gitignore
   .env
   *.key
   *.pem
   ```

### Q: How do I configure VPC and security groups?

**A:** Add network settings to your function config:

```yaml
functions:
  my_function:
    network:
      vpc_id: vpc-my-vpc
      subnet_ids:
        - vsw-subnet1
      security_group:
        name: my-sg
        ingress:
          - TCP:0.0.0.0/0:443
        egress:
          - ALL:0.0.0.0/0:ALL
```

### Q: How do I enable function logging?

**A:** Set `log: true` in your function config:

```yaml
functions:
  my_function:
    log: true
```

⚠️ Note: On Aliyun, SLS log stores take a minute or two to provision. If it's your first deploy, leave logging off, wait a couple of minutes, then redeploy with logging enabled.

---

## Troubleshooting

### Q: How do I get more detailed logs?

**A:** Enable debug mode:

```bash
# As a flag
si deploy --stage dev --debug

# Or as an environment variable
export SI_DEBUG=true
si deploy --stage dev
```

### Q: Deployment is stuck and not progressing.

**A:** Possible causes:

1. **Network timeout** — check your connection and try again
2. **Cloud API rate limiting** — wait a few minutes and retry, or request a higher limit from your provider
3. **Resource still provisioning** — some resources (databases, search services) take time. Check the cloud provider's console to confirm what's happening

### Q: My function times out during execution.

**A:** Try these:

1. **Increase the timeout**
   ```yaml
   functions:
     my_function:
       timeout: 60  # seconds
   ```

2. **Optimize performance** — cut unnecessary computation, use async processing, optimize database queries

3. **Split the function** — break a large function into smaller ones and chain them together

### Q: I'm getting memory errors.

**A:**

1. **Allocate more memory**
   ```yaml
   functions:
     my_function:
       memory: 1024  # MB
   ```

2. **Optimize your code** — reduce memory usage, use streaming for large data, release resources when done

---

## Best Practices

### Q: How should I organize configs for a large project?

**A:** A clean structure looks like this:

```
project/
├── serverlessinsight.yml          # main config
├── serverlessinsight.dev.yml      # dev overrides
├── serverlessinsight.prod.yml     # prod overrides
├── functions/
│   ├── user-service/
│   ├── order-service/
│   └── ...
└── scripts/
    └── deploy-all.sh
```

### Q: How do I manage multiple environments?

**A:** Use `stages` in your config:

```yaml
stages:
  dev:
    region: cn-hangzhou
    memory: 512
    debug: true
  test:
    region: cn-shanghai
    memory: 1024
    debug: false
  prod:
    region: cn-beijing
    memory: 2048
    debug: false
```

Deploy to a specific environment with `si deploy --stage dev`.

### Q: How do I keep serverless costs down?

**A:**

1. **Right-size your functions** — don't over-provision memory or timeout values
2. **Consider provisioned instances** for long-running workloads — they're often cheaper than pay-per-use
3. **Monitor spending** — use your cloud provider's cost analysis tools to find expensive functions
4. **Optimize code** — shorter cold starts and faster execution mean less billed compute time

### Q: How do I ensure high availability?

**A:**

1. **Deploy across multiple regions**
   ```yaml
   stages:
     hangzhou:
       region: cn-hangzhou
     shanghai:
       region: cn-shanghai
   ```

2. **Set up health checks** on your functions and endpoints
3. **Use load balancing** to distribute traffic
4. **Implement failover** so traffic reroutes if one region goes down

---

## Other Questions

### Q: Is ServerlessInsight free?

**A:** Yes. ServerlessInsight is open source under the Apache 2.0 license. Free to use, free to modify.

### Q: How do I contribute or report a bug?

**A:**

- **Report a bug** — [GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues)
- **Submit code** — [GitHub Pull Requests](https://github.com/geek-fun/serverlessinsight/pulls)
- **Email support** — support@geekfun.club

### Q: Is there a community?

**A:**

- **GitHub Discussions** — [discussions](https://github.com/geek-fun/serverlessinsight/discussions)
- **Twitter** — [@Blankll31075](https://x.com/Blankll31075)
- **YouTube** — [GeekFun Club](https://www.youtube.com/@geekfun-club)

### Q: How do I get technical support?

**A:**

1. **Community support** (free)
   - GitHub Issues
   - GitHub Discussions

2. **Commercial support**
   - Email: support@geekfun.club
   - Custom development and consulting available

---

## Didn't find your answer?

If this page doesn't cover your question:

1. Search [GitHub Issues](https://github.com/geek-fun/serverlessinsight/issues) for similar problems
2. Ask on [GitHub Discussions](https://github.com/geek-fun/serverlessinsight/discussions)
3. Email support@geekfun.club

This document is continuously updated. Contributions of questions and answers are welcome.
