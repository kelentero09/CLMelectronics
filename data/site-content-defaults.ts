import { company } from "./company";
import { serviceCategories, wedgeBrands } from "./services";
import { equipmentGroups, partsSourcing } from "./equipment";

export interface SiteContentDefault {
  key: string;
  group: string;
  label: string;
  description?: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  sortOrder: number;
}

/**
 * Current website contents, migrated into seedable CMS rows.
 * DB (SiteContent table) is the source of truth after seeding;
 * these defaults are the fallback used when the DB is unreachable,
 * so the storefront stays fast and never breaks.
 */
export const SITE_CONTENT_DEFAULTS: SiteContentDefault[] = [
  // ── General / Company & Contact ──────────────────────────────
  { key: "company.name", group: "general", label: "Company name", value: company.name, sortOrder: 1 },
  { key: "company.tagline", group: "general", label: "Tagline", value: company.tagline, sortOrder: 2 },
  {
    key: "company.description",
    group: "general",
    label: "Company description (hero)",
    description: "Shown under the hero title on the homepage.",
    value: company.description,
    sortOrder: 3,
  },
  { key: "company.established", group: "general", label: "Established", value: company.established, sortOrder: 4 },
  { key: "company.industry", group: "general", label: "Industry", value: company.industry, sortOrder: 5 },
  { key: "company.address", group: "general", label: "Address", value: company.address, sortOrder: 6 },
  {
    key: "company.phones",
    group: "general",
    label: "Phone numbers",
    description: "One per line. Shown in footer and contact sections.",
    value: company.phones.join("\n"),
    data: company.phones,
    sortOrder: 7,
  },
  { key: "company.email", group: "general", label: "Email", value: company.email, sortOrder: 8 },
  { key: "company.mission", group: "general", label: "Mission", value: company.mission, sortOrder: 9 },
  { key: "company.vision", group: "general", label: "Vision", value: company.vision, sortOrder: 10 },
  {
    key: "company.about_intro",
    group: "general",
    label: "About intro (About page)",
    value: company.aboutIntro,
    sortOrder: 11,
  },
  {
    key: "company.after_sales",
    group: "general",
    label: "After-sales note",
    value: company.afterSales,
    sortOrder: 12,
  },
  {
    key: "company.footer_about",
    group: "general",
    label: "Footer about text",
    value:
      "B2B product catalog for semiconductor and manufacturing equipment, spare parts, consumables, and materials. Information and inquiry only.",
    sortOrder: 13,
  },

  // ── Homepage ─────────────────────────────────────────────────
  {
    key: "home.hero_badge",
    group: "home",
    label: "Hero badge",
    value: "Established January 10, 2023 · Muntinlupa City",
    sortOrder: 1,
  },
  {
    key: "home.hero_title",
    group: "home",
    label: "Hero title",
    value: "CLM Electronics Engineering Services",
    sortOrder: 2,
  },
  {
    key: "home.hero_subtitle",
    group: "home",
    label: "Hero subtitle",
    value: "Technical Solutions for Semiconductor & Manufacturing Industries",
    sortOrder: 3,
  },
  {
    key: "home.profile_description",
    group: "home",
    label: "Company profile paragraph",
    description: "Homepage “Who CLM Is” section.",
    value:
      "CLM Electronics Engineering Services was established on January 10, 2023 to provide services and solutions for semiconductor and manufacturing industries. CLM builds long-term, trusted business relationships with customers through responsive, quality, and reliable technical services.",
    sortOrder: 4,
  },
  {
    key: "home.profile_points",
    group: "home",
    label: "Company highlight bullets",
    description: "One per line.",
    value: [
      "Established January 10, 2023",
      "Semiconductor and manufacturing focus",
      "Technical and engineering services",
      "Quality and reliable service",
      "Long-term customer relationships",
      "Accountable after-sales support",
    ].join("\n"),
    data: [
      "Established January 10, 2023",
      "Semiconductor and manufacturing focus",
      "Technical and engineering services",
      "Quality and reliable service",
      "Long-term customer relationships",
      "Accountable after-sales support",
    ],
    sortOrder: 5,
  },
  {
    key: "home.capabilities_description",
    group: "home",
    label: "Capabilities intro",
    value: "A high-level overview of CLM's capabilities. See the Services page for full details.",
    sortOrder: 6,
  },
  {
    key: "home.capability_cards",
    group: "home",
    label: "Capability cards",
    description: "One per line as “Title | Description”.",
    value: [
      "Technical Support | Technical assessment, minor and major repair, and responsive technical support.",
      "Preventive & Predictive Maintenance | Scheduled maintenance programs and equipment support that sustain machine condition.",
      "Equipment Support | Technical services for semiconductor manufacturing equipment and sub-assemblies.",
      "Parts & Components | Machine spare parts sourcing and installation according to customer requirements.",
      "Board Repair | Repair support for various electronic and equipment control boards.",
      "Technical Training | Machine operation, setup, maintenance, calibration, and technical training.",
    ].join("\n"),
    data: [
      { title: "Technical Support", text: "Technical assessment, minor and major repair, and responsive technical support." },
      { title: "Preventive & Predictive Maintenance", text: "Scheduled maintenance programs and equipment support that sustain machine condition." },
      { title: "Equipment Support", text: "Technical services for semiconductor manufacturing equipment and sub-assemblies." },
      { title: "Parts & Components", text: "Machine spare parts sourcing and installation according to customer requirements." },
      { title: "Board Repair", text: "Repair support for various electronic and equipment control boards." },
      { title: "Technical Training", text: "Machine operation, setup, maintenance, calibration, and technical training." },
    ],
    sortOrder: 7,
  },
  {
    key: "home.equipment_description",
    group: "home",
    label: "Equipment section intro",
    value:
      "CLM services semiconductor manufacturing equipment across these major categories. Detailed machine models remain on the Equipment page.",
    sortOrder: 8,
  },
  {
    key: "home.board_description",
    group: "home",
    label: "Board repair intro (homepage)",
    value:
      "CLM provides board repair capabilities for equipment-related electronic boards, based on technical capability and available resources.",
    sortOrder: 9,
  },
  {
    key: "home.board_types",
    group: "home",
    label: "Supported board types",
    description: "One per line.",
    value: ["Main boards", "Driver boards", "Power supplies", "CPU boards", "Logic boards", "Servo / driver boards"].join("\n"),
    data: ["Main boards", "Driver boards", "Power supplies", "CPU boards", "Logic boards", "Servo / driver boards"],
    sortOrder: 10,
  },
  {
    key: "home.products_description",
    group: "home",
    label: "Products section intro",
    value:
      "A small selection from the CLM catalog — equipment, spare parts, and technical items. Information and inquiry only.",
    sortOrder: 11,
  },
  {
    key: "home.why_description",
    group: "home",
    label: "Why CLM intro",
    value: "What customers can expect when working with CLM Electronics Engineering Services.",
    sortOrder: 12,
  },
  {
    key: "home.why_cards",
    group: "home",
    label: "Why CLM cards",
    description: "One per line as “Title | Description”.",
    value: [
      "Quality Service | Focus on quality products, support, and services in every engagement.",
      "Reliable Technical Support | Responsive technical assistance and equipment support when it matters.",
      "After-Sales Support | Continued, accountable support after service and installation.",
      "Industry-Focused Expertise | Experience focused on semiconductor and manufacturing equipment.",
    ].join("\n"),
    data: [
      { title: "Quality Service", text: "Focus on quality products, support, and services in every engagement." },
      { title: "Reliable Technical Support", text: "Responsive technical assistance and equipment support when it matters." },
      { title: "After-Sales Support", text: "Continued, accountable support after service and installation." },
      { title: "Industry-Focused Expertise", text: "Experience focused on semiconductor and manufacturing equipment." },
    ],
    sortOrder: 13,
  },
  {
    key: "home.cta_title",
    group: "home",
    label: "CTA title",
    value: "Looking for Reliable Technical & Engineering Support?",
    sortOrder: 14,
  },
  {
    key: "home.cta_description",
    group: "home",
    label: "CTA description",
    value:
      "Tell us about your equipment or service need — CLM responds with quality, reliable technical support and accountable after-sales service.",
    sortOrder: 15,
  },

  // ── About ────────────────────────────────────────────────────
  {
    key: "about.hero_title",
    group: "about",
    label: "About hero title",
    value: "Company Profile",
    sortOrder: 1,
  },
  {
    key: "about.hero_description",
    group: "about",
    label: "About hero description",
    value: "A service-focused engineering provider for semiconductor and manufacturing equipment.",
    sortOrder: 2,
  },
  {
    key: "about.legal_description",
    group: "about",
    label: "Registration section intro",
    value:
      "CLM Electronics Engineering Services is a DTI and BIR registered business in the Philippines with a valid local business permit.",
    sortOrder: 3,
  },

  // ── Services (structured JSON, editable in dashboard) ────────
  {
    key: "services.hero_title",
    group: "services",
    label: "Services hero title",
    value: "Engineering Services & Technical Capabilities",
    sortOrder: 1,
  },
  {
    key: "services.hero_description",
    group: "services",
    label: "Services hero description",
    value:
      "Organized service capabilities for semiconductor and manufacturing equipment — focused on reliability, maintainability, and responsive support.",
    sortOrder: 2,
  },
  {
    key: "services.wedge_brands",
    group: "services",
    label: "Wedge bonding referenced brands",
    description: "One per line. Shown as serviced equipment, not an authorized distributorship.",
    value: wedgeBrands.join("\n"),
    data: wedgeBrands,
    sortOrder: 3,
  },
  {
    key: "services.categories",
    group: "services",
    label: "Service categories",
    description: "Managed in the Services editor below — title, summary, and bullet items per category.",
    value: serviceCategories.map((c) => c.title).join("\n"),
    data: serviceCategories,
    sortOrder: 4,
  },

  // ── Equipment (structured JSON, editable in dashboard) ───────
  {
    key: "equipment.hero_title",
    group: "equipment",
    label: "Equipment hero title",
    value: "Equipment Expertise",
    sortOrder: 1,
  },
  {
    key: "equipment.hero_description",
    group: "equipment",
    label: "Equipment hero description",
    value:
      "The equipment and brands below reflect machines CLM has experience servicing. They are presented as serviced equipment — not as official manufacturer affiliations or authorized distributorships.",
    sortOrder: 2,
  },
  {
    key: "equipment.parts_note",
    group: "equipment",
    label: "Parts sourcing note",
    value:
      "CLM also provides services for other equipment brands based on available capabilities and resources. Contact us with your specific machine model to confirm coverage.",
    sortOrder: 3,
  },
  {
    key: "equipment.groups",
    group: "equipment",
    label: "Equipment groups",
    description: "Managed in the Equipment editor below — brand, label, description, and models per group.",
    value: equipmentGroups.map((g) => `${g.brand} — ${g.label}`).join("\n"),
    data: equipmentGroups,
    sortOrder: 4,
  },
  {
    key: "equipment.parts_sourcing",
    group: "equipment",
    label: "Spare parts sourcing groups",
    description: "Brand plus supported models. Shown on the Equipment page.",
    value: partsSourcing.map((g) => g.brand).join("\n"),
    data: partsSourcing,
    sortOrder: 5,
  },
  {
    key: "equipment.parts_description",
    group: "equipment",
    label: "Spare parts section intro",
    value:
      "We source machine spare parts according to customer requirements and equipment needs. Availability depends on equipment model and sourcing conditions.",
    sortOrder: 6,
  },

  // ── Contact / Board repair ───────────────────────────────────
  {
    key: "contact.hero_title",
    group: "contact",
    label: "Contact hero title",
    value: "Contact CLM",
    sortOrder: 1,
  },
  {
    key: "board_repair.hero_title",
    group: "contact",
    label: "Board repair hero title",
    value: "Board Repair Capability",
    sortOrder: 2,
  },
  {
    key: "board_repair.hero_description",
    group: "contact",
    label: "Board repair hero description",
    value:
      "CLM Electronics Engineering Services provides board repair capabilities for semiconductor and manufacturing equipment. Our repair services cover a range of control, driver, power supply, interface, and electronic boards based on our technical capabilities and available resources.",
    sortOrder: 3,
  },
];

export const SITE_CONTENT_GROUPS = [
  { id: "general", label: "Company & Contact", hint: "Name, address, phones, email, mission, vision, footer text." },
  { id: "home", label: "Homepage", hint: "Hero, profile bullets, capability cards, board types, Why CLM, CTA." },
  { id: "about", label: "About page", hint: "Hero title, intro, registration section text." },
  { id: "services", label: "Services", hint: "Hero text, wedge brands, and the 9 service categories with bullets." },
  { id: "equipment", label: "Equipment", hint: "Hero text, equipment groups with models, parts sourcing." },
  { id: "contact", label: "Contact & Board Repair", hint: "Contact title and board-repair hero copy." },
] as const;
