# Admin catalog images and R2

This project stores card `imageUrl` values that are either **absolute HTTPS URLs** or **relative object keys** served from public R2.

## Current behavior

- The gallery and many clients normalize relative paths to a **public R2 base URL** (see `toPublicCardImageUrl` in `convex/cards.ts` and the gallery sync path in `src/lib/universus/`).
- Upload and bucket automation are **not** fully wired in-repo: operators typically sync binaries with existing scripts (`bun run upload-cards`, `bun run bulk-upload`, etc.) or manual uploads to the configured bucket.
- A versioned **static gzip catalog** on R2/CDN is **designed** but not required for day-to-day admin edits; see `docs/implementation/notes/cat-006-versioned-static-catalog.md` and global `cardDataVersion` from Convex.

## Practical workflow for new art

1. Add or update the card row in admin (set cards UI) with `imageUrl` set to the **object key** (e.g. `my-set/card-001.png`) or full URL if served elsewhere.
2. Upload the binary to the same R2 bucket/path your public host expects so the resolved URL returns `200`.
3. After bulk data or release workflows, bump the published catalog as your process requires (`Release catalog` in admin runs the Convex `releaseCards` mutation for published metadata).

When automated R2 uploads are added, replace manual steps 2–3 with the pipeline’s upload + invalidation rules and keep this note aligned with env vars and bucket names.
