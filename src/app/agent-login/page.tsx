import { notFound } from "next/navigation";
import { isAgentLoginPageEnabled } from "@/lib/agent-auth";
import { AgentLoginClient } from "./agent-login-client";

// Read the env per request, never at build time.
export const dynamic = "force-dynamic";

export default function AgentLoginPage() {
  if (!isAgentLoginPageEnabled()) notFound();
  return <AgentLoginClient />;
}
