"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { AdminPageHeader } from "@/components/admin";
import { AdminFormatDetailWorkspace } from "@/features/admin-format-legality/content";

export default function AdminFormatDetailPageClient() {
  const params = useParams();
  const rawKey = typeof params.key === "string" ? params.key : "";
  const key = rawKey ? decodeURIComponent(rawKey) : "";
  const format = useQuery(api.formats.getByKey, key ? { key } : "skip");

  if (!key) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">Missing format key.</p>
        <Link href="/admin/formats" className="mt-4 text-primary hover:underline">
          Back to formats
        </Link>
      </div>
    );
  }

  if (format === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (format === null) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          No format found for key <span className="font-mono">{key}</span>.
        </p>
        <Link href="/admin/formats" className="mt-4 text-primary hover:underline">
          Back to formats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-6 pb-10">
      <AdminPageHeader
        title={format.name}
        meta={<p className="font-mono text-sm text-muted-foreground">{format.key}</p>}
        description="Format rules, per-set inclusion, card banlist, and JSON backup share this key."
        backHref="/admin/formats"
        backLabel="All formats"
      />
      <AdminFormatDetailWorkspace format={format} />
    </div>
  );
}
