/**
 * Partner brands shown on /brands (managed in Admin → Website Content → Brands).
 * Products are linked to a brand through the existing product "Manufacturer"
 * field: `manufacturer` here must match that field exactly.
 */
export interface PartnerBrand {
  id: string;
  name: string;
  /** Value of the product Manufacturer field that belongs to this brand. */
  manufacturer: string;
  description: string;
  /** Logo path: an uploaded /media/... image or a file in /public. Empty = show the name. */
  logo: string;
  /** Optional brand website (http/https). */
  website: string;
  /** Product lines, shown as chips. */
  lines: string[];
  /** "Authorized Dealer" is shown ONLY when this is true. Set it after the partnership is verified and approved. */
  authorized: boolean;
  /** Show the brand on the public website. */
  isActive: boolean;
}

/**
 * STAR UNION TECHNOLOGY — company description and product lines are taken from
 * its 2026 catalog. Shown and marked as authorized at the client's request;
 * this also puts "Authorized Dealer of …" under the header logo and in the
 * homepage hero. Untick "Authorized dealer" in the admin to remove all three.
 */
export const partnerBrands: PartnerBrand[] = [
  {
    id: "star-union",
    name: "STAR UNION TECHNOLOGY",
    manufacturer: "STAR UNION",
    description:
      "Founded in 2019 and headquartered in Suzhou, China, STAR UNION specializes in refurbishing used back-grinding, wafer-dicing and singulation equipment and in manufacturing peripheral equipment, together with related spare parts and consumables.",
    logo: "",
    website: "",
    lines: [
      "Used refurbished equipment (grinders, dicers)",
      "Peripheral equipment (taping, de-taping, mounter, UV cure, spinner cleaner, expander)",
      "Spare parts and parts repair",
      "Grinding and dicing consumables",
    ],
    authorized: true,
    isActive: true,
  },
];
