# RSC-007 — shadcn Resizable / `react-resizable-panels` vs `useRightSidebarResize`

## Scope

Evaluate whether adopting [shadcn Resizable](https://ui.shadcn.com/docs/components/radix/resizable) (wrapper around [`react-resizable-panels`](https://github.com/bvaughn/react-resizable-panels)) for the **desktop right sidebar** width would **simplify hit targets**, **reduce resize jank**, and stay aligned with **calm / expressive** chrome tokens. Related backlog: [BACKLOG.md](../../BACKLOG.md) (row **RSC-007**).

## What the app does today

| Area | Implementation |
| --- | --- |
| Width state | `useShellSlotModel` holds `sidebarWidth` (clamped `MIN_SIDEBAR_WIDTH`–`MAX_SIDEBAR_WIDTH`), persisted in `localStorage` via `SIDEBAR_WIDTH_KEY` (`src/components/shell/shell-slot-provider/hook.ts`, `storage.ts`). |
| Drag logic | `useRightSidebarResize` in `src/components/shell/right-sidebar/use-resize.ts`: `mousedown` on handle → `window` `mousemove` / `mouseup`; while dragging, **`setResizingWidth` on every `mousemove`**; on `mouseup`, `onWidthCommit` → `setSidebarWidth`. |
| Live width | `panelWidth` = `resizingWidth` while dragging, else `sidebarWidth`; exposed on `RightSidebarContext` (`src/components/shell/right-sidebar/context.tsx`). |
| Panel chrome | `RightSidebarExpandedPanel` uses instant width + Framer slide on open (`src/components/shell/right-sidebar/expanded-panel.tsx`); `isResizing` forces zero-duration motion (RSC-001). |
| Handle | `RightSidebarIconRail`: hit target `w-3` (~12px) with `-translate-x-2/3`, visible grip `h-16 w-1` + tokenized hover/active shadows (`--chrome-shell-rail-resize-shadow*`) (`src/components/shell/right-sidebar/icon-rail.tsx`). |
| Shell layout | App layout is a **flex row**: main column `flex-1` + `RightSidebar` as a **sibling** after the main stack (`src/app/(app)/layout.tsx`); not currently structured as a `PanelGroup` / split pane. |

## What `react-resizable-panels` would imply

- **Layout model:** Typical integration wraps **main** and **sidebar** in `PanelGroup` + `Panel` + `PanelResizeHandle`, with sizes as **flex ratios** or **pixels** (library APIs and constraints apply). That is a **structural** change to the shell: the dynamic `RightSidebar` import, icon rail + expanded panel split, and RSC-001 open animation would all need a coherent story inside or beside the group.
- **State bridge:** The library can persist layout; the app already persists **one pixel width** in `localStorage` and feeds **gallery** behavior (e.g. RSC-003 delay vs `useShellSlotSidebarWidth`). A merge would need an explicit **mapping** from panel size → existing `setSidebarWidth` and any consumers that assume a single number.
- **Jank:** The library generally adjusts layout via its **imperative** panel sizing path during drag, which can avoid **React re-renders per pointer event** in ways ad hoc `useState` + `mousemove` does not. A full integration is required to **measure** the benefit in this tree; a **dependency-only** install does not validate end-to-end behavior.
- **Bundle:** Adds **`react-resizable-panels`** (and, if using the shadcn component, `lucide-react` grip icon is already present). Order of magnitude **~4–8 kB gzip** for the library alone (varies by bundler and version); the **integration** cost dominates, not the gzip line.

## Hit targets and tokens

- **Widening the handle** (invisible padding, `min` touch size, or a taller `PanelResizeHandle` region) is achievable **without** the library: the current handle already extends hit slop with `absolute … -inset-x-1` and uses chrome variables for focus/hover. shadcn’s `ResizableHandle` is **styling + semantics**; it does not uniquely unlock calm/expressive tokens.
- **Accessibility:** The upstream library may offer **keyboard** resize when wired correctly; the custom handle is **pointer-only** today. That is a **product** argument for a primitive, not a given reason to pick this specific stack without an a11y requirement.

## Verdict

**Keep the custom `useRightSidebarResize` for now — do not merge** `react-resizable-panels` / shadcn Resizable in this pass.

**Rationale**

1. **Cost vs. proof:** A faithful evaluation that reduces jank requires **re-shelling** the main/right layout around `PanelGroup` and reconciling RSC-001, slot registration, and `sidebarWidth` consumers. The spike is **doc-only**; there is no measured win yet.
2. **Jank levers that avoid a new dependency:** If resize still feels hot in profiling, prefer **local** mitigations: **rAF-throttle** or **one `setState` per frame** during drag, **`setPointerCapture`** on the handle, and/or **splitting** `panelWidth` into a small context or ref-driven subscription so the rest of the shell does not re-render every move. Those can be profiled in isolation.
3. **Hit targets:** Treat as **CSS/markup** polish on `icon-rail` (larger hit rect, `touch-action`, optional `aria` on the control) if user feedback points at the handle.

**When to re-open**

- Accessibility requirements for **keyboard** resize of the desktop sidebar, or
- A prototype branch proves **`PanelGroup` fits** the flex/dynamic-import shell with **less** integration glue than the mapping described above, or
- Profiling shows **React commit cost during drag** as the bottleneck after cheap local throttles are tried.

## Files referenced

- `src/components/shell/right-sidebar/use-resize.ts`
- `src/components/shell/right-sidebar/context.tsx`
- `src/components/shell/right-sidebar/icon-rail.tsx`
- `src/components/shell/right-sidebar/expanded-panel.tsx`
- `src/components/shell/shell-slot-provider/hook.ts`, `types.ts`
- `src/app/(app)/layout.tsx`
