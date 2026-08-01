import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import FormInput from "@/components/public/setup/FormInput";
import CustomFields, { type CustomFieldCfg } from "@/components/public/setup/CustomFields";
import SetupBanner from '@/components/public/setup/SetupBanner'
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface FormConfig {
  custom_fields?: CustomFieldCfg[]
  require_email_verification: boolean
  require_phone_verification: boolean
}

interface Props {
  setup: Record<string, string>
  formConfig: FormConfig
}

export default function Org({ setup, formConfig }: Props) {
  const { __ } = useLang()
  const serverErrors = usePage().props.errors as Record<string, string>;

  const [nameAr, setNameAr] = useState(setup?.org_name_ar || "");
  const [nameEn, setNameEn] = useState(setup?.org_name_en || "");
  // Values for admin-defined custom fields (keyed by field key).
  const [custom, setCustom] = useState<Record<string, string>>(
    ((setup as unknown as { custom_fields?: Record<string, string> })?.custom_fields) ?? {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const slug = useMemo(() => {
    return nameEn.trim().toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, [nameEn]);

  const siteUrl = slug ? `www.${slug}.com` : "www.example.com";

  const submitNext = () => {
    const nextErrors: Record<string, string> = {};
    const required = __("messages.setup.org.required_field");
    if (!nameAr.trim()) nextErrors.org_name_ar = required;
    if (!nameEn.trim()) nextErrors.org_name_en = required;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setProcessing(true);
    router.post("/setup/org", {
      org_name_ar: nameAr,
      org_name_en: nameEn,
      custom,
    }, {
      onFinish: () => setProcessing(false),
    });
  };

  const goPrev = () => {
    router.visit("/setup/template");
  };

  return (
    <PublicLayout>
      <section className="py-10">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <SetupBanner />
          <div className="mx-auto rounded-3xl border border-public-border bg-white p-6 sm:p-8 shadow-sm">
            <AnimatedHeading dir="up" delay={0.30}>
              <h1 className="mb-6 text-center text-2xl sm:text-3xl font-extrabold text-public-primary">
                {__("messages.setup.org.title")}
              </h1>
            </AnimatedHeading>
            <div className="grid gap-5">
              <FormInput
                id="nameAr"
                label={__("messages.setup.org.name_ar_label")}
                placeholder={__("messages.setup.org.name_ar_placeholder")}
                value={nameAr}
                onChange={setNameAr}
                required
                error={errors.org_name_ar ?? null}
              />
              <FormInput
                id="nameEn"
                label={__("messages.setup.org.name_en_label")}
                placeholder={__("messages.setup.org.name_en_placeholder")}
                value={nameEn}
                onChange={setNameEn}
                required
                error={errors.org_name_en ?? serverErrors?.org_name_en ?? null}
                inputMode="text"
              />
              <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-sm">
                <span className="text-slate-700">{__("messages.setup.org.site_url_label")}</span>
                <span className="font-bold text-public-primary">{siteUrl}</span>
              </div>
              <p className="text-[12px] font-semibold text-red-600">
                {__("messages.setup.org.site_url_note")}
              </p>

              <CustomFields
                fields={formConfig?.custom_fields}
                step="org"
                values={custom}
                onChange={(k, v) => setCustom((prev) => ({ ...prev, [k]: v }))}
                errors={serverErrors}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={goPrev} className="rounded-xl border border-public-primary bg-white px-5 py-2 font-semibold text-public-primary hover:bg-public-primary/5">
                {__("messages.setup.org.previous")}
              </button>
              <button type="button" onClick={submitNext} disabled={processing} className="rounded-xl bg-public-primary px-6 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {__("messages.setup.org.next")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
