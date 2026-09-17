"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { updateSiteContent, updateSiteContentJson } from "@/app/actions/site-content";
import { Input, Textarea, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, Badge } from "@/components/ui/card";
import { SITE_CONTENT_GROUPS } from "@/data/site-content-defaults";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface ContentRow {
  key: string;
  group: string;
  label: string;
  description: string | null;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  updatedAt: string;
}

const LIST_KEYS = new Set(["company.phones", "home.profile_points", "home.board_types", "services.wedge_brands"]);

function isLong(value: string) {
  return value.includes("\n") || value.length > 120;
}

export function SiteContentManager({ initial }: { initial: ContentRow[] }) {
  const [group, setGroup] = useState<string>("general");
  const rows = useMemo(() => initial.filter((r) => r.group === group), [initial, group]);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of initial) m[r.group] = (m[r.group] ?? 0) + 1;
    return m;
  }, [initial]);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Content groups">
        {SITE_CONTENT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={group === g.id}
            onClick={() => setGroup(g.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold",
              group === g.id
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-navy-900 hover:text-navy-900"
            )}
          >
            {g.label} <span className="ml-1 font-normal opacity-70">{counts[g.id] ?? 0}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">{SITE_CONTENT_GROUPS.find((g) => g.id === group)?.hint}</p>

      <div className="mt-4 grid gap-3">
        {rows.map((row) => {
          if (row.key === "home.capability_cards" || row.key === "home.why_cards") {
            return <CardsEditor key={row.key} row={row} />;
          }
          if (row.key === "services.categories") return <ServicesEditor key={row.key} row={row} />;
          if (row.key === "equipment.groups") return <EquipmentEditor key={row.key} row={row} />;
          if (row.key === "equipment.parts_sourcing") return <PartsEditor key={row.key} row={row} />;
          return <TextEntryCard key={row.key} row={row} />;
        })}
        {rows.length === 0 && (
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">No entries in this group yet. Run the seed to restore defaults.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Plain text entry ─────────────────────────────────────────── */
function TextEntryCard({ row }: { row: ContentRow }) {
  const router = useRouter();
  const [value, setValue] = useState(row.value);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dirty = value !== row.value;
  const long = isLong(row.value) || LIST_KEYS.has(row.key);

  async function save() {
    setError(null);
    setPending(true);
    try {
      const form = new FormData();
      form.set("key", row.key);
      form.set("value", value);
      const result = await updateSiteContent(form);
      if (result.ok) {
        toast.success(`“${row.label}” saved — website updated`);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-navy-900">{row.label}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.key}</p>
        </div>
        {dirty ? <Badge variant="warning">Unsaved</Badge> : <Badge variant="muted">Live</Badge>}
      </CardHeader>
      <CardContent className="space-y-2">
        {row.description && <p className="text-xs text-slate-500">{row.description}</p>}
        <Label htmlFor={`field-${row.key}`} className="sr-only">{row.label}</Label>
        {long ? (
          <Textarea
            id={`field-${row.key}`}
            rows={Math.min(10, Math.max(3, value.split("\n").length + 1))}
            value={value}
            maxLength={20000}
            onChange={(e) => setValue(e.target.value)}
            placeholder={LIST_KEYS.has(row.key) ? "One per line…" : ""}
          />
        ) : (
          <Input id={`field-${row.key}`} value={value} maxLength={20000} onChange={(e) => setValue(e.target.value)} />
        )}
        {LIST_KEYS.has(row.key) && <p className="text-[11px] text-slate-400">One item per line — each line shows as a bullet.</p>}
        <FieldError message={error} />
        <div>
          <Button size="sm" onClick={save} disabled={!dirty || pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Title + text cards (capabilities, Why CLM) ───────────────── */
function CardsEditor({ row }: { row: ContentRow }) {
  const router = useRouter();
  const [cards, setCards] = useState<{ title: string; text: string }[]>(
    Array.isArray(row.data) && row.data.length > 0 ? row.data : []
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set(i: number, patch: Partial<{ title: string; text: string }>) {
    setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  async function save() {
    setError(null);
    if (cards.some((c) => !c.title.trim())) {
      setError("Every card needs a title.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify(cards.map((c) => ({ title: c.title.trim(), text: c.text.trim() }))));
      const result = await updateSiteContentJson(row.key, form);
      if (result.ok) {
        toast.success(`“${row.label}” saved — website updated`);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-navy-900">{row.label}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.key} · {cards.length} cards</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCards((cs) => [...cs, { title: "", text: "" }])}>
          + Add card
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {row.description && <p className="text-xs text-slate-500">{row.description}</p>}
        {cards.map((c, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_2fr_auto]">
            <Input aria-label={`Card ${i + 1} title`} placeholder="Title" value={c.title} onChange={(e) => set(i, { title: e.target.value })} />
            <Textarea aria-label={`Card ${i + 1} description`} placeholder="Description" rows={2} value={c.text} onChange={(e) => set(i, { text: e.target.value })} />
            <Button size="sm" variant="danger" onClick={() => setCards((cs) => cs.filter((_, j) => j !== i))}>
              Remove
            </Button>
          </div>
        ))}
        {cards.length === 0 && <p className="text-sm text-slate-500">No cards yet — add the first one.</p>}
        <FieldError message={error} />
        <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save cards"}</Button>
      </CardContent>
    </Card>
  );
}

/* ── Services categories ──────────────────────────────────────── */
interface ServiceCat { id: string; title: string; summary: string; items: string[] }

function ServicesEditor({ row }: { row: ContentRow }) {
  const router = useRouter();
  const [cats, setCats] = useState<ServiceCat[]>(Array.isArray(row.data) ? row.data : []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function patch(id: string, p: Partial<ServiceCat>) {
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }

  async function save() {
    setError(null);
    if (cats.some((c) => !c.title.trim())) {
      setError("Every category needs a title.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.set(
        "data",
        JSON.stringify(
          cats.map((c) => ({
            id: c.id,
            title: c.title.trim(),
            summary: c.summary.trim(),
            items: c.items.map((s) => s.trim()).filter(Boolean),
          }))
        )
      );
      const result = await updateSiteContentJson(row.key, form);
      if (result.ok) {
        toast.success("Services saved — website updated");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-navy-900">{row.label}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.key} · {cats.length} categories</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCats((cs) => [...cs, { id: `custom-${Date.now().toString(36)}`, title: "", summary: "", items: [] }])}
        >
          + Add category
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-500">Bullets are one per line. Changes update the Services page instantly.</p>
        {cats.map((c) => (
          <details key={c.id} className="rounded-lg border border-slate-200" open={false}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-navy-900">
              {c.title || "(Untitled category)"} <span className="ml-2 font-normal text-slate-400">{c.items.length} items</span>
            </summary>
            <div className="grid gap-2 border-t border-slate-100 p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Title *</Label>
                  <Input value={c.title} maxLength={200} onChange={(e) => patch(c.id, { title: e.target.value })} />
                </div>
                <div>
                  <Label>Stable ID</Label>
                  <Input value={c.id} maxLength={80} onChange={(e) => patch(c.id, { id: slugify(e.target.value) || c.id })} />
                </div>
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea rows={2} value={c.summary} maxLength={2000} onChange={(e) => patch(c.id, { summary: e.target.value })} />
              </div>
              <div>
                <Label>Bullets (one per line)</Label>
                <Textarea rows={5} value={c.items.join("\n")} onChange={(e) => patch(c.id, { items: e.target.value.split("\n") })} />
              </div>
              <div>
                <Button size="sm" variant="danger" onClick={() => setCats((cs) => cs.filter((x) => x.id !== c.id))}>
                  Remove category
                </Button>
              </div>
            </div>
          </details>
        ))}
        <FieldError message={error} />
        <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save services"}</Button>
      </CardContent>
    </Card>
  );
}

/* ── Equipment groups ─────────────────────────────────────────── */
interface EquipGroup { id: string; brand: string; label: string; description: string; models: string[] }

function EquipmentEditor({ row }: { row: ContentRow }) {
  const router = useRouter();
  const [groups, setGroups] = useState<EquipGroup[]>(Array.isArray(row.data) ? row.data : []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function patch(id: string, p: Partial<EquipGroup>) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...p } : g)));
  }

  async function save() {
    setError(null);
    if (groups.some((g) => !g.brand.trim() || !g.label.trim())) {
      setError("Every group needs a brand and a label.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.set(
        "data",
        JSON.stringify(
          groups.map((g) => ({
            id: g.id,
            brand: g.brand.trim(),
            label: g.label.trim(),
            description: g.description.trim(),
            models: g.models.map((m) => m.trim()).filter(Boolean),
          }))
        )
      );
      const result = await updateSiteContentJson(row.key, form);
      if (result.ok) {
        toast.success("Equipment saved — website updated");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-navy-900">{row.label}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.key} · {groups.length} groups</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setGroups((gs) => [...gs, { id: `custom-${Date.now().toString(36)}`, brand: "", label: "", description: "", models: [] }])}
        >
          + Add group
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-500">Models are one per line. Shown on the Equipment page and homepage pills.</p>
        {groups.map((g) => (
          <details key={g.id} className="rounded-lg border border-slate-200">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-navy-900">
              {g.brand || "(Untitled)"} — {g.label || "…"} <span className="ml-2 font-normal text-slate-400">{g.models.length} models</span>
            </summary>
            <div className="grid gap-2 border-t border-slate-100 p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label>Brand *</Label>
                  <Input value={g.brand} maxLength={120} onChange={(e) => patch(g.id, { brand: e.target.value })} />
                </div>
                <div>
                  <Label>Label *</Label>
                  <Input value={g.label} maxLength={200} onChange={(e) => patch(g.id, { label: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={g.description} maxLength={2000} onChange={(e) => patch(g.id, { description: e.target.value })} />
              </div>
              <div>
                <Label>Models (one per line)</Label>
                <Textarea rows={4} value={g.models.join("\n")} onChange={(e) => patch(g.id, { models: e.target.value.split("\n") })} />
              </div>
              <div>
                <Button size="sm" variant="danger" onClick={() => setGroups((gs) => gs.filter((x) => x.id !== g.id))}>
                  Remove group
                </Button>
              </div>
            </div>
          </details>
        ))}
        <FieldError message={error} />
        <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save equipment"}</Button>
      </CardContent>
    </Card>
  );
}

/* ── Parts sourcing ───────────────────────────────────────────── */
function PartsEditor({ row }: { row: ContentRow }) {
  const router = useRouter();
  const [groups, setGroups] = useState<{ brand: string; models: string[] }[]>(
    Array.isArray(row.data) ? row.data : []
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setError(null);
    if (groups.some((g) => !g.brand.trim())) {
      setError("Every group needs a brand.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.set(
        "data",
        JSON.stringify(groups.map((g) => ({ brand: g.brand.trim(), models: g.models.map((m) => m.trim()).filter(Boolean) })))
      );
      const result = await updateSiteContentJson(row.key, form);
      if (result.ok) {
        toast.success("Parts sourcing saved — website updated");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-navy-900">{row.label}</p>
          <p className="font-mono text-[11px] text-slate-400">{row.key} · {groups.length} brands</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setGroups((gs) => [...gs, { brand: "", models: [] }])}>
          + Add brand
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((g, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_2fr_auto]">
            <Input aria-label={`Brand ${i + 1}`} placeholder="Brand" value={g.brand} onChange={(e) => setGroups((gs) => gs.map((x, j) => (j === i ? { ...x, brand: e.target.value } : x)))} />
            <Textarea aria-label={`Models for brand ${i + 1}`} placeholder="Models — one per line" rows={3} value={g.models.join("\n")} onChange={(e) => setGroups((gs) => gs.map((x, j) => (j === i ? { ...x, models: e.target.value.split("\n") } : x)))} />
            <Button size="sm" variant="danger" onClick={() => setGroups((gs) => gs.filter((_, j) => j !== i))}>
              Remove
            </Button>
          </div>
        ))}
        <FieldError message={error} />
        <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save parts sourcing"}</Button>
      </CardContent>
    </Card>
  );
}
