import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import { SpecSheetData, BRAND_COLORS, PDF_PAGE_MARGIN, PDF_CONTENT_WIDTH } from "./types";
import { formatDate, formatAvailability, formatCondition, SPEC_TABLE_COL_WIDTHS, INFO_TABLE_COL_WIDTHS } from "./utils";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@react-pdf/renderer@4/fonts/Helvetica/Helvetica-Regular.ttf" },
    { src: "https://cdn.jsdelivr.net/npm/@react-pdf/renderer@4/fonts/Helvetica/Helvetica-Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@react-pdf/renderer@4/fonts/Helvetica/Helvetica-Oblique.ttf", fontStyle: "italic" },
    { src: "https://cdn.jsdelivr.net/npm/@react-pdf/renderer@4/fonts/Helvetica/Helvetica-BoldOblique.ttf", fontWeight: "bold", fontStyle: "italic" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: PDF_PAGE_MARGIN,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.5,
    color: BRAND_COLORS.slate900,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLORS.navy,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: BRAND_COLORS.navy,
    letterSpacing: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    textAlign: "right",
  },
  docTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: BRAND_COLORS.navy,
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 9,
    color: BRAND_COLORS.steelLight,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: BRAND_COLORS.navy,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.slate200,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    width: INFO_TABLE_COL_WIDTHS.label,
    fontWeight: "bold",
    color: BRAND_COLORS.steel,
    fontSize: 9,
  },
  infoValue: {
    width: INFO_TABLE_COL_WIDTHS.value,
    color: BRAND_COLORS.slate900,
    fontSize: 9,
  },
  specTable: {
    width: "100%",
  },
  specRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND_COLORS.slate200,
  },
  specRowEven: {
    backgroundColor: BRAND_COLORS.slate50,
  },
  specKey: {
    width: SPEC_TABLE_COL_WIDTHS.key,
    padding: 6,
    fontWeight: "bold",
    color: BRAND_COLORS.navy,
    fontSize: 8.5,
  },
  specValue: {
    width: SPEC_TABLE_COL_WIDTHS.value,
    padding: 6,
    color: BRAND_COLORS.slate700,
    fontSize: 8.5,
  },
  descriptionBox: {
    backgroundColor: BRAND_COLORS.slate50,
    borderWidth: 1,
    borderColor: BRAND_COLORS.slate200,
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: BRAND_COLORS.slate700,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    maxWidth: "100%",
    maxHeight: 200,
    objectFit: "contain",
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  badgeInStock: {
    backgroundColor: BRAND_COLORS.emerald,
    color: BRAND_COLORS.white,
  },
  badgeLowStock: {
    backgroundColor: BRAND_COLORS.amber,
    color: BRAND_COLORS.white,
  },
  badgeDefault: {
    backgroundColor: BRAND_COLORS.slate200,
    color: BRAND_COLORS.slate700,
  },
  badgeCondition: {
    backgroundColor: BRAND_COLORS.slate100,
    borderWidth: 1,
    borderColor: BRAND_COLORS.slate200,
    color: BRAND_COLORS.steel,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.slate200,
    textAlign: "center",
    fontSize: 7.5,
    color: BRAND_COLORS.steelLight,
  },
  footerLink: {
    color: BRAND_COLORS.navy,
    textDecoration: "underline",
  },
  confidential: {
    marginTop: 8,
    fontWeight: "bold",
    color: BRAND_COLORS.steel,
    fontSize: 8,
  },
  noSpecs: {
    textAlign: "center",
    color: BRAND_COLORS.steelLight,
    fontStyle: "italic",
    padding: 20,
  },
});

function Badge({ children, variant = "default" }: { children: string; variant?: "instock" | "lowstock" | "default" | "condition" }) {
  const variantStyles = {
    instock: styles.badgeInStock,
    lowstock: styles.badgeLowStock,
    default: styles.badgeDefault,
    condition: styles.badgeCondition,
  };
  return <View style={[styles.badge, variantStyles[variant]]}>{children}</View>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SpecRow({ specKey, specValue, index }: { specKey: string; specValue: string; index: number }) {
  return (
    <View style={[styles.specRow, index % 2 === 0 ? styles.specRowEven : undefined]}>
      <Text style={styles.specKey}>{specKey}</Text>
      <Text style={styles.specValue}>{specValue}</Text>
    </View>
  );
}

function ProductIdentity({ data }: { data: SpecSheetData }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Product Identity</Text>
      <InfoRow label="Product Name" value={data.name} />
      <InfoRow label="Reference Code" value={data.referenceCode} />
      {data.model && <InfoRow label="Model" value={data.model} />}
      {data.partNumber && <InfoRow label="Part Number" value={data.partNumber} />}
      {data.manufacturer && <InfoRow label="Manufacturer" value={data.manufacturer} />}
      {data.category && <InfoRow label="Category" value={data.category} />}
    </View>
  );
}

function Classification({ data }: { data: SpecSheetData }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Classification & Status</Text>
      <View style={styles.badgeContainer}>
        <Badge variant={data.availability === "IN_STOCK" ? "instock" : data.availability === "LOW_STOCK" ? "lowstock" : "default"}>
          {formatAvailability(data.availability)}
        </Badge>
        {data.condition && (
          <Badge variant="condition">{formatCondition(data.condition)}</Badge>
        )}
      </View>
    </View>
  );
}

function Descriptions({ data }: { data: SpecSheetData }) {
  if (!data.shortDescription && !data.description) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Descriptions</Text>
      {data.shortDescription && (
        <View style={styles.descriptionBox}>
          <Text style={[styles.descriptionText, { fontWeight: "bold" }]}>{data.shortDescription}</Text>
        </View>
      )}
      {data.description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{data.description}</Text>
        </View>
      )}
    </View>
  );
}

function SpecificationsTable({ data }: { data: SpecSheetData }) {
  if (!data.specifications || data.specifications.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        <Text style={styles.noSpecs}>No specifications available for this product.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Specifications</Text>
      <View style={styles.specTable}>
        {data.specifications.map((spec, index) => (
          <SpecRow key={spec.key} specKey={spec.key} specValue={spec.value} index={index} />
        ))}
      </View>
    </View>
  );
}

function Footer({ data }: { data: SpecSheetData }) {
  return (
    <View style={styles.footer}>
      <Text>CLM Electronics Engineering Services</Text>
      <Text>
        <Text style={styles.footerLink}>{data.siteUrl}</Text>
      </Text>
      <Text>Generated on {data.generatedAt}</Text>
      <Text style={styles.confidential}>
        CONFIDENTIAL — For Inquiry Purposes Only. No pricing information included.
      </Text>
    </View>
  );
}

function SpecSheetDocument({ data }: { data: SpecSheetData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>CLM</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>Product Specification Sheet</Text>
            <Text style={styles.docSubtitle}>
              {data.referenceCode} • Generated {data.generatedAt}
            </Text>
          </View>
        </View>

        {data.primaryImage && (
          <View style={styles.imageContainer}>
            <PDFImage
              src={data.primaryImage.url}
              style={styles.productImage}
              cache={false}
            />
          </View>
        )}

        <ProductIdentity data={data} />
        <Classification data={data} />
        <Descriptions data={data} />
        <SpecificationsTable data={data} />

        <Footer data={data} />
      </Page>
    </Document>
  );
}

export async function generateSpecSheetPdf(data: SpecSheetData): Promise<Uint8Array> {
  const blob = await pdf(<SpecSheetDocument data={data} />).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}