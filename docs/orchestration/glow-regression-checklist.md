# Glow regression checklist (CALM-047)

Run from repo root. Patterns are **hints**, not exhaustive — new UI should use `--chrome-*` tokens from `src/styles/base.css`.

## Suggested ripgrep audits

```bash
rg 'shadow-\[0_0.*var\(--primary\)' src/components src/app
rg 'drop-shadow-\[0_0.*var\(--primary\)' src/components src/app
rg '0_0_\d+px.*var\(--primary\)' src/components src/app
```

## Allowlist philosophy

- **Primitives** (`src/components/ui/`) should prefer CSS variables, not raw multi-layer primary shadows.
- **Features** may keep one-off accents if they read from `--chrome-*` or design tokens.
- **False positives:** `var(--primary)` inside `color-mix` or borders without outer glow are usually fine.

## CI (optional)

Add a job step that runs the first command and fails only when **new** matches appear beyond a tracked baseline file, or use `rg --count` with a threshold.
