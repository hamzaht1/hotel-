/**
 * قسم تواصل معنا - قالب الرياض
 */
import { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { MapPin, Mail } from 'lucide-react'
import { LiaPhoneVolumeSolid } from "react-icons/lia"
import line from '@/assets/images/riyadh-template/contact-line.svg'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useMergedSiteTexts } from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'

// Bilingual form field interface
interface BilingualFormField {
  name: string
  type: string
  labelAr: string
  labelEn: string
  placeholderAr: string
  placeholderEn: string
  autoComplete?: string
  pattern?: string
  inputMode?: 'numeric'
}


import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'



interface ContactSectionProps {
  contactSettings?: any;
  tenant?: { slug?: string } | null;
}

export default function ContactSection({ contactSettings, tenant }: ContactSectionProps) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  // Tenant-editable section title (section=contact) from the Site Branding
  // editor; falls back to the bundled translation.
  const siteTexts = useMergedSiteTexts()
  // Bilingual contact form fields configuration
  const CONTACT_FORM_FIELDS: BilingualFormField[] = [
    { 
      name: 'fullName', 
      type: 'text', 
      labelAr: 'الاسم الكامل',
      labelEn: 'Full Name',
      placeholderAr: 'أدخل اسمك الكامل',
      placeholderEn: 'Enter your full name',
      autoComplete: 'name'
    },
    { 
      name: 'email', 
      type: 'email', 
      labelAr: 'البريد الإلكتروني',
      labelEn: 'Email Address',
      placeholderAr: 'أدخل بريدك الإلكتروني',
      placeholderEn: 'Enter your email address',
      autoComplete: 'email'
    },
    { 
      name: 'phone', 
      type: 'text', 
      labelAr: 'رقم الهاتف',
      labelEn: 'Phone Number',
      placeholderAr: 'أدخل رقم هاتفك',
      placeholderEn: 'Enter your phone number',
      autoComplete: 'tel',
      pattern: '[0-9]*',
      inputMode: 'numeric' as const
    },
  ]

  type FieldName = typeof CONTACT_FORM_FIELDS[number]['name']
  type FormShape = Record<FieldName, string> & { message: string }

  // Inertia form: POSTs to the tenant-scoped contact endpoint and surfaces server validation errors.
  const form = useForm<FormShape>({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  })
  const formData = form.data
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.name as FieldName | 'message'
    const value = name === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value
    form.setData(name as keyof FormShape, value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slug = tenant?.slug
    const url = slug ? `/hotel/${slug}/contact` : '/contact'
    form.transform((d) => ({
      name: d.fullName,
      email: d.email,
      phone: d.phone,
      message: d.message,
    }))
    form.post(url, {
      preserveScroll: true,
      onSuccess: () => {
        setSubmitted(true)
        form.reset()
      },
    })
  }

  // Company contact information — use backend data if available
  const contactInfo = [
    { icon: MapPin, text: (isArabic ? contactSettings?.address_ar : contactSettings?.address_en) || 'الرياض، المملكة العربية السعودية' },
    { icon: Mail, text: contactSettings?.email || 'info@diyafa.com', href: `mailto:${contactSettings?.email || 'info@diyafa.com'}` },
    { icon: LiaPhoneVolumeSolid, text: contactSettings?.phone || '+966 666 666 66', href: `tel:${contactSettings?.phone || '+96666666666'}` },
  ]

  return (
    <section data-preview-section="contact" id="contact" className="py-20 ">
      <div className="container mx-auto px-4">
        {/* Section title */}
        <div className="relative text-center mb-12">

          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
              <h2 className="relative z-10 text-4xl md:text-5xl font-bold riyadh-heading ">
                <span className="">{pickSiteText(siteTexts, 'contact', 'title', t('sections.contact.title', 'تواصل معنا'), isArabic)}</span>
              </h2>
            <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
          </div>
          <BackgroundTitle text={t('sections.contact.background_title', 'التواصل')} />
        </div>

        {/* Main content grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Contact information sidebar */}
          <aside className="order-2 lg:order-2 lg:col-span-1">
            <div className="rounded-2xl p-6 border riyadh-border bg-white/60 dark:bg-white/10 dark:border-white/20">
              {/* Contact illustration */}
              <div className="mb-6 flex flex-col">
                <div className="w-auto md:h-96 mx-auto flex items-center justify-center py-8">
                  <LiaPhoneVolumeSolid 
                    className="w-32 h-32 md:w-80 md:h-80 text-public-primary dark:!text-[#4490FF]"
                  />
                </div>
                <img 
                  src={line} 
                  alt="" 
                  className="mt-3 h-3 w-auto dark:brightness-110 line-icon"
                />
              </div>

              {/* Contact methods list */}
              <h3 className="mb-4 text-xl text-center font-bold text-gray-800 dark:!text-white">
                {t('sections.contact.contact_info_title', 'طرق التواصل')}
              </h3>
              <ul className="space-y-2">
                {contactInfo.map(({ icon: Icon, text, href }, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/5 dark:hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full border riyadh-border bg-white/60 dark:bg-white/20 dark:border-white/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-public-primary dark:!text-[#4490FF]" />
                    </div>
                    {href ? (
                      <a
                        href={href}
                        className="flex-1 text-start text-gray-700 dark:!text-gray-200 mt-1 hover:text-[#4490FF] dark:hover:!text-[#4490FF] transition-colors font-medium"
                        dir={Icon === LiaPhoneVolumeSolid ? 'ltr' : undefined}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {text}
                      </a>
                    ) : (
                      <div className="flex-1 text-start text-gray-700 dark:!text-gray-200 mt-1 font-medium">{text}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Contact form */}
          <form
            onSubmit={handleSubmit}
            className="order-1 lg:order-1 lg:col-span-2 rounded-2xl p-6 sm:p-8 border riyadh-border bg-white/60 dark:bg-white/10 dark:border-white/20"
          >
            {submitted && (
              <div className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                {isArabic ? 'تم إرسال رسالتك بنجاح، سنرد عليك قريبًا.' : 'Your message has been sent. We will reply soon.'}
              </div>
            )}
            {Object.keys(form.errors).length > 0 && (
              <div className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                <ul className="list-inside list-disc">
                  {Object.values(form.errors).map((msg, i) => (
                    <li key={i}>{msg as string}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Form fields grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Dynamic form fields */}
              {CONTACT_FORM_FIELDS.map((field) => {
                const label = isArabic ? field.labelAr : field.labelEn
                const placeholder = isArabic ? field.placeholderAr : field.placeholderEn
                
                return (
                  <div key={field.name} className="flex flex-col">
                    <label 
                      htmlFor={field.name} 
                      className="mb-2 text-start text-sm font-semibold text-gray-700 dark:!text-gray-200"
                    >
                      {label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      autoComplete={field.autoComplete}
                      {...(field.pattern && { pattern: field.pattern })}
                      {...(field.inputMode && { inputMode: field.inputMode })}
                      {...(field.name === 'phone' ? { dir: 'ltr' } : {})}
                      className="h-12 rounded-xl border border-gray-300 bg-white dark:!bg-white/10 dark:!border-white/20 dark:!text-white dark:!placeholder:text-gray-400 px-4 text-start text-gray-700 placeholder:text-gray-500
                              outline-none ring-0 focus:border-[#4490FF] dark:focus:!border-[#4490FF] transition-all"
                    />
                  </div>
                )
              })}

              {/* Message textarea */}
              <div className="sm:col-span-2 flex flex-col">
                <label 
                  htmlFor="message" 
                  className="mb-2 text-start text-sm font-semibold text-gray-700 dark:!text-gray-200"
                >
                  {t('sections.contact.form_message', 'الرسالة')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  className="min-h-40 rounded-xl border border-gray-300 bg-white dark:!bg-white/10 dark:!border-white/20 dark:!text-white dark:!placeholder:text-gray-400 px-4 py-3 text-start text-gray-700 placeholder:text-gray-500
                            outline-none ring-0 focus:border-[#4490FF] dark:focus:!border-[#4490FF] resize-y transition-all"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={form.processing}
                className="w-full h-12 rounded-xl bg-[#020151] text-white dark:!bg-[#4490FF] dark:!text-white font-semibold
                         transition-colors duration-300 shadow-md hover:shadow-lg hover:bg-[#030175] dark:hover:!bg-[rgba(68,144,255,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4490FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {form.processing
                  ? (isArabic ? 'جارٍ الإرسال…' : 'Sending…')
                  : t('sections.contact.form_submit', 'إرسال الرسالة')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
