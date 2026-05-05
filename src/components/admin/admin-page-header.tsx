"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppPageHeader } from "@/components/shell/app-page-header";
import { cn } from "@/lib/utils";

export interface AdminPageHeaderProps {
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  search?: ReactNode;
  count?: number | null;
  countLabel?: string;
  subNav?: ReactNode;
  bleed?: boolean;
}

export function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel,
  breadcrumbs,
  meta,
  actions,
  toolbar,
  search,
  count,
  countLabel,
  subNav,
  bleed = false,
}: AdminPageHeaderProps) {
  const router = useRouter();

  const effectiveToolbar =
    toolbar ??
    (search ? <div className="flex flex-wrap items-center gap-4">{search}</div> : undefined);

  const titleBlock = (
    <div className="space-y-3">
      {breadcrumbs}
      <div className="flex flex-wrap items-start gap-4">
        {backHref ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backHref)}
            className="gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel || "Back"}
          </Button>
        ) : null}
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          {meta}
        </div>
      </div>
    </div>
  );

  const trailing = (
    <div className="flex flex-wrap items-center gap-3">
      {count !== undefined && count !== null ? (
        <Badge variant="secondary" className="font-normal">
          {count.toLocaleString()} {countLabel || "items"}
        </Badge>
      ) : null}
      {actions}
    </div>
  );

  return (
    <div className={cn(bleed && "-mx-6 -mt-6 mb-6", !bleed && "mb-6")}>
      <AppPageHeader
        title={titleBlock}
        description={description}
        toolbar={effectiveToolbar}
        tabs={subNav}
        actions={trailing}
        withBottomBorder
        innerClassName="gap-4"
      />
    </div>
  );
}
