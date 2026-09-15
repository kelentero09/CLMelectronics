import { InquiryForm } from "@/components/storefront/inquiry-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact CLM",
  description: "Contact CLM Electronics Engineering Services in Muntinlupa City, Philippines.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-steel-600">Contact</p>
      <h1 className="mt-2 text-3xl font-bold text-navy-900 sm:text-4xl">Contact CLM</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-lg bg-navy-950 p-6 text-slate-200">
            <h2 className="font-bold text-white">CLM Electronics Engineering Services</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</dt>
                <dd className="mt-0.5">#9 Bayabas St., Mutual Homes Putatan, Muntinlupa City, Philippines</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</dt>
                <dd className="mt-0.5">09979269559 / 88384882</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</dt>
                <dd className="mt-0.5">
                  <a href="mailto:er.canlas23@gmail.com" className="underline hover:text-white">
                    er.canlas23@gmail.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="lg:col-span-3">
          <InquiryForm />
        </div>
      </div>
    </div>
  );
}
