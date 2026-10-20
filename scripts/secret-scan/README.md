# secret-scan

Finds the **values** of this project's real secrets in commits, staged changes and files before they go public. Generic scanners can't recognize custom strings like the agent password or login token. This tool knows the actual values, so it can.

The secrets it checks are listed **by name** in [`secrets.json`](secrets.json). It reads their values from the process env and from every `--env-file` you pass. It never prints a value. Each hit is reported as `VAR_NAME file:line`, plus `@<commit>` for `--diff` hits.

## Usage

```bash
E="--env-file /c/Projects/uvs-decks-gg/.env.local.live-backup --env-file /c/Projects/uvs-decks-gg/data/live-env-no-r2.txt"

# Your branch's commits: changed files and commit objects (message, author, committer)
bun run secret-scan --strict --diff origin/dev..HEAD $E

# The staged files (works as a pre-commit check)
bun run secret-scan --strict --staged $E

# Every file under a directory (e.g. capture output before publishing)
bun run secret-scan --strict --path .pr-captures $E
```

Flags can be combined, and `--diff` and `--env-file` can be repeated. Production Convex values (`JWT_PRIVATE_KEY`, `JWKS`, `YOUTUBE_DATA_API_KEY`, and others) live in `data/live-env-no-r2.txt`, so pass it too. If a name has several distinct values across sources, every value is checked. In a worktree, the env files live in the main checkout, so pass their full paths.

| Exit | Meaning |
| --- | --- |
| 0 | Clean. |
| 1 | At least one hit. Remove the value, and rotate the secret if it was pushed. |
| 2 | The scan couldn't run completely: bad arguments, an unreadable env file, a git error, **zero values loaded**, or, under `--strict`, a missing required value. |

### Missing values and `--strict`

`secrets.json` has three lists:

- `names` — every secret to scan for.
- `optional` (`CONVEX_DEPLOY_KEY`) — may be missing even under `--strict`.
- `ciOnly` (`SECRET_SCAN_CANARY`) — required only with `--ci`. Without `--ci`, these names are ignored: they aren't scanned for, and they aren't counted.

Every other name is **required**.

- **Without `--strict`:** missing names are listed in a warning (`secret-scan: warning: no value, not checked: …`), and the rest are still scanned.
- **With `--strict`:** a missing required name fails the run with exit 2 and this exact message:

  ```
  secret-scan: missing required value(s): NAME1, NAME2
  ```

  Values under 8 chars can't be checked, so they count as missing.
- **Zero values loaded:** exit 2 even without `--strict`. This catches a forgotten `--env-file`.

With both env files, a correct local setup passes `--strict`. `--ci` implies `--strict`. CI runs `--strict --ci`, so a deleted or renamed Actions secret, or a missing canary, fails the job instead of passing on nothing.

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
- for text files (no NUL in the first 8000 bytes): a copy with all whitespace and invisible chars removed (hard-wrapped base64, values broken across lines or salted with invisible chars). The invisible chars are soft hyphen U+00AD, zero-width U+200B–U+200D, word joiner U+2060, invisible operators U+2061–U+2064, and U+FEFF. Other invisible or look-alike chars are not removed, and a copy that also joins split strings: `"abc" +\n "def"`, `'abc' 'def'`, `"abc" . "def"`, `"abc","def"`, and `\` line continuations

On the current tree, all of this gives zero false positives. Across the repo's whole history, it flags only the real old leaks.

### `--diff` and `--staged`

`--diff A..B` scans the commits in `A..B`. Those are the commits reachable from `B` but not from `A`: the branch's own work since its merge-base with `A`. It is **not** `git diff A..B`, so changes made on `A` after the branch point, such as `dev` removing a credential, never show up reversed. For each commit, the scan reads the **full new blob of every changed file** with `git cat-file`. It also scans the **whole raw commit object**: author and committer names and emails, the message, trailers, and any signature block. A hit there is reported as `VAR_NAME commit:<line> @<sha>`, with lines counted from the object's `tree` header. Patch text isn't used, so binary files and `.gitattributes` (`binary`, `-diff`, textconv) can't hide anything.

A value counts as added when it occurs more often in the new blob than in the parent blob, so an old occurrence elsewhere in an edited file isn't reported again. Renames are an exception, and fail safe: diffs run with `--no-renames`, so a renamed file is a new path. Any value already inside it is reported again under the new name. A merge commit contributes only paths that differ from every parent, which means its conflict resolutions. Each commit is scanned on its own, so a value added and removed later in the same PR still fails. PRs here merge with merge commits, so that intermediate commit would land in history. To clean a branch, drop or rewrite the commit; a revert isn't enough.

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

The `secret-scan` job in `.github/workflows/ci.yml` runs `--strict --ci` with one `--diff` per range. Values come from Actions secrets with the same names. The job's env list must match `secrets.json`, and `tests/secret-scan.test.ts` checks that it does.

The ranges come from [`ci-range.sh`](ci-range.sh), which the tests run against temp repos. When it can't determine a range, it **fails the job** rather than guessing.

- **Pull requests** (`opened`, `synchronize`, `reopened`, `edited`; `edited` re-runs on a base-branch change): `base.sha..head.sha`.
- **Pushes to `dev` and `master`:** `merge-base(before, after)..after`. That is `before..after` for a normal push, and also covers older commits a force-push rewrote.
  - After a force-push, `actions/checkout` doesn't have the old tip, because it's no longer on any branch. The script fetches it by SHA; GitHub serves it until garbage collection. If it still can't be read, the job fails.
  - For a new branch (`before` all zeros), the range is everything not already on the default branch.
  - Push scans alert after the push; they can't block it.
- **Nightly (`schedule`, or `workflow_dispatch` to run it now):** every push to `dev` and `master` in the last 3 days, **by push time**.
  - Pushes come from GitHub's repository activity API (`GET /repos/{owner}/{repo}/activity?ref=refs/heads/<branch>`). It lists each push, force-push, PR merge and branch creation, with its time and `before`/`after` SHAs.
  - Each push is scanned like the push path: `merge-base(before, after)..after`. An overwritten `before`, or a since-overwritten `after`, is fetched by SHA.
  - Commit dates play no part, so the window covers backdated commits, fast-forwards of old local work, and `[skip ci]` pushes. Scheduled runs ignore `[skip ci]`.
  - Older history, including known historical leaks, is outside every listed push, so it never turns this run red.
  - A window with no pushes is clean. The run still checks that every secret is wired, by running `--strict --ci` on an empty directory.
  - The job **fails** if the API call fails, returns something unexpected, or a listed SHA can't be fetched.
  - The overlapping windows cover push runs that were skipped, cancelled or missed. A push older than 3 days is not covered, for example if the nightly run itself didn't run for 3 days in a row.
- **Fork PRs fail** with an error saying a maintainer must run the scan locally. Forks get no Actions secrets, so CI can't scan them.

**Concurrency:** a newer PR run cancels an older one for the same PR, because it scans a superset. Push and scheduled runs each get their own concurrency group (`run_id`), so a later push can never cancel an earlier push's scan, or drop it while it's pending.

The `gitleaks` job adds pattern-based detection for well-known token formats. On PRs, it scans only the PR's own commits, so the old leak in history doesn't fail every run. It misses binary, UTF-16, wrapped and split values, so it supplements the value scan rather than replacing it.

### Deliberate bypasses

These skip or weaken the scan. They are known and accepted; the gate can't prevent them on its own.

- **Skip markers:** `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]`, or a `skip-checks: true` trailer in the head commit. These skip the push run, with no record, and the PR run too. For PRs, required checks then block the merge. For direct pushes, the nightly run is the backstop: it scans every push by push time, so it catches these within a day.
- **Editing the gate itself:** a PR runs its own version of `ci.yml`, `secrets.json` and `scripts/secret-scan/`, so it can weaken or remove the scan for itself. Review changes to these files with care. Once merged, the weakened version also runs nightly.
- **Disabled or missing workflows:** a disabled workflow, a deleted secret (which fails `--strict --ci`), and GitHub pausing scheduled workflows after 60 days without repo activity.
- **Not required:** these jobs only block merges if they are **required status checks** on `dev` and `master`. That is a repo setting, separate from this code.

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
