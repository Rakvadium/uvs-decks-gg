# UI and UX design — tcg-decks

## Principles

- **Progressive disclosure** — Deck and collection tools should surface the next action clearly without crowding primary canvases.
- **Consistent shell** — App chrome, mobile sheets, and sidebars should behave predictably across routes (`src/components/shell/`).
- **Accessible controls** — Prefer Radix-backed primitives; preserve focus order and semantics in custom widgets.
- **Performance** — Large lists (cards, deck rows) should use windowing or pagination patterns where needed; avoid unnecessary client subscriptions.

## Implementation alignment

- **Composition:** Follow [component-architecture-playbook.md](./component-architecture-playbook.md) so dialogs, panels, and pages stay small and testable.
- **Theming:** Session-backed theme and palette preferences should remain coherent with `next-themes` and existing color scheme tokens.

## Border ladder

Use structural `border-border/*` only at these steps:

| Role | Class |
|------|--------|
| Hairline divider | `border-border/30` |
| Mid divider / inset split | `border-border/40` |
| Default surface | `border-border/50` |
| Dashed empty / placeholder | `border-border/80` |

Interactive form and toolbar controls use `--control-dual-border` / `--control-dual-border-strong` (see `src/app/globals.css`), not structural opacities. Keep semantic borders (`border-primary/*`, destructive) and `--chrome-*-border*` theme tokens as-is.

## Surface opacity ladder

Prefer these steps for translucent fills:

| Role | `bg-card` | `bg-background` | `bg-muted` |
|------|-----------|-----------------|------------|
| Tint / inset | `/30` | `/30` | `/20` |
| Soft panel | `/50` | `/50` | `/50` |
| Elevated panel | `/80` | `/80` | `/60` |
| Near-opaque overlay | `/95` | `/95` | `/80` |

Solid tokens (`bg-card`, `bg-background`, `bg-muted`) remain valid when no translucency is needed.

## Elevation

Prefer theme/chrome tokens over ad-hoc `rgba`/`hsl` shadows:

- Low: `shadow-[var(--chrome-elevation-low)]` or `shadow-xs` / `shadow-sm`
- Mid: `shadow-[var(--chrome-elevation-mid)]` or `shadow-md` / `shadow-lg`
- Component-specific: `--chrome-card-shadow*`, `--chrome-popover-shadow`, `--chrome-search-field-shadow*`, button/badge chrome shadows

Do not use `hsl(var(--border)…)` — theme borders are oklch via `var(--border)`.

## Radius

| Role | Class |
|------|--------|
| Controls / inputs | `rounded-md` |
| Cards / panels | `rounded-lg` |
| Large feature surfaces | `rounded-xl` |
| Hero / marketing shells | `rounded-3xl` |
| Pills / avatars | `rounded-full` |

Avoid one-off `rounded-[Npx]` except micro geometry (e.g. tooltip arrows).

## Z-index stack

| Layer | Class |
|-------|--------|
| Local stacking | `z-10` / `z-20` |
| Sticky headers | `z-30` |
| Shell chrome | `z-40` |
| Modal / sheet baseline | `z-50` |
| In-dialog floating controls | `z-[60]` |
| Skip link / dialog chrome / hover preview | `z-[100]` |
| Popovers | `z-[200]` |
| Select menus | `z-[300]` |
| Nested dialog overlay / content | `z-[400]` / `z-[410]` |
| Media dock | `z-[500]` |
| Drag preview | `z-[600]` |

## Motion

- Prefer `transition-colors`, `transition-opacity`, `transition-transform`, or an explicit property list — not `transition-all`.
- Durations: `duration-150` for hover/chrome feedback; `duration-200` for controls.

## Label type

Meta / eyebrow labels: `text-[10px] font-mono uppercase tracking-[0.18em]` (or `tracking-widest` on badges). Avoid `text-[7px]`–`text-[9px]` and one-off tracking values (`0.2em`, `0.22em`, …) unless a chrome heading token applies.

## Backdrop

Default frosted chrome: `backdrop-blur-sm`. Use `backdrop-blur-md` / `xl` only for full-screen or floating overlays.

## Related

- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [floating-header-islands.md](./floating-header-islands.md) for page header slot semantics
- [features/community/TierListSystem.md](./features/community/TierListSystem.md) for community-specific UX rules
