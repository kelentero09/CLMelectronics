"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { boardRepairRecords } from "../../data/board-repair";

function PhotoCell({ board, image }: { board: string; image: string | null }) {
  const [enlarged, setEnlarged] = useState(false);
  if (!image) {
    return (
      <span className="inline-block rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Photo coming soon
      </span>
    );
  }
  const src = encodeURI(image);
  return (
    <>
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        className="block overflow-hidden rounded border border-slate-200"
        aria-label={`Enlarge photo of ${board}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${board} board`} loading="lazy" className="h-14 w-20 object-contain bg-white" />
      </button>
      {enlarged && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${board} photo`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEnlarged(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`${board} board — enlarged`} className="max-h-[85vh] max-w-full rounded bg-white object-contain p-2" />
          <button type="button" className="absolute right-4 top-4 rounded bg-white px-3 py-1.5 text-sm font-semibold" onClick={() => setEnlarged(false)} aria-label="Close photo">
            Close ✕
          </button>
        </div>
      )}
    </>
  );
}

export default function BoardRepairClient() {
  const [station, setStation] = useState("All");
  const [model, setModel] = useState("All");
  const [query, setQuery] = useState("");

  const stations = useMemo(() => ["All", ...Array.from(new Set(boardRepairRecords.map((r) => r.station)))], []);
  const models = useMemo(() => ["All", ...Array.from(new Set(boardRepairRecords.map((r) => r.model)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boardRepairRecords.filter((r) => {
      if (station !== "All" && r.station !== station) return false;
      if (model !== "All" && r.model !== model) return false;
      if (q && !`${r.boardDescription} ${r.model} ${r.problem} ${r.station}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [station, model, query]);

  const total = boardRepairRecords.length;
  const highest = Math.max(...boardRepairRecords.map((r) => r.repairRate));
  const processes = new Set(boardRepairRecords.map((r) => r.station)).size;

  return (
    <>
      {/* Summary */}
      <section aria-label="Documented repair capability" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [String(total), "Documented Repair Cases"],
            [`${highest}%`, "Highest Listed Repair Rate"],
            [String(processes), "Documented Processes"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-3xl font-bold text-navy-900">{v}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Figures above are calculated dynamically from the documented records below — not overall
          company statistics. Repair rates shown are based on CLM&apos;s supplied service records and
          may vary depending on board condition and failure type.
        </p>
      </section>

      {/* Filters */}
      <section aria-label="Filters" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
          <div>
            <label htmlFor="station-filter" className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy-900">
              Station / Process
            </label>
            <select id="station-filter" value={station} onChange={(e) => setStation(e.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm">
              {stations.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All" : s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="model-filter" className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy-900">
              Equipment / Model Type
            </label>
            <select id="model-filter" value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm">
              {models.map((m) => (
                <option key={m} value={m}>{m === "All" ? "All" : m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="board-search" className="mb-1 block text-xs font-bold uppercase tracking-wider text-navy-900">
              Search
            </label>
            <input
              id="board-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search board, model, or problem…"
              className="w-full rounded border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <p role="status" className="mt-3 text-sm text-slate-600">
          Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> documented records.
        </p>
      </section>

      {/* Desktop table */}
      <section aria-label="Board repair records" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
          <table className="w-full min-w-[820px] border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-navy-950 text-left text-xs uppercase tracking-wider text-white">
                <th scope="col" className="px-4 py-3">Station</th>
                <th scope="col" className="px-4 py-3">Equipment</th>
                <th scope="col" className="px-4 py-3">Board</th>
                <th scope="col" className="px-4 py-3">Problem</th>
                <th scope="col" className="px-4 py-3 text-right">Repair Rate</th>
                <th scope="col" className="px-4 py-3">Photo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 align-top hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy-900">{r.station}</td>
                  <td className="whitespace-nowrap px-4 py-3">{r.model}</td>
                  <td className="max-w-[260px] px-4 py-3 font-medium">{r.boardDescription}</td>
                  <td className="max-w-[260px] px-4 py-3 text-slate-600">{r.problem}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-base font-bold text-navy-900">{r.repairRate}%</td>
                  <td className="px-4 py-3"><PhotoCell board={r.boardDescription} image={r.image} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-4 md:hidden">
          {filtered.map((r) => (
            <article key={r.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label={r.boardDescription}>
              <h2 className="font-bold text-navy-900">{r.boardDescription}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {r.model} · {r.station}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="font-semibold text-navy-900">Problem</dt>
                  <dd className="text-slate-600">{r.problem}</dd>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Repair Rate</dt>
                  <dd className="text-lg font-bold text-navy-900">{r.repairRate}%</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy-900">Photo</dt>
                  <dd className="mt-1"><PhotoCell board={r.boardDescription} image={r.image} /></dd>
                </div>
              </dl>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No records match the current filters.
            </p>
          )}
        </div>
      </section>
      <p className="mx-auto max-w-7xl px-4 pb-10 text-sm text-slate-500 sm:px-6">
        For repair requirements, refer to the contact details on the{" "}
        <Link href="/contact" className="font-semibold text-engineering-600 hover:underline">
          Contact page
        </Link>
        .
      </p>
    </>
  );
}
