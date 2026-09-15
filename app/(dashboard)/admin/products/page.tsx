import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ADMIN_PAGE_SIZE } from "@/lib/catalog";
import { Input, Select } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, DataTable } from "@/components/ui/card";
import { PublishToggle, DeleteRestoreButtons } from "@/components/dashboard/product-row-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

type AdminProductRow = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; images: { where: { isPrimary: true } } };
}>;

type SP = { q?: string; category?: string; availability?: string; published?: string; trashed?: string; page?: string };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const showTrashed = sp.trashed === "1";
  const where: Record<string, unknown> = showTrashed ? { deletedAt: { not: null } } : { deletedAt: null };
  if (sp.category) where.categoryId = sp.category;
  if (sp.availability) where.availability = sp.availability;
  if (sp.published === "yes") where.published = true;
  if (sp.published === "no") where.published = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { referenceCode: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { partNumber: { contains: q, mode: "insensitive" } },
      { manufacturer: { contains: q, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, Number(sp.page || 1) || 1);
  let products: AdminProductRow[] = [];
  let total = 0;
  let categories: { id: string; name: string }[] = [];
  try {
    const [p, t, cats] = await Promise.all([
      prisma.product.findMany({
        where: where as never,
        include: { category: { select: { name: true } }, images: { where: { isPrimary: true }, take: 1 } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * ADMIN_PAGE_SIZE,
        take: ADMIN_PAGE_SIZE,
      }),
      prisma.product.count({ where: where as never }),
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    products = p;
    total = t;
    categories = cats;
  } catch (e) {
    console.error("Admin products query failed", e);
  }
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const qs = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: sp.q, category: sp.category, availability: sp.availability, published: sp.published, trashed: sp.trashed, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-navy-900">Products ({total})</h1>
        <div className="flex gap-2">
          <Link href={qs({ trashed: showTrashed ? undefined : "1", page: undefined })} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {showTrashed ? "View Active" : "View Trash"}
          </Link>
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>+ Add Product</Link>
        </div>
      </div>

      <form action="/admin/products" method="get" className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-5">
        {showTrashed && <input type="hidden" name="trashed" value="1" />}
        <Input name="q" defaultValue={q} placeholder="Search…" aria-label="Search products" />
        <Select name="category" defaultValue={sp.category ?? ""} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select name="availability" defaultValue={sp.availability ?? ""} aria-label="Filter by availability">
          <option value="">Any availability</option>
          {["IN_STOCK", "LOW_STOCK", "RESERVED", "SOLD", "UNAVAILABLE"].map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select name="published" defaultValue={sp.published ?? ""} aria-label="Filter by published state">
          <option value="">Published: any</option>
          <option value="yes">Published</option>
          <option value="no">Draft</option>
        </Select>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      <div className="mt-4">
        <DataTable aria-label="Products">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Availability</th>
              <th className="px-3 py-2">Published</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2">
                  <span className="block max-w-[220px] truncate font-semibold text-navy-900">{p.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">{p.slug}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{p.referenceCode}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">{p.category?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2"><Badge variant="muted">{String(p.availability).replace("_", " ")}</Badge></td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Badge variant={p.published ? "success" : "muted"}>{p.published ? "Yes" : "No"}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="flex flex-wrap gap-1">
                    <Link href={`/admin/products/${p.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>
                    {!showTrashed && <PublishToggle id={p.id} published={p.published} />}
                    <DeleteRestoreButtons id={p.id} deleted={showTrashed} />
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">No products found.</td></tr>
            )}
          </tbody>
        </DataTable>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <Link href={qs({ page: String(Math.max(1, page - 1)) })} className={buttonVariants({ variant: "outline", size: "sm", className: page <= 1 ? "pointer-events-none opacity-50" : "" })}>Prev</Link>
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <Link href={qs({ page: String(Math.min(totalPages, page + 1)) })} className={buttonVariants({ variant: "outline", size: "sm", className: page >= totalPages ? "pointer-events-none opacity-50" : "" })}>Next</Link>
        </div>
      )}
    </div>
  );
}
