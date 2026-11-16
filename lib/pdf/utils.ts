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

export function formatPdfDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
