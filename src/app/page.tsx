import Link from "next/link";
import { company } from "../data/company";
import { serviceCategories } from "../data/services";
import { equipmentGroups } from "../data/equipment";
import { SectionHeader, Card } from "../components/ui/primitives";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-navy-950 tech-grid-bg" aria-label="Introduction">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-block rounded border border-accent-500/40 bg-accent-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent-400">
              {company.name}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Engineering Support for Semiconductor &amp; Manufacturing Equipment
            </h1>
            <p className="mt-4 max-w-xl leading-relaxed text-slate-300">{company.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="rounded bg-accent-500 px-6 py-3 text-sm font-semibold text-navy-950 hover:bg-accent-400"
              >
                View Our Services
              </Link>
            </div>
            <dl className="mt-8 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              {[
                ["Established", company.established],
                ["Industry", "Semiconductor & Manufacturing"],
                ["Base", "Muntinlupa City, PH"],
              ].map(([k, v]) => (
                <div key={k} className="rounded border border-white/10 bg-white/5 px-4 py-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="mt-1 font-semibold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div aria-hidden="true" className="hidden lg:block">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-navy-800 to-steel-900 p-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Repair", "Minor & major equipment repair"],
                  ["Maintenance", "13 / 26 / 52-week PM"],
                  ["Rebuild", "Overhaul & rehabilitation"],
                  ["Boards", "Documented board repair"],
                  ["Parts", "Sourcing & installation"],
                  ["Training", "Levels 1 · 2 · 3 · 5"],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-lg bg-navy-950/70 p-4 tech-grid-bg">
                    <p className="text-sm font-bold text-accent-400">{t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{d}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Technical · Reliable · Responsive
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-label="Core capabilities">
        <SectionHeader
          eyebrow="What we do"
          title="Technical Support + Repair + Maintenance + Rehabilitation + Parts + Board Repair + Training"
          description="A single point of contact for keeping critical semiconductor and manufacturing equipment reliable and operational."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCategories.slice(0, 6).map((s) => (
            <Card key={s.id} title={s.title}>
              <p>{s.summary}</p>
              <Link href="/services" className="mt-3 inline-block font-semibold text-engineering-600 hover:underline">
                Learn more →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* EQUIPMENT */}
      <section className="bg-slate-50 tech-grid-light" aria-label="Equipment expertise">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeader
            eyebrow="Equipment expertise"
            title="Equipment CLM Has Experience Servicing"
            description="Machine models are shown as equipment and brands CLM has experience servicing — not as official manufacturer affiliations."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {equipmentGroups.map((g) => (
              <article key={g.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-engineering-600">{g.brand}</p>
                <h3 className="mt-1 font-bold text-navy-900">{g.label}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {g.models.map((m) => (
                    <span key={m} className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <Link href="/equipment" className="mt-6 inline-block font-semibold text-engineering-600 hover:underline">
            View full equipment list →
          </Link>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-label="Why choose CLM">
        <SectionHeader eyebrow="Why CLM" title="A Practical, Service-Focused Engineering Partner" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Technical Expertise", "Experience supporting semiconductor and manufacturing equipment across wire bond, die attach, molding, and dicing processes."],
            ["Comprehensive Support", "Repair, maintenance, calibration, training, parts sourcing, and technical support from one provider."],
            ["Reliable Service", "Stated commitment to quality, timely service, and responsive after-sales support."],
            ["Customer-Focused Solutions", "Services and parts sourcing structured around customer requirements and equipment needs."],
          ].map(([t, d]) => (
            <Card key={t} title={t}>
              <p>{d}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
