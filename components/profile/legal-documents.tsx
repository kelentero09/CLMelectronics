"use client";

import { useCallback, useEffect, useState } from "react";
import { legalDocuments } from "@/data/legal";
import { ProfileSectionHeader } from "@/components/profile/profile-ui";

export default function LegalDocuments({ description }: { description?: string }) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((cur) =>
        cur === null ? cur : (cur + dir + legalDocuments.length) % legalDocuments.length
      ),
    []
  );

  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  return (
    <section aria-label="Business registration and permits" id="legal-documents">
      <ProfileSectionHeader
        eyebrow="Legitimacy"
        title="Business Registration & Permits"
        description={
          description ??
          "CLM Electronics Engineering Services operates as a registered business in the Philippines. Selected registration documents are shown below for customer and partner reference — select any document to view it in full."
        }
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {legalDocuments.map((doc, i) => (
          <article
            key={doc.id}
            className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View full image of ${doc.title}`}
              className="group relative block aspect-[3/4] w-full bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encodeURI(doc.image)}
                alt={doc.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain p-2 transition-transform group-hover:scale-[1.02]"
              />
              <span className="absolute bottom-2 right-2 rounded bg-navy-950/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                View full ⤢
              </span>
            </button>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-steel-600">
                {doc.issuer}
              </p>
              <h3 className="mt-1 text-sm font-bold text-navy-900">{doc.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{doc.detail}</p>
            </div>
          </article>
        ))}
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${legalDocuments[active].title} — full view (${active + 1} of ${legalDocuments.length})`}
          className="fixed inset-0 z-[80] flex flex-col bg-navy-950/95 p-4"
          onClick={close}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 py-2">
            <p className="text-sm font-semibold text-white">
              {legalDocuments[active].title}
              <span className="ml-2 font-normal text-slate-400">
                {active + 1} / {legalDocuments.length}
              </span>
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close document viewer"
              className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-navy-950 hover:bg-slate-200"
            >
              Close ✕
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous document"
              className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-lg font-bold text-white hover:bg-white/25"
            >
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={encodeURI(legalDocuments[active].image)}
              alt={legalDocuments[active].alt}
              className="max-h-[78vh] max-w-full rounded bg-white object-contain p-1"
            />
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next document"
              className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-lg font-bold text-white hover:bg-white/25"
            >
              ›
            </button>
          </div>
          <p className="mx-auto max-w-5xl py-2 text-center text-xs text-slate-400">
            {legalDocuments[active].issuer} · {legalDocuments[active].detail} · Use ← → keys to
            browse, Esc to close
          </p>
        </div>
      )}
    </section>
  );
}
