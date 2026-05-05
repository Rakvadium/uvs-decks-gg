"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FormatFormContent,
  FormatDeleteSection,
} from "@/features/admin-format/format-form-content";
import { SetLegalityMatrix } from "./set-legality-matrix";
import { CardLegalityAdminPanel } from "./card-legality-admin-panel";
import { BanlistBackupPanel } from "./banlist-backup-panel";

type TabValue = "settings" | "sets" | "cards" | "backup";

function tabFromSearchParams(tabParam: string | null): TabValue {
  if (tabParam === "sets" || tabParam === "cards" || tabParam === "backup") {
    return tabParam;
  }
  return "settings";
}

export function AdminFormatDetailWorkspace({
  format,
}: {
  format: Doc<"formats">;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = tabFromSearchParams(searchParams.get("tab"));
  const focusCard = searchParams.get("focusCard");

  const onTabChange = (next: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next === "settings") {
      p.delete("tab");
    } else {
      p.set("tab", next);
    }
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="gap-6">
      <TabsList>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="sets">Set legality</TabsTrigger>
        <TabsTrigger value="cards">Card legality</TabsTrigger>
        <TabsTrigger value="backup">Backup</TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="space-y-6">
        <section className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Dates and validation</p>
          <p>
            <span className="text-foreground">rotatesOutAt</span> on a set row
            is compared to the server clock at validation time (same basis as{" "}
            <span className="font-mono">Date.now()</span> in Convex). When that
            instant has passed, the set is treated as not legal in the format
            even if the toggle still reads allowed.
          </p>
          <p>
            <span className="text-foreground">effectiveDate</span> on a card
            row schedules a ban or restriction: if the timestamp is in the
            future, the card is still treated as legal until that moment.
          </p>
          <p className="font-mono text-xs">
            Longer reference: docs/implementation/notes/legality-dates.md
          </p>
        </section>
        <div className="px-1">
          <FormatFormContent mode="edit" format={format} />
          <FormatDeleteSection format={format} />
        </div>
      </TabsContent>
      <TabsContent value="sets">
        <SetLegalityMatrix formatKey={format.key} />
      </TabsContent>
      <TabsContent value="cards">
        <CardLegalityAdminPanel
          formatKey={format.key}
          focusCardId={focusCard}
        />
      </TabsContent>
      <TabsContent value="backup">
        <BanlistBackupPanel formatKey={format.key} />
      </TabsContent>
    </Tabs>
  );
}
