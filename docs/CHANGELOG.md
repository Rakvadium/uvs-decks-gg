# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Fixed

- **Creator Program guest CTAs** — Signed-out Apply/Start Verification open the sign-up dialog with creator-apply framing instead of silent no-ops; dead View Creator Profile and See All Tools controls are removed.
  - **Context:** Issue #55 (duplicate #59). PR #83 landed the same fix on `master` only.
  - **Decisions:** No verification backend; signed-in apply scrolls to the verification path. Keep neon hero/CTA hierarchy and Back to Community (working destination).
  - **Files:** `src/components/community/creator-program/*`.

### Added

- **Product tour sizzle reel** — Fullscreen interactive feature tour at `/tour` with auto-advancing beats, keyboard controls, and a Home “Watch Tour” entry.
  - **Context:** Request for a web sizzle reel to showcase product features.
  - **Decisions:** Standalone route outside the app shell (no floating header); CSS feature stages instead of live screenshots; respects `prefers-reduced-motion`.
  - **Files:** `src/app/tour/page.tsx`, `src/components/tour/sizzle-reel/*`, `src/app/(app)/home/page.tsx`.

---

## Entry template (for agents)

Copy and fill when you complete work:

```markdown
### Changed (or Added / Fixed / Removed)

- **Short title** — One-line summary.
  - **Context:** Backlog id / issue / request.
  - **Decisions:** Trade-offs worth remembering.
  - **Files:** Notable paths.
  - **Follow-ups:** Optional.
```

