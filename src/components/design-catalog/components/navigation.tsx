"use client";

import { useState } from "react";
import { BarChart3, ChevronDown, Layers, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CatalogEntrySection, Preview } from "../specimen/entry";
import { Code, CodeBlock } from "../specimen/code-block";

const PANELS = [
  { value: "cards", label: "Cards", icon: Layers, body: "60 cards across 4 zones." },
  { value: "stats", label: "Stats", icon: BarChart3, body: "Curve, zones and symbols." },
  { value: "notes", label: "Notes", icon: NotebookPen, body: "Sideboard plans and matchups." },
  { value: "locked", label: "Locked", icon: Layers, body: "", disabled: true },
];

function DeckTabs({ vertical = false }: { vertical?: boolean }) {
  return (
    <Tabs defaultValue="cards" orientation={vertical ? "vertical" : "horizontal"} className={cn(vertical && "flex-col items-stretch sm:flex-row sm:items-start")}>
      <TabsList orientation={vertical ? "vertical" : "horizontal"} className={cn(vertical ? "shrink-0 sm:w-40" : "max-w-full")}>
        {PANELS.map((panel) => (
          <TabsTrigger key={panel.value} value={panel.value} disabled={panel.disabled}>
            <panel.icon className="max-sm:hidden" />
            {panel.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {PANELS.filter((panel) => !panel.disabled).map((panel) => (
        <TabsContent key={panel.value} value={panel.value} className="rounded-md border border-hairline bg-card-tint p-4 text-sm text-muted-foreground">
          {panel.body}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function TabsEntry() {
  return (
    <CatalogEntrySection
      id="tabs"
      description={
        <p>
          The same <Code>tab-container</Code> chrome as <Code>SegmentedControl</Code>, but with Radix tab semantics (arrow
          keys move between triggers). Pass <Code>orientation</Code> to both <Code>Tabs</Code> and <Code>TabsList</Code>.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Preview label="Horizontal">
          <DeckTabs />
        </Preview>
        <Preview label="Vertical">
          <DeckTabs vertical />
        </Preview>
      </div>
      <CodeBlock
        code={`import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"\n\n<Tabs defaultValue="cards">\n  <TabsList>\n    <TabsTrigger value="cards"><Layers />Cards</TabsTrigger>\n    <TabsTrigger value="stats">Stats</TabsTrigger>\n  </TabsList>\n  <TabsContent value="cards">…</TabsContent>\n</Tabs>`}
      />
    </CatalogEntrySection>
  );
}

export function CollapsibleEntry() {
  const [open, setOpen] = useState(true);
  return (
    <CatalogEntrySection id="collapsible" description={<p>Unstyled Radix primitive. Style the trigger yourself, usually a ghost <Code>Button</Code> with a rotating chevron.</p>}>
      <Preview>
        <Collapsible open={open} onOpenChange={setOpen} className="max-w-md rounded-lg border border-surface bg-card">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between rounded-lg px-4">
              Sideboard · 15 cards
              <ChevronDown className={cn("motion-safe:transition-transform motion-safe:duration-150", open && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-hairline px-4 py-3 text-sm text-muted-foreground">
            3× Counter Spell, 2× Burn Out, 4× Hidden Blade…
          </CollapsibleContent>
        </Collapsible>
      </Preview>
      <CodeBlock
        code={`import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"\n\n<Collapsible open={open} onOpenChange={setOpen}>\n  <CollapsibleTrigger asChild>\n    <Button variant="ghost">Sideboard <ChevronDown className={cn(open && "rotate-180")} /></Button>\n  </CollapsibleTrigger>\n  <CollapsibleContent>…</CollapsibleContent>\n</Collapsible>`}
      />
    </CatalogEntrySection>
  );
}

export function NavigationChapter() {
  return (
    <>
      <TabsEntry />
      <CollapsibleEntry />
    </>
  );
}
