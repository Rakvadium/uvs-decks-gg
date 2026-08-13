import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CreatorProgramHeroActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="default" size="lg">
        Apply for Verification
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="#creator-toolkit">View Creator Toolkit</Link>
      </Button>
    </div>
  );
}
