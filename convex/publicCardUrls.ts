export const PUBLIC_R2_BASE_URL =
  "https://pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev";

export const CATALOG_STATIC_SCHEMA_VERSION = 1;

export function toPublicCardImageUrl(imageUrl?: string) {
  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${PUBLIC_R2_BASE_URL}/cards/${imageUrl}`;
}

export function catalogObjectKeyForVersion(version: number): string {
  return `catalog/v${version}.json.gz`;
}

export function toPublicCatalogUrl(version: number): string {
  return `${PUBLIC_R2_BASE_URL}/${catalogObjectKeyForVersion(version)}`;
}
