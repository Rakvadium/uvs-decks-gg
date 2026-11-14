# Local development

Read before running any `convex` command.

**`honorable-shrimp-618` is PRODUCTION.** It is labelled `dev:` in the Convex dashboard, but the live
site (tcgdecks.gg and its game subdomains) runs on it. `convex dev`, `convex dev --once`,
`convex run`, `convex import`, migrations and schema pushes against it change live data. Never
target it from a branch without explicit owner approval and a backward-compatibility check against
the deployed `master` frontend.

## Run it

1. `bunx convex dev` starts the local backend (http://127.0.0.1:3210, HTTP actions on :3211) and
   pushes `convex/` to it. Keep it running.
2. `bun run dev` starts Next on port 8090, or on `PORT` from `.env.local` (worktrees).
3. Open the multi-game hosts. Browsers resolve `*.localhost` to 127.0.0.1, so no hosts-file edits:

| URL | What it is |
| --- | --- |
| http://tcgdecks.localhost:8090 | Apex: game picker, sign-in, sign-up |
| http://uvs.tcgdecks.localhost:8090 | UniVersus |
| http://cyberpunk.tcgdecks.localhost:8090 | Cyberpunk TCG |
| http://localhost:8090 | Standalone: UVS only, no game switcher, local sign-in (same mode as Vercel previews) |

Use the `tcgdecks.localhost` hosts for anything multi-game: game switching, the cross-host
sign-in handoff and silent SSO. Plain `localhost` can't reach Cyberpunk. `curl` and Node may not
resolve `*.localhost`; use a browser, or `curl --resolve uvs.tcgdecks.localhost:8090:127.0.0.1`.

## Multi-game smoke test

1. Signed out, open `uvs.tcgdecks.localhost:8090/gallery` and click Sign In. You land on the apex
   `/sign-in`. After signing in you return to the UVS gallery, signed in.
2. Open `cyberpunk.tcgdecks.localhost:8090/gallery`. You're signed in without a prompt (silent SSO).
3. Sign out on a game host. The apex is signed out and every session is deleted, but another
   game host's already-issued access token stays valid for up to an hour (accepted; see
   `docs/multi-game.md`).

## Accounts

- **Test account:** `bun run local:seed` creates it (`--admin` also grants Admin). Its credentials
  are `LOCAL_TEST_EMAIL` / `LOCAL_TEST_PASSWORD` in `.env.local`, generated on the first run. Rerun
  it after every data refresh. It's safe to rerun and refuses to run unless `.env.local` targets a
  `local:` deployment on a loopback URL.
- **Your production account** is in the snapshot with its production password. If sign-in fails
  with `InvalidSecret` in `bunx convex logs`, the password is wrong; check that a password manager
  didn't autofill a different saved credential for `*.localhost`. Password reset can't work locally
  (no `AUTH_RESEND_KEY`).
- `agent@localhost.dev` and `*@validation.invalid` are reserved and can't use password sign-in
  (`convex/lib/reservedIdentity.ts`).

## The local deployment

`.env.local` in the main checkout uses `CONVEX_DEPLOYMENT=local:local-rakvadium-tcgdecks_gg`,
`NEXT_PUBLIC_CONVEX_URL` / `CONVEX_URL` = `http://127.0.0.1:3210` and
`CONVEX_SITE_URL=http://127.0.0.1:3211`. The production values are in the gitignored
`.env.local.live-backup`.

Its env vars were copied from production **except R2 credentials**, which are invalid placeholders:
the local backend reads catalogs and images from the public bucket, but catalog publishing and
image uploads fail on purpose (they would write to the production bucket, and catalog cleanup
deletes old versions). Use a separate dev bucket before enabling them.

## Refreshing data

Production's catalog cleanup deletes old catalog files from R2, so an old snapshot ends up
pointing at catalogs that no longer exist. The gallery then falls back to a slower Convex sync,
and the console shows a 404 for `/catalog-proxy/...`. Refresh the snapshot when that happens or
when you need recent decks and users:

```sh
# Read-only export from production. Needs the owner's approval of this exact command.
CONVEX_DEPLOYMENT=dev:honorable-shrimp-618 bunx convex export --path data/convex-live-snapshot-YYYY-MM-DD.zip
# Import into the local backend. Use a fresh shell (no CONVEX_DEPLOYMENT override) and confirm
# CONVEX_DEPLOYMENT in .env.local starts with `local:` first.
bunx convex import --replace-all -y data/convex-live-snapshot-YYYY-MM-DD.zip
# Recreate the local test account (the import replaced every table, auth included).
bun run local:seed --admin
```

The process env var overrides `.env.local`. The obvious alternatives fail with Convex CLI 1.31:
`--deployment-name` is rejected while `.env.local` names a `local:` deployment, and `--env-file`
ignores your `convex login` token (it only accepts a deploy key from the file).

`--replace-all` replaces every table, including `users` and the `auth*` tables, so local accounts
end up matching production: accounts made only locally disappear, and local password changes revert.
Keeping the local auth tables instead would break ownership, because decks, collections and teams
reference production user ids. Snapshots live in the gitignored `data/` folder and contain user data; don't share them.

## Worktrees

Run `bun run worktree:setup` inside a new worktree (Cursor does this through
`.cursor/worktrees.json`). It copies the main checkout's `.env.local`, so the worktree shares the
local backend and its data, and sets a free `PORT` in 8091–8099. It refuses to run if the main
checkout isn't on a `local:` deployment, and backs up any `.env.local` it replaces.

- Only one `bunx convex dev` can run at a time, and it pushes *its* checkout's `convex/` code to
  the shared backend. Run it from the worktree only while testing that worktree's backend changes,
  then run it from the main checkout again.
- Cookies ignore ports, so two checkouts on the same `*.tcgdecks.localhost` names share sessions.
- `bun run worktree:audit` lists every worktree's Convex target. `!!` marks worktrees still pointed
  at a cloud deployment: their app reads live data and their `convex dev` pushes to production.
  Rerun `bun run worktree:setup --force` in them or delete them.
