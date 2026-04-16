# Calm mode — a11y and performance (CALM-048, CALM-049)

## Focus without glow (CALM-048)

- Calm chrome defines `--chrome-focus-shadow` as a neutral ring (`var(--ring)`); expressive uses primary-tinted glow.
- Interactive components should consume `--chrome-focus-*` or `Button` / `Input` primitives rather than custom `focus-visible:shadow-[0_0_*_var(--primary)]`.
- Verify keyboard tab order on Settings, Gallery filter dialog, and tier list editor after large UI changes.

## Fewer blur layers (CALM-049)

- Calm sets many decorative washes to `none` or low opacity via CSS variables (`--chrome-page-hero-wash-opacity`, `--chrome-decks-heading-blur`, etc.).
- Prefer **solid borders + elevation** over stacked `blur-3xl` blobs on calm; keep expressive layers for marketing surfaces.
- Profile with browser Performance panel if a route regresses; target long tasks from Framer Motion + blur together.
