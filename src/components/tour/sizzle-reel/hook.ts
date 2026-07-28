"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SIZZLE_BEATS } from "./beats";

export function useSizzleReel() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const beat = SIZZLE_BEATS[index] ?? SIZZLE_BEATS[0]!;
  const isLast = index >= SIZZLE_BEATS.length - 1;
  const effectivePlaying = prefersReducedMotion ? false : playing;
  const effectiveProgress = prefersReducedMotion ? 1 : progress;

  const goTo = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(SIZZLE_BEATS.length - 1, nextIndex));
    setIndex(clamped);
    setProgress(0);
  };

  const next = () => {
    setIndex((current) => {
      if (current >= SIZZLE_BEATS.length - 1) {
        setPlaying(false);
        setProgress(1);
        return current;
      }
      setProgress(0);
      return current + 1;
    });
  };

  const prev = () => {
    setIndex((current) => Math.max(0, current - 1));
    setProgress(0);
    setPlaying(true);
  };

  const togglePlay = () => {
    setPlaying((value) => {
      if (!value && isLast && progress >= 1) {
        setIndex(0);
        setProgress(0);
        return true;
      }
      return !value;
    });
  };

  useEffect(() => {
    if (!effectivePlaying) return;

    let frame = 0;
    let last = performance.now();
    let localProgress = 0;
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;
      const delta = now - last;
      last = now;
      localProgress += delta / beat.durationMs;

      if (localProgress >= 1) {
        localProgress = 0;
        setIndex((currentIndex) => {
          if (currentIndex >= SIZZLE_BEATS.length - 1) {
            setPlaying(false);
            setProgress(1);
            stopped = true;
            return currentIndex;
          }
          setProgress(0);
          return currentIndex + 1;
        });
        return;
      }

      setProgress(localProgress);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
  }, [effectivePlaying, beat.durationMs, index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowRight" || event.key === "l") {
        event.preventDefault();
        next();
        setPlaying(true);
      } else if (event.key === "ArrowLeft" || event.key === "j") {
        event.preventDefault();
        prev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return {
    beats: SIZZLE_BEATS,
    beat,
    index,
    playing: effectivePlaying,
    progress: effectiveProgress,
    prefersReducedMotion,
    isLast,
    goTo,
    next,
    prev,
    togglePlay,
    setPlaying,
  };
}
