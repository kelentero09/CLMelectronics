"use client";

/** Product comparison selection, persisted in localStorage and shared across components. */
export const COMPARE_STORAGE_KEY = "clm_compare_products";
export const COMPARE_MAX = 4;
export const COMPARE_EVENT = "compare-updated";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function readCompareIds(): string[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && ID_RE.test(v)).slice(0, COMPARE_MAX);
  } catch {
    return [];
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
