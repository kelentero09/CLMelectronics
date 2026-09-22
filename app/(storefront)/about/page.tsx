import { getSiteContent } from "@/lib/site-content";
import { ProfilePageHero, ProfileSectionHeader, ProfileCard } from "@/components/profile/profile-ui";
import { Reveal } from "@/components/storefront/reveal";
import LegalDocuments from "@/components/profile/legal-documents";

// ISR: cached HTML served instantly; admin edits revalidate this path.
export const revalidate = 3600;

export const metadata = {
  title: "About CLM",
  description:
    "CLM Electronics Engineering Services — established January 10, 2023 in Muntinlupa City, Philippines. Services and solutions for semiconductor and manufacturing industries.",
};

export default async function AboutPage() {
  const content = await getSiteContent();
  const company = content.company;

  return (
    <>
      <ProfilePageHero
        eyebrow="About CLM"
        title={content.about.heroTitle}
        description={content.about.heroDescription}
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-label="Company overview">
        <Reveal>
        <ProfileSectionHeader eyebrow="Company overview" title="Who We Are" />
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
          {company.aboutIntro}
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
          <LegalDocuments description={content.about.legalDescription} />
          </Reveal>
        </div>
      </div>
    </>
  );
}
