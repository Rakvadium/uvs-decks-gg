"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppPageHeader } from "@/components/shell/app-page-header";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  search?: ReactNode;
  count?: number | null;
  countLabel?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  search,
  count,
  countLabel,
}: AdminPageHeaderProps) {
  const router = useRouter();

  const titleBlock = (
    <div className="flex flex-wrap items-start gap-4">
      {backHref ? (
        <Button variant="ghost" size="sm" onClick={() => router.push(backHref)} className="gap-2 shrink-0">
          <ArrowLeft className="h-4 w-4" />
          {backLabel || "Back"}
        </Button>
      ) : null}
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
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
      {search}
      {actions}
    </div>
  );

  return (
    <AppPageHeader
      title={titleBlock}
      withBottomBorder
      actions={trailing}
      innerClassName="gap-4"
    />
  );
}
