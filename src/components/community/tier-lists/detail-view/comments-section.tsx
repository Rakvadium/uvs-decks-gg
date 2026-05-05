"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useCommunityTierListDetailContext } from "./context";

export function CommunityTierListDetailCommentsSection() {
  const { detail } = useCommunityTierListDetailContext();
  const { display, viewerUserId } = useProfanityDisplayText();

  if (!detail || detail.comments.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60 bg-card/75">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.comments.map((row) => {
          const isOwn =
            viewerUserId != null && row.comment.userId === viewerUserId;
          const body = display(row.comment.content, isOwn);
          const who =
            row.author?.username?.trim() ||
            row.author?.email?.trim() ||
            String(row.comment.userId).slice(-6);

          return (
            <div
              key={row.comment._id}
              className="border-b border-border/40 pb-4 last:border-0 last:pb-0"
            >
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">{body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {who}
                <time
                  className="ml-2 font-mono"
                  dateTime={new Date(row.comment.createdAt).toISOString()}
                >
                  {new Date(row.comment.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
