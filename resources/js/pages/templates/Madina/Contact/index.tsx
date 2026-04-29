/**
 * Contact Section - Contact Form and Information
 * 
 * Features:
 * - Contact form with validation
 * - Contact information sidebar with icons
 * - Bilingual form fields (Arabic/English)
 * - Uses template's primary color for buttons and icons
 * - Same structure as Riyadh template
 * 
 * Form submission handled via onConfirm callback
 */
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { MapPin, Mail } from 'lucide-react'
import { LiaPhoneVolumeSolid } from "react-icons/lia"
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import SimpleContactForm from './SimpleContactForm'

// Import images from template folder
import leftLine from '../images/rooms/left-line.svg'
import rightLine from '../images/rooms/right-line.svg'
import leftBackground from '../images/footer/left-background.svg'

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

interface Props {
  contactSettings?: any;
  tenant?: { slug?: string } | null;
}

export default function ContactSection({ contactSettings, tenant }: Props = {}) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const [formStyle, setFormStyle] = useState<'default' | 'simple'>('default')

  // Load contact form style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-contact-form-style')
    if (savedStyle) {
      if (savedStyle === 'simple') {
        setFormStyle('simple')
      } else {
        setFormStyle('default')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'default' | 'simple'; id: string }>
      if (customEvent.detail && customEvent.detail.type) {
        setFormStyle(customEvent.detail.type)
      }
    }
    
    window.addEventListener('madina-contact-form-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-contact-form-style-changed', handleStyleChange)
    }
  }, [])
  
  // Bilingual contact form fields configuration
  const CONTACT_FORM_FIELDS: BilingualFormField[] = [
    { 
      name: 'fullName', 
      type: 'text', 
      labelAr: 'الأسم والكنية',
      labelEn: 'Name and Last Name',
      placeholderAr: 'أدخل الأسم والكنية',
      placeholderEn: 'Enter Name and Last Name',
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
    { 
      name: 'subject', 
      type: 'text', 
      labelAr: 'العنوان',
      labelEn: 'Subject',
      placeholderAr: 'السؤال عن.',
      placeholderEn: 'Question about.',
      autoComplete: 'off'
    },
  ]

  type FieldName = typeof CONTACT_FORM_FIELDS[number]['name']
  type FormShape = Record<FieldName, string> & { message: string; subject?: string }

  // Inertia form: POSTs to the tenant-scoped contact endpoint and surfaces server validation errors.
  const form = useForm<FormShape>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const formData = form.data
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.name as FieldName | 'message' | 'subject'
    const value = name === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value
    form.setData(name as keyof FormShape, value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slug = tenant?.slug
    const url = slug ? `/hotel/${slug}/contact` : '/contact'
    // The backend expects `name` (not `fullName`); transform on the wire only.
    form.transform((d) => ({
      name: d.fullName,
      email: d.email,
      phone: d.phone,
      subject: d.subject,
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

  // Resolve contact information from backend settings or use hardcoded defaults
  const resolvedAddress = contactSettings
    ? (isArabic ? contactSettings.address_ar : contactSettings.address_en) || 'المدينة المنورة، المملكة العربية السعودية'
    : 'المدينة المنورة، المملكة العربية السعودية'

  const resolvedEmail = contactSettings?.email || 'info@madina-hotel.com'
  const resolvedPhone = contactSettings?.phone || contactSettings?.whatsapp || '+966 14 XXX XXXX'

  // Company contact information with icons
  const contactInfo = [
    { icon: MapPin, text: resolvedAddress, ...(contactSettings?.google_maps_url ? { href: contactSettings.google_maps_url } : {}) },
    { icon: Mail, text: resolvedEmail, href: `mailto:${resolvedEmail}` },
    { icon: LiaPhoneVolumeSolid, text: resolvedPhone, href: `tel:${resolvedPhone.replace(/\s/g, '')}` },
  ]
  
  return (
    <section 
      id="contact" 
      className="pt-20 relative" 
    >
      {/* Tree/background image - color follows primary in light mode */}
      <div
        className="madina-contact-bg-pattern madina-section-primary-bg absolute bottom-0 left-0 w-full max-w-2xl h-[80vh] max-h-[600px] pointer-events-none"
        style={{
          transform: 'translateX(-34%)',
          zIndex: 0,
          maskImage: `url(${leftBackground})`,
          WebkitMaskImage: `url(${leftBackground})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'bottom left',
          WebkitMaskPosition: 'bottom left',
          backgroundColor: 'var(--madina-primary)',
          opacity: 0.62,
        }}
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 relative z-10">
        {/* Section title */}
        <div className="relative text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="left line"
              style={{
                maskImage: `url(${leftLine})`,
                WebkitMaskImage: `url(${leftLine})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)'
              }}
            />
            <h2 className="madina-font-heading madina-text-primary relative z-10 text-4xl md:text-5xl font-bold">
              <span>{t('sections.contact.title', 'تواصل معنا')}</span>
          </h2>
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="right line"
              style={{
                maskImage: `url(${rightLine})`,
                WebkitMaskImage: `url(${rightLine})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)'
              }}
            />
          </div>
          <BackgroundTitle 
            text={t('sections.contact.background_title', 'التواصل')} 
            colorClass="dark:text-[rgba(237,237,237,0.2)]"
            colorStyle={{ color: 'var(--madina-primary)', opacity: 0.1 }}
          />
        </div>

        {/* Main content grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Contact information - Left side */}
          <aside className="order-2 lg:order-1 lg:col-span-2">
            <div className="rounded-2xl p-6 sm:p-8">
              {/* Main heading */}
              <h3 className="madina-font-heading madina-text-primary text-3xl md:text-4xl font-bold mb-3">
                {t('sections.contact.contact_info_title', 'قم بالتواصل مع فريقنا')}
              </h3>
              
              {/* Subtitle */}
              <p className="madina-text-secondary text-lg mb-8">
                {t('sections.contact.contact_info_subtitle', 'فريقنا يسعد بالاستماع إليك!')}
              </p>

              {/* Contact methods list */}
              <ul className="space-y-6">
                {contactInfo.map(({ icon: Icon, text, href }, i) => (
                  <li key={i} className="flex items-start gap-4">
                    {/* Icon with SVG background */}
                    <div className="relative w-[53px] h-[54px] flex items-center justify-center flex-shrink-0">
                      <svg width="53" height="54" viewBox="0 0 53 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
                        <path d="M48.4429 53.9845C46.4405 53.931 43.0079 53.8506 38.7368 53.8238C30.9739 53.7702 27.0086 53.931 17.5295 53.9845C15.0043 53.9979 11.0489 54.0113 6.1268 53.9845C5.12068 53.4689 1.82615 52.8327 1.56969 50.8905C0.218338 40.758 2.23057 28.335 0.257792 17.6198C-0.620094 12.8382 0.977857 8.15027 1.56969 3.67667C1.59928 3.25476 1.74723 2.42433 2.60539 1.70775C3.2564 1.16529 4.17375 0.776869 5.24892 0.642929C9.89481 0.0468962 13.7121 -0.0401665 16.474 0.0134095C21.9879 0.113865 22.6883 0.743385 28.508 0.716597C34.9195 0.689809 36.5865 -0.0870455 42.1892 0.0134095C44.9412 0.0602885 47.3776 0.294683 49.4095 0.582654C51.5106 0.877322 53 2.14975 53 3.6097V50.8972C53 52.605 50.9582 53.9912 48.4429 53.9912V53.9845Z" fill="var(--madina-primary)"/>
                      </svg>
                      <Icon className="text-white h-5 w-5 relative z-10" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        {i === 0 ? (isArabic ? 'العنوان' : 'Address') : 
                         i === 1 ? (isArabic ? 'الإيميل' : 'Email') : 
                         (isArabic ? 'الهاتف' : 'Phone')}
                      </div>
                      {href ? (
                        <a
                          href={href}
                          className="text-gray-800 dark:text-[#E5E7EB] hover:opacity-80 transition-colors font-medium block"
                          dir={Icon === LiaPhoneVolumeSolid ? 'ltr' : undefined}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {text}
                        </a>
                      ) : (
                        <div className="text-gray-800 dark:text-[#E5E7EB] font-medium">{text}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Contact form - Right side */}
          {formStyle === 'simple' ? (
            <div className="order-1 lg:order-2 lg:col-span-3">
              <SimpleContactForm
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                fields={CONTACT_FORM_FIELDS}
              />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="order-1 lg:order-2 lg:col-span-3 relative"
              style={{
                minHeight: '734px'
              }}
            >
              {/* Form background SVG */}
              <svg 
                viewBox="0 0 691 734" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="madina-contact-form-bg absolute inset-0 w-full h-full"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path 
                  d="M628.273 725.792C602.469 725.072 558.234 723.991 503.193 723.631C403.155 722.911 352.055 725.072 229.898 725.792C197.357 725.972 146.385 726.152 82.9548 725.792C69.9892 718.859 27.5332 710.306 24.2283 684.195C6.81368 547.968 32.7449 380.949 7.32211 236.889C-3.99103 172.602 16.6014 109.576 24.2283 49.4308C24.6096 43.7584 26.5162 32.5938 37.5751 22.9597C45.9646 15.6667 57.7863 10.4446 71.6417 8.64383C131.512 0.630493 180.705 -0.540016 216.297 0.180283C287.354 1.53085 296.379 9.99439 371.376 9.63424C454 9.27409 475.482 -1.17028 547.683 0.180283C583.148 0.810546 614.545 3.96184 640.731 7.83345C667.806 11.7951 687 28.9023 687 48.5304V684.285C687 707.244 660.687 725.882 628.273 725.882V725.792Z" 
                  className="madina-contact-form-bg-path"
                  shapeRendering="geometricPrecision"
                />
              </svg>
              
              {/* Form content */}
              <div className="relative z-10 p-6 sm:p-8">
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
                {/* Form fields - Vertical layout */}
                <div className="space-y-3">
                {/* Dynamic form fields */}
                {CONTACT_FORM_FIELDS.map((field) => {
                  const label = isArabic ? field.labelAr : field.labelEn
                  const placeholder = isArabic ? field.placeholderAr : field.placeholderEn
                  
                  return (
                    <div key={field.name} className="flex flex-col">
                      <label 
                        htmlFor={field.name} 
                        className="mb-2 text-start text-sm font-semibold text-gray-800 dark:text-[#E5E7EB]"
                      >
                        {label}
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        placeholder={placeholder}
                        autoComplete={field.autoComplete}
                        {...(field.pattern && { pattern: field.pattern })}
                        {...(field.inputMode && { inputMode: field.inputMode })}
                        {...(field.name === 'phone' ? { dir: 'ltr' } : {})}
                        className="h-12 rounded-xl border border-gray-300 dark:bg-[#1E293B]/50 dark:border-[#334155]/50 dark:text-[#E5E7EB] dark:placeholder:text-[#9CA3AF] px-4 text-start text-gray-800 placeholder:text-gray-500
                                outline-none ring-0 transition-all madina-focus-border"
                        style={{ backgroundColor: '#F4F5F6' }}
                      />
                    </div>
                  )
                })}

                {/* Message textarea */}
                <div className="flex flex-col">
                  <label 
                    htmlFor="message" 
                    className="mb-2 text-start text-sm font-semibold text-gray-800 dark:text-gray-200"
                  >
                    {t('sections.contact.form.message', 'الرسالة')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={isArabic ? 'مرحبا انني اريد ان استفسر عن ....' : 'Hello, I would like to inquire about....'}
                    className="min-h-40 rounded-xl border border-gray-300 dark:bg-[#1E293B]/50 dark:border-[#334155]/50 dark:text-[#E5E7EB] dark:placeholder:text-[#9CA3AF] px-4 py-3 text-start text-gray-800 placeholder:text-gray-500
                              outline-none ring-0 resize-y transition-all"
                    style={{ backgroundColor: '#F4F5F6' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--madina-primary)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                    }}
                  />
                </div>
          </div>

              {/* Submit button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={form.processing}
                  className="relative transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    '--focus-ring': 'var(--madina-primary)'
                  } as React.CSSProperties & { '--focus-ring': string }}
                  onFocus={(e) => {
                    e.currentTarget.style.setProperty('--tw-ring-color', 'var(--madina-primary)')
                  }}
                  aria-label={t('sections.contact.form.form_submit', 'إرسال')}
                >
                  <svg width="172" height="48" viewBox="0 0 172 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
                    <path d="M157.211 47.9863C150.713 47.9386 139.573 47.8672 125.712 47.8434C100.519 47.7958 87.6507 47.9386 56.888 47.9863C48.6932 47.9982 35.8567 48.0101 19.8832 47.9863C16.6181 47.5279 5.92638 46.9624 5.09409 45.236C0.708569 36.2293 7.23883 25.1867 0.836607 15.6621C-2.01238 11.4117 3.17342 7.24468 5.09409 3.26815C5.19012 2.89312 5.67025 2.15496 8.45522 1.518C10.568 1.03582 13.545 0.69055 17.0342 0.571493C32.1114 0.0416855 44.4997 -0.0357035 53.4628 0.0119196C71.357 0.101213 73.6299 0.660786 92.5164 0.636975C113.324 0.613163 118.733 -0.0773738 136.916 0.0119196C145.847 0.0535898 153.754 0.26194 160.348 0.517914C167.166 0.779841 172 1.91089 172 3.20862V45.242C172 46.76 165.374 47.9922 157.211 47.9922V47.9863Z" fill="var(--madina-contact-button-bg, var(--madina-primary))"/>
                    <text 
                      x="50%" 
                      y="50%" 
                      dominantBaseline="middle" 
                      textAnchor="middle" 
                    className="madina-font-heading font-semibold text-lg"
                      fill="var(--madina-contact-button-text, white)"
                      style={{ fontSize: '18px', fontWeight: '600' }}
                    >
                      {t('sections.contact.form.form_submit', 'إرسال')}
                    </text>
                  </svg>
                </button>
              </div>
              </div>
            </form>
          )}
        </div>
      </div>
      
    </section>
  )
}
