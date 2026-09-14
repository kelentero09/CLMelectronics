import type { Metadata } from "next";
import { company } from "../../data/company";
import { PageHero } from "../../components/ui/primitives";

export const metadata: Metadata = {
  title: "Contact | CLM Electronics Engineering Services",
  description:
    "Contact details for CLM Electronics Engineering Services in Muntinlupa City, Philippines.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Contact CLM"
        description="CLM Electronics Engineering Services — Muntinlupa City, Philippines."
      />
      <section
        className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3"
        aria-label="Contact details"
      >
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-engineering-600">Address</h2>
          <p className="mt-2 font-semibold leading-relaxed text-navy-900">{company.address}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-engineering-600">Phone</h2>
          <p className="mt-2 font-semibold text-navy-900">{company.phones.join(" / ")}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-engineering-600">Email</h2>
          <p className="mt-2 font-semibold text-navy-900">
            <a href={`mailto:${company.email}`} className="hover:underline">
              {company.email}
            </a>
          </p>
        </article>
      </section>
    </>
  );
}
