"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminPageHeader } from "@/components/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { labelForUserFeedbackKind } from "@/lib/user-feedback";

export function AdminFeedbackPageClient() {
  const rows = useQuery(api.feedback.listForAdmin, {});

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-x-hidden pb-10">
      <AdminPageHeader
        title="User feedback"
        description="Submissions from the feedback control in the main navigation"
      />

      {rows === undefined ? (
        <div className="animate-pulse text-muted-foreground text-sm">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feedback yet.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Received</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="min-w-[140px]">Page</TableHead>
                <TableHead className="min-w-[200px]">Message</TableHead>
                <TableHead className="min-w-[160px]">User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="whitespace-nowrap align-top text-muted-foreground text-xs font-mono">
                    {new Date(row._creationTime).toLocaleString()}
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap">
                    {labelForUserFeedbackKind(row.kind)}
                  </TableCell>
                  <TableCell className="align-top font-mono text-xs break-all">
                    {row.pagePath}
                  </TableCell>
                  <TableCell className="align-top text-sm whitespace-pre-wrap break-words max-w-md">
                    {row.message}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {row.isAnonymous || !row.user ? (
                      <span className="text-muted-foreground">Anonymous</span>
                    ) : (
                      <div className="space-y-0.5">
                        {row.user.username ? (
                          <div className="font-medium">{row.user.username}</div>
                        ) : null}
                        {row.user.email ? (
                          <div className="text-muted-foreground text-xs break-all">
                            {row.user.email}
                          </div>
                        ) : null}
                        {!row.user.username && !row.user.email ? (
                          <span className="text-muted-foreground">(no profile)</span>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
