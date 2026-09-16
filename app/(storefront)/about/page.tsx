import { company } from "@/data/company";
import { ProfilePageHero, ProfileSectionHeader, ProfileCard } from "@/components/profile/profile-ui";
import { Reveal } from "@/components/storefront/reveal";
import LegalDocuments from "@/components/profile/legal-documents";

export const metadata = {
  title: "About CLM",
  description:
    "CLM Electronics Engineering Services — established January 10, 2023 in Muntinlupa City, Philippines. Services and solutions for semiconductor and manufacturing industries. View DTI, BIR, and business permit registration documents.",
};

export default function AboutPage() {
  return (
    <>
      <ProfilePageHero
        eyebrow="About CLM"
        title="Company Profile"
        description="A service-focused engineering provider for semiconductor and manufacturing equipment."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-label="Company overview">
        <Reveal>
        <ProfileSectionHeader eyebrow="Company overview" title="Who We Are" />
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
          CLM Electronics Engineering Services was established on January 10, 2023 to provide
          services and solutions for the semiconductor and manufacturing industries. We aim to
          build long-term, trusted business relationships with customers through immediate,
          quality, and reliable service.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">{company.afterSales}</p>
        <dl className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 sm:grid-cols-3">
          {[
            ["Established", company.established],
            ["Industry", company.industry],
            ["Location", "Muntinlupa City, Philippines"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{k}</dt>
              <dd className="mt-1 font-semibold text-navy-900">{v}</dd>
            </div>
          ))}
        </dl>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Mission and vision">
          <Reveal className="h-full">
          <ProfileCard title="Our Mission">
            <p>{company.mission}</p>
          </ProfileCard>
          </Reveal>
          <Reveal delay={120} className="h-full">
          <ProfileCard title="Our Vision">
            <p>{company.vision}</p>
          </ProfileCard>
          </Reveal>
        </div>
      </section>
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
          <LegalDocuments />
          </Reveal>
        </div>
      </div>
    </>
  );
}
