"use client";

import { useMutation, useQuery } from "convex/react";
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
import { Textarea } from "@/components/ui/textarea";
import { useTeamHub } from "./hook";

function formatRange(starts: number, ends: number | undefined) {
  const a = new Date(starts);
  const s = a.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  if (ends === undefined) {
    return s;
  }
  const b = new Date(ends);
  if (a.toDateString() === b.toDateString()) {
    return `${s} – ${b.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `${s} – ${b.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

interface TeamHubEventsContentProps {
  teamId: string;
}

function localInputValue(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function TeamHubEventsContent({ teamId }: TeamHubEventsContentProps) {
  const id = teamId as Id<"teams">;
  const { notFound: teamGone } = useTeamHub(teamId);
  const caps = useQuery(
    api.teams.hub.getHubCapabilities,
    !teamGone ? { teamId: id } : "skip",
  );
  const events = useQuery(api.teams.events.listForHub, !teamGone ? { teamId: id } : "skip");
  const create = useMutation(api.teams.events.create);
  const remove = useMutation(api.teams.events.remove);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [starts, setStarts] = useState(() => localInputValue(new Date()));
  const [ends, setEnds] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (createOpen) return;
    setTitle("");
    setDescription("");
    setEnds("");
    setStarts(localInputValue(new Date()));
  }, [createOpen]);

  const onCreate = useCallback(async () => {
    if (!caps?.canManageEvents) return;
    setSubmitting(true);
    const startsAt = new Date(starts).getTime();
    if (Number.isNaN(startsAt)) {
      toast.error("Invalid start time");
      setSubmitting(false);
      return;
    }
    let endsAt: number | undefined;
    if (ends.trim()) {
      const e = new Date(ends).getTime();
      if (Number.isNaN(e)) {
        toast.error("Invalid end time");
        setSubmitting(false);
        return;
      }
      endsAt = e;
    }
    try {
      await create({
        teamId: id,
        title,
        description: description.trim() || undefined,
        startsAt,
        endsAt,
      });
      setCreateOpen(false);
      toast.success("Event created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
    } finally {
      setSubmitting(false);
    }
  }, [caps?.canManageEvents, create, description, ends, id, starts, title]);

  if (teamGone) {
    return null;
  }

  if (caps === undefined || events === undefined) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  if (caps === null || events === null) {
    return <p className="text-sm text-muted-foreground">You do not have access to the team calendar.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled team events, sorted by start time. Co-captains and the captain can add or remove
            events.
          </p>
        </div>
        {caps.canManageEvents ? (
          <Button
            type="button"
            className="h-9 shrink-0 font-mono text-xs uppercase tracking-wider sm:mt-0.5"
            onClick={() => setCreateOpen(true)}
          >
            Create Calendar Item
          </Button>
        ) : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="md" className="p-0" footer={null} showCloseButton>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Create Calendar Item</DialogTitle>
            <DialogDescription>Add a time-bound entry for the team calendar. Title is required.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="ev-title" className="text-xs font-mono uppercase tracking-wider">
                Title
              </Label>
              <Input
                id="ev-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Scrim, review session…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-desc" className="text-xs font-mono uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ev-start" className="text-xs font-mono uppercase tracking-wider">
                  Starts
                </Label>
                <Input
                  id="ev-start"
                  type="datetime-local"
                  value={starts}
                  onChange={(e) => setStarts(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-end" className="text-xs font-mono uppercase tracking-wider">
                  Ends
                </Label>
                <Input
                  id="ev-end"
                  type="datetime-local"
                  value={ends}
                  onChange={(e) => setEnds(e.target.value)}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" disabled={submitting || !title.trim()} onClick={() => void onCreate()}>
              Add to calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Upcoming &amp; past</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events scheduled.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((row) => {
              const e = row.event;
              return (
                <li
                  key={e._id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/60 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{e.title}</p>
                    {e.description?.trim() ? (
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{e.description}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-xs text-primary">{formatRange(e.startsAt, e.endsAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      Added by {row.creatorUsername?.trim() || e.createdByUserId.slice(-6)}
                    </p>
                  </div>
                  {caps.canManageEvents && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 self-start text-destructive"
                      onClick={async () => {
                        try {
                          await remove({ eventId: e._id });
                          toast.success("Event removed");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not remove");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
