# Teams feature — technical implementation

This document specifies a **teams** system for tcg-decks: membership, invites, role-based permissions, team-scoped decks, a team hub, and optional **realtime collaborative deck building** backed by Convex. It is written to align with the current stack (**Next.js App Router**, **Convex**, `@convex-dev/auth`, existing `decks` schema and `convex/decks.ts` ownership checks).

**Canonical product context:** [PRODUCT_VISION.md](./PRODUCT_VISION.md) · **UI structure:** [component-architecture-playbook.md](./component-architecture-playbook.md)

---

## 1. Goals

1. Users can **create teams**, **invite** others, and **assign roles**.
2. **Permissions are enforced in Convex** (mutations and sensitive queries), not only in the UI.
3. Decks can be marked **team-visible** and appear in a **Teams** area; a finer mode controls **collaborative editing** vs **single-editor team-private** behavior.
4. A **Team hub** surfaces decks, members, stats, chat, announcements, and calendar in one place.
5. For **team-editable** decks, collaborators see **live cursors** and **shared builder UI state** (sidebar, filters, etc.) via Convex subscriptions.

---

## 2. Non-goals (initial release)

- Full operational-transform or CRDT merge for arbitrary simultaneous edits to every deck field (see [§8.3](#83-concurrency-model-for-deck-card-data)).
- Replacing external chat (Slack/Discord); in-app chat is **team-scoped** and intentionally simple.
- Public discovery of teams (unless you add a separate `teamDirectoryPublic` flag later).

---

## 3. Concepts and terminology

| Term | Meaning |
|------|---------|
| **Team** | A workspace with members, settings, and team-scoped content. |
| **Captain** | Team owner; full control. Exactly one per team (`captainUserId`). |
| **Member** | Accepted user with a **role** and **permission flags** derived from that role. |
| **Invite** | Pending token or email-linked invitation with optional pre-assigned role. |
| **Team visibility (deck)** | Deck is only visible to members of a specific team (`teamId` + visibility enum). |
| **Collaboration mode (deck)** | `team_viewable` (normal single-editor semantics for members) vs `team_editable` (shared session + presence enabled). |

---

## 4. Role catalog and permission matrix

### 4.1 Roles (stored on membership)

| Role | Key | Notes |
|------|-----|--------|
| Captain | `captain` | Not stored as a normal row if you keep `teams.captainUserId`; or store for uniformity with `role: "captain"` on that user’s membership. |
| Co-Captain | `co_captain` | Co-leader; can invite/manage members; cannot delete team or demote Captain. |
| Architect | `architect` | Deck-building focus. |
| Analyst | `analyst` | Stats deep-dive. |
| Scout | `scout` | Ideas / recruiting. |
| Pilot / Crew | `pilot` | Regular member. |

**Recommendation:** Use a single `teamRole` string union on `teamMembers` and derive **capabilities** in one server-side module (`convex/teams/permissions.ts`) so UI and API never duplicate matrices.

### 4.2 Capabilities (permission-based backend)

Map each role to capabilities. Implement checks as `hasCapability(member, "capability")`.

| Capability | Captain | Co-Captain | Architect | Analyst | Scout | Pilot |
|------------|---------|------------|-----------|---------|-------|-------|
| `view_team` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `view_team_decks` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `view_team_stats` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `create_team_deck` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `share_team_deck` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `invite_members` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `manage_members` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `assign_roles` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `remove_members` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `edit_team_settings` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `transfer_captaincy` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `delete_team` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Product mapping to your bullets:**

- **View team decks/stats** → `view_team_decks`, `view_team_stats` (all active roles).
- **Create/share decks** → `create_team_deck`, `share_team_deck` (**Pilot and above** = all roles in the table except you have none below Pilot; treat as “every active member including Pilot”).
- **Invite/manage members** → `invite_members`, `manage_members`, `assign_roles`, `remove_members` (**Co-Captain and Captain**).
- **Full control** → `edit_team_settings`, `transfer_captaincy`, `delete_team` (**Captain only**).

**Deck-level overrides:** For `team_editable` decks, only members with `create_team_deck` (or a narrower `edit_team_deck` if you split later) may issue **card mutations** on that deck. View-only members still get `view_team_decks`.

---

## 5. Data model (Convex schema)

### 5.1 `teams`

| Field | Type | Notes |
|-------|------|--------|
| `name` | `string` | |
| `slug` | `optional string` | Unique, for URLs. |
| `captainUserId` | `Id<"users">` | Source of truth for Captain. |
| `description` | `optional string` | |
| `imageStorageId` | `optional` | Prefer **moderated uploads** via the pipeline in [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) (`mediaAssets` + approved logo URL or storage id). |
| `createdAt` | `number` | |
| `updatedAt` | `number` | |

**Indexes:** `by_slug`, `by_captainUserId`.

### 5.2 `teamMembers`

| Field | Type | Notes |
|-------|------|--------|
| `teamId` | `Id<"teams">` | |
| `userId` | `Id<"users">` | |
| `role` | union of role keys | Captain row optional if derived from `teams.captainUserId`. |
| `joinedAt` | `number` | |
| `status` | `active` \| `removed` | Soft-remove preserves history. |

**Indexes:** `by_teamId_and_userId` (unique), `by_userId`, `by_teamId`.

### 5.3 `teamInvites`

| Field | Type | Notes |
|-------|------|--------|
| `teamId` | `Id<"teams">` | |
| `email` | `optional string` | Lowercased normalized. |
| `invitedUserId` | `optional Id<"users">` | For in-app invites when email unknown. |
| `tokenHash` | `string` | Store hash only; never store raw token in DB. |
| `role` | role union | Default `pilot`. |
| `invitedByUserId` | `Id<"users">` | |
| `createdAt` | `number` | |
| `expiresAt` | `number` | |
| `acceptedAt` | `optional number` | |

**Indexes:** `by_teamId`, `by_tokenHash`, `by_email_and_teamId`.

### 5.4 `teamAnnouncements`

| Field | Type | Notes |
|-------|------|--------|
| `teamId` | `Id<"teams">` | |
| `authorUserId` | `Id<"users">` | |
| `title` | `string` | |
| `body` | `string` | Markdown or rich JSON later. |
| `pinned` | `boolean` | |
| `createdAt` | `number` | |

**Index:** `by_teamId_and_createdAt`.

### 5.5 `teamChatMessages`

| Field | Type | Notes |
|-------|------|--------|
| `teamId` | `Id<"teams">` | |
| `authorUserId` | `Id<"users">` | |
| `body` | `string` | |
| `createdAt` | `number` | |

**Index:** `by_teamId_and_createdAt` (paginate newest-first in UI).

**Scale note:** For high volume, shard by thread or move to a Convex component; for v1, single team channel is enough.

### 5.6 `teamEvents` (calendar)

| Field | Type | Notes |
|-------|------|--------|
| `teamId` | `Id<"teams">` | |
| `title` | `string` | |
| `description` | `optional string` | |
| `startsAt` | `number` | Unix ms. |
| `endsAt` | `optional number` | |
| `createdByUserId` | `Id<"users">` | |
| `createdAt` | `number` | |

**Index:** `by_teamId_and_startsAt`.

### 5.7 Extensions to `decks`

Today (`convex/schema.ts`): `userId`, `isPublic`, zones, quantities, `cardLayouts`.

Add:

| Field | Type | Notes |
|-------|------|--------|
| `visibility` | `public` \| `private` \| `team` | Migrate from `isPublic`: `true` → `public`, `false` → `private` for existing rows. |
| `teamId` | `optional Id<"teams">` | Required when `visibility === "team"`. |
| `teamCollaboration` | `none` \| `team_viewable` \| `team_editable` | `none` for non-team decks. |

**Rules:**

- `visibility === "team"` ⇒ `teamId` set and `teamCollaboration` is `team_viewable` or `team_editable`.
- **Owner:** Keep `userId` as **creating user** (provenance). Authorize edits using team capability + collaboration mode (see [§7](#7-authorization-patterns-convex)).

**Indexes:** `by_teamId`, `by_teamId_and_visibility` (if you filter team lists in Convex), optionally `by_userId` unchanged.

### 5.8 `deckBuilderSessions` (collaboration)

One active session document per **team-editable** deck (or per deck when collaboration enabled).

| Field | Type | Notes |
|-------|------|--------|
| `deckId` | `Id<"decks">` | Unique per session. |
| `teamId` | `Id<"teams">` | Denormalized for auth checks. |
| `updatedAt` | `number` | Bump on structural UI changes; throttle cursor-only updates separately (see [§8](#8-realtime-collaboration-deck-builder)). |
| `uiState` | `object` | Sidebar open, active tab, gallery filters snapshot, scroll positions, selected zone, etc. Versioned shape (`v: 1`). |
| `deckRevision` | `number` | Matches `decks` optimistic concurrency (optional). |

### 5.9 `deckPresence` (ephemeral-friendly)

| Field | Type | Notes |
|-------|------|--------|
| `deckId` | `Id<"decks">` | |
| `userId` | `Id<"users">` | |
| `sessionId` | `string` | Client-generated UUID per tab. |
| `color` | `string` | Stable hash from `userId` or assigned from palette server-side. |
| `label` | `string` | Display name. |
| `cursor` | `object` | `{ x, y, viewportW, viewportH }` in normalized or pixel coords; pick one convention. |
| `lastSeenAt` | `number` | |

**Index:** `by_deckId`. Cleanup: scheduled mutation to delete stale rows (e.g. `lastSeenAt` older than 60s).

---

## 6. Deck publicity and team lists

### 6.1 Visibility semantics

| `visibility` | Who can read |
|--------------|----------------|
| `private` | Owner only (current behavior for `isPublic: false`). |
| `public` | Everyone (current `isPublic: true`); appears in public gallery lists. |
| `team` | Members of `teamId` with `view_team_decks`. |

### 6.2 `teamCollaboration`

| Mode | Read | Write (cards/layout) | Session / presence |
|------|------|------------------------|--------------------|
| `team_viewable` | Team members with view | **Owner only** (`deck.userId`), same as private deck today | Disabled |
| `team_editable` | Team members with view | Members with `create_team_deck` (or dedicated cap) | Enabled |

**Teams deck list:** Query `decks` with `visibility === "team"` and `teamId === activeTeam`. Filter by collaboration mode in UI tabs if desired (“Editable by team” vs “View only”).

---

## 7. Authorization patterns (Convex)

### 7.1 Helper module

Add `convex/teams/auth.ts` (name as you prefer):

- `getActiveMembership(ctx, teamId, userId)` → member doc or null.
- `requireTeamMember(ctx, teamId)` → member or throw.
- `requireCapability(ctx, teamId, capability)` → void or throw.

Every **team-scoped mutation** starts with `requireCapability` or a deck-specific check.

### 7.2 Deck read path

`decks.getById` (and any list endpoints) must:

1. Load deck.
2. If `visibility === "public"` → allow.
3. If `visibility === "private"` → `userId === viewer` only.
4. If `visibility === "team"` → viewer must be active `teamMembers` row for `deck.teamId` with `view_team_decks`.

### 7.3 Deck write path

Split today’s `deck.userId === userId` checks:

- **`team_viewable`:** only `deck.userId` may run `addCard`, `removeCard`, layout mutations, etc.
- **`team_editable`:** allow if viewer has `create_team_deck` (or `edit_team_deck`) on `deck.teamId`.

Optional: restrict **metadata** edits (rename, description) to owner + co-captain only via a separate capability `manage_team_deck_meta`.

### 7.4 Invites

- Create invite: `requireCapability(..., "invite_members")`.
- Accept invite: authenticated user matches email or `invitedUserId`; validate token; insert `teamMembers`; mark invite accepted.
- Revoke: Captain or Co-Captain.

### 7.5 Captain-only

Implement as explicit guards on mutations: `requireCaptain(ctx, teamId)` using `teams.captainUserId === userId`.

---

## 8. Realtime collaboration (deck builder)

### 8.1 What is shared

| Data | Storage | Update frequency |
|------|---------|------------------|
| Card lists, quantities, layouts | `decks` document | On user actions (mutations); subscribe with `useQuery` |
| Builder UI state | `deckBuilderSessions` | Throttled patches (e.g. 50–100 ms debounce); coarser for heavy objects |
| Cursor positions | `deckPresence` | High frequency; throttle client (e.g. 16–32 ms) and batch via single `patch` per interval |

### 8.2 Client architecture

- **Team-editable deck route:** Mount a `DeckCollaborationProvider` that:
  - Subscribes to `api.decks.getById` (or a narrower `getDeckForEditor`).
  - Subscribes to `api.teamDeck.getBuilderSession` and `api.teamDeck.listPresence`.
  - Registers heartbeat: `mutation teamDeck.presenceHeartbeat` updates `lastSeenAt` + `cursor`.
- **Cursor rendering:** Overlay absolutely positioned markers per other user; use `color` from presence; hide self.
- **UI sync:** When remote `uiState` changes, apply to local shell state with a “remote authority” flag to avoid feedback loops (or compare version counters).

### 8.3 Concurrency model for deck card data

Convex mutations are **serialized per document**; last mutation wins per field if two users edit blindly.

**Recommended v1 approach:**

1. Add optional `revision` on `decks`; increment on each card/layout mutation.
2. Client passes `expectedRevision`; if mismatch, return error `CONFLICT` and client refetches deck.
3. Teach UI to **retry** simple operations or show “Deck was updated by {user}” banner.

**Later:** field-level merge rules (e.g. merging quantities by card id) or CRDT for ordered lists if conflicts hurt UX.

### 8.4 When collaboration is off

If `teamCollaboration !== "team_editable"`:

- Do not subscribe to session/presence queries.
- Do not show collaborator cursors.
- All existing single-user deck editor code paths remain.

---

## 9. Team hub (UI)

Route shape: `/teams/[teamId]` or `/teams/[slug]` with hub sections as tabs or a sidebar:

| Section | Data source | Notes |
|---------|-------------|--------|
| Overview | `teams` + recent announcements | |
| Decks | `decks` query by `teamId` | Filters for collaboration mode |
| Members | `teamMembers` + user profile join | Role management for Co-Captain+ |
| Stats | Aggregate queries / future analytics | Analyst role can gate advanced widgets |
| Chat | `teamChatMessages` paginated | Realtime via Convex subscription |
| Announcements | `teamAnnouncements` | Pin + chronological |
| Calendar | `teamEvents` | Month view; CRUD with capability checks |

Follow **feature folder** layout: `src/components/teams/hub/content.tsx`, `hook.ts`, subfolders per tab.

---

## 10. Email and notifications (invites)

- Reuse existing mail integration if present (e.g. Resend patterns in repo).
- Invite email contains link: `/teams/invite/[token]` → validates and prompts login.
- In-app notification table optional (`notifications` with `type: team_invite`).

---

## 11. Migration plan

1. **Schema:** Add new tables; extend `decks` with nullable `visibility`, `teamId`, `teamCollaboration`.
2. **Backfill:** `isPublic === true` → `visibility: "public"`; `false` → `visibility: "private"`; `teamCollaboration: "none"`.
3. **Code:** Introduce `deckValidator` updates and migrate `listPublic` to `visibility === "public"`.
4. **Deploy:** Ship read paths first, then team CRUD, then team decks, then collaboration last (feature flag per team or env).

---

## 12. Security checklist

- Never expose invite tokens in list queries; validate with hashed token server-side.
- Rate-limit invite creation and presence heartbeats if abuse appears.
- Ensure `getById` on decks does not leak team deck fields to non-members (including `mainCardIds` in API responses).
- Captain transfer: require password re-entry or explicit confirmation in UI; audit log optional (`teamAuditLog` table).

---

## 13. Testing strategy

- **Unit:** `permissions.ts` role → capability matrix.
- **Convex:** Test functions for `acceptInvite`, `patchDeck` authorization matrix, and conflict behavior on `revision`.
- **E2E:** Two browsers signed in as two users on same `team_editable` deck; verify cursor + card add propagates.

---

## 14. Phased delivery suggestion

| Phase | Deliverable |
|-------|-------------|
| **A** | `teams`, `teamMembers`, `teamInvites`, hub shell, member list |
| **B** | Deck `visibility` + `teamId` + Teams deck list; `team_viewable` |
| **C** | `team_editable` + shared mutations + revision conflicts |
| **D** | `deckBuilderSessions` + `deckPresence` + cursor UI |
| **E** | Announcements, chat, calendar, stats widgets |

---

## 15. Open questions

1. **Slug uniqueness:** Global vs per-user; reserved words.
2. **Leaving team:** Can Pilot self-remove? What happens to their **team** decks (owner stays; optional reassign)?
3. **Max team size** and chat retention policy.
4. **Architect vs Analyst** differentiation beyond permissions (feature flags per role).
5. Whether **Scout** should gain `invite_members` for recruiting without full **manage_members** (product tweak).

---

*Document version: 1.0 — aligns with repository schema as of implementation planning; update when `decks` or auth patterns change.*
