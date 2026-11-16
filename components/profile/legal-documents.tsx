"use client";

import { legalDocuments } from "@/data/legal";
import { ProfileSectionHeader } from "@/components/profile/profile-ui";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function LegalDocuments({ description }: { description?: string }) {
  return (
    <section aria-label="Business registration and permits" id="legal-documents">
      <ProfileSectionHeader
        eyebrow="Legitimacy"
        title="Business Registration & Permits"
        description={
          description ??
          "CLM Electronics Engineering Services is a DTI and BIR registered business in the Philippines with a valid local business permit."
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {legalDocuments.map((doc) => (
          <article
            key={doc.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400">{doc.abbr}</p>
              <h3 className="mt-1 text-sm font-bold text-navy-900">{doc.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{doc.issuer}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
