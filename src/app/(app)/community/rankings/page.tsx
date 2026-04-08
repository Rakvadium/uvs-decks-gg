import { redirect } from "next/navigation";

export default function CommunityRankingsPage() {
  redirect("/community/tier-lists?tab=rankings");
}
