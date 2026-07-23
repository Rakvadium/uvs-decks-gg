"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminSetSectionTabsProps = {
  setCode: string;
  searchSuffix?: string;
};

export function AdminSetSectionTabs({
  setCode,
  searchSuffix = "",
}: AdminSetSectionTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const enc = encodeURIComponent(setCode);
  const base = `/admin/sets/${enc}`;
  const tab = pathname.includes("/import")
    ? "import"
    : pathname.includes("/review")
      ? "review"
    : pathname.includes("/cards")
      ? "cards"
      : "overview";

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        if (v === "overview") {
          router.push(`${base}${searchSuffix}`);
          return;
        }
        if (v === "cards") {
          router.push(`${base}/cards${searchSuffix}`);
          return;
        }
        if (v === "review") {
          router.push(`${base}/review${searchSuffix}`);
          return;
        }
        if (v === "import") {
          router.push(`${base}/import${searchSuffix}`);
        }
      }}
    >
      <TabsList className="h-auto w-full min-w-0 flex-wrap justify-start gap-0 sm:w-fit">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="cards">Cards</TabsTrigger>
        <TabsTrigger value="review">Review</TabsTrigger>
        <TabsTrigger value="import">Import</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
