"use client";

import type { Doc } from "../../../convex/_generated/dataModel";

export type AdminSetCardRow = Doc<"cards">;

type CacheEntry = {
  schema: 1;
  cardDataVersion: number;
  cards: AdminSetCardRow[];
};

let storePromise: Promise<ReturnType<typeof import("idb-keyval").createStore>> | null = null;

function getStore() {
  if (typeof window === "undefined") return null;
  if (!storePromise) {
    storePromise = import("idb-keyval").then(({ createStore }) =>
      createStore("admin-set-cards-v1", "entries")
    );
  }
  return storePromise;
}

export async function loadAdminSetCardsCache(setCode: string): Promise<CacheEntry | null> {
  const sp = getStore();
  if (!sp) return null;
  const store = await sp;
  const { get } = await import("idb-keyval");
  const entry = await get<CacheEntry>(setCode, store);
  if (!entry || entry.schema !== 1) return null;
  return entry;
}

export async function saveAdminSetCardsCache(
  setCode: string,
  cardDataVersion: number,
  cards: AdminSetCardRow[]
): Promise<void> {
  const sp = getStore();
  if (!sp) return;
  const store = await sp;
  const { set } = await import("idb-keyval");
  await set(setCode, { schema: 1, cardDataVersion, cards }, store);
}
