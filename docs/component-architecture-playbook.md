# Component Architecture Playbook

This document captures the architecture pattern used during the refactor pass so future features follow the same structure.

## Goals

- Keep components small and focused.
- Put business logic near the feature, not spread across parent trees.
- Avoid prop-drilling shared state/actions through many layers.
- Preserve stable import paths while refactoring internals.
- Make features easy for humans and agents to extend safely.

## Core Pattern

For non-trivial UI features, prefer a folder module with a stable wrapper export.

### Public entrypoint

- Keep the original file path as a compatibility wrapper.
- Re-export directly from the concrete implementation file (`content.tsx`, `view.tsx`, etc.).
- Avoid wrapper chains.
  - Good: `A.tsx -> folder/content.tsx`
  - Avoid: `A.tsx -> folder/index.ts -> folder/content.tsx`

Example:

- `src/components/decks/decks-view/create-dialog.tsx`
- Re-exports from `src/components/decks/decks-view/create-dialog/content.tsx`

### Module folder layout

Use only what is needed:

- `content.tsx`: top-level composed view for this feature.
- `hook.ts`: feature business logic and state transitions.
- `context.tsx`: shared model provider when multiple children need the same data/actions.
- `types.ts`: feature-specific types and prop contracts.
- Small presentational files: `header.tsx`, `actions.tsx`, `list.tsx`, `row.tsx`, etc.
- `index.ts`: optional barrel for true multi-export modules; do not require wrappers to hop through it.

## Business Logic Placement Rules

### Put logic in `hook.ts` when:

- It orchestrates async actions or mutations.
- It computes derived state from multiple inputs.
- It owns view state transitions.
- It wires event handlers with side effects.

### Put logic in `context.tsx` when:

- Several sibling/descendant components need the same model.
- Passing those values as props would create repeated plumbing.

### Keep in `content.tsx` only:

- Branching between top-level view states.
- Composition and layout concerns.
- Minimal glue code.

## Prop-Drilling Policy

Pass props when:

- Data is truly local to one child.
- The data is static/config-like.

Use context when:

- The same state/actions are threaded through 2+ levels.
- Many siblings read the same model fields.
- Handlers are repeatedly forwarded without transformation.

## Naming Conventions

- Provider: `FeatureProvider`
- Context hook: `useFeatureContext`
- Model hook: `useFeatureModel`
- Top-level component: `FeatureName`
- Variant components: explicit names like `EmptyState`, `ListView`, `StackedView`

## State and Effects Guidelines

- Prefer lazy `useState(() => initialValue)` for localStorage reads.
- Avoid synchronous `setState` in effects unless necessary.
- Keep effects for external sync, subscriptions, or cleanup.
- Prefer derived values with `useMemo` when expensive or repeated.

## Refactor Safety Rules

- Never break public import paths during internal splits.
- Keep wrappers and re-export in one hop to implementation files.
- Do not change behavior while restructuring unless explicitly intended.
- Keep existing CSS classes and visual behavior stable unless part of the task.
- Do not keep redundant export-only files when they add no API value.

## Validation Checklist (Required)

After each feature/module refactor:

1. Run targeted lint for touched files.
2. Run full typecheck.
3. Confirm no import path regressions.
4. Confirm wrapper entrypoint still exports the same public API.
5. Confirm there are no two-hop re-export chains (`wrapper -> index -> implementation`).

Commands:

```bash
npx eslint <touched files...>
npx tsc --noEmit
```

## Suggested Workflow for New Features

1. Start with one root `content.tsx` and a `hook.ts`.
2. If props start spreading across many children, add `context.tsx`.
3. Extract clearly isolated UI blocks into small files.
4. Keep feature-specific types in `types.ts`.
5. Add or keep a stable wrapper at the previous path.
6. Point that wrapper directly to implementation files.
7. Validate with lint and typecheck.

## Examples in Current Codebase

- `src/components/collection/collection-view/`
- `src/components/shell/shell-slot-provider/`
- `src/components/deck-details/deck-details-cards-content/`
- `src/components/gallery/decks-sidebar/deck-sidebar-item/`
- `src/components/universus/symbol-icon/`
- `src/components/decks/decks-view/content-states/`

## Anti-Patterns to Avoid

- Giant single-file components that mix layout, data orchestration, and handlers.
- Passing the same model/handlers through many intermediate components.
- Hiding behavior in unrelated parent components.
- Breaking existing import paths during structural refactors.
- Redundant two-hop export chains that only forward symbols.

## Decision Heuristic

If a component becomes hard to scan, hard to test, or has repeated prop plumbing, split it into:

- model (`hook.ts`)
- model distribution (`context.tsx`, if needed)
- rendering (`content.tsx` + focused fragments)

Keep each file focused on one reason to change.
