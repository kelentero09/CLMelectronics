import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Self-hosted at build time: no external font request, no layout shift.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

// Icons and the Open Graph image come from the file conventions:
// app/icon.png, app/apple-icon.png, app/opengraph-image.jpg
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "CLM Electronics Engineering Services | Semiconductor & Manufacturing Solutions",
    template: "%s | CLM Electronics Engineering Services",
  },
  description:
    "CLM Electronics Engineering Services provides technical support, equipment services, maintenance, repair, spare parts sourcing, and engineering solutions for semiconductor and manufacturing industries.",
  openGraph: {
    title: "CLM Electronics Engineering Services | Semiconductor & Manufacturing Solutions",
    description:
      "Technical support, equipment services, maintenance, repair, spare parts sourcing, and engineering solutions for semiconductor and manufacturing industries.",
    type: "website",
    siteName: "CLM Electronics Engineering Services",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a1628",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
