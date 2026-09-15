"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, FolderTree, Inbox, LogOut, Plus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Add Product", href: "/admin/products/new", icon: Plus },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Inquiries", href: "/admin/inquiries", icon: Inbox },
];

export function AdminShell({ children, adminEmail }: { children: React.ReactNode; adminEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* not connected — just leave */
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-950 text-slate-200 md:flex" aria-label="Admin navigation">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Image
            src="/logo.webp"
            alt="CLM Electronics logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded bg-white object-contain"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">CLM Catalog Admin</p>
            <p className="truncate text-xs text-slate-400">{adminEmail}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded px-3 py-2 text-sm font-medium",
                  active ? "bg-white/10 text-white" : "hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium hover:bg-white/5">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          <Link href="/" className="mt-1 block rounded px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            ← View Catalog
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-navy-900 md:hidden">
            <Image
              src="/logo.webp"
              alt="CLM Electronics logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded object-contain"
            />
            CLM Admin
          </p>
          <nav aria-label="Admin mobile" className="flex flex-wrap items-center gap-1 text-xs md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn("rounded px-2 py-1.5 font-semibold", pathname === item.href ? "bg-navy-900 text-white" : "bg-slate-100")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button type="button" onClick={signOut} className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold md:hidden">
            Sign Out
          </button>
          <p className="hidden text-xs text-slate-500 md:block">Signed in as {adminEmail}</p>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
