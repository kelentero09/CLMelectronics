import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.webp"
              alt="CLM Electronics logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded bg-white object-contain"
            />
            <p className="text-base font-bold text-white">CLM Electronics Engineering Services</p>
          </div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            B2B product catalog for semiconductor and manufacturing equipment, spare parts,
            consumables, and materials. Information and inquiry only.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>#9 Bayabas St., Mutual Homes Putatan, Muntinlupa City, Philippines</li>
            <li>09979269559 / 88384882</li>
            <li>
              <a href="mailto:er.canlas23@gmail.com" className="underline hover:text-white">
                er.canlas23@gmail.com
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Catalog</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white hover:underline">All Products</Link></li>
            <li><Link href="/categories" className="hover:text-white hover:underline">Categories</Link></li>
            <li><Link href="/about" className="hover:text-white hover:underline">About CLM</Link></li>
            <li><Link href="/equipment" className="hover:text-white hover:underline">Equipment Expertise</Link></li>
            <li><Link href="/board-repair" className="hover:text-white hover:underline">Board Repair</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline">Contact</Link></li>
            <li><Link href="/admin" className="hover:text-white hover:underline">Admin</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 sm:px-6">
          © 2026 CLM Electronics Engineering Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
