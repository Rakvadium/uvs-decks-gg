import type { Metadata } from "next";
import { SignedOutClient } from "./signed-out-client";

export const metadata: Metadata = {
  title: "Signing out",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

type SignedOutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignedOutPage({ searchParams }: SignedOutPageProps) {
  const params = await searchParams;
  const returnUrl = typeof params.return === "string" ? params.return : "";
  return <SignedOutClient returnUrl={returnUrl} />;
}
