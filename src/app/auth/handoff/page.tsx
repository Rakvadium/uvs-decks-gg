import type { Metadata } from "next";
import { HandoffClient } from "./handoff-client";

export const metadata: Metadata = {
  title: "Signing in",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

type HandoffPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function HandoffPage({ searchParams }: HandoffPageProps) {
  const params = await searchParams;
  return (
    <HandoffClient
      returnUrl={single(params.return)}
      state={single(params.state)}
      silent={single(params.silent) === "1"}
      flow={single(params.flow) === "signUp" ? "signUp" : "signIn"}
    />
  );
}
