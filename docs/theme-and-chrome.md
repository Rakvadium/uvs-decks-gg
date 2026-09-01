# Appearance: mode, color, and chrome

How **appearance mode**, **color palettes**, and **chrome** combine at runtime and where they are persisted.

## Three axes

| Axis | Meaning | Persistence |
| ---- | ------- | ----------- |
| **Mode** | `light`, `dark`, or `system` (`sessions.theme`) | User session |
| **Color** | A named **preset** or **custom** primary/secondary pairs per light/dark (`sessions.colorSource`) | User session |
| **Chrome** | Density, radius, typography, shadows, neon affordances (`sessions.chrome`) | User session |

Changing one axis does not change the others. **Custom** colors can optionally override per chrome via `colorSource.custom.byChrome`.

## DOM contract

`ColorSchemeProvider` (`src/providers/ColorSchemeProvider.tsx`) mirrors session state on `document.documentElement`:

- **`data-color-theme`** — preset id (`default`, `calm-storm`, …) or `custom` when `colorSource.kind === "custom"`.
- **`data-chrome`** — `calm` \| `expressive` \| `holoterminal` \| `bubblegum` \| `darkmatter`.
- **`class dark`** when the **resolved** mode is dark (explicit dark or system matching prefers-color-scheme).

Light/dark also sets **`color-scheme`** on the root for native form controls.

Legacy **`data-color-scheme`** is not used.

## Defaults

Until Convex returns a session row, the client uses **system** mode, **Calm** chrome, and the **Default** preset (`data-color-theme="default"`). Signed-out visitors get the same first paint via `layout.tsx` on `<html>`.

## Color presets (CSS)

Palette-only styles live under `src/styles/themes/*.css`, scoped with `html[data-color-theme="…"]` and `html[data-color-theme="…"].dark`. They define semantic color variables only (no radius/shadow/tracking owned by chrome).

Presets include **Aurora**, **Sorbet**, and **Singularity** as the color layers that used to ship with holoterminal-, bubblegum-, and darkmatter-style bundles; chrome ids are separate.

## Chrome (CSS)

Structural and “feel” tokens live in `src/styles/base.css` (and related layers): radius scale, shadows, scrollbar chrome, badge/button/shell variables, FX gates, and so on. Chrome must not redefine core palette hues; expressive effects may reference **`var(--primary)`** so they track the active palette.

### Casing is chrome-owned

Text transform and letter spacing are never hardcoded at a call site. Two utilities read the chrome tokens:

| Utility | Tokens | Applies to |
| --- | --- | --- |
| `chrome-heading-case` | `--chrome-card-title-font`, `--chrome-heading-transform`, `--chrome-heading-letter-spacing` | `PageHeading`, `SectionHeading`, `DialogTitle`, `CardTitle`, raw `h1`–`h6` |
| `chrome-label-case` | `--chrome-label-transform`, `--chrome-label-letter-spacing` | `Button`, `Badge`, `Kicker`, `SegmentedControl`, eyebrow / meta labels, `.terminal-text`, `.data-label` |

Calm-family chromes resolve both to `none` (label spacing `0.01em`); expressive-family chromes resolve both to `uppercase` (heading `0.05em`, label `0.08em`). `uppercase`, `tracking-*` (other than `tracking-tight` on large display type), `font-mono`, and `font-display` classes are not used in `src/`. If a primitive ever needs a fixed casing regardless of chrome, it sets it inside the primitive, never at the call site.

### Status colors

`--success`, `--warning`, `--info` (+ `-foreground`) are defined once in `base.css` for light and dark and exposed as `bg-success`, `text-warning`, `border-info/40`, etc. Palettes may override them per `data-color-theme`. Use these instead of `green-*` / `amber-*` / `emerald-*` / `orange-*` for state. Domain colors (stat tint, symbol chips in `src/config/universus.ts`) are not status colors and keep their own maps.

### Floating chrome shadow

`--chrome-floating-shadow` / `--chrome-floating-shadow-focus` back `FloatingIslandCapsule`, `FLOATING_ACTION_PILL_CLASS`, and the floating rail buttons. Calm-family chromes fork the value by `.dark`; expressive-family chromes tint it with `--primary`.

## Control roles

Do not restyle `Button` at each call site. Pick a role primitive (these may wrap `Button` internally). Verbiage is contextual; size, radius, type, and casing come from chrome tokens.

| Role | Primitive / treatment | When |
| --- | --- | --- |
| Header primary | Filled `FloatingActionPill` | Opens a flow (New Deck, Edit). |
| Header secondary | Outline `FloatingActionPill` | Non-primary header action. |
| Context toggle | Distinct **off** vs **on** | Changes global edit context. Off: Set Active. On: Active. Not a dialog opener. |
| Dialog dismiss | Outline / ghost | Always **Close** (not Cancel). |
| Dialog commit | Filled primary | Create / Save / etc. |
| Dialog destroy | Destructive | Delete. |

Dialog field labels use `chrome-label-case` (or `Kicker`) so casing follows the chrome. Do not hardcode `uppercase` on labels.

Dialog panels, fields, and footer buttons use the same radius ladder as the rest of the app (`docs/UI_UX_DESIGN.md`): controls `rounded-md`, cards/panels `rounded-lg`. Do not invent a dialog-only radius.

Implementation sweep: GitHub #170. Font leftovers: #169.

## Custom colors

When `colorSource.kind === "custom"`, `data-color-theme` is **`custom`** and the provider injects a `<style id="appearance-custom-vars">` built from **`culori`**-backed semantic generation (`src/lib/theme/generateSemanticCssVars.ts`). Pairs resolve per active chrome (`resolve-appearance-custom.ts`).

## Hooks

- **`useColorScheme()`** — full appearance API: mode, chrome, presets, custom patchers.
- **`useTheme()`** — narrow helper: `theme`, `setTheme`, `resolvedTheme`, `toggleTheme` (flips resolved light/dark and persists an explicit preference), `isDark`.
- **`useChromeMode()` / `useChromeVariant()`** — active `ChromeVariant` (SSR-safe default `calm` outside the provider).

For neon-tinted or scanline-heavy UI forks in JS, prefer **`chromeHasNeonChrome`** and **`chromeUsesScanlines`** from `@/lib/theme` or `@/lib/theme/chrome-behavior` instead of comparing only to `"expressive"`.

## `data-fx` escape hatch

FX utility classes (glow text, `.scanlines`, holo shimmer) remain gated for calm chrome unless **`data-fx="on"`** is set on the root. See selectors in `base.css`.

## Migration

Legacy **`colorScheme`** + **`chromePreference`** rows are upgraded once via **`sessions.ensureAppearanceMigrated`** using `convex/lib/appearanceMigration.ts` (old holo/bubblegum/darkmatter *themes* become explicit chrome **plus** matching palette presets).

## Manual QA matrix (spot-check)

- Each **chrome** × each **preset** × **light** and **dark**: no missing CSS variables, no first-paint flash beyond normal hydration.
- **Custom** palette: buttons and sidebar readable; switch chrome and confirm colors follow overrides or fallback.
- **System** mode: toggle OS appearance and confirm the app tracks it.
- **Migration**: a user previously on holo/bubblegum/darkmatter should look the same after one load post-deploy.

## See also

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md) — client shell and providers
