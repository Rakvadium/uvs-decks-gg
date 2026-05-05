"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "hub", href: "/admin/content", match: (p: string) => p === "/admin/content" || p === "/admin/content/" },
  { value: "moderation", href: "/admin/moderation", match: (p: string) => p.startsWith("/admin/moderation") },
  { value: "youtube", href: "/admin/content/youtube", match: (p: string) => p.startsWith("/admin/content/youtube") },
  { value: "ui-matrix", href: "/admin/ui-matrix", match: (p: string) => p.startsWith("/admin/ui-matrix") },
] as const;

export function AdminContentSubNav() {
  const pathname = usePathname();
  const router = useRouter();
  const current = tabs.find((t) => t.match(pathname))?.value ?? "hub";

  return (
    <Tabs
      value={current}
      onValueChange={(v) => {
        const item = tabs.find((t) => t.value === v);
        if (item) {
          router.push(item.href);
        }
      }}
    >
      <TabsList className="h-auto w-full min-w-0 flex-wrap justify-start gap-0 sm:w-fit">
        <TabsTrigger value="hub">Hub</TabsTrigger>
        <TabsTrigger value="moderation">Media review</TabsTrigger>
        <TabsTrigger value="youtube">YouTube</TabsTrigger>
        <TabsTrigger value="ui-matrix">UI matrix</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
