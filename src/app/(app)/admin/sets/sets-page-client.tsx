"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminSetsPageClient() {
  const sets = useQuery(api.sets.list);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sets</h1>
          <p className="text-muted-foreground">Manage card sets</p>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Set #</TableHead>
                <TableHead>Card Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets?.map((set) => (
                <TableRow key={set._id}>
                  <TableCell className="font-mono">{set.code}</TableCell>
                  <TableCell className="font-medium">{set.name}</TableCell>
                  <TableCell>{set.setNumber ?? "-"}</TableCell>
                  <TableCell>{set.cardCount ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={set.isFuture ? "secondary" : "default"}>
                      {set.isFuture ? "Future" : "Released"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
