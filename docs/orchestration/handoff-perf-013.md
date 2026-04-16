# Handoff: PERF-013 (image loading)

## Scope

Gallery and deck flows already used `next/image`. This pass adds **accurate `sizes`**, **priority only where it helps** (first visible slices), and **reduces duplicate eager work** for dual-face cards (one face eager / high fetch at a time; hidden face `lazy` + `fetchPriority="low"` where applicable).

## Touchpoints

- Shared: `CardImageDisplay` (`priority`, `sizes`, `fetchPriority`); `CardGridItem` + `image-stage` (per-face priority / fetch).
- Gallery: `grid-view`, `list-view`, `details-view`; list thumbnails; `card-details-list-item` hero image.
- Deck: `DeckGridItem` + `media-panel`; deck-details list/sidebar thumbnails, stack item, simulator hand card, hero static/character picker; `CardHoverPreviewPortal` and deck-details sidebar list hover preview.
- Dialogs: `CardDetailsV2`, `card-details/image-panel`, `card-details-original/image-panel` (aligned dual-face behavior, `sizes` on hero).

## Verification

- `bun run lint`
- `bun run build`
- Remote image patterns unchanged in `next.config.ts`.

## Follow-ups (optional)

- Tier-list / community grids using `CardGridItem` still default `imagePriority={false}`; bump priority for the first row if those routes become LCP-critical.
- If catalog CDN adds responsive variants, revisit `sizes` strings against real column widths.
