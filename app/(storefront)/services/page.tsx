import Link from "next/link";
import { serviceCategories, wedgeBrands } from "@/data/services";
import { ProfilePageHero } from "@/components/profile/profile-ui";

export const metadata = {
  title: "Services",
  description:
    "Repair, preventive and predictive maintenance, machine rebuild, baselining, calibration, training, spare parts sourcing, board repair, and wedge bonding consumables.",
};

export default function ServicesPage() {
  return (
    <>
      <ProfilePageHero
        eyebrow="Services"
        title="Engineering Services & Technical Capabilities"
        description="Organized service capabilities for semiconductor and manufacturing equipment — focused on reliability, maintainability, and responsive support."
      />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6">
        {serviceCategories.map((cat, i) => (
          <section
            key={cat.id}
            id={cat.id}
            aria-label={cat.title}
            className={`rounded-lg border p-6 sm:p-8 ${i % 2 === 0 ? "border-slate-200 bg-white" : "border-navy-900/10 bg-slate-50"}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-10">
              <div className="lg:w-1/3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel-600">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-1 text-xl font-bold text-navy-900">{cat.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{cat.summary}</p>
                {cat.id === "wedge-bonding" && (
                  <p className="mt-3 text-xs text-slate-500">
                    Referenced brands: {wedgeBrands.join(" · ")}. Shown as serviced equipment, not
                    an authorized distributorship.
                  </p>
                )}
                {cat.id === "board-repair" && (
                  <Link href="/board-repair" className="mt-3 inline-block text-sm font-semibold text-steel-600 hover:underline">
                    View Board Repair Capability →
                  </Link>
                )}
              </div>
              <ul className="grid flex-1 gap-2 sm:grid-cols-2" aria-label={`${cat.title} items`}>
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 rounded border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                  >
                    <span aria-hidden="true" className="mt-0.5 font-bold text-steel-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
