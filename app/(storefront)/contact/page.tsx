import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import { InquiryForm } from "@/components/storefront/inquiry-form";
import { PageHero } from "@/components/storefront/blocks";
import { Reveal } from "@/components/storefront/reveal";

// Static + ISR: contact copy comes from the cached CMS, no per-request DB hit.
export const revalidate = 3600;

export const metadata = {
  title: "Contact CLM",
  description: "Contact CLM Electronics Engineering Services in Muntinlupa City, Philippines.",
  alternates: { canonical: "/contact" },
};

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default async function ContactPage() {
  const content = await getSiteContent();
  const company = content.company;

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={content.contact.heroTitle}
        description="Send an inquiry about a product, service, or equipment issue. Share as much detail as you can: model, part number, symptoms, and timeline."
        crumbs={[{ label: "Contact" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          <Reveal variant="left" className="space-y-4 lg:col-span-2">
            <h2 className="text-xl font-bold text-navy-900">{company.name}</h2>
            <ContactItem icon={MapPin} label="Address">
              {company.address}
            </ContactItem>
            {company.phones.length > 0 && (
              <ContactItem icon={Phone} label="Phone">
                <span className="flex flex-col">
                  {company.phones.map((p) => (
                    <a key={p} href={telHref(p)} className="w-fit font-semibold text-navy-900 underline-offset-4 hover:text-steel-600 hover:underline">
                      {p}
                    </a>
                  ))}
                </span>
              </ContactItem>
            )}
            {company.email && (
              <ContactItem icon={Mail} label="Email">
                <a href={`mailto:${company.email}`} className="break-all font-semibold text-navy-900 underline-offset-4 hover:text-steel-600 hover:underline">
                  {company.email}
                </a>
              </ContactItem>
            )}
            <ContactItem icon={Clock} label="Response">
              We reply to inquiries as soon as possible during business days.
            </ContactItem>
          </Reveal>
          <Reveal variant="right" delay={100} className="lg:col-span-3">
            <InquiryForm />
          </Reveal>
        </div>
      </div>
    </>
  );
}

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-accent-400">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-slate-600">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
