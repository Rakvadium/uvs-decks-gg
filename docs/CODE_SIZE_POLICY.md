# Code size policy — tcg-decks

## Intent

Authored TypeScript in `src/` and `convex/` should stay **small enough to read in one sitting** and **easy to split** when they grow. A practical target is **125 logical lines** per file: non-blank lines that are not line comments (`//`) and not inside block comments (`/* … */`). This matches the spirit of ESLint `max-lines` with `skipBlankLines` and `skipComments` if you enable it later.

## Primary enforcement: structure

Before debating line counts, apply **[component-architecture-playbook.md](./component-architecture-playbook.md)**:

- Thin **`page.tsx`** (or route file) re-exporting feature **`content.tsx`**.
- **`hook.ts`** for state and effects; **`context.tsx`** when sharing across a subtree.
- **Sibling presentational files** instead of one mega-component.

Convex modules should split **queries, mutations, and helpers** rather than growing a single kitchen-sink file; keep **`api.*` paths** stable when refactoring.

## Optional automation

This repository may not yet ship a `check:lines` script. When you add one, document the command here and wire it into CI. Until then, use **review discipline** and the playbook when touching large files.

## Exemptions (typical)

| Path / kind | Reason |
| --- | --- |
| `convex/_generated/**` | Convex codegen |
| `src/components/ui/**` | Third-party-style primitives |
| `*.config.{mjs,ts,js}` | Tooling configuration |

## Inventory

When you run or add a line-count audit, record the date and approximate count of files over the target here so refactors can be prioritized.

| Date | Files over target (approx.) | Notes |
| --- | --- | --- |
| — | — | Populate after first audit |

## See also

- [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)
- [BACKLOG.md](./BACKLOG.md)
