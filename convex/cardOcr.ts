import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v, type Infer } from "convex/values";

const OCR_MODEL = "gpt-4o";

const PLAIN_TEXT_PROMPT =
  "Extract all visible text from this image exactly as it appears. Preserve line breaks and structure. Output only the text, with no commentary.";

const extractedCardValidator = v.object({
  name: v.optional(v.string()),
  type: v.optional(v.string()),
  rarity: v.optional(v.string()),
  difficulty: v.optional(v.number()),
  control: v.optional(v.number()),
  speed: v.optional(v.number()),
  damage: v.optional(v.number()),
  blockModifier: v.optional(v.number()),
  handSize: v.optional(v.number()),
  health: v.optional(v.number()),
  stamina: v.optional(v.number()),
  attackZone: v.optional(v.string()),
  blockZone: v.optional(v.string()),
  keywords: v.optional(v.string()),
  symbols: v.optional(v.string()),
  text: v.optional(v.string()),
});

const zoneValidator = v.union(v.literal("high"), v.literal("mid"), v.literal("low"));

const SYMBOL_COUNT_PROMPT = `Look ONLY at the second image. It is already cropped to the card's resource-symbol strip to the RIGHT of the vertical "|" bar. The set logo is not present.

The first image is a symbol legend — do NOT count symbols from it.

Return ONLY JSON: { "symbolCount": number }

Rules:
- Count only circular or rounded-square element resource icons in the second image.
- symbolCount may be 0, 1, 2, 3, or more. Most crops have 1 or 2.
- Do not guess. If none are visible, return { "symbolCount": 0 }.`;

const SYSTEM_PROMPT = `You are an expert at reading UniVersus (UVS) trading card images and transcribing them into structured data.
Return ONLY a JSON object with any of these keys you can read confidently. Omit keys you cannot read.

Do NOT include symbols, attackZone, or blockZone. Those are extracted separately.

Keys and formats:
- name: string, the card title.
- type: one of "Character", "Attack", "Action", "Asset", "Foundation", "Arena", "Backup", "Token".
- Arena cards are printed rotated 90 degrees and appear sideways in the image. Read all text, stats, and symbols relative to the card's printed orientation, not as if the card were upright portrait.
- rarity: string if visible: C = Common, U = Uncommon, R = Rare, SR = Secret Rare, UR = Ultra Rare, PR = Promo, CH = Character. If a Character has a rarity after it, ignore the rarity.
- difficulty: number (top-left check value / difficulty).
- control: number (foundation control value, bottom-right area).
- speed: number (attack speed, only for Attack cards). This number is inside the attack-zone circle on the right edge.
- damage: number (attack damage, only for Attack cards). This number is inside the yellow explosion/starburst below speed.
- blockModifier: number (block modifier, e.g. +1 -> 1, -2 -> -2). This number is printed on the block shield at top-right.
- handSize: number (character hand size). This number is inside of a green stacked cards hand on character type cards.
- health: number (character health). This number is inside of a red heart on character type cards.
- stamina: number. This number is inside of a green heart on backup type cards.
- keywords: pipe-delimited keywords/traits including ratings. Example: "Ranged|EX 2|Powerful 1".
- text: pipe-delimited rules abilities. Separate each distinct ability with " | ". Keep timing prefixes. If an ability has a bracketed restriction, put the bracket before the colon, e.g. "Form [Once per turn]: Do something" and never "Form: [Once per turn]: Do something".
- In rules text, transcribe printed symbol icons inline using curly-brace tokens:
  - commit icon: {commit}
  - block zone icons: {blockhigh}, {blockmid}, {blocklow}
  - attack zone icons: {attackhigh}, {attackmid}, {attacklow}
  - normal resource icons: {air}, {all}, {chaos}, {death}, {earth}, {evil}, {fire}, {good}, {life}, {order}, {void}, {water}, {infinity}
  - attuned resource icons: {attuned:air}, {attuned:all}, {attuned:chaos}, {attuned:death}, {attuned:earth}, {attuned:evil}, {attuned:fire}, {attuned:good}, {attuned:life}, {attuned:order}, {attuned:void}, {attuned:water}
  - infinity has no attuned token.
  Example text: "Enhance {commit}: This attack gets +2 damage."

Do not invent values. Only transcribe what is printed on the card.`;

export const extractPlainTextFromImage = action({
  args: {
    imageUrl: v.string(),
  },
  returns: v.object({ text: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });

    const text = await requestVisionText(args.imageUrl, PLAIN_TEXT_PROMPT);
    return { text: text.trim() };
  },
});

export const extractCardFromImage = action({
  args: {
    imageUrl: v.string(),
    symbolReferenceImageUrl: v.optional(v.string()),
    symbolStripImageUrl: v.optional(v.string()),
    attackZone: v.optional(zoneValidator),
    blockZone: v.optional(zoneValidator),
  },
  returns: extractedCardValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });

    const content = await requestVisionText(
      args.imageUrl,
      `${SYSTEM_PROMPT}\n\nReturn ONLY valid JSON.`,
      { jsonObject: true }
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error("OpenAI returned invalid JSON");
    }

    const result = coerceExtractedCard(parsed);
    if (args.attackZone) result.attackZone = args.attackZone;
    if (args.blockZone) result.blockZone = args.blockZone;

    const symbols = await extractResourceSymbols(
      args.symbolStripImageUrl ?? args.imageUrl,
      args.symbolReferenceImageUrl,
      Boolean(args.symbolStripImageUrl)
    );
    if (symbols) {
      result.symbols = symbols;
    }

    return result;
  },
});

async function requestVisionText(
  imageUrl: string,
  systemPrompt: string,
  options?: {
    jsonObject?: boolean;
    referenceImageUrl?: string;
    referenceHint?: string;
  }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OCR_MODEL,
      temperature: 0,
      ...(options?.jsonObject ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: options?.referenceImageUrl
                ? (options.referenceHint ??
                  "The first image is a reference guide. Use it only as instructed. Read the second image.")
                : "Read the image and follow the system instructions.",
            },
            ...(options?.referenceImageUrl
              ? [{ type: "image_url", image_url: { url: options.referenceImageUrl } }]
              : []),
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OpenAI request failed (${response.status}): ${detail.slice(0, 500)}`
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned no content");
  }
  return content;
}

function symbolIdentifyPrompt(symbolCount: number, croppedStrip: boolean): string {
  const location = croppedStrip
    ? "The second image is a crop of resource icons already taken from the RIGHT of the vertical bar. The set logo is not in this crop."
    : "They appear ONLY to the RIGHT of the vertical \"|\" bar on the card. Ignore the set logo LEFT of the bar.";

  return `Look ONLY at the second image. The first image is a paired symbol legend showing normal (circle) and attuned (rounded square) versions side by side.

There are exactly ${symbolCount} resource symbol(s) to identify. ${location}

Return ONLY JSON: { "resourceSymbols": ["...", ...] }

Rules:
- resourceSymbols must be an array of length exactly ${symbolCount}.
- First match the interior symbol art against the legend groups, then decide normal vs attuned by OUTER SHAPE:
  - Circular frame = normal plain name (order, fire, evil, ...)
  - Rounded-square frame = attuned: prefix (attuned:order, attuned:fire, ...)
- Attuned icons often also have a bright white / cyan glowing outer halo. Treat glow + rounded square as attuned.
- Circular icons with a simple ring and no glow are normal.
- Valid values: air, all, chaos, death, earth, evil, fire, good, life, order, void, water, infinity, attuned:air, attuned:all, attuned:chaos, attuned:death, attuned:earth, attuned:evil, attuned:fire, attuned:good, attuned:life, attuned:order, attuned:void, attuned:water.
- order = black balance scales.
- evil = red circle with black trident/pitchfork.
- If any position is uncertain, return { "resourceSymbols": [] } instead of guessing.
- Never pad the array. Never copy symbols from the legend that are not in the second image.`;
}

async function extractResourceSymbols(
  imageUrl: string,
  symbolReferenceImageUrl: string | undefined,
  croppedStrip: boolean
): Promise<string | undefined> {
  const countContent = await requestVisionText(
    imageUrl,
    croppedStrip
      ? SYMBOL_COUNT_PROMPT
      : `Look ONLY at the card image (the second image). The first image is a symbol legend — do NOT count symbols from it.

Your only job is to count resource symbols on the card's resource symbol strip.

Return ONLY JSON: { "symbolCount": number }

Rules:
- Find the thin vertical "|" bar near the bottom-left of the card.
- Everything to the LEFT of that bar is the SET SYMBOL / set logo. Never count it.
- Count ONLY resource icons to the RIGHT of the "|" bar.
- Count only circular or rounded-square element resource icons.
- Do not guess. If none are visible to the right of the bar, return { "symbolCount": 0 }.`,
    {
      jsonObject: true,
      referenceImageUrl: symbolReferenceImageUrl,
      referenceHint: croppedStrip
        ? "The first image is a paired symbol reference guide. Do NOT count symbols from it. Count only resource icons in the second image (already cropped to exclude the set logo)."
        : "The first image is a paired symbol reference guide. Do NOT count symbols from it. Count only resource icons to the RIGHT of the vertical bar on the second image (the card).",
    }
  );

  let countParsed: Record<string, unknown>;
  try {
    countParsed = JSON.parse(countContent) as Record<string, unknown>;
  } catch {
    return undefined;
  }

  const symbolCount = asNumber(countParsed.symbolCount);
  if (symbolCount === undefined || symbolCount <= 0) {
    return undefined;
  }

  const identifyContent = await requestVisionText(
    imageUrl,
    `${symbolIdentifyPrompt(symbolCount, croppedStrip)}\n\nReturn ONLY valid JSON.`,
    {
      jsonObject: true,
      referenceImageUrl: symbolReferenceImageUrl,
      referenceHint: croppedStrip
        ? "The first image is a paired symbol reference guide (normal circle vs attuned square). Identify the resource symbols in the second image crop. The set logo is already excluded."
        : "The first image is a paired symbol reference guide (normal circle vs attuned square). Identify ONLY the resource symbols to the RIGHT of the vertical bar on the second image. Ignore the set symbol left of the bar.",
    }
  );

  let identifyParsed: Record<string, unknown>;
  try {
    identifyParsed = JSON.parse(identifyContent) as Record<string, unknown>;
  } catch {
    return undefined;
  }

  const resourceSymbols = asSymbolArray(identifyParsed.resourceSymbols);
  if (!resourceSymbols || resourceSymbols.length !== symbolCount) {
    return undefined;
  }

  const normalized = normalizeSymbolList(resourceSymbols.join("|"));
  if (!normalized) {
    return undefined;
  }

  return normalized;
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") {
      return undefined;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asPipeList(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const parts = asSymbolArray(value);
    return parts && parts.length > 0 ? parts.join("|") : undefined;
  }
  return asTrimmedString(value);
}

function asSymbolArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const parts = value
    .map((item) => asTrimmedString(item))
    .filter((item): item is string => Boolean(item));
  return parts.length > 0 ? parts : undefined;
}

type ExtractedCard = Infer<typeof extractedCardValidator>;

function coerceExtractedCard(parsed: Record<string, unknown>): ExtractedCard {
  const result: ExtractedCard = {};

  const name = asTrimmedString(parsed.name);
  if (name) result.name = name;
  const type = asTrimmedString(parsed.type);
  if (type) result.type = type;
  const rarity = asTrimmedString(parsed.rarity);
  if (rarity) result.rarity = rarity;

  const numericFields = [
    "difficulty",
    "control",
    "speed",
    "damage",
    "blockModifier",
    "handSize",
    "health",
    "stamina",
  ] as const;
  for (const field of numericFields) {
    const num = asNumber(parsed[field]);
    if (num !== undefined) result[field] = num;
  }

  const keywords = asPipeList(parsed.keywords);
  if (keywords) result.keywords = keywords;
  const text = asPipeList(parsed.text);
  if (text) result.text = normalizeAbilityTimingText(text);

  return result;
}

function normalizeAbilityTimingText(text: string): string {
  return text.replace(
    /\b(Enhance|Response|Form|Blitz|Static)\s*:\s*(\[[^\]]+\])\s*:/gi,
    (_match, timing: string, restriction: string) => `${timing} ${restriction}:`
  );
}

function normalizeSymbolList(symbols: string): string {
  return symbols
    .split(/[|,]/)
    .map((symbol) =>
      symbol
        .trim()
        .toLowerCase()
        .replace(/^\{|\}$/g, "")
        .replace(/^attuned[:-]?/, "attuned:")
    )
    .filter(Boolean)
    .join("|");
}
