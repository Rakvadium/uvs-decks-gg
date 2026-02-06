import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from "../shell-slot-provider";

interface UseRightSidebarResizeParams {
  sidebarWidth: number;
  onWidthCommit: (width: number) => void;
}

export function useRightSidebarResize({ sidebarWidth, onWidthCommit }: UseRightSidebarResizeParams) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizingWidth, setResizingWidth] = useState(sidebarWidth);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(sidebarWidth);

  const handleResizeStart = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      setIsResizing(true);
      setResizingWidth(sidebarWidth);
      resizeStartXRef.current = event.clientX;
      resizeStartWidthRef.current = sidebarWidth;
    },
    [sidebarWidth]
  );

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = resizeStartXRef.current - event.clientX;
      const nextWidth = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(MAX_SIDEBAR_WIDTH, resizeStartWidthRef.current + deltaX)
      );

      setResizingWidth(nextWidth);
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;

    onWidthCommit(resizingWidth);
    setIsResizing(false);
  }, [isResizing, onWidthCommit, resizingWidth]);

  useEffect(() => {
    if (!isResizing) return;

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return {
    isResizing,
    panelWidth: isResizing ? resizingWidth : sidebarWidth,
    handleResizeStart,
  };
}
