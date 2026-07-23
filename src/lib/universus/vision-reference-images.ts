import {
  ATTUNED_SYMBOL_MAP,
  SYMBOL_BASE_PATH,
  SYMBOL_MAP,
} from "@/components/universus/symbol-icon/constants";

const REFERENCE_RESOURCE_SYMBOLS = [
  "air",
  "all",
  "chaos",
  "death",
  "earth",
  "evil",
  "fire",
  "good",
  "life",
  "order",
  "void",
  "water",
  "infinity",
] as const;

const REFERENCE_SYMBOL_DESCRIPTIONS: Record<string, string> = {
  air: "blue cyclone swirl",
  all: "black gear/cog ring with white center hole",
  chaos: "jagged red explosion mark",
  death: "white skull face with forehead lightning",
  earth: "green mountain/land shape",
  evil: "black trident/pitchfork on red circle",
  fire: "white flame on orange background",
  good: "white star on gold background",
  infinity: "black infinity loop",
  life: "green tree/leaf shape",
  order: "black balance scales",
  void: "purple spiral/swirl",
  water: "blue water droplet/wave",
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

export async function createSymbolReferenceImageUrl(): Promise<string> {
  const columns = 3;
  const cellW = 360;
  const cellH = 320;
  const headerH = 72;
  const rows = Math.ceil(REFERENCE_RESOURCE_SYMBOLS.length / columns);
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellW;
  canvas.height = headerH + rows * cellH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create symbol reference");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "start";
  ctx.fillText("Resource symbol reference", 16, 28);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#374151";
  ctx.fillText(
    "RIGHT of | only. Circle = normal. Rounded square + glow = attuned. Ignore set logo LEFT of |.",
    16,
    52
  );
  ctx.lineWidth = 1;

  const drawWrappedText = (text: string, centerX: number, startY: number, maxWidth: number) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const nextLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(nextLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = nextLine;
      }
    }
    if (line) lines.push(line);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], centerX, startY + i * 16);
    }
  };

  const drawPairCell = async (symbol: string, row: number, col: number) => {
    const x = col * cellW;
    const y = headerH + row * cellH;
    const normalFile = SYMBOL_MAP[symbol];
    if (!normalFile) return;

    ctx.strokeStyle = "#d1d5db";
    ctx.strokeRect(x + 12, y + 10, cellW - 24, cellH - 20);

    ctx.fillStyle = "#6b7280";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Choose normal or attuned", x + cellW / 2, y + 32);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(symbol.toUpperCase(), x + cellW / 2, y + 56);

    const iconSize = 96;
    const normalX = x + cellW / 2 - iconSize - 16;
    const attunedX = x + cellW / 2 + 16;
    const iconY = y + 68;

    const normalImage = await loadImage(`${SYMBOL_BASE_PATH}/${normalFile}`);
    ctx.drawImage(normalImage, normalX, iconY, iconSize, iconSize);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("normal", normalX + iconSize / 2, iconY + iconSize + 18);
    ctx.font = "13px monospace";
    ctx.fillText(symbol, normalX + iconSize / 2, iconY + iconSize + 36);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("circle", normalX + iconSize / 2, iconY + iconSize + 52);

    const attunedFile = ATTUNED_SYMBOL_MAP[symbol];
    if (attunedFile) {
      const attunedImage = await loadImage(`${SYMBOL_BASE_PATH}/${attunedFile}`);
      ctx.drawImage(attunedImage, attunedX, iconY, iconSize, iconSize);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("attuned", attunedX + iconSize / 2, iconY + iconSize + 18);
      ctx.font = "13px monospace";
      ctx.fillText(`attuned:${symbol}`, attunedX + iconSize / 2, iconY + iconSize + 36);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText("rounded square + glow", attunedX + iconSize / 2, iconY + iconSize + 52);
    } else {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px sans-serif";
      ctx.fillText("no attuned version", attunedX + iconSize / 2, iconY + iconSize / 2);
    }

    const description = REFERENCE_SYMBOL_DESCRIPTIONS[symbol];
    if (description) {
      ctx.fillStyle = "#374151";
      ctx.font = "13px sans-serif";
      drawWrappedText(description, x + cellW / 2, y + 248, cellW - 48);
    }

    ctx.textAlign = "start";
  };

  for (let i = 0; i < REFERENCE_RESOURCE_SYMBOLS.length; i++) {
    const symbol = REFERENCE_RESOURCE_SYMBOLS[i];
    await drawPairCell(symbol, Math.floor(i / columns), i % columns);
  }

  return canvas.toDataURL("image/png");
}
