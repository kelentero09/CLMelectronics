"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

/**
 * Promise-based replacement for window.confirm(), rendered as an accessible
 * modal <dialog> (focus trapped, Esc to cancel, animated).
 *
 *   if (!(await confirmDialog({ title: "Delete?", tone: "danger" }))) return;
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const done = (value: boolean) => {
      resolve(value);
      // Let the close animation/frame finish before unmounting.
      setTimeout(() => {
        root.unmount();
        host.remove();
      }, 0);
    };
    root.render(<ConfirmModal {...options} onDone={done} />);
  });
}

function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onDone,
}: ConfirmOptions & { onDone: (value: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const result = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = (value: boolean) => {
    result.current = value;
    ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      onClose={() => onDone(result.current)}
      onClick={(e) => e.target === e.currentTarget && close(false)}
      aria-labelledby="confirm-title"
      aria-describedby={description ? "confirm-desc" : undefined}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] animate-fade-up rounded-xl bg-white p-0 shadow-2xl backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex gap-4 p-5">
        {tone === "danger" && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <h2 id="confirm-title" className="text-base font-bold text-navy-900">
            {title}
          </h2>
          {description && (
            <p id="confirm-desc" className="mt-1 text-sm text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-3">
        <Button type="button" variant="outline" onClick={() => close(false)} autoFocus>
          {cancelLabel}
        </Button>
        <Button type="button" variant={tone === "danger" ? "danger" : "default"} onClick={() => close(true)}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
