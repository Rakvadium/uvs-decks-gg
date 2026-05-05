"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminPageHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function AdminImportLegacyGate() {
  const sets = useQuery(api.sets.list);
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:h-full">
      <AdminPageHeader
        title="Global import (legacy URL)"
        description="Bookmarking /admin/import?legacy=1 keeps this helper. Use set-scoped import for normal work."
      />
      <div className="max-w-lg space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Prefer set import</AlertTitle>
          <AlertDescription>
            Open a set in{" "}
            <Link href="/admin/sets" className="text-primary hover:underline">
              Sets
            </Link>{" "}
            and use <span className="font-mono">…/import</span> for bulk JSON and job status
            in context.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="leg-code">Set code</Label>
          <Input
            id="leg-code"
            placeholder="e.g. ABC"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono"
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            const c = code.trim();
            if (!c) {
              return;
            }
            router.push(`/admin/sets/${encodeURIComponent(c)}/import`);
          }}
        >
          Open import for this set
        </Button>
        {sets !== undefined && sets.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Or pick a set</p>
            <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
              {sets.map((s) => (
                <li key={s._id}>
                  <Link
                    href={`/admin/sets/${encodeURIComponent(s.code)}/import`}
                    className="text-primary hover:underline"
                  >
                    <span className="font-mono">{s.code}</span> — {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
