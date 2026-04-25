import React from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import { CheckCircle2 } from "lucide-react";

export default function Complete() {
  return (
    <PublicLayout>
      <Head title="تم التفعيل | ضيافة" />
      <section className="py-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-green-100">
            <CheckCircle2 className="size-10 text-green-600" />
          </div>
          <h1 className="mb-3 text-3xl font-extrabold text-slate-900">
            تم الدفع وتفعيل حسابك بنجاح!
          </h1>
          <p className="mb-8 text-slate-600">
            تم إنشاء حسابك وتفعيله. يمكنك الآن تسجيل الدخول وإدارة موقع فندقك.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-public-primary px-8 py-3 font-semibold text-white hover:opacity-90 transition-all"
          >
            تسجيل الدخول
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
