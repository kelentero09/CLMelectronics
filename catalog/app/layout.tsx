import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "CLM Electronics Engineering Services | Product Catalog",
    template: "%s | CLM Electronics Engineering Services",
  },
  description:
    "B2B product catalog for semiconductor and manufacturing equipment, spare parts, consumables, ESD materials, and office supplies. Information and inquiry only — contact CLM Electronics Engineering Services, Muntinlupa City, Philippines.",
  openGraph: {
    title: "CLM Electronics Engineering Services | Product Catalog",
    description:
      "Equipment, spare parts, consumables, and materials for semiconductor and manufacturing industries.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
