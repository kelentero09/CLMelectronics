export interface SpecItem {
  key: string;
  value: string;
}

/** Raster image already decoded to a format react-pdf can embed (PNG/JPEG; WebP is not supported). */
export interface PdfImageData {
  data: Buffer;
  format: "png" | "jpg";
}

export interface SpecSheetCompany {
  name: string;
  address?: string | null;
  phones: string[];
  email?: string | null;
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
  /** Primary product photo, pre-converted to PNG/JPEG. */
  image?: PdfImageData | null;
  /** Company logo, pre-converted to PNG/JPEG. */
  logo?: PdfImageData | null;
  datasheetUrl?: string | null;
  /** Date the product record was last updated. */
  updatedAt: string;
  /** Date this PDF was generated. */
  generatedAt: string;
  siteUrl: string;
  productUrl: string;
  company: SpecSheetCompany;
}

/** Matches the storefront palette (app/globals.css). */
export const BRAND_COLORS = {
  navy950: "#0a1628",
  navy900: "#0b1d33",
  navy800: "#12294a",
  steel500: "#2f6fed",
  steel600: "#2459c4",
  accent400: "#5b8def",
  emerald: "#059669",
  emeraldSoft: "#d1fae5",
  amber: "#d97706",
  amberSoft: "#fef3c7",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0f172a",
} as const;

export const PDF_PAGE_MARGIN = 40;
export const PDF_CONTENT_WIDTH = 595.28 - PDF_PAGE_MARGIN * 2;
