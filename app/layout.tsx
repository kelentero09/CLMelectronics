import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
    images: ["/logo3.jpg"],
  },
  icons: {
    icon: "/logo3.jpg",
    apple: "/logo3.jpg",
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
