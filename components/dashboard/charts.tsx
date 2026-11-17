"use client";

/**
 * Small dashboard charts built from plain HTML/CSS (no chart library, so the
 * Worker bundle stays under the Cloudflare free-plan size limit).
 *
 * Conventions: one hue for magnitude (steel), thin marks with 4px rounded
 * data-ends, 2px gaps between adjacent fills, recessive grid, values in text
 * colors (never the series color), a hover tooltip on every mark, and a
 * screen-reader table for each chart.
 */
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type Datum = { key: string; label: string; value: number; href?: string; detail?: string };

const SERIES = "#2f6fed"; // brand steel-500: the single magnitude hue
const fmt = (n: number) => n.toLocaleString("en-US");

/** Round the axis maximum up to 1, 2 or 5 × 10^n and return evenly spaced ticks. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const unit = Math.max(1, step); // counts are whole numbers
  const top = Math.ceil(max / unit) * unit;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += unit) ticks.push(v);
  return ticks;
}

function SrTable({ caption, data, valueLabel }: { caption: string; data: Datum[]; valueLabel: string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.key}>
            <th scope="row">{d.label}</th>
            <td>{d.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Vertical columns over time, with a y-axis, recessive gridlines and a hover tooltip. */
export function ColumnChart({
  data,
  caption,
  valueLabel,
  height = 176,
}: {
  data: Datum[];
  caption: string;
  valueLabel: string;
  height?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)));
  const top = ticks[ticks.length - 1]!;
  const hovered = active === null ? null : data[active];
  // Label every other column on narrow charts so dates never collide.
  const labelEvery = data.length > 8 ? 2 : 1;

  return (
    <figure className="m-0">
      <div className="flex gap-2">
        {/* y-axis */}
        <div className="relative w-6 shrink-0 text-right text-[11px] tabular-nums text-slate-400" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {fmt(t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
            {/* gridlines */}
            {ticks.map((t) => (
              <div
                key={t}
                aria-hidden
                className={cn("absolute inset-x-0 border-t", t === 0 ? "border-slate-300" : "border-slate-100")}
                style={{ bottom: `${(t / top) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-0.5">
              {data.map((d, i) => (
                <button
                  key={d.key}
                  type="button"
                  className="group relative flex h-full flex-1 items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-steel-500"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${d.label}: ${d.value} ${valueLabel}`}
                >
                  {active === i && <span aria-hidden className="absolute inset-0 rounded-sm bg-slate-100/70" />}
                  <span
                    aria-hidden
                    className="relative w-full max-w-7 rounded-t transition-opacity"
                    style={{
                      height: d.value > 0 ? `max(${(d.value / top) * 100}%, 3px)` : 0,
                      background: SERIES,
                      opacity: active === null || active === i ? 1 : 0.45,
                    }}
                  />
                </button>
              ))}
            </div>
            {hovered && active !== null && (
              <div
                role="status"
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
                style={{
                  left: `clamp(56px, ${((active + 0.5) / data.length) * 100}%, calc(100% - 56px))`,
                  bottom: `calc(${(hovered.value / top) * 100}% + 8px)`,
                }}
              >
                <div className="font-semibold text-navy-900">{hovered.detail ?? hovered.label}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-slate-600">
                  <span className="inline-block size-2 rounded-full" style={{ background: SERIES }} />
                  <span className="tabular-nums font-semibold text-navy-900">{fmt(hovered.value)}</span> {valueLabel}
                </div>
              </div>
            )}
          </div>
          {/* x-axis labels */}
          <div className="mt-1.5 flex gap-0.5 text-[11px] text-slate-400" aria-hidden>
            {data.map((d, i) => (
              <span key={d.key} className="flex-1 truncate text-center">
                {i % labelEvery === (data.length - 1) % labelEvery ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <SrTable caption={caption} data={data} valueLabel={valueLabel} />
    </figure>
  );
}

/** Ranked horizontal bars with direct value labels; rows link to a filtered list. */
export function BarList({
  data,
  caption,
  valueLabel,
  emptyText = "No data yet.",
}: {
  data: Datum[];
  caption: string;
  valueLabel: string;
  emptyText?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;

  return (
    <figure className="m-0">
      <ul className="space-y-1" onMouseLeave={() => setActive(null)}>
        {data.map((d) => {
          const share = total ? Math.round((d.value / total) * 100) : 0;
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-700">{d.label}</span>
                <span className="shrink-0 tabular-nums font-semibold text-navy-900">{fmt(d.value)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100" aria-hidden>
                <div
                  className="h-2 rounded-full transition-opacity"
                  style={{
                    width: d.value > 0 ? `max(${(d.value / max) * 100}%, 4px)` : 0,
                    background: SERIES,
                    opacity: active === null || active === d.key ? 1 : 0.45,
                  }}
                />
              </div>
            </>
          );
          const cls = "block rounded-md px-2 py-1.5 -mx-2 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-steel-500";
          return (
            <li key={d.key} onMouseEnter={() => setActive(d.key)}>
              {d.href ? (
                <Link
                  href={d.href}
                  className={cls}
                  onFocus={() => setActive(d.key)}
                  aria-label={`${d.label}: ${d.value} ${valueLabel} (${share}%)`}
                  title={d.detail ?? `${share}% of total`}
                >
                  {body}
                </Link>
              ) : (
                <div className={cls} title={d.detail ?? `${share}% of total`}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <SrTable caption={caption} data={data} valueLabel={valueLabel} />
    </figure>
  );
}

export type Segment = Datum & { color: string };

/** One 100% bar split into parts (2px gaps), with a legend that carries the counts. */
export function SegmentedBar({ data, caption, valueLabel }: { data: Segment[]; caption: string; valueLabel: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const visible = data.filter((d) => d.value > 0);

  return (
    <figure className="m-0">
      <div className="flex h-3 gap-0.5" aria-hidden onMouseLeave={() => setActive(null)}>
        {total === 0 ? (
          <div className="h-full flex-1 rounded-full bg-slate-100" />
        ) : (
          visible.map((d, i) => (
            <div
              key={d.key}
              className={cn("h-full transition-opacity", i === 0 && "rounded-l-full", i === visible.length - 1 && "rounded-r-full")}
              style={{
                flexGrow: d.value,
                flexBasis: 0,
                minWidth: 4,
                background: d.color,
                opacity: active === null || active === d.key ? 1 : 0.4,
              }}
              onMouseEnter={() => setActive(d.key)}
              title={`${d.label}: ${d.value}`}
            />
          ))
        )}
      </div>
      <ul className="mt-4 space-y-1">
        {data.map((d) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden />
                <span className="truncate text-slate-700">{d.label}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-navy-900">{fmt(d.value)}</span>
                <span className="ml-2 inline-block w-9 text-right text-xs text-slate-400">{pct}%</span>
              </span>
            </>
          );
          const cls = cn(
            "-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-steel-500",
            active === d.key && "bg-slate-50"
          );
          return (
            <li key={d.key} onMouseEnter={() => setActive(d.key)} onMouseLeave={() => setActive(null)}>
              {d.href ? (
                <Link href={d.href} className={cls} aria-label={`${d.label}: ${d.value} ${valueLabel} (${pct}%)`}>
                  {row}
                </Link>
              ) : (
                <div className={cls}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      <SrTable caption={caption} data={data} valueLabel={valueLabel} />
    </figure>
  );
}

/** Thin progress meter for a KPI tile (value out of 100). */
export function Meter({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="mt-3 h-1.5 rounded-full bg-slate-100"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
    >
      <div className="h-1.5 rounded-full" style={{ width: `${v}%`, background: SERIES }} />
    </div>
  );
}
