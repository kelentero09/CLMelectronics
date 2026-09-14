/**
 * Catalog constants: the five fixed categories, B2B-friendly availability
 * labels, and validation limits. No pricing concepts exist in this catalog.
 */

export const FIXED_CATEGORIES = [
  {
    name: "Equipment",
    slug: "equipment",
    description: "Semiconductor and manufacturing equipment units and assemblies.",
    sortOrder: 1,
  },
  {
    name: "Spare Parts",
    slug: "spare-parts",
    description: "Replacement and service parts for supported equipment.",
    sortOrder: 2,
  },
  {
    name: "Manufacturing Consumables",
    slug: "manufacturing-consumables",
    description: "Consumable items used in manufacturing and bonding processes.",
    sortOrder: 3,
  },
  {
    name: "ESD Materials",
    slug: "esd-materials",
    description: "Electrostatic discharge control materials and supplies.",
    sortOrder: 4,
  },
  {
    name: "Office Supplies",
    slug: "office-supplies",
    description: "General office and facility supplies.",
    sortOrder: 5,
  },
] as const;

export const AVAILABILITY_LABELS: Record<string, string> = {
  IN_STOCK: "Available",
  LOW_STOCK: "Limited",
  RESERVED: "Reserved",
  SOLD: "Allocated",
  UNAVAILABLE: "On Request",
};

export const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  USED: "Used",
  REFURBISHED: "Refurbished",
  SURPLUS: "Surplus",
  FOR_PARTS: "For Parts",
};

export const PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 15;
export const MAX_IMAGES_PER_PRODUCT = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
