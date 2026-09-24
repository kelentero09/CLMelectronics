"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cleanupOldInquiries, exportInquiriesToArchive } from "@/app/actions/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Label } from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StorageManager({ oldInquiryCount }: { oldInquiryCount: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [days, setDays] = useState(90);

  async function handleCleanup() {
    if (!confirm(`Delete all COMPLETED inquiries older than ${days} days? This action cannot be undone.`)) return;
    
    setPending(true);
    try {
      const result = await cleanupOldInquiries(days);
      if (result.ok) {
        toast.success(`Deleted ${result.deleted} old inquiries`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error("Failed to cleanup inquiries");
    } finally {
      setPending(false);
    }
  }

  async function handleArchive() {
    if (!confirm(`Archive all COMPLETED inquiries older than ${days} days? This will export them to JSON and delete from database.`)) return;
    
    setArchiving(true);
    try {
      const result = await exportInquiriesToArchive(days);
      if (result.ok) {
        // Download the archive data
        const blob = new Blob([result.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inquiries-archive-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Archived ${result.archived} inquiries and downloaded backup`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error("Failed to archive inquiries");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-bold text-navy-900">Inquiry Storage Management</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600">
              Currently there are <span className="font-semibold text-navy-900">{oldInquiryCount}</span> inquiries older than 90 days.
              Managing old inquiries can significantly reduce database storage usage.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              <strong>Current Optimization:</strong> Images at 600px/70% quality, Inquiries limited to 500 chars.
              For 10K products with 8 images each: ~1.6-4.8GB storage (still requires external CDN for free tier).
            </p>
          </div>
          
          <div>
            <Label htmlFor="cleanup-days">Process inquiries older than (days)</Label>
            <Input
              id="cleanup-days"
              type="number"
              min="30"
              max="365"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 w-32"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleArchive} 
              disabled={archiving || pending || oldInquiryCount === 0}
              variant="outline"
              size="sm"
            >
              {archiving ? "Archiving..." : "Archive & Download"}
            </Button>
            <Button 
              onClick={handleCleanup} 
              disabled={pending || archiving || oldInquiryCount === 0}
              variant="danger"
              size="sm"
            >
              {pending ? "Deleting..." : "Delete Only"}
            </Button>
          </div>

          <div className="space-y-2 text-xs text-slate-500">
            <p><strong>Archive & Download:</strong> Exports inquiries to JSON file then deletes from database. Keeps data for records.</p>
            <p><strong>Delete Only:</strong> Permanently deletes without backup. Cannot be undone.</p>
            <p>⚠️ Only COMPLETED inquiries older than specified days will be affected. New and Contacted inquiries are preserved.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}