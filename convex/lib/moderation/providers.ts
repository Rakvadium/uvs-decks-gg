export type ImageModerationProviderName = "stub" | "off" | "sightengine";

export type ModerationVerdict = {
  decision: "approved" | "rejected" | "needs_review";
  provider: string;
  raw: Record<string, unknown>;
};

export type ModerateImageContext = {
  kind: string;
  assetId?: string;
};

function normalizeImageProvider(): ImageModerationProviderName {
  const raw = process.env.MODERATION_IMAGE_PROVIDER?.trim().toLowerCase();
  if (!raw || raw === "stub") {
    return "stub";
  }
  if (raw === "off" || raw === "false" || raw === "0") {
    return "off";
  }
  if (raw === "sightengine") {
    return "sightengine";
  }
  return "stub";
}

function imageModerationFailurePolicy(): "allow" | "queue" {
  const v = process.env.MODERATION_IMAGE_ON_FAILURE?.trim().toLowerCase();
  return v === "queue" ? "queue" : "allow";
}

function imageRejectThreshold(): number {
  const raw = process.env.MODERATION_IMAGE_REJECT_THRESHOLD?.trim();
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 1) {
    return 0.85;
  }
  return n;
}

async function moderateImageStub(context: ModerateImageContext): Promise<ModerationVerdict> {
  const env = process.env.MODERATION_STUB_VERDICT?.trim().toLowerCase();
  const decision: ModerationVerdict["decision"] =
    env === "rejected" || env === "needs_review" ? env : "approved";
  return {
    decision,
    provider: "stub",
    raw: {
      stub: true,
      kind: context.kind,
      ...(context.assetId ? { assetId: context.assetId } : {}),
    },
  };
}

async function moderateSightengine(
  bytes: ArrayBuffer,
  context: ModerateImageContext,
): Promise<ModerationVerdict> {
  const apiUser = process.env.SIGHTENGINE_API_USER?.trim();
  const apiSecret = process.env.SIGHTENGINE_API_SECRET?.trim();
  if (!apiUser || !apiSecret) {
    throw new Error("SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET must be set");
  }
  const rejectThreshold = imageRejectThreshold();
  const form = new FormData();
  form.append("media", new Blob([bytes]), "upload");
  form.append("models", "nudity-2.0");
  form.append("api_user", apiUser);
  form.append("api_secret", apiSecret);
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);
  let res: Response;
  try {
    res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  const obj = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  if (!obj || obj.status === "failure") {
    const err =
      obj && typeof obj.error === "object" && obj.error !== null
        ? String((obj.error as { message?: string }).message ?? "sightengine error")
        : !res.ok
          ? `HTTP ${res.status}`
          : "Invalid Sightengine response";
    throw new Error(err);
  }
  const nudity = obj.nudity;
  const rawScore =
    nudity && typeof nudity === "object" && nudity !== null && "raw" in nudity
      ? Number((nudity as { raw?: unknown }).raw)
      : 0;
  const safeRaw = Number.isFinite(rawScore) ? rawScore : 0;
  const decision: ModerationVerdict["decision"] =
    safeRaw >= rejectThreshold ? "rejected" : "approved";
  return {
    decision,
    provider: "sightengine",
    raw: {
      kind: context.kind,
      ...(context.assetId ? { assetId: context.assetId } : {}),
      providerResponse: obj,
      scores: { nudityRaw: safeRaw },
      rejectThreshold,
    },
  };
}

async function dispatchModerateImage(
  bytes: ArrayBuffer,
  context: ModerateImageContext,
): Promise<ModerationVerdict> {
  const provider = normalizeImageProvider();
  if (provider === "off") {
    return {
      decision: "approved",
      provider: "off",
      raw: {
        skipped: true,
        kind: context.kind,
        ...(context.assetId ? { assetId: context.assetId } : {}),
      },
    };
  }
  if (provider === "stub") {
    return moderateImageStub(context);
  }
  if (provider === "sightengine") {
    return moderateSightengine(bytes, context);
  }
  return moderateImageStub(context);
}

export async function moderateImage(
  bytes: ArrayBuffer,
  context: ModerateImageContext,
): Promise<ModerationVerdict> {
  const provider = normalizeImageProvider();
  const policy = imageModerationFailurePolicy();
  try {
    return await dispatchModerateImage(bytes, context);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const kind = context.kind;
    const assetId = context.assetId;
    if (policy === "queue") {
      return {
        decision: "needs_review",
        provider,
        raw: {
          error: message,
          failurePolicyApplied: "queue",
          kind,
          ...(assetId ? { assetId } : {}),
        },
      };
    }
    return {
      decision: "approved",
      provider,
      raw: {
        error: message,
        failurePolicyApplied: "allow",
        kind,
        ...(assetId ? { assetId } : {}),
      },
    };
  }
}

export function getImageModerationProviderForDiagnostics(): ImageModerationProviderName {
  return normalizeImageProvider();
}
