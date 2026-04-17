# RSC-007 Spike — Resizable panel primitive for right sidebar

**Status:** Closed — keep current implementation  
**Date:** 2026-04-16

## 1. Current implementation

### useRightSidebarResize (67 lines)

Custom hook using `mousedown` → `mousemove` → `mouseup` on `window`. Tracks `isResizing` and `resizingWidth` during drag, commits the final width to `ShellSlotProvider` on mouseup. Width is clamped to `MIN_SIDEBAR_WIDTH` (320px) – `MAX_SIDEBAR_WIDTH` (480px) and persisted to `localStorage`.

### Layout integration

The shell layout (`layout.tsx`) uses a standard flex row:

```
[LeftSidebar] [main content (flex-1)] [RightSidebar]
```

`RightSidebar` is a self-contained component. Its expanded panel sets `style={{ width: panelWidth }}` directly. The resize handle lives inside the icon rail as an absolutely-positioned drag target on the rail's left edge.

### State flow

```
ShellSlotProvider (owns sidebarWidth + localStorage persistence)
  └─ RightSidebarProvider (connects useRightSidebarResize)
       ├─ RightSidebarIconRail (renders resize handle, calls handleResizeStart)
       └─ RightSidebarExpandedPanel (reads panelWidth for inline width)
```

## 2. What react-resizable-panels would change

### Layout restructuring required

`react-resizable-panels` expects a `<PanelGroup>` wrapper around sibling `<Panel>` components with `<PanelResizeHandle>` between them. Adopting it means:

1. The main content area and the right sidebar must be wrapped in a single `<PanelGroup direction="horizontal">`.
2. This wrapper must live in `layout.tsx` at the desktop layout level, coupling the sidebar implementation to the shell layout.
3. The current architecture keeps the sidebar fully self-contained — the layout only renders `<RightSidebar />` as a flex sibling. Panel groups break this encapsulation.

### Percentage vs pixel sizing

`react-resizable-panels` uses percentage-based panel sizes, not pixel widths. The current implementation uses pixel widths (320–480px) stored in `localStorage`. Adopting the library requires:

- Converting pixel constraints to percentage-based `minSize`/`maxSize` (which change based on viewport width).
- Either abandoning pixel-based persistence or adding conversion logic on save/restore.
- Recalculating percentage constraints on window resize.

This adds complexity rather than removing it.

### Sidebar collapse behavior

The right sidebar collapses to zero width when no slots are registered or no action is active (`isExpanded` = false). `react-resizable-panels` supports collapsible panels via `collapsible` + `onCollapse`/`onExpand` callbacks, but the current collapse is driven by application state (active slot selection), not by a drag-to-collapse gesture. Mapping between the two models adds an impedance mismatch.

### Resize handle position

The current resize handle is positioned inside the icon rail (absolutely positioned on its left edge). This is visually distinct from a standard panel resize handle that sits between two panels. `react-resizable-panels` would place the handle between the main content and the sidebar, which either changes the visual design or requires custom handle positioning that fights the library's assumptions.

## 3. Evaluation matrix

| Criterion | Current hook | react-resizable-panels | Winner |
|-----------|-------------|----------------------|--------|
| **Code volume** | 67 lines (hook) + ~25 lines (handle JSX in icon-rail) | ~0 lines (hook deleted), but +30–50 lines layout restructuring, size conversion, collapse mapping | Roughly equal |
| **Encapsulation** | Sidebar fully self-contained; layout just renders `<RightSidebar />` | PanelGroup must wrap both main content and sidebar in layout.tsx | Current |
| **Sizing model** | Pixel-based, matches localStorage persistence and min/max constraints | Percentage-based, requires conversion for persistence and viewport-dependent constraints | Current |
| **Resize jank** | `useState` during drag — acceptable for sidebar-only repaints | Also uses React state internally — no material difference | Tie |
| **Keyboard accessibility** | Mouse-only; no keyboard resize | Built-in arrow-key resize on handle | Library |
| **Bundle cost** | 0 KB | ~8–12 KB gzipped | Current |
| **Maintenance** | Custom code to maintain, but trivial and stable | Library-managed, but introduces coupling and abstraction mismatch | Roughly equal |
| **Future multi-panel layouts** | Would need separate implementation | Reusable across panel layouts | Library (conditional) |

## 4. Accessibility consideration

The only clear advantage of `react-resizable-panels` is built-in keyboard accessibility for the resize handle (arrow keys to adjust width). The current implementation is mouse-only.

However:

- Sidebar resize is a power-user interaction, not a primary workflow.
- The sidebar has fixed min/max bounds (320–480px, a 160px range) — the impact of precise keyboard control is minimal.
- If keyboard resize becomes a requirement, adding `onKeyDown` to the existing handle (arrow keys adjusting width by 10px increments) is ~15 lines of code — far less disruptive than adopting the library.

## 5. Bundle cost

`react-resizable-panels` adds ~8–12 KB gzipped. The project currently has no dependency on it. For context, the current hook is 67 lines of straightforward code. The cost-to-value ratio does not justify the addition for a single sidebar resize.

If the project later needs resizable panels in multiple locations (e.g., a split editor view, adjustable card preview panes), the calculus changes. That scenario is not on the current roadmap.

## 6. Verdict

**Keep the current `useRightSidebarResize` hook.**

The library does not simplify the code — it trades 67 lines of self-contained, pixel-based resize logic for layout restructuring, percentage-to-pixel conversion, and collapse-state impedance mismatch. The only tangible gain (keyboard accessibility) can be achieved with a ~15-line addition to the existing handle. The 8–12 KB bundle cost is not justified.

### If revisiting in the future

- **Keyboard resize needed →** Add `onKeyDown` handler to the existing resize handle in `icon-rail.tsx`. Estimated effort: ~15 lines, no architectural changes.
- **Multiple resizable regions needed →** Re-evaluate `react-resizable-panels` when the product requires two or more resizable panel layouts (e.g., split pane editing). The library's value scales with reuse.
- **Touch resize needed →** Extend the current hook with `touchstart`/`touchmove`/`touchend` alongside the existing mouse events. The right sidebar is desktop-only today (hidden on mobile via `hidden md:flex`).

### No follow-up backlog rows needed.
