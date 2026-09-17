import { getSiteContent } from "@/lib/site-content";
import { ProfilePageHero, ProfileSectionHeader } from "@/components/profile/profile-ui";
import { Reveal } from "@/components/storefront/reveal";

// ISR: cached HTML served instantly; admin edits revalidate this path.
export const revalidate = 3600;

export const metadata = {
  title: "Equipment Expertise",
  description:
    "ASM, K&S/KNS, ESEC, dicing/saw, and aluminum wedge bonding equipment CLM has experience servicing, plus spare parts sourcing capability.",
};

export default async function EquipmentPage() {
  const content = await getSiteContent();
  const equipmentGroups = content.equipment.groups;
  const partsSourcing = content.equipment.partsSourcing;

  return (
    <>
      <ProfilePageHero
        eyebrow="Equipment"
        title={content.equipment.heroTitle}
        description={content.equipment.heroDescription}
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-label="Equipment by category">
        <div className="grid gap-6 md:grid-cols-2">
          {equipmentGroups.map((g, i) => (
            <Reveal key={g.id} delay={Math.min(i * 80, 400)} className="h-full">
            <article className="h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-label={`${g.brand} ${g.label}`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel-600">{g.brand}</p>
              <h2 className="mt-1 text-xl font-bold text-navy-900">{g.label}</h2>
              <p className="mt-2 text-sm text-slate-500">{g.description}</p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Models">
                {g.models.map((m) => (
                  <li key={m} className="rounded bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white">
                    {m}
                  </li>
                ))}
              </ul>
            </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-6">
        <p className="rounded-lg border border-steel-500/30 bg-steel-500/5 p-4 text-sm text-slate-600">
          {content.equipment.partsNote}
        </p>
        </Reveal>
      </section>

      <section className="bg-slate-50" aria-label="Parts sourcing">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
          <ProfileSectionHeader
            eyebrow="Parts sourcing"
            title="Spare Parts Sourcing Capability"
            description={content.equipment.partsDescription}
          />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {partsSourcing.map((g, i) => (
              <Reveal key={g.brand} delay={Math.min(i * 80, 320)} className="h-full">
              <article className="h-full rounded-lg border border-slate-200 bg-white p-6" aria-label={`${g.brand} parts`}>
                <h3 className="font-bold text-navy-900">{g.brand}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {g.models.map((m) => (
                    <li key={m} className="border-b border-slate-100 pb-1.5 last:border-0">
                      {m}
                    </li>
                  ))}
                </ul>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
