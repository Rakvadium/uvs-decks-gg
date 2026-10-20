# Validation backends

Each agent worktree can run its own throwaway local Convex backend (anonymous mode) on fixed
ports. The wrapper refuses anything that could reach a cloud deployment, including the one that
serves the live site.

## Threat model

The guard stops **accidents**. It is not a sandbox.

**Protected:** an agent or a human, acting in good faith, ending up somewhere other than this
worktree's local backend by accident. That covers:

- **Cloud targets:** a cloud deployment reached through env files, shell env vars, CLI flags,
  `convex.json`, `.env*.vault` or an unpinned backend version.
- **Owner state reused:** the owner's Convex login or cache, reached through `HOME`/`LOCALAPPDATA`,
  symlinks, junctions, reparse points, mounts, or a per-port cache migrated into the shared cache.
  That includes an agent linking or mounting the owner's cache to skip a 130MB fetch.

Every check fails closed: anything it can't read or resolve is refused.

**Out of scope:** a process that sets out to defeat the guard. Such a process could just as well run
a raw `bunx convex` with the owner's login. That includes:

- **Namespace tricks:** mounts the guard can't see, for example ones made in another mount
  namespace after the check.
- **Racing the checks:** a same-user process that swaps a path between the last check and the
  CLI's spawn. The next run refuses the swapped path, but the run already under way isn't
  protected.
- **Malicious agents:** an agent with shell access that means harm.

**What covers those cases:**

- **Isolation:** run the agent as a separate OS user, or in a sandbox or VM, that can't read the
  owner's home, Convex login or credentials.
- **GitHub identity:** agents push as their own GitHub identity, without owner tokens.
- **Approval:** cloud writes need explicit human approval (see `AGENTS.md`).

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
- `start` saves `CLI_TOUCHED_FILES` and `convex/_generated/*` (see `convex.ts`) before its first
  CLI run, in `~/.uvs-validation/backends/<P>/cli-touched-files.json`. It restores
  `CLI_TOUCHED_FILES` once the watcher's first push is done. `stop` restores everything after
  killing the watcher. Generated files go back only when the CLI changed nothing but their line
  endings, so real codegen changes stay. `.gitattributes` checks them out with LF, as the CLI
  writes them, so a checkout made after that rule should see no change at all.
- If `start` finds that snapshot left over from a `start` that was killed, and no backend is
  running, it restores the snapshot before taking a new one. Without that, the new baseline would
  record whatever the killed run left behind.
- Before a restore overwrites or deletes one of the `CLI_TOUCHED_FILES`, it copies the file's
  current bytes to `~/.uvs-validation/backends/<P>/reverted/<time>/<path>` and prints that path in
  its `reverted CLI side-effect edits` line. An edit you made to one of those files during a
  session can be copied back from there.
  - A backup identical to an older one replaces it, so the CLI's repeated identical rewrites keep
    one copy, the latest, and a real edit's backup isn't buried under them.
  - Each port keeps its newest 20 `reverted/<time>/` dirs. Older ones are deleted.
- The snapshot records each file's git blob id at `HEAD`. If a file's blob at `HEAD` differs at
  restore time, the file changed in git since the snapshot was taken, for example after a killed
  `start` and then a branch switch or pull. The restore then keeps `HEAD`'s version instead of
  putting the old bytes back:
  - The snapshot's bytes go to `reverted/<time>/stale-snapshot/<path>`.
  - A working copy that differs from `HEAD` is backed up and replaced with `HEAD`'s version.
  - Codegen files are left as they are.
  - The `did not restore an out-of-date snapshot` line names each file and both paths.

  A snapshot saved by an older wrapper has no blob ids and is restored as before.

## Pinned local backend

Every wrapped `dev` gets `--local-backend-version <PINNED_LOCAL_BACKEND_VERSION>` (in `guard.ts`,
next to `TESTED_CONVEX_VERSIONS`). Without it, CLI 1.31 asks `api.github.com` for the latest
backend release on every anonymous `dev`. That API allows 60 unauthenticated calls an hour per IP,
so parallel agents ran out. With the pin, `start` and `dev --once` use the cached binary and
dashboard and never contact GitHub.

- The binary and dashboard live in `~/.uvs-validation/cache/convex/`, one copy per machine for
  every port. On Windows the wrapped CLI reaches it through `LOCALAPPDATA`.
- On macOS and Linux the CLI caches under `$HOME/.cache/convex`, and `HOME` is the backend dir.
  Every wrapped `dev` links `~/.uvs-validation/backends/<P>/.cache/convex` to the shared dir.
  - A real dir an older wrapper left there hands its pinned binary and dashboard to the shared
    cache, and is then replaced by the link. Only regular files and dirs are moved. A
    `binaries/<pin>` or `dashboard` that is a link, or holds one, is refused.
  - That link must resolve to the shared dir exactly. Any other target is refused.
- **No links or mounts in the validation trees, at any depth, on any platform.** The guard walks
  `~/.uvs-validation/cache/**` and `~/.uvs-validation/backends/<P>/**`.
  - It refuses every symlink, junction or other reparse point. On macOS and Linux, the one
    exception is the wrapper's own `<backend dir>/.cache/convex` link.
  - It refuses every dir on another device than its parent (`st_dev`), which is a mount point.
  - On a Linux host, it also refuses every mount point in `/proc/self/mountinfo` at or below those
    trees. That catches same-device bind mounts, including ones made inside `unshare -Urm`. If the
    table can't be read, or lists no mount points (a real one always lists `/`), it refuses.
  - It refuses a dir whose real path can't be resolved, or isn't its parent's real path plus its
    name.
  - `owner-cache-untouched` reports the shared cache. It also needs `cache` and `cache/convex` to
    be plain dirs, and allows only regular files and dirs under them.
  - `owner-login-hidden` reports the backend home:
    - `backends` and `backends/<P>` must be plain dirs (checked with `lstat`) on the root's
      device, and must resolve to the path built from the resolved `~/.uvs-validation`.
    - The home must not be, contain, or sit inside the owner's home or any owner Convex dir.
    - Only the backend's own Unix sockets are allowed there besides regular files and dirs. FIFOs
      and devices are refused.
  - Every wrapped `dev` repeats both checks before it writes anything, and again after linking and
    seeding.
  - Expected paths are always built from the resolved `~/.uvs-validation`, never from a link's own
    target. `~/.uvs-validation` itself may be a link.
  - On the owner's machine, the walk takes about 6ms for the shared cache, and a median of 21ms
    (120ms at most) for a backend home.
- `dev` copies the pinned binary from the owner's own Convex cache when the owner has it, and
  only reads from that cache.
- If the pinned version isn't cached, `start` and `vconvex dev` fail and print the one-time fetch
  command:

  ```sh
  bun run validation:backend -- start --app-port 8150 --fetch-pinned-backend
  ```

  `--fetch-pinned-backend` lets the CLI download the pinned release assets from `github.com`
  release downloads. Even then, it never asks `api.github.com` for a version.
- A backend saved at another version is refused, because the CLI would prompt to upgrade it. Run
  `stop`, delete the `anonymous-convex-backend-state` dir that the error names, and `start` again.
  Its data is throwaway.
- Before changing the pin, check that the new version works with the CLI on the tested list.

## What the guard refuses

See `guard.ts`. In short:

- **CLI version.** Any Convex CLI version not in `TESTED_CONVEX_VERSIONS`. Before adding a version,
  re-verify login hiding and every rule below against that version's source.
- **Commands.** Subcommands outside the allowlist (`deploy`, `login` and others), and
  deployment-selecting or credential flags.
- **Backend flags.** `--local` and every `--local-*` flag from the caller, including
  `--local-backend-version` and `--local-force-upgrade`. The wrapper sets the ports and the pinned
  version itself, and `backend-version-pinned` checks that `dev` gets the pin exactly once.
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
  backend dir, and `LOCALAPPDATA` set to `~/.uvs-validation/cache` on Windows. The backend dir
  must be a plain dir that doesn't overlap the owner's home or Convex dirs. Nothing under it or
  under the shared cache may be a link, except the wrapper's own `.cache/convex` link on macOS and
  Linux, which must resolve to the shared `cache/convex`. Its credential vars are pinned:
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
the CLI version. It doesn't call GitHub unless you pass `--fetch-pinned-backend`.
