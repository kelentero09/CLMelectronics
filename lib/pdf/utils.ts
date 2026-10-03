import { BRAND_COLORS, PDF_CONTENT_WIDTH } from "./types";

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatAvailability(availability: string): string {
  const labels: Record<string, string> = {
    IN_STOCK: "Available",
    LOW_STOCK: "Limited Availability",
    RESERVED: "Reserved",
    SOLD: "Allocated",
    UNAVAILABLE: "On Request",
  };
  return labels[availability] ?? availability;
}

export function formatCondition(condition: string | null | undefined): string {
  if (!condition) return "";
  const labels: Record<string, string> = {
    NEW: "New",
    USED: "Used",
    REFURBISHED: "Refurbished",
    SURPLUS: "Surplus",
    FOR_PARTS: "For Parts / Repair Only",
  };
  return labels[condition] ?? condition;
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .substring(0, 80);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export const SPEC_TABLE_COL_WIDTHS = {
  key: PDF_CONTENT_WIDTH * 0.35,
  value: PDF_CONTENT_WIDTH * 0.65,
};

export const INFO_TABLE_COL_WIDTHS = {
  label: PDF_CONTENT_WIDTH * 0.25,
  value: PDF_CONTENT_WIDTH * 0.75,
};