import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, ChevronDown, ChevronUp, Info, Car, Briefcase, Utensils, Dumbbell, BedDouble, Users, Eye, Refrigerator, Star, ShowerHead, CalendarDays, Clock } from 'lucide-react'
import { useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper-bundle.css'
import { Navigation } from 'swiper/modules';

export type BookingType = 'مساج صيني' | 'مساج علاج' | 'غرفة' | 'شقة' | 'جناح'
import roomImage from '@/assets/images/riyadh-template/rooms/room-1.png'
import patternImage from '../../pages/templates/Madina/images/Boking-model/pattern.svg'
import { SERVICE_FEATURE_ICONS } from '@/lib/service-feature-icons'

// A single service feature shown in the details popup (matches the card data).
export interface BookingFeature {
  lucideKey?: string
  emoji?: string | null
  iconUrl?: string
  labelAr: string
  labelEn: string
}

export interface BookingData {
  firstName: string
  lastName: string
  phone: string
  from: string
  to: string
  type: BookingType
  duration?: string
  message: string
}

// Data of the actual service being booked, surfaced into the modal so it
// reflects the clicked card instead of static placeholder content.
export interface BookingService {
  name: string
  description?: string
  image?: string | null
  /** Full gallery (featured first) shown in the popup slider. */
  images?: string[]
  /** Feature icons + labels entered in the admin, shown in the popup. */
  features?: BookingFeature[]
  price?: string
  currency?: string
  // Food (restaurant) serving method, surfaced prominently under the name.
  foodServingMethod?: string | null
  buffetStart?: string | null
  buffetEnd?: string | null
}

interface BookingModalProps {
  open: boolean
  defaultType?: BookingType
  service?: BookingService | null
  onClose: () => void
  onConfirm: (data: BookingData) => void
  variant?: 'room' | 'service'
}

// Available time slots (9 AM to 6 PM)
const TIME_SLOTS: string[] = []
for (let h = 9; h <= 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 18) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

// Arabic month names
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const AR_DAYS = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']
const EN_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Format time for display
function formatTime(t: string, arabic: boolean): string {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr)
  if (arabic) {
    const period = h >= 12 ? 'مساءً' : 'صباحاً'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${mStr} ${period}`
  }
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mStr} ${period}`
}

export default function BookingModal({ open, defaultType = 'غرفة', service = null, onClose, onConfirm, variant = 'room' }: BookingModalProps) {
  const { isArabic } = useTemplateLanguage()
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const [form, setForm] = useState<BookingData>({
    firstName: '',
    lastName: '',
    phone: '',
    from: '',
    to: '',
    type: defaultType,
    duration: '',
    message: '',
  })

  // Separate date and time state
  const [fromDate, setFromDate] = useState('')
  const [fromTime, setFromTime] = useState('')
  const [toDate, setToDate] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toTime, setToTime] = useState('')
  const [duration, setDuration] = useState('') // in minutes string like '30', '45', '60', '120'

  const [errors, setErrors] = useState<Partial<Record<'firstName' | 'lastName' | 'phone' | 'from' | 'to' | 'type' | 'duration', string>>>({})
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [showRoomMore, setShowRoomMore] = useState(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Current month boundaries
  const { daysInMonth, currentYear, currentMonth, today } = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    const lastDay = new Date(y, m + 1, 0).getDate()
    return { daysInMonth: lastDay, currentYear: y, currentMonth: m, today: d }
  }, [])

  // Build calendar grid for the current month
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
    const grid: (number | null)[] = []
    // Empty cells before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) grid.push(null)
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) grid.push(d)
    return grid
  }, [currentYear, currentMonth, daysInMonth])

  // Helper to get date string from day number
  const dateValue = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`
  }

  // Sync date+time into form.from / form.to
  useEffect(() => {
    if (variant === 'service') {
      if (fromDate && fromTime) {
        setForm(prev => ({ ...prev, from: `${fromDate}T${fromTime}` }))
      } else {
        setForm(prev => ({ ...prev, from: '' }))
      }
    } else {
      // room booking: only date needed
      if (fromDate) {
        setForm(prev => ({ ...prev, from: fromDate }))
      } else {
        setForm(prev => ({ ...prev, from: '' }))
      }
    }
  }, [fromDate, fromTime, variant])

  useEffect(() => {
    if (variant === 'service') {
      if (toDate && toTime) {
        setForm(prev => ({ ...prev, to: `${toDate}T${toTime}` }))
      } else {
        setForm(prev => ({ ...prev, to: '' }))
      }
    } else {
      // room booking: only date needed
      if (toDate) {
        setForm(prev => ({ ...prev, to: toDate }))
      } else {
        setForm(prev => ({ ...prev, to: '' }))
      }
    }
  }, [toDate, toTime, variant])

  // For service variant: compute `to` from from + duration (minutes)
  useEffect(() => {
    if (variant === 'service') {
      if (fromDate && fromTime && duration) {
        const dt = new Date(`${fromDate}T${fromTime}`)
        const mins = parseInt(duration, 10)
        dt.setMinutes(dt.getMinutes() + mins)
        const pad = (n: number) => String(n).padStart(2, '0')
        const toIso = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
        setForm(prev => ({ ...prev, to: toIso, duration }))
      } else {
        setForm(prev => ({ ...prev, to: '', duration }))
      }
    }
  }, [fromDate, fromTime, duration, variant])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    // Toggle body class to lower other sections' z-index while modal is open
    if (open) {
      document.body.classList.add('madina-modal-open')
    } else {
      document.body.classList.remove('madina-modal-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('madina-modal-open')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setForm(prev => ({ ...prev, type: defaultType }))
    }
  }, [defaultType, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setForm(prev => ({ ...prev, phone: value }))
  }

  const handleConfirm = () => {
    const newErrors: Partial<Record<'firstName' | 'lastName' | 'phone' | 'from' | 'to' | 'type' | 'duration', string>> = {}
    if (!form.firstName) newErrors.firstName = isArabic ? 'هذا الحقل مطلوب' : 'This field is required'
    if (!form.lastName) newErrors.lastName = isArabic ? 'هذا الحقل مطلوب' : 'This field is required'
    if (!form.phone) newErrors.phone = isArabic ? 'هذا الحقل مطلوب' : 'This field is required'
    // For service variant, only require from date/time
    if (!fromDate || !fromTime) newErrors.from = isArabic ? 'اختر التاريخ والوقت' : 'Select date and time'
    if (variant === 'room' && !toDate) newErrors.to = isArabic ? 'اختر تاريخ المغادرة' : 'Select check-out date'
    if (variant === 'service' && !duration) newErrors.duration = isArabic ? 'اختر مدة الجلسة' : 'Choose session duration'
    if (!form.type) newErrors.type = isArabic ? 'اختر نوع الحجز' : 'Please select a booking type'

    if (variant === 'room' && form.from && form.to && new Date(form.from) >= new Date(form.to)) {
      newErrors.to = isArabic ? 'وقت المغادرة يجب أن يكون بعد الوصول' : 'Check-out must be after check-in'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    onConfirm(form)
  }

  const closeOnBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose()
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-[var(--madina-primary)]'}`

  return (
    <div
      className={`fixed inset-0 z-[1050] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeOnBackdrop}
        className={`absolute inset-0 bg-black/90 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Modal */}
      <div
        className={`madina-booking-modal absolute inset-x-4 top-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-16 w-auto md:w-[680px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'} overflow-hidden`}
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{ maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--madina-booking-modal-bg, #ffffff)', color: isDarkMode ? '#FFFFFF' : undefined }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 relative">
          <div 
            className="absolute left-0 right-0 top-0"
            style={{
              backgroundImage: `url(${patternImage})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto',
              backgroundPosition: 'top',
              opacity: 0.3,
              height: '100%',
              zIndex: 0
            }}
          />
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 relative z-10">
            {isArabic ? 'الحجز' : 'Confirm Booking'}
          </h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative z-10" aria-label={isArabic ? 'إغلاق' : 'Close'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slider and Room Details */}
        <div className="px-5 pt-4">
          <div className="mb-3">
            {(() => {
              // Build the gallery from the service: featured first, then the
              // additional images. Falls back to the placeholder slider only for
              // the room variant (no concrete service).
              const serviceImages = service
                ? (service.images && service.images.length > 0
                    ? service.images
                    : (service.image ? [service.image] : []))
                : []

              if (service && serviceImages.length > 0) {
                return (
                  <Swiper
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation={serviceImages.length > 1}
                    modules={[Navigation]}
                    className="rounded-xl overflow-hidden"
                  >
                    {serviceImages.map((src, i) => (
                      <SwiperSlide key={i}>
                        <img src={src} alt={`${service.name} ${i + 1}`} className="w-full h-48 object-cover" />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )
              }

              if (service) {
                // Service with no images at all → don't show a fake placeholder.
                return null
              }

              return (
                <Swiper
                  spaceBetween={10}
                  slidesPerView={1}
                  navigation
                  modules={[Navigation]}
                  className="rounded-xl overflow-hidden"
                >
                  <SwiperSlide><img src={roomImage} alt="Room 1" className="w-full h-48 object-cover" /></SwiperSlide>
                  <SwiperSlide><img src={roomImage} alt="Room 2" className="w-full h-48 object-cover" /></SwiperSlide>
                  <SwiperSlide><img src={roomImage} alt="Room 3" className="w-full h-48 object-cover" /></SwiperSlide>
                </Swiper>
              )
            })()}
          </div>
          <div className="mb-4 text-gray-700 dark:text-gray-200 text-sm space-y-1">
            {service ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="madina-text-primary text-base font-bold">{service.name}</h4>
                  {service.price && (
                    <span className="madina-text-primary font-bold whitespace-nowrap">
                      {service.price} {service.currency ?? (isArabic ? 'ريال' : 'SAR')}
                    </span>
                  )}
                </div>
                {(() => {
                  // Food serving method, shown bold & prominent right under the
                  // service name. Hidden entirely when there is no food data.
                  const method = service.foodServingMethod
                  if (method !== 'meal' && method !== 'buffet') return null
                  let text: string
                  if (method === 'buffet' && service.buffetStart && service.buffetEnd) {
                    text = isArabic
                      ? `بوفيه من ${formatTime(service.buffetStart, true)} إلى ${formatTime(service.buffetEnd, true)}`
                      : `Buffet from ${formatTime(service.buffetStart, false)} to ${formatTime(service.buffetEnd, false)}`
                  } else if (method === 'buffet') {
                    text = isArabic ? 'بوفيه' : 'Buffet'
                  } else {
                    text = isArabic ? 'وجبة' : 'Meal'
                  }
                  return <p className="madina-text-primary text-base font-bold mt-0.5">{text}</p>
                })()}
                {service.features && service.features.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {service.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 px-2.5 py-1">
                        <ModalFeatureIcon feature={f} />
                        <span className="text-xs font-medium">{isArabic ? f.labelAr : f.labelEn}</span>
                      </div>
                    ))}
                  </div>
                )}
                {service.description && (
                  <div className="rte-content" dangerouslySetInnerHTML={{ __html: service.description }} />
                )}
              </>
            ) : (
              <>
                <div>
                  {isArabic
                    ? 'غرفة نزلاء تضم سرير كوين بمساحة 35 مترا مربعا، وسرير متوسط الحجم، وإطلالة على المدينة، ونافذة من الأرضية إلى السقف، ومنطقة جلوس وشبكة واي فاي مجانية، وتلفزيون LED مقاس 49 بوصة'
                    : 'Guest room with queen bed, 35 sqm, medium-sized bed, city view, floor-to-ceiling window, seating area, free Wi-Fi, 49-inch LED TV'}
                </div>
                {!showRoomMore && (
                  <button
                    className="madina-text-primary dark:text-white font-semibold focus:outline-none text-xs mt-1"
                    onClick={() => setShowRoomMore(true)}
                  >
                    {isArabic ? 'اقرأ المزيد' : 'Read more'}
                  </button>
                )}
                {showRoomMore && (
                  <div>
                    {isArabic
                      ? 'استرح في غرفة النزلاء الأنيقة هذه والتي تضم سرير كوين، ونافذة عازلة للصوت.'
                      : 'Relax in this elegant guest room featuring a queen bed and extended soundproof window.'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Hotel amenities accordion — room-specific placeholder content,
            hidden when booking a concrete service */}
        {!service && (
        <div className="px-5 pb-5 pt-2">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 p-4 mt-2 text-sm">
            <h4 className="font-bold text-gray-800 dark:text-white mb-2">
              {isArabic ? 'تجهيزات ومرافق الفندق' : 'Hotel Facilities & Amenities'}
            </h4>
            <Swiper spaceBetween={16} slidesPerView={3} navigation modules={[Navigation]} className="mb-4">
              <Swiper
                spaceBetween={16}
                slidesPerView={3}
                navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
                modules={[Navigation]}
                className={`mb-4 ${isArabic ? 'swiper-rtl' : ''}`}
                dir={isArabic ? 'rtl' : 'ltr'}
              >
                <SwiperSlide><div className="flex flex-col items-center"><Info className="w-8 h-8 mb-1" /><span>{isArabic ? 'الاستعلامات' : 'Concierge'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Car className="w-8 h-8 mb-1" /><span>{isArabic ? 'شاحن سيارات كهربائية' : 'EV Charger'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Briefcase className="w-8 h-8 mb-1" /><span>{isArabic ? 'صالة رجال الأعمال' : 'Executive Lounge'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Utensils className="w-8 h-8 mb-1" /><span>{isArabic ? 'مطعم داخل الموقع' : 'On-site Restaurant'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Dumbbell className="w-8 h-8 mb-1" /><span>{isArabic ? 'مركز اللياقة البدنية' : 'Fitness Center'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><BedDouble className="w-8 h-8 mb-1" /><span>{isArabic ? 'خدمة الغرف' : 'Room Service'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Users className="w-8 h-8 mb-1" /><span>{isArabic ? 'قاعات اجتماعات' : 'Meeting Rooms'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Eye className="w-8 h-8 mb-1" /><span>{isArabic ? 'الإطلالات: اطلالة على المدينة.' : 'Views: City View'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Refrigerator className="w-8 h-8 mb-1" /><span>{isArabic ? 'مطبخ وتناول الطعام: ثلاجة صغيرة' : 'Kitchen & Dining: Mini Fridge'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><Star className="w-8 h-8 mb-1" /><span>{isArabic ? 'تمييز الغرفة: يرضي النزلاء، تسع لنوم 3 أشخاص' : 'Room Highlight: Guest Favorite, Sleeps 3'}</span></div></SwiperSlide>
                <SwiperSlide><div className="flex flex-col items-center"><ShowerHead className="w-8 h-8 mb-1" /><span>{isArabic ? 'الحمام: منضدة تزيين مزدوجة، دش زجاجي' : 'Bathroom: Double Vanity, Glass Shower'}</span></div></SwiperSlide>
                <div className="swiper-button-prev" style={{ color: 'var(--madina-primary)' }}></div>
                <div className="swiper-button-next" style={{ color: 'var(--madina-primary)' }}></div>
              </Swiper>
            </Swiper>
            <button
              type="button"
              className="flex items-center gap-2 madina-text-primary dark:text-white font-semibold focus:outline-none"
              onClick={() => setDetailsOpen(v => !v)}
            >
              {isArabic ? 'مزيد من التفاصيل عن الغرف' : 'More Room Details'}
              {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <ul className="list-disc list-inside space-y-1">
              {detailsOpen && (
                <>
                  <li className='font-bold my-2'>{isArabic ? 'من أجل راحتك:' : 'For Your Comfort:'}</li>
                  <li>{isArabic ? 'مفرش كثيف متكون من 250 خيط' : '250-thread-count Duvet'}</li>
                  <li>{isArabic ? 'تكييف الهواء' : 'Air Conditioning'}</li>
                  <li>{isArabic ? 'مقعد بذراعين مزود بمسند قدم' : 'Armchair with Ottoman'}</li>
                  <li>{isArabic ? 'شطافة' : 'Bidet'}</li>
                  <li>{isArabic ? 'ستائر تعتيم' : 'Blackout Curtains'}</li>
                  <li>{isArabic ? 'تتوفر وسائد محشوة بالريش الناعم' : 'Feather Pillows Available'}</li>
                  <li>{isArabic ? 'أغطية مفارش' : 'Bed Linens'}</li>
                  <li>{isArabic ? 'سطح المطبخ من الجرانيت / حقائب المستحضرات التجميل' : 'Granite Countertop / Vanity Kit'}</li>
                  <li>{isArabic ? 'قنوات عالية الدقة' : 'HD Channels'}</li>
                  <li>{isArabic ? 'سرير Serenity من هيلتون' : 'Hilton Serenity Bed'}</li>
                  <li>{isArabic ? 'أضواء ليلية خافتة في الحمام' : 'Night Lights in Bathroom'}</li>
                  <li>{isArabic ? 'لغير المدخنين' : 'Non-smoking'}</li>
                  <li>{isArabic ? 'تسع لنوم 3 أشخاص' : 'Sleeps 3'}</li>
                  <li>{isArabic ? 'تلفزيون - بشاشة مسطحة عالية الدقة 49 بوصة' : '49" HD Flat-screen TV'}</li>
                  <li className='font-bold my-2'>{isArabic ? 'من أجل رفاهيتك:' : 'For Your Well-being:'}</li>
                  <li>{isArabic ? 'خدمة تنظيف الغرف على مدار 24 ساعة' : '24-hour Housekeeping'}</li>
                  <li>{isArabic ? 'منافذ كهربية ملائمة' : 'Convenient Power Outlets'}</li>
                  <li>{isArabic ? 'مستحضرات الحمام الخاصة بـ Crabtree and Evelyn' : 'Crabtree and Evelyn Bath Products'}</li>
                  <li>{isArabic ? 'مقابس كهربائية في مستوى المكتب' : 'Desk-level Power Sockets'}</li>
                  <li>{isArabic ? 'غرفة نزلاء تضم سرير كوين بمساحة 35 مترا مربعا، وسرير متوسط الحجم، وإطلالة على المدينة، ونافذة من الأرضية إلى السقف، ومنطقة جلوس وشبكة واي فاي مجانية، وتلفزيون LED مقاس 49 بوصة' : 'Guest Room with Queen Bed, 35 sqm, City View, Floor-to-ceiling Window, Seating Area, Free Wi-Fi, 49" LED TV'}</li>
                </>
              )}
            </ul>
          </div>
        </div>
        )}

        {/* Booking Form */}
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isArabic ? 'الاسم' : 'First Name'} <span className="text-red-600">*</span>
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              className={inputClass(Boolean(errors.firstName))}
              placeholder={isArabic ? 'أدخل الاسم' : 'Enter first name'}
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isArabic ? 'الكنية' : 'Last Name'} <span className="text-red-600">*</span>
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              className={inputClass(Boolean(errors.lastName))}
              placeholder={isArabic ? 'أدخل الكنية' : 'Enter last name'}
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isArabic ? 'رقم الهاتف' : 'Phone'} <span className="text-red-600">*</span>
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handlePhoneInput}
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className={inputClass(Boolean(errors.phone))}
              placeholder="05xxxxxxxx"
              dir="ltr"
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          {/* Date & Time Picker Section */}
          <div className="md:col-span-2 space-y-4">

            {/* Mini Calendar */}
            <div className={`rounded-xl border p-4 ${errors.from || errors.to ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 madina-text-primary" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {isArabic ? `${AR_MONTHS[currentMonth]} ${currentYear}` : `${new Date(currentYear, currentMonth).toLocaleString('en', { month: 'long' })} ${currentYear}`}
                </span>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {(isArabic ? AR_DAYS : EN_DAYS).map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />
                  const val = dateValue(day)
                  const isPast = day < today
                  const isFromSelected = fromDate === val
                  const isToSelected = toDate === val
                  const isInRange = variant !== 'service' && fromDate && toDate && val > fromDate && val < toDate
                  const isSelected = variant === 'service' ? isFromSelected : (isFromSelected || isToSelected)

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        if (variant === 'service') {
                          // Single-date selection for services
                          setFromDate(val)
                          setToDate('')
                        } else {
                          // Range selection for room bookings (existing behavior)
                          // If no from date or clicking before from date, set as from
                          if (!fromDate || val < fromDate) {
                            setFromDate(val)
                            if (toDate && val >= toDate) setToDate('')
                          } else if (!toDate || val === fromDate) {
                            // If from is set but no to, set as to
                            if (val === fromDate) {
                              // Same day click: toggle off
                              setFromDate('')
                              setToDate('')
                            } else {
                              setToDate(val)
                            }
                          } else {
                            // Both set: restart selection
                            setFromDate(val)
                            setToDate('')
                          }
                        }
                      }}
                      className={`
                        relative w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                        ${isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                        ${isSelected ? 'text-white shadow-md' : ''}
                        ${isInRange ? 'bg-[var(--madina-primary)]/10 text-gray-800 dark:text-gray-200' : ''}
                        ${!isSelected && !isInRange && !isPast ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                      `}
                      style={isSelected ? { backgroundColor: 'var(--madina-primary)' } : undefined}
                    >
                      {day}
                      {isFromSelected && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white" />}
                      {isToSelected && variant !== 'service' && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white" />}
                    </button>
                  )
                })}
              </div>

              {/* Selection summary */}
              {variant === 'service' ? (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {isArabic ? 'تاريخ الجلسة: ' : 'Session date: '}
                    <strong className="text-gray-800 dark:text-white">
                      {fromDate ? new Date(fromDate + 'T00:00').toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }) : (isArabic ? 'لم يُحدد' : 'Not set')}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {isArabic ? 'الوصول: ' : 'Check-in: '}
                    <strong className="text-gray-800 dark:text-white">
                      {fromDate ? new Date(fromDate + 'T00:00').toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }) : (isArabic ? 'لم يُحدد' : 'Not set')}
                    </strong>
                  </span>
                  <span className="mx-2">←→</span>
                  <span>
                    {isArabic ? 'المغادرة: ' : 'Check-out: '}
                    <strong className="text-gray-800 dark:text-white">
                      {toDate ? new Date(toDate + 'T00:00').toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }) : (isArabic ? 'لم يُحدد' : 'Not set')}
                    </strong>
                  </span>
                </div>
              )}
              {errors.from && <p className="mt-1 text-xs text-red-600">{errors.from}</p>}
              {errors.to && !errors.from && <p className="mt-1 text-xs text-red-600">{errors.to}</p>}
            </div>

            {/* Time Picker - Check-in (only for service variant) */}
            {variant === 'service' && (
              <div className={`rounded-xl border p-4 ${errors.from ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 madina-text-primary" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {isArabic ? 'وقت بداية الجلسة' : 'Session start time'} <span className="text-red-600">*</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map(t => {
                    const selected = fromTime === t
                    return (
                      <button
                        key={`from-${t}`}
                        type="button"
                        onClick={() => setFromTime(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          selected
                            ? 'text-white border-transparent shadow-md'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        style={selected ? { backgroundColor: 'var(--madina-primary)' } : undefined}
                      >
                        {formatTime(t, isArabic)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Session Duration for services only */}
            {variant === 'service' && (
              <div className={`rounded-xl border p-4 ${errors.duration ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 madina-text-primary" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {isArabic ? 'مدة الجلسة' : 'Session duration'} <span className="text-red-600">*</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '30', labelAr: '30 دقيقة', labelEn: '30 min', mins: 30 },
                    { id: '45', labelAr: '45 دقيقة', labelEn: '45 min', mins: 45 },
                    { id: '60', labelAr: '1 ساعة', labelEn: '1 hr', mins: 60 },
                    { id: '120', labelAr: '2 ساعتين', labelEn: '2 hrs', mins: 120 },
                  ].map(opt => {
                    const selected = duration === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDuration(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          selected
                            ? 'text-white border-transparent shadow-md'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        style={selected ? { backgroundColor: 'var(--madina-primary)' } : undefined}
                      >
                        {isArabic ? opt.labelAr : opt.labelEn}
                      </button>
                    )
                  })}
                </div>
                {errors.duration && <p className="mt-1 text-xs text-red-600">{errors.duration}</p>}
              </div>
            )}
          </div>

          {/* Booking Type */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isArabic ? 'نوع الحجز' : 'Booking Type'} <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'مساج صيني', labelEn: 'Chinese Massage', labelAr: 'مساج صيني' },
                { value: 'مساج علاج', labelEn: 'Therapeutic Massage', labelAr: 'مساج علاج' },
                { value: 'غرفة', labelEn: 'Room', labelAr: 'غرفة' },
                { value: 'شقة', labelEn: 'Apartment', labelAr: 'شقة' },
                { value: 'جناح', labelEn: 'Suite', labelAr: 'جناح' }
              ].map(opt => {
                const selected = form.type === opt.value
                return (
                  <label key={opt.value} className={`cursor-pointer inline-flex items-center px-3 py-2 rounded-lg border text-sm select-none transition-colors ${selected ? 'border-transparent text-white' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'} ${selected ? 'madina-bg-primary hover:opacity-95' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <input
                      type="radio"
                      name="booking-type"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setForm(prev => ({ ...prev, type: opt.value as BookingType }))}
                      className="sr-only"
                    />
                    {isArabic ? opt.labelAr : opt.labelEn}
                  </label>
                )
              })}
            </div>

            {/* Message */}
            <div className="md:col-span-2 mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isArabic ? 'رسالة إضافية (اختياري)' : 'Message (optional)'}
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 border-gray-300 dark:border-gray-700 focus:ring-[var(--madina-primary)]"
                placeholder={isArabic ? 'اكتب أي ملاحظات أو طلبات خاصة هنا' : 'Write any notes or special requests here'}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm">
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-95 madina-bg-primary">
            {isArabic ? 'تأكيد الحجز' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Renders a service feature icon in the details popup, mirroring the card:
// themed lucide icon when the key is known, otherwise the chosen emoji,
// otherwise a masked SVG (legacy mock icons).
function ModalFeatureIcon({ feature }: { feature: BookingFeature }) {
  const Lucide = feature.lucideKey ? SERVICE_FEATURE_ICONS[feature.lucideKey] : undefined
  const color = 'var(--madina-identity-icon-color, var(--madina-primary))'
  if (Lucide) {
    return <Lucide className="w-4 h-4" style={{ color }} aria-hidden="true" />
  }
  // Only render `emoji` when it is an ACTUAL emoji (a non-ASCII glyph). Some
  // amenities store an icon *key* (e.g. "sea_view", "room_service") in this
  // field, which must never be printed as raw text in the chip.
  if (feature.emoji && /[^ -]/.test(feature.emoji)) {
    return (feature.emoji.codePointAt(0) ?? 0) > 127
      ? <span className="inline-flex w-4 h-4 items-center justify-center text-sm leading-none" aria-hidden="true">{feature.emoji}</span>
      : null
  }
  if (feature.iconUrl) {
    return (
      <div
        className="w-4 h-4"
        aria-hidden="true"
        style={{
          maskImage: `url(${feature.iconUrl})`,
          WebkitMaskImage: `url(${feature.iconUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          backgroundColor: color,
        }}
      />
    )
  }
  return null
}
