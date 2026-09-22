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
            className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon className="h-7 w-7" />
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
