# Memory system — tcg-decks

This document is a **placeholder** for long-lived product “memory” concepts beyond normal database tables (for example, user-specific AI context, cross-session notes, or external knowledge bases).

**Today:** Persistent product state lives in **Convex tables** described in [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md). User preferences such as theme and gallery filters use the `sessions` table pattern.

If you introduce a dedicated memory or AI context layer, document storage tiers, retention, and privacy here and link from [PRODUCT_VISION.md](./PRODUCT_VISION.md).
