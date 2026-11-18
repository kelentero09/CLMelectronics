import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { PageTransition } from "@/components/storefront/page-transition";
import { getSiteContent } from "@/lib/site-content";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  // Hour-cached CMS read (same one the footer uses): brands shown AND marked authorized.
  const content = await getSiteContent();
  const authorizedBrands = content.brands.partners.filter((b) => b.authorized).map((b) => b.name);

  return (
    <>
      <SiteHeader authorizedBrands={authorizedBrands} />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
    </>
  );
}
