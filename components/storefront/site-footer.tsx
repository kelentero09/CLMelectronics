import Image from "next/image";
import Link from "next/link";
import { getSiteContent } from "@/lib/site-content";

// Server component reading the hour-cached CMS map — no per-request DB cost.
export async function SiteFooter() {
  const content = await getSiteContent();
  const company = content.company;

  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo3.jpg"
              alt="CLM Electronics logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded bg-white object-contain"
            />
            <p className="text-base font-bold text-white">{company.name}</p>
          </div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            {company.footerAbout}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>{company.address}</li>
            <li>{company.phonesDisplay}</li>
            <li>
              <a href={`mailto:${company.email}`} className="underline hover:text-white">
                {company.email}
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Catalog</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white hover:underline">Home</Link></li>
            <li><Link href="/about" className="hover:text-white hover:underline">About CLM</Link></li>
            <li><Link href="/services" className="hover:text-white hover:underline">Services</Link></li>
            <li><Link href="/equipment" className="hover:text-white hover:underline">Equipment Expertise</Link></li>
            <li><Link href="/board-repair" className="hover:text-white hover:underline">Board Repair</Link></li>
            <li><Link href="/products" className="hover:text-white hover:underline">All Products</Link></li>
            <li><Link href="/categories" className="hover:text-white hover:underline">Categories</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline">Contact</Link></li>
            <li><Link href="/admin" className="hover:text-white hover:underline">Admin</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 sm:px-6">
          © 2026 {company.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
