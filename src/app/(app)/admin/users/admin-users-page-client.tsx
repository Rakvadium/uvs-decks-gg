"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Download } from "lucide-react";
import { toast } from "sonner";

const PAGE = 25;

export function AdminUsersPageClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);
  const [accountStatus, setAccountStatus] = useState<
    "all" | "active" | "suspended" | "banned" | "write_restricted"
  >("all");
  const [role, setRole] = useState<"all" | "Admin" | "user">("all");
  const [hasVerifiedEmail, setHasVerifiedEmail] = useState<"all" | "yes" | "no">(
    "all"
  );
  const [isAnonymous, setIsAnonymous] = useState<"all" | "yes" | "no">("all");
  const backfill = useMutation(api.adminUsers.runUserDirectoryBackfillBatch);

  const listArgs = useMemo(
    () => ({
      search: debounced || undefined,
      accountStatus: accountStatus === "all" ? undefined : accountStatus,
      role: role === "all" ? undefined : role,
      hasVerifiedEmail: hasVerifiedEmail === "all" ? undefined : hasVerifiedEmail,
      isAnonymous: isAnonymous === "all" ? undefined : isAnonymous,
    }),
    [debounced, accountStatus, role, hasVerifiedEmail, isAnonymous]
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.adminUsers.listDirectory,
    listArgs,
    { initialNumItems: PAGE }
  );

  const runBackfill = useCallback(async () => {
    try {
      const { processed } = await backfill({ limit: 300 });
      toast.success(`Backfill updated ${processed} user rows.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed");
    }
  }, [backfill]);

  const exportCsv = useCallback(() => {
    if (!results.length) {
      toast.error("No rows to export");
      return;
    }
    const header = [
      "id",
      "username",
      "email",
      "role",
      "accountStatus",
      "emailVerified",
      "isAnonymous",
      "created",
    ];
    const lines = [
      header.join(","),
      ...results.map((u) =>
        [
          u._id,
          escapeCsv(u.username ?? ""),
          escapeCsv(u.email ?? ""),
          u.role ?? "",
          u.accountStatus,
          u.hasVerifiedEmail ? "yes" : "no",
          u.isAnonymous ? "yes" : "no",
          new Date(u._creationTime).toISOString(),
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started (current page of results).");
  }, [results]);

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <AdminPageHeader
        backHref="/admin"
        backLabel="Admin"
        title="Users"
        description="Search and manage accounts, roles, and status. Use backfill after deploy to index existing users for search."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={runBackfill}>
              Backfill index fields
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" />
              Export CSV (page)
            </Button>
          </div>
        }
        search={
          <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              placeholder="Search username, email, id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={accountStatus}
              onValueChange={(v) => setAccountStatus(v as typeof accountStatus)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="write_restricted">Write restricted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={hasVerifiedEmail}
              onValueChange={(v) => setHasVerifiedEmail(v as typeof hasVerifiedEmail)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All email</SelectItem>
                <SelectItem value="yes">Verified</SelectItem>
                <SelectItem value="no">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={isAnonymous}
              onValueChange={(v) => setIsAnonymous(v as typeof isAnonymous)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Anonymous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                <SelectItem value="yes">Anonymous</SelectItem>
                <SelectItem value="no">Not anonymous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        count={results.length}
        countLabel="on this page"
      />

      <div className="rounded-md border">
        {status === "LoadingFirstPage" ? (
          <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading…</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No users match.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email ✓</TableHead>
                <TableHead>Anon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((u) => (
                <TableRow
                  key={u._id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u._id}`)}
                >
                  <TableCell className="font-medium">
                    {u.username ?? u._id}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {u.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{u.role === "Admin" ? "Admin" : "—"}</TableCell>
                  <TableCell className="text-sm capitalize">{u.accountStatus}</TableCell>
                  <TableCell className="text-sm">{u.hasVerifiedEmail ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-sm">{u.isAnonymous ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {status === "CanLoadMore" ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="secondary" onClick={() => loadMore(PAGE)}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
