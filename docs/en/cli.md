---
title: CLI Reference
description: All ServerlessInsight CLI commands and options
---

# CLI Reference

The ServerlessInsight command-line tool is named `si`. Install it with:

```bash
npm install -g @geek-fun/serverlessinsight
si --version
```

## Command Overview

| Command | Description |
| --- | --- |
| `si login` | Authenticate with the ServerlessInsight Console (obtain API Key) |
| `si logout` | Revoke and clear local credentials |
| `si whoami` | Show current login status |
| `si show` | Show deployed resources from state |
| `si validate` | Validate the `serverlessinsight.yml` config |
| `si plan` / `si diff` | Preview changes (Aliyun, Tencent, Volcengine) |
| `si deploy` | Deploy the config to a cloud provider |
| `si destroy` | Destroy the deployed stack |
| `si local` | Run the app locally for debugging (Aliyun only) |
| `si force-unlock <lockId>` | Manually remove a stuck deployment lock |

> There is no `init` command. You create the project and `serverlessinsight.yml` yourself; see [Getting Started](/en/getting-started).

## Common Options

These options are available across commands (see each command for specifics):

| Option | Description |
| --- | --- |
| `-f, --file <path>` | Path to the YAML config file |
| `-s, --stage <stage>` | Target stage; `local` defaults to `default` |
| `-r, --region <region>` | Region, overrides config and env vars |
| `-v, --provider <provider>` | Cloud provider, overrides config |
| `-k, --accessKeyId <id>` | AccessKeyId, overrides env vars |
| `-x, --accessKeySecret <secret>` | AccessKeySecret, overrides env vars |
| `-n, --securityToken <token>` | Temporary token, overrides env vars |

CLI options take priority over environment variables and the YAML config. Region resolution: `SI_REGION` > `ALIYUN_REGION` > `provider.region` (default `cn-hangzhou`).

## Command Details

### si login

```bash
si login [--si-api-key <key>]
```

Authenticate with the ServerlessInsight Console, used for the managed SAAS state backend. You can log in with an existing API Key. `SI_API_KEY` can also be supplied via `deploy --si-api-key`.

### si logout

```bash
si logout
```

Clear locally stored credentials.

### si whoami

```bash
si whoami
```

Show the current login status.

### si show

```bash
si show -f serverlessinsight.yml -s dev
```

Read and display resources from the deployment state.

### si validate

```bash
si validate -f serverlessinsight.yml -s dev
```

Validate config syntax and semantics (including provider-specific runtime and resource checks).

### si plan / si diff

```bash
si plan -f serverlessinsight.yml --stage dev
si diff -f serverlessinsight.yml --stage dev --json
si plan --stage dev --region cn-beijing -p memory=1024
si diff --stage dev --no-refresh
```

Preview deployment changes on Aliyun, Tencent Cloud, or Volcengine. Both commands
use the same planner. Volcengine includes functions, TOS buckets, and API Gateway
resources in dependency order. Planning reads the configured state backend and
cloud resources without executing resource changes or saving state.

| Option | Description |
| --- | --- |
| `-p, --parameter <key=value>` | Override a configuration variable (repeatable) |
| `--no-refresh` | Skip live drift checks for tracked resources; ownership probes for new resources still run |
| `--json` | Write a versioned plan envelope to stdout; logs go to stderr |
| `--no-color` | Disable ANSI colors in human output |

Stage, region, provider, and credential overrides use the common options above.
Configure cloud credentials and a supported state backend before planning.
Migrated legacy state produces a warning and remains unchanged. State and cloud
read failures remain errors.

JSON output retains `planVersion: 1`, `provider`, `app`, `service`, `stage`,
`changes`, and `summary` (create, update, destroy, recreate, unchanged counts).
Both commands exit **0** for no changes, **2** for changes, or **1** for errors.
With `--json`, failures emit `{ error: { code, message } }` instead of a plan.

### si deploy

```bash
si deploy -s dev
si deploy -s dev -y
si deploy -s dev -p memory=1024
si deploy -s dev --si-api-key $SI_API_KEY
```

| Option | Description |
| --- | --- |
| `--si-api-key <key>` | ServerlessInsight API Key (overrides `SI_API_KEY`) |
| `-y, --auto-approve` | Skip interactive approval and deploy |
| `-p, --parameter <key=value>` | Override a parameter (repeatable) |

In non-interactive environments (no TTY) you must pass `-y`, otherwise it errors.

### si destroy

```bash
si destroy -s dev
```

Destroy the stack in the given stage.

### si local

```bash
si local -s dev
si local -s dev --debug
```

| Option | Description |
| --- | --- |
| `-d, --debug` | Enable debug mode |
| `-w, --watch` | File watch mode (on by default, cannot be disabled) |

Serves a local HTTP endpoint on port `4567`; **Aliyun functions only**.

### si force-unlock

```bash
si force-unlock <lockId> -f serverlessinsight.yml
```

Manually remove a stuck deployment lock. Refuses to run against the SAAS state backend. **Use with caution.**

## Environment Variables

- Cloud provider credentials: see "Regions and credentials" in the [Configuration Reference](/en/reference)
- `SI_API_KEY`: Console API Key (managed state backend)
- `SI_REGION` / `ALIYUN_REGION`: default region
- `DEBUG`: print error stack traces when set

## Related Docs

- [Getting Started](/en/getting-started): install and config model primer
- [Configuration Reference](/en/reference): all resources, fields, and valid values
