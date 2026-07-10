# CLI Reference

This document covers all ServerlessInsight CLI commands and their usage.

## Getting Help

Use `-h` or `--help` to view command help:

```bash
# View all commands
si -h

# View help for a specific command
si deploy -h
```

## Command Overview

| Command | Description |
|---------|-------------|
| [`validate`](#validate---validate-configuration) | Validate configuration file |
| [`plan`](#plan---generate-deployment-plan) | Generate deployment plan (preview changes) |
| [`deploy`](#deploy---deploy-serverless-application) | Deploy a Serverless application |
| [`destroy`](#destroy---destroy-serverless-application) | Destroy a Serverless application and its resources |
| [`show`](#show---view-deployed-resource-information) | View deployed resource information |
| [`local`](#local---run-serverless-application-locally) | Run a Serverless application locally |
| [`forceUnlock`](#forceunlock---force-release-lock) | Force release a stuck deployment lock |

## validate - Validate Configuration

The `validate` command checks whether `serverlessinsight.yml` is syntactically valid and all resource definitions are correct.

### Usage

```bash
si validate [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |

### Examples

```bash
# Use default config file
si validate

# Specify a config file
si validate -f path/to/config.yml
```

### Output

**Validation success:**

![validate success](/cli-validate-success.png)

```
✓ Configuration file is valid
✓ All resources are properly defined
✓ No errors found
```

**Validation failure:**

```
✗ Configuration file is invalid
Error: functions.hello_world_fn.memory must be an integer
```

## plan - Generate Deployment Plan

The `plan` command generates a deployment plan, previewing resources that will be created, updated, or deleted. This lets you review changes before deploying.

### Usage

```bash
si plan [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stage` | `-s` | Target stage | `default` |
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |

### Examples

```bash
# Preview changes for the dev stage
si plan --stage dev

# Specify config file and stage
si plan -f config/prod.yml -s prod
```

### Output

```bash
Planning deployment for stage dev...

Resources to create:
  + function: hello-world-fn
  + api_gateway: my-api-gateway

Resources to update:
  ~ function: api-handler (code changed)

Resources to delete:
  - function: old-function

Plan: 2 to create, 1 to update, 1 to delete
```

## deploy - Deploy Serverless Application

The `deploy` command deploys your Serverless application to the specified cloud provider.

### Usage

```bash
si deploy [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stage` | `-s` | Deployment stage | `default` |
| `--parameter` | `-p` | Override variable values (format: `key=value`) | - |
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |
| `--region` | `-r` | Deployment region | `provider.region` from config |
| `--provider` | `-pr` | Cloud provider | `provider.name` from config |
| `--accessKeyId` | `-ak` | AccessKey ID | Environment variable (provider-specific) |
| `--accessKeySecret` | `-as` | AccessKey Secret | Environment variable (provider-specific) |
| `--securityToken` | `-at` | Security token | Environment variable (provider-specific) |

### Examples

```bash
# Deploy to default stage
si deploy

# Deploy to dev stage
si deploy --stage dev

# Deploy to prod with memory override
si deploy --stage prod -p memory_size=2048

# Specify config file and region
si deploy -f config/prod.yml -r cn-beijing

# Deploy with temporary security token
si deploy --stage prod \
  -ak $ACCESS_KEY_ID \
  -as $ACCESS_KEY_SECRET \
  -at $SECURITY_TOKEN
```

### Deployment Flow

1. **Validate configuration** - Check the config file for errors
2. **Create resource stack** - Create the resource stack on the cloud provider
3. **Deploy resources** - Create/update resources in dependency order
4. **Output results** - Display deployment results and resource access information

### Output

```bash
Deploying service hello-world-api to stage dev
Creating API Gateway: insight-poc-gateway...
Creating Function: hello-world-fn...
Deploying function code...
Configuring triggers...

✓ Service hello-world-api deployed successfully

API Endpoint: https://abc123.apigateway.cn-hangzhou.aliyuncs.com/api
Function ARN: fc.cn-hangzhou.aliyuncs.com/001234567890/hello-world-fn
```

## destroy - Destroy Serverless Application

The `destroy` command tears down a Serverless application and all its associated resources.

### Usage

```bash
si destroy [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stage` | `-s` | Target stage | `default` |
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |
| `--force` | - | Skip confirmation prompt | `false` |

### Examples

```bash
# Destroy dev environment resources
si destroy --stage dev

# Force destroy (no confirmation)
si destroy --stage dev --force

# Destroy using a specific config file
si destroy -f config/prod.yml
```

### ⚠️ Warning

> **Deleting the resource stack removes all declared resources, resulting in:**
> - Complete service outage
> - Loss of all stateful resource data
> - Irreversible deletion
>
> **Make sure you:**
> - Have backed up relevant data
> - Confirm you no longer need these resources
> - Have notified relevant stakeholders
>
> Before proceeding.

### Output

```bash
Destroying service hello-world-api to stage dev
Deleting API Gateway triggers...
Deleting Function: hello-world-fn...
Deleting API Gateway: insight-poc-gateway...
Deleting resource stack...

✓ Service hello-world-api destroyed successfully
```

## show - View Deployed Resource Information

The `show` command displays information about deployed resources, including resource IDs, status, and access endpoints.

### Usage

```bash
si show [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stage` | `-s` | Target stage | `default` |
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |

### Examples

```bash
# View dev environment deployment info
si show --stage dev

# Specify config file
si show -f config/prod.yml -s prod
```

### Output

```bash
Showing resources for stage dev...

Functions:
  hello-world-fn
    ARN: acs:fc:cn-hangzhou:123456789:functions/hello-world-fn
    Runtime: nodejs18
    Memory: 512MB
    Timeout: 10s

API Gateway:
  my-api-gateway
    ID: api-abc123
    Endpoint: https://abc123.apigateway.cn-hangzhou.aliyuncs.com
    Triggers: 2 routes configured
```

## local - Run Serverless Application Locally

The `local` command runs and debugs your Serverless application locally without deploying to the cloud.

### Usage

```bash
si local [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--stage` | `-s` | Runtime stage | `default` |
| `--debug` | `-d` | Enable debug mode | `false` |
| `--watch` | `-w` | Enable file watching (auto-reload on code changes) | `true` |
| `--port` | `-p` | Local service port | `3000` |
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |

### Examples

```bash
# Basic local run
si local --stage dev

# Enable debug mode
si local --stage dev --debug

# Enable file watching
si local --stage dev --watch

# Specify port
si local --stage dev --port 8080

# Combine options
si local --stage dev --debug --watch --port 8080
```

### Local Development Features

**Hot reload:**
- File watching mode detects code changes automatically
- Changed functions reload without manual restart
- No service restart needed

**Debug support:**
- Debug mode outputs detailed logs
- Supports breakpoint debugging (with IDE integration)
- Shows function execution time and resource consumption

**Local API Gateway:**
- Simulates API Gateway behavior
- Supports route configuration
- Handles request forwarding

### Output

```bash
Starting local development environment for stage dev
Loading configuration from serverlessinsight.yml
Starting API Gateway emulator on port 3000...
Loading function: hello-world-fn

✓ Local environment started successfully

Endpoints:
  GET  http://localhost:3000/api/*  → hello-world-fn
  POST http://localhost:3000/api/*  → hello-world-fn

Watching for file changes...
```

### Debug Mode Output

```bash
[DEBUG] Loading function code from artifacts/hello-world-api.zip
[DEBUG] Function loaded in 234ms
[DEBUG] Memory allocated: 512MB
[DEBUG] Timeout: 30s

[INFO] Request: GET /api/users
[DEBUG] Event: {"path":"/api/users","method":"GET",...}
[DEBUG] Function executed in 45ms
[DEBUG] Response: {"statusCode":200,"body":"..."}
```

## forceUnlock - Force Release Lock

The `forceUnlock` command forcibly releases a deployment lock. This is a dangerous operation and should only be used when a previous deployment was interrupted or stuck, leaving the lock file in place.

> ⚠️ **Warning**: Force unlocking while another deployment is actively running can cause state corruption. Only use this when you are certain no deployment is in progress.

### Usage

```bash
si forceUnlock <lockId> [options]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `lockId` | Yes | The lock ID to release (obtained from a stuck deployment's error message) |

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--file` | `-f` | Path to the configuration file | `serverlessinsight.yml` |
| `--stage` | `-s` | Target stage | `default` |
| `--region` | `-r` | Deployment region | `provider.region` from config |
| `--provider` | `-pr` | Cloud provider | `provider.name` from config |

### Examples

```bash
# Release a stuck lock
si forceUnlock lock-abc123def456

# Release with specific stage and region
si forceUnlock lock-abc123def456 --stage prod --region cn-hangzhou
```

## Partial Failure Recovery

ServerlessInsight supports partial failure recovery during deployments. If a deployment fails partway through:

1. Resources that were successfully deployed are preserved
2. Only the failed resources need to be retried
3. Fix the underlying issue (e.g., incorrect configuration, insufficient permissions)
4. Re-run `si deploy` with the same stage

ServerlessInsight detects the existing state and skips resources that are already deployed successfully, deploying only the missing or failed ones.

```bash
# If a deployment fails mid-way:
si deploy --stage dev
# ... error occurs during function deployment

# Fix the issue, then re-deploy:
si deploy --stage dev
# Successfully deploys only the failed resources
```

## Environment Variables

ServerlessInsight CLI supports configuration through environment variables:

### Cloud Provider Credentials

**Aliyun:**
```bash
export ALIYUN_ACCESS_KEY_ID="your-access-key-id"
export ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIYUN_REGION="cn-hangzhou"
export ALIYUN_SECURITY_TOKEN="your-security-token"  # Optional, for temporary credentials
```

Alternative variable names are also supported:
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

**Tencent Cloud:**
```bash
export TENCENTCLOUD_SECRET_ID="your-secret-id"
export TENCENTCLOUD_SECRET_KEY="your-secret-key"
export TENCENTCLOUD_SECURITY_TOKEN="your-security-token"  # Optional, for temporary credentials
```

**Volcengine:**
```bash
export VOLCENGINE_ACCESS_KEY_ID="your-access-key-id"
export VOLCENGINE_ACCESS_KEY_SECRET="your-access-key-secret"
export VOLCENGINE_SESSION_TOKEN="your-session-token"  # Optional, for temporary credentials
```

Alternative variable names:
```bash
export VOLCSTACK_ACCESS_KEY_ID="your-access-key-id"
export VOLCSTACK_SECRET_ACCESS_KEY="your-access-key-secret"
```

**Huawei Cloud:**
```bash
export HUAWEICLOUD_ACCESS_KEY="your-access-key"
export HUAWEICLOUD_SECRET_KEY="your-secret-key"
```

### CLI Configuration

```bash
# Default config file path
export SI_CONFIG_FILE="path/to/config.yml"

# Default stage
export SI_STAGE="dev"

# Verbose logging
export SI_DEBUG="true"
```

### Credentials Reference

| Provider | Access Key Env Var | Secret Key Env Var | Token (optional) |
|----------|-------------------|-------------------|-----------------|
| Aliyun | `ALIYUN_ACCESS_KEY_ID` / `ALIBABA_CLOUD_ACCESS_KEY_ID` | `ALIYUN_ACCESS_KEY_SECRET` / `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | `ALIYUN_SECURITY_TOKEN` |
| Tencent | `TENCENTCLOUD_SECRET_ID` | `TENCENTCLOUD_SECRET_KEY` | `TENCENTCLOUD_SECURITY_TOKEN` |
| Volcengine | `VOLCENGINE_ACCESS_KEY_ID` / `VOLCSTACK_ACCESS_KEY_ID` | `VOLCENGINE_ACCESS_KEY_SECRET` / `VOLCSTACK_SECRET_ACCESS_KEY` | `VOLCENGINE_SESSION_TOKEN` |
| Huawei | `HUAWEICLOUD_ACCESS_KEY` | `HUAWEICLOUD_SECRET_KEY` | — |

## Best Practices

### 1. Use .env Files for Credentials

Create a `.env` file (add to `.gitignore`):

```bash
ALIYUN_ACCESS_KEY_ID=your-key-id
ALIYUN_ACCESS_KEY_SECRET=your-key-secret
ALIYUN_REGION=cn-hangzhou
```

Use [direnv](https://direnv.net/) or a similar tool to load it automatically.

### 2. Use Different Stages for Different Environments

```bash
# Development
si deploy --stage dev

# Testing
si deploy --stage test

# Production
si deploy --stage prod
```

### 3. Validate Before Deploying

```bash
# Validate first
si validate

# Then deploy
si deploy --stage dev
```

### 4. Override Variables at Deploy Time

```bash
# Dynamically adjust config during deployment
si deploy --stage prod \
  -p memory_size=2048 \
  -p timeout=60
```

### 5. Use Watch Mode for Local Development

```bash
# Auto-reload on code changes
si local --stage dev --watch
```

## FAQ

### "Insufficient permissions" error during deployment?

Check that your environment variables are set correctly:

```bash
echo $ALIYUN_ACCESS_KEY_ID
echo $ALIYUN_ACCESS_KEY_SECRET
```

Make sure your RAM user has the required permissions (e.g., `AliyunFCFullAccess`, `AliyunAPIGatewayFullAccess`).

### How do I view deployment logs?

Use `--verbose` or set `SI_DEBUG=true`:

```bash
SI_DEBUG=true si deploy --stage dev
```

### Port already in use during local run?

Specify a different port:

```bash
si local --stage dev --port 8080
```

### How do I clean up the local environment?

Stop the local service with `Ctrl+C`, then clear the cache:

```bash
rm -rf .serverlessinsight
```

### How do I roll back a failed deployment?

ServerlessInsight does not currently support automatic rollback. Recommended approach:

1. Use Git to manage your configuration files
2. Back up the current state before deploying
3. After a failure, redeploy with a previous version

```bash
# Roll back to the previous version
git checkout HEAD~1 serverlessinsight.yml
si deploy --stage dev
```

## Quick Reference

```bash
# Validate configuration
si validate

# Deploy application
si deploy --stage <env>

# Destroy application
si destroy --stage <env>

# Run locally
si local --stage <env> [--debug] [--watch]

# Force unlock stuck deployment
si forceUnlock <lockId>

# View help
si -h
si <command> -h
```

## Version Information

Check the CLI version:

```bash
si --version
```

Upgrade the CLI:

```bash
npm update -g @geek-fun/serverlessinsight
```
