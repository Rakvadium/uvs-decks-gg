# Theme, chrome, and styling guidelines

A self-contained appearance system. Copy this file as-is. App-specific wiring (provider names, persistence fields, preset lists, migrations) belongs in a separate implementation note — not here.

The goal is one rule: **components consume semantic tokens; themes and chrome supply those tokens.** Switching light/dark, palette, or chrome must never require editing feature UI.

## Three independent axes

Appearance is three knobs. Changing one must not rewrite the others.

| Axis | Meaning | Typical persistence | Typical DOM signal |
| --- | --- | --- | --- |
| **Mode** | Light, dark, or follow the OS | User preference | `class="dark"` on the root when the *resolved* mode is dark; also set `color-scheme` for native controls |
| **Color** | A named palette, or a custom primary/secondary pair that generates the rest | User preference | `data-color-theme="<preset-id\|custom>"` |
| **Chrome** | Structural *feel*: radius, density, shadows, type treatment, neon/scanline affordances | User preference | `data-chrome="<id>"` |

Do not ship “themes” that are secretly a palette *plus* a chrome bundled together. Users who want neon chrome with a quiet palette, or a loud palette with quiet chrome, should get that combination without a special-case stylesheet.

Custom colors may optionally override per chrome. That is a *color* override keyed by chrome id, not chrome owning hues.

## Token ownership

Each layer may set only its own tokens.

| Layer | Owns | Must not own |
| --- | --- | --- |
| **Palette** (`data-color-theme`) | Semantic hues: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, sidebar/chart equivalents | Radius, shadows, tracking, scrollbar shape, glow intensity, motion |
| **Chrome** (`data-chrome`) | Radius scale, elevation/shadows, heading transform/tracking, scrollbar treatment, component chrome (button/badge/card/popover/sheet/shell), FX gates | Core palette hues. Expressive effects may *reference* `var(--primary)` / `var(--secondary)` so they track the active palette |
| **Mode** | Which palette block is active (light vs `.dark`) | Chrome geometry |
| **Controls** (derived, usually on `html`) | Interactive borders, rings, and hover mixes built from palette tokens | One-off hex/rgb in components |

If a new visual needs a color, add or reuse a *palette* token. If it needs a shadow, radius, or glow, add or reuse a *chrome* token. Never invent a third place.

## Semantic color contract

Every palette (preset or generated custom) must define the same variables for both light and dark. Missing variables are a defect, not a fallback to another theme.

Minimum set:

- Surfaces: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--muted`, `--muted-foreground`
- Brand: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`
- Feedback: `--destructive`, `--destructive-foreground`
- Lines: `--border`, `--input`, `--ring`
- Chrome-adjacent surfaces: `--sidebar` and its foreground/primary/accent/border/ring pair
- Series: `--chart-1` … `--chart-5` when the product has charts

Rules:

- Store colors as **oklch** (or generate oklch). Do not write `hsl(var(--border)…)` against tokens that are already color values.
- Pair every fill with a foreground. `bg-primary` always has a readable `text-primary-foreground`.
- Custom palettes must generate the *same* semantic set from primary + secondary, including contrast repair for text on fills. Do not leave custom mode as “two hexes and hope.”
- Map semantic tokens into the utility layer once (`@theme` / design-token bridge). Components use `bg-card`, `text-muted-foreground`, `border-border` — not raw `var(--card)` unless a token has no utility.

## Chrome contract

Chrome is a complete substitute set of *feel* tokens. A new chrome id must assign every token the previous chromes assign. Partial chromes cause missing shadows, default radius jumps, and first-paint flashes.

Name tokens by **role**, not by look:

| Role | Token pattern | Why |
| --- | --- | --- |
| Elevation | `--chrome-elevation-low`, `--chrome-elevation-mid` | Shared lift for cards, popovers, sheets |
| Component chrome | `--chrome-button-shadow-*`, `--chrome-badge-*`, `--chrome-card-shadow*`, `--chrome-popover-shadow`, `--chrome-sheet-shadow`, `--chrome-search-field-shadow*` | One component, many chromes |
| Focus | `--chrome-focus-ring-*`, `--chrome-focus-shadow` | Focus must remain visible in every chrome |
| Type feel | `--chrome-heading-transform`, `--chrome-heading-letter-spacing`, `--chrome-card-title-font` | Uppercase / tracking is chrome, not a one-off class |
| Shell | `--chrome-page-bg`, `--chrome-shell-*` | App frame follows chrome without per-page CSS |
| FX intensity | glow/scanline/halo tokens that resolve to `none` in quiet chromes | Feature markup stays the same; chrome turns FX off |

Quiet chrome sets glow tokens to `none` or a near-invisible hairline. Loud chrome sets the same names to tinted glows that reference `var(--primary)`. Feature code always reads the token.

Prefer **capability helpers** in JS (for example `hasNeonChrome(chrome)`, `usesScanlines(chrome)`) over comparing to a specific chrome id. New chrome ids should not require a hunt through string compares.

### Control tokens

Structural borders and interactive borders are different jobs.

- **Structure** (cards, splits, empty states): stepped opacities of `--border` (see [Border ladder](#border-ladder)).
- **Controls** (inputs, selects, toolbars, outline buttons): derived mixes such as `--control-dual-border`, `--control-dual-border-strong`, `--control-dual-ring`, `--control-dual-surface-hover`. These track primary *and* secondary so dual-brand palettes stay coherent.
- **Semantic** (`border-primary/*`, destructive): keep as-is; they are meaning, not chrome.

Do not use structural opacities on form controls, and do not use control mixes as page dividers.

## Styling ladders

Finite steps beat one-off values. If a needed step is missing, add it to the ladder — do not invent `border-border/37` or `rounded-[13px]`.

### Border ladder

Use structural `border-border/*` only at these steps:

| Role | Step |
| --- | --- |
| Hairline divider | `/30` |
| Mid divider / inset split | `/40` |
| Default surface | `/50` |
| Dashed empty / placeholder | `/80` |

### Surface opacity ladder

Prefer these steps for translucent fills:

| Role | `bg-card` | `bg-background` | `bg-muted` |
| --- | --- | --- | --- |
| Tint / inset | `/30` | `/30` | `/20` |
| Soft panel | `/50` | `/50` | `/50` |
| Elevated panel | `/80` | `/80` | `/60` |
| Near-opaque overlay | `/95` | `/95` | `/80` |

Solid tokens (`bg-card`, `bg-background`, `bg-muted`) remain valid when no translucency is needed.

### Elevation

Prefer chrome elevation tokens over ad-hoc `rgba` / `hsl` shadows:

- Low: `shadow-[var(--chrome-elevation-low)]` or `shadow-xs` / `shadow-sm`
- Mid: `shadow-[var(--chrome-elevation-mid)]` or `shadow-md` / `shadow-lg`
- Component-specific: `--chrome-card-shadow*`, `--chrome-popover-shadow`, `--chrome-search-field-shadow*`, button/badge chrome shadows

### Radius

| Role | Step |
| --- | --- |
| Controls / inputs | `rounded-md` |
| Cards / panels | `rounded-lg` |
| Large feature surfaces | `rounded-xl` |
| Hero / marketing shells | `rounded-3xl` |
| Pills / avatars | `rounded-full` |

Avoid one-off `rounded-[Npx]` except micro geometry (tooltip arrows). Chrome may change `--radius`; the *roles* stay the same so a loud chrome can tighten or loosen the whole scale.

### Z-index stack

| Layer | Step |
| --- | --- |
| Local stacking | `z-10` / `z-20` |
| Sticky headers | `z-30` |
| Shell chrome | `z-40` |
| Modal / sheet baseline | `z-50` |
| In-dialog floating controls | `z-[60]` |
| Skip link / dialog chrome / hover preview | `z-[100]` |
| Popovers | `z-[200]` |
| Select menus | `z-[300]` |
| Nested dialog overlay / content | `z-[400]` / `z-[410]` |
| Persistent floating utility (media dock, command palette) | `z-[500]` |
| Drag preview | `z-[600]` |

New layers append to this table. Do not pick an unused integer because it “looked high enough.”

### Motion

- Prefer `transition-colors`, `transition-opacity`, `transition-transform`, or an explicit property list — not `transition-all`.
- Durations: `duration-150` for hover/chrome feedback; `duration-200` for controls.
- Honor `prefers-reduced-motion`: FX, pulses, and scanlines become static.

### Label type

Meta / eyebrow labels: `text-[10px]` (or the nearest type-scale step), `font-mono`, `uppercase`, `tracking-[0.18em]` (or `tracking-widest` on badges). Avoid `text-[7px]`–`text-[9px]` and one-off tracking (`0.2em`, `0.22em`, …) unless a chrome heading token applies.

### Backdrop

Default frosted chrome: `backdrop-blur-sm`. Use `backdrop-blur-md` / `xl` only for full-screen or floating overlays.

## Component consumption

Feature and primitive UI must stay palette- and chrome-agnostic.

**Do**

- Use semantic utilities (`bg-card`, `text-foreground`, `border-primary/40`) and `var(--chrome-*)` / `var(--control-*)`.
- Keep one markup path for all chromes. Quiet chrome zeroes FX tokens; loud chrome fills them.
- Put chrome-dependent type (uppercase headings, display font) on tokens applied in primitives, not in page copy.
- Gate decorative FX classes so they do nothing in quiet chrome unless an explicit escape hatch is on (`data-fx="on"`).

**Do not**

- Hardcode hex, `rgb`, or `hsl` in components.
- Branch JSX on a chrome id or palette id except through a named capability helper.
- Restyle a neighbor “to match” by copying a one-off shadow from a screenshot.
- Use `transition-all`, arbitrary radius, or a new z-index without updating the ladder.

## First paint

Until persisted preferences load:

1. The document root already has a complete default: mode (usually `system`), a default palette attribute, and a quiet chrome attribute.
2. Signed-out and first-visit users see that same default. Do not paint an unthemed frame and then swap.
3. When preferences arrive, update the root attributes only. Components should not remount.

Also set `color-scheme: light` / `dark` on the root so scrollbars and native inputs match.

## Effects

Decorative FX (glow text, scanlines, shimmer) are chrome, not content.

- Quiet chrome: FX utilities are no-ops.
- Loud chrome: the same class names activate.
- Escape hatch: a root flag (`data-fx="on"`) can enable FX on a quiet chrome for demos or accessibility previews. Default is off.

Do not attach FX with a one-off `style=` in a feature. If a surface needs glow, it needs a chrome token.

## Authoring

### Add a palette

1. Create a stylesheet scoped to `html[data-color-theme="<id>"]` and `html[data-color-theme="<id>"].dark`.
2. Assign the full semantic contract. No radius, shadow, or tracking.
3. Register the id in the preset list and the first-paint default only if it *is* the default.
4. Spot-check every chrome × light/dark (see [QA](#qa-matrix)).

### Add a chrome

1. Add a layer that selects `:root[data-chrome="<id>"]` (or a shared family selector).
2. Assign the full chrome contract. Reference palette tokens; do not redefine them.
3. If the chrome is a *shape* variant of a family (same FX, different radius/shadow language), layer it on the family instead of duplicating FX tokens.
4. Extend capability helpers if the new chrome has neon, scanlines, or other JS-visible behavior.
5. Confirm every existing component that reads `--chrome-*` still has a defined value.

### Add a token

1. Decide ownership (palette vs chrome vs control).
2. Name it by role (`--chrome-popover-shadow`, not `--purple-glow-7`).
3. Define it for **every** chrome or **every** palette before any component uses it.
4. Consume it in primitives first; features inherit.

## Persistence

Store the three axes as three fields (or one document with three keys). Do not store a single “theme id” that encodes palette+chrome.

Recommended shape:

```ts
type AppearancePreference = {
  mode: "light" | "dark" | "system";
  color:
    | { kind: "preset"; preset: string }
    | { kind: "custom"; custom: { light: Pair; dark: Pair; byChrome?: Partial<Record<string, { light: Pair; dark: Pair }>> } };
  chrome: string;
};

type Pair = { primary: string; secondary: string };
```

Migrate old bundled theme ids once, into an explicit chrome **plus** a matching palette preset. Do not keep reading the legacy field after migration.

## QA matrix

Spot-check before shipping appearance work:

- Each **chrome** × each **preset** × **light** and **dark**: no missing CSS variables, no first-paint flash beyond normal hydration.
- **Custom** palette: buttons, sidebar, and body text meet contrast; switching chrome still resolves colors (override or fallback).
- **System** mode: OS appearance change updates the app without a reload.
- **Quiet vs loud chrome**: same screens; FX present only where chrome tokens say so.
- **Controls vs structure**: inputs use control borders; cards use the border ladder.
- **Reduced motion**: pulses and scanlines stop.
- **Migration** (if you have legacy ids): one load after deploy looks like the old bundled theme.

## Implementation companion

Do not add file paths, hook names, preset catalogs, or migration notes to this file. If the app needs those, write a short companion that records:

- Root attributes and first-paint defaults
- How preferences are stored and loaded
- The live list of palette ids and chrome ids
- Capability helpers and any FX escape hatch
- One-time migrations from older bundled theme ids

This guidelines file stays the law. The companion stays the wiring.

## Adapting this document

When using this in another application:

1. Keep the three axes and token-ownership table as-is.
2. Keep the ladders; only change step *values* if the product’s type/spacing scale is different — do not add unbounded steps.
3. Put chrome ids, preset ids, persistence field names, and hooks in the implementation companion.
4. Map the semantic contract onto whatever utility bridge you use (Tailwind `@theme`, vanilla custom properties, etc.).
5. Shared chrome tokens (elevation, button, card, popover, sheet, focus) stay. Feature-surface tokens belong in that product’s companion or styles, named by role, not by a look.
6. Recompute the z-index table if you have fewer (or more) overlay kinds — keep it a single ordered list.
7. Do not link this file to product docs. Those docs may link *here*.
