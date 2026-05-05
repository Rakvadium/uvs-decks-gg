"use client";

import { useAction, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfanityDisplayText } from "@/lib/moderation/use-profanity-display-text";
import { useTeamHub } from "./hook";

interface TeamHubChatContentProps {
  teamId: string;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamHubChatContent({ teamId }: TeamHubChatContentProps) {
  const { display } = useProfanityDisplayText();
  const id = teamId as Id<"teams">;
  const { notFound: teamGone } = useTeamHub(teamId);
  const caps = useQuery(
    api.teams.hub.getHubCapabilities,
    !teamGone ? { teamId: id } : "skip",
  );
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.teams.chat.listPage,
    teamGone ? "skip" : { teamId: id },
    { initialNumItems: 30 },
  );
  const publishMod = useQuery(api.textModeration.publishGate, teamGone ? "skip" : {});
  const createMessage = useMutation(api.teams.chat.createMessage);
  const submitModeratedChat = useAction(api.publishTeamChatMessage.submitTeamChatMessage);
  const updateMessage = useMutation(api.teams.chat.updateMessage);
  const deleteMessage = useMutation(api.teams.chat.deleteMessage);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<Id<"teamChatMessages"> | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const onSend = useCallback(async () => {
    const text = body.trim();
    if (!text || !caps?.canPostChat) return;
    setPending(true);
    try {
      if (publishMod?.teamChat) {
        await submitModeratedChat({ teamId: id, body: text });
      } else {
        await createMessage({ teamId: id, body: text });
      }
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setPending(false);
    }
  }, [body, caps?.canPostChat, createMessage, id, publishMod?.teamChat, submitModeratedChat]);

  if (teamGone) {
    return null;
  }

  if (caps === undefined || (isLoading && results.length === 0)) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  if (caps === null) {
    return <p className="text-sm text-muted-foreground">You do not have access to team chat.</p>;
  }

  const showLoadMore = status === "CanLoadMore" || status === "LoadingMore";

  return (
    <div className="flex h-[min(70vh,560px)] flex-col gap-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team channel — newest messages at the bottom. Load older above.
        </p>
      </div>
      {showLoadMore && (
        <div className="flex shrink-0 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-mono text-xs uppercase tracking-wider"
            disabled={status === "LoadingMore"}
            onClick={() => loadMore(25)}
          >
            {status === "LoadingMore" ? "Loading…" : "Load older messages"}
          </Button>
        </div>
      )}
      <div
        className="flex min-h-0 flex-1 flex-col-reverse gap-2 overflow-y-auto rounded-lg border border-border/60 bg-muted/10 p-3"
        role="log"
        aria-live="polite"
      >
        {results.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          results.map((row) => {
            const m = row.message;
            return (
              <div
                key={m._id}
                className="rounded-md border border-border/40 bg-background/80 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {row.authorUsername?.trim() || m.authorUserId.slice(-6)}
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={new Date(m.createdAt).toISOString()}>
                    {formatTime(m.createdAt)}
                  </time>
                </div>
                {editingId === m._id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="min-h-[80px] resize-y"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateMessage({ messageId: m._id, body: editDraft });
                            setEditingId(null);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Update failed");
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap break-words text-foreground">
                    {display(m.body, caps.viewerUserId === m.authorUserId)}
                  </p>
                )}
                {editingId !== m._id && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {caps.canPostChat && m.authorUserId === caps.viewerUserId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingId(m._id);
                          setEditDraft(m.body);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {(m.authorUserId === caps.viewerUserId || caps.canModerateChat) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={async () => {
                          try {
                            await deleteMessage({ messageId: m._id });
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Delete failed");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {caps.canPostChat && (
        <div className="shrink-0 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message the team…"
            className="min-h-[88px] resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void onSend();
              }
            }}
          />
          <Button type="button" disabled={pending || !body.trim()} onClick={() => void onSend()}>
            Send
          </Button>
          <p className="text-xs text-muted-foreground">Press Ctrl+Enter to send</p>
        </div>
      )}
      {!caps.canPostChat && (
        <p className="text-sm text-muted-foreground">You do not have permission to post in this chat.</p>
      )}
    </div>
  );
}
