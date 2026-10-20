# secret-scan

Finds the **values** of this project's real secrets in commits, staged changes and files before they go public. Generic scanners can't recognize custom strings like the agent password or login token. This tool knows the actual values, so it can.

The secrets it checks are listed **by name** in [`secrets.json`](secrets.json). It reads their values from the process env and from every `--env-file` you pass. It never prints a value. Each hit is reported as `VAR_NAME file:line`, plus `@<commit>` for `--diff` hits.

## Usage

```bash
E="--env-file /c/Projects/uvs-decks-gg/.env.local.live-backup --env-file /c/Projects/uvs-decks-gg/data/live-env-no-r2.txt"

# Your branch's commits: changed files and commit messages
bun run secret-scan --strict --diff origin/dev..HEAD $E

# The staged files (works as a pre-commit check)
bun run secret-scan --strict --staged $E

# Every file under a directory (e.g. capture output before publishing)
bun run secret-scan --strict --path .pr-captures $E
```

Flags can be combined, and `--env-file` can be repeated. Production Convex values (`JWT_PRIVATE_KEY`, `JWKS`, `YOUTUBE_DATA_API_KEY`, and others) live in `data/live-env-no-r2.txt`, so pass it too. If a name has several distinct values across sources, every value is checked. In a worktree, the env files live in the main checkout, so pass their full paths.

| Exit | Meaning |
| --- | --- |
| 0 | Clean. |
| 1 | At least one hit. Remove the value, and rotate the secret if it was pushed. |
| 2 | The scan couldn't run completely: bad arguments, an unreadable env file, a git error, **zero values loaded**, or, under `--strict`, a missing required value. |

### Missing values and `--strict`

`secrets.json` has three lists:

- `names` — every secret to scan for.
- `optional` (`CONVEX_DEPLOY_KEY`) — may be missing even under `--strict`.
- `ciOnly` (`SECRET_SCAN_CANARY`) — required only with `--ci`, and ignored otherwise.

Every other name is **required**.

- **Without `--strict`:** missing names are listed in a warning (`secret-scan: warning: no value, not checked: …`), and the rest are still scanned.
- **With `--strict`:** a missing required name fails the run with exit 2 and this exact message:

  ```
  secret-scan: missing required value(s): NAME1, NAME2
  ```

  Values under 8 chars can't be checked, so they count as missing.
- **Zero values loaded:** exit 2 even without `--strict`. This catches a forgotten `--env-file`.

With both env files, a correct local setup passes `--strict`. CI runs `--strict --ci`, so a deleted or renamed Actions secret, or a missing canary, fails the job instead of passing on nothing.

## What is detected

For each value of 8 or more chars, the scan looks for these byte sequences:

- the raw value (UTF-8)
- URL-encoded forms (upper- and lower-case escapes, `+` for spaces)
- the JSON-escaped form (for multi-line keys)
- base64 and base64url, including when the value sits inside a longer base64 string such as `Basic user:pass`
- UTF-16LE and UTF-16BE, including inside binary data
- the value with its whitespace removed, and each line of 32+ chars of a multi-line or space-joined value (for example, a PEM key's body lines). `-----BEGIN/END-----` lines are skipped.
- for values of 32+ chars, any 24-char slice of a key-character run (`A-Za-z0-9+/=_.~-`). This catches a value split into pieces of 24+ chars. JSON keys, PEM armor and the first 64 chars of a PEM body (the DER header shared by every key of the same type) are excluded.

Each file is scanned in several decoded forms:

- the raw bytes
- a UTF-16 decoding, when the file has a UTF-16 BOM or the NUL pattern of UTF-16 text. Windows PowerShell 5.1 `>` writes UTF-16LE.
- for text files (no NUL in the first 8000 bytes): a copy with all whitespace removed (hard-wrapped base64, values broken across lines), and a copy that also joins split strings: `"abc" +\n "def"`, `'abc' 'def'`, `"abc" . "def"`, `"abc","def"`, and `\` line continuations

On the current tree, all of this gives zero false positives. Across the repo's whole history, it flags only the real old leaks.

### `--diff` and `--staged`

`--diff A..B` scans the commits in `A..B`. Those are the commits reachable from `B` but not from `A`: the branch's own work since its merge-base with `A`. It is **not** `git diff A..B`, so changes made on `A` after the branch point, such as `dev` removing a credential, never show up reversed. For each commit, the scan reads the **full new blob of every changed file** with `git cat-file`. It also scans the commit message. Patch text isn't used, so binary files and `.gitattributes` (`binary`, `-diff`, textconv) can't hide anything.

A value counts as added when it occurs more often in the new blob than in the parent blob. An old occurrence elsewhere in an edited file isn't reported again. A merge commit contributes only paths that differ from every parent, which means its conflict resolutions. Each commit is scanned on its own, so a value added and removed later in the same PR still fails. PRs here merge with merge commits, so that intermediate commit would land in history. To clean a branch, drop or rewrite the commit; a revert isn't enough.

`--staged` does the same for each staged file: the index blob compared with `HEAD`'s.

`--path` reads every file under the directory, text or binary. It skips `.git` and `node_modules`.

## What is not detected

- **Values under 8 chars.**
- **Compressed or encrypted content:** zip, gzip, `.docx`/`.xlsx`, PDF streams, PNG `zTXt`/`iTXt` chunks, and git LFS objects. For LFS, only the pointer is in git.
- **Values drawn into image pixels:** screenshots of a value, for example.
- **Encodings other than the ones listed:** hex, base32, HTML entities, `\uXXXX` escapes, base64 of UTF-16, and so on.
- **Reordered or transformed values,** and values split into pieces shorter than 24 chars, unless the pieces are joined by whitespace or by the quote joiners above. For values under 32 chars, any split that isn't a whitespace or quote join.
- **A value moved within a file, or removed in one place and added in another, in the same commit.** The occurrence count doesn't rise, so it isn't reported.
- **Where the secret lives:** only manifest names are checked, and only with the values available to the run. Values in neither the env nor an env file aren't checked. Locally, that's whatever isn't in your env files; in CI, it's any missing Actions secret, which fails under `--strict`.

## CI

The `secret-scan` job in `.github/workflows/ci.yml` runs `--strict --ci --diff <range>`. Values come from Actions secrets with the same names. The job's env list must match `secrets.json`, and `tests/secret-scan.test.ts` checks that it does.

- **Pull requests** (`opened`, `synchronize`, `reopened`, `edited`; `edited` re-runs on a base-branch change): the range is `base.sha..head.sha`.
- **Pushes to `dev` and `master`:** the range is `before..after`. If `before` isn't available, or is all zeros on a new branch, it's the merge-base with the default branch. After a force-push, it's the merge-base of `before` and `after`. If that leaves nothing, only the pushed commit is scanned. This alerts after the push; it can't block it.
- **Fork PRs fail** with an error saying a maintainer must run the scan locally. Forks get no Actions secrets, so CI can't scan them.

The `gitleaks` job adds pattern-based detection for well-known token formats. On PRs, it scans only the PR's own commits, so the old leak in history doesn't fail every run.

These jobs only block merges if they are **required status checks** on `dev` and `master`. That is a repo setting, separate from this code.

## Syncing Actions secrets

After you rotate a secret, update the env files, then run this from the main checkout:

```bash
bun run secret-scan:sync-ci [--env-file <file>]... [--repo Rakvadium/uvs-decks-gg] [--dry-run]
```

- **Which files:** without `--env-file`, it reads `.env.local.live-backup` and `data/live-env-no-r2.txt` from the current directory. From a worktree, pass both with full paths.
- **What it sets:** each manifest name with a value in any file, except `ciOnly` names.
- **Different values:** if the files hold different values for one name, all distinct values are stored in that one secret, joined by `VALUE_SEPARATOR` (in `shared.ts`). The scanner splits them back apart.
- **How values travel:** they go to `gh secret set NAME` on stdin, and never reach the command line or the output.
- **Requirements:** `gh` logged in with admin access to the repo.

## Adding a secret

1. Add the name to `names` in `secrets.json`, and to `optional` if it may be missing.
2. Add `NAME: ${{ secrets.NAME }}` to the `secret-scan` job's env.
3. Run `bun run secret-scan:sync-ci`.

## The canary and proving the gate

`SECRET_SCAN_CANARY` is a fake, test-only secret that's set by hand. It's `ciOnly`, so CI fails when it's missing. That proves Actions secrets are actually wired into the job. To prove the gate fails on a leak:

1. Make a random value outside the repo, and set it as the canary:

   ```bash
   node -e "process.stdout.write('canary-'+require('crypto').randomBytes(20).toString('hex'))" > /tmp/canary
   gh secret set SECRET_SCAN_CANARY < /tmp/canary
   ```

2. Push a throwaway commit on your PR branch that adds a file containing it. Watch the job fail.
3. Drop the commit and force-push.
4. Delete `/tmp/canary`.

Never use a real secret for this.
