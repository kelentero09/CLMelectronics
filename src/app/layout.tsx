import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export const metadata: Metadata = {
  title: "CLM Electronics Engineering Services | Semiconductor & Manufacturing Equipment Support",
  description:
    "CLM Electronics Engineering Services provides technical support, equipment repair, preventive and predictive maintenance, machine rehabilitation, parts sourcing, board repair, and engineering services for semiconductor and manufacturing industries.",
  keywords: [
    "electronics engineering services",
    "semiconductor equipment services",
    "manufacturing equipment repair",
    "machine preventive maintenance",
    "predictive maintenance",
    "equipment rehabilitation",
    "machine repair",
    "board repair",
    "spare parts sourcing",
    "technical support",
    "Muntinlupa engineering services",
    "Philippines semiconductor equipment services",
  ],
  openGraph: {
    title: "CLM Electronics Engineering Services",
    description:
      "Technical support, maintenance, repair, rehabilitation, parts sourcing, and equipment solutions for semiconductor and manufacturing industries.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
