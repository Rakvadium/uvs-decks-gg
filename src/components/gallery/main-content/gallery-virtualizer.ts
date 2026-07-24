import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export const GALLERY_GRID_GAP_PX = 16;
export const GALLERY_CARD_ASPECT = 3.5 / 2.5;

export function estimateGalleryGridRowHeight(rowWidth: number, columnCount: number): number {
  if (rowWidth <= 0 || columnCount <= 0) return 400;
  const colWidth = (rowWidth - GALLERY_GRID_GAP_PX * (columnCount - 1)) / columnCount;
  return Math.ceil(colWidth * GALLERY_CARD_ASPECT);
}

export function galleryVirtualRowStyle(start: number): CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    transform: `translate3d(0, ${Math.round(start)}px, 0)`,
  };
}

export function useElementWidth(ref: RefObject<HTMLElement | null>, enabled = true): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setWidth(el.clientWidth);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, ref]);

  return width;
}

export function useScrollMargin(
  scrollElement: HTMLElement | null,
  listRef: RefObject<HTMLElement | null>
): number {
  const [margin, setMargin] = useState(0);

  useLayoutEffect(() => {
    const listElement = listRef.current;
    if (!scrollElement || !listElement) return;

    const update = () => {
      const next =
        listElement.getBoundingClientRect().top -
        scrollElement.getBoundingClientRect().top +
        scrollElement.scrollTop;
      setMargin((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(scrollElement);
    observer.observe(listElement);
    return () => observer.disconnect();
  }, [listRef, scrollElement]);

  return margin;
}
