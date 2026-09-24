import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-slate-100 px-4 py-3 sm:px-6", className)} {...props} />;
}

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent bg-navy-900 text-white",
        success: "border-transparent bg-emerald-600 text-white",
        warning: "border-transparent bg-amber-500 text-black",
        muted: "border-slate-200 bg-slate-100 text-slate-700",
        outline: "border-slate-300 bg-white text-slate-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function DataTable({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className={cn("w-full min-w-[720px] border-collapse bg-white text-sm", className)} {...props} />
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  variant?: "admin" | "storefront";
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {}, variant = "admin" }: PaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (page > 1) params.set("page", page.toString());
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;
    
    if (showEllipsis) {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    } else {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  const containerClasses = variant === "storefront" 
    ? "flex flex-wrap items-center justify-center gap-2 pt-4"
    : "flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3";

  const pageTextClasses = variant === "storefront"
    ? "text-sm text-slate-600"
    : "text-xs text-slate-600";

  const buttonClasses = variant === "storefront"
    ? "rounded border px-3 py-2 text-sm font-medium"
    : "rounded border px-2.5 py-1 text-xs font-medium";

  return (
    <div className={containerClasses}>
      {variant === "admin" && (
        <p className={pageTextClasses}>
          Page {currentPage} of {totalPages}
        </p>
      )}
      <div className="flex gap-1">
        <a
          href={buildUrl(currentPage - 1)}
          className={cn(
            buttonClasses,
            currentPage === 1
              ? "border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          )}
          aria-disabled={currentPage === 1}
        >
          Previous
        </a>
        {getPageNumbers().map((page, i) =>
          typeof page === "number" ? (
            <a
              key={i}
              href={buildUrl(page)}
              className={cn(
                buttonClasses,
                page === currentPage
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {page}
            </a>
          ) : (
            <span key={i} className="px-2.5 py-1 text-xs text-slate-400">
              {page}
            </span>
          )
        )}
        <a
          href={buildUrl(currentPage + 1)}
          className={cn(
            buttonClasses,
            currentPage === totalPages
              ? "border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          )}
          aria-disabled={currentPage === totalPages}
        >
          Next
        </a>
      </div>
    </div>
  );
}
