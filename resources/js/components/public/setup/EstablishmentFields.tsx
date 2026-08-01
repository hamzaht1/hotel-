import React from "react";

/**
 * Official establishment data ("بيانات المنشأة الرسمية"), collected on the
 * payment step of the setup wizard and pre-filling the client-admin account
 * page. Keys and order mirror `RegistrationForm::ESTABLISHMENT_FIELDS`.
 */
export const ESTABLISHMENT_KEYS = [
  "commercial_activity",
  "branches_count",
  "manager_type",
  "responsible_position",
  "cr_number",
  "vat_number",
  "license_number",
  "license_expiry",
  "municipality_license_number",
  "municipality_license_expiry",
] as const;

export type EstablishmentKey = (typeof ESTABLISHMENT_KEYS)[number];
export type EstablishmentValues = Record<EstablishmentKey, string>;

export interface FieldCfg {
  enabled: boolean;
  required: boolean;
}

/** All keys as empty strings, pre-filled from whatever the session already holds. */
export function establishmentValuesFrom(source: Record<string, unknown> = {}): EstablishmentValues {
  return ESTABLISHMENT_KEYS.reduce((acc, key) => {
    const value = source[key];
    acc[key] = value == null ? "" : String(value);
    return acc;
  }, {} as EstablishmentValues);
}

const isEnabled = (fields: Record<string, FieldCfg>, key: string) => fields[key]?.enabled ?? true;
const isRequired = (fields: Record<string, FieldCfg>, key: string) =>
  isEnabled(fields, key) && (fields[key]?.required ?? false);

/** True when the admin left at least one establishment field enabled. */
export function hasEstablishmentFields(fields: Record<string, FieldCfg>): boolean {
  return ESTABLISHMENT_KEYS.some((key) => isEnabled(fields, key));
}

/** Enabled + required fields the user hasn't filled in yet. */
export function missingRequiredEstablishment(
  fields: Record<string, FieldCfg>,
  values: EstablishmentValues,
): EstablishmentKey[] {
  return ESTABLISHMENT_KEYS.filter((key) => isRequired(fields, key) && !values[key].trim());
}

interface Props {
  fields: Record<string, FieldCfg>;
  values: EstablishmentValues;
  onChange: (key: EstablishmentKey, value: string) => void;
  /** Fired when a field loses focus — used to persist the section to the session. */
  onBlur?: () => void;
  errors?: Record<string, string>;
}

export default function EstablishmentFields({ fields, values, onChange, onBlur, errors = {} }: Props) {
  const isAr = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const shown = (key: EstablishmentKey) => isEnabled(fields, key);
  const star = (key: EstablishmentKey) => (isRequired(fields, key) ? " *" : "");
  const anyRequired = ESTABLISHMENT_KEYS.some((key) => isRequired(fields, key));

  if (!hasEstablishmentFields(fields)) {
    return null;
  }

  const field = (key: EstablishmentKey, label: string, extra: { type?: string; placeholder?: string } = {}) =>
    shown(key) && (
      <LabeledInput
        label={label + star(key)}
        value={values[key]}
        onChange={(v) => onChange(key, v)}
        onBlur={onBlur}
        error={errors[key]}
        {...extra}
      />
    );

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" open={anyRequired}>
      <summary className="cursor-pointer select-none font-bold text-slate-900">
        {isAr ? "بيانات المنشأة الرسمية" : "Official establishment data"}
        {!anyRequired && (isAr ? " (اختياري)" : " (optional)")}
      </summary>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {field("commercial_activity", isAr ? "نوع النشاط" : "Activity type", { placeholder: isAr ? "فندق" : "Hotel" })}
        {field("branches_count", isAr ? "عدد الفروع" : "Branches", { type: "number" })}
        {shown("manager_type") && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {(isAr ? "من يدير المنشأة" : "Managed by") + star("manager_type")}
            </label>
            <select
              value={values.manager_type}
              onChange={(e) => onChange("manager_type", e.target.value)}
              onBlur={onBlur}
              className="w-full rounded-xl border border-public-border px-3 py-2.5 text-sm outline-none focus:border-public-primary"
            >
              <option value="">{isAr ? "اختر" : "Select"}</option>
              <option value="owner">{isAr ? "مالك" : "Owner"}</option>
              <option value="manager">{isAr ? "مدير" : "Manager"}</option>
            </select>
            {errors.manager_type && <p className="mt-1 text-[12px] text-red-600">{errors.manager_type}</p>}
          </div>
        )}
        {field("responsible_position", isAr ? "منصب المسؤول" : "Responsible position", {
          placeholder: isAr ? "مدير عام" : "General Manager",
        })}
        {field("cr_number", isAr ? "رقم السجل التجاري" : "CR number")}
        {field("vat_number", isAr ? "الرقم الضريبي (VAT)" : "VAT number")}
        {field("license_number", isAr ? "رقم ترخيص وزارة السياحة" : "Tourism license number")}
        {field("license_expiry", isAr ? "انتهاء الترخيص السياحي" : "Tourism license expiry", { type: "date" })}
        {field("municipality_license_number", isAr ? "رقم رخصة البلدية (بلدي)" : "Municipality license (Balady)")}
        {field("municipality_license_expiry", isAr ? "انتهاء رخصة البلدية" : "Municipality license expiry", {
          type: "date",
        })}
      </div>

      {!anyRequired && (
        <p className="mt-3 text-[12px] text-slate-500">
          {isAr ? "يمكنك تعبئتها لاحقاً من لوحة التحكم." : "You can also fill these later from your dashboard."}
        </p>
      )}
    </details>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
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
        onBlur={onBlur}
        className="w-full rounded-xl border border-public-border px-3 py-2.5 text-sm outline-none focus:border-public-primary"
      />
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
