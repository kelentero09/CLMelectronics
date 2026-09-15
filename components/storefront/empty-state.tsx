import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  title,
  text,
  showContact = true,
}: {
  title: string;
  text: string;
  showContact?: boolean;
}) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="space-y-3 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900/10 text-navy-900">
          <PackageSearch className="h-7 w-7" />
        </div>
        <p className="text-2xl font-bold uppercase tracking-tight">{title}</p>
        <p className="mx-auto max-w-md text-sm text-slate-500">{text}</p>
        <div className="flex justify-center gap-2">
          <Link href="/" className={buttonVariants()}>
            Browse All Products
          </Link>
          {showContact && (
            <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
              Contact CLM
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
