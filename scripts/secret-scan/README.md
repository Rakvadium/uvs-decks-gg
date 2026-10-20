# secret-scan

Finds the **values** of this project's real secrets in diffs, commit messages and files before they go public. Generic scanners can't recognize custom strings like the agent password or login token. This tool knows the actual values, so it can.

The secrets it checks are listed **by name** in [`secrets.json`](secrets.json). It reads their values from the process env and from any `--env-file` you pass. It never prints a value. Each hit is reported as `VAR_NAME file:line`.

## Usage

```bash
# Every commit on your branch: added lines and commit messages
bun run secret-scan --diff origin/dev..HEAD --env-file .env.local.live-backup --env-file data/live-env-no-r2.txt

# The staged diff (works as a pre-commit check)
bun run secret-scan --staged --env-file .env.local.live-backup

# Every file under a directory, text or binary (e.g. capture output before publishing)
bun run secret-scan --path .pr-captures --env-file .env.local.live-backup
```

Flags can be combined, and `--env-file` can be repeated. Production Convex values (`JWT_PRIVATE_KEY`, `JWKS`, `YOUTUBE_DATA_API_KEY`, ...) live in `data/live-env-no-r2.txt`, so pass it too. If a name has different values in different sources, every value is checked. In a worktree, the env files live in the main checkout, so pass their full paths.

| Exit | Meaning |
| --- | --- |
| 0 | No hits. Missing values and values under 8 chars are listed by name as warnings, and those secrets aren't checked. |
| 1 | At least one hit. Remove the value, and rotate the secret if it was pushed. |
| 2 | Bad arguments, an unreadable env file, or a git error. |

## What counts as a hit

For each value of 8 or more chars, the scan looks for:

- the raw value
- its URL-encoded form (upper- and lower-case escapes, `+` for spaces)
- its JSON-escaped form (multi-line keys)
- base64 and base64url, including when the value sits inside a longer base64 string such as `Basic user:pass`
- each line of 32 or more chars in a multi-line or space-joined value, such as a PEM key's body lines (`-----BEGIN/END-----` lines are skipped), so a partial paste is caught

`--diff A..B` scans the commits in `A..B`, the commits reachable from `B` but not from `A`. That is the branch's own work since its merge-base with `A`. Each commit's added lines are diffed against that commit's parent, and its message is scanned too. This is not `git diff A..B`: changes made on `A` after the branch point, such as `dev` removing a credential, never show up reversed as additions. A merge commit contributes only what its conflict resolution added (`--remerge-diff`), not the branch it merged in.

Each commit is scanned on its own. A value that was added and then removed later in the same PR still fails the scan, because PRs here merge with merge commits and the intermediate commit stays in history. To clean a branch, drop or rewrite the commit; a revert commit isn't enough.

`--path` skips `.git` and `node_modules`. It can't see a secret drawn into image pixels, but it does catch the value in any text or metadata inside a file.

## CI

The `secret-scan` job in `.github/workflows/ci.yml` runs on every PR. It scans `base.sha..head.sha`, with values passed as Actions secrets under the same names. The job's env list must match `secrets.json`, and `tests/secret-scan.test.ts` checks that it does. On fork PRs, Actions secrets aren't available, so the job skips with a warning.

The `gitleaks` job adds pattern-based detection for well-known token formats. On PRs, it scans only the PR's own commits, so an old leak in history doesn't fail every run.

## Syncing Actions secrets

After you rotate a secret, update the env files, then run:

```bash
bun run secret-scan:sync-ci [--env-file <file>]... [--repo Rakvadium/uvs-decks-gg] [--dry-run]
```

Without `--env-file`, it reads `.env.local.live-backup` and `data/live-env-no-r2.txt` from the current directory. From a worktree, pass both with full paths. It sets each manifest name that has a value in a file. If files disagree, the last file wins, and the name is reported. Values go to `gh secret set NAME` on stdin and never reach the command line or the output. Names that aren't in any file are listed and left as they are. You need `gh` logged in with admin access to the repo.

## Adding a secret

1. Add the name to `secrets.json`.
2. Add `NAME: ${{ secrets.NAME }}` to the `secret-scan` job's env.
3. Run `bun run secret-scan:sync-ci`.

## Proving the gate

`SECRET_SCAN_CANARY` is a fake, test-only secret. To prove the CI job fails:

1. Make a random value outside the repo, and set it: `node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))" > /tmp/canary && gh secret set SECRET_SCAN_CANARY < /tmp/canary`
2. Push a throwaway commit that adds a file containing `/tmp/canary`'s contents, and watch the job fail.
3. Drop the commit and force-push.

Never use a real secret for this.
