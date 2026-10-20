import type { Doc } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

type TierListModerationStatus = Doc<"tierLists">["listModerationStatus"];

const HIDDEN_STATUS = {
  pending: { label: "In review", tone: "warning", hint: "Hidden from the public until moderation approves it." },
  rejected: { label: "Rejected", tone: "destructive", hint: "Hidden from the public by moderation." },
} as const;

/** Same rule as `isTierListHiddenByModeration` in convex/validators.ts. */
export function isHiddenByModeration(
  status: TierListModerationStatus
): status is keyof typeof HIDDEN_STATUS {
  return status === "pending" || status === "rejected";
}

/**
 * Tells a list's owner (or an admin) why it isn't public. Convex only sends the status to them, and
 * nothing renders for approved lists.
 */
export function TierListModerationBadge({
  status,
  className,
}: {
  status: TierListModerationStatus;
  className?: string;
}) {
  if (!isHiddenByModeration(status)) {
    return null;
  }
  const { label, tone, hint } = HIDDEN_STATUS[status];
  return (
    <Badge tone={tone} title={hint} className={className}>
      {label}
      <span className="sr-only">. {hint}</span>
    </Badge>
  );
}
