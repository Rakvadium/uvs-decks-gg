# Content moderation and language filter

This document describes how to add a **language / profanity-style filter (on by default)**, **moderated team logos**, and an **extensible moderation pipeline** for **user profile images** and future user-generated visuals. It fits the current stack (Convex, Next.js, `@convex-dev/auth`, `users` + `sessions` as today).

**Related:** [teams-feature-implementation.md](./teams-feature-implementation.md) (team logos, hub).

---

## 1. Language filter (default on)

### 1.1 What “filter” means

Pick a product definition and apply it consistently:

| Scope | Example surfaces |
|-------|-------------------|
| **Display-time** | Replace or obscure strong language in chat messages, comments, tier list titles/descriptions, deck names/descriptions shown to other users. |
| **Compose-time** | Warn or block on submit when publishing public or team-visible content. |

**Default:** Filter **on** for all new and existing users when the preference is unset (`undefined` treated as `true`). Users may turn it **off** in **Settings** (only affects **their own** display of others’ text, or optionally both display and whether they see warnings—product choice).

**Clarify in UX copy:** “Hide strong language in community content” vs “Also filter my own writing previews” if you split behaviors.

### 1.2 Where to store the preference

**Option A (recommended):** Add fields on `users` so the preference follows the account on every device:

- `profanityFilterEnabled: v.optional(v.boolean())` — read as `!== false` for default-on.

**Option B:** Extend `sessions` (already holds theme, gallery filters) with the same flag for faster session-only experiments; migrate to `users` if you need cross-device consistency.

Settings UI: toggle bound to `updateProfile` or a dedicated `updateContentPreferences` mutation.

### 1.3 Implementation approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Client-side word list** | Cheap, offline, no API key in hot path | Easy to bypass; poor i18n; maintenance |
| **Hosted moderation API (text)** | Better recall, languages, tuning | Cost, latency, privacy review |
| **Hybrid** | List for instant UI; API for publish on sensitive paths | More moving parts |

**Services (text toxicity / profanity):**

- **[Perspective API](https://perspectiveapi.com/)** (Google/Jigsaw) — toxicity scores; widely used; quota and ToS for your use case.
- **Azure AI Content Safety** — categories and severity; fits enterprise stacks.
- **OpenAI Moderation API** — category flags; good if you already use OpenAI.
- **Hive, Sightengine** — often stronger for multimodal pipelines; can align with image moderation vendor.

**App pattern:**

1. **Read path:** Query returns raw text; client applies filter if `profanityFilterEnabled !== false` using a small library or masked segments returned from a lightweight edge function.
2. **Write path (public/team content):** Convex **action** calls provider; reject or flag if above threshold; store `moderationStatus` on the document for admin review.

For **default-on “soft” filter**, many products only **mask display** (e.g. `████`) without blocking writes, unless the score is extreme.

**Implementation (MC-004):** `convex/lib/moderation/textPublish.ts` (`evaluatePublishText`), optional providers **`stub`**, **`perspective`**, **`azure`**, **`openai`**. Entry points: `api.publishTierListComment.submitTierListComment` (public tier list comments when moderation is enabled), `api.publishTeamChatMessage.submitTeamChatMessage` (team chat when enabled). `api.textModeration.publishGate` exposes whether the client should use those actions. Heuristic spam/profanity checks live in `convex/lib/moderation/localCommentHeuristic.ts` and are merged with API results. **`tierListComments`** and **`teamChatMessages`** may store `textModerationProvider` and `textModerationResult` for audit.

#### 1.3.1 Convex environment variables (publish-time text)

Set in the [Convex dashboard](https://dashboard.convex.dev) (secrets only in deployment env; used from **actions**).

| Variable | Values / notes |
|----------|----------------|
| `TEXT_MODERATION_PROVIDER` | Omit, `off`, `false`, or `0` — no publish-time API; mutations work as before for gated paths. `stub` — no external call; records pipeline placeholder in `textModerationResult`. `perspective` — [Perspective API](https://perspectiveapi.com/) toxicity score. `azure` — Azure AI Content Safety text analyze. `openai` — OpenAI Moderation API. |
| `TEXT_MODERATION_REJECT_THRESHOLD` | Optional; **0–1** default **0.72**. Perspective: attribute `TOXICITY` summary score. OpenAI: max category score or `flagged`. Azure: severity 0–6 per category; reject when `severity >= ceil(threshold * 6)`. |
| `TEXT_MODERATION_ON_FAILURE` | **`allow`** (default) — on provider/network error, treat as approved for API layer (local heuristics still apply). **`queue`** — on failure, treat as **needs_review** (tier list comments → `pending` / held; team chat still blocks until approved — failure queues as blocked with user-visible message). |
| `PERSPECTIVE_API_KEY` | Required when `TEXT_MODERATION_PROVIDER=perspective`. |
| `AZURE_CONTENT_SAFETY_ENDPOINT` | Resource URL, no trailing slash; required when provider is `azure`. |
| `AZURE_CONTENT_SAFETY_KEY` | Subscription key; required when provider is `azure`. |
| `OPENAI_API_KEY` | Required when `TEXT_MODERATION_PROVIDER=openai`. |

When `TEXT_MODERATION_PROVIDER` is not `off`, **`tierLists.addComment`** rejects for **public** tier lists (callers must use **`api.publishTierListComment.submitTierListComment`**). **`teams.chat.createMessage`** rejects (callers must use **`api.publishTeamChatMessage.submitTeamChatMessage`**). Private tier list comments keep using **`addComment`** with heuristics only.

### 1.4 Convex shape (illustrative)

- `users.profanityFilterEnabled?: boolean` — default-on when missing.
- Optional `contentModerationScores` on high-risk tables later (tier lists, chat) if you store scores for appeals.

---

## 2. Why images need a pipeline

Today, **profile image** is a **URL string** on `users.image` (`convex/user.ts` `updateProfile`). That avoids upload cost but **bypasses your control** (any URL can point to arbitrary content). Team logos should **not** repeat that pattern for uploads.

**Goal:** Any **binary upload** (team logo, future profile photo) goes: **upload → record pending → moderate → attach to entity only if approved** (or quarantine for admin).

---

## 3. Extensible moderation architecture

### 3.1 Core ideas

1. **Single abstraction:** `ModerationSubject` = `{ kind, ownerId, storageId | url, metadata }`.
2. **Async boundary:** Convex **action** calls external APIs (keys in env); mutations create/update **pending** rows; actions finalize status.
3. **Pluggable provider:** One interface in code, multiple backends (Rekognition, Azure, Sightengine, Hive, etc.).
4. **Audit trail:** Store provider, raw response snapshot (or hashed), decision, `reviewedAt`, optional `reviewerUserId` for human override.

### 3.2 Suggested tables

**`mediaAssets`** (or `uploadedAssets`)

| Field | Purpose |
|-------|---------|
| `kind` | `team_logo` \| `profile_avatar` \| future values |
| `teamId` / `userId` | Owning scope |
| `storageId` | Convex `_storage` id after `generateUploadUrl` |
| `status` | `pending` \| `approved` \| `rejected` \| `needs_review` |
| `moderationProvider` | e.g. `sightengine` |
| `moderationResult` | `v.any()` or structured object (scores, labels) |
| `createdAt` / `resolvedAt` | |

**`teams.logoAssetId`** (optional) — `Id<"mediaAssets">` only when `status === "approved"`; or duplicate `logoUrl` denormalized for fast reads.

**Indexes:** `by_status`, `by_teamId`, `by_userId`, `by_kind_and_status`.

### 3.3 Flow

```text
Client                    Convex                         Provider
  |  generateUploadUrl       |                              |
  |------------------------->|                              |
  |  PUT file                |                              |
  |------------------------->| (storage)                    |
  |  mutation createAsset    |                              |
  |  status=pending          |                              |
  |------------------------->|                              |
  |                          |  action runModeration        |
  |                          |----------------------------->|
  |                          |<-----------------------------|
  |                          |  mutation finalizeAsset      |
  |                          |  approved/rejected           |
  |  subscribe asset status  |                              |
  |<-------------------------|                              |
```

**Human review:** Items in `needs_review` appear in an admin queue; admin mutation sets `approved` and attaches to team/user.

### 3.4 Provider interface (conceptual)

One module, e.g. `convex/lib/moderation/providers.ts`, exposes:

- `moderateImage(bytes | url, context): Promise<ModerationVerdict>`
- **Text (MC-004):** `convex/lib/moderation/textPublish.ts` — `evaluatePublishText(text, context)` returning decision + `raw` scores / provider payload for storage.

`ModerationVerdict` includes: `decision`, `categories`, `confidence`, `raw` for logging.

Swap providers via env `MODERATION_IMAGE_PROVIDER` without changing call sites.

### 3.5 Image moderation services (compare)

| Service | Notes |
|---------|--------|
| **AWS Rekognition** | Moderation labels; common in AWS shops |
| **Google Cloud Vision Safe Search** | Adult/violence/racy scores |
| **Azure AI Content Safety** | Unified text + image |
| **Sightengine, Hive** | Strong for UGC platforms; simple APIs |

**Convex constraint:** Actions may **fetch** a signed URL to the file or pass bytes if size allows; very large files → provider that accepts HTTPS URL + generate short-lived signed URL from Convex storage.

### 3.6 Team logo (ties to teams doc)

- Captain (or capability `edit_team_settings`) requests upload.
- Logo is **not** visible to the public team page until `mediaAssets.status === "approved"`.
- Rejected: show generic placeholder + “Logo didn’t pass content guidelines.”

### 3.7 Profile avatars (migration path)

**Phase 1:** Keep URL field but **optional** “verified upload” path: new field `avatarAssetId` approved from same pipeline; UI prefers uploaded asset over raw URL.

**Phase 2:** Deprecate free-form URL for new users or require moderation if URL host is not on an allowlist (still weaker than upload pipeline).

---

## 4. Security and compliance

- **Secrets:** API keys only in Convex **environment** / dashboard, used from **actions** only.
- **PII:** Send minimal text to third parties; record data processing agreements.
- **Kids / regional rules:** If you target minors, stricter defaults and logging may apply.
- **Appeals:** Simple “contact support” plus stored `moderationResult` id for support lookup.

---

## 5. Settings UI

- New section **Content & safety** (or under existing Settings):
  - Toggle **“Filter strong language in community content”** — maps to `profanityFilterEnabled`, default on.
- Short explanation and link to community guidelines.

---

## 6. Implementation checklist

1. Add `users.profanityFilterEnabled` (optional); treat `undefined` as **on** everywhere.
2. Settings toggle + mutation; hydrate from `currentUser`.
3. Add display-time filter helper used by chat, comments, public deck cards (parameterized by user preference).
4. Introduce `mediaAssets` + `generateUploadUrl` flow for **team logo** first.
5. Implement `runModeration` action + provider adapter.
6. Wire team hub to show logo only when approved; admin queue for `needs_review`.
7. Extend same pipeline to **profile avatar** uploads when ready.

---

## 7. Open decisions

1. Filter **only display** vs also **block publishes** above toxicity threshold.
2. Whether turning the filter **off** is allowed for underage accounts (if you add age gates later).
3. Single vendor vs separate vendors for text vs image (cost vs simplicity).

---

*This doc is planning-only; update when schema and provider choices are fixed.*
