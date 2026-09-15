import Link from "next/link";

const links = [
  { label: "Products", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Equipment", href: "/equipment" },
  { label: "Board Repair", href: "/board-repair" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="CLM catalog home">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded bg-steel-500 text-sm font-bold text-white"
          >
            CLM
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-white sm:text-base">
              CLM ELECTRONICS
            </span>
            <span className="block text-[11px] font-medium tracking-[0.18em] text-slate-300">
              ENGINEERING SERVICES
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-2 rounded bg-steel-500 px-4 py-2 text-sm font-semibold text-white hover:bg-steel-600"
          >
            Contact CLM
          </Link>
        </nav>
        <nav aria-label="Mobile" className="flex items-center gap-1 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded px-2 py-2 text-xs font-medium text-slate-300 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
