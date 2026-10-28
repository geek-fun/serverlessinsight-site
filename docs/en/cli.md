---
title: "CLI Reference"
description: "ServerlessInsight si CLI commands and options for authentication, validation, deployment plans, deployment, teardown and local development."
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
| `si diff` | Preview deployment changes (no execution, no state writes) |
| `si deploy` | Deploy the config to a cloud provider |
| `si destroy` | Destroy the deployed stack |
| `si local` | Run the app locally for debugging (Aliyun / Tencent / Volcengine) |
| `si migrate` | One-time migration of legacy local/bucket state to the Console |
| `si schema` | Export the JSON Schema (draft-07) of the IaC config format |
| `si force-unlock <lockId>` | Manually remove a stuck deployment lock |

> There is no `init` command. You create the project and `serverlessinsight.yml` yourself; see [Getting Started](/en/getting-started).
>
> **`si plan` was removed in v0.9.4** — use `si diff` instead (identical options, exit codes and JSON envelope). Invoking `si plan` fails fast with a migration hint.

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
si show -s dev --json | jq '.resourceCount'
```

Read and display resources from the deployment state. With `--json`, a versioned envelope (`showVersion: 1`) is written to stdout with `provider`, `app`, `service`, `stage`, `stateLocation`, `backend`, `locked`, `resources`, `resourceCount` and more; logs go to stderr.

### si validate

```bash
si validate -f serverlessinsight.yml -s dev
si validate -s dev --json | jq '.valid'
```

Validate config syntax and semantics (including provider-specific runtime and resource checks). The process exits **1** when validation fails and **0** when it passes. `--json` emits a `{ validateVersion: 1, valid, errors: [...] }` envelope; each error carries `path`, `keyword`, `message` and optional `allowedValues`.

### si diff

```bash
si diff -f serverlessinsight.yml --stage dev
si diff --stage dev --json
si diff --stage dev --region cn-beijing -p memory=1024
si diff --stage dev --no-refresh
```

Preview deployment changes on Aliyun, Tencent Cloud, or Volcengine. `diff` compares your config against the configured state backend and live cloud resources field by field (including drift detection) but **never executes resource changes or saves state**. Volcengine plans include functions, TOS buckets, and API Gateway resources in dependency order.

| Option | Description |
| --- | --- |
| `-p, --parameter <key=value>` | Override a configuration variable (repeatable) |
| `--no-refresh` | Skip live drift checks for tracked resources (diff config against state only); ownership probes for new resources still run |
| `--json` | Write a versioned JSON envelope to stdout; logs go to stderr |
| `--no-color` | Disable ANSI colors in human output |

Stage, region, provider, and credential overrides use the [common options](#common-options). Configure cloud credentials and a supported state backend before diffing. Migrated legacy state produces a warning and remains unchanged. State and cloud read failures remain errors.

With `--json`, the envelope is `planVersion: 1`: `{ provider, app, service, stage, changes: [{ logicalId, type, action, attributes, drifted?, driftReasons? }], summary: { create, update, destroy, recreate, unchanged } }`, where `action` is one of `create` / `update` / `destroy` / `recreate`.

**Exit codes** follow the Terraform convention: **0** for no changes, **2** for changes, **1** for errors. In `--json` mode, failures emit `{ error: { code, message } }`; `code` is a stable, locale-independent error code (consistent across commands).

### si deploy

```bash
si deploy -s dev
si deploy -s dev -y
si deploy -s dev -p memory=1024
si deploy -s dev --si-api-key $SI_API_KEY
si deploy -s dev --no-refresh
```

| Option | Description |
| --- | --- |
| `--si-api-key <key>` | ServerlessInsight API Key (overrides `SI_API_KEY`) |
| `-y, --auto-approve` | Skip interactive approval and deploy |
| `-p, --parameter <key=value>` | Override a parameter (repeatable) |
| `--no-refresh` | Skip the pre-deploy live drift check |

In non-interactive environments (no TTY) you must pass `-y`, otherwise it errors. `si deploy` shows the plan, asks for confirmation, then applies exactly what `si diff` previewed. Resources that already succeeded are kept after a partial failure — fix the issue and re-run to continue.

### si migrate

```bash
si migrate -f serverlessinsight.yml -s dev            # interactive migration
si migrate -s dev --dry-run                           # show the mapping and impact without writing
si migrate -s dev --rollback                          # clear the migration marker (explicit undo)
```

Migrate legacy local / object-storage state to the ServerlessInsight Console (SAAS backend) in a **one-time** run. Flow: preflight → source lock → pull/validate → plan → confirm → upload → read-back verify → write migration marker. Uploads dedupe by content hash and every step is re-runnable; once the marker is written, the legacy backend is closed for mutations.

| Option | Description |
| --- | --- |
| `--si-api-key <key>` | Console API Key (overrides `SI_API_KEY`) |
| `-y, --auto-approve` | Skip interactive approval |
| `--force` | Import as a new version even when the target stage already has Console state |
| `--no-marker` | Skip writing the migration marker after migration |
| `--dry-run` | Show the migration mapping and impact without writing anything |
| `--rollback` | Clear the migration marker from the legacy state (explicit undo) |

### si destroy

```bash
si destroy -s dev
```

Destroy the stack in the given stage.

### si local

```bash
si local -s dev
si local -s dev --debug
si local --no-watch
```

| Option | Description |
| --- | --- |
| `-d, --debug` | Enable debug mode |
| `-w, --watch` | File watch mode, on by default; disable with `--no-watch` |

Serves a local HTTP endpoint on port `4567` (override with the `SI_LOCALSTACK_SERVER_PORT` env var) and needs **no cloud credentials at all**. All three deployable providers ship provider-native local simulation:

- **Aliyun FC**: FC Buffer events, context and response translation; timer event simulation
- **Tencent SCF**: SCF-native invocation context; the HTTP entry simulates the function URL trigger contract si deploys (API-Gateway-compatible event)
- **Volcengine veFaaS**: veFaaS-native HTTP events and response translation; timers fire with the CloudEvents envelope

Local routes (Volcengine and the generic shape):

- `/si_events/<event-key>/<configured-path>` — route a gateway event to the backend function
- `/si_functions/<function-key>/<path>` — invoke the function's HTTP adapter directly, no deployed trigger required

`functions.*.triggers.timer` schedules fire locally against UTC wall-clock (`@every` counts from server start), with the same event shape as the cloud. See the framework repo's Local development doc for the supported subset and runnable samples (Tencent SCF, Volcengine veFaaS).

### si schema

```bash
si schema                      # print to stdout
si schema -o schema.json       # write to a file
```

Export the JSON Schema (**draft-07**, self-contained) used for IaC config validation — handy for editor completions or validating configs in CI without the CLI.

### si force-unlock

```bash
si force-unlock <lockId> -f serverlessinsight.yml
```

Manually remove a stuck deployment lock. Refuses to run against the SAAS state backend. **Use with caution.**

## Environment Variables

- Cloud provider credentials: see "Regions and credentials" in the [Configuration Reference](/en/reference)
- `SI_API_KEY`: Console API Key (managed state backend)
- `SI_REGION` / `ALIYUN_REGION`: default region
- `SI_LOCALSTACK_SERVER_PORT`: port for `si local` (default `4567`)
- `NO_COLOR`: disable colored output when set (also available as `--no-color`)
- `SI_LANG`: override the CLI language (defaults to `LC_ALL` / `LANG`; `en` / `zh-CN`)
- `DEBUG`: print error stack traces when set

Output convention: **logs always go to stderr while result data goes to stdout** — a pipe like `si diff --json | jq '.summary'` always receives a single parseable JSON document. Every JSON envelope carries a version field, and error codes are identical across locales.

## Related Docs

- [Getting Started](/en/getting-started): install and config model primer
- [Configuration Reference](/en/reference): all resources, fields, and valid values
