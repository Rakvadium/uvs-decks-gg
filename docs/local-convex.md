# Local Convex backend

Read before running any `convex` command.


**`honorable-shrimp-618` is PRODUCTION.** It is labelled `dev:` in the Convex dashboard, but the live
site (www.uvsdecks.gg) is built against it. `convex dev`, `convex dev --once`, `convex run`,
`convex import`, migrations and schema pushes against it change live data. Never target it from a
branch without explicit owner approval and a backward-compatibility check against the deployed
`master` frontend.

Branch work uses a **local deployment** (`CONVEX_DEPLOYMENT=local:local-rakvadium-tcgdecks_gg` in
`.env.local`):

- `bunx convex dev` starts the local backend (http://127.0.0.1:3210, HTTP actions on :3211) and
  pushes functions to it. Keep it running while the app runs.
- `.env.local` points the app at it: `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_URL` =
  `http://127.0.0.1:3210`, `CONVEX_SITE_URL=http://127.0.0.1:3211`. The previous (production)
  values are in the gitignored `.env.local.live-backup`.
- Env vars were copied from production **except R2 credentials**, which are set to invalid
  placeholders: the local backend reads existing catalogs/images from the public bucket, but
  catalog publishing and image uploads fail on purpose (they would write to the production bucket,
  and catalog cleanup deletes old versions). Use a separate dev bucket before enabling them.
- Seed data: `bunx convex export` from production (read-only) then
  `bunx convex import --replace-all -y <zip>` **after confirming `CONVEX_DEPLOYMENT` starts with
  `local:`**. Snapshots live in the gitignored `data/` folder and contain user data; don't share them.

