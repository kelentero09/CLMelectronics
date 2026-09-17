import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { SITE_CONTENT_DEFAULTS } from "@/data/site-content-defaults";
import type { ServiceCategory } from "@/data/services";
import type { EquipmentGroup, PartsSourcingGroup } from "@/data/equipment";

export interface SiteContentRow {
  key: string;
  group: string;
  label: string;
  description: string | null;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  updatedAt: Date;
}

type ContentMap = Record<string, SiteContentRow>;

function defaultsMap(): ContentMap {
  const map: ContentMap = {};
  for (const d of SITE_CONTENT_DEFAULTS) {
    map[d.key] = {
      key: d.key,
      group: d.group,
      label: d.label,
      description: d.description ?? null,
      value: d.value,
      data: d.data ?? null,
      updatedAt: new Date(0),
    };
  }
  return map;
}

/**
 * Fast CMS read path for the storefront.
 * - Cached for 1 hour (unstable_cache + `site-content` tag).
 * - Admin edits call revalidateTag("site-content") + revalidatePath,
 *   so updates appear immediately while repeat visits are served
 *   from cache without a live DB roundtrip (speed win).
 * - Falls back to static defaults if the DB is unreachable, so pages
 *   never break and stay fast.
 */
export const getSiteContentMap = unstable_cache(
  async (): Promise<ContentMap> => {
    try {
      const rows = await prisma.siteContent.findMany({
        select: { key: true, group: true, label: true, description: true, value: true, data: true, updatedAt: true },
      });
      if (rows.length === 0) return defaultsMap();
      const base = defaultsMap();
      for (const r of rows) base[r.key] = r as SiteContentRow;
      return base;
    } catch (e) {
      console.error("Site content query failed, using static defaults", e);
      return defaultsMap();
    }
  },
  ["site-content-map"],
  { revalidate: 3600, tags: ["site-content"] }
);

export async function getContentValue(key: string): Promise<string> {
  const map = await getSiteContentMap();
  return map[key]?.value ?? "";
}

/** Split a textarea value into non-empty trimmed lines. */
export function linesOf(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Parse “Title | Description” lines into cards. Falls back to data JSON. */
export function cardsOf(row: SiteContentRow | undefined, fallback: { title: string; text: string }[]): { title: string; text: string }[] {
  if (row?.data && Array.isArray(row.data) && row.data.length > 0) {
    const parsed = (row.data as unknown[])
      .filter((c): c is { title: string; text: string } => !!c && typeof c === "object" && "title" in c)
      .map((c) => ({ title: String((c as { title: unknown }).title), text: String((c as { text: unknown }).text ?? "") }))
      .filter((c) => c.title);
    if (parsed.length > 0) return parsed;
  }
  const lines = linesOf(row?.value);
  if (lines.length === 0) return fallback;
  return lines.map((l) => {
    const [title, ...rest] = l.split("|");
    return { title: title.trim(), text: rest.join("|").trim() };
  });
}

export interface SiteContentView {
  company: {
    name: string;
    tagline: string;
    description: string;
    established: string;
    industry: string;
    address: string;
    phones: string[];
    phonesDisplay: string;
    email: string;
    mission: string;
    vision: string;
    aboutIntro: string;
    afterSales: string;
    footerAbout: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    profileDescription: string;
    profilePoints: string[];
    capabilitiesDescription: string;
    capabilityCards: { title: string; text: string }[];
    equipmentDescription: string;
    boardDescription: string;
    boardTypes: string[];
    productsDescription: string;
    whyDescription: string;
    whyCards: { title: string; text: string }[];
    ctaTitle: string;
    ctaDescription: string;
  };
  about: { heroTitle: string; heroDescription: string; legalDescription: string };
  services: { heroTitle: string; heroDescription: string; wedgeBrands: string[]; categories: ServiceCategory[] };
  equipment: {
    heroTitle: string;
    heroDescription: string;
    partsNote: string;
    partsDescription: string;
    groups: EquipmentGroup[];
    partsSourcing: PartsSourcingGroup[];
  };
  contact: { heroTitle: string };
  boardRepair: { heroTitle: string; heroDescription: string };
}

/** One cached call that resolves every storefront copy block. */
export async function getSiteContent(): Promise<SiteContentView> {
  const map = await getSiteContentMap();
  const v = (key: string) => map[key]?.value ?? "";
  const phones = linesOf(v("company.phones"));

  const servicesData = (map["services.categories"]?.data as ServiceCategory[] | undefined) ?? [];
  const equipmentData = (map["equipment.groups"]?.data as EquipmentGroup[] | undefined) ?? [];
  const partsData = (map["equipment.parts_sourcing"]?.data as PartsSourcingGroup[] | undefined) ?? [];

  return {
    company: {
      name: v("company.name"),
      tagline: v("company.tagline"),
      description: v("company.description"),
      established: v("company.established"),
      industry: v("company.industry"),
      address: v("company.address"),
      phones,
      phonesDisplay: phones.join(" / "),
      email: v("company.email"),
      mission: v("company.mission"),
      vision: v("company.vision"),
      aboutIntro: v("company.about_intro"),
      afterSales: v("company.after_sales"),
      footerAbout: v("company.footer_about"),
    },
    home: {
      heroBadge: v("home.hero_badge"),
      heroTitle: v("home.hero_title"),
      heroSubtitle: v("home.hero_subtitle"),
      profileDescription: v("home.profile_description"),
      profilePoints: linesOf(v("home.profile_points")),
      capabilitiesDescription: v("home.capabilities_description"),
      capabilityCards: cardsOf(map["home.capability_cards"], []),
      equipmentDescription: v("home.equipment_description"),
      boardDescription: v("home.board_description"),
      boardTypes: linesOf(v("home.board_types")),
      productsDescription: v("home.products_description"),
      whyDescription: v("home.why_description"),
      whyCards: cardsOf(map["home.why_cards"], []),
      ctaTitle: v("home.cta_title"),
      ctaDescription: v("home.cta_description"),
    },
    about: {
      heroTitle: v("about.hero_title"),
      heroDescription: v("about.hero_description"),
      legalDescription: v("about.legal_description"),
    },
    services: {
      heroTitle: v("services.hero_title"),
      heroDescription: v("services.hero_description"),
      wedgeBrands: linesOf(v("services.wedge_brands")),
      categories: servicesData,
    },
    equipment: {
      heroTitle: v("equipment.hero_title"),
      heroDescription: v("equipment.hero_description"),
      partsNote: v("equipment.parts_note"),
      partsDescription: v("equipment.parts_description"),
      groups: equipmentData,
      partsSourcing: partsData,
    },
    contact: { heroTitle: v("contact.hero_title") },
    boardRepair: { heroTitle: v("board_repair.hero_title"), heroDescription: v("board_repair.hero_description") },
  };
}
