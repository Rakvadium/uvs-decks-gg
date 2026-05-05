"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function AdminUserDetailPageClient() {
  const params = useParams();
  const raw = params.userId;
  const idStr = Array.isArray(raw) ? raw[0] : raw;
  if (typeof idStr !== "string" || idStr.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Invalid user id in URL.</div>
    );
  }
  const userId = idStr as Id<"users">;
  return <AdminUserDetailInner userId={userId} />;
}

function AdminUserDetailInner({ userId }: { userId: Id<"users"> }) {
  const data = useQuery(api.adminUsers.getUserAdminDetail, { userId });
  const audit = usePaginatedQuery(
    api.adminUsers.listModerationAudit,
    { targetUserId: userId },
    { initialNumItems: 15 }
  );
  const setStatus = useMutation(api.adminUsers.setAccountStatus);
  const setRole = useMutation(api.adminUsers.setUserRole);
  const bulkMod = useMutation(api.adminUsers.bulkSetTierListListModeration);
  const [statusDialog, setStatusDialog] = useState<"suspend" | "ban" | "write" | "active" | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [userFacingMessage, setUserFacingMessage] = useState("");
  const [statusExpiresAt, setStatusExpiresAt] = useState("");
  const [selectedTiers, setSelectedTiers] = useState<Set<string>>(() => new Set());
  if (data === undefined) {
    return (
      <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading…</div>
    );
  }
  if (data === null) {
    return (
      <div className="p-6 text-sm text-muted-foreground">User not found.</div>
    );
  }
  const { user } = data;
  const runStatus = async (
    next: "active" | "suspended" | "banned" | "write_restricted"
  ) => {
    try {
      const exp =
        statusExpiresAt.trim() === "" ? undefined : Date.parse(statusExpiresAt);
      await setStatus({
        targetUserId: userId,
        nextStatus: next,
        statusReason: statusReason.trim() || undefined,
        userFacingMessage: userFacingMessage.trim() || undefined,
        statusExpiresAt:
          next === "active" || exp === undefined || Number.isNaN(exp) ? undefined : exp,
      });
      toast.success("Account status updated.");
      setStatusDialog(null);
      setStatusReason("");
      setUserFacingMessage("");
      setStatusExpiresAt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };
  const runRole = async (role: "Admin" | "user") => {
    try {
      await setRole({ targetUserId: userId, role });
      toast.success("Role updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };
  const runBulkTier = async (s: "approved" | "rejected") => {
    const ids = [...selectedTiers].map((x) => x as Id<"tierLists">);
    if (ids.length === 0) {
      toast.error("Select at least one list.");
      return;
    }
    try {
      await bulkMod({ tierListIds: ids, listModerationStatus: s });
      toast.success("Tier lists updated.");
      setSelectedTiers(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };
  return (
    <div className="flex min-h-0 flex-col gap-6 pb-10">
      <AdminPageHeader
        title={user.username ?? user._id}
        description="Staff-only internal reason vs user-facing message. Only the user-facing copy is shown in the app banner to the account holder."
        backHref="/admin/users"
        backLabel="Users"
        meta={
          <p className="text-sm text-muted-foreground font-mono break-all">{user._id}</p>
        }
      />
      <div className="grid max-w-3xl gap-6">
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Profile</h2>
          <dl className="grid gap-1 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{user.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email verified</dt>
              <dd>{user.emailVerificationTime ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Anonymous</dt>
              <dd>{user.isAnonymous ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status (raw)</dt>
              <dd className="capitalize">{user.accountStatus}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Internal reason (staff)</dt>
              <dd className="whitespace-pre-wrap text-muted-foreground">
                {user.statusReason ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">User-facing message (in-app)</dt>
              <dd className="whitespace-pre-wrap text-muted-foreground">
                {user.userFacingMessage ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Counts (capped at 500)</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Decks: {data.deckCount}{data.deckCountCapped ? "+" : ""}</li>
            <li>Tier lists: {data.tierListCount}{data.tierListCountCapped ? "+" : ""}</li>
            <li>Tier list comments: {data.commentCount}{data.commentCountCapped ? "+" : ""}</li>
            <li>Team chat messages: {data.teamChatMessageCount}{data.teamChatMessageCountCapped ? "+" : ""}</li>
          </ul>
        </section>
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Role</h2>
          <Select
            value={user.role === "Admin" ? "Admin" : "user"}
            onValueChange={(v) => void runRole(v as "Admin" | "user")}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </section>
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Account status</h2>
          <p className="text-sm text-muted-foreground">
            User-facing copy is shown on the account banner. Internal reason is for moderators only.
          </p>
          <div className="space-y-2 max-w-lg">
            <div>
              <Label htmlFor="srf">Internal reason (optional)</Label>
              <Textarea
                id="srf"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ufm">User-facing message (optional)</Label>
              <Textarea
                id="ufm"
                value={userFacingMessage}
                onChange={(e) => setUserFacingMessage(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="exp">Status expiry (local datetime, optional)</Label>
              <Input
                id="exp"
                type="datetime-local"
                value={statusExpiresAt}
                onChange={(e) => setStatusExpiresAt(e.target.value)}
                className="mt-1 max-w-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="default" onClick={() => setStatusDialog("active")}>
              Set active
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStatusDialog("write")}>
              Write restricted
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStatusDialog("suspend")}>
              Suspend
            </Button>
            <Button type="button" variant="destructive" onClick={() => setStatusDialog("ban")}>
              Ban
            </Button>
          </div>
        </section>
        {data.pendingTierListIds.length > 0 ? (
          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="text-sm font-medium">Pending tier list moderation</h2>
            <ul className="space-y-2">
              {data.pendingTierListIds.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedTiers.has(id)}
                    onCheckedChange={(c) => {
                      setSelectedTiers((prev) => {
                        const n = new Set(prev);
                        if (c === true) n.add(id);
                        else n.delete(id);
                        return n;
                      });
                    }}
                  />
                  <Link
                    className="text-primary hover:underline text-sm"
                    href={`/community/tier-lists/${id}`}
                  >
                    Open list
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" onClick={() => void runBulkTier("approved")}>
                Approve selected
              </Button>
              <Button type="button" variant="outline" onClick={() => void runBulkTier("rejected")}>
                Reject selected
              </Button>
            </div>
          </section>
        ) : null}
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Moderation audit (this user)</h2>
          {audit.status === "LoadingFirstPage" ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : audit.results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {audit.results.map((row) => (
                <li key={row._id} className="border-b border-border/60 pb-2">
                  <div className="font-medium">{row.action}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row._creationTime).toLocaleString()}
                  </div>
                  {row.payload ? (
                    <pre className="text-xs mt-1 whitespace-pre-wrap break-all text-muted-foreground max-h-24 overflow-y-auto">
                      {row.payload}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {audit.status === "CanLoadMore" ? (
            <Button type="button" variant="outline" size="sm" onClick={() => audit.loadMore(15)}>
              More
            </Button>
          ) : null}
        </section>
      </div>
      <AlertDialog
        open={statusDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm status change</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog === "active"
                ? "Restore this account to active and clear time-boxed status fields where applicable."
                : "This will apply on the user’s next mutation or query that checks status. See user-account-status.md for session behavior."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusDialog === "active") void runStatus("active");
                if (statusDialog === "write") void runStatus("write_restricted");
                if (statusDialog === "suspend") void runStatus("suspended");
                if (statusDialog === "ban") void runStatus("banned");
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
