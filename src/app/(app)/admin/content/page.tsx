import Link from "next/link";
import { ImageIcon, LayoutGrid, Youtube } from "lucide-react";
import { AdminContentSubNav, AdminPageHeader } from "@/components/admin";

export default function AdminContentPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <AdminPageHeader
        backHref="/admin"
        backLabel="Admin"
        title="Content"
        description="Site content and moderation entry points (Admin IA v2 primary area: Content)."
        subNav={<AdminContentSubNav />}
      />
      <ul className="flex max-w-md flex-col gap-3">
        <li>
          <Link
            href="/admin/moderation"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <ImageIcon className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Media review</p>
              <p className="text-sm text-muted-foreground">Image moderation queue</p>
            </div>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/content/youtube"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <Youtube className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Community YouTube</p>
              <p className="text-sm text-muted-foreground">Curated feed administration</p>
            </div>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/ui-matrix"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <LayoutGrid className="h-8 w-8 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">UI matrix</p>
              <p className="text-sm text-muted-foreground">Component / theme dev surface</p>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  );
}
