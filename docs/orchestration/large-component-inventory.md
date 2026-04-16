# Large route and dialog inventory (R-001)

Line counts are approximate (`wc -l`); use as a refactor radar, not a strict ranking. Target layouts follow [component-architecture-playbook.md](../component-architecture-playbook.md) (`content.tsx`, `hook.ts`, `types.ts`, small presentational files).

## App Router pages (largest first)

| Lines | Path | Suggested split |
| --- | --- | --- |
| ~395 | `src/app/(app)/settings/page.tsx` | `settings-page/content.tsx`, `hook.ts` for profile/theme state; keep `page.tsx` as thin shell |
| ~338 | `src/app/(app)/home/page.tsx` | `home-page/content.tsx`, `hook.ts`; extract hero / stats / CTA sections |
| ~248 | `src/app/(app)/layout.tsx` | Already structural; only split if it grows (shell providers vs chrome) |
| ~106 | `src/app/(app)/admin/import/page.tsx` | `import-page/content.tsx` when touched again |

Smaller route files already delegate to feature views.

## Heavy components (dialogs, sidebars, filters)

| Lines | Path | Suggested split |
| --- | --- | --- |
| ~348 | `src/components/universus/card-details/variants/v2.tsx` | `v2/header.tsx`, `v2/stats.tsx`, `v2/keywords.tsx`, keep `v2.tsx` as composer |
| ~344 | `src/components/gallery/main-content/card-preview-dialog.tsx` | `card-preview-dialog/content.tsx`, `hook.ts` |
| ~328 | `src/components/community/tier-lists/detail-view/top-bar.tsx` | `top-bar/content.tsx`, `top-bar/hook.ts` (mutations, edit state) |
| ~317 | `src/components/community/community-rankings-view/content.tsx` | Further extract table/list regions if file grows |
| ~301 | `src/components/shell/mobile-actions-sheet/draggable-drawer.tsx` | `draggable-drawer/gesture-hook.ts`, layout shell |
| ~288 | `src/components/ui/dropdown-menu.tsx` | Primitives library file; split only if customizing per CALM-021 |
| ~274 | `src/components/ui/search-bar.tsx` | Optional `search-bar/content.tsx` if feature logic appears |
| ~248 | `src/components/ui/field.tsx` | Form primitive; usually stays one file until CALM-020 |
| ~210 | `src/components/ui/dialog.tsx` | CALM-025 (title typography); keep single primitive unless huge |
| ~204 | `src/components/universus/card-details/dialog.tsx` | `dialog/content.tsx` for footer/nav if it grows |
| ~204 | `src/components/deck/shared/character-picker-dialog.tsx` | `character-picker-dialog/content.tsx` |

## Backlog follow-ups

Add scoped rows in [BACKLOG.md](../BACKLOG.md) when starting a split (one row per feature, not one mega-row for the whole table).
