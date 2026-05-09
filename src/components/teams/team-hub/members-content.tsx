"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeamHub } from "./hook";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  co_captain: "Co-captain",
  architect: "Architect",
  analyst: "Analyst",
  scout: "Scout",
  pilot: "Pilot",
};

const ASSIGNABLE_ORDER = ["co_captain", "architect", "analyst", "scout", "pilot"] as const;

interface TeamHubMembersContentProps {
  teamId: string;
}

function initialsFor(username: string | undefined, userId: string) {
  if (username?.trim()) {
    return username.slice(0, 2).toUpperCase();
  }
  return userId.slice(-2);
}

export function TeamHubMembersContent({ teamId }: TeamHubMembersContentProps) {
  const id = teamId as Id<"teams">;
  const { notFound: teamGone } = useTeamHub(teamId);
  const caps = useQuery(api.teams.hub.getHubCapabilities, !teamGone ? { teamId: id } : "skip");
  const data = useQuery(api.teams.members.listForHub, { teamId: id });
  const updateRole = useMutation(api.teams.members.updateMemberRole);
  const createInvite = useMutation(api.teams.invites.createInvite);
  const [pendingId, setPendingId] = useState<Id<"users"> | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteStep, setInviteStep] = useState<"form" | "link">("form");
  const [inviteRole, setInviteRole] = useState<(typeof ASSIGNABLE_ORDER)[number]>("pilot");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (inviteOpen) return;
    setInviteStep("form");
    setInviteRole("pilot");
    setInviteToken(null);
    setCopied(false);
  }, [inviteOpen]);

  const onRoleChange = useCallback(
    async (targetUserId: Id<"users">, newRole: string) => {
      setPendingId(targetUserId);
      try {
        await updateRole({
          teamId: id,
          userId: targetUserId,
          role: newRole as Doc<"teamMembers">["role"],
        });
        toast.success("Role updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update role");
      } finally {
        setPendingId(null);
      }
    },
    [id, updateRole],
  );

  const onCreateInvite = useCallback(async () => {
    setInviteBusy(true);
    try {
      const { token } = await createInvite({
        teamId: id,
        role: inviteRole,
      });
      setInviteToken(token);
      setInviteStep("link");
      toast.success("Invite link ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invite");
    } finally {
      setInviteBusy(false);
    }
  }, [createInvite, id, inviteRole]);

  const inviteUrl =
    typeof window !== "undefined" && inviteToken ? `${window.location.origin}/teams/invite/${inviteToken}` : "";

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }, [inviteUrl]);

  if (teamGone) {
    return null;
  }

  if (data === undefined) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-md bg-muted/80" />
      </div>
    );
  }

  if (data === null) {
    return <p className="text-sm text-muted-foreground">You do not have access to the member list.</p>;
  }

  const { members, viewer } = data;
  const isEmpty = members.length === 0;
  const showInvite = caps?.canInviteMembers === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roles and access follow the team capability matrix. Only co-captains and the captain can change roles.
          </p>
        </div>
        {showInvite ? (
          <Button
            type="button"
            className="h-9 shrink-0 font-mono text-xs uppercase tracking-wider sm:mt-0.5"
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        ) : null}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent size="md" contentPadding="none" className="p-0" footer={null} showCloseButton>
          {inviteStep === "form" ? (
            <>
              <DialogHeader className="px-6">
                <DialogTitle>Invite member</DialogTitle>
                <DialogDescription>
                  Create a one-time link for a single teammate. After they accept or decline on the invite page, the
                  link stops working. Anyone with the link before then can use their account to respond.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4 px-6">
                <div className="space-y-2">
                  <Label htmlFor="invite-role" className="text-xs font-mono uppercase tracking-wider">
                    Role when they join
                  </Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as (typeof ASSIGNABLE_ORDER)[number])}>
                    <SelectTrigger id="invite-role" className="w-full max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ORDER.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r] ?? r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={inviteBusy}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={inviteBusy}
                  onClick={() => void onCreateInvite()}
                >
                  Create invite link
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="px-6">
                <DialogTitle>Share this link</DialogTitle>
                <DialogDescription>
                  Send it only to the person you intend to add. The link expires after seven days if unused.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-3 px-6">
                <div className="flex min-w-0 gap-2">
                  <Input readOnly value={inviteUrl} className="min-w-0 font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => void copyLink()}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button">Done</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {isEmpty ? (
        <div
          className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center"
          role="status"
        >
          <p className="text-sm text-muted-foreground">No active members in this team.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40%] min-w-[180px]">Member</TableHead>
                <TableHead className="min-w-[160px]">Role</TableHead>
                <TableHead className="w-[1%] min-w-[120px] whitespace-nowrap">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const showEditor = viewer.canAssignRoles && !m.isCaptain;
                return (
                  <TableRow key={m.memberId}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          {m.image ? <AvatarImage src={m.image} alt="" /> : null}
                          <AvatarFallback className="text-xs">{initialsFor(m.username, m.userId)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {m.username?.trim() || "Player"}
                            {m.userId === viewer.userId ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {m.isCaptain ? (
                        <span className="text-sm text-foreground">{ROLE_LABEL.captain}</span>
                      ) : showEditor ? (
                        <Select
                          value={m.role}
                          onValueChange={(v) => onRoleChange(m.userId, v)}
                          disabled={pendingId === m.userId}
                        >
                          <SelectTrigger size="sm" className="w-[200px] max-w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_ORDER.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABEL[r] ?? r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-foreground">{ROLE_LABEL[m.role] ?? m.role}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
