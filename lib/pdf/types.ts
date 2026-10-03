export interface SpecItem {
  key: string;
  value: string;
}

export interface ProductImage {
  url: string;
  alt: string | null;
}

export interface SpecSheetData {
  name: string;
  referenceCode: string;
  model?: string | null;
  partNumber?: string | null;
  manufacturer?: string | null;
  category?: string | null;
  condition?: string | null;
  availability: string;
  shortDescription?: string | null;
  description?: string | null;
  specifications: SpecItem[];
  primaryImage?: ProductImage | null;
  datasheetUrl?: string | null;
  generatedAt: string;
  siteUrl: string;
}

export const BRAND_COLORS = {
  navy: "#1e293b",
  navyDark: "#0f172a",
  steel: "#334155",
  steelLight: "#64748b",
  emerald: "#059669",
  amber: "#d97706",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0f172a",
} as const;

export const PDF_PAGE_MARGIN = 48;
export const PDF_CONTENT_WIDTH = 595.28 - PDF_PAGE_MARGIN * 2;