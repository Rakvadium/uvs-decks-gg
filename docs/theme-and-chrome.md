# Theme, color scheme, and chrome mode

Single reference for how **color schemes** map to **`data-chrome`** on the document root and how to extend them.

## Runtime attributes

`ColorSchemeProvider` (`src/providers/ColorSchemeProvider.tsx`) updates `document.documentElement`:

- **`data-color-scheme`** — set to the active named scheme, or removed when the scheme is `default`.
- **`data-chrome`** — always `calm` or `expressive`. Determined by the user's **chrome preference** (stored on the `sessions` table as `chromePreference`). When the preference is `auto` (or missing), chrome is derived from `COLOR_SCHEME_CHROME_MAP`. When set to `calm` or `expressive`, that value is used directly regardless of color scheme.

Light/dark still uses the `dark` class and `color-scheme` on the same root element.

## Chrome preference

The `sessions` table stores an optional `chromePreference` field (`auto | calm | expressive`).

- **`auto`** (default) — chrome follows the color scheme map below.
- **`calm`** / **`expressive`** — overrides the map; `data-chrome` is set to the chosen value.

Users can change this in **Settings > Appearance > Chrome**.

**New or signed-out users:** Until Convex returns a session document, the client uses built-in fallbacks (holoterminal palette, dark theme, chrome preference treated as auto, so `data-chrome` follows the map). After sign-in, persisted `sessions` fields replace those defaults when present.

## Color scheme → chrome map

When adding a new `ColorScheme` value:

1. Add it to the `ColorScheme` union, `VALID_COLOR_SCHEMES`, `COLOR_SCHEMES` (UI list), and `COLOR_SCHEME_CHROME_MAP`.
2. Add a theme stylesheet under `src/styles/themes/<name>.css` and import it from `src/app/globals.css`.
3. Update this table.

| ColorScheme   | data-chrome  |
| ------------- | ------------ |
| `default`     | `calm`       |
| `calm-storm`  | `calm`       |
| `holoterminal`| `expressive` |
| `cyberpunk`   | `expressive` |
| `bubblegum`   | `expressive` |
| `caffeine`    | `expressive` |
| `darkmatter`  | `expressive` |

## CSS consumption

Semantic chrome tokens live in `src/styles/base.css` under layers `chrome-calm` and `chrome-expressive`. Components should prefer these variables over hard-coded glows so `data-chrome` can switch behavior without per-page forks.

Available variables: `--chrome-focus-ring-width`, `--chrome-focus-ring-color`, `--chrome-focus-shadow` (focus), `--chrome-elevation-low`, `--chrome-elevation-mid` (box-shadow elevation), `--chrome-heading-transform`, `--chrome-heading-letter-spacing` (heading typography), `--chrome-scrollbar-thumb`, `--chrome-scrollbar-thumb-hover`, `--chrome-scrollbar-thumb-hover-shadow`, `--chrome-scrollbar-thumb-solid`, `--chrome-scrollbar-track` (scrollbar). Calm scrollbar is a solid neutral color; expressive keeps the primary→secondary gradient with a glow on hover.
- Button variant shadows use `--chrome-button-shadow-{variant}` and `--chrome-button-shadow-{variant}-hover` variables (defined per-chrome in `base.css`). Calm uses neutral elevation; expressive preserves neon/glow character. `ghost`, `link`, and `cyber` variants have no shadow vars.
- Badge tone shadows use `--chrome-badge-{tone}-shadow` / `--chrome-badge-{tone}-shadow-hover` variables plus `--chrome-badge-signal-pulse` for signal animation (calm suppresses glow and pulse; expressive preserves neon character).

- Filter-dialog icon and selection glows use `--chrome-filter-icon-well-shadow`, `--chrome-filter-icon-drop-shadow`, `--chrome-filter-tile-shadow-selected`, `--chrome-filter-tile-shadow-selected-inset` (calm: flat/no glow; expressive: primary glow).
- Search fields use `--chrome-search-field-shadow` / `--chrome-search-field-shadow-focus` (calm: neutral elevation; expressive: primary glow); the `GallerySearchField` component's `appearance="quiet"` bypasses these vars for borderless/non-glow usage.
- Popover/dropdown surfaces use `--chrome-popover-shadow` / `--chrome-popover-border` (calm: neutral elevation via `--chrome-elevation-mid`; expressive: primary-tinted glow).
- Card accepts an optional `variant` prop (`"fx"` | `"quiet"`, default `"fx"`); `Surface` is a thin alias defaulting to `"quiet"`. Card-level shadows use `--chrome-card-shadow` / `--chrome-card-shadow-hover` / `--chrome-card-border-hover`; `CardTitle` font/transform use `--chrome-card-title-font` + `--chrome-heading-transform` + `--chrome-heading-letter-spacing`; `CardDescription` uses `--chrome-card-description-font` + `--chrome-card-description-tracking` (all defined per-chrome in `base.css`).

- Tooltip surface uses `--chrome-tooltip-shadow` / `--chrome-tooltip-border` (calm: neutral elevation + border; expressive: primary glow + primary-tinted border).
- Sheet/drawer chrome uses `--chrome-sheet-border` / `--chrome-sheet-shadow` (calm: neutral border + subtle elevation; expressive: primary-tinted border + primary glow).
- `DialogTitle` uses `--chrome-card-title-font` + `--chrome-heading-transform` + `--chrome-heading-letter-spacing` via inline style (calm: sans + normal case; expressive: display font + uppercase + wider tracking).

- Shell chrome (sidebars, icon rail, brand, nav, avatar) uses `--chrome-shell-sidebar-wash` (background gradient overlay), `--chrome-shell-icon-drop-shadow` (active icon filter), `--chrome-shell-nav-active-shadow` / `--chrome-shell-rail-active-shadow` (active item box-shadow), `--chrome-shell-brand-shadow` / `--chrome-shell-brand-shadow-hover` (brand logo), `--chrome-shell-rail-resize-shadow` / `--chrome-shell-rail-resize-shadow-hover` (resize handle), `--chrome-shell-deck-label-drop-shadow` (active deck header label), and `--chrome-shell-avatar-ring` (user menu avatar); calm strips glows to neutral elevation or `none`, expressive preserves neon primary/secondary character.

- Card details dialog navigation buttons use `--chrome-dialog-nav-shadow-enabled` / `--chrome-dialog-nav-border-enabled` (calm: neutral border + subtle elevation; expressive: primary glow + primary-tinted border).
- Card detail view image uses `--chrome-card-detail-image-shadow` (calm: neutral drop shadow; expressive: primary-tinted glow), `--chrome-card-detail-stat-bar-glow` (calm: none; expressive: currentColor glow). Keyword chips use `--chrome-keyword-chip-shadow` (calm: none; expressive: subtle color-tinted glow).
- Card image glow uses `--chrome-card-image-glow-rest` / `--chrome-card-image-glow-hover` (calm: subtle outline; expressive: primary+secondary colored glow). Consumed by `CardGridItemImageStage`, `DeckCardStackItem`, and `CardPreviewDialog` via `CARD_GLOW_REST` / `CARD_GLOW_HOVER` from `card-item/glow.ts`.
- Card grid frame halo uses `--chrome-card-frame-halo` (calm: transparent; expressive: gradient), `--chrome-card-frame-halo-hover-opacity`, `--chrome-card-frame-glow-rest` / `--chrome-card-frame-glow-hover` (calm: no glow; expressive: primary glow).

Preferred heading primitives: `PageHeading`, `SectionHeading`, and `Kicker` from `@/components/ui/typography-headings` — these consume the chrome heading tokens automatically.

- Page-level chrome uses `--chrome-page-hero-wash-opacity` (calm: `0`; expressive: `1`) to hide/show hero gradient blurs on the home page, `--chrome-page-bg` (calm: `none`; expressive: gradient) for outer page background (e.g. settings), `--chrome-page-status-dot-shadow` / `--chrome-page-heading-drop-shadow` for status-dot glow and heading text drop-shadow. Nav-card hover is controlled by `--chrome-page-nav-card-border-hover` / `--chrome-page-nav-card-shadow-hover` / `--chrome-page-nav-card-icon-drop-shadow` (calm: neutral border + elevation; expressive: primary glow).
- Decks view heading uses `--chrome-decks-heading-dot-shadow` / `--chrome-decks-heading-dot-animation` / `--chrome-decks-heading-blur` (calm: no shadow/pulse/blur; expressive: primary glow + pulse animation + blur backdrop).
- Deck grid items use `--chrome-deck-grid-border-hover` / `--chrome-deck-grid-shadow-hover` / `--chrome-deck-grid-accent-line` (calm: neutral border + elevation, accent lines hidden; expressive: primary-tinted border + glow shadow, accent lines visible). Deck content-state icon boxes use `--chrome-deck-state-icon-shadow` (calm: neutral elevation; expressive: primary glow).
- Deck details view uses `--chrome-deck-details-hero-border` / `--chrome-deck-details-hero-shadow` (hero panel card border and glow), `--chrome-deck-details-loader-drop-shadow` (loading spinner filter), `--chrome-deck-details-wash` (gradient wash behind deck layout), `--chrome-deck-details-list-item-shadow` (list-item row shadow), `--chrome-deck-details-sidebar-search-shadow` / `--chrome-deck-details-sidebar-search-shadow-focus` (gallery sidebar search input), `--chrome-deck-details-hover-preview-border` / `--chrome-deck-details-hover-preview-shadow` (hover card preview popup). Calm uses flat borders and neutral elevation; expressive preserves primary-tinted glows.
- Gallery loading/empty states use `--chrome-gallery-loading-shadow` / `--chrome-gallery-progress-bar-glow` (progress indicator), `--chrome-gallery-empty-icon-shadow` / `--chrome-gallery-empty-wash` (empty-state icon box and gradient wash), `--chrome-gallery-stats-dot-shadow` (ready dot glow). Calm strips glows; expressive preserves primary glow.

## `useChromeMode` hook

`useChromeMode()` from `@/lib/theme` (re-exported from `ColorSchemeProvider`) returns the effective `ChromeMode` (`"calm"` or `"expressive"`) from context. Falls back to `"calm"` when outside the provider (SSR-safe). Use it to conditionally apply FX classes or dynamic inline styles in components that need JS-level gating (e.g. `scanlines` in media feed, per-color keyword tooltip shadows).

## `data-fx` escape hatch

FX utility classes (`.text-glow-cyan`, `.text-glow-magenta`, `.text-glow-violet`, `.border-glow`, `.scanlines`, `.holo-shimmer`) are gated behind `:root:is([data-chrome="expressive"],[data-fx="on"])`. On **calm** they are no-ops by default — no text-shadow, no pseudo scanlines, no holo animation.

To force FX on regardless of chrome mode, set `data-fx="on"` on the root element:

```ts
document.documentElement.dataset.fx = "on";
```

Remove the attribute (or set it to any other value) to restore normal behavior.

## See also

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) — client shell and providers
- [BACKLOG.md](./BACKLOG.md) — CALM epic for calm vs expressive UI work
