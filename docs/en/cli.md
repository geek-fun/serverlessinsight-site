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
| `si plan` | Generate and show the deployment plan (Aliyun, Tencent only) |
| `si deploy` | Deploy the config to a cloud provider |
| `si destroy` | Destroy the deployed stack |
| `si local` | Run the app locally for debugging (Aliyun only) |
| `si force-unlock <lockId>` | Manually remove a stuck deployment lock |

> There is no `init` command. You create the project and `serverlessinsight.yml` yourself—see [Getting Started](/en/getting-started).

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

### si plan

```bash
si plan -s dev
```

Generate a deployment plan. **Note: `plan` is supported only on Aliyun and Tencent; it errors on Volcengine.**

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

- Cloud provider credentials: see each [provider page](/en/providers/)
- `SI_API_KEY`: Console API Key (managed state backend)
- `SI_REGION` / `ALIYUN_REGION`: default region
- `DEBUG`: print error stack traces when set

## Related Docs

- [Configuration Model](/en/concepts) — YAML config reference
- [Configuration Reference](/en/reference) — all resources, fields, and valid values
- [Provider Overview](/en/providers/) — capability differences
