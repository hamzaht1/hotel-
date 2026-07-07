/**
 * قسم الخدمات والمرافق - قالب الرياض
 */
import roomImage from '@/assets/images/riyadh-template/rooms/room-1.png'
import React, { useState, useMemo } from 'react'
import BookingModal, { BookingData, BookingType } from '@/components/templates/BookingModal'
import BackgroundTitle from '@/components/templates/BackgroundTitle'
import { useTemplateT, useTemplateLanguage } from '@/hooks/useTemplateTranslations'
import { useMergedSiteTexts } from '@/hooks/use-tenant-preview-overrides'
import { pickSiteText } from '@/lib/site-texts'
import { useStorageUrl } from '@/lib/storage'
import { TemplateService } from '@/types/template-types'

// Import icons
import wifiIcon from '@/assets/images/riyadh-template/rooms/icons/wifi.svg'
import amenitiesIcon from '@/assets/images/riyadh-template/rooms/icons/amenities.svg'
import frameIcon from '@/assets/images/riyadh-template/rooms/icons/frame.svg'
import priceIcon from '@/assets/images/riyadh-template/rooms/icons/price.svg'

import leftLine from '@/assets/images/riyadh-template/rooms/left-line.svg'
import rightLine from '@/assets/images/riyadh-template/rooms/right-line.svg'

// Extend TemplateService with bilingual fields
interface BilingualService {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: string;
  currency: string;
  currencyEn: string;
  image?: string | null;
  features: {
    icon: string;
    labelAr: string;
    labelEn: string;
  }[];
}

interface BackendService {
  id: number;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  price: string | number;
  duration?: string | null;
  featured_image?: string | null;
  category?: { name_ar: string; name_en: string } | null;
}

interface ServicesSectionProps {
  services?: BackendService[];
}

export default function ServicesSection({ services: backendServices }: ServicesSectionProps = {}) {
  const t = useTemplateT()
  const { isArabic } = useTemplateLanguage()
  // Tenant-editable section texts (section=services) from the Site Branding
  // editor; falls back to the bundled translation.
  const siteTexts = useMergedSiteTexts()
  const storageUrl = useStorageUrl()
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<BookingType>('مساج صيني')

  // Mock bilingual services data — used as preview when no real services are configured.
  const mockServices = useMemo<BilingualService[]>(() => [
    {
      id: 1,
      name: "مساج صيني",
      nameEn: "Chinese Massage",
      description: "مساج فاخر يعيد لجسدك حيويته ويمنحك استرخاءً تاماً",
      descriptionEn: "Luxury massage that restores vitality to your body and gives you complete relaxation",
      price: "300",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          icon: amenitiesIcon, 
          labelAr: "3 مرافق", 
          labelEn: "3 Amenities" 
        },
        { 
          icon: wifiIcon, 
          labelAr: "ساعتين", 
          labelEn: "2 Hours" 
        }
      ],
    },
    {
      id: 2,
      name: "مساج علاجي",
      nameEn: "Therapeutic Massage",
      description: "مساج متخصص لتخفيف آلام العضلات وتحسين الدورة الدموية",
      descriptionEn: "Specialized massage to relieve muscle pain and improve blood circulation",
      price: "350",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          icon: amenitiesIcon, 
          labelAr: "4 مرافق", 
          labelEn: "4 Amenities" 
        },
        { 
          icon: wifiIcon, 
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
      price: "400",
      currency: "ريال",
      currencyEn: "SAR",
      features: [
        { 
          icon: amenitiesIcon, 
          labelAr: "5 مرافق", 
          labelEn: "5 Amenities" 
        },
        { 
          icon: wifiIcon, 
          labelAr: "ساعتين", 
          labelEn: "2 Hours" 
        }
      ],
    }
  ] as BilingualService[], [])

  const services = useMemo<(BilingualService & { name: string; description: string; currency: string })[]>(() => {
    const source: BilingualService[] = (Array.isArray(backendServices) && backendServices.length > 0)
      ? backendServices.map((s) => {
          const features: BilingualService['features'] = []
          if (s.duration) {
            features.push({ icon: wifiIcon, labelAr: s.duration, labelEn: s.duration })
          }
          if (s.category) {
            features.push({ icon: amenitiesIcon, labelAr: s.category.name_ar, labelEn: s.category.name_en })
          }
          return {
            id: s.id,
            name: s.name_ar,
            nameEn: s.name_en,
            description: s.description_ar ?? '',
            descriptionEn: s.description_en ?? '',
            price: String(s.price ?? ''),
            currency: 'ريال',
            currencyEn: 'SAR',
            image: storageUrl(s.featured_image),
            features,
          }
        })
      : mockServices

    return source.map((s) => ({
      ...s,
      name: isArabic ? s.name : s.nameEn,
      description: isArabic ? s.description : s.descriptionEn,
      currency: isArabic ? s.currency : s.currencyEn,
    }))
  }, [backendServices, mockServices, isArabic, storageUrl])

  const onBookClick = (type: BookingType) => {
    // In a real app, we would handle language-specific booking types here
    // For now, we're using the Arabic type since that's what's supported in BookingType
    setDefaultType(type)
    setModalOpen(true)
    
    // Example of how to handle bilingual booking types:
    // if (!isArabic) {
    //   // Map English types to Arabic types for the BookingModal
    //   const typeMap: Record<string, BookingType> = {
    //     'Chinese Massage': 'مساج صيني',
    //     'Therapeutic Massage': 'مساج علاج',
    //     'Hot Stone Massage': 'مساج صيني', // would need to add this to BookingType
    //   };
    //   setDefaultType(typeMap[type as string] || 'مساج صيني');
    // } else {
    //   setDefaultType(type);
    // }
  }

  const handleConfirm = (data: BookingData) => {
    console.log('تأكيد الحجز (خدمة):', data)
    setModalOpen(false)
  }

  return (
    <section data-preview-section="services" id="services" className="py-20 ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="relative text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={leftLine} alt="left line" className="h-6 w-auto hidden md:block line-icon" />
              <h2 className="relative z-10 text-4xl  font-bold riyadh-heading mb-4">
                {pickSiteText(siteTexts, 'services', 'title', t('sections.services.title', 'مساج فاخر يعيد لجسدك حيويته ويمنحك استرخاءً تاماً'), isArabic)}
              </h2>
            <img src={rightLine} alt="right line" className="h-6 w-auto hidden md:block line-icon" />
          </div>
          <BackgroundTitle text={pickSiteText(siteTexts, 'services', 'background_title', t('sections.services.background_title', 'المساج'), isArabic)} />
          <p className="relative z-10 text-xl riyadh-text-muted max-w-4xl mx-auto leading-relaxed">
            {pickSiteText(
              siteTexts,
              'services',
              'subtitle',
              t(
                'sections.services.subtitle',
                'نمنحك ما هو أبعد من الإقامة، نقدم تجربة استثنائية حيث يلتقي الترف بالضيافة الراقية. من الغرف الواسعة إلى المرافق الحديثة، صُمّم كل تفصيل ليمنحك الراحة والرفاهية التي تستحقها.'
              ),
              isArabic,
            )}
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border riyadh-border p-6 h-full flex flex-col">
              
              {/* Service image */}
              <div className="h-92 overflow-hidden rounded-xl mb-4 flex-shrink-0">
                <img
                  src={service.image ?? roomImage}
                  alt={service.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Features with icons - horizontal row */}
              <div className="flex justify-center gap-8 mb-4 flex-shrink-0">
                {service.features.map((feature, index) => {
                  const label = isArabic ? feature.labelAr : feature.labelEn;
                  return (
                    <div key={index} className="flex flex-col items-center text-center">
                      <img src={feature.icon} alt={label} className="w-6 h-6 mb-1 on-dark-white" />
                      <span className="text-xs riyadh-text-muted">{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t riyadh-border mb-4 flex-shrink-0"></div>

              {/* Title and price area with frame background */}
              <div 
                className="relative p-4 mb-4 rounded-lg flex-grow bg-transparent bg-blend-multiply dark:bg-[#050711]/40"
                style={{
                  backgroundImage: `url(${frameIcon})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="flex justify-between items-start h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 ">
                      {isArabic ? service.name : service.nameEn}
                    </h3>
                    <p className="riyadh-text-muted text-sm md:text-[16px] leading-relaxed">
                      {isArabic ? service.description : service.descriptionEn}
                    </p>
                  </div>
                  <div className="text-left mr-4">
                    <div className="flex items-center justify-end gap-2">
                      {isArabic ? (
                        <>
                          <span className="text-2xl font-bold ">{service.price}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-bold riyadh-heading">{service.price}</span>
                        </>
                      )}
                      <img src={priceIcon} alt="price" className="w-5 h-5 on-dark-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Book button */}
              <button 
                className="w-full text-white py-3 rounded-lg text-xl font-semibold transition-colors hover:opacity-90 flex-shrink-0 cursor-pointer riyadh-primary-bg"
                onClick={() => onBookClick(service.name as BookingType)}
              >
                {isArabic ? 'حجز الخدمة' : 'Book Service'}
              </button>

            </div>
          ))}
        </div>
        {modalOpen && (
          <BookingModal
            open={modalOpen}
            defaultType={defaultType}
            onClose={() => setModalOpen(false)}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </section>
  )
}