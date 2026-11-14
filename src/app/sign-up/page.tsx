import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { authPageTarget } from "@/lib/auth/auth-page-target";

type AuthPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function SignUpPage({ searchParams }: AuthPageProps) {
  const { next } = await searchParams;
  return <AuthPage initialFlow="signUp" {...authPageTarget(next)} />;
}
