"use client";

import { CreatorProgramView } from "@/components/community/creator-program-view";

export default function CreatorProgramPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-6 md:h-full">
      <CreatorProgramView />
    </div>
  );
}
