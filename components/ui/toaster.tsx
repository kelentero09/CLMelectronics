"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  // Offset below the 64px sticky header so toasts never cover the navigation.
  return <SonnerToaster position="top-right" richColors closeButton offset={{ top: 76 }} mobileOffset={{ top: 72, left: 12, right: 12 }} />;
}

export { toast };
