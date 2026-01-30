"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";

const urlCache = new Map<string, string>();

export function useR2ImageUrls(imageKeys: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const convex = useConvex();
  const fetchedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const keysToFetch = imageKeys.filter(
      (key) => key && !urlCache.has(key) && !fetchedKeysRef.current.has(key)
    );

    if (keysToFetch.length === 0) {
      const cachedUrls: Record<string, string> = {};
      imageKeys.forEach((key) => {
        if (key && urlCache.has(key)) {
          cachedUrls[key] = urlCache.get(key)!;
        }
      });
      if (Object.keys(cachedUrls).length > 0) {
        setUrls((prev) => ({ ...prev, ...cachedUrls }));
      }
      return;
    }

    const fetchUrls = async () => {
      setIsLoading(true);
      try {
        keysToFetch.forEach((key) => fetchedKeysRef.current.add(key));
        const result = await convex.query(api.r2.getImageUrls, { keys: keysToFetch });
        
        const newUrls: Record<string, string> = {};
        Object.entries(result).forEach(([key, url]) => {
          if (url) {
            urlCache.set(key, url);
            newUrls[key] = url;
          }
        });
        
        setUrls((prev) => ({ ...prev, ...newUrls }));
      } catch (error) {
        console.error("Failed to fetch R2 URLs:", error);
        keysToFetch.forEach((key) => fetchedKeysRef.current.delete(key));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrls();
  }, [imageKeys.join(","), convex]);

  const getUrl = useCallback((key: string | undefined): string | undefined => {
    if (!key) return undefined;
    return urls[key] || urlCache.get(key);
  }, [urls]);

  return { urls, getUrl, isLoading };
}

export function useR2ImageUrl(imageKey: string | undefined) {
  const convex = useConvex();
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageKey) {
      setUrl(null);
      return;
    }

    if (urlCache.has(imageKey)) {
      setUrl(urlCache.get(imageKey)!);
      return;
    }

    const fetchUrl = async () => {
      setIsLoading(true);
      try {
        const result = await convex.query(api.r2.getImageUrl, { key: imageKey });
        if (result) {
          urlCache.set(imageKey, result);
          setUrl(result);
        }
      } catch (error) {
        console.error("Failed to fetch R2 URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, [imageKey, convex]);

  return { url, isLoading };
}
