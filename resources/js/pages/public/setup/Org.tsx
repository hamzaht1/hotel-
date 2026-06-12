import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import FormInput from "@/components/public/setup/FormInput";
import SetupBanner from '@/components/public/setup/SetupBanner'
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface Props {
  setup: Record<string, string>
}

export default function Org({ setup }: Props) {
  const { __ } = useLang()
  const serverErrors = usePage().props.errors as Record<string, string>;

  const [nameAr, setNameAr] = useState(setup?.org_name_ar || "");
  const [nameEn, setNameEn] = useState(setup?.org_name_en || "");
  const [errors, setErrors] = useState<{ nameAr?: string; nameEn?: string }>({});
  const [processing, setProcessing] = useState(false);

  // Optional official establishment data (pre-fills the account "بيانات المنشأة").
  const isAr = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const [activity, setActivity] = useState(setup?.commercial_activity || "");
  const [branches, setBranches] = useState(setup?.branches_count || "");
  const [managerType, setManagerType] = useState(setup?.manager_type || "");
  const [position, setPosition] = useState(setup?.responsible_position || "");
  const [crNumber, setCrNumber] = useState(setup?.cr_number || "");
  const [vatNumber, setVatNumber] = useState(setup?.vat_number || "");
  const [tourismLicense, setTourismLicense] = useState(setup?.license_number || "");
  const [tourismExpiry, setTourismExpiry] = useState(setup?.license_expiry || "");
  const [municipalityLicense, setMunicipalityLicense] = useState(setup?.municipality_license_number || "");
  const [municipalityExpiry, setMunicipalityExpiry] = useState(setup?.municipality_license_expiry || "");

  const slug = useMemo(() => {
    return nameEn.trim().toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, [nameEn]);

  const siteUrl = slug ? `www.${slug}.com` : "www.example.com";

  const submitNext = () => {
    const nextErrors: typeof errors = {};
    if (!nameAr.trim()) nextErrors.nameAr = __("messages.setup.org.required_field");
    if (!nameEn.trim()) nextErrors.nameEn = __("messages.setup.org.required_field");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setProcessing(true);
    router.post("/setup/org", {
      org_name_ar: nameAr,
      org_name_en: nameEn,
      commercial_activity: activity,
      branches_count: branches,
      manager_type: managerType,
      responsible_position: position,
      cr_number: crNumber,
      vat_number: vatNumber,
      license_number: tourismLicense,
      license_expiry: tourismExpiry,
      municipality_license_number: municipalityLicense,
      municipality_license_expiry: municipalityExpiry,
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
                error={errors.nameAr ?? null}
              />
              <FormInput
                id="nameEn"
                label={__("messages.setup.org.name_en_label")}
                placeholder={__("messages.setup.org.name_en_placeholder")}
                value={nameEn}
                onChange={setNameEn}
                required
                error={errors.nameEn ?? serverErrors?.org_name_en ?? null}
                inputMode="text"
              />
              <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-sm">
                <span className="text-slate-700">{__("messages.setup.org.site_url_label")}</span>
                <span className="font-bold text-public-primary">{siteUrl}</span>
              </div>
              <p className="text-[12px] font-semibold text-red-600">
                {__("messages.setup.org.site_url_note")}
              </p>

              {/* Optional official establishment data */}
              <details className="mt-2 rounded-2xl border border-public-border p-4">
                <summary className="cursor-pointer select-none font-semibold text-public-primary">
                  {isAr ? 'بيانات المنشأة الرسمية (اختياري)' : 'Official establishment data (optional)'}
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <LabeledInput label={isAr ? 'نوع النشاط' : 'Activity type'} value={activity} onChange={setActivity} placeholder={isAr ? 'فندق' : 'Hotel'} />
                  <LabeledInput label={isAr ? 'عدد الفروع' : 'Branches'} value={branches} onChange={setBranches} type="number" />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">{isAr ? 'من يدير المنشأة' : 'Managed by'}</label>
                    <select value={managerType} onChange={(e) => setManagerType(e.target.value)} className="w-full rounded-xl border border-public-border px-3 py-2.5 text-sm outline-none focus:border-public-primary">
                      <option value="">{isAr ? 'اختر' : 'Select'}</option>
                      <option value="owner">{isAr ? 'مالك' : 'Owner'}</option>
                      <option value="manager">{isAr ? 'مدير' : 'Manager'}</option>
                    </select>
                  </div>
                  <LabeledInput label={isAr ? 'منصب المسؤول' : 'Responsible position'} value={position} onChange={setPosition} placeholder={isAr ? 'مدير عام' : 'General Manager'} />
                  <LabeledInput label={isAr ? 'رقم السجل التجاري' : 'CR number'} value={crNumber} onChange={setCrNumber} />
                  <LabeledInput label={isAr ? 'الرقم الضريبي (VAT)' : 'VAT number'} value={vatNumber} onChange={setVatNumber} />
                  <LabeledInput label={isAr ? 'رقم ترخيص وزارة السياحة' : 'Tourism license number'} value={tourismLicense} onChange={setTourismLicense} />
                  <LabeledInput label={isAr ? 'انتهاء الترخيص السياحي' : 'Tourism license expiry'} value={tourismExpiry} onChange={setTourismExpiry} type="date" />
                  <LabeledInput label={isAr ? 'رقم رخصة البلدية (بلدي)' : 'Municipality license (Balady)'} value={municipalityLicense} onChange={setMunicipalityLicense} />
                  <LabeledInput label={isAr ? 'انتهاء رخصة البلدية' : 'Municipality license expiry'} value={municipalityExpiry} onChange={setMunicipalityExpiry} type="date" />
                </div>
                <p className="mt-3 text-[12px] text-slate-500">
                  {isAr ? 'يمكنك تعبئتها لاحقاً من لوحة التحكم.' : 'You can also fill these later from your dashboard.'}
                </p>
              </details>
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

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-public-border px-3 py-2.5 text-sm outline-none focus:border-public-primary"
      />
    </div>
  );
}
