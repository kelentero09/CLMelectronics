import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { PageTransition } from "@/components/storefront/page-transition";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
    </>
  );
}
