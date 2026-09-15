"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { createCategory, updateCategory, toggleCategoryActive, deleteCategory } from "@/app/actions/categories";
import { Input, Textarea, Label, Checkbox, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
};

export function CategoryManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, id: string | null) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(e.currentTarget);
      const result = id ? await updateCategory(id, form) : await createCategory(form);
      if (result.ok) {
        toast.success(id ? "Category updated" : "Category created");
        setEditing(null);
        setShowNew(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save the category.");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const result = await toggleCategoryActive(id, isActive);
    if (result.ok) {
      toast.success(isActive ? "Category activated" : "Category deactivated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function remove(id: string, name: string, count: number) {
    if (count > 0) {
      toast.error(`Cannot delete — ${count} product(s) still use this category. Deactivate it instead.`);
      return;
    }
    if (!window.confirm(`Delete category "${name}"?`)) return;
    const result = await deleteCategory(id);
    if (result.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      {!showNew && !editing && (
        <Button size="sm" onClick={() => setShowNew(true)}>+ New Category</Button>
      )}
      {showNew && <CategoryForm key="new" onCancel={() => setShowNew(false)} onSubmit={(e) => handleSubmit(e, null)} error={error} pending={pending} />}
      <div className="grid gap-3">
        {initial.map((c) =>
          editing?.id === c.id ? (
            <CategoryForm key={c.id} initial={c} onCancel={() => setEditing(null)} onSubmit={(e) => handleSubmit(e, c.id)} error={error} pending={pending} />
          ) : (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-navy-900">
                    {c.name}{" "}
                    <Badge variant={c.isActive ? "success" : "muted"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                  </p>
                  <p className="font-mono text-xs text-slate-400">/{c.slug} · order {c.sortOrder} · {c._count.products} product(s)</p>
                  {c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c); setShowNew(false); setError(null); }}>Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(c.id, !c.isActive)}>
                    {c.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(c.id, c.name, c._count.products)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
        {initial.length === 0 && <p className="text-sm text-slate-500">No categories yet.</p>}
      </div>
    </div>
  );
}

function CategoryForm({
  initial,
  onCancel,
  onSubmit,
  error,
  pending,
}: {
  initial?: CategoryRow;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string | null;
  pending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [touched, setTouched] = useState(!!initial);
  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" aria-label={initial ? "Edit category" : "New category"}>
          <div>
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name" name="name" required minLength={2} maxLength={120} value={name}
              onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)); }}
            />
          </div>
          <div>
            <Label htmlFor="cat-slug">Slug * (appears in public URLs)</Label>
            <Input id="cat-slug" name="slug" required value={slug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" name="description" rows={2} maxLength={2000} defaultValue={initial?.description ?? ""} />
          </div>
          <div>
            <Label htmlFor="cat-order">Sort order</Label>
            <Input id="cat-order" name="sortOrder" type="number" min={0} max={10000} defaultValue={initial?.sortOrder ?? 0} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} /> Active
            </label>
          </div>
          <FieldError message={error} />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : initial ? "Save" : "Create"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
