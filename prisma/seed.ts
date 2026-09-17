/**
 * Seed: 5 fixed categories (idempotent upsert) + ADMIN user + clearly-marked
 * SAMPLE products for development. Run AFTER `prisma migrate deploy` with
 * Supabase env configured: `pnpm seed`.
 * Replace or remove ALL SAMPLE products with CLM-approved content before launch.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { FIXED_CATEGORIES } from "../lib/catalog";
import { slugify } from "../lib/utils";
import { boardRepairRecords } from "../data/board-repair";
import { SITE_CONTENT_DEFAULTS } from "../data/site-content-defaults";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@clm.local";

const SAMPLE_PRODUCTS = [
  {
    name: "[SAMPLE] Servo Drive Unit 200V",
    referenceCode: "SAMPLE-SRV-001",
    categorySlug: "spare-parts",
    model: "SGDM-04ADA",
    partNumber: "SMP-0001",
    manufacturer: "Sample Manufacturer",
    shortDescription: "Sample servo drive for layout testing only. Not a real CLM listing.",
    condition: "USED" as const,
    availability: "IN_STOCK" as const,
    featured: true,
  },
  {
    name: "[SAMPLE] Wire Bonder Bond Head Assembly",
    referenceCode: "SAMPLE-BHD-002",
    categorySlug: "equipment",
    model: "SAMPLE-E60",
    manufacturer: "Sample Manufacturer",
    shortDescription: "Sample equipment assembly for layout testing only. Not a real CLM listing.",
    condition: "REFURBISHED" as const,
    availability: "LOW_STOCK" as const,
    featured: true,
  },
  {
    name: "[SAMPLE] Aluminum Wedge Bond Tool",
    referenceCode: "SAMPLE-BND-003",
    categorySlug: "manufacturing-consumables",
    manufacturer: "Sample Manufacturer",
    shortDescription: "Sample consumable for layout testing only. Not a real CLM listing.",
    condition: "NEW" as const,
    availability: "IN_STOCK" as const,
  },
  {
    name: "[SAMPLE] ESD Wrist Strap Coil Cord",
    referenceCode: "SAMPLE-ESD-004",
    categorySlug: "esd-materials",
    manufacturer: "Sample Manufacturer",
    shortDescription: "Sample ESD item for layout testing only. Not a real CLM listing.",
    condition: "NEW" as const,
    availability: "IN_STOCK" as const,
  },
  {
    name: "[SAMPLE] Thermal Printer Paper A4 (Box)",
    referenceCode: "SAMPLE-OFF-005",
    categorySlug: "office-supplies",
    manufacturer: "Sample Manufacturer",
    shortDescription: "Sample office item for layout testing only. Not a real CLM listing.",
    condition: "NEW" as const,
    availability: "UNAVAILABLE" as const,
  },
  {
    name: "[SAMPLE] Indexer Driver Board",
    referenceCode: "SAMPLE-PCB-006",
    categorySlug: "spare-parts",
    partNumber: "SMP-0006",
    manufacturer: "Sample Manufacturer",
    shortDescription: "Sample board for layout testing only. Not a real CLM listing.",
    condition: "FOR_PARTS" as const,
    availability: "RESERVED" as const,
  },
];

async function main() {
  for (const c of FIXED_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: { name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder },
    });
  }
  console.log("Categories seeded (5 fixed).");

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: { email: ADMIN_EMAIL, name: "CLM Admin", role: "ADMIN" },
  });
  console.log(`Admin user ready: ${ADMIN_EMAIL} (create the matching Supabase Auth account separately).`);

  const existingSamples = await prisma.product.count({ where: { referenceCode: { startsWith: "SAMPLE-" } } });
  if (existingSamples === 0) {
    for (const s of SAMPLE_PRODUCTS) {
      const category = await prisma.category.findUnique({ where: { slug: s.categorySlug } });
      await prisma.product.create({
        data: {
          name: s.name,
          slug: slugify(s.name),
          referenceCode: s.referenceCode,
          categoryId: category?.id ?? null,
          model: s.model ?? null,
          partNumber: s.partNumber ?? null,
          manufacturer: s.manufacturer,
          shortDescription: s.shortDescription,
          description: `${s.shortDescription} This is placeholder content generated for development and must be replaced with CLM-approved content before launch.`,
          specifications: [
            { key: "Sample Spec", value: "Demo value — replace before launch" },
          ],
          condition: s.condition,
          availability: s.availability,
          published: true,
          featured: s.featured ?? false,
        },
      });
    }
    console.log(`Sample products seeded (${SAMPLE_PRODUCTS.length}, all marked SAMPLE).`);
  } else {
    console.log(`Skipped sample products (${existingSamples} already exist).`);
  }

  let repairUpserts = 0;
  for (let i = 0; i < boardRepairRecords.length; i++) {
    const r = boardRepairRecords[i];
    await prisma.boardRepair.upsert({
      where: { key: r.id },
      update: {
        station: r.station,
        model: r.model,
        boardDescription: r.boardDescription,
        image: r.image,
        problem: r.problem,
        repairRate: r.repairRate,
        sortOrder: i,
      },
      create: {
        key: r.id,
        station: r.station,
        model: r.model,
        boardDescription: r.boardDescription,
        image: r.image,
        problem: r.problem,
        repairRate: r.repairRate,
        sortOrder: i,
        isActive: true,
      },
    });
    repairUpserts++;
  }
  console.log(`Board repairs seeded (${repairUpserts} upserted).`);

  // Website CMS contents — idempotent upsert by stable key. Existing
  // admin-edited rows keep their value unless the key is new; seed only
  // fills missing keys so client edits are never overwritten.
  let siteContentCount = 0;
  for (const entry of SITE_CONTENT_DEFAULTS) {
    const existing = await prisma.siteContent.findUnique({ where: { key: entry.key } });
    if (!existing) {
      await prisma.siteContent.create({
        data: {
          key: entry.key,
          group: entry.group,
          label: entry.label,
          description: entry.description ?? null,
          value: entry.value,
          data: entry.data === undefined ? undefined : entry.data,
          sortOrder: entry.sortOrder,
        },
      });
      siteContentCount++;
    }
  }
  console.log(`Site contents seeded (${siteContentCount} new keys, ${SITE_CONTENT_DEFAULTS.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
