import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createWorker } from "tesseract.js";
import { CARD_OCR_TEMPLATES, type CardOcrType } from "../convex/lib/cardOcrTemplates";
import { parseCardText, type ParsedCardDraft } from "../convex/lib/cardTextParser";

type Fixture = {
  label: string;
  type: CardOcrType;
  imagePath: string;
  expected: Partial<ParsedCardDraft>;
};

type FieldDiff = {
  field: string;
  expected: unknown;
  actual: unknown;
  match: boolean;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(root, "scripts/ocr-calibration/fixtures.json");
const outputDir = resolve(root, "scripts/ocr-calibration/output");

function argValue(name: string): string | undefined {
  const exact = `--${name}`;
  const prefixed = `${exact}=`;
  const args = process.argv.slice(2);
  const exactIndex = args.indexOf(exact);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const match = args.find((arg) => arg.startsWith(prefixed));
  return match ? match.slice(prefixed.length) : undefined;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readFixtures(): Promise<Fixture[]> {
  const content = await readFile(fixturePath, "utf8");
  const fixtures = JSON.parse(content) as Fixture[];
  return fixtures.filter((fixture) => fixture.imagePath.trim().length > 0);
}

async function runTesseract(imagePath: string): Promise<{ text: string; confidence?: number }> {
  const worker = await createWorker("eng");
  try {
    const image = await readFile(resolve(root, imagePath));
    const { data } = await worker.recognize(Buffer.from(image));
    return {
      text: data.text.trim(),
      confidence:
        typeof data.confidence === "number" && Number.isFinite(data.confidence)
          ? data.confidence
          : undefined,
    };
  } finally {
    await worker.terminate();
  }
}

function diffExpected(
  expected: Partial<ParsedCardDraft>,
  actual: Partial<ParsedCardDraft>
): FieldDiff[] {
  return Object.entries(expected)
    .filter(([, expectedValue]) => expectedValue !== "")
    .map(([field, expectedValue]) => {
      const actualValue = actual[field as keyof ParsedCardDraft];
      return {
        field,
        expected: expectedValue,
        actual: actualValue,
        match: String(expectedValue ?? "").trim() === String(actualValue ?? "").trim(),
      };
    });
}

async function writeOutput(label: string, fileName: string, value: string) {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, `${label}.${fileName}`), value, "utf8");
}

async function main() {
  const typeFilter = argValue("type");
  const fixtures = (await readFixtures()).filter(
    (fixture) => !typeFilter || fixture.type.toLowerCase() === typeFilter.toLowerCase()
  );

  if (fixtures.length === 0) {
    console.log("No fixtures with imagePath matched.");
    return;
  }

  for (const fixture of fixtures) {
    const ocr = await runTesseract(fixture.imagePath);
    const parsed = parseCardText(ocr.text, CARD_OCR_TEMPLATES[fixture.type]);
    const diff = diffExpected(fixture.expected, parsed.draft);
    const passed = diff.filter((entry) => entry.match).length;
    const total = diff.length;
    await writeOutput(fixture.label, "raw.txt", `${ocr.text}\n`);
    await writeOutput(
      fixture.label,
      "parsed.json",
      stableJson({
        confidence: ocr.confidence,
        detectedType: parsed.detectedType,
        parseWarnings: parsed.parseWarnings,
        draft: parsed.draft,
      })
    );
    await writeOutput(
      fixture.label,
      "diff.json",
      stableJson({
        passed,
        total,
        rate: total === 0 ? null : passed / total,
        fields: diff,
      })
    );
    console.log(`${fixture.label}: ${passed}/${total} fields matched`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
