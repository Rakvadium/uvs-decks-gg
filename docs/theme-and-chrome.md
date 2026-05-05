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
