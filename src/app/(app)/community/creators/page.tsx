"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreatorProgramView } from "@/components/community/creator-program-view";
import { CommunityMobileDestinationNav } from "@/components/community/community-mobile-destination-nav";
import { Button } from "@/components/ui/button";

export default function CreatorProgramPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-6 md:h-full">
      <div className="md:hidden mb-4 space-y-3 border-b border-border/50 pb-4">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 w-fit gap-2 px-2" asChild>
          <Link href="/community">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to community
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CommunityMobileDestinationNav />
        </div>
      </div>
      <CreatorProgramView />
    </div>
  );
}
