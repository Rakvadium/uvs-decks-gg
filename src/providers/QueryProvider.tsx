"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { useState, ReactNode } from "react";

const createPersister = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return createAsyncStoragePersister({
    storage: {
      getItem: async (key) => (await get(key)) ?? null,
      setItem: async (key, value) => await set(key, value),
      removeItem: async (key) => await del(key),
    },
  });
};

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: 1000 * 60 * 60 * 24 * 7,
            retry: 2,
          },
        },
      })
  );

  const persister = createPersister();

  if (!persister) {
    return <>{children}</>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.queryKey[0] === "cards",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
