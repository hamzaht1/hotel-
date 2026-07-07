import React from 'react'
import { usePage } from '@inertiajs/react'

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select'

export interface CustomFieldCfg {
  key: string
  label_ar: string
  label_en: string
  type: CustomFieldType
  step: 'org' | 'account'
  required: boolean
  enabled: boolean
  options: string[]
}

interface Props {
  fields?: CustomFieldCfg[]
  step: 'org' | 'account'
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  // Server validation errors, keyed as `custom.<key>`.
  errors?: Record<string, string>
}

const fieldBase =
  'h-12 w-full rounded-xl bg-gray-100 px-4 text-start text-gray-900 placeholder:text-gray-500 outline-none ring-0 focus:bg-white focus:ring-2 focus:ring-public-primary/30'

/**
 * Renders the super-admin-defined custom registration fields for one wizard
 * step. Values live in a `{ key: value }` map owned by the parent step.
 */
export default function CustomFields({ fields, step, values, onChange, errors = {} }: Props) {
  const isArabic = usePage<{ locale?: string }>().props.locale === 'ar'
  const rows = (fields ?? []).filter((f) => f.enabled && f.step === step)
  if (rows.length === 0) return null

  return (
    <>
      {rows.map((f) => {
        const label = (isArabic ? f.label_ar : f.label_en) || f.label_en || f.label_ar
        const value = values[f.key] ?? ''
        const error = errors[`custom.${f.key}`] ?? null
        const set = (v: string) => onChange(f.key, v)

        return (
          <div key={f.key} className="flex flex-col">
            <label htmlFor={f.key} className="mb-2 text-start text-sm font-semibold text-gray-900">
              {label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>

            {f.type === 'textarea' ? (
              <textarea
                id={f.key}
                required={f.required}
                value={value}
                onChange={(e) => set(e.target.value)}
                rows={3}
                className={`${fieldBase} h-auto py-3`}
              />
            ) : f.type === 'select' ? (
              <select
                id={f.key}
                required={f.required}
                value={value}
                onChange={(e) => set(e.target.value)}
                className={fieldBase}
              >
                <option value="">{isArabic ? 'اختر...' : 'Select...'}</option>
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={f.key}
                type={f.type === 'tel' ? 'tel' : f.type}
                inputMode={f.type === 'number' ? 'numeric' : f.type === 'tel' ? 'tel' : undefined}
                required={f.required}
                value={value}
                onChange={(e) => set(e.target.value)}
                className={fieldBase}
              />
            )}

            {error && <div className="mt-1 text-[12px] font-semibold text-red-600">{error}</div>}
          </div>
        )
      })}
    </>
  )
}
