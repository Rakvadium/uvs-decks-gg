import { AgentLoginClient } from "./agent-login-client";
import { sanitizeAgentLoginNextPath } from "@/lib/agent-auth-shared";

type AgentLoginPageProps = {
  searchParams: Promise<{ token?: string; next?: string }>;
};

export default async function AgentLoginPage({ searchParams }: AgentLoginPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim() : "";
  const nextPath = sanitizeAgentLoginNextPath(params.next);

  return <AgentLoginClient token={token} nextPath={nextPath} />;
}
