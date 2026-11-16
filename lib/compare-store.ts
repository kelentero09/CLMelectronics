"use client";

import { useSyncExternalStore } from "react";

/** Product comparison selection, persisted in localStorage and shared across components. */
export const COMPARE_STORAGE_KEY = "clm_compare_products";
export const COMPARE_MAX = 4;
export const COMPARE_EVENT = "compare-updated";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const EMPTY: string[] = [];

export function readCompareIds(): string[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((v): v is string => typeof v === "string" && ID_RE.test(v)).slice(0, COMPARE_MAX);
  } catch {
    return EMPTY;
  }
}

export function writeCompareIds(ids: string[]): void {
  try {
    const clean = [...new Set(ids)].filter((v) => ID_RE.test(v)).slice(0, COMPARE_MAX);
    if (clean.length) localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(clean));
    else localStorage.removeItem(COMPARE_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode or blocked): the selection just is not persisted.
  }
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT));
}

/** URL of the comparison page for the current selection. */
export function compareHref(ids: string[]): string {
  return ids.length ? `/compare?ids=${ids.join(",")}` : "/compare";
}

// --- React subscription (cached snapshot so useSyncExternalStore gets a stable reference) ---
let cachedRaw: string | null | undefined;
let cachedIds: string[] = EMPTY;

function getSnapshot(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(COMPARE_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = readCompareIds();
  }
  return cachedIds;
}

function subscribe(onChange: () => void) {
  window.addEventListener(COMPARE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COMPARE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Live list of selected product ids (empty during SSR). */
export function useCompareIds(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
