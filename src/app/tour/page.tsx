import type { Metadata } from "next";
import { SizzleReel } from "@/components/tour/sizzle-reel";

export const metadata: Metadata = {
  title: "Product Tour",
  description:
    "A quick tour of UVSDECKS.GG — card gallery, deck builder, collection, community tier lists, and teams.",
};

export default function TourPage() {
  return <SizzleReel />;
}
