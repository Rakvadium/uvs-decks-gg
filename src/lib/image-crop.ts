import type { Area } from "react-easy-crop";

const MAX_OUTPUT_SIDE = 2048;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Image failed to load")));
    if (!url.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.src = url;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: string,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.max(1, Math.round(pixelCrop.width * scale));
  const outH = Math.max(1, Math.round(pixelCrop.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );

  const outMime =
    mimeType === "image/png" || mimeType === "image/webp" || mimeType === "image/gif"
      ? "image/png"
      : "image/jpeg";
  const quality = outMime === "image/jpeg" ? 0.92 : undefined;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not export image"));
      },
      outMime,
      quality,
    );
  });
}

export function outputMimeForUpload(sourceMime: string): string {
  if (sourceMime === "image/png" || sourceMime === "image/webp" || sourceMime === "image/gif") {
    return "image/png";
  }
  return "image/jpeg";
}
