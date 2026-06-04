# Backlog — tcg-decks

Use this list when **no specific task** was assigned. Work from **top to bottom** within each priority band unless an item requires skills or context you do not have—then take the next suitable item.

**Workflow**

1. Pick one **Open** item.
2. Mark it **In progress** (and optionally add your id or date in parentheses).
3. When done, mark **Done** and record a summary in [CHANGELOG.md](./CHANGELOG.md) or the PR description.
4. If you split work, add new backlog rows for the remainder.
5. When the active list gets noisy, move **Done** rows to [archive/backlog-completed.md](./archive/backlog-completed.md).

Statuses: `Open` | `In progress` | `Blocked` | `Done`

**Coding agents:** Read [agent-onboarding.md](./agent-onboarding.md) before implementation.

**Architecture:** Non-trivial UI must follow [component-architecture-playbook.md](./component-architecture-playbook.md). File-size targets: [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md).

---

## Active items

**Archived (all Done):** Card catalog **CAT-001–CAT-008**, right sidebar **RSC-001–RSC-008**, teams **TM-001–TM-012**, content safety **MC-001–MC-007** — see [archive/backlog-completed.md](./archive/backlog-completed.md#archived-backlog-active-2026-04-22). **Admin area IA-1–USR-14** (same session) — [archive/backlog-completed.md#admin-area-epic-2026-04-22](./archive/backlog-completed.md#admin-area-epic-2026-04-22).

### Admin area — sets, cards, formats, content, users

**Goal:** Replace underwhelming read-only admin lists with a **maintainable** IA: set-scoped cards and import, **Formats & legality** editing, **Community YouTube** curation, honest **release** workflow, and **user management** (bans, roles, audit). Backend already exposes many admin mutations (`convex/admin.ts`: sets, cards, formats, `releaseCards`); UI today is mostly tables in `src/app/(app)/admin/`*. `cardLegality` / `setLegality` exist in schema and are read in `convex/formats.ts` but need admin mutations + UI. YouTube curations live in `communityYoutubeCurations` (`convex/communityYoutube.ts`) and need admin-facing APIs.

**References:** `src/app/(app)/admin/admin-dashboard-client.tsx`, `sets-page-client.tsx`, `cards-page-client.tsx`, `layout.tsx` (`AdminSidebarContent`), `convex/admin.ts`, `convex/sets.ts`, `convex/formats.ts`, `convex/communityYoutube.ts`, `convex/schema.ts` (`users`, `cardLegality`, `setLegality`).

**Suggested sequence:** IA + Sets hub + set-scoped card list → card CRUD + set import → release UX → legality API + formats UI → format editor → YouTube content admin → user management schema + enforcement + UI.

#### Information architecture & navigation


| ID   | Status | Area  | Summary                                                                                                                                                                                                                                  |
| ---- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IA-1 | Done   | Admin | **Admin IA v2:** Primary areas **Sets**, **Formats** (formats & legality), **Content**; **Cards** and **Import** are **set-scoped** (from set detail), not global dumps.                                                                 |
| IA-2 | Done   | Admin | **URL structure:** e.g. `/admin/sets`, `/admin/sets/[code]`, `/admin/sets/[code]/cards`, `/admin/sets/[code]/import`, `/admin/formats`, `/admin/formats/[key]`, `/admin/content/youtube`; deep links preserve filters where possible.    |
| IA-3 | Done   | Admin | **Sidebar + breadcrumbs:** Extend `AdminSidebarContent`: **Formats**, **Content**, **Users**; reorder (e.g. Sets → Formats → Content → Users); demote standalone Cards/Import if set-scoped. Breadcrumbs: Admin → Sets → {name} → Cards. |
| IA-4 | Done   | Admin | **Dashboard home:** Counts, **pending release** indicator (REL), shortcuts to last-edited set, link to Content — replace only three large tiles.                                                                                         |
| IA-5 | Done   | Admin | **Consistent page shell:** Reuse `AdminPageHeader` (title, description, primary actions, sticky sub-nav per section).                                                                                                                    |


#### Sets


| ID                                                                                                                                                                            | Status | Area              |                                                                                                                                                               |         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| SET-1                                                                                                                                                                         | Done   | Admin             |                                                                                                                                                               | Summary |
| **Sets list UX:** Virtualized or paginated table; default sort (`setNumber` desc or `releasedAt`); columns code, name, #, card count, released/future, rotating, open action. |        |                   |                                                                                                                                                               |         |
| SET-2                                                                                                                                                                         | Done   | Admin             | **Filtering & search:** Text search (code/name); toggles Released/Future/Rotating; optional `releasedAt` range.                                               |         |
| SET-3                                                                                                                                                                         | Done   | Convex + Admin    | **Add set:** Form → `api.admin.createSet`; unique `code`; optional `setNumber`, `releasedAt`, `iconUrl`, `isFuture`, `isRotating`, `legality`, `spotlightIP`. |         |
| SET-4                                                                                                                                                                         | Done   | Convex + Admin    | **Edit set:** Sheet or page → `api.admin.updateSet`; **code immutable** in UI.                                                                                |         |
| SET-5                                                                                                                                                                         | Done   | Admin             | **No delete in UI:** Omit `deleteSet`; optional server policy for API-only deletes.                                                                           |         |
| SET-6                                                                                                                                                                         | Done   | Admin             | **Set detail hub:** Row click → hub: summary, Cards, Import for set, Legality entry, Release CTA when applicable.                                             |         |
| SET-7                                                                                                                                                                         | Done   | Convex + Admin    | **Card count accuracy:** Maintain `cardCount` on CRUD/import or derive + reconcile; show mismatch warning.                                                    |         |
| SET-8                                                                                                                                                                         | Done   | Convex (optional) | **Audit metadata:** `updatedAt` / `updatedBy` on sets if traceability required.                                                                               |         |


#### Cards (within a set)


| ID    | Status | Area             | Summary                                                                                                                                                                                                               |
| ----- | ------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRD-1 | Done   | Admin            | **Set-scoped listing:** Route under selected set; query cards by `setCode` (indexed).                                                                                                                                 |
| CRD-2 | Done   | Client           | **Infinite scroll (40/page):** Reuse `useInfiniteSlice` pattern from gallery (`src/components/gallery/main-content/content.tsx`); `pageSize` 40.                                                                      |
| CRD-3 | Done   | Client           | **Cached local data:** Same idea as gallery — `useUniversusCards` / card store or admin-only slice: load set’s cards into IDB/memory, filter/sort/scroll locally; invalidate on `cardDataVersion` or after mutations. |
| CRD-4 | Done   | Admin            | **Admin filters:** Search name/text, type, rarity, collector #, front/variant toggles; sort by collector #, name.                                                                                                     |
| CRD-5 | Done   | Convex + Admin   | **Add card:** Form → `api.admin.createCard`; default `setCode` / `setName` from parent set.                                                                                                                           |
| CRD-6 | Done   | Convex + Admin   | **Edit card:** → `api.admin.updateCard`; keep search fields consistent when name/text/keywords change.                                                                                                                |
| CRD-7 | Done   | Convex + Admin   | **Delete card:** Confirm → `api.admin.deleteCard`; warn on back-face / variant links.                                                                                                                                 |
| CRD-8 | Done   | Admin            | **Bulk import for set:** Set-context import; prefill `setCode` / `setName`; use existing import/batch actions; per-row errors, dry-run, progress.                                                                     |
| CRD-9 | Done   | Admin (optional) | **Images / R2:** Document or automate upload if cards use R2 URLs.                                                                                                                                                    |


#### Release workflow


| ID    | Status | Area              | Summary                                                                                                                                                                     |
| ----- | ------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REL-1 | Done   | Convex + Admin    | **Define “unreleased” in UI:** `releaseCards` bumps global `cardDataVersion`; fix misleading `listUnreleasedCards` (currently all cards) or add real draft/changelog model. |
| REL-2 | Done   | Admin             | **Release UX:** Show current version, card count, confirm; toast new version after `releaseCards`.                                                                          |
| REL-3 | Done   | Convex (optional) | **Scoped release:** Only bump when a given set’s cards changed (needs versioning/changelog design).                                                                         |


#### Formats


| ID    | Status | Area           | Summary                                                                                                          |
| ----- | ------ | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| FMT-1 | Done   | Admin          | **Formats list:** Table from `api.formats.list`; link to detail.                                                 |
| FMT-2 | Done   | Convex + Admin | **Create/edit format:** UI for `api.admin.createFormat` / `updateFormat`; single `isDefault` behavior preserved. |
| FMT-3 | Done   | Admin          | **Delete format:** Confirm; check orphaned legality rows / deck impact or soft-delete only.                      |


#### Legality (sets & cards / banlists)


| ID    | Status | Area             | Summary                                                                                                                                      |
| ----- | ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| LEG-1 | Done   | Convex           | **Set legality CRUD:** Admin mutations upsert `setLegality` by `(formatKey, setCode)` — `isLegal`, `rotatesOutAt`; list by format.           |
| LEG-2 | Done   | Convex           | **Card legality CRUD:** Admin mutations upsert `cardLegality` — `status`, `copyLimitOverride`, `effectiveDate`; optional bulk from CSV/JSON. |
| LEG-3 | Done   | Admin            | **UI — sets tab:** Matrix or table: sets × legal toggle + rotation date for selected format.                                                 |
| LEG-4 | Done   | Admin            | **UI — cards tab:** Search card → set status; filter banned/restricted; jump from card admin row.                                            |
| LEG-5 | Done   | Admin            | **Effective dates:** UI for `effectiveDate`; document interaction with `isSetLegal` / `rotatesOutAt` vs `Date.now()`.                        |
| LEG-6 | Done   | Admin (optional) | **Import/export banlist:** Per-format JSON backup and restore.                                                                               |


#### Content (Community YouTube)


| ID    | Status | Area   | Summary                                                                                                                                    |
| ----- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CNT-1 | Done   | Convex | **Admin API for curations:** `requireAdmin` mutations: list ordered, add (URL → id), update label/accent/sortOrder, delete, reorder batch. |
| CNT-2 | Done   | Convex | **Public read:** Query for community page returning curated ids + metadata; keep metadata cache refresh.                                   |
| CNT-3 | Done   | Admin  | **Content UI:** Drag reorder; inline label/accent; preview via existing YouTube metadata flow; duplicate id validation.                    |
| CNT-4 | Done   | Ops    | **Defaults vs production:** `ensureDefaultCurations` must not overwrite manual curations on deploy.                                        |


#### Global import & safety


| ID    | Status | Area  | Summary                                                                                     |
| ----- | ------ | ----- | ------------------------------------------------------------------------------------------- |
| IMP-1 | Done   | Admin | **Global import:** Deprecate or relocate `/admin/import`; prefer set-scoped import (CRD-8). |
| IMP-2 | Done   | Admin | **Guardrails:** Gate or remove `clearAllCards`; audit destructive actions.                  |
| IMP-3 | Done   | Admin | **Ingestion jobs UI:** Surface `ingestionJobs` status when using `bulkImportCards`.         |


#### Cross-cutting (admin UX & quality)


| ID   | Status | Area             | Summary                                                                  |
| ---- | ------ | ---------------- | ------------------------------------------------------------------------ |
| QX-1 | Done   | Admin            | **Loading / empty / error:** Skeletons, retry, Convex error toasts.      |
| QX-2 | Done   | Admin            | **A11y:** Table focus, dialog traps, release announcements.              |
| QX-3 | Done   | Admin (optional) | **Mobile admin:** Usable layouts for emergency fixes.                    |
| QX-4 | Done   | QA               | **E2E smoke:** Admin login → create set → add card → release (test env). |


#### User management


| ID     | Status | Area              | Summary                                                                                                                                                                               |
| ------ | ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| USR-1  | Done   | Admin             | **Users area:** Nav **Users**; `/admin/users` — searchable, paginated directory (username, email, role, status).                                                                      |
| USR-2  | Done   | Admin             | **User detail:** Sheet or `/admin/users/[id]` — profile, identifiers (read-only where needed), linked content counts when cheap.                                                      |
| USR-3  | Done   | Convex            | **Account status model:** Schema (or `userModeration` table): e.g. `accountStatus` active/suspended/banned, `statusReason`, `statusSetAt`, `statusSetBy`, optional `statusExpiresAt`. |
| USR-4  | Done   | Convex            | **Enforce bans:** Shared guard after auth (e.g. `requireActiveUser` / `assertUserNotBanned`); define what banned users may still do.                                                  |
| USR-5  | Done   | Convex + Admin    | **Ban/suspend:** Admin mutations — set status, reason, optional expiry; unban; confirm; block banning self / last admin (USR-9).                                                      |
| USR-6  | Done   | Convex (optional) | **Write-only restriction:** Login allowed but no posts (decks/comments) vs full ban.                                                                                                  |
| USR-7  | Done   | Convex + Admin    | **Roles:** UI to set `role` (e.g. Admin); align with `requireAdmin`; prevent demoting sole admin.                                                                                     |
| USR-8  | Done   | Admin (optional)  | **Impersonation:** Time-bound view-as-user + audit; default out of scope unless explicitly required.                                                                                  |
| USR-9  | Done   | Policy            | **Admin safety:** Minimum one Admin; no self-demotion; optional rules for long bans.                                                                                                  |
| USR-10 | Done   | Convex            | **Moderation audit log:** Append-only actor, target, action, payload, timestamp; visible in admin.                                                                                    |
| USR-11 | Done   | Admin             | **UGC hooks:** From user detail — links to pending tier-list comments (`tierLists` moderation fields); bulk approve/reject.                                                           |
| USR-12 | Done   | Admin             | **Search & filters:** By status, role, verified email, anonymous; optional CSV export.                                                                                                |
| USR-13 | Done   | Auth              | **Sessions:** Bans apply on next request; invalidate sessions if auth stack supports it.                                                                                              |
| USR-14 | Done   | Admin             | **Messaging:** Optional `userFacingMessage` vs internal `statusReason` for restricted-account UI.                                                                                     |


---

**Completed backlog:** [archive/backlog-completed.md](./archive/backlog-completed.md)

---

*Add concrete rows as you discover work. Tie entries to sections in [CHANGELOG.md](./CHANGELOG.md) when you complete them.*