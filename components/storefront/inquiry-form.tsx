"use client";

import { useState } from "react";
import { submitInquiry } from "@/app/actions/public-inquiries";
import { Input, Textarea, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function InquiryForm({
  productId,
  productLabel,
  compact = false,
}: {
  productId?: string | null;
  productLabel?: string | null;
  compact?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const result = await submitInquiry(formData);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Could not send your inquiry. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-lg font-bold text-navy-900">Inquiry received</p>
          <p className="mt-1 text-sm text-slate-600">
            Thank you. CLM Electronics Engineering Services will get back to you.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-bold text-navy-900">
          {productLabel ? `Inquire About This Product` : "Send a General Inquiry"}
        </h2>
        {productLabel && <p className="mt-1 text-sm text-slate-500">{productLabel}</p>}
        <form
          action={handleSubmit}
          className={`mt-4 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}
          aria-label="Inquiry form"
        >
          {productId && <input type="hidden" name="productId" value={productId} />}
          {/* Honeypot — humans leave this empty */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div>
            <Label htmlFor="inq-name">Name *</Label>
            <Input id="inq-name" name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your full name" />
          </div>
          <div>
            <Label htmlFor="inq-company">Company</Label>
            <Input id="inq-company" name="company" maxLength={200} autoComplete="organization" placeholder="Company name" />
          </div>
          <div>
            <Label htmlFor="inq-email">Email *</Label>
            <Input id="inq-email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@company.com" />
          </div>
          <div>
            <Label htmlFor="inq-phone">Phone</Label>
            <Input id="inq-phone" name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="+63 ..." />
          </div>
          <div className={compact ? "" : "sm:col-span-2"}>
            <Label htmlFor="inq-message">Message * (min 10 characters)</Label>
            <Textarea id="inq-message" name="message" required minLength={10} maxLength={5000} rows={5} placeholder="Product reference, quantity needed, application, timeline…" />
          </div>
          <FieldError message={error} />
          <div className={compact ? "" : "sm:col-span-2"}>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:px-10">
              {pending ? "Sending…" : "Request Information"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
