# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under **`[Unreleased]`**, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Added

- Documentation hub under `docs/` mirroring the `_reference/docs` structure: product vision, system analysis, architecture plan, backlog, changelog, agent workflows, code size policy, and orchestration references; integrated [component-architecture-playbook.md](./component-architecture-playbook.md) as the primary UI structure guide.
- **CALM-001 — `data-chrome` on document root** — Maps each color scheme to `calm` or `expressive` in `ColorSchemeProvider` alongside existing `data-color-scheme` behavior.
  - **Context:** Backlog CALM-001.
  - **Files:** `src/providers/ColorSchemeProvider.tsx`.
- **CALM-002 — Theme and chrome doc** — [theme-and-chrome.md](./theme-and-chrome.md) centralizes scheme→chrome rules and how to add schemes.
  - **Context:** Backlog CALM-002.
- **P-001 — System analysis refresh** — SYSTEM_ANALYSIS documents theme attributes and playbook-style feature folders; links theme/smoke docs.
  - **Context:** Backlog P-001.
- **P-002 — Smoke checklist** — [smoke-checklist.md](./smoke-checklist.md) lists `bun run build`, `bun run lint`, and manual critical routes.
  - **Context:** Backlog P-002.
- **CALM-003 — Chrome CSS layers** — `chrome-calm` / `chrome-expressive` layers in `src/styles/base.css` with semantic `--chrome-*` variables; scrollbar uses those tokens.
  - **Context:** Backlog CALM-003.
  - **Files:** `src/styles/base.css`, `docs/theme-and-chrome.md`.
- **CALM-004 — Session chrome preference** — Convex `sessions.chromePreference`, provider resolution + context setters, Settings control (Auto / Calm / Expressive).
  - **Context:** Backlog CALM-004.
  - **Files:** `convex/schema.ts`, `convex/validators.ts`, `convex/sessions.ts`, `src/providers/ColorSchemeProvider.tsx`, `src/lib/theme.ts`, `src/app/(app)/settings/page.tsx`, `docs/theme-and-chrome.md`.
- **CALM-005 — New-user theme defaults** — Documented: client fallbacks use holoterminal + dark theme + `chromePreference` auto until a session row exists; no onboarding change required for this pass.
  - **Context:** Backlog CALM-005.
  - **Files:** `docs/theme-and-chrome.md`.
- **CALM-006 — Typography primitives** — `PageHeading`, `SectionHeading`, `Kicker` in `src/components/ui/typography-headings.tsx` using chrome heading CSS variables.
  - **Context:** Backlog CALM-006.
- **CALM-007 — Shell headings** — Brand, mobile header, nav admin label, expanded panel title, mobile slot grid labels use typography primitives.
  - **Context:** Backlog CALM-007.
- **CALM-008 — Gallery headings** — Stats, empty state, loading strings, filter dialog header use typography primitives.
  - **Context:** Backlog CALM-008.
- **CALM-009 — Decks / deck details headings** — Deck database heading, grid meta titles, details meta/top bar, stack/list group labels use typography primitives.
  - **Context:** Backlog CALM-009.
- **CALM-010 — Community headings** — Shared section header, rankings, tier list UI, media feed, creator program, labs/toolkit sections use typography primitives.
  - **Context:** Backlog CALM-010.
- **CALM-011 — Card details titles** — Modern and original `CardDetailsTitleSection` plus v2 layout card name use `SectionHeading`; screen-reader `DialogTitle` unchanged.
  - **Context:** Backlog CALM-011.
- **R-001 — Large component inventory** — [orchestration/large-component-inventory.md](./orchestration/large-component-inventory.md) lists largest App Router pages and heavy dialogs for playbook-sized splits.
  - **Context:** Backlog R-001.
- **CALM-012 — Button chrome shadows** — Button variants use `--chrome-button-shadow-*` tokens in `base.css`; calm uses neutral elevation, expressive keeps glow.
  - **Context:** Backlog CALM-012.
- **CALM-013 — Calm CTA policy** — Replaced `Button variant="neon"` with `default`/`outline` on decks auth/empty, deck-details empty, gallery sidebar empty, home (not creator program).
  - **Context:** Backlog CALM-013.
- **CALM-014–016 — Badge tones** — `Badge` gains `tone` API + `--chrome-badge-*` tokens; migrated cyber→entity and neon→signal across app.
  - **Context:** Backlogs CALM-014, CALM-015, CALM-016.
- **CALM-017–018 — Card / Surface** — `Card variant="fx"|"quiet"`, `Surface` alias, tokenized shadows; `CardTitle`/`CardDescription` use chrome typography vars.
  - **Context:** Backlogs CALM-017, CALM-018.
- **CALM-019 — Community hub sections** — `community-view/content.tsx` uses `Surface` + chrome elevation instead of hardcoded heavy shadows.
  - **Context:** Backlog CALM-019.
- **CALM-020 — Input focus** — `Input` uses `--chrome-focus-*` tokens; default typography is sans.
  - **Context:** Backlog CALM-020.
- **CALM-021 — Popover tokens** — `Select` + `DropdownMenu` content use `--chrome-popover-shadow` / `--chrome-popover-border`.
  - **Context:** Backlog CALM-021.
- **CALM-022 — GallerySearchField** — Shared `GallerySearchField` + `--chrome-search-field-*`; gallery top bar + tier lists top bar.
  - **Context:** Backlog CALM-022.
- **CALM-023 — Filter dialog tiles** — `--chrome-filter-*` tokens; header icon well + selected filter tiles calm vs expressive.
  - **Context:** Backlog CALM-023.
- **CALM-024–026 — Overlays / sheets** — Tooltip + dialog title chrome vars; draggable drawer + auth-guard use `--chrome-sheet-*`.
  - **Context:** Backlogs CALM-024, CALM-025, CALM-026.
- **CALM-027–030 — Globals + card frame** — Scrollbar hover/solid tokens; FX utilities gated by `data-chrome` / `data-fx`; card image + frame glow CSS vars.
  - **Context:** Backlogs CALM-027–CALM-030.
- **CALM-044–045 — Community follow-ups** — Marked done: tier list shared search + prior headings/badges work satisfies scope.
  - **Context:** Backlogs CALM-044, CALM-045.
- **CALM-031–033 — Shell chrome** — `--chrome-shell-*` for sidebar wash, nav/rail active states, brand, deck slot label, avatar ring.
  - **Context:** Backlogs CALM-031–CALM-033.
- **CALM-034–037 — Home / settings / decks** — Page background + hero wash vars; decks heading + grid chrome tokens.
  - **Context:** Backlogs CALM-034–CALM-037.
- **CALM-038–043 — Remaining flows** — `useChromeMode()` on context; card-details original polish; media/creator FX gating verified; deck/gallery tokens consolidated per sub-agent report.
  - **Context:** Backlogs CALM-038–CALM-043.
- **CALM-047–049 — QA docs** — [glow-regression-checklist.md](./orchestration/glow-regression-checklist.md), [calm-a11y-perf-notes.md](./orchestration/calm-a11y-perf-notes.md).
  - **Context:** Backlogs CALM-047–CALM-049.
- **CALM-046 — UI matrix** — Admin route `/admin/ui-matrix` for Button / Badge / Card chrome sampling.
  - **Context:** Backlog CALM-046.

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
