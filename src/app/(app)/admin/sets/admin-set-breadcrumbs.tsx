import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type AdminSetBreadcrumbsProps = {
  setCode: string;
  setName: string;
  tail: "cards" | "import" | null;
};

function CrumbSeparator() {
  return <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" aria-hidden />;
}

function BreadcrumbItem({ children }: { children: ReactNode }) {
  return (
    <>
      <CrumbSeparator />
      {children}
    </>
  );
}

export function AdminSetBreadcrumbs({
  setCode,
  setName,
  tail,
}: AdminSetBreadcrumbsProps) {
  const display = (setName && setName.trim()) || setCode;
  const setOverviewHref = `/admin/sets/${encodeURIComponent(setCode)}`;

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <Link href="/admin" className="hover:text-foreground">
        Admin
      </Link>
      <BreadcrumbItem>
        <Link href="/admin/sets" className="hover:text-foreground">
          Sets
        </Link>
      </BreadcrumbItem>
      {tail === null ? (
        <BreadcrumbItem>
          <span className="text-foreground font-medium">{display}</span>
        </BreadcrumbItem>
      ) : (
        <>
          <BreadcrumbItem>
            <Link href={setOverviewHref} className="hover:text-foreground">
              {display}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span className="text-foreground font-medium">
              {tail === "cards" ? "Cards" : "Import"}
            </span>
          </BreadcrumbItem>
        </>
      )}
    </nav>
  );
}
