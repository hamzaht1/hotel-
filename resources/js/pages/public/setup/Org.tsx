import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PublicLayout from "@/layouts/public-layout";
import FormInput from "@/components/public/setup/FormInput";
import SetupBanner from '@/components/public/setup/SetupBanner'
import AnimatedHeading from '@/components/motion/AnimatedHeading'
import { useLang } from '@/hooks/useLang'

interface FieldCfg { enabled: boolean; required: boolean }
interface FormConfig {
  fields: Record<string, FieldCfg>
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

  const fields = formConfig?.fields ?? {};
  const shown = (k: string) => fields[k]?.enabled ?? true;
  const req = (k: string) => (fields[k]?.enabled ?? true) && (fields[k]?.required ?? false);
  const star = (k: string) => (req(k) ? ' *' : '');

  const [nameAr, setNameAr] = useState(setup?.org_name_ar || "");
  const [nameEn, setNameEn] = useState(setup?.org_name_en || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Establishment fields keyed by their config key.
  const extraValues: Record<string, string> = {
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
  };
  const anyExtraRequired = Object.keys(extraValues).some((k) => req(k));

  const submitNext = () => {
    const nextErrors: Record<string, string> = {};
    const required = __("messages.setup.org.required_field");
    if (!nameAr.trim()) nextErrors.org_name_ar = required;
    if (!nameEn.trim()) nextErrors.org_name_en = required;
    Object.entries(extraValues).forEach(([k, v]) => {
      if (req(k) && !String(v ?? '').trim()) nextErrors[k] = required;
    });
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

              {/* Official establishment data — visibility/requiredness per admin config */}
              {(shown('commercial_activity') || shown('branches_count') || shown('manager_type') || shown('responsible_position') || shown('cr_number') || shown('vat_number') || shown('license_number') || shown('license_expiry') || shown('municipality_license_number') || shown('municipality_license_expiry')) && (
                <details className="mt-2 rounded-2xl border border-public-border p-4" open={anyExtraRequired}>
                  <summary className="cursor-pointer select-none font-semibold text-public-primary">
                    {isAr ? 'بيانات المنشأة الرسمية' : 'Official establishment data'}
                    {!anyExtraRequired && (isAr ? ' (اختياري)' : ' (optional)')}
                  </summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {shown('commercial_activity') && <LabeledInput label={(isAr ? 'نوع النشاط' : 'Activity type') + star('commercial_activity')} value={activity} onChange={setActivity} placeholder={isAr ? 'فندق' : 'Hotel'} error={errors.commercial_activity} />}
                    {shown('branches_count') && <LabeledInput label={(isAr ? 'عدد الفروع' : 'Branches') + star('branches_count')} value={branches} onChange={setBranches} type="number" error={errors.branches_count} />}
                    {shown('manager_type') && (
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{(isAr ? 'من يدير المنشأة' : 'Managed by') + star('manager_type')}</label>
                        <select value={managerType} onChange={(e) => setManagerType(e.target.value)} className="w-full rounded-xl border border-public-border px-3 py-2.5 text-sm outline-none focus:border-public-primary">
                          <option value="">{isAr ? 'اختر' : 'Select'}</option>
                          <option value="owner">{isAr ? 'مالك' : 'Owner'}</option>
                          <option value="manager">{isAr ? 'مدير' : 'Manager'}</option>
                        </select>
                        {errors.manager_type && <p className="mt-1 text-[12px] text-red-600">{errors.manager_type}</p>}
                      </div>
                    )}
                    {shown('responsible_position') && <LabeledInput label={(isAr ? 'منصب المسؤول' : 'Responsible position') + star('responsible_position')} value={position} onChange={setPosition} placeholder={isAr ? 'مدير عام' : 'General Manager'} error={errors.responsible_position} />}
                    {shown('cr_number') && <LabeledInput label={(isAr ? 'رقم السجل التجاري' : 'CR number') + star('cr_number')} value={crNumber} onChange={setCrNumber} error={errors.cr_number} />}
                    {shown('vat_number') && <LabeledInput label={(isAr ? 'الرقم الضريبي (VAT)' : 'VAT number') + star('vat_number')} value={vatNumber} onChange={setVatNumber} error={errors.vat_number} />}
                    {shown('license_number') && <LabeledInput label={(isAr ? 'رقم ترخيص وزارة السياحة' : 'Tourism license number') + star('license_number')} value={tourismLicense} onChange={setTourismLicense} error={errors.license_number} />}
                    {shown('license_expiry') && <LabeledInput label={(isAr ? 'انتهاء الترخيص السياحي' : 'Tourism license expiry') + star('license_expiry')} value={tourismExpiry} onChange={setTourismExpiry} type="date" error={errors.license_expiry} />}
                    {shown('municipality_license_number') && <LabeledInput label={(isAr ? 'رقم رخصة البلدية (بلدي)' : 'Municipality license (Balady)') + star('municipality_license_number')} value={municipalityLicense} onChange={setMunicipalityLicense} error={errors.municipality_license_number} />}
                    {shown('municipality_license_expiry') && <LabeledInput label={(isAr ? 'انتهاء رخصة البلدية' : 'Municipality license expiry') + star('municipality_license_expiry')} value={municipalityExpiry} onChange={setMunicipalityExpiry} type="date" error={errors.municipality_license_expiry} />}
                  </div>
                  {!anyExtraRequired && (
                    <p className="mt-3 text-[12px] text-slate-500">
                      {isAr ? 'يمكنك تعبئتها لاحقاً من لوحة التحكم.' : 'You can also fill these later from your dashboard.'}
                    </p>
                  )}
                </details>
              )}
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
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string | null;
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
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
