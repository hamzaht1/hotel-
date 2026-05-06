import { useForm, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { Send, Paperclip, X } from 'lucide-react'

export type PublicFieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file'

export interface PublicFormField {
  key: string
  type: PublicFieldType
  label_ar: string
  label_en: string
  placeholder_ar?: string
  placeholder_en?: string
  required?: boolean
  options?: string[]
}

interface Props {
  slug: string
  fields: PublicFormField[]
  submitLabelAr?: string | null
  submitLabelEn?: string | null
}

export default function PagePublicForm({ slug, fields, submitLabelAr, submitLabelEn }: Props) {
  const { locale } = usePage<{ locale: 'ar' | 'en' }>().props
  const isArabic = locale === 'ar'
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const initial: Record<string, unknown> = {}
  for (const f of fields) {
    initial[f.key] = f.type === 'checkbox' ? [] : f.type === 'file' ? null : ''
  }

  const { data, setData, post, processing, errors, recentlySuccessful, reset } =
    useForm<{ data: Record<string, unknown> }>({ data: initial })

  function update(key: string, value: unknown) {
    setData('data', { ...data.data, [key]: value })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post(`/page/${slug}/submit`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        const fresh: Record<string, unknown> = {}
        for (const f of fields) {
          fresh[f.key] = f.type === 'checkbox' ? [] : f.type === 'file' ? null : ''
        }
        setData('data', fresh)
      },
    })
  }

  return (
    <section className="py-8">
      <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
        {recentlySuccessful && (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {isArabic ? 'تم إرسال النموذج بنجاح' : 'Form submitted successfully'}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => {
            const label = (isArabic ? f.label_ar : f.label_en) || f.label_en || f.label_ar || f.key
            const placeholder = (isArabic ? f.placeholder_ar : f.placeholder_en) ?? ''
            const fieldErr = (errors as Record<string, string>)[`data.${f.key}`]
            const value = data.data[f.key]

            return (
              <div key={f.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {label} {f.required && <span className="text-red-500">*</span>}
                </label>

                {f.type === 'textarea' && (
                  <textarea
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-public-primary focus:outline-none focus:ring-1 focus:ring-public-primary"
                    rows={4}
                    required={f.required}
                    placeholder={placeholder}
                    value={(value as string) ?? ''}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                )}

                {(f.type === 'text' || f.type === 'email' || f.type === 'tel' || f.type === 'number') && (
                  <input
                    type={f.type}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-public-primary focus:outline-none focus:ring-1 focus:ring-public-primary"
                    required={f.required}
                    placeholder={placeholder}
                    value={(value as string) ?? ''}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                )}

                {f.type === 'select' && (
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-public-primary focus:outline-none focus:ring-1 focus:ring-public-primary"
                    required={f.required}
                    value={(value as string) ?? ''}
                    onChange={(e) => update(f.key, e.target.value)}>
                    <option value="">{isArabic ? '— اختر —' : '— Select —'}</option>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}

                {f.type === 'radio' && (
                  <div className="space-y-1.5">
                    {(f.options ?? []).map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm">
                        <input type="radio" name={f.key} value={o} required={f.required}
                          checked={value === o}
                          onChange={() => update(f.key, o)} />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                )}

                {f.type === 'checkbox' && (
                  <div className="space-y-1.5">
                    {(f.options ?? []).map((o) => {
                      const arr = Array.isArray(value) ? (value as string[]) : []
                      const checked = arr.includes(o)
                      return (
                        <label key={o} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked ? [...arr, o] : arr.filter((x) => x !== o)
                              update(f.key, next)
                            }} />
                          <span>{o}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {f.type === 'file' && (
                  <div className="space-y-2">
                    <input
                      ref={(el) => { fileRefs.current[f.key] = el }}
                      type="file"
                      required={f.required && !(value instanceof File)}
                      onChange={(e) => update(f.key, e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => fileRefs.current[f.key]?.click()}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                        <Paperclip className="h-3.5 w-3.5" /> {isArabic ? 'اختر ملف' : 'Choose file'}
                      </button>
                      {value instanceof File && (
                        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                          {value.name}
                          <button type="button" onClick={() => { update(f.key, null); if (fileRefs.current[f.key]) fileRefs.current[f.key]!.value = '' }}>
                            <X className="h-3 w-3 text-red-500" />
                          </button>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{isArabic ? 'الحد الأقصى: 20 ميجا' : 'Max 20 MB'}</p>
                  </div>
                )}

                {fieldErr && <p className="text-xs text-red-600">{fieldErr}</p>}
              </div>
            )
          })}

          <button type="submit" disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-public-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
            <Send className="h-4 w-4" />
            {isArabic ? (submitLabelAr || 'إرسال') : (submitLabelEn || 'Submit')}
          </button>
        </form>
      </div>
    </section>
  )
}
