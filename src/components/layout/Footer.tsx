import Link from "next/link";
import { company, navLinks } from "../../data/company";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-base font-bold text-white">{company.name}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            Technical services and solutions for semiconductor and manufacturing industries.
          </p>
          <p className="mt-4 text-sm">
            <span className="font-semibold text-white">Address:</span>
            <br />
            {company.address}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <span className="font-semibold text-white">Phone: </span>
              {company.phones.join(" / ")}
            </li>
            <li>
              <span className="font-semibold text-white">Email: </span>
              <a href={`mailto:${company.email}`} className="underline hover:text-white">
                {company.email}
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Navigate</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 CLM Electronics Engineering Services. All rights reserved.</p>
          <p>Semiconductor &amp; manufacturing equipment services · Muntinlupa City, Philippines</p>
        </div>
      </div>
    </footer>
  );
}
