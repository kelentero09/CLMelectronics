import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://clm-electronics.example.com";
  const pages = ["", "/about", "/services", "/equipment", "/board-repair", "/contact"];
  return pages.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date("2026-09-14"),
  }));
}
