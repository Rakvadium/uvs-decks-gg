# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under **`[Unreleased]`**, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Added

- Documentation hub under `docs/` mirroring the `_reference/docs` structure: product vision, system analysis, architecture plan, backlog, changelog, agent workflows, code size policy, and orchestration references; integrated [component-architecture-playbook.md](./component-architecture-playbook.md) as the primary UI structure guide.

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
