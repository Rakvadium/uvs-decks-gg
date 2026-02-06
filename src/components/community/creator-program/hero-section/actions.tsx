import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CreatorProgramHeroActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="neon" size="lg">
        Apply for Verification
      </Button>
      <Link href="#creator-toolkit">
        <Button variant="outline" size="lg">
          View Creator Toolkit
        </Button>
      </Link>
      <Link href="/community">
        <Button variant="ghost" size="lg">
          Back to Community
        </Button>
      </Link>
    </div>
  );
}
