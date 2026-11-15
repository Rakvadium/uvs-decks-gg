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

Structural borders use only these steps. Write the named utility ([Named utilities](#named-utilities)):

| Role | Step | Class |
|------|------|-------|
| Hairline divider | `/30` | `border-hairline` |
| Mid divider / inset split | `/40` | `border-divider` |
| Default surface | `/50` | `border-surface` |
| Dashed empty / placeholder | `/80` | `border-placeholder` |

Interactive form and toolbar controls use `--control-dual-border` / `--control-dual-border-strong` (see `src/app/globals.css`), not structural opacities. Semantic borders (primary, destructive, …) stay on the [tone ladder](#tone-ladder) (`border-primary-soft` / `-strong`), not this structural one, and `--chrome-*-border*` theme tokens stay as-is.

## Surface opacity ladder

Translucent fills use only these steps. Write the named utility, `bg-{base}-{step}`:

| Role | Class | `card` | `background` | `popover` | `muted` |
|------|-------|--------|--------------|-----------|---------|
| Tint / inset | `bg-{base}-tint` | `/30` | `/30` | `/30` | `/20` |
| Soft panel | `bg-{base}-soft` | `/50` | `/50` | `/50` | `/50` |
| Elevated panel | `bg-{base}-elevated` | `/80` | `/80` | `/80` | `/60` |
| Near-opaque overlay | `bg-{base}-overlay` | `/95` | `/95` | `/95` | `/80` |

Solid tokens (`bg-card`, `bg-background`, `bg-popover`, `bg-muted`) remain valid when no translucency is needed.

## Tone ladder

Semantic tints of `{tone}` = `primary` | `secondary` | `accent` | `success` | `warning` | `info` | `destructive` use these steps only:

| Role | Step | Class |
|------|------|-------|
| Wash / hover fill | `/10` | `bg-{tone}-wash` |
| Selected fill / badge fill | `/20` | `bg-{tone}-selected` |
| Hover of a solid fill (filled buttons: rest `bg-{tone}`, hover `bg-{tone}-dim`) | `/90` | `bg-{tone}-dim` |
| Soft border | `/40` | `border-{tone}-soft` |
| Strong border / active | `/60` | `border-{tone}-strong` |
| Invalid / quiet ring | `/40` | `ring-{tone}-soft` |
| Active / focus ring | `/60` | `ring-{tone}-strong` |

Any other tone opacity (`/5`, `/8`, `/15`, `/25`, `/30`, `/35`, `/50`, `/70`, `/80`) is legacy; snap it when a file is touched (rules under [Named utilities](#named-utilities)). Hover states move one step up (`-wash → -selected`, `-soft → -strong`, solid → `-dim`).

## Status colors

State is expressed with semantic tokens, never Tailwind palette hues:

| State | Tokens | Primitives |
|-------|--------|------------|
| Success / ready / online | `success`, `success-foreground` | `Badge tone="success"`, `Alert variant="success"` |
| Warning / building / pending | `warning`, `warning-foreground` | `Badge tone="warning"`, `Alert variant="warning"` |
| Informational | `info`, `info-foreground` | `Badge tone="info"`, `Alert variant="info"` |
| Error / destructive | `destructive`, `destructive-foreground` | `Badge tone="destructive"`, `Alert variant="destructive"`, `Button variant="destructive"` |

Inline usage follows the tone ladder: `bg-warning-wash`, `border-warning-soft`, `text-warning`. Domain colors (card symbols, stat tints) live in `src/games/uvs/config.ts` and are not status colors.

Class strings carry no literal colours: no named `white` or `black` on any colour utility (`text-white`, `bg-black/60`, `border-white/10`, `ring-white`, `from-black`, `via-black/40`, `to-white`), and no `rgba(…)` or `#hex` inside an arbitrary value. They ignore the chrome and the palette. `design/no-literal-color` reports them, at error.

Over card art, video and a user's own colour, text and scrims stay light-on-dark in every theme. They read two tokens from `src/styles/base.css` instead of white and black:

| Token | Utility | Use |
|-------|---------|-----|
| `--scrim` | `bg-scrim/45`, `from-scrim via-scrim/40` | Dark gradient or fill behind text on art |
| `--on-scrim` | `text-on-scrim/70`, `border-on-scrim/10`, `ring-on-scrim/25` | Text, hairlines and pip rings on art or a domain colour |

On a themed surface use the theme tokens (`border-hairline`, `ring-border`, `text-foreground`) instead. A colour printed on the card itself, such as the Cyberpunk card face in `src/games/cyberpunk/components/card-text-frame.tsx`, stays literal behind an `eslint-disable-next-line design/no-literal-color -- printed card: …` comment on that line only.

## Surfaces and feedback

Pick the primitive by role. None of them takes a fill, border or radius from the call site. `className` sets layout and padding only.

| Role | Primitive | Recipe |
|------|-----------|--------|
| Top-level card on the page | `Card` | `bg-card-elevated border-surface rounded-surface`, chrome card shadow |
| Card that is itself a link or button | `Card fx` | Adds the chrome hover shadow, hover border and primary wash |
| Quiet grouping card | `Surface` | Same fill, low elevation |
| Inset panel inside a card, sidebar or dialog | `Panel` | `rounded-surface border-surface bg-card-tint`, with `asChild` for a `li`, `section` or link |
| One-line notice above content | `Banner` | `rounded-surface border-surface bg-muted-elevated`, `text-xs` |
| Nothing to show | `EmptyState` | `border-dashed border-placeholder bg-muted-tint rounded-surface`, slots `icon`, `title`, `description`, `action` |
| Waiting for data | `LoadingState` | Centred `Spinner` and optional label in muted text, `role="status"` |
| Spinner in a button or row | `Spinner` | `Loader2` with `animate-spin`, `size` `sm` / `md` / `lg`, takes the text colour around it |
| Placeholder shape | `Skeleton` | `bg-muted animate-pulse rounded-md`, the one skeleton tone |

`Card` and `Surface` are static. Hovering a card changes nothing unless the whole card is interactive and passes `fx`. `EmptyState` takes `variant` `page` (a page or tab), `panel` (a section, the default) or `inline` (a sidebar list or picker). The variant sets padding and type size only.

Badges and chips:

| Role | Primitive | Notes |
|------|-----------|-------|
| Read-only tag | `Badge` | `size` `sm` (`h-5`, 10px), `md` (default) or `lg` (`--control-h-sm`, `rounded-island`, header chips). Static unless `interactive` |
| Badge that is itself a trigger | `Badge interactive` | Adds the tone's hover border and shadow |
| Count bubble on a tab, rail or filter button | `CountBadge` | `count`, `max` (default 99, then 99+), `tone` `primary` / `soft` / `muted` |
| Toggle or removable filter pill | `Chip` | `Button` outline `sm`, `rounded-full`. `selected` reads the `--selected-*` role tokens |

`bun run design:codemod --surfaces <path>` moves call-site Badge `text-[10px]`/`h-5` onto `size="sm"` and `h-8` onto `size="lg"`, turns muted `animate-pulse` divs into `Skeleton`, and turns `Loader2 animate-spin` into `Spinner`.

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
| Pills / avatars | `rounded-full` |

Avoid one-off `rounded-[Npx]` except micro geometry (e.g. tooltip arrows). Dialogs use this same ladder — panel `rounded-lg`, fields and footer buttons `rounded-md` — not a one-off dialog radius.

Bare `rounded` and `rounded-sm` are off-ladder: `rounded` is a static 4px that ignores the chrome `--radius`, so it drifts from every other control. Badges and tooltips are `rounded-md`. Segmented controls, tabs and option tiles are `rounded-control`. Buttons take their radius from `shape` ([Buttons](#buttons)).

`rounded-2xl` and larger are off-ladder too. Use `rounded-surface` or `rounded-xl`. Corner-only forms such as `rounded-tl-lg rounded-br-lg` hand-build a notch shape; round every corner instead. Side forms such as `rounded-t-xl` are fine. `design/radius-ladder` reports all of these.

## Role tokens

Each chrome sets 12 role tokens in `src/styles/base.css`. Components move onto them from the next parity PRs on, and the `/design` page (Radius & elevation, Role tokens) shows their live values.

| Token | Role | Calm value | Overrides |
|-------|------|------------|-----------|
| `--radius-control` (`rounded-control`) | Buttons, inputs, toggles | `calc(var(--radius) - 2px)`, same as `rounded-md` | None |
| `--radius-surface` (`rounded-surface`) | Cards, panels, popovers, dialogs | `var(--radius)`, same as `rounded-lg` | None |
| `--radius-cta` (`rounded-cta`) | Primary call to action | `9999px` | Bubblegum and holoterminal: `var(--radius)` |
| `--radius-island` (`rounded-island`) | Floating islands, capsules, header pills | `9999px` | Bubblegum and holoterminal: `var(--radius)` |
| `--control-h-xs`, `-sm`, `-md`, `-lg` | Control heights | `28px`, `32px`, `40px`, `48px` | None |
| `--selected-bg` | Selected or active fill | `--accent` at the selected step (`/20`) | None |
| `--selected-border` | Selected or active border | `--accent` at the strong step (`/60`) | None |
| `--selected-fg` | Selected or active text and icon | `var(--accent)` | None |
| `--hover-bg` | Hover fill | `--accent` at the wash step (`/10`) | None |

Inside one chrome, `--radius-cta` and `--radius-island` hold one value. The selected and hover tokens derive from `--accent` only, so custom palettes follow them. `tests/role-tokens.test.ts` checks every chrome against this table.

## Buttons

`Button` reads its height and radius from the role tokens, so a call site never passes `h-*`, `w-*`, `size-*` or `rounded-*`. The same holds for `Badge`, `Input` and `SelectTrigger`. `design/primitive-geometry` reports `h-*`, `size-*` and `rounded-*` (role radii included) in the `className` of any of the four. A raw `<button>` that sets `className` must include a `focus-visible:` class, and `design/button-focus` reports one that doesn't.

| `size` | Height | Icon twin |
|--------|--------|-----------|
| `xs` | `--control-h-xs` (28px) | `icon-xs` |
| `sm` | `--control-h-sm` (32px) | `icon-sm` |
| `md` (default) | `--control-h-md` (40px) | `icon` |
| `lg` | `--control-h-lg` (48px) | `icon-lg` |

| `shape` | Radius | Use |
|---------|--------|-----|
| `control` (default) | `rounded-control` | Every in-page button |
| `cta` | `rounded-cta` | The primary call to action |
| `island` | `rounded-island` | Floating header pills (set by `FloatingActionPill`) |

Every variant keeps `chrome-label-case` and its `--chrome-button-shadow-*` hooks. To move old overrides onto the ladder, run `bun run design:codemod --buttons <path>`. It snaps an override height to the nearest step, a tie going to `md`, and drops radius overrides. It lists corner-notch radii and computed classes for a person to judge.

### Floating header

Every floating header element is one island element: `rounded-island`, height `--control-h-md`, an opaque `--background` fill and the gradient ring in its 1px border (`floatingIslandSurfaceClassName` in `src/components/shell/floating-island.tsx`). Capsules, the back pill, the tabs pill, the search capsule and `FloatingActionPill` all use it, so one chrome gives them one radius and one height.

`FloatingActionPill` takes `default`, `secondary`, `destructive` or `floating`. `floating` is the secondary action on the island fill. Outline and ghost pills don't compile, because content scrolls under the header.

## Selected state and toggles

Every selected or active state reads the selected role tokens through the Tailwind variable shorthand: `bg-(--selected-bg)`, `border-(--selected-border)` and `text-(--selected-fg)`. Idle hover on a selectable item reads `hover:bg-(--hover-bg)`. Never write `bg-primary/*` or `bg-accent/*` for selection. The tokens follow the accent, so a custom palette moves every selected state at once.

| Need | Primitive | Selected state |
|------|-----------|----------------|
| Sidebar nav item, right rail button | `SHELL_NAV_ITEM_ACTIVE`, `SHELL_RAIL_ITEM_ACTIVE` in `src/components/shell/shell-chrome.ts` | Fill, border and text from the selected tokens |
| Header tabs on the floating bar | `FloatingTabsPill` | Fill and text. Items are `--control-h-sm` tall and stay `rounded-island` inside the island |
| In-content toggle, one choice | `SegmentedControl` with `value` and `onValueChange` | Fill and text |
| In-content toggle, several choices | `SegmentedControl` with `values` and `onToggle` | Fill and text |
| Tabbed panels with arrow-key focus | `Tabs`, `TabsList`, `TabsTrigger` | Fill and text |
| Selectable card, chip or list row | `OptionTile` (`variant` `outline` or `ghost`) | Fill, border and text |

`SegmentedControl` `size` is `xs`, `sm` or `md` (default) and sets the height from `--control-h-xs`, `-sm` or `-md`. `TabsList` is `--control-h-md`. Both use `rounded-control`. Call sites don't override their height or background. `OptionTile` owns its radius, border, fill and focus ring, so the call site sets layout and padding only. Every one of these primitives has a `focus-visible:` ring.

## Overlays

Every overlay draws one of two surfaces, so a chrome changes them all at once.

| Surface | Class | Used by |
|---------|-------|---------|
| Dialog | `dialogSurfaceClassName` in `src/components/ui/dialog.tsx`: `bg-card-overlay` with the primary/secondary wash, `border-primary-soft`, `shadow-lg`, `rounded-surface` from `md` (`sm` for AlertDialog) | `DialogContent`, `AlertDialogContent` |
| Popover | `popoverSurfaceClassName` in `src/components/ui/popover.tsx`: `rounded-surface`, `bg-popover-overlay` with `backdrop-blur-lg`, the `--chrome-popover-border` border and `--chrome-popover-shadow` | `PopoverContent`, `HoverCardContent`, `SelectContent`, `DropdownMenuContent`, `DropdownMenuSubContent`, the gallery filter panel |

Call sites pass layout (width, padding) only, never a radius, background, border or shadow.

**Dialog anatomy.** Every dialog has the X close (top right) and a `DialogCancel` in its footer beside the commit button. `DialogCancel` is an outline `Button` at the default size that closes the dialog, so footers match everywhere. A view-only dialog passes `<DialogCancel>Close</DialogCancel>`. `DialogTitle` and `AlertDialogTitle` share `dialogTitleClassName`, which carries `chrome-heading-case`. Only full-bleed layouts that draw their own header (filter dialog, card details, character and legend pickers) set `showCloseButton={false}`.

**Confirms.** `AlertDialog` shares the Dialog surface, X close and title. A destructive confirm (delete deck, delete tier list) passes `variant="destructive"` to `AlertDialogAction`. A destructive row action, such as a team Remove, uses `destructiveOutline`. Neither ever uses the primary fill or the accent hover.

**Create flows.** `CreateEntityDialog` (`src/components/ui/create-entity-dialog.tsx`) is the one create dialog: icon header, a required name field, extra fields as children, then Cancel and a submit that stays disabled until the name has text. Decks, tier lists and teams use it.

**Icon actions.** `IconToolbarButton` (`src/components/ui/icon-toolbar-button.tsx`) is `Button size="icon-xs"` with a required `label` (its `aria-label`), the `--hover-bg` hover and the selected tokens when `active`. It is the close for Dialog, AlertDialog, Sheet and the right side panel, and the gallery island's toolbar icons pass `shape="island"`.

## Z-index stack

| Layer | Value | Class |
|-------|-------|-------|
| Local stacking | `10` / `20` | `z-10` / `z-20` |
| Sticky headers | `30` | `z-sticky` |
| Shell chrome | `40` | `z-shell` |
| Modal / sheet baseline | `50` | `z-modal` |
| In-dialog floating controls | `60` | `z-dialog-float` |
| Skip link / dialog chrome / hover preview | `100` | `z-chrome` |
| Popovers, tooltips | `200` | `z-popover` |
| Select menus, dropdown menus | `300` | `z-select` |
| Nested dialog overlay / content | `400` / `410` | `z-nested-overlay` / `z-nested-dialog` |
| Media dock | `500` | `z-dock` |
| Drag preview | `600` | `z-drag` |

## Named utilities

The border, surface, tone and z-index ladders above ship as named Tailwind utilities in `src/styles/system/ladders.css` (imported from `src/app/globals.css`). This table maps each legacy class to its name; it lists the same steps as the ladder tables. Each name aliases one step, so it emits the same CSS as the class it replaces and works with any variant (`hover:`, `focus-visible:`, `dark:`, `group-hover:`, `data-[…]:`, `md:`). Write the name, not the opacity class.

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

**No named form.** Keep the raw class for gradient stops (`from-primary/10`), side-only border colors (`border-y-border/50`), and bases outside the ladders (`muted-foreground`, `foreground`, `ring`, `bg-border`). Use a ladder number (`/10` `/20` `/30` `/40` `/50` `/60` `/80` `/90` `/95`), and when snapping a border or control edge, pick the step that keeps or improves its contrast (for example the dark checkbox border went `/55` → `/60`, not `/50`).

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
