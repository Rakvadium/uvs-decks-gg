/**
 * The ladder tables render class names parsed from `src/styles/system/ladders.css`, but Tailwind
 * only emits a utility it finds written out in source. This string is that written-out copy.
 * `tests/design-catalog.test.ts` fails when ladders.css gains a utility missing here, so a new step
 * can't render as an unstyled swatch.
 */
export const LADDER_SAFELIST = `
bg-primary-wash bg-primary-selected bg-primary-dim border-primary-soft border-primary-strong
ring-primary-soft ring-primary-strong bg-secondary-wash bg-secondary-selected bg-secondary-dim
border-secondary-soft border-secondary-strong ring-secondary-soft ring-secondary-strong
bg-accent-wash bg-accent-selected bg-accent-dim border-accent-soft border-accent-strong
ring-accent-soft ring-accent-strong bg-success-wash bg-success-selected bg-success-dim
border-success-soft border-success-strong ring-success-soft ring-success-strong bg-warning-wash
bg-warning-selected bg-warning-dim border-warning-soft border-warning-strong ring-warning-soft
ring-warning-strong bg-info-wash bg-info-selected bg-info-dim border-info-soft
border-info-strong ring-info-soft ring-info-strong bg-destructive-wash bg-destructive-selected
bg-destructive-dim border-destructive-soft border-destructive-strong ring-destructive-soft
ring-destructive-strong border-hairline border-divider border-surface border-placeholder
bg-card-tint bg-card-soft bg-card-elevated bg-card-overlay bg-background-tint
bg-background-soft bg-background-elevated bg-background-overlay bg-muted-tint bg-muted-soft
bg-muted-elevated bg-muted-overlay bg-popover-tint bg-popover-soft bg-popover-elevated
bg-popover-overlay z-sticky z-shell z-modal z-dialog-float z-chrome z-popover z-select
z-nested-overlay z-nested-dialog z-dock z-drag
`;
