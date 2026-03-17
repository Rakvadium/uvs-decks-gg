"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
  orientation?: "horizontal" | "vertical";
};

function TabsList({ className, orientation = "horizontal", ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-orientation={orientation}
      className={cn(
        "group tab-container inline-flex h-11 w-fit items-center justify-center rounded-lg p-1",
        "bg-muted/50 border border-border/50",
        "backdrop-blur-sm",
        orientation === "vertical" && "tab-container-vertical flex-col h-auto w-full",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-2 border border-transparent px-4 py-2 text-sm whitespace-nowrap transition-all duration-200",
        "text-muted-foreground font-mono uppercase tracking-widest text-xs",
        "hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-[0_0_2px_var(--primary)/50,0_0_6px_var(--primary)/35]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
