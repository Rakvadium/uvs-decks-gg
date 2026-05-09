"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommunityTierListsSidebarFooter() {
  return (
    <Button className="w-full gap-2" asChild>
      <Link href="/community/tier-lists?openCreate=1">
        <Plus className="h-4 w-4" />
        Create Tier List
      </Link>
    </Button>
  );
}
