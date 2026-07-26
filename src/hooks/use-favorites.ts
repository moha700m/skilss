"use client";

import { useMemo, useSyncExternalStore } from "react";

const storageKey = "skillatlas-favorites";
const changeEvent = "skillatlas-favorites-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(changeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(changeEvent, onStoreChange);
  };
}
function getSnapshot() {
  return window.localStorage.getItem(storageKey) ?? "[]";
}

function getServerSnapshot() {
  return "[]";
}

function parseFavorites(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const favorites = useMemo(() => parseFavorites(raw), [raw]);

  function toggleFavorite(id: string) {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    window.dispatchEvent(new Event(changeEvent));
  }

  return { favorites, toggleFavorite };
}
