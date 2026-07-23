"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import AdminCardDraftReview from "@/features/admin-card-drafts/review";
import { AdminSetBreadcrumbs } from "../../admin-set-breadcrumbs";

export default function AdminSetReviewPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = typeof params.code === "string" ? params.code : "";
  const set = useQuery(api.sets.getByCode, code ? { code } : "skip");
  const listSearch = searchParams.get("search");
  const listQuery =
    listSearch !== null && listSearch !== "" ? `?search=${encodeURIComponent(listSearch)}` : "";

  if (!code) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:h-full">
        <p className="text-muted-foreground">Missing set code.</p>
        <Link href="/admin/sets" className="mt-4 text-primary hover:underline">
          Back to sets
        </Link>
      </div>
    );
  }

  if (set === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (set === null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:h-full">
        <p className="text-muted-foreground">
          No set found for code <span className="font-mono">{code}</span>.
        </p>
        <Link href="/admin/sets" className="mt-4 text-primary hover:underline">
          Back to sets
        </Link>
      </div>
    );
  }

  return (
    <AdminCardDraftReview
      setCode={set.code}
      setName={set.name}
      setNumber={set.setNumber}
      searchSuffix={listQuery}
      breadcrumbs={
        <AdminSetBreadcrumbs setCode={set.code} setName={set.name} tail="review" />
      }
    />
  );
}
