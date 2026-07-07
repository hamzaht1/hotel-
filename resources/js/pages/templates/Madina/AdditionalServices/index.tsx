/**
 * Additional Services Section
 *
 * Features:
 * - Section with title and icons on both sides
 * - Description text
 * - Slider with multiple services (image + text)
 * - Image with custom border radius (30% on one side, slight curves on other)
 * - Bilingual support (Arabic/English)
 * - Uses template's CSS variables
 * - Navigation arrows for slider
 * 
 * All images imported from template's local images folder
 */
import React, { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import {
  useMergedSiteTexts,
  useTenantSiteSettings,
} from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'
import { useStorageUrl } from '@/lib/storage'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

// Import images and icons from template folder
import serviceImage1 from '../images/massage-room/room-1.png'
import serviceImage2 from '../images/rooms/room-1.png'
import serviceImage3 from '../images/massage-room/room-1.png'
import leftLine from '../images/rooms/left-line.svg'
import rightLine from '../images/rooms/right-line.svg'
import leftArrow from '../images/left-arrow.png'
import rightArrow from '../images/right-arrow.png'

// Bilingual service interface
interface BilingualService {
  id: number
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  image: string
}

export default function AdditionalServicesSection() {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const storageUrl = useStorageUrl()
  // Live-preview hooks: pull both the tenant-uploaded images (media.*) and the
  // editable site_texts (additional_services.* section) so the editor can drive
  // titles, descriptions and per-item images in real time.
  const liveSettings = useTenantSiteSettings()
  const siteTexts = useMergedSiteTexts()
  const resolveOverride = (raw: string | null | undefined): string | null =>
    raw && typeof raw === 'string' && raw.startsWith('data:') ? raw : storageUrl(raw) ?? null
  const overrideImageFor = (slot: 1 | 2 | 3 | 4): string | null => {
    const key = `additional_service_${slot}_image` as const
    const raw = (liveSettings?.media as Record<string, string | null | undefined> | undefined)?.[key]
    return resolveOverride(raw)
  }
  const swiperRef = useRef<SwiperType | null>(null)
  const [servicesStyle, setServicesStyle] = useState<'slider' | 'grid'>('slider')

  // Load services style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-additional-services-style')
    if (savedStyle) {
      if (savedStyle === 'grid') {
        setServicesStyle('grid')
      } else {
        setServicesStyle('slider')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'slider' | 'grid'; id: string }>
      if (customEvent.detail && customEvent.detail.type) {
        setServicesStyle(customEvent.detail.type)
      }
    }
    
    window.addEventListener('madina-additional-services-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-additional-services-style-changed', handleStyleChange)
    }
  }, [])

  // Bilingual services data
  const bilingualServicesData: BilingualService[] = [
    {
      id: 1,
      titleAr: 'خدمات متميزة',
      titleEn: 'Distinguished Services',
      descriptionAr: 'نوفر لكم مجموعة شاملة من الخدمات الإضافية التي تلبي جميع احتياجاتكم وتجعل إقامتكم معنا تجربة لا تُنسى. من خدمات التنظيف اليومية إلى خدمات الاستقبال والضيافة، نحن هنا لخدمتكم على مدار الساعة.',
      descriptionEn: 'We provide you with a comprehensive range of additional services that meet all your needs and make your stay with us an unforgettable experience. From daily cleaning services to reception and hospitality services, we are here to serve you around the clock.',
      image: serviceImage1
    },
    {
      id: 2,
      titleAr: 'خدمات النقل',
      titleEn: 'Transportation Services',
      descriptionAr: 'نوفر خدمات نقل مريحة وآمنة من وإلى المطار، بالإضافة إلى خدمات النقل الداخلي داخل المدينة. سيارات فاخرة مع سائقين محترفين لضمان راحتكم وأمانكم.',
      descriptionEn: 'We provide comfortable and safe transportation services to and from the airport, in addition to internal transportation services within the city. Luxury cars with professional drivers to ensure your comfort and safety.',
      image: serviceImage2
    },
    {
      id: 3,
      titleAr: 'خدمات الطعام والشراب',
      titleEn: 'Food & Beverage Services',
      descriptionAr: 'استمتع بمجموعة متنوعة من الخيارات الغذائية المميزة. من المطاعم الفاخرة إلى خدمة الغرف على مدار الساعة، نقدم لكم تجربة طعام لا تُنسى.',
      descriptionEn: 'Enjoy a variety of distinguished food options. From fine dining restaurants to 24-hour room service, we offer you an unforgettable dining experience.',
      image: serviceImage3
    },
    {
      id: 4,
      titleAr: 'خدمات الترفيه',
      titleEn: 'Entertainment Services',
      descriptionAr: 'نوفر لكم مجموعة واسعة من أنشطة الترفيه والاستجمام. من الصالات الرياضية إلى المسابح والمنتجعات الصحية، كل ما تحتاجونه للاسترخاء والاستمتاع.',
      descriptionEn: 'We provide you with a wide range of entertainment and recreation activities. From gyms to pools and spas, everything you need to relax and enjoy.',
      image: serviceImage1
    }
  ]

  // Map each hardcoded service to its tenant-editable overrides. Title and
  // description fall back to the bundled defaults; image falls back to the
  // bundled asset only when no tenant upload exists.
  const services = bilingualServicesData.map((service) => {
    const slot = service.id as 1 | 2 | 3 | 4
    const baseTitle = isArabic ? service.titleAr : service.titleEn
    const baseDescription = isArabic ? service.descriptionAr : service.descriptionEn
    return {
      id: service.id,
      title: pickSiteText(siteTexts, 'additional_services', `service_${slot}_title`, baseTitle, isArabic),
      description: pickSiteText(siteTexts, 'additional_services', `service_${slot}_description`, baseDescription, isArabic),
      image: overrideImageFor(slot) || service.image,
    }
  })

  return (
    <section
      data-preview-section="additional_services"
      id="additional-services"
      className="py-20 relative"
      style={{
        paddingTop: '5rem',
        paddingBottom: '5rem'
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        {/* Section title with icons */}
        <div className="relative text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="left line"
              style={{
                maskImage: `url(${isArabic ? leftLine : rightLine})`,
                WebkitMaskImage: `url(${isArabic ? leftLine : rightLine})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: 'var(--madina-primary)'
              }}
            />
            <h2 className="madina-font-heading madina-text-primary relative z-10 text-4xl font-bold mb-4">
              {pickSiteText(siteTexts, 'additional_services', 'title', t('sections.additional_services.title', 'الخدمات الأخرى'), isArabic)}
            </h2>
            <div 
              className="h-6 w-6 hidden md:block"
              aria-label="right line"
              style={{
                maskImage: `url(${isArabic ? rightLine : leftLine})`,
                WebkitMaskImage: `url(${isArabic ? rightLine : leftLine})`,
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
            text={t('sections.additional_services.background_title', 'الخدمات')} 
            colorClass="dark:text-[rgba(237,237,237,0.2)]"
            colorStyle={{ color: 'var(--madina-primary)', opacity: 0.1 }}
          />
          <p className="relative z-10 text-lg max-w-3xl mx-auto leading-relaxed madina-text-body">
            {pickSiteText(
              siteTexts,
              'additional_services',
              'description',
              t('sections.additional_services.description', 'نقدم لكم مجموعة متنوعة من الخدمات الإضافية التي تجعل إقامتكم أكثر راحة وتميزاً'),
              isArabic,
            )}
          </p>
        </div>

        {servicesStyle === 'slider' ? (
          /* Slider same layout as testimonials: buttons aligned with slider */
          <div className="relative flex items-stretch gap-4 md:gap-6 mt-12 mb-6">
            {/* Previous button - before slider */}
            <button
              className="additional-services-prev flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
              aria-label="Previous service"
            >
              <div
                className="w-10 h-10 ltr:hidden madina-section-nav-arrow"
                aria-label="Previous"
                style={{
                  maskImage: `url(${leftArrow})`,
                  WebkitMaskImage: `url(${leftArrow})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                  backgroundColor: 'var(--madina-primary)',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
              />
              <div
                className="w-10 h-10 rtl:hidden madina-section-nav-arrow"
                aria-label="Previous"
                style={{
                  maskImage: `url(${rightArrow})`,
                  WebkitMaskImage: `url(${rightArrow})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                  backgroundColor: 'var(--madina-primary)',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
              />
            </button>

            {/* Swiper container - height adapts to content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <Swiper
                key={`additional-services-slider-${servicesStyle}`}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper
                }}
                modules={[Navigation, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                autoHeight
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                navigation={{
                  prevEl: '.additional-services-prev',
                  nextEl: '.additional-services-next',
                }}
                dir={isArabic ? 'rtl' : 'ltr'}
                className="additional-services-swiper"
                style={{
                  overflow: 'hidden'
                }}
              >
                {services.map((service) => (
                  <SwiperSlide key={service.id} className="!h-auto">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-2 w-full max-w-5xl mx-auto">
                      {/* Image element */}
                      <div className="w-full lg:w-2/5 flex-shrink-0">
                        <div 
                          className="relative overflow-hidden"
                          style={{
                            aspectRatio: '16/9', // Width larger than height
                            width: '100%',
                            borderRadius: isArabic 
                              ? '8px 50% 50% 8px' // Right side 50%, left side 8px curves
                              : '50% 8px 8px 50%', // Left side 50%, right side 8px curves
                          }}
                        >
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Text element - full visibility in box */}
                      <div className="w-full lg:w-3/5 flex-shrink-0 px-4 sm:px-6 lg:px-8 py-2">
                        <div className="rounded-xl p-5 sm:p-6 min-h-0 overflow-visible">
                          <h3 className="madina-font-heading madina-text-primary text-3xl font-bold mb-4">
                            {service.title}
                          </h3>
                          <p className="madina-font madina-text-body text-lg leading-relaxed whitespace-normal break-words">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Next button - after slider */}
            <button
              className="additional-services-next flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
              aria-label="Next service"
            >
              <div
                className="w-10 h-10 ltr:hidden madina-section-nav-arrow"
                aria-label="Next"
                style={{
                  maskImage: `url(${rightArrow})`,
                  WebkitMaskImage: `url(${rightArrow})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                  backgroundColor: 'var(--madina-primary)',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
              />
              <div
                className="w-10 h-10 rtl:hidden madina-section-nav-arrow"
                aria-label="Next"
                style={{
                  maskImage: `url(${leftArrow})`,
                  WebkitMaskImage: `url(${leftArrow})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                  backgroundColor: 'var(--madina-primary)',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
              />
            </button>
          </div>
        ) : (
          /* Grid Container */
          <div className="mt-12 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {services.map((service) => (
                <div 
                  key={service.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <div 
                      className="w-full"
                      style={{
                        aspectRatio: '16/9',
                        borderRadius: '12px 12px 0 0',
                      }}
                    >
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="madina-font-heading madina-text-primary text-2xl font-bold mb-3">
                      {service.title}
                    </h3>
                    <p className="madina-font madina-text-body text-base leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
