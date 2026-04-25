  // resources/js/components/landing/Contact.tsx
  import { useState } from 'react'
  import { MapPin, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react'
  import { router } from '@inertiajs/react'
  import { CONTACT_FORM_FIELDS } from '@/data/public-data'
  import { useLang } from '@/hooks/useLang'
  import { Button } from '@/components/public/common'
  import contact from '@/assets/images/icons/contact.svg'
  import line from '@/assets/images/icons/contact-line.svg'


  import AnimatedHeading from '@/components/motion/AnimatedHeading'
  import AnimatedImage from '@/components/motion/AnimatedImage'

  /**
   * Contact component - Contact form with company information
   * Displays contact form for hotel inquiries and company contact details
   */
  export default function Contact() {
  const { __ } = useLang()
    // Types derived from CONTACT_FORM_FIELDS
    type FieldDef = typeof CONTACT_FORM_FIELDS[number]
    type FieldName = FieldDef['name']

    type FormData = Record<FieldName, string> & { message: string }

    const initialData: FormData = {
      fullName: '',
      email: '',
      phone: '',
      hotelName: '',
      location: '',
      message: '',
    }

    const [formData, setFormData] = useState<FormData>(initialData)
    const [submitting, setSubmitting] = useState(false)
    const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const name = e.target.name as FieldName | 'message'
      setFormData(prev => ({ ...prev, [name]: e.target.value }))
    }

    // Submit the contact form to the public POST /contact endpoint.
    // The ContactController persists a ContactMessage (and mirrors into
    // support_messages for tenant-scoped submissions). We fold hotel name +
    // location into the `subject`/`message` fields since the backend only
    // stores name/email/phone/subject/message.
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitting(true)
      setSubmitState('idle')
      setErrorMessage(null)

      const subject = [formData.hotelName, formData.location].filter(Boolean).join(' — ')
      const payload = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        subject: subject || 'Landing contact',
        message: formData.message,
      }

      try {
        const res = await fetch('/contact', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''),
          },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
        })
        if (!res.ok) {
          let msg = 'submission_failed'
          try {
            const body = await res.json()
            msg = body.message || msg
          } catch {
            // ignore parse error
          }
          setErrorMessage(msg)
          setSubmitState('error')
        } else {
          setSubmitState('success')
          setFormData(initialData)
        }
      } catch (err) {
        setErrorMessage('network_error')
        setSubmitState('error')
      } finally {
        setSubmitting(false)
      }
    }

    // Company contact information with icons
    const contactInfo = [
      { icon: MapPin, text: __("messages.contact_info.address") },
      { icon: Mail, text: __("messages.contact_info.email") },
      { icon: Phone, text: __("messages.contact_info.phone") },
    ]

    return (
      <section id="contact" className="pt-14 sm:py-10 lg:pt-24">
        <div className="mx-auto max-w-7xl px-2 sm:px-6">
          {/* Section title */}
          <AnimatedHeading dir="up" delay={0.30}>
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="text-public-active">{__("messages.section_titles.contact.title")}</span>
              <span className="text-public-primary">{__("messages.section_titles.contact.subtitle")}</span>
            </h2>
          </AnimatedHeading>
          {/* Main content grid */}
          <div className="mt-4 sm:mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Contact information sidebar */}
            <aside className="order-2 lg:order-2 lg:col-span-1">
              <div className="rounded-2xl bg-white p-6">
                {/* Contact illustration */}
                <div className="mb-6 flex flex-col">
                  <AnimatedImage dir="down" src={contact} alt={__("messages.contact_ui.illustration_alt")} aria-hidden className="w-auto md:h-92" />
                  <AnimatedImage dir="up" src={line} aria-hidden className="mt-3 h-3 w-auto" />
                  <span className="sr-only">{__("messages.contact_ui.sr_only")}</span>
                </div>

                {/* Contact methods list */}
                <h3 className="mb-4 text-xl text-center font-bold text-[#01004c]">{__("messages.contact_ui.methods_title")}</h3>
                <ul className="space-y-4">
                  {contactInfo.map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-start justify-end gap-3">
                      <Icon className="h-5 w-5 shrink-0 text-[#01004c]" />
                      <div className="flex-1 text-start text-gray-800">{text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Contact form */}
            <form
              onSubmit={handleSubmit}
              className="order-1 lg:order-1 lg:col-span-2 rounded-2xl bg-white p-6 sm:p-8"
            >
              {/* Form fields grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Dynamic form fields */}
                {CONTACT_FORM_FIELDS.map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label htmlFor={field.name} className="mb-2 text-start text-sm font-semibold text-gray-900">
                      {field.labelKey ? __(field.labelKey) : ''}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholderKey ? __(field.placeholderKey) : ''}
                      autoComplete={field.autoComplete as string | undefined}
                      className="h-12 rounded-xl bg-gray-100 px-4 text-start text-gray-900 placeholder:text-gray-500
                                outline-none ring-0 focus:bg-white focus:ring-2 focus:ring-public-primary/30"
                    />
                  </div>
                ))}

                {/* Message textarea */}
                <div className="sm:col-span-2 flex flex-col">
                  <label htmlFor="message" className="mb-2 text-start text-sm font-semibold text-gray-900">
                    {__("messages.contact_ui.message_label")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={__("messages.contact_ui.message_placeholder")}
                    className="min-h-40 rounded-xl bg-gray-100 px-4 py-3 text-start text-gray-900 placeholder:text-gray-500
                              outline-none ring-0 focus:bg-white focus:ring-2 focus:ring-public-primary/30 resize-y"
                  />
                </div>
              </div>

              {/* Submit state + button */}
              {submitState === 'success' && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{__("messages.contact_ui.success") || 'تم إرسال رسالتك بنجاح'}</span>
                </div>
              )}
              {submitState === 'error' && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage ?? __("messages.contact_ui.error") ?? 'حدث خطأ، أعد المحاولة'}</span>
                </div>
              )}

              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={submitting}
                >
                  {submitting
                    ? (__("messages.contact_ui.sending") || '...')
                    : __("messages.contact_ui.send_button")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    )
  }
