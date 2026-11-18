import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import { getSiteContent } from "@/lib/site-content";

const companyLinks = [
  { label: "About CLM", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Equipment Expertise", href: "/equipment" },
  { label: "Board Repair", href: "/board-repair" },
  { label: "Contact", href: "/contact" },
];

const catalogLinks = [
  { label: "All Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Brands", href: "/brands" },
  { label: "Spare Parts", href: "/categories/spare-parts" },
  { label: "Equipment", href: "/categories/equipment" },
  { label: "Compare Products", href: "/compare" },
];

// Server component reading the hour-cached CMS map — no per-request DB cost.
export async function SiteFooter() {
  const content = await getSiteContent();
  const company = content.company;
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-navy-950 text-slate-400">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/40 to-transparent" />
      <div aria-hidden className="absolute -top-32 left-1/2 -z-10 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-steel-500/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="CLM home">
            <Image src="/logo3.jpg" alt="" width={44} height={44} className="h-11 w-11 rounded-lg bg-white object-contain" />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-white">CLM ELECTRONICS</span>
              <span className="block text-[11px] font-medium tracking-[0.18em] text-slate-400">ENGINEERING SERVICES</span>
            </span>
          </Link>
          {company.footerAbout && <p className="mt-5 max-w-sm text-sm leading-relaxed">{company.footerAbout}</p>}
        </div>

        <FooterLinks title="Company" links={companyLinks} />
        <FooterLinks title="Catalog" links={catalogLinks} />

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Get in touch</h2>
          <ul className="mt-5 space-y-4 text-sm">
            {company.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden />
                <span className="leading-relaxed">{company.address}</span>
              </li>
            )}
            {company.phones.length > 0 && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden />
                <span className="flex flex-col gap-1">
                  {company.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="w-fit transition-colors hover:text-white">
                      {p}
                    </a>
                  ))}
                </span>
              </li>
            )}
            {company.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden />
                <a href={`mailto:${company.email}`} className="break-all transition-colors hover:text-white">
                  {company.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:px-6">
          <p>
            © {year} {company.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/admin" className="transition-colors hover:text-white">
              Admin sign in
            </Link>
            <a href="#main-content" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              Back to top <ArrowUp className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-block transition-[color,transform] duration-150 hover:translate-x-0.5 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
