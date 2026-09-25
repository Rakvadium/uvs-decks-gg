import type { Metadata } from "next";
import { AuthRouteEntry } from "@/components/auth/auth-route-entry";
import { sanitizeSameOriginPath } from "@shared/auth-handoff";
import { getRequestBrand } from "@/lib/routing/request-game";

type AuthPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage({ searchParams }: AuthPageProps) {
  const { next } = await searchParams;
  const nextPath = sanitizeSameOriginPath(next, "") || null;
  const brand = await getRequestBrand();
  return (
    <AuthRouteEntry
      nextPath={nextPath}
      flow="signIn"
      heading="Sign in to continue"
      description={`Use your ${brand.title} account to build decks, save collections, and join the community.`}
      actionLabel="Sign In"
    />
  );
}
