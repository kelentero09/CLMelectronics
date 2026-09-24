"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { updateInquiryStatus } from "@/app/actions/inquiries";
import { Badge, Card, CardContent, DataTable, Pagination } from "@/components/ui/card";
import { Select } from "@/components/ui/form";

export type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: "NEW" | "CONTACTED" | "COMPLETED";
  productRef: string | null;
  createdAt: string;
};

function statusVariant(status: string) {
  if (status === "NEW") return "warning" as const;
  if (status === "CONTACTED") return "default" as const;
  return "success" as const;
}

export function InquiriesManager({ 
  initial, 
  currentPage = 1, 
  totalPages = 1, 
  baseUrl = "/admin/inquiries", 
  searchParams = {} 
}: { 
  initial: InquiryRow[];
  currentPage?: number;
  totalPages?: number;
  baseUrl?: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function changeStatus(id: string, status: "NEW" | "CONTACTED" | "COMPLETED") {
    setPending(id);
    const result = await updateInquiryStatus(id, status);
    setPending(null);
    if (result.ok) {
      toast.success("Status updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  // Mobile cards
  const cards = (
    <div className="grid gap-3 md:hidden">
      {initial.map((inq) => (
        <Card key={inq.id}>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-navy-900">{inq.name}</p>
              <Badge variant={statusVariant(inq.status)}>{inq.status}</Badge>
            </div>
            {inq.productRef && <p className="text-xs font-semibold text-steel-600">{inq.productRef}</p>}
            <p className="whitespace-pre-line text-sm text-slate-600">{inq.message}</p>
            <p className="text-xs text-slate-400">
              {inq.email}{inq.phone ? ` • ${inq.phone}` : ""}{inq.company ? ` • ${inq.company}` : ""} ·{" "}
              {new Date(inq.createdAt).toLocaleString()}
            </p>
            <Select
              aria-label={`Status for inquiry from ${inq.name}`}
              value={inq.status}
              disabled={pending === inq.id}
              onChange={(e) => changeStatus(inq.id, e.target.value as InquiryRow["status"])}
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="COMPLETED">COMPLETED</option>
            </Select>
          </CardContent>
        </Card>
      ))}
      {initial.length === 0 && <p className="text-sm text-slate-500">No inquiries.</p>}
    </div>
  );

  return (
    <>
      {cards}
      <div className="md:hidden">
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} searchParams={searchParams} variant="admin" />
      </div>
      <div className="hidden md:block">
        <DataTable aria-label="Inquiries">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Received</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((inq) => (
              <tr key={inq.id} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 text-xs">
                  <span className="block font-semibold text-navy-900">{inq.name}</span>
                  <span className="block text-slate-500">{inq.email}</span>
                  {inq.phone && <span className="block text-slate-500">{inq.phone}</span>}
                  {inq.company && <span className="block text-slate-500">{inq.company}</span>}
                </td>
                <td className="max-w-[180px] px-3 py-2 text-xs text-steel-600">{inq.productRef ?? "General inquiry"}</td>
                <td className="max-w-[320px] whitespace-pre-line px-3 py-2 text-xs text-slate-600">{inq.message}</td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{new Date(inq.createdAt).toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Select
                    aria-label={`Status for inquiry from ${inq.name}`}
                    value={inq.status}
                    disabled={pending === inq.id}
                    onChange={(e) => changeStatus(inq.id, e.target.value as InquiryRow["status"])}
                    className="h-8 text-xs"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </Select>
                </td>
              </tr>
            ))}
            {initial.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">No inquiries.</td></tr>
            )}
          </tbody>
        </DataTable>
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} searchParams={searchParams} variant="admin" />
      </div>
    </>
  );
}
