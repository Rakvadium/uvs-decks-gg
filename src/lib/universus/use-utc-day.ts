"use client";

import { useSyncExternalStore } from "react";
import { utcDayNumber } from "../../../shared/standard-rotation";

function subscribeUtcDay(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(id);
}

function readUtcDay() {
  return utcDayNumber(Date.now());
}

export function useUtcDayNumber(): number {
  return useSyncExternalStore(subscribeUtcDay, readUtcDay, readUtcDay);
}

/** Noon UTC on the calendar day from `utcDayNumber`, so release-day checks stay stable. */
export function utcNoonFromDayNumber(day: number): number {
  const year = Math.floor(day / 10000);
  const month = Math.floor((day % 10000) / 100);
  const date = day % 100;
  return Date.UTC(year, month - 1, date, 12, 0, 0);
}
