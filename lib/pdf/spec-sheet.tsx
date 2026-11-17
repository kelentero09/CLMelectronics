import React from "react";
import { Document, Page, View, Text, Image as PDFImage, Link, StyleSheet, pdf } from "@react-pdf/renderer";
import { SpecSheetData, BRAND_COLORS as C, PDF_PAGE_MARGIN } from "./types";
import { formatAvailability, formatCondition } from "./utils";

// Built-in PDF fonts: no network fetch at render time.
const SANS = "Helvetica";
const SANS_BOLD = "Helvetica-Bold";
const MONO = "Courier";

const HEADER_H = 64;
const FOOTER_H = 44;
const A4_HEIGHT = 841.89;

const s = StyleSheet.create({
  page: {
    paddingTop: HEADER_H + 24,
    paddingBottom: FOOTER_H + 20,
    paddingHorizontal: PDF_PAGE_MARGIN,
    fontFamily: SANS,
    fontSize: 9,
    lineHeight: 1.45,
    color: C.slate700,
  },

  /* Fixed header band */
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    backgroundColor: C.navy950,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PDF_PAGE_MARGIN,
  },
  headerAccent: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: C.steel500 },
  brand: { flexDirection: "row", alignItems: "center" },
  logo: { width: 34, height: 34, borderRadius: 4, backgroundColor: C.white, marginRight: 10 },
  brandName: { fontFamily: SANS_BOLD, fontSize: 11, color: C.white, letterSpacing: 0.8 },
  brandSub: { fontSize: 6.5, color: C.slate300, letterSpacing: 2, marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  docType: { fontFamily: SANS_BOLD, fontSize: 7, color: C.accent400, letterSpacing: 1.6 },
  docRef: { fontFamily: SANS_BOLD, fontSize: 10, color: C.white, marginTop: 3 },

  /* Hero */
  hero: { flexDirection: "row", marginBottom: 22 },
  imageBox: {
    width: 200,
    height: 170,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 8,
    backgroundColor: C.white,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
  },
  productImage: { maxWidth: 180, maxHeight: 150, objectFit: "contain" },
  imagePlaceholder: { fontFamily: SANS_BOLD, fontSize: 22, color: C.slate300, letterSpacing: 3 },
  placeholderRef: { fontFamily: MONO, fontSize: 7, color: C.slate400, marginTop: 4 },
  heroBody: { flex: 1 },
  eyebrow: { fontFamily: SANS_BOLD, fontSize: 7.5, color: C.steel600, letterSpacing: 1.6, textTransform: "uppercase" },
  title: { fontFamily: SANS_BOLD, fontSize: 18, lineHeight: 1.2, color: C.navy900, marginTop: 4 },
  lead: { fontSize: 9.5, lineHeight: 1.5, color: C.slate600, marginTop: 6 },
  badges: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 5, marginBottom: 4, borderWidth: 1 },
  badgeText: { fontFamily: SANS_BOLD, fontSize: 7, letterSpacing: 0.6, textTransform: "uppercase" },

  /* Key facts */
  facts: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, borderWidth: 1, borderColor: C.slate200, borderRadius: 6 },
  fact: { width: "50%", paddingVertical: 7, paddingHorizontal: 10, borderColor: C.slate200 },
  factLabel: { fontFamily: SANS_BOLD, fontSize: 6.5, color: C.slate500, letterSpacing: 1, textTransform: "uppercase" },
  factValue: { fontFamily: SANS_BOLD, fontSize: 9, color: C.navy900, marginTop: 2 },
  factMono: { fontFamily: MONO, fontSize: 9, color: C.navy900, marginTop: 2 },

  /* Sections */
  section: { marginBottom: 18 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionBar: { width: 3, height: 12, backgroundColor: C.steel500, borderRadius: 2, marginRight: 7 },
  sectionTitle: { fontFamily: SANS_BOLD, fontSize: 10.5, color: C.navy900, letterSpacing: 0.4 },
  sectionCount: { fontSize: 8, color: C.slate400, marginLeft: 6 },
  body: { fontSize: 9.5, lineHeight: 1.6, color: C.slate700 },

  /* Spec table */
  table: { borderWidth: 1, borderColor: C.slate200, borderRadius: 6, overflow: "hidden" },
  thead: { flexDirection: "row", backgroundColor: C.navy900 },
  th: { fontFamily: SANS_BOLD, fontSize: 7, color: C.white, letterSpacing: 1.2, paddingVertical: 6, paddingHorizontal: 10 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.slate100 },
  trAlt: { backgroundColor: C.slate50 },
  tdKey: { width: "38%", fontFamily: SANS_BOLD, fontSize: 8.5, color: C.navy900, paddingVertical: 6, paddingHorizontal: 10 },
  tdVal: { width: "62%", fontSize: 8.5, color: C.slate700, paddingVertical: 6, paddingHorizontal: 10 },
  empty: { borderWidth: 1, borderColor: C.slate200, borderStyle: "dashed", borderRadius: 6, padding: 14 },
  emptyText: { fontSize: 9, color: C.slate500, textAlign: "center" },

  /* Inquiry card */
  cta: { flexDirection: "row", backgroundColor: C.navy950, borderRadius: 8, padding: 16, marginTop: 4 },
  ctaMain: { flex: 1.2, paddingRight: 14 },
  ctaTitle: { fontFamily: SANS_BOLD, fontSize: 12, color: C.white },
  ctaText: { fontSize: 8.5, lineHeight: 1.5, color: C.slate300, marginTop: 4 },
  ctaLink: { fontFamily: SANS_BOLD, fontSize: 8.5, color: C.accent400, marginTop: 8, textDecoration: "none" },
  ctaContact: { flex: 1, borderLeftWidth: 1, borderLeftColor: C.navy800, paddingLeft: 14 },
  ctaLabel: { fontFamily: SANS_BOLD, fontSize: 6.5, color: C.accent400, letterSpacing: 1.2, marginTop: 5 },
  ctaValue: { fontSize: 8.5, color: C.white, marginTop: 1 },

  /* Fixed footer */
  footer: {
    position: "absolute",
    left: PDF_PAGE_MARGIN,
    right: PDF_PAGE_MARGIN,
    bottom: 18,
    height: FOOTER_H - 14,
    borderTopWidth: 1,
    borderTopColor: C.slate200,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footText: { fontSize: 7, color: C.slate500 },
  footStrong: { fontFamily: SANS_BOLD, fontSize: 7, color: C.slate600 },
  // Anchored with `top`: react-pdf positions bottom-anchored render-prop text off the page when page padding is uneven.
  pageNumber: {
    position: "absolute",
    top: A4_HEIGHT - 18 - (FOOTER_H - 14) + 7,
    right: PDF_PAGE_MARGIN,
    width: 120,
    textAlign: "right",
    fontFamily: SANS_BOLD,
    fontSize: 7,
    color: C.slate600,
  },
});

function availabilityTone(a: string) {
  if (a === "IN_STOCK") return { bg: C.emeraldSoft, border: C.emeraldSoft, fg: C.emerald };
  if (a === "LOW_STOCK") return { bg: C.amberSoft, border: C.amberSoft, fg: C.amber };
  return { bg: C.slate100, border: C.slate200, fg: C.slate600 };
}

function Badge({ label, bg, border, fg }: { label: string; bg: string; border: string; fg: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <View style={s.sectionHead}>
      <View style={s.sectionBar} />
      <Text style={s.sectionTitle}>{title}</Text>
      {typeof count === "number" && <Text style={s.sectionCount}>({count})</Text>}
    </View>
  );
}

function Header({ data }: { data: SpecSheetData }) {
  return (
    <View style={s.header} fixed>
      <View style={s.brand}>
        {data.logo && <PDFImage src={data.logo} style={s.logo} />}
        <View>
          <Text style={s.brandName}>CLM ELECTRONICS</Text>
          <Text style={s.brandSub}>ENGINEERING SERVICES</Text>
        </View>
      </View>
      <View style={s.headerRight}>
        <Text style={s.docType}>PRODUCT SPECIFICATION SHEET</Text>
        <Text style={s.docRef}>{data.referenceCode}</Text>
      </View>
      <View style={s.headerAccent} />
    </View>
  );
}

function Footer({ data }: { data: SpecSheetData }) {
  return (
    <View style={s.footer} fixed>
      <View>
        <Text style={s.footStrong}>{data.company.name}</Text>
        <Text style={s.footText}>
          For inquiry purposes only. No pricing information included. Generated {data.generatedAt}.
        </Text>
      </View>
    </View>
  );
}

/** Page counter, positioned on its own so it lines up with the footer's first line. */
function PageNumber() {
  return (
    <Text
      fixed
      style={s.pageNumber}
      render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
    />
  );
}

function Hero({ data }: { data: SpecSheetData }) {
  const tone = availabilityTone(data.availability);
  const facts = [
    { label: "Reference code", value: data.referenceCode, mono: true },
    data.model ? { label: "Model", value: data.model } : null,
    data.partNumber ? { label: "Part number", value: data.partNumber, mono: true } : null,
    data.manufacturer ? { label: "Manufacturer", value: data.manufacturer } : null,
  ].filter((f): f is { label: string; value: string; mono?: boolean } => !!f);

  return (
    <View style={s.hero} wrap={false}>
      <View style={s.imageBox}>
        {data.image ? (
          <PDFImage src={data.image} style={s.productImage} />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={s.imagePlaceholder}>CLM</Text>
            <Text style={s.placeholderRef}>{data.referenceCode}</Text>
          </View>
        )}
      </View>
      <View style={s.heroBody}>
        {data.category && <Text style={s.eyebrow}>{data.category}</Text>}
        <Text style={s.title}>{data.name}</Text>
        {data.shortDescription && <Text style={s.lead}>{data.shortDescription}</Text>}
        <View style={s.badges}>
          <Badge label={formatAvailability(data.availability)} {...tone} />
          {data.condition && (
            <Badge label={formatCondition(data.condition)} bg={C.white} border={C.slate300} fg={C.slate600} />
          )}
        </View>
        <View style={s.facts}>
          {facts.map((f, i) => (
            <View
              key={f.label}
              style={[
                s.fact,
                { borderLeftWidth: i % 2 === 1 ? 1 : 0, borderTopWidth: i >= 2 ? 1 : 0 },
                facts.length % 2 === 1 && i === facts.length - 1 ? { width: "100%" } : {},
              ]}
            >
              <Text style={s.factLabel}>{f.label}</Text>
              <Text style={f.mono ? s.factMono : s.factValue}>{f.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Specifications({ data }: { data: SpecSheetData }) {
  const specs = data.specifications.filter((x) => x.key && x.value);
  return (
    <View style={s.section}>
      <View wrap={false}>
        <SectionHead title="Technical Specifications" count={specs.length || undefined} />
        {specs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Detailed specifications are available on request. Contact CLM with the reference code above.</Text>
          </View>
        ) : (
          <View style={s.thead}>
            <Text style={[s.th, { width: "38%" }]}>SPECIFICATION</Text>
            <Text style={[s.th, { width: "62%" }]}>VALUE</Text>
          </View>
        )}
      </View>
      {specs.length > 0 && (
        <View style={[s.table, { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 }]}>
          {specs.map((spec, i) => (
            <View key={`${spec.key}-${i}`} style={[s.tr, i % 2 === 1 ? s.trAlt : {}, i === 0 ? { borderTopWidth: 0 } : {}]} wrap={false}>
              <Text style={s.tdKey}>{spec.key}</Text>
              <Text style={s.tdVal}>{spec.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Inquiry({ data }: { data: SpecSheetData }) {
  const { company } = data;
  return (
    <View style={s.cta} wrap={false}>
      <View style={s.ctaMain}>
        <Text style={s.ctaTitle}>Interested in this item?</Text>
        <Text style={s.ctaText}>
          Send an inquiry with the reference code {data.referenceCode} for availability, lead time and technical details.
        </Text>
        <Link src={data.productUrl} style={s.ctaLink}>
          {data.productUrl.replace(/^https?:\/\//, "")}
        </Link>
        {data.datasheetUrl && (
          <Link src={data.datasheetUrl} style={[s.ctaLink, { marginTop: 4 }]}>
            Manufacturer datasheet / document
          </Link>
        )}
      </View>
      <View style={s.ctaContact}>
        {company.email && (
          <>
            <Text style={s.ctaLabel}>EMAIL</Text>
            <Text style={s.ctaValue}>{company.email}</Text>
          </>
        )}
        {company.phones.length > 0 && (
          <>
            <Text style={s.ctaLabel}>PHONE</Text>
            <Text style={s.ctaValue}>{company.phones.join("  /  ")}</Text>
          </>
        )}
        {company.address && (
          <>
            <Text style={s.ctaLabel}>ADDRESS</Text>
            <Text style={s.ctaValue}>{company.address}</Text>
          </>
        )}
      </View>
    </View>
  );
}

function SpecSheetDocument({ data }: { data: SpecSheetData }) {
  return (
    <Document
      title={`${data.name} (${data.referenceCode}) - Specification Sheet`}
      author={data.company.name}
      subject="Product specification sheet"
      creator={data.company.name}
      producer={data.company.name}
    >
      <Page size="A4" style={s.page}>
        <Header data={data} />
        <Hero data={data} />

        {data.description && (
          <View style={s.section}>
            <SectionHead title="Description" />
            <Text style={s.body}>{data.description}</Text>
          </View>
        )}

        <Specifications data={data} />
        <Inquiry data={data} />

        <Text style={[s.footText, { marginTop: 10 }]}>Record last updated {data.updatedAt}.</Text>
        <Footer data={data} />
        <PageNumber />
      </Page>
    </Document>
  );
}

/** Renders the spec sheet in the browser (react-pdf’s layout engine can't run on Cloudflare Workers). */
export async function generateSpecSheetPdf(data: SpecSheetData): Promise<Blob> {
  return pdf(<SpecSheetDocument data={data} />).toBlob();
}
