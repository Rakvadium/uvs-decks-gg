"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import AdminImportPageClient from "../../../import/import-page-client";
import { AdminSetBreadcrumbs } from "../../admin-set-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSetImportPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = typeof params.code === "string" ? params.code : "";
  const set = useQuery(api.sets.getByCode, code ? { code } : "skip");
  const listSearch = searchParams.get("search");
  const listQuery =
    listSearch !== null && listSearch !== "" ? `?search=${encodeURIComponent(listSearch)}` : "";

  if (!code) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <p className="text-muted-foreground">Missing set code.</p>
        <Link href="/admin/sets" className="mt-4 text-primary hover:underline">
          Back to sets
        </Link>
      </div>
    );
  }

  if (set === undefined) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-40 w-full max-w-4xl" />
        <Skeleton className="h-32 w-full max-w-4xl" />
      </div>
    );
  }

  if (set === null) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <p className="text-muted-foreground">
          No set found for code <span className="font-mono">{code}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => router.refresh()}>
            Retry
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/sets">Back to sets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminImportPageClient
      setCode={set.code}
      setName={set.name}
      searchSuffix={listQuery}
      breadcrumbs={
        <AdminSetBreadcrumbs setCode={set.code} setName={set.name} tail="import" />
      }
    />
  );
}
