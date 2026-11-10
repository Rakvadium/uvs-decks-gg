import type { Metadata } from "next";
import { AuthRouteEntry } from "@/components/auth/auth-route-entry";
import { sanitizeSameOriginPath } from "@shared/auth-handoff";
import { getRequestBrand } from "@/lib/routing/request-game";

type AuthPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function SignUpPage({ searchParams }: AuthPageProps) {
  const { next } = await searchParams;
  const nextPath = sanitizeSameOriginPath(next, "") || null;
  const brand = await getRequestBrand();
  return (
    <AuthRouteEntry
      nextPath={nextPath}
      flow="signUp"
      heading="Create your account"
      description={`Join ${brand.title} to build decks, save collections, and explore community tier lists.`}
      actionLabel="Create Account"
    />
  );
}
