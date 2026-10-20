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

## Primary opacity ladder

Semantic tints of `primary` (and `secondary` / `accent`) use four steps only:

| Role | Class |
|------|--------|
| Wash / hover fill | `bg-primary/10` |
| Selected fill / badge fill | `bg-primary/20` |
| Soft border | `border-primary/40` |
| Strong border / active ring | `border-primary/60` |

Off-ladder values (`/5`, `/8`, `/15`, `/25`, `/30`, `/35`, `/50`, `/70`, `/90`) are legacy and should be snapped to the nearest step when a file is touched. Hover states move one step up (`/10 → /20`, `/40 → /60`).

## Status colors

State is expressed with semantic tokens, never Tailwind palette hues:

| State | Tokens | Primitives |
|-------|--------|------------|
| Success / ready / online | `success`, `success-foreground` | `Badge tone="success"`, `Alert variant="success"` |
| Warning / building / pending | `warning`, `warning-foreground` | `Badge tone="warning"`, `Alert variant="warning"` |
| Informational | `info`, `info-foreground` | `Badge tone="info"`, `Alert variant="info"` |
| Error / destructive | `destructive` | `Badge tone="destructive"`, `Alert variant="destructive"`, `Button variant="destructive"` |

Inline usage follows the primary ladder: `bg-warning/10`, `border-warning/40`, `text-warning`. Domain colors (card symbols, stat tints) live in `src/config/universus.ts` and are not status colors.

## Elevation

Prefer theme/chrome tokens over ad-hoc `rgba`/`hsl` shadows:

- Low: `shadow-[var(--chrome-elevation-low)]` or `shadow-xs` / `shadow-sm`
- Mid: `shadow-[var(--chrome-elevation-mid)]` or `shadow-md` / `shadow-lg`
- Component-specific: `--chrome-card-shadow*`, `--chrome-popover-shadow`, `--chrome-search-field-shadow*`, button/badge chrome shadows
- Floating islands / pills / rail buttons: `shadow-[var(--chrome-floating-shadow)]` (+ `focus-within:shadow-[var(--chrome-floating-shadow-focus)]`). No `dark:` shadow forks at call sites — the token forks by mode.

Do not use `hsl(var(--border)…)` — theme borders are oklch via `var(--border)`.

## Radius

| Role | Class |
|------|--------|
| Controls / inputs | `rounded-md` |
| Cards / panels | `rounded-lg` |
| Large feature surfaces | `rounded-xl` |
| Hero / marketing shells | `rounded-3xl` |
| Pills / avatars | `rounded-full` |

Avoid one-off `rounded-[Npx]` except micro geometry (e.g. tooltip arrows). Dialogs use this same ladder — panel `rounded-lg`, fields and footer buttons `rounded-md` — not a one-off dialog radius.

Bare `rounded` and `rounded-sm` are off-ladder: `rounded` is a static 4px that ignores the chrome `--radius`, so it drifts from every other control. Buttons (all sizes), badges, tooltips, and segmented controls are `rounded-md`.

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

## Named utilities

The ladders above ship as named Tailwind utilities in `src/styles/system/ladders.css` (imported from `src/app/globals.css`). Each name aliases one step, so it emits the same CSS as the class it replaces and works with any variant (`hover:`, `focus-visible:`, `dark:`, `group-hover:`, `data-[…]:`, `md:`). Write the name, not the opacity class.

`{tone}` = `primary` | `secondary` | `accent` | `success` | `warning` | `info` | `destructive`.

| Old class | Named utility | Role |
|-----------|---------------|------|
| `bg-{tone}/10` | `bg-{tone}-wash` | Wash / hover fill |
| `bg-{tone}/20` | `bg-{tone}-selected` | Selected fill / badge fill |
| `bg-{tone}/90` | `bg-{tone}-dim` | Hover of a solid fill (filled buttons) |
| `border-{tone}/40` | `border-{tone}-soft` | Soft border |
| `border-{tone}/60` | `border-{tone}-strong` | Strong border / active |
| `ring-{tone}/40` | `ring-{tone}-soft` | Invalid / quiet ring |
| `ring-{tone}/60` | `ring-{tone}-strong` | Active / focus ring |
| `border-border/30` | `border-hairline` | Hairline divider |
| `border-border/40` | `border-divider` | Mid divider / inset split |
| `border-border/50` | `border-surface` | Default surface |
| `border-border/80` | `border-placeholder` | Dashed empty / placeholder |
| `bg-card/30` · `bg-background/30` · `bg-popover/30` · `bg-muted/20` | `bg-{base}-tint` | Tint / inset |
| `bg-card/50` · `bg-background/50` · `bg-popover/50` · `bg-muted/50` | `bg-{base}-soft` | Soft panel |
| `bg-card/80` · `bg-background/80` · `bg-popover/80` · `bg-muted/60` | `bg-{base}-elevated` | Elevated panel |
| `bg-card/95` · `bg-background/95` · `bg-popover/95` · `bg-muted/80` | `bg-{base}-overlay` | Near-opaque overlay |
| `z-30` | `z-sticky` | Sticky headers |
| `z-40` | `z-shell` | Shell chrome |
| `z-50` | `z-modal` | Modal / sheet baseline |
| `z-[60]` | `z-dialog-float` | In-dialog floating controls |
| `z-[100]` | `z-chrome` | Skip link / dialog chrome / hover preview |
| `z-[200]` | `z-popover` | Popovers, tooltips |
| `z-[300]` | `z-select` | Select menus, dropdown menus |
| `z-[400]` | `z-nested-overlay` | Nested dialog overlay |
| `z-[410]` | `z-nested-dialog` | Nested dialog content |
| `z-[500]` | `z-dock` | Media dock |
| `z-[600]` | `z-drag` | Drag preview |

`{base}` = `card` | `background` | `muted` | `popover`. Local stacking inside a component stays `z-10` / `z-20`.

**Snapping legacy values.** Use the nearest step for the same role, and round ties up. Fills: `/5`, `/8` → `-wash`; `/15`, `/25`, `/30`, `/50` → `-selected`; `/70`, `/80` → `-dim`. Borders and rings: `/20`, `/25`, `/30`, `/35` → `-soft`; `/50` → `-strong`. A hover moves one step up (`-wash` → `-selected`, `-soft` → `-strong`). A fill already at `-selected` has no step above it, so its hover moves the border instead.

**No named form.** Keep the raw class, at a ladder step, for gradient stops (`from-primary/10`), side-only border colors (`border-y-border/50`), and bases outside the ladders (`muted-foreground`, `foreground`, `ring`, `bg-border`).

**Overriding.** `tailwind-merge` (`cn`) treats the color names as colors, so a call-site `bg-*` or `border-*` still replaces a primitive's. It does not know the `z-*` names. Do not override a primitive's z-index from a call site until `cn` is extended to know them.

## Motion

Canonical ladder: [theme-chrome-guidelines.md](./theme-chrome-guidelines.md) § Motion. This app’s wiring:

| Role | Duration | What may change |
| --- | --- | --- |
| Hover / press / chrome feedback | `duration-150` | Color, opacity, `transform` |
| Controls (input, button, focus chrome) | `duration-200` | Color, border, background, `box-shadow` when the shadow token actually changes |
| Overlay enter / exit | primitive defaults (`duration-200` / `duration-300`) | Opacity + `transform` on dialogs, sheets, menus |

Prefer `transition-colors`, `transition-opacity`, `transition-transform`, or an explicit property list — not `transition-all` and not a bare `transition` class.

**Hover and press** are CSS: `hover:`, `group-hover:`, `active:`, wrapped in `motion-safe:` (and `motion-reduce:` when the resting state must be forced). Animate an inner span/icon, not the `Link` / `button` hit box. Framer Motion (`framer-motion/m` under `LazyMotion`) is for page intros, the tour reel, sidebar open/close, and overlay enter/exit — not a 4px hover nudge.

**One driver.** If JS writes `transform`, do not also `transition` `transform` on that node.

**Reduced motion.** CSS travel uses `motion-safe:` so it is correct on first paint. `usePrefersReducedMotion` (`useSyncExternalStore`) gates JS motion only and must not be the only gate on a hover. Chrome FX, pulses, scanlines, and `animate-pulse` are static under `prefers-reduced-motion` (see `src/styles/base.css`).

**Do not** hover-animate `width`, `height`, `padding`, `margin`, or `filter`; do not leave unused `transform` / `box-shadow` in a transition list; do not leave `will-change` on idle tiles; do not set `animation-delay` with no animation.

## Typography and casing

Casing and tracking are chrome-owned. Never write `uppercase`, `tracking-*` (except `tracking-tight` on large display type), `font-mono`, or `font-display` at a call site — the app ships one typeface (Outfit) and the chrome decides transform/spacing.

| Role | Primitive | Notes |
|------|-----------|-------|
| Page title | `PageHeading` (`size`: `sm` / `md` / `lg` / `hero`) | Default `md` = `text-2xl font-bold`. |
| Section title | `SectionHeading` (`size`: `xs` / `sm` / `md` / `lg` / `xl`) | Default `md` = `text-lg font-semibold`; community section headers use `lg`. |
| Eyebrow / meta label | `Kicker` (`size`: `meta` / `sm` / `md`, `tone`: `muted` / `primary` / `foreground`) | Default `sm` = `text-xs`, muted. `meta` = `text-[10px]`. |
| Raw element that must read as a heading | `chrome-heading-case` utility | Only when a primitive genuinely cannot be used. |
| Raw element that must read as a label | `chrome-label-case` utility | Same rule. |

Avoid `text-[7px]`–`text-[9px]`. Values that must never be transformed (set codes, numbers, usernames) opt out with `normal-case tracking-normal` on the leaf element.

See [theme-and-chrome.md](./theme-and-chrome.md) for the token table.

## Backdrop

Default frosted chrome: `backdrop-blur-sm`. Use `backdrop-blur-md` / `xl` only for full-screen or floating overlays.
- **Theming and styling:** Follow [theme-chrome-guidelines.md](./theme-chrome-guidelines.md) for token ownership, ladders (border, surface, elevation, radius, z-index, motion, type, backdrop), and authoring. Session-backed preferences and DOM attributes are in [theme-and-chrome.md](./theme-and-chrome.md).

## Related

- [theme-chrome-guidelines.md](./theme-chrome-guidelines.md) — portable theme / chrome / styling law
- [theme-and-chrome.md](./theme-and-chrome.md) — this app’s appearance wiring
- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [floating-header-islands.md](./floating-header-islands.md) for desktop page header slot semantics
- [mobile-shell.md](./mobile-shell.md) for mobile chrome slot semantics
- [features/community/TierListSystem.md](./features/community/TierListSystem.md) for community-specific UX rules
