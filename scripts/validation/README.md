# Validation backends

Each agent worktree can run its own throwaway local Convex backend (anonymous mode) on fixed
ports. The wrapper refuses anything that could reach a cloud deployment, including the one that
serves the live site.

| App port `P` | Convex cloud port | Convex site port | State |
| --- | --- | --- | --- |
| 8100–8199 (8090 is the human dev server) | `3300 + 2*(P-8100)` | cloud + 1 | `~/.uvs-validation/backends/<P>/` |

## Commands

```sh
bun run vconvex -- --app-port 8150 --check              # guard only: target class + rule names, exit 0 only if local
bun run validation:backend -- start --app-port 8150     # set env, push convex/, keep a dev watcher running
bun run validation:backend -- status                    # every known backend
bun run vconvex -- --app-port 8150 run sets:list        # any allowed CLI command against that backend
bun run validation:backend -- stop --app-port 8150
bun run vconvex -- --app-port 8150 dev --once           # one-shot push when no backend is running
```

- The port comes from `--app-port`, then `UVS_APP_PORT`, then `~/.uvs-validation/ports.json` (keyed by worktree).
- `--check` runs no CLI. It prints `target=local|cloud|unknown` and each rule as pass/fail/skipped,
  with names and counts only, never values. Use it as the self-check before anything else.
- `.env.local` holds one port pair. If another backend wrote it last, every command refuses and
  names the port it points at. Rerun with that `--app-port`, or add `--repoint-env-local` (to
  `vconvex` or `start`) to rewrite it for this port. The rewrite is logged.
- `start` fails within `--timeout` seconds (default 60) per step, with the log tail
  (`~/.uvs-validation/backends/<P>/backend.log`).

## What the guard refuses

See `guard.ts`. In short:

- **CLI version.** Any Convex CLI version not in `TESTED_CONVEX_VERSIONS`. Before adding a version,
  re-verify login hiding and every rule below against that version's source.
- **Commands.** Subcommands outside the allowlist (`deploy`, `login` and others), and
  deployment-selecting or credential flags.
- **Env names (any letter case, even when empty).** `CONVEX_DEPLOY_KEY`,
  `CONVEX_OVERRIDE_ACCESS_TOKEN`, `CONVEX_PROVISION_HOST`, `CONVEX_ALLOW_ANONYMOUS` and
  `DOTENV_KEY` in the shell, `.env.local` or `.env`.
- **Deployment and URLs.** A `CONVEX_DEPLOYMENT` that isn't `anonymous:anonymous-*`, a
  `*CONVEX*URL*` that isn't loopback, and either of those set but empty.
- **Ambiguous env files.** `.env.local`/`.env` are parsed with the CLI's own bundled dotenv. They
  are refused when a plain line-by-line read disagrees with dotenv: duplicate names (dotenv keeps
  the last), lines inside multi-line quoted values, `KEY:value` without a space, or credential
  names inside other values.
- **Other fallbacks.** Any `.env*.vault` file, and a `convex.json` that links a team or project.
- **Isolation.** The wrapped env must hide the owner's login: `USERPROFILE`/`HOME` set to the
  backend dir and `LOCALAPPDATA` set to `~/.uvs-validation/cache`. Its credential vars are pinned:
  `CONVEX_DEPLOY_KEY=<ignore_deploy_key>`, `DISABLE_BEACON=1` and the others in
  `PINNED_CHILD_ENV`. The target the CLI would resolve from all of this must be the wrapper's own
  `anonymous:anonymous-agent`.

A bare `bunx convex …` has none of these protections.

## Network exposure

`convex-local-backend` listens on `0.0.0.0` on its cloud and site ports. CLI 1.31 has no flag or
env var to change that. While a backend runs, other machines on the LAN can call its public
functions and HTTP actions, against synthetic data only. Admin operations need the instance
secret, and nothing from production is ever on these backends.

On Windows the owner can block inbound LAN traffic to the whole validation port range. Loopback
traffic isn't affected. Run this in an elevated PowerShell:

```powershell
New-NetFirewallRule -DisplayName "UVS validation Convex (block LAN)" -Direction Inbound -Protocol TCP -LocalPort 3300-3499 -Action Block
```

Remove it with `Remove-NetFirewallRule -DisplayName "UVS validation Convex (block LAN)"`. The
tooling never applies it itself.

## Telemetry

The wrapped CLI and backend run with `DISABLE_BEACON=1`. Anonymous mode still calls Convex's
cloud API without any credentials, to mint the admin key for a new local deployment and to check
the CLI version.
