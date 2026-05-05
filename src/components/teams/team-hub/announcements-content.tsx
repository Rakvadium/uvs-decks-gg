"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTeamHub } from "./hook";
import type { TeamHubCaps } from "./team-hub-caps";

interface TeamHubAnnouncementsContentProps {
  teamId: string;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamHubAnnouncementsContent({ teamId }: TeamHubAnnouncementsContentProps) {
  const id = teamId as Id<"teams">;
  const { notFound: teamGone } = useTeamHub(teamId);
  const caps = useQuery(
    api.teams.hub.getHubCapabilities,
    !teamGone ? { teamId: id } : "skip",
  );
  const pinned = useQuery(
    api.teams.announcements.listPinned,
    !teamGone ? { teamId: id } : "skip",
  );
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.teams.announcements.listUnpinnedPage,
    teamGone ? "skip" : { teamId: id },
    { initialNumItems: 15 },
  );
  const create = useMutation(api.teams.announcements.create);
  const update = useMutation(api.teams.announcements.update);
  const remove = useMutation(api.teams.announcements.remove);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (createOpen) return;
    setTitle("");
    setBody("");
  }, [createOpen]);

  const onCreate = useCallback(async () => {
    if (!caps?.canPostAnnouncements) return;
    setSubmitting(true);
    try {
      await create({ teamId: id, title, body });
      setCreateOpen(false);
      toast.success("Posted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    } finally {
      setSubmitting(false);
    }
  }, [body, caps?.canPostAnnouncements, create, id, title]);

  if (teamGone) {
    return null;
  }

  if (caps === undefined || pinned === undefined || (isLoading && results.length === 0)) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  if (caps === null || pinned === null) {
    return <p className="text-sm text-muted-foreground">You do not have access to announcements.</p>;
  }

  const showLoadMore = status === "CanLoadMore" || status === "LoadingMore";
  const pinnedList = pinned;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pinned items stay at the top. Everyone can post; co-captains and the captain can pin or remove
            others&apos; posts.
          </p>
        </div>
        {caps.canPostAnnouncements ? (
          <Button
            type="button"
            className="h-9 shrink-0 font-mono text-xs uppercase tracking-wider sm:mt-0.5"
            onClick={() => setCreateOpen(true)}
          >
            Create Announcement
          </Button>
        ) : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="md" className="p-0" footer={null} showCloseButton>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Visible to everyone on the team. Title and body are required.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="ann-title" className="text-xs font-mono uppercase tracking-wider">
                Title
              </Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-body" className="text-xs font-mono uppercase tracking-wider">
                Body
              </Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[120px] resize-y"
                placeholder="Details for the team"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={submitting || !title.trim() || !body.trim()}
              onClick={() => void onCreate()}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pinnedList.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-primary">Pinned</h2>
          <ul className="space-y-3">
            {pinnedList.map((row) => (
              <AnnouncementCard
                key={row.announcement._id}
                row={row}
                caps={caps}
                onPin={async (next: boolean) => {
                  try {
                    await update({ announcementId: row.announcement._id, pinned: next });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not update");
                  }
                }}
                onRemove={async () => {
                  try {
                    await remove({ announcementId: row.announcement._id });
                    toast.success("Removed");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not remove");
                  }
                }}
                onSaveEdit={async (t: string, b: string) => {
                  try {
                    await update({ announcementId: row.announcement._id, title: t, body: b });
                    toast.success("Saved");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not save");
                  }
                }}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Chronological</h2>
        {showLoadMore && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-mono text-xs uppercase tracking-wider"
              disabled={status === "LoadingMore"}
              onClick={() => loadMore(12)}
            >
              {status === "LoadingMore" ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
        {results.length === 0 && pinnedList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {results.map((row) => (
              <AnnouncementCard
                key={row.announcement._id}
                row={row}
                caps={caps}
                onPin={async (next: boolean) => {
                  try {
                    await update({ announcementId: row.announcement._id, pinned: next });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not update");
                  }
                }}
                onRemove={async () => {
                  try {
                    await remove({ announcementId: row.announcement._id });
                    toast.success("Removed");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not remove");
                  }
                }}
                onSaveEdit={async (t: string, b: string) => {
                  try {
                    await update({ announcementId: row.announcement._id, title: t, body: b });
                    toast.success("Saved");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not save");
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  row,
  caps,
  onPin,
  onRemove,
  onSaveEdit,
}: {
  row: {
    announcement: {
      _id: Id<"teamAnnouncements">;
      title: string;
      body: string;
      pinned: boolean;
      createdAt: number;
      authorUserId: Id<"users">;
    };
    authorUsername?: string;
  };
  caps: TeamHubCaps;
  onPin: (next: boolean) => Promise<void>;
  onRemove: () => Promise<void>;
  onSaveEdit: (title: string, body: string) => Promise<void>;
}) {
  const a = row.announcement;
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState(a.title);
  const [b, setB] = useState(a.body);
  const isAuthor = a.authorUserId === caps.viewerUserId;
  const canDelete = isAuthor || caps.canModerateChat;

  return (
    <li className="rounded-lg border border-border/60 bg-background/60 p-4 shadow-[0_0_0_1px_hsl(var(--border)/0.2)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <Input value={t} onChange={(e) => setT(e.target.value)} className="font-medium" />
              <Textarea value={b} onChange={(e) => setB(e.target.value)} className="min-h-[100px] resize-y" />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    await onSaveEdit(t, b);
                    setEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-display text-base font-semibold text-foreground">{a.title}</h3>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/90">{a.body}</p>
            </>
          )}
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <p>{row.authorUsername?.trim() || a.authorUserId.slice(-6)}</p>
          <time className="mt-0.5 block" dateTime={new Date(a.createdAt).toISOString()}>
            {formatDate(a.createdAt)}
          </time>
        </div>
      </div>
      {!editing && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/40 pt-3">
          {caps.canPinAnnouncements && (
            <div className="flex items-center gap-2">
              <Switch
                id={`pin-${a._id}`}
                checked={a.pinned}
                onCheckedChange={(c) => void onPin(c === true)}
              />
              <Label htmlFor={`pin-${a._id}`} className="text-xs text-muted-foreground">
                Pinned
              </Label>
            </div>
          )}
          {caps.canPostAnnouncements && isAuthor && (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => void onRemove()}>
              Remove
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
