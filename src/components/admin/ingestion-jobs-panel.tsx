"use client";

import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type IngestionJobsPanelProps = {
  activeJobId: Id<"ingestionJobs"> | null;
  setCode?: string;
  variant?: "default" | "compact";
};

function jobLabel(job: Doc<"ingestionJobs">) {
  const t = new Date(job.startedAt).toLocaleString();
  return `${job.status} · ${job.processedRecords}/${job.totalRecords} ok, ${job.failedRecords} failed · ${t}`;
}

export function IngestionJobsPanel({
  activeJobId,
  setCode,
  variant = "default",
}: IngestionJobsPanelProps) {
  const recent = useQuery(api.admin.listMyRecentIngestionJobs, { limit: 12 });
  const activeJob = useQuery(
    api.admin.getIngestionJob,
    activeJobId ? { jobId: activeJobId } : "skip"
  );

  const isCompact = variant === "compact";

  return (
    <div className={cn("space-y-3", isCompact && "text-sm")}>
      <div>
        <h2
          className={cn(
            "font-semibold text-foreground",
            isCompact ? "text-sm" : "text-lg"
          )}
        >
          Import / ingestion jobs
        </h2>
        {!isCompact ? (
          <p className="text-sm text-muted-foreground">
            Bulk array runs create a job you can track here.
            {setCode ? (
              <>
                {" "}
                <Link
                  href={`/admin/sets/${encodeURIComponent(setCode)}/import`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Set-scoped import
                </Link>{" "}
                is the supported path.
              </>
            ) : null}{" "}
            The legacy <span className="font-mono">/admin/import</span> route forwards to Sets with a
            notice.
          </p>
        ) : null}
      </div>

      {activeJobId ? (
        activeJob === undefined ? (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Current job</AlertTitle>
            <AlertDescription>
              <Skeleton className="h-4 w-full max-w-md" />
            </AlertDescription>
          </Alert>
        ) : activeJob ? (
          <Alert>
            <AlertTitle>Active job</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <div>
                Status: <span className="font-medium">{activeJob.status}</span>
              </div>
              <div>
                Progress: {activeJob.processedRecords} processed,{" "}
                {activeJob.failedRecords} failed of {activeJob.totalRecords}
              </div>
              {activeJob.errorMessages && activeJob.errorMessages.length > 0 ? (
                <ul className="mt-2 max-h-32 list-inside list-disc overflow-y-auto">
                  {activeJob.errorMessages.slice(-20).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Job not found</AlertTitle>
            <AlertDescription>
              This job is missing or you do not have access.
            </AlertDescription>
          </Alert>
        )
      ) : null}

      <div
        className={cn(
          "rounded-lg border",
          isCompact ? "max-h-48 overflow-auto" : "max-h-64 overflow-auto"
        )}
      >
        {recent === undefined ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : recent.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            No ingestion jobs yet. Run a bulk array import below to create one.
          </p>
        ) : (
          <ul className="divide-y">
            {recent.map((job) => (
              <li
                key={job._id}
                className={cn(
                  "px-3 py-2",
                  activeJobId === job._id && "bg-muted/50"
                )}
              >
                <div className="font-mono text-xs text-muted-foreground">
                  {job._id}
                </div>
                <div className="text-sm">{jobLabel(job)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
