"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { createProduct, updateProduct } from "@/app/actions/products";
import { Input, Textarea, Select, Label, Checkbox, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { MAX_IMAGES_PER_PRODUCT, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/catalog";

export type ProductFormInitial = {
  name: string;
  slug: string;
  referenceCode: string;
  categoryId: string;
  model: string;
  partNumber: string;
  manufacturer: string;
  shortDescription: string;
  description: string;
  specifications: { key: string; value: string }[];
  datasheetUrl: string;
  condition: string;
  availability: string;
  published: boolean;
  featured: boolean;
};

const EMPTY: ProductFormInitial = {
  name: "",
  slug: "",
  referenceCode: "",
  categoryId: "",
  model: "",
  partNumber: "",
  manufacturer: "",
  shortDescription: "",
  description: "",
  specifications: [],
  datasheetUrl: "",
  condition: "",
  availability: "IN_STOCK",
  published: false,
  featured: false,
};

export function ProductForm({
  mode,
  productId,
  initial,
  categories,
  existingImageCount,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Partial<ProductFormInitial>;
  categories: { id: string; name: string }[];
  existingImageCount?: number;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormInitial>({ ...EMPTY, ...initial });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(initial?.specifications ?? []);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const usedSlots = (existingImageCount ?? 0) + previews.length;
  const slotsLeft = useMemo(() => Math.max(0, MAX_IMAGES_PER_PRODUCT - (existingImageCount ?? 0)), [existingImageCount]);

  function set<K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const accepted: string[] = [];
    for (const f of Array.from(files)) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(f.type)) {
        toast.error(`${f.name}: only JPEG, PNG, WebP, or AVIF allowed`);
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${f.name}: must be 5 MB or smaller`);
        continue;
      }
      if (accepted.length + previews.length >= slotsLeft) {
        toast.error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images per product`);
        break;
      }
      accepted.push(URL.createObjectURL(f));
    }
    setPreviews((p) => [...p, ...accepted]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(e.currentTarget);
      form.set("specifications", JSON.stringify(specs.filter((s) => s.key.trim() && s.value.trim())));
      const result = mode === "create" ? await createProduct(form) : await updateProduct(productId!, form);
      if (result.ok) {
        toast.success(mode === "create" ? "Product created" : "Product updated");
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not save the product. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4" aria-label={mode === "create" ? "New product" : "Edit product"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="pf-name">Name *</Label>
          <Input
            id="pf-name" name="name" required minLength={2} maxLength={200} value={values.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
        </div>
        <div>
          <Label htmlFor="pf-slug">Slug *</Label>
          <Input id="pf-slug" name="slug" required value={values.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
        </div>
        <div>
          <Label htmlFor="pf-ref">Reference code *</Label>
          <Input id="pf-ref" name="referenceCode" required minLength={2} maxLength={50} value={values.referenceCode} onChange={(e) => set("referenceCode", e.target.value)} placeholder="e.g. CLM-0001" />
        </div>
        <div>
          <Label htmlFor="pf-category">Category</Label>
          <Select id="pf-category" name="categoryId" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="pf-manufacturer">Manufacturer</Label>
          <Input id="pf-manufacturer" name="manufacturer" maxLength={120} value={values.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Free text, e.g. Omron" />
        </div>
        <div>
          <Label htmlFor="pf-model">Model number</Label>
          <Input id="pf-model" name="model" maxLength={120} value={values.model} onChange={(e) => set("model", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pf-part">Part number</Label>
          <Input id="pf-part" name="partNumber" maxLength={120} value={values.partNumber} onChange={(e) => set("partNumber", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pf-short">Short description ({values.shortDescription.length}/300)</Label>
          <Input id="pf-short" name="shortDescription" maxLength={300} value={values.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line card teaser" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pf-desc">Full description ({values.description.length}/10000)</Label>
          <Textarea id="pf-desc" name="description" maxLength={10000} rows={5} value={values.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pf-condition">Condition</Label>
          <Select id="pf-condition" name="condition" value={values.condition} onChange={(e) => set("condition", e.target.value)}>
            <option value="">— Not set —</option>
            {["NEW", "USED", "REFURBISHED", "SURPLUS", "FOR_PARTS"].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="pf-avail">Availability</Label>
          <Select id="pf-avail" name="availability" value={values.availability} onChange={(e) => set("availability", e.target.value)}>
            {["IN_STOCK", "LOW_STOCK", "RESERVED", "SOLD", "UNAVAILABLE"].map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pf-datasheet">Datasheet / document URL (optional)</Label>
          <Input id="pf-datasheet" name="datasheetUrl" type="url" maxLength={2000} value={values.datasheetUrl} onChange={(e) => set("datasheetUrl", e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">Specifications ({specs.length}/50)</legend>
        <div className="mt-2 space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`Specification ${i + 1} key`} placeholder="Key (e.g. Voltage)" maxLength={80} value={s.key} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
              <Input aria-label={`Specification ${i + 1} value`} placeholder="Value (e.g. 24V DC)" maxLength={300} value={s.value} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <Button type="button" size="sm" variant="outline" onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))} aria-label={`Remove specification ${i + 1}`}>✕</Button>
            </div>
          ))}
          {specs.length < 50 && (
            <Button type="button" size="sm" variant="outline" onClick={() => setSpecs((arr) => [...arr, { key: "", value: "" }])}>
              + Add specification
            </Button>
          )}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox name="published" defaultChecked={values.published} /> Published
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox name="featured" defaultChecked={values.featured} /> Featured
        </label>
      </div>

      <div>
        <Label htmlFor="pf-images">Images (JPEG/PNG/WebP/AVIF, ≤5 MB each, max {MAX_IMAGES_PER_PRODUCT} total — {usedSlots} used)</Label>
        <Input
          id="pf-images" name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={slotsLeft <= 0}
        />
        {previews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`New upload preview ${i + 1}`} className="h-16 w-20 rounded border border-slate-200 object-contain" />
            ))}
          </div>
        )}
      </div>

      <FieldError message={error} />
      <div>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}</Button>
      </div>
    </form>
  );
}
