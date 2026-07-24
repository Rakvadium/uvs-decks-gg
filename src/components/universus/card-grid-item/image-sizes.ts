export function galleryCardImageSizes(cardsPerRow: number): string {
  const cols = Math.min(10, Math.max(1, Math.round(cardsPerRow)));
  const desktopVw = Math.min(60, Math.ceil((100 / cols) * 1.5));
  return `(max-width: 640px) 90vw, (max-width: 768px) 50vw, ${desktopVw}vw`;
}
