import { getSiteContent } from "@/lib/site-content";
import { InquiryForm } from "@/components/storefront/inquiry-form";
import { Reveal } from "@/components/storefront/reveal";

// Static + ISR: contact copy comes from the cached CMS, no per-request DB hit.
export const revalidate = 3600;

export const metadata = {
  title: "Contact CLM",
  description: "Contact CLM Electronics Engineering Services in Muntinlupa City, Philippines.",
};

export default async function ContactPage() {
  const content = await getSiteContent();
  const company = content.company;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-steel-600">Contact</p>
      <h1 className="mt-2 text-3xl font-bold text-navy-900 sm:text-4xl">{content.contact.heroTitle}</h1>
      </Reveal>
      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <Reveal variant="left" className="space-y-5 lg:col-span-2">
          <div className="rounded-lg bg-navy-950 p-6 text-slate-200">
            <h2 className="font-bold text-white">{company.name}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</dt>
                <dd className="mt-0.5">{company.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</dt>
                <dd className="mt-0.5">{company.phonesDisplay}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${company.email}`} className="underline hover:text-white">
                    {company.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>
        <Reveal variant="right" delay={120} className="lg:col-span-3">
          <InquiryForm />
        </Reveal>
      </div>
    </div>
  );
}
