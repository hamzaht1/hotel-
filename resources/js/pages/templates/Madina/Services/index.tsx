/**
 * Services Section - Hotel Services Display
 * 
 * Features:
 * - Slider layout of service cards with images
 * - Bilingual support (Arabic/English)
 * - Booking modal integration
 * - Uses template's primary color from CSS variables
 * - Background title with customizable color
 * 
 * All images and icons imported from template's local images folder
 */
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { SERVICE_FEATURE_ICONS } from '@/lib/service-feature-icons'
import BookingModal, { BookingData, BookingType, BookingService } from '@/components/templates/BookingModal'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useStorageUrl } from '@/lib/storage'
import {
  useMergedSiteTexts,
  useTenantSiteSettings,
} from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'

// Import images from template folder
import roomImage from '../images/massage-room/room-1.png'
import backgroundImage from './background.png'
import amenitiesIcon from '../images/rooms/icons/amenities.svg'
import clockIcon from '../images/massage-room/icons/clock.svg'
import priceIcon from '../images/rooms/icons/price.svg'
import leftLine from '../images/rooms/white-left-icon.svg'
import rightLine from '../images/rooms/white-right-icon.svg'
import leftArrow from '../images/left-arrow.png'
import rightArrow from '../images/right-arrow.png'

// Shared icon catalogue (same source the admin wizard picks from), so a saved
// feature key renders the exact icon the tenant chose. Custom features with an
// unknown key fall back to their stored icon key, then to the emoji.
const FEATURE_ICON_MAP = SERVICE_FEATURE_ICONS

// A feature as rendered on a card: it may resolve to a lucide icon (via
// lucideKey), an emoji, or a legacy masked SVG url (mock duration/category).
interface CardFeature {
  lucideKey?: string;
  emoji?: string | null;
  iconUrl?: string;
  labelAr: string;
  labelEn: string;
}

// Extend TemplateService with bilingual fields
interface BilingualService {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  price: string;
  currency: string;
  currencyEn: string;
  image?: string | null;
  images?: string[];
  features: CardFeature[];
  foodServingMethod?: string | null;
  buffetStart?: string | null;
  buffetEnd?: string | null;
}

interface BackendService {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  short_description_ar?: string | null;
  short_description_en?: string | null;
  price: string | number;
  duration?: string | null;
  featured_image?: string | null;
  category?: { name_ar: string; name_en: string } | null;
  features?: { key: string; label_ar: string; label_en: string; icon?: string | null }[];
  images?: { image_path: string }[];
  food_serving_method?: string | null;
  buffet_start_time?: string | null;
  buffet_end_time?: string | null;
}

// Renders a card feature icon: themed lucide icon when the key is known,
// otherwise the chosen emoji, otherwise a masked SVG (legacy mock icons).
function CardFeatureIcon({ feature, className = 'w-4 h-4' }: { feature: CardFeature; className?: string }) {
  const Lucide = feature.lucideKey ? FEATURE_ICON_MAP[feature.lucideKey] : undefined
  const iconColor = 'var(--madina-identity-icon-color, var(--madina-primary))'

  if (Lucide) {
    return <Lucide className={className} style={{ color: iconColor }} aria-hidden="true" />
  }
  if (feature.emoji) {
    return <span className={`${className} inline-flex items-center justify-center text-sm leading-none`} aria-hidden="true">{feature.emoji}</span>
  }
  if (feature.iconUrl) {
    return (
      <div
        className={className}
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
          backgroundColor: iconColor,
        }}
      />
    )
  }
  return null
}

interface ServicesSectionProps {
  services?: BackendService[];
}

export default function ServicesSection({ services: backendServices }: ServicesSectionProps = {}) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  const storageUrl = useStorageUrl()
  // Tenant-editable mock-item overrides: image + title + description per slot.
  // Real backend services (when configured) win over these mocks.
  const liveSettings = useTenantSiteSettings()
  const siteTexts = useMergedSiteTexts()
  const resolveOverride = (raw: string | null | undefined): string | null =>
    raw && typeof raw === 'string' && raw.startsWith('data:') ? raw : storageUrl(raw) ?? null
  const mockImageFor = (slot: number): string | null => {
    const key = `services_item_${slot}_image`
    const raw = (liveSettings?.media as Record<string, string | null | undefined> | undefined)?.[key]
    return resolveOverride(raw)
  }
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<BookingType>('مساج صيني')
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const swiperRef = useRef<SwiperType | null>(null)
  const [cardStyle, setCardStyle] = useState<'default' | 'simple'>('default')

  // Load service card style from localStorage
  useEffect(() => {
    const savedStyle = localStorage.getItem('madina-service-card-style')
    if (savedStyle) {
      if (savedStyle === 'simple') {
        setCardStyle('simple')
      } else {
        setCardStyle('default')
      }
    }
    
    // Listen for custom event from ThemeSwitcher
    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'default' | 'simple'; id: string }>
      if (customEvent.detail && customEvent.detail.type) {
        setCardStyle(customEvent.detail.type)
      }
    }
    
    window.addEventListener('madina-service-card-style-changed', handleStyleChange)
    
    return () => {
      window.removeEventListener('madina-service-card-style-changed', handleStyleChange)
    }
  }, [])
  
  // Bilingual services data - 6 services for pagination
  const bilingualServicesData: BilingualService[] = [
    {
      id: 1,
      name: "مساج صيني",
      nameEn: "Chinese Massage",
      description: "مساج فاخر يعيد لجسدك حيويته ويمنحك استرخاءً تاماً",
      descriptionEn: "Luxury massage that restores vitality to your body and gives you complete relaxation",
      price: "1200",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          iconUrl: amenitiesIcon,
          labelAr: "3 مرافق", 
          labelEn: "3 Amenities" 
        },
        { 
          iconUrl: clockIcon,
          labelAr: "4 ساعات", 
          labelEn: "4 Hours" 
        }
      ],
    },
    {
      id: 2,
      name: "مساج علاجي",
      nameEn: "Therapeutic Massage",
      description: "مساج متخصص لتخفيف آلام العضلات وتحسين الدورة الدموية",
      descriptionEn: "Specialized massage to relieve muscle pain and improve blood circulation",
      price: "1500",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          iconUrl: amenitiesIcon,
          labelAr: "4 مرافق", 
          labelEn: "4 Amenities" 
        },
        { 
          iconUrl: clockIcon,
          labelAr: "ساعة ونصف", 
          labelEn: "1.5 Hours" 
        }
      ],
    },
    {
      id: 3,
      name: "مساج الحجارة الساخنة",
      nameEn: "Hot Stone Massage",
      description: "تجربة استرخاء فريدة باستخدام الحجارة البركانية الساخنة",
      descriptionEn: "A unique relaxation experience using hot volcanic stones",
      price: "1800",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          iconUrl: amenitiesIcon,
          labelAr: "5 مرافق", 
          labelEn: "5 Amenities" 
        },
        { 
          iconUrl: clockIcon,
          labelAr: "ساعتين", 
          labelEn: "2 Hours" 
        }
      ],
    },
    {
      id: 4,
      name: "مساج تايلندي",
      nameEn: "Thai Massage",
      description: "مساج تقليدي تايلندي يجمع بين اليوغا والضغط",
      descriptionEn: "Traditional Thai massage combining yoga and pressure",
      price: "2000",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          iconUrl: amenitiesIcon,
          labelAr: "4 مرافق", 
          labelEn: "4 Amenities" 
        },
        { 
          iconUrl: clockIcon,
          labelAr: "ساعتين ونصف", 
          labelEn: "2.5 Hours" 
        }
      ],
    },
    {
      id: 5,
      name: "مساج عطري",
      nameEn: "Aromatherapy Massage",
      description: "مساج بالزيوت العطرية لاسترخاء عميق وتجديد الطاقة",
      descriptionEn: "Aromatherapy massage with essential oils for deep relaxation and energy renewal",
      price: "1600",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          iconUrl: amenitiesIcon,
          labelAr: "3 مرافق", 
          labelEn: "3 Amenities" 
        },
        { 
          iconUrl: clockIcon,
          labelAr: "ساعة ونصف", 
          labelEn: "1.5 Hours" 
        }
      ],
    },
    {
      id: 6,
      name: "مساج رياضي",
      nameEn: "Sports Massage",
      description: "مساج متخصص للرياضيين لتخفيف التوتر وتحسين الأداء",
      descriptionEn: "Specialized massage for athletes to relieve tension and improve performance",
      price: "1400",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          iconUrl: amenitiesIcon,
          labelAr: "5 مرافق", 
          labelEn: "5 Amenities" 
        },
        { 
          iconUrl: clockIcon,
          labelAr: "ساعتين", 
          labelEn: "2 Hours" 
        }
      ],
    }
  ]
  
  // Apply tenant-editable overrides (image + title + description) to each mock
  // service item before it's consumed downstream. Falls back to the bundled
  // mock value when nothing is set in site_texts / media.
  const tenantOverriddenMock = useMemo<BilingualService[]>(() => {
    return bilingualServicesData.map((service, idx) => {
      const slot = idx + 1
      const titleAr = pickSiteText(siteTexts, 'services', `item_${slot}_title`, service.name, true)
      const titleEn = pickSiteText(siteTexts, 'services', `item_${slot}_title`, service.nameEn, false)
      const descAr = pickSiteText(siteTexts, 'services', `item_${slot}_description`, service.description, true)
      const descEn = pickSiteText(siteTexts, 'services', `item_${slot}_description`, service.descriptionEn, false)
      const imageOverride = mockImageFor(slot)
      return {
        ...service,
        name: titleAr,
        nameEn: titleEn,
        description: descAr,
        descriptionEn: descEn,
        image: imageOverride ?? service.image,
      }
    })
  }, [siteTexts, liveSettings])

  // On the live tenant site the `services` prop is always provided (possibly an
  // empty array): show ONLY admin-entered services, never mock placeholders.
  // The mock data is reserved for the design preview, where the prop is absent.
  const sourceData = useMemo<BilingualService[]>(() => {
    if (Array.isArray(backendServices)) {
      return backendServices.map((s) => {
        const features: CardFeature[] = []
        if (s.duration) {
          features.push({ iconUrl: clockIcon, labelAr: s.duration, labelEn: s.duration })
        }
        for (const f of s.features ?? []) {
          // Resolve a themed icon from the feature key first, then from the
          // stored icon value (custom features save an icon key); the emoji
          // stays as a fallback for legacy rows.
          const lucideKey = FEATURE_ICON_MAP[f.key] ? f.key : (f.icon && FEATURE_ICON_MAP[f.icon] ? f.icon : undefined)
          features.push({ lucideKey, emoji: f.icon, labelAr: f.label_ar, labelEn: f.label_en })
        }
        const featured = storageUrl(s.featured_image)
        const gallery = (s.images ?? []).map((img) => storageUrl(img.image_path)).filter(Boolean) as string[]
        const allImages = [featured, ...gallery].filter(Boolean) as string[]
        return {
          id: s.id,
          name: s.name_ar,
          nameEn: s.name_en,
          description: s.description_ar ?? '',
          descriptionEn: s.description_en ?? '',
          shortDescription: s.short_description_ar ?? '',
          shortDescriptionEn: s.short_description_en ?? '',
          price: String(s.price ?? ''),
          currency: 'ريال',
          currencyEn: 'SAR',
          image: featured,
          images: allImages,
          features,
          foodServingMethod: s.food_serving_method ?? null,
          buffetStart: s.buffet_start_time ?? null,
          buffetEnd: s.buffet_end_time ?? null,
        }
      })
    }
    return tenantOverriddenMock
  }, [backendServices, storageUrl, tenantOverriddenMock])

  // Convert to current language
  const services = useMemo(() => {
    return sourceData.map(service => ({
      id: service.id,
      name: isArabic ? service.name : service.nameEn,
      nameEn: service.nameEn,
      description: isArabic ? service.description : service.descriptionEn,
      descriptionEn: service.descriptionEn,
      shortDescription: isArabic ? service.shortDescription : service.shortDescriptionEn,
      price: service.price,
      currency: isArabic ? service.currency : service.currencyEn,
      currencyEn: service.currencyEn,
      image: service.image ?? null,
      images: service.images ?? [],
      features: service.features,
      foodServingMethod: service.foodServingMethod ?? null,
      buffetStart: service.buffetStart ?? null,
      buffetEnd: service.buffetEnd ?? null,
    }));
  }, [isArabic, sourceData])

  useEffect(() => {
    if (swiperRef.current) {
      // @ts-expect-error - dynamic runtime assignment
      swiperRef.current.params.navigation.prevEl = '.services-prev'
      // @ts-expect-error - dynamic runtime assignment
      swiperRef.current.params.navigation.nextEl = '.services-next'
      swiperRef.current.navigation.destroy()
      swiperRef.current.navigation.init()
      swiperRef.current.navigation.update()
    }
  }, [isArabic])

  const handleConfirm = (data: BookingData) => {
    // Handle booking confirmation
    setModalOpen(false)
  }

  // Live site with no admin-entered services → render nothing (no mock cards).
  if (Array.isArray(backendServices) && services.length === 0) {
    return null
  }

  return (
    <section
      data-preview-section="services"
      id="services"
      className="py-20 relative"
      style={{
        backgroundColor: 'var(--madina-primary)',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat'
      }}
    >
      {/* SVG at top of section */}
      <div className="absolute top-0 left-0 right-0 w-full" style={{ height: '139px', zIndex: 1 }}>
        <svg 
          viewBox="0 0 1743 139" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="madina-services-top-wave w-full h-full"
          aria-hidden="true"
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <path 
            d="M0 0H1742.2V131.633L1623.86 128.98L1552.84 135.51L1465.47 131.633L1349.88 137.959L1238.84 131.633L1160.56 128.571L1105.92 131.633L1037.68 135.102L895.675 132.449L851.971 126.735L693.619 133.878L599.861 125.551L513.394 135.592L415.663 129.061L387.77 135.061L340.42 131.633L263.988 123.714L152.945 138.776L90.1123 131.633H0V0Z" 
            style={{ fill: 'var(--madina-background-color, #f5f5f5)' }}
            className="dark:fill-[#0F172A]"
          />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 relative z-10" style={{ paddingTop: '139px' }}>
        {/* Title */}
        <div className="relative text-center mb-16">
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
                backgroundColor: 'var(--madina-primary-light)'
              }}
            />
            <h2 className="madina-font-heading text-white relative z-10 text-4xl font-bold mb-4">
              {pickSiteText(siteTexts, 'services', 'title', t('sections.services.title', 'مساج فاخر يعيد لجسدك حيويته ويمنحك استرخاءً تاماً'), isArabic)}
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
                backgroundColor: 'var(--madina-primary-light)'
              }}
            />
          </div>
          <BackgroundTitle
            text={pickSiteText(siteTexts, 'services', 'background_title', t('sections.services.background_title', 'المساج'), isArabic)}
            colorClass=""
            colorStyle={{ color: 'white', opacity: 0.4 }}
          />
          <p className="relative z-10 text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
            {pickSiteText(
              siteTexts,
              'services',
              'subtitle',
              t('sections.services.subtitle', 'نمنحك ما هو أبعد من الإقامة، نقدم تجربة استثنائية حيث يلتقي الترف بالضيافة الراقية. من الغرف الواسعة إلى المرافق الحديثة، صُمّم كل تفصيل ليمنحك الراحة والرفاهية التي تستحقها.'),
              isArabic,
            )}
          </p>
        </div>

        {/* Services Slider */}
        <div className="relative flex items-stretch gap-4 md:gap-6">
          {/* Previous button */}
          <button
            className="services-prev flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
            aria-label="Previous services"
          >
            <div 
              className="w-10 h-10 ltr:hidden"
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
                backgroundColor: 'white',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
            <div 
              className="w-10 h-10 rtl:hidden"
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
                backgroundColor: 'white',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
          </button>

          {/* Swiper Container */}
          <div className="flex-1 min-w-0">
            <Swiper
              key={`services-swiper-${cardStyle}`}
              onSwiper={(swiper) => {
                swiperRef.current = swiper
              }}
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              navigation={{
                prevEl: '.services-prev',
                nextEl: '.services-next',
              }}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              dir={isArabic ? 'rtl' : 'ltr'}
              className="services-swiper"
              style={{
                '--swiper-slide-height': 'auto'
              } as React.CSSProperties}
            >
              {services.map((service) => (
                <SwiperSlide key={service.id}>
                  {cardStyle === 'simple' ? (
                    /* Simple style */
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-200 dark:border-gray-700">
                      {/* Image */}
                      <div className="relative h-48 flex-shrink-0 overflow-hidden">
                        <img
                          src={service.image ?? roomImage}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Card content */}
                      <div className="p-6 flex flex-col flex-1 min-h-0">
                        {/* Name */}
                        <h3 className="madina-font-heading madina-text-primary text-xl font-bold mb-3">
                          {service.name}
                        </h3>

                        {/* Icons */}
                        <div className="flex items-center gap-4 mb-4 flex-wrap md:flex-nowrap">
                          {service.features.slice(0, 3).map((feature, index) => {
                            const label = isArabic ? feature.labelAr : feature.labelEn;
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <CardFeatureIcon feature={feature} className="w-4 h-4" />
                                <span className="text-sm madina-text-body">{label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Price with icon - fixed at bottom */}
                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-5 h-5"
                              aria-label="price"
                              style={{
                                maskImage: `url(${priceIcon})`,
                                WebkitMaskImage: `url(${priceIcon})`,
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskPosition: 'center',
                                backgroundColor: 'var(--madina-identity-icon-color, var(--madina-primary))'
                              }}
                            />
                            <span className="madina-text-primary text-xl font-bold">
                              {service.price} {isArabic ? service.currency : service.currencyEn}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="madina-btn madina-btn-outline text-sm px-3 py-1"
                            onClick={(e) => {
                              e.preventDefault()
                              setDefaultType(service.name as any)
                              setSelectedService({
                                name: service.name,
                                shortDescription: service.shortDescription,
                                description: service.description,
                                image: service.image,
                                images: service.images,
                                features: service.features,
                                price: String(service.price),
                                currency: service.currency,
                                foodServingMethod: service.foodServingMethod,
                                buffetStart: service.buffetStart,
                                buffetEnd: service.buffetEnd,
                              })
                              setModalOpen(true)
                            }}
                          >
                            {isArabic ? 'التفاصيل' : 'Details'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Default style */
                    <div className="bg-transparent rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                      
                      {/* Inverted arc at top with image */}
                      <div className="relative h-64 flex-shrink-0 overflow-hidden">
                        {/* Image inside arc - flat bottom */}
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                            borderRadius: '50% 50% 0 0',
                            zIndex: 1,
                            border: '4px solid white',
                            borderBottom: 'none'
                          }}
                        >
                          <img
                            src={service.image ?? roomImage}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Card content */}
                      <div
                        className="p-6 rounded-b-2xl -mt-1 flex flex-col flex-1 min-h-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.6)',
                          border: '4px solid white',
                          borderTop: 'none'
                        }}
                      >
                        {/* Icons - transparent background with curve */}
                        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap md:flex-nowrap">
                          {service.features.slice(0, 3).map((feature, index) => {
                            const label = isArabic ? feature.labelAr : feature.labelEn;
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                }}
                              >
                                <CardFeatureIcon feature={feature} className="w-4 h-4" />
                                <span className="text-xs text-gray-800 font-medium">{label}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Name */}
                        <div 
                          className="flex items-center justify-center mb-4 px-3 py-1 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          <h3 className="madina-font-heading text-base font-bold text-gray-800">
                            {service.name}
                          </h3>
                        </div>

                        {/* Price with icon - fixed at bottom */}
                        <div className="flex items-center justify-between mb-4 mt-auto">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-5 h-5"
                              aria-label="price"
                              style={{
                                maskImage: `url(${priceIcon})`,
                                WebkitMaskImage: `url(${priceIcon})`,
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                maskPosition: 'center',
                                WebkitMaskPosition: 'center',
                                backgroundColor: 'var(--madina-identity-icon-color, var(--madina-primary))'
                              }}
                            />
                            <span className="madina-text-primary text-xl font-bold">
                              {service.price}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="madina-btn madina-btn-outline text-sm px-3 py-1"
                            onClick={(e) => {
                              e.preventDefault()
                              setDefaultType(service.name as any)
                              setSelectedService({
                                name: service.name,
                                shortDescription: service.shortDescription,
                                description: service.description,
                                image: service.image,
                                images: service.images,
                                features: service.features,
                                price: String(service.price),
                                currency: service.currency,
                                foodServingMethod: service.foodServingMethod,
                                buffetStart: service.buffetStart,
                                buffetEnd: service.buffetEnd,
                              })
                              setModalOpen(true)
                            }}
                          >
                            {isArabic ? 'التفاصيل' : 'Details'}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Next button */}
          <button
            className="services-next flex-shrink-0 self-center transition-all duration-300 cursor-pointer hover:scale-110 z-10"
            aria-label="Next services"
          >
            <div 
              className="w-10 h-10 ltr:hidden"
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
                backgroundColor: 'white',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
            <div 
              className="w-10 h-10 rtl:hidden"
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
                backgroundColor: 'white',
                opacity: 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            />
          </button>
        </div>
        {modalOpen && (
          <BookingModal
            open={modalOpen}
            defaultType={defaultType}
            service={selectedService}
            onClose={() => setModalOpen(false)}
            onConfirm={handleConfirm}
            variant="service"
          />
        )}
      </div>
    </section>
  )
}
