"use client";

import { useLayoutEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminTopBar } from "./admin-top-bar-context";

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
  const { setTopBarContent } = useAdminTopBar();

  // Use useLayoutEffect to set content before browser paint
  useLayoutEffect(() => {
    setTopBarContent(
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-4">
          {backHref && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backHref)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel || "Back"}
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {count !== undefined && count !== null && (
            <Badge variant="secondary" className="font-normal">
              {count.toLocaleString()} {countLabel || "items"}
            </Badge>
          )}
          {search}
          {actions}
        </div>
      </div>
    );

    return () => setTopBarContent(null);
  }, [title, subtitle, backHref, backLabel, actions, search, count, countLabel, setTopBarContent, router]);

  return null;
}

