export type TextModerationProviderName = "off" | "stub" | "perspective" | "azure" | "openai";

export type PublishTextApiDecision = "approved" | "rejected" | "needs_review";

export type TextModerationFailurePolicy = "allow" | "queue";

export type PublishTextEvaluation = {
  provider: string;
  decision: PublishTextApiDecision;
  raw: Record<string, unknown>;
  failurePolicyApplied?: TextModerationFailurePolicy;
  failureError?: string;
};

function normalizeProvider(): TextModerationProviderName {
  const raw = process.env.TEXT_MODERATION_PROVIDER?.trim().toLowerCase();
  if (!raw || raw === "off" || raw === "false" || raw === "0") {
    return "off";
  }
  if (raw === "stub" || raw === "perspective" || raw === "azure" || raw === "openai") {
    return raw;
  }
  return "off";
}

export function isPublishTextModerationEnabled(): boolean {
  return normalizeProvider() !== "off";
}

export function getPublishTextModerationProviderForDiagnostics(): TextModerationProviderName {
  return normalizeProvider();
}

function failurePolicy(): TextModerationFailurePolicy {
  const v = process.env.TEXT_MODERATION_ON_FAILURE?.trim().toLowerCase();
  return v === "queue" ? "queue" : "allow";
}

function rejectThreshold(): number {
  const raw = process.env.TEXT_MODERATION_REJECT_THRESHOLD?.trim();
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 1) {
    return 0.72;
  }
  return n;
}

async function fetchJson(
  url: string,
  init: RequestInit & { timeoutMs?: number }
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const timeoutMs = init.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

async function moderatePerspective(text: string): Promise<PublishTextEvaluation> {
  const key = process.env.PERSPECTIVE_API_KEY?.trim();
  if (!key) {
    throw new Error("PERSPECTIVE_API_KEY is not set");
  }
  const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${encodeURIComponent(key)}`;
  const { ok, json } = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      comment: { text },
      languages: ["en"],
      requestedAttributes: { TOXICITY: {} },
      doNotStore: true,
    }),
  });
  if (!ok || !json || typeof json !== "object") {
    throw new Error(`Perspective request failed (${ok ? "parse" : "http"})`);
  }
  const record = json as Record<string, unknown>;
  const scores = record.attributeScores as Record<string, { summaryScore?: { value?: number } }> | undefined;
  const toxicity = scores?.TOXICITY?.summaryScore?.value ?? 0;
  const threshold = rejectThreshold();
  const decision: PublishTextApiDecision =
    typeof toxicity === "number" && toxicity >= threshold ? "rejected" : "approved";
  return {
    provider: "perspective",
    decision,
    raw: { toxicity, threshold, response: json as Record<string, unknown> },
  };
}

async function moderateOpenAI(text: string): Promise<PublishTextEvaluation> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const { ok, json } = await fetchJson("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: text,
    }),
  });
  if (!ok || !json || typeof json !== "object") {
    throw new Error(`OpenAI moderation request failed`);
  }
  const record = json as { results?: Array<{ flagged?: boolean; category_scores?: Record<string, number> }> };
  const result = record.results?.[0];
  const scores = result?.category_scores ?? {};
  const maxScore = Math.max(0, ...Object.values(scores));
  const threshold = rejectThreshold();
  const flagged = Boolean(result?.flagged) || maxScore >= threshold;
  return {
    provider: "openai",
    decision: flagged ? "rejected" : "approved",
    raw: { flagged: result?.flagged, maxScore, threshold, category_scores: scores },
  };
}

async function moderateAzure(text: string): Promise<PublishTextEvaluation> {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT?.trim().replace(/\/$/, "");
  const apiKey = process.env.AZURE_CONTENT_SAFETY_KEY?.trim();
  if (!endpoint || !apiKey) {
    throw new Error("AZURE_CONTENT_SAFETY_ENDPOINT or AZURE_CONTENT_SAFETY_KEY is not set");
  }
  const url = `${endpoint}/contentsafety/text:analyze?api-version=2023-10-01`;
  const { ok, json } = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": apiKey,
    },
    body: JSON.stringify({
      text,
      categories: ["Hate", "SelfHarm", "Sexual", "Violence"],
    }),
  });
  if (!ok || !json || typeof json !== "object") {
    throw new Error("Azure Content Safety request failed");
  }
  const record = json as {
    categoriesAnalysis?: Array<{ category?: string; severity?: number }>;
  };
  const severities = (record.categoriesAnalysis ?? [])
    .map((c) => (typeof c.severity === "number" ? c.severity : 0))
    .filter((n) => n > 0);
  const maxSev = severities.length ? Math.max(...severities) : 0;
  const threshold = rejectThreshold();
  const minSeverity = Math.max(0, Math.min(6, Math.ceil(threshold * 6)));
  const decision: PublishTextApiDecision = maxSev >= minSeverity ? "rejected" : "approved";
  return {
    provider: "azure",
    decision,
    raw: { maxSeverity: maxSev, minSeverityRejectAt: minSeverity, response: json as Record<string, unknown> },
  };
}

async function moderateStub(): Promise<PublishTextEvaluation> {
  return {
    provider: "stub",
    decision: "approved",
    raw: {
      stub: true,
      mc004:
        "Wire TEXT_MODERATION_PROVIDER to perspective, azure, or openai; set API keys in Convex env; see docs/content-moderation-and-language-filter.md",
    },
  };
}

export async function evaluatePublishText(
  text: string,
  _context: { surface: string }
): Promise<PublishTextEvaluation> {
  const provider = normalizeProvider();
  const policy = failurePolicy();

  if (provider === "off") {
    return {
      provider: "off",
      decision: "approved",
      raw: { skipped: true },
    };
  }

  try {
    if (provider === "stub") {
      return await moderateStub();
    }
    if (provider === "perspective") {
      return await moderatePerspective(text);
    }
    if (provider === "openai") {
      return await moderateOpenAI(text);
    }
    if (provider === "azure") {
      return await moderateAzure(text);
    }
    return { provider: "off", decision: "approved", raw: { skipped: true } };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (policy === "queue") {
      return {
        provider,
        decision: "needs_review",
        raw: { error: message, queued: true },
        failurePolicyApplied: "queue",
        failureError: message,
      };
    }
    return {
      provider,
      decision: "approved",
      raw: { error: message, allowedOnFailure: true },
      failurePolicyApplied: "allow",
      failureError: message,
    };
  }
}

export function mergeLocalAndApiModeration(args: {
  local: { status: "approved" | "pending" | "flagged"; moderationReason?: string };
  api: PublishTextEvaluation;
}): {
  status: "approved" | "pending" | "flagged" | "rejected";
  moderationReason?: string;
  textModerationProvider?: string;
  textModerationResult?: Record<string, unknown>;
} {
  const { local, api } = args;
  let status: "approved" | "pending" | "flagged" | "rejected" = local.status;
  let moderationReason = local.moderationReason;

  const textModerationProvider = api.provider === "off" ? undefined : api.provider;
  const textModerationResult: Record<string, unknown> = { ...api.raw };
  if (api.failurePolicyApplied) {
    textModerationResult.failurePolicyApplied = api.failurePolicyApplied;
  }
  if (api.failureError) {
    textModerationResult.failureError = api.failureError;
  }

  if (api.decision === "rejected") {
    status = "rejected";
    moderationReason = "Comment did not pass automated content review";
  } else if (api.decision === "needs_review") {
    if (status === "approved") {
      status = "pending";
      moderationReason =
        api.failurePolicyApplied === "queue"
          ? "Automated review unavailable; message held for review"
          : "Held for automated review";
    }
  }

  if (local.status === "flagged") {
    status = "flagged";
    moderationReason = local.moderationReason;
  } else if (local.status === "pending") {
    if (status === "approved") {
      status = "pending";
      moderationReason = local.moderationReason;
    }
  }

  return {
    status,
    ...(moderationReason ? { moderationReason } : {}),
    ...(textModerationProvider ? { textModerationProvider } : {}),
    textModerationResult,
  };
}
