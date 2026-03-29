import React, { useMemo } from "react";
import { router } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import SetupBanner from "@/components/public/setup/SetupBanner";
import { plans as fallbackPlans } from "@/components/public/Pricing/plans";
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface Props {
  setup: {
    plan_key?: string
    plan_name?: string
    template_id?: string
    template_title?: string
    org_name_ar?: string
    org_name_en?: string
    site_url?: string
    username?: string
    email?: string
  }
}

export default function Review({ setup }: Props) {
  const { __ } = useLang()

  const plan = useMemo(() => {
    return fallbackPlans.find((p) => p.key === setup.plan_key) ?? {
      key: "", name: setup.plan_name || "—", price: "0", period: "",
    };
  }, [setup]);

  const priceNumber = useMemo(
    () => Number(String((plan as any).price).replace(/,/g, "")) || 0,
    [plan]
  );

  const priceFormatted = priceNumber.toLocaleString("en-US");
  const setupFees = 0;
  const total = priceNumber + setupFees;

  const nextDue = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const goPrev = () => router.visit("/setup/account");

  const goNext = () => router.visit("/setup/payment-method");

  function replace(text: string, replaces: Record<string, string | number>) {
    return Object.entries(replaces).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), text);
  }

  return (
    <PublicLayout>
      <section className="py-10">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SetupBanner />
          <div className="mx-auto rounded-3xl border border-public-border bg-white p-6 sm:p-8 shadow-sm">
            <AnimatedHeading dir="up" delay={0.30}>
              <h1 className="mb-6 text-center text-2xl sm:text-3xl font-extrabold text-public-primary">
                {__("messages.setup.review.title")}
              </h1>
            </AnimatedHeading>

            <div className="mx-auto max-w-4xl">
              {/* Summary table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-900">
                  <div className="text-right">{__("messages.setup.review.table.description")}</div>
                  <div className="text-left">{__("messages.setup.review.table.total")}</div>
                </div>

                {/* Org info */}
                <div className="grid grid-cols-2 px-6 py-4 border-b">
                  <div className="text-right text-slate-700">اسم المنشأة</div>
                  <div className="text-left font-semibold">{setup.org_name_ar} / {setup.org_name_en}</div>
                </div>

                {/* Template */}
                <div className="grid grid-cols-2 px-6 py-4 border-b">
                  <div className="text-right text-slate-700">القالب المختار</div>
                  <div className="text-left font-semibold">{setup.template_title || "—"}</div>
                </div>

                {/* Account */}
                <div className="grid grid-cols-2 px-6 py-4 border-b">
                  <div className="text-right text-slate-700">الحساب</div>
                  <div className="text-left font-semibold">{setup.username} ({setup.email})</div>
                </div>

                {/* Plan */}
                <div className="grid grid-cols-2 px-6 py-4 border-b">
                  <div className="text-right text-slate-700">
                    {__("messages.setup.review.plan_label")} {plan.name}
                  </div>
                  <div className="text-left font-semibold">
                    {priceFormatted} {__("messages.common.currency")}
                    {plan.period ? ` / ${plan.period}` : ""}
                  </div>
                </div>

                {/* Setup fees */}
                <div className="grid grid-cols-2 px-6 py-4 border-b">
                  <div className="text-right text-slate-700">{__("messages.setup.review.setup_fees")}</div>
                  <div className="text-left font-semibold">0.00 {__("messages.common.currency")}</div>
                </div>

                {/* Total */}
                <div className="grid grid-cols-2 px-6 py-4 bg-slate-50">
                  <div className="text-right font-bold text-slate-900">{__("messages.setup.review.total_label")}</div>
                  <div className="text-left font-extrabold text-lg">
                    {total.toLocaleString("en-US")} {__("messages.common.currency")}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs sm:text-sm text-slate-600">
                {replace(__("messages.setup.review.next_due_template"), {
                  period: plan.period ? __("messages.setup.review.period_after_year") : "",
                  price: priceFormatted + ' ' + __("messages.common.currency"),
                  date: nextDue,
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={goPrev} className="rounded-xl border border-public-primary bg-white px-5 py-2 font-semibold text-public-primary hover:bg-public-primary/5">
                {__("messages.setup.review.previous")}
              </button>
              <button type="button" onClick={goNext} className="rounded-xl bg-public-primary px-6 py-2 font-semibold text-white hover:opacity-90">
                {__("messages.setup.review.create_site")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
