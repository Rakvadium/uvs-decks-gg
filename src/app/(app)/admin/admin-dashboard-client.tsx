"use client";

import Link from "next/link";
import { BookOpen, Layers, MessageSquare, Newspaper, Package, Users } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdminPageHeader, CatalogReleaseDialog, IngestionJobsPanel } from "@/components/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminDashboardClient() {
  const sets = useQuery(api.sets.list);
  const formats = useQuery(api.formats.list);
  const catalog = useQuery(api.admin.getCardDataVersion, {});

  const lastPublish =
    catalog != null
      ? new Date(catalog.updatedAt).toLocaleString()
      : null;

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-x-hidden pb-10">
      <AdminPageHeader
        title="Admin Dashboard"
        description="Catalog and content tools — open a set for cards and import"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingestion jobs</CardTitle>
            <CardDescription>
              Recent bulk import runs (per-set import is under each set).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IngestionJobsPanel activeJobId={null} variant="compact" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Published catalog
            </CardTitle>
            <CardDescription>
              Global{" "}
              <span className="font-mono text-foreground">cardDataVersion</span>{" "}
              players sync against.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="space-y-1 text-muted-foreground">
              <li>
                Version:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {catalog != null ? catalog.version : "—"}
                </span>
              </li>
              <li>
                Gallery-eligible cards:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {catalog != null
                    ? catalog.cardCount.toLocaleString()
                    : "—"}
                </span>
              </li>
              {lastPublish ? (
                <li>
                  Last publish:{" "}
                  <span className="text-foreground">{lastPublish}</span>
                </li>
              ) : null}
            </ul>
            <div className="flex flex-wrap gap-2">
              <CatalogReleaseDialog
                triggerLabel="Publish catalog"
                buttonSize="sm"
              />
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/sets">Set hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link href="/admin/sets">
          <div className="rounded-lg border bg-card p-6 transition-colors h-full hover:bg-accent">
            <div className="flex items-center gap-4">
              <Layers className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Sets</h2>
                <p className="text-sm text-muted-foreground">
                  {sets !== undefined
                    ? `${sets.length} sets — cards & import per set`
                    : "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/formats">
          <div className="rounded-lg border bg-card p-6 transition-colors h-full hover:bg-accent">
            <div className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Formats</h2>
                <p className="text-sm text-muted-foreground">
                  {formats !== undefined
                    ? `${formats.length} formats — legality hub`
                    : "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/content">
          <div className="rounded-lg border bg-card p-6 transition-colors h-full hover:bg-accent">
            <div className="flex items-center gap-4">
              <Newspaper className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Content</h2>
                <p className="text-sm text-muted-foreground">
                  Moderation & site content tools
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/users">
          <div className="rounded-lg border bg-card p-6 transition-colors h-full hover:bg-accent">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Users</h2>
                <p className="text-sm text-muted-foreground">
                  User administration (coming soon)
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/feedback">
          <div className="rounded-lg border bg-card p-6 transition-colors h-full hover:bg-accent">
            <div className="flex items-center gap-4">
              <MessageSquare className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">User feedback</h2>
                <p className="text-sm text-muted-foreground">
                  Inbox from the site feedback form
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
