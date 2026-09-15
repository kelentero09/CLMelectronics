"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { createBoardRepair, updateBoardRepair } from "@/app/actions/board-repairs";
import { Input, Textarea, Label, Checkbox, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/catalog";

export type RepairFormInitial = {
  station: string;
  model: string;
  boardDescription: string;
  problem: string;
  repairRate: number;
  sortOrder: number;
  isActive: boolean;
  image: string | null;
};

export function RepairForm({
  mode,
  repairId,
  initial,
  stations,
}: {
  mode: "create" | "edit";
  repairId?: string;
  initial?: Partial<RepairFormInitial>;
  stations: string[];
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleFile(files: FileList | null) {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(f.type)) {
      toast.error(`${f.name}: only JPEG, PNG, WebP, or AVIF allowed`);
      return;
    }
    if (f.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`${f.name}: must be 5 MB or smaller`);
      return;
    }
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(e.currentTarget);
      const result =
        mode === "create" ? await createBoardRepair(form) : await updateBoardRepair(repairId!, form);
      if (result.ok) {
        toast.success(mode === "create" ? "Repair record added" : "Repair record updated");
        router.push("/admin/repairs");
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
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4" aria-label={mode === "create" ? "New repair record" : "Edit repair record"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="station">Station / Process</Label>
          <Input id="station" name="station" required minLength={2} maxLength={80} defaultValue={initial?.station ?? ""} list="station-suggestions" placeholder="e.g. WIREBOND" />
          <datalist id="station-suggestions">
            {stations.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="model">Equipment / Model Type</Label>
          <Input id="model" name="model" required minLength={1} maxLength={120} defaultValue={initial?.model ?? ""} placeholder="e.g. DISCO" />
        </div>
      </div>
      <div>
        <Label htmlFor="boardDescription">Board Description</Label>
        <Input id="boardDescription" name="boardDescription" required minLength={2} maxLength={200} defaultValue={initial?.boardDescription ?? ""} placeholder="e.g. Pack Driver D2590" />
      </div>
      <div>
        <Label htmlFor="problem">Problem</Label>
        <Textarea id="problem" name="problem" required minLength={2} maxLength={500} defaultValue={initial?.problem ?? ""} placeholder="e.g. No power, machine cannot complete initialize" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="repairRate">Repair Rate (%)</Label>
          <Input id="repairRate" name="repairRate" type="number" min={0} max={100} defaultValue={initial?.repairRate ?? 95} required />
        </div>
        <div>
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input id="sortOrder" name="sortOrder" type="number" min={0} max={10000} defaultValue={initial?.sortOrder ?? 0} />
        </div>
      </div>
      <div>
        <Label htmlFor="photo">Photo {mode === "edit" && initial?.image ? "(leave empty to keep current)" : "(optional)"}</Label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => handleFile(e.target.files)}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">Uploaded photos are converted to WebP automatically.</p>
        {(preview || initial?.image) && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? encodeURI(initial!.image!)}
              alt="Repair photo preview"
              className="h-20 w-28 rounded border border-slate-200 bg-white object-contain"
            />
            {mode === "edit" && initial?.image && !preview && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <Checkbox name="removePhoto" /> Remove photo
              </label>
            )}
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
        <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} /> Show on website
      </label>
      <FieldError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : mode === "create" ? "Add Record" : "Save Changes"}</Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => router.push("/admin/repairs")}>Cancel</Button>
      </div>
    </form>
  );
}
